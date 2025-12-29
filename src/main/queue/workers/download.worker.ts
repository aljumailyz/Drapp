import type { Database } from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, join } from 'node:path'
import { Logger } from '../../utils/logger'
import { type DownloadProgress, type DownloadResult, YtDlpService } from '../../services/downloader'
import { KeychainService } from '../../services/auth/keychain.service'
import { SessionService } from '../../services/auth/session.service'
import { MetadataService } from '../../services/library/metadata.service'
import { getAppDataPath } from '../../utils/paths'
import { getSetting } from '../../utils/settings'

type DownloadJobPayload = {
  downloadId: string
  url: string
  outputDir?: string
}

type CookieEntry = {
  domain: string
  includeSubdomains: boolean
  path: string
  secure: boolean
  expires: number | null
  name: string
  value: string
  httpOnly: boolean
}

type JobRow = {
  id: string
  payload: string | null
}

export type DownloadEvent =
  | { type: 'status'; downloadId: string; status: string; error?: string }
  | { type: 'progress'; downloadId: string; progress: number | null; speed?: string; eta?: string }

export class DownloadWorker {
  private readonly logger = new Logger('DownloadWorker')
  private isRunning = false
  private timer: NodeJS.Timeout | null = null
  private lastProgressUpdate = new Map<string, number>()
  private activeControllers = new Map<string, AbortController>()
  private cooldownUntil = 0
  private readonly metadata = new MetadataService()

  constructor(
    private readonly db: Database,
    private readonly service: YtDlpService,
    private readonly onEvent?: (event: DownloadEvent) => void,
    private readonly auth?: { sessionService: SessionService; keychain: KeychainService }
  ) {}

  start(pollMs = 4000): void {
    if (this.timer) {
      return
    }

    this.timer = setInterval(() => {
      void this.tick()
    }, pollMs)

    void this.tick()
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  cancel(downloadId: string): void {
    const controller = this.activeControllers.get(downloadId)
    if (controller) {
      controller.abort()
    }
  }

  private async tick(): Promise<void> {
    if (this.isRunning) {
      return
    }
    if (this.cooldownUntil && Date.now() < this.cooldownUntil) {
      return
    }

    this.isRunning = true
    let currentJob: JobRow | undefined
    let currentPayload: DownloadJobPayload | null = null
    let delayMs = 0

    try {
      currentJob = this.db
        .prepare("SELECT id, payload FROM jobs WHERE type = 'download' AND status = 'queued' ORDER BY created_at ASC LIMIT 1")
        .get() as JobRow | undefined

      if (!currentJob) {
        return
      }

      currentPayload = this.safeParse(currentJob.payload)
      if (!currentPayload) {
        this.markJob(currentJob.id, 'failed', 'invalid_payload')
        return
      }

      const statusSnapshot = this.getJobStatus(currentJob.id)
      if (statusSnapshot && statusSnapshot !== 'queued') {
        return
      }

      const controller = new AbortController()
      this.activeControllers.set(currentPayload.downloadId, controller)

      this.markJob(currentJob.id, 'running')
      this.markDownload(currentPayload.downloadId, 'downloading')

      if (currentPayload.outputDir) {
        mkdirSync(currentPayload.outputDir, { recursive: true })
      }

      this.logger.info('processing download', { jobId: currentJob.id, downloadId: currentPayload.downloadId })
      const session = this.resolveSession(currentPayload.url)
      const cookiesPath = session ? await this.writeCookieFile(session.cookies, currentPayload.downloadId) : null
      const headers = session?.headers ?? undefined
      const proxySetting = getSetting(this.db, 'download_proxy')
      const proxy = proxySetting && proxySetting.trim() ? proxySetting.trim() : undefined
      const rateLimitSetting = getSetting(this.db, 'download_rate_limit')
      const rateLimit = rateLimitSetting && rateLimitSetting.trim() ? rateLimitSetting.trim() : undefined
      delayMs = this.parseDelayMs(getSetting(this.db, 'download_rate_limit_ms'))

      const downloadId = currentPayload.downloadId
      const result = await this.service.download({
        url: currentPayload.url,
        outputPath: currentPayload.outputDir ? join(currentPayload.outputDir, '%(title)s.%(ext)s') : undefined,
        cookiesPath: cookiesPath ?? undefined,
        headers,
        proxy,
        rateLimit,
        signal: controller.signal,
        onDestination: (path) => {
          this.updateDownloadOutput(downloadId, path)
        },
        onProgress: (progress) => {
          this.updateDownloadProgress(downloadId, progress)
        }
      })

      if (session?.sessionId) {
        this.auth?.sessionService.markUsed(session.sessionId)
      }

      const latestStatus = this.getJobStatus(currentJob.id)
      if (latestStatus === 'canceled') {
        this.markDownload(currentPayload.downloadId, 'canceled', 'canceled_by_user')
        return
      }

      if (result.outputPath) {
        this.upsertVideo(currentPayload.downloadId, currentPayload.url, result)
        await this.updateVideoMetadata(currentPayload.downloadId, result.outputPath)
      }

      this.markDownload(currentPayload.downloadId, 'completed')
      this.markJob(currentJob.id, 'completed')
    } catch (error) {
      this.logger.error('download failed', { error: this.errorMessage(error) })
      if (currentJob) {
        if (this.isCanceledError(error)) {
          this.markJob(currentJob.id, 'canceled', 'canceled_by_user')
        } else {
          this.markJob(currentJob.id, 'failed', this.errorMessage(error))
        }
      }
      if (currentPayload) {
        if (this.isCanceledError(error)) {
          this.markDownload(currentPayload.downloadId, 'canceled', 'canceled_by_user')
        } else {
          this.markDownload(currentPayload.downloadId, 'failed', this.errorMessage(error))
        }
      }
    } finally {
      if (currentPayload) {
        this.activeControllers.delete(currentPayload.downloadId)
        this.lastProgressUpdate.delete(currentPayload.downloadId)
      }
      if (currentPayload) {
        await this.cleanupCookieFile(currentPayload.downloadId)
      }
      if (currentJob && delayMs > 0) {
        this.cooldownUntil = Date.now() + delayMs
      }
      this.isRunning = false
    }
  }

  private resolveSession(url: string): { sessionId: string; cookies: CookieEntry[]; headers?: Record<string, string> } | null {
    if (!this.auth) {
      return null
    }

    const platform = this.detectPlatform(url)
    if (!platform) {
      return null
    }

    const session = this.auth.sessionService.getActiveSession(platform)
    if (!session?.cookies) {
      return null
    }

    const decrypted = this.auth.keychain.decryptFromJson(session.cookies)
    if (!decrypted) {
      return null
    }

    try {
      const parsed = JSON.parse(decrypted) as { cookies?: CookieEntry[] }
      if (!parsed.cookies || !Array.isArray(parsed.cookies) || parsed.cookies.length === 0) {
        return null
      }

      const now = Math.floor(Date.now() / 1000)
      const filtered = parsed.cookies.filter((cookie) => {
        if (!cookie || !cookie.name || !cookie.domain) {
          return false
        }
        if (!cookie.expires) {
          return true
        }
        return cookie.expires > now
      })

      if (!filtered.length) {
        return null
      }

      const headers = this.parseHeaders(session.headers)
      return {
        sessionId: session.id,
        cookies: filtered,
        headers: headers ?? undefined
      }
    } catch (error) {
      this.logger.warn('unable to parse cookies', { error: this.errorMessage(error) })
      return null
    }
  }

  private detectPlatform(url: string): string | null {
    const candidate = url.match(/^https?:\/\//i) ? url : `https://${url}`
    try {
      const parsed = new URL(candidate)
      const host = parsed.hostname.toLowerCase()
      if (host.endsWith('youtube.com') || host === 'youtu.be') {
        return 'youtube'
      }
      if (host.endsWith('tiktok.com')) {
        return 'tiktok'
      }
      if (host.endsWith('instagram.com')) {
        return 'instagram'
      }
      if (host.endsWith('twitter.com') || host.endsWith('x.com')) {
        return 'twitter'
      }
      if (host.endsWith('reddit.com')) {
        return 'reddit'
      }
      if (host.endsWith('vimeo.com')) {
        return 'vimeo'
      }
      return 'other'
    } catch {
      return null
    }
  }

  private parseHeaders(headers: string | null): Record<string, string> | null {
    if (!headers) {
      return null
    }
    try {
      const parsed = JSON.parse(headers) as Record<string, unknown>
      if (!parsed || typeof parsed !== 'object') {
        return null
      }
      return Object.fromEntries(
        Object.entries(parsed).filter(([key, value]) => key && typeof value === 'string')
      ) as Record<string, string>
    } catch {
      return null
    }
  }

  private cookieFilePath(downloadId: string): string {
    return join(getAppDataPath(), 'auth', `cookies-${downloadId}.txt`)
  }

  private async writeCookieFile(cookies: CookieEntry[], downloadId: string): Promise<string> {
    const dir = join(getAppDataPath(), 'auth')
    await mkdir(dir, { recursive: true })
    const path = this.cookieFilePath(downloadId)
    const content = this.serializeCookies(cookies)
    await writeFile(path, content, 'utf-8')
    return path
  }

  private async cleanupCookieFile(downloadId: string): Promise<void> {
    const path = this.cookieFilePath(downloadId)
    try {
      await unlink(path)
    } catch {
      // Ignore missing files
    }
  }

  private serializeCookies(cookies: CookieEntry[]): string {
    const lines = [
      '# Netscape HTTP Cookie File',
      '# This file was generated by Drapp'
    ]

    for (const cookie of cookies) {
      const domain = cookie.httpOnly ? `#HttpOnly_${cookie.domain}` : cookie.domain
      const includeSubdomains = cookie.includeSubdomains ? 'TRUE' : 'FALSE'
      const secure = cookie.secure ? 'TRUE' : 'FALSE'
      const expires = cookie.expires ?? 0
      const path = cookie.path || '/'
      const name = cookie.name
      const value = cookie.value
      lines.push([domain, includeSubdomains, path, secure, String(expires), name, value].join('\t'))
    }

    return lines.join('\n') + '\n'
  }

  private markJob(jobId: string, status: string, error?: string): void {
    const updatedAt = new Date().toISOString()
    this.db
      .prepare('UPDATE jobs SET status = ?, updated_at = ?, error_message = ? WHERE id = ?')
      .run(status, updatedAt, error ?? null, jobId)
  }

  private markDownload(downloadId: string, status: string, error?: string): void {
    const updatedAt = new Date().toISOString()
    if (status === 'completed') {
      this.db
        .prepare('UPDATE downloads SET status = ?, progress = ?, speed = NULL, eta = NULL, updated_at = ?, error_message = NULL, completed_at = ? WHERE id = ?')
        .run(status, 100, updatedAt, updatedAt, downloadId)
    } else if (status === 'downloading') {
      this.db
        .prepare('UPDATE downloads SET status = ?, started_at = ?, updated_at = ? WHERE id = ?')
        .run(status, updatedAt, updatedAt, downloadId)
    } else {
      this.db
        .prepare('UPDATE downloads SET status = ?, updated_at = ?, error_message = ? WHERE id = ?')
        .run(status, updatedAt, error ?? null, downloadId)
    }
    this.emit({ type: 'status', downloadId, status, error })
  }

  private updateDownloadOutput(downloadId: string, outputPath: string): void {
    const updatedAt = new Date().toISOString()
    this.db
      .prepare('UPDATE downloads SET output_path = ?, updated_at = ?, error_message = NULL WHERE id = ?')
      .run(outputPath, updatedAt, downloadId)
    this.emit({ type: 'status', downloadId, status: 'downloading' })
  }

  private upsertVideo(downloadId: string, sourceUrl: string, result: DownloadResult): void {
    if (!result.outputPath) {
      return
    }

    const now = new Date().toISOString()
    const fileName = result.fileName ?? basename(result.outputPath)
    const title = fileName.replace(new RegExp(`${extname(fileName)}$`), '')

    this.db
      .prepare(
        'INSERT INTO videos (id, file_path, file_name, title, source_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET file_path = ?, file_name = ?, title = ?, source_url = ?, updated_at = ?'
      )
      .run(
        downloadId,
        result.outputPath,
        fileName,
        title,
        sourceUrl,
        now,
        now,
        result.outputPath,
        fileName,
        title,
        sourceUrl,
        now
      )

    this.db
      .prepare('UPDATE downloads SET video_id = ?, output_path = ?, updated_at = ? WHERE id = ?')
      .run(downloadId, result.outputPath, now, downloadId)
  }

  private async updateVideoMetadata(videoId: string, filePath: string): Promise<void> {
    try {
      const metadata = await this.metadata.extract({ filePath })
      const now = new Date().toISOString()
      const folderPath = dirname(filePath)

      this.db
        .prepare(
          'UPDATE videos SET file_size = ?, duration = ?, width = ?, height = ?, fps = ?, codec = ?, container = ?, bitrate = ?, folder_path = ?, updated_at = ? WHERE id = ?'
        )
        .run(
          metadata.fileSize,
          metadata.duration,
          metadata.width,
          metadata.height,
          metadata.fps,
          metadata.codec,
          metadata.container,
          metadata.bitrate,
          folderPath,
          now,
          videoId
        )
    } catch (error) {
      this.logger.warn('metadata extraction failed', { error: this.errorMessage(error) })
    }
  }

  private safeParse(payload: string | null): DownloadJobPayload | null {
    if (!payload) {
      return null
    }

    try {
      const parsed = JSON.parse(payload) as DownloadJobPayload
      if (!parsed.downloadId || !parsed.url) {
        return null
      }
      return parsed
    } catch (error) {
      this.logger.error('failed to parse job payload', { error: this.errorMessage(error) })
      return null
    }
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'unknown error'
  }

  private parseDelayMs(value: string | null): number {
    if (!value) {
      return 0
    }
    const parsed = Number(value)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return 0
    }
    return Math.round(parsed)
  }

  private isCanceledError(error: unknown): boolean {
    return error instanceof Error && (error.name === 'AbortError' || error.message === 'canceled')
  }

  private getJobStatus(jobId: string): string | null {
    const row = this.db.prepare('SELECT status FROM jobs WHERE id = ?').get(jobId) as { status?: string } | undefined
    return row?.status ?? null
  }

  private emitProgress(downloadId: string, progress: DownloadProgress): void {
    this.emit({
      type: 'progress',
      downloadId,
      progress: progress.percent,
      speed: progress.speed,
      eta: progress.eta
    })
  }

  private emit(event: DownloadEvent): void {
    if (this.onEvent) {
      this.onEvent(event)
    }
  }

  private updateDownloadProgress(downloadId: string, progress: DownloadProgress): void {
    const now = Date.now()
    const lastUpdate = this.lastProgressUpdate.get(downloadId) ?? 0
    if (now - lastUpdate < 1000) {
      return
    }

    this.lastProgressUpdate.set(downloadId, now)
    const updatedAt = new Date().toISOString()
    this.db
      .prepare('UPDATE downloads SET progress = ?, speed = ?, eta = ?, updated_at = ? WHERE id = ?')
      .run(progress.percent, progress.speed ?? null, progress.eta ?? null, updatedAt, downloadId)

    this.emitProgress(downloadId, progress)
  }
}
