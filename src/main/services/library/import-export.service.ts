import { randomUUID } from 'node:crypto'
import { createReadStream, createWriteStream, existsSync, mkdirSync } from 'node:fs'
import { copyFile, readFile, stat, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, join, parse } from 'node:path'
import { pipeline } from 'node:stream/promises'
import type Database from 'better-sqlite3'
import { Logger } from '../../utils/logger'
import { MetadataService } from './metadata.service'

const LARGE_FILE_THRESHOLD = 100 * 1024 * 1024 // 100MB

export type DrappMetadata = {
  version: 1
  title: string | null
  transcript: string | null
  summary: string | null
  tags: Array<{
    name: string
    source: string
    confidence: number | null
    is_locked: boolean
  }>
  source_url: string | null
  source_platform: string | null
}

export type ExportRequest = {
  videoIds: string[]
  destinationDir: string
}

export type ExportResult = {
  exportedCount: number
  failedCount: number
  errors: Array<{ videoId: string; error: string }>
}

export type ImportRequest = {
  filePaths: string[]
  libraryDir: string
}

export type ImportResult = {
  importedCount: number
  skippedCount: number
  failedCount: number
  errors: Array<{ filePath: string; error: string }>
}

export type ImportExportProgress = {
  current: number
  total: number
  currentFile: string
  status: 'copying' | 'metadata' | 'complete' | 'error'
  error?: string
}

export type ProgressCallback = (progress: ImportExportProgress) => void

type VideoRow = {
  id: string
  file_path: string
  file_name: string | null
  title: string | null
  transcript: string | null
  summary: string | null
  source_url: string | null
  source_platform: string | null
}

type TagRow = {
  name: string
  source: string
  confidence: number | null
  is_locked: number
}

export class ImportExportService {
  private readonly logger = new Logger('ImportExportService')
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

  constructor(
    private readonly db: Database.Database,
    private readonly metadata: MetadataService
  ) {}

  async exportVideos(request: ExportRequest, onProgress?: ProgressCallback): Promise<ExportResult> {
    const { videoIds, destinationDir } = request
    this.logger.info('Starting export', { count: videoIds.length, destinationDir })

    let exportedCount = 0
    let failedCount = 0
    const errors: Array<{ videoId: string; error: string }> = []

    for (let i = 0; i < videoIds.length; i++) {
      const videoId = videoIds[i]

      try {
        // Get video from database
        const video = this.db
          .prepare(
            `SELECT id, file_path, file_name, title, transcript, summary, source_url, source_platform
             FROM videos WHERE id = ?`
          )
          .get(videoId) as VideoRow | undefined

        if (!video) {
          throw new Error('Video not found in database')
        }

        if (!existsSync(video.file_path)) {
          throw new Error('Video file not found on disk')
        }

        const fileName = video.file_name ?? basename(video.file_path)
        onProgress?.({
          current: i + 1,
          total: videoIds.length,
          currentFile: fileName,
          status: 'copying'
        })

        // Generate unique destination filename if exists
        let destVideoPath = join(destinationDir, fileName)
        let counter = 1
        while (existsSync(destVideoPath)) {
          const parsed = parse(fileName)
          destVideoPath = join(destinationDir, `${parsed.name}_${counter}${parsed.ext}`)
          counter++
        }

        // Copy video file (use streams for large files)
        const fileInfo = await stat(video.file_path)
        if (fileInfo.size > LARGE_FILE_THRESHOLD) {
          await this.copyFileWithStreams(video.file_path, destVideoPath)
        } else {
          await copyFile(video.file_path, destVideoPath)
        }

        onProgress?.({
          current: i + 1,
          total: videoIds.length,
          currentFile: fileName,
          status: 'metadata'
        })

        // Build and write metadata bundle
        const metadata = await this.buildMetadataBundle(videoId)
        const destFileName = basename(destVideoPath)
        const metaPath = join(destinationDir, `${parse(destFileName).name}.drapp-meta.json`)
        await writeFile(metaPath, JSON.stringify(metadata, null, 2), 'utf-8')

        exportedCount++
        this.logger.info('Exported video', { videoId, destVideoPath })
      } catch (error) {
        failedCount++
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        errors.push({ videoId, error: errorMessage })
        this.logger.warn('Failed to export video', { videoId, error: errorMessage })
      }
    }

    onProgress?.({
      current: videoIds.length,
      total: videoIds.length,
      currentFile: '',
      status: 'complete'
    })

    this.logger.info('Export completed', { exportedCount, failedCount })
    return { exportedCount, failedCount, errors }
  }

  async importVideos(request: ImportRequest, onProgress?: ProgressCallback): Promise<ImportResult> {
    const { filePaths, libraryDir } = request
    this.logger.info('Starting import', { count: filePaths.length, libraryDir })

    // Ensure library directory exists
    if (!existsSync(libraryDir)) {
      mkdirSync(libraryDir, { recursive: true })
    }

    let importedCount = 0
    let skippedCount = 0
    let failedCount = 0
    const errors: Array<{ filePath: string; error: string }> = []

    for (let i = 0; i < filePaths.length; i++) {
      const filePath = filePaths[i]
      const fileName = basename(filePath)

      try {
        // Validate extension
        const ext = extname(filePath).toLowerCase()
        if (!this.videoExtensions.has(ext)) {
          throw new Error(`Unsupported video format: ${ext}`)
        }

        onProgress?.({
          current: i + 1,
          total: filePaths.length,
          currentFile: fileName,
          status: 'copying'
        })

        // Check for duplicate
        let destPath = join(libraryDir, fileName)
        if (existsSync(destPath)) {
          // Check if it's the same file (importing from library itself)
          if (filePath === destPath) {
            skippedCount++
            continue
          }
          // Generate unique name
          let counter = 1
          while (existsSync(destPath)) {
            const parsed = parse(fileName)
            destPath = join(libraryDir, `${parsed.name}_${counter}${parsed.ext}`)
            counter++
          }
        }

        // Copy video file
        const fileInfo = await stat(filePath)
        if (fileInfo.size > LARGE_FILE_THRESHOLD) {
          await this.copyFileWithStreams(filePath, destPath)
        } else {
          await copyFile(filePath, destPath)
        }

        onProgress?.({
          current: i + 1,
          total: filePaths.length,
          currentFile: fileName,
          status: 'metadata'
        })

        // Index the new file
        await this.indexSingleFile(destPath)

        // Check for .drapp-meta.json alongside source
        await this.tryRestoreMetadata(filePath, destPath)

        importedCount++

        this.logger.info('Imported video', { filePath, destPath })
      } catch (error) {
        failedCount++
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        errors.push({ filePath, error: errorMessage })
        this.logger.warn('Failed to import video', { filePath, error: errorMessage })
      }
    }

    onProgress?.({
      current: filePaths.length,
      total: filePaths.length,
      currentFile: '',
      status: 'complete'
    })

    this.logger.info('Import completed', { importedCount, skippedCount, failedCount })
    return { importedCount, skippedCount, failedCount, errors }
  }

  private async buildMetadataBundle(videoId: string): Promise<DrappMetadata> {
    const video = this.db
      .prepare(
        `SELECT title, transcript, summary, source_url, source_platform
         FROM videos WHERE id = ?`
      )
      .get(videoId) as Pick<
      VideoRow,
      'title' | 'transcript' | 'summary' | 'source_url' | 'source_platform'
    >

    const tags = this.db
      .prepare(
        `SELECT t.name, vt.source, vt.confidence, vt.is_locked
         FROM video_tags vt
         JOIN tags t ON t.id = vt.tag_id
         WHERE vt.video_id = ?`
      )
      .all(videoId) as TagRow[]

    return {
      version: 1,
      title: video.title,
      transcript: video.transcript,
      summary: video.summary,
      tags: tags.map((t) => ({
        name: t.name,
        source: t.source,
        confidence: t.confidence,
        is_locked: Boolean(t.is_locked)
      })),
      source_url: video.source_url,
      source_platform: video.source_platform
    }
  }

  private async tryRestoreMetadata(sourceFilePath: string, destFilePath: string): Promise<void> {
    const sourceDir = dirname(sourceFilePath)
    const sourceBaseName = parse(basename(sourceFilePath)).name
    const metaPath = join(sourceDir, `${sourceBaseName}.drapp-meta.json`)

    if (!existsSync(metaPath)) {
      return
    }

    try {
      const raw = await readFile(metaPath, 'utf-8')
      const metadata = JSON.parse(raw) as DrappMetadata

      if (metadata.version !== 1) {
        this.logger.warn('Unsupported metadata version', { version: metadata.version })
        return
      }

      // Find the video by file path
      const video = this.db
        .prepare('SELECT id FROM videos WHERE file_path = ?')
        .get(destFilePath) as { id: string } | undefined

      if (video) {
        await this.restoreMetadataBundle(video.id, metadata)
        this.logger.info('Restored metadata for video', { videoId: video.id })
      }
    } catch (error) {
      this.logger.warn('Failed to restore metadata', { metaPath, error })
    }
  }

  private async restoreMetadataBundle(videoId: string, metadata: DrappMetadata): Promise<void> {
    const now = new Date().toISOString()

    // Update video fields
    this.db
      .prepare(
        `UPDATE videos SET
          title = COALESCE(?, title),
          transcript = COALESCE(?, transcript),
          summary = COALESCE(?, summary),
          source_url = COALESCE(?, source_url),
          source_platform = COALESCE(?, source_platform),
          updated_at = ?
        WHERE id = ?`
      )
      .run(
        metadata.title,
        metadata.transcript,
        metadata.summary,
        metadata.source_url,
        metadata.source_platform,
        now,
        videoId
      )

    // Restore tags
    for (const tag of metadata.tags) {
      // Ensure tag exists
      this.db
        .prepare(
          `INSERT INTO tags (name, section, created_at)
           VALUES (?, 'imported', ?)
           ON CONFLICT(name) DO NOTHING`
        )
        .run(tag.name, now)

      const tagRow = this.db.prepare('SELECT id FROM tags WHERE name = ?').get(tag.name) as {
        id: number
      }

      // Create video_tag relationship
      this.db
        .prepare(
          `INSERT INTO video_tags (id, video_id, tag_id, source, confidence, is_locked, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(video_id, tag_id) DO UPDATE SET
             source = excluded.source,
             confidence = excluded.confidence,
             is_locked = excluded.is_locked,
             updated_at = excluded.updated_at`
        )
        .run(
          randomUUID(),
          videoId,
          tagRow.id,
          tag.source,
          tag.confidence,
          tag.is_locked ? 1 : 0,
          now,
          now
        )
    }
  }

  private async indexSingleFile(filePath: string): Promise<void> {
    const fileName = basename(filePath)
    const folderPath = dirname(filePath)
    const title = fileName.replace(/\.[^.]+$/, '')
    const now = new Date().toISOString()

    // Check if already exists
    const existing = this.db.prepare('SELECT id FROM videos WHERE file_path = ?').get(filePath)
    if (existing) {
      return
    }

    // Extract metadata
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
      fileSize: null
    }

    try {
      metadata = await this.metadata.extract({ filePath })
      if (!metadata.fileSize) {
        const fileInfo = await stat(filePath)
        metadata.fileSize = fileInfo.size
      }
    } catch (error) {
      this.logger.warn('Metadata extraction failed during import', { filePath, error })
      try {
        const fileInfo = await stat(filePath)
        metadata.fileSize = fileInfo.size
      } catch {
        // Ignore
      }
    }

    // Insert into database
    this.db
      .prepare(
        `INSERT INTO videos (
          id, file_path, file_name, file_size, duration, width, height, fps,
          codec, container, bitrate, title, folder_path, created_at, updated_at
        ) VALUES (
          @id, @file_path, @file_name, @file_size, @duration, @width, @height, @fps,
          @codec, @container, @bitrate, @title, @folder_path, @created_at, @updated_at
        )`
      )
      .run({
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
  }

  private async copyFileWithStreams(src: string, dest: string): Promise<void> {
    const readStream = createReadStream(src)
    const writeStream = createWriteStream(dest)
    await pipeline(readStream, writeStream)
  }
}
