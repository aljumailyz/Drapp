import { randomUUID } from 'node:crypto'
import { readdir, stat } from 'node:fs/promises'
import { basename, dirname, extname, join } from 'node:path'
import type Database from 'better-sqlite3'
import { Logger } from '../../utils/logger'
import { MetadataService } from './metadata.service'

export type ScanRequest = {
  rootPath: string
}

export type ScanProgress = {
  found: number
  processed: number
  inserted: number
  updated: number
  errors: number
  currentPath?: string
}

export type ScanResult = {
  found: number
  inserted: number
  updated: number
  errors: number
  canceled: boolean
}

export type ScanOptions = {
  onProgress?: (progress: ScanProgress) => void
  signal?: AbortSignal
}

export class ScannerService {
  private readonly logger = new Logger('ScannerService')
  private readonly videoExtensions = new Set([
    '.mp4',
    '.mkv',
    '.mov',
    '.webm',
    '.avi',
    '.flv',
    '.m4v',
    '.wmv',
    '.mpg',
    '.mpeg'
  ])
  private readonly ignoredDirs = new Set([
    '.drapp',
    '.git',
    'node_modules'
  ])

  constructor(
    private readonly db: Database.Database,
    private readonly metadata: MetadataService
  ) {}

  async scan(request: ScanRequest, options: ScanOptions = {}): Promise<ScanResult> {
    this.logger.info('library scan requested', { root: request.rootPath })

    const files: string[] = []
    await this.walk(request.rootPath, files, options.signal)

    const selectStmt = this.db.prepare('SELECT id, title FROM videos WHERE file_path = ?')
    const insertStmt = this.db.prepare(`
      INSERT INTO videos (
        id,
        file_path,
        file_name,
        file_size,
        duration,
        width,
        height,
        fps,
        codec,
        container,
        bitrate,
        title,
        folder_path,
        created_at,
        updated_at
      ) VALUES (
        @id,
        @file_path,
        @file_name,
        @file_size,
        @duration,
        @width,
        @height,
        @fps,
        @codec,
        @container,
        @bitrate,
        @title,
        @folder_path,
        @created_at,
        @updated_at
      )
    `)
    const updateStmt = this.db.prepare(`
      UPDATE videos
      SET
        file_name = @file_name,
        file_size = @file_size,
        duration = @duration,
        width = @width,
        height = @height,
        fps = @fps,
        codec = @codec,
        container = @container,
        bitrate = @bitrate,
        title = @title,
        folder_path = @folder_path,
        updated_at = @updated_at
      WHERE id = @id
    `)

    let inserted = 0
    let updated = 0
    let errors = 0
    let processed = 0

    for (const filePath of files) {
      if (options.signal?.aborted) {
        return { found: files.length, inserted, updated, errors, canceled: true }
      }

      let fileFailed = false
      let metadata: {
        duration: number | null
        width: number | null
        height: number | null
        fps: number | null
        codec: string | null
        container: string | null
        bitrate: number | null
        fileSize: number | null
      } = {
        duration: null,
        width: null,
        height: null,
        fps: null,
        codec: null,
        container: null,
        bitrate: null,
        fileSize: await this.safeStatSize(filePath)
      }

      try {
        metadata = await this.metadata.extract({ filePath })
        if (!metadata.fileSize) {
          metadata.fileSize = await this.safeStatSize(filePath)
        }
      } catch (error) {
        if (!fileFailed) {
          errors += 1
          fileFailed = true
        }
        this.logger.warn('Metadata extraction failed, continuing with defaults', { filePath, error })
      }

      try {
        const now = new Date().toISOString()
        const fileName = basename(filePath)
        const folderPath = dirname(filePath)
        const title = fileName.replace(/\.[^.]+$/, '')
        const existing = selectStmt.get(filePath) as { id: string; title: string | null } | undefined

        if (existing) {
          updateStmt.run({
            id: existing.id,
            file_name: fileName,
            file_size: metadata.fileSize,
            duration: metadata.duration,
            width: metadata.width,
            height: metadata.height,
            fps: metadata.fps,
            codec: metadata.codec,
            container: metadata.container,
            bitrate: metadata.bitrate,
            title: existing.title ?? title,
            folder_path: folderPath,
            updated_at: now
          })
          updated += 1
        } else {
          insertStmt.run({
            id: randomUUID(),
            file_path: filePath,
            file_name: fileName,
            file_size: metadata.fileSize,
            duration: metadata.duration,
            width: metadata.width,
            height: metadata.height,
            fps: metadata.fps,
            codec: metadata.codec,
            container: metadata.container,
            bitrate: metadata.bitrate,
            title,
            folder_path: folderPath,
            created_at: now,
            updated_at: now
          })
          inserted += 1
        }
      } catch (error) {
        if (!fileFailed) {
          errors += 1
          fileFailed = true
        }
        this.logger.warn('Failed to index file', { filePath, error })
      } finally {
        processed += 1
        options.onProgress?.({
          found: files.length,
          processed,
          inserted,
          updated,
          errors,
          currentPath: filePath
        })
      }
    }

    return { found: files.length, inserted, updated, errors, canceled: false }
  }

  private async walk(root: string, files: string[], signal?: AbortSignal): Promise<void> {
    let entries: Array<{ name: string; isDirectory: () => boolean; isFile: () => boolean }>

    try {
      entries = await readdir(root, { withFileTypes: true })
    } catch (error) {
      this.logger.warn('Failed to read directory', { root, error })
      return
    }

    for (const entry of entries) {
      if (signal?.aborted) {
        return
      }
      const fullPath = join(root, entry.name)

      if (entry.isDirectory()) {
        if (this.ignoredDirs.has(entry.name)) {
          continue
        }
        if (entry.name.startsWith('.')) {
          continue
        }
        await this.walk(fullPath, files, signal)
        continue
      }

      if (entry.isFile()) {
        const ext = extname(entry.name).toLowerCase()
        if (this.videoExtensions.has(ext)) {
          files.push(fullPath)
        }
      }
    }
  }

  private async safeStatSize(filePath: string): Promise<number | null> {
    try {
      const info = await stat(filePath)
      return info.size
    } catch {
      return null
    }
  }
}
