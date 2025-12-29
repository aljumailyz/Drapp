import type { Database } from 'better-sqlite3'
import { randomUUID } from 'node:crypto'
import { existsSync, watch, type FSWatcher } from 'node:fs'
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { QueueManager } from '../queue'
import { Logger } from '../utils/logger'
import { getAppDataPath, getDownloadPath } from '../utils/paths'
import { getSetting } from '../utils/settings'

type WatchFolderConfig = {
  enabled: boolean
  path: string | null
}

type StateFile = {
  files: Record<string, number>
}

const STATE_FILE = 'watch-folder-state.json'
const DEFAULT_EXTENSIONS = new Set(['.txt', '.list', '.urls'])

export class WatchFolderService {
  private readonly logger = new Logger('WatchFolderService')
  private watcher: FSWatcher | null = null
  private config: WatchFolderConfig = { enabled: false, path: null }
  private queue: QueueManager
  private fileState = new Map<string, number>()
  private pending = new Map<string, NodeJS.Timeout>()

  constructor(private readonly db: Database) {
    this.queue = new QueueManager(db)
  }

  async startFromSettings(): Promise<void> {
    const enabled = getSetting(this.db, 'watch_folder_enabled')
    const path = getSetting(this.db, 'watch_folder_path')
    const next = {
      enabled: enabled === '1' || enabled?.toLowerCase() === 'true',
      path: path && path.trim() ? path : null
    }
    await this.configure(next)
  }

  async configure(config: Partial<WatchFolderConfig>): Promise<void> {
    const next: WatchFolderConfig = {
      enabled: config.enabled ?? this.config.enabled,
      path: config.path ?? this.config.path
    }
    const changed = next.enabled !== this.config.enabled || next.path !== this.config.path
    this.config = next

    if (!changed) {
      return
    }

    await this.stop()
    if (this.config.enabled && this.config.path) {
      await this.start()
    }
  }

  async start(): Promise<void> {
    if (!this.config.enabled || !this.config.path) {
      return
    }

    await this.loadState()
    await this.scanFolder()

    if (this.watcher) {
      return
    }

    try {
      this.watcher = watch(this.config.path, (_event, filename) => {
        if (!filename) {
          return
        }
        const fullPath = join(this.config.path ?? '', filename.toString())
        this.queueProcess(fullPath)
      })
      this.logger.info('watch folder started', { path: this.config.path })
    } catch (error) {
      this.logger.warn('failed to start watcher', { error })
    }
  }

  async stop(): Promise<void> {
    if (this.watcher) {
      this.watcher.close()
      this.watcher = null
    }
    for (const timeout of this.pending.values()) {
      clearTimeout(timeout)
    }
    this.pending.clear()
  }

  async scanNow(): Promise<void> {
    if (!this.config.enabled || !this.config.path) {
      return
    }
    await this.scanFolder()
  }

  private queueProcess(filePath: string): void {
    if (this.pending.has(filePath)) {
      return
    }
    const timer = setTimeout(() => {
      this.pending.delete(filePath)
      void this.processFile(filePath)
    }, 500)
    this.pending.set(filePath, timer)
  }

  private async scanFolder(): Promise<void> {
    if (!this.config.path) {
      return
    }
    try {
      const entries = await readdir(this.config.path)
      for (const entry of entries) {
        this.queueProcess(join(this.config.path, entry))
      }
    } catch (error) {
      this.logger.warn('failed to scan watch folder', { error })
    }
  }

  private async processFile(filePath: string): Promise<void> {
    const ext = extname(filePath).toLowerCase()
    if (!DEFAULT_EXTENSIONS.has(ext)) {
      return
    }

    let info
    try {
      info = await stat(filePath)
    } catch {
      return
    }
    if (!info.isFile()) {
      return
    }

    const lastProcessed = this.fileState.get(filePath) ?? 0
    if (info.mtimeMs <= lastProcessed) {
      return
    }

    let content = ''
    try {
      content = await readFile(filePath, 'utf-8')
    } catch (error) {
      this.logger.warn('failed to read watch file', { error })
      return
    }

    const urls = this.extractUrls(content)
    if (urls.length) {
      const dedupeEnabled = this.readDedupeSetting()
      for (const url of urls) {
        if (dedupeEnabled && this.hasDuplicate(url)) {
          continue
        }
        this.enqueueDownload(url)
      }
    }

    this.fileState.set(filePath, info.mtimeMs)
    await this.saveState()
  }

  private extractUrls(contents: string): string[] {
    const urls = new Set<string>()
    const lines = contents.split(/\r?\n/)
    const regex = /https?:\/\/[^\s]+/g
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) {
        continue
      }
      const matches = trimmed.match(regex)
      if (matches) {
        for (const match of matches) {
          urls.add(match)
        }
      }
    }
    return Array.from(urls)
  }

  private hasDownload(url: string): boolean {
    const row = this.db
      .prepare('SELECT id FROM downloads WHERE url = ? LIMIT 1')
      .get(url) as { id?: string } | undefined
    return Boolean(row?.id)
  }

  private hasVideo(url: string): boolean {
    const row = this.db
      .prepare('SELECT id FROM videos WHERE source_url = ? LIMIT 1')
      .get(url) as { id?: string } | undefined
    return Boolean(row?.id)
  }

  private hasDuplicate(url: string): boolean {
    return this.hasDownload(url) || this.hasVideo(url)
  }

  private readDedupeSetting(): boolean {
    const value = getSetting(this.db, 'download_dedupe_enabled')
    if (value === null) {
      return true
    }
    return value === '1' || value.toLowerCase() === 'true'
  }

  private enqueueDownload(url: string): void {
    const downloadId = randomUUID()
    const jobId = randomUUID()
    const createdAt = new Date().toISOString()
    const outputDir = getSetting(this.db, 'download_path') ?? getDownloadPath()

    this.db
      .prepare(
        'INSERT INTO downloads (id, url, job_id, status, progress, speed, eta, output_path, downloader, created_at, updated_at, error_message) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .run(downloadId, url, jobId, 'queued', 0, null, null, null, 'yt-dlp', createdAt, createdAt, null)

    this.queue.enqueue({
      id: jobId,
      type: 'download',
      payload: {
        downloadId,
        url,
        outputDir
      }
    })
  }

  private statePath(): string {
    return join(getAppDataPath(), STATE_FILE)
  }

  private async loadState(): Promise<void> {
    const path = this.statePath()
    if (!existsSync(path)) {
      this.fileState.clear()
      return
    }
    try {
      const content = await readFile(path, 'utf-8')
      const parsed = JSON.parse(content) as StateFile
      this.fileState = new Map(Object.entries(parsed.files ?? {}).map(([key, value]) => [key, Number(value) || 0]))
    } catch {
      this.fileState.clear()
    }
  }

  private async saveState(): Promise<void> {
    const path = this.statePath()
    const payload: StateFile = { files: Object.fromEntries(this.fileState.entries()) }
    await mkdir(getAppDataPath(), { recursive: true })
    await writeFile(path, JSON.stringify(payload, null, 2), 'utf-8')
  }
}
