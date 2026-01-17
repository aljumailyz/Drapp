import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { randomFillSync, randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { open, readFile, stat, unlink, writeFile } from 'node:fs/promises'
import { join, parse } from 'node:path'
import { getDatabase } from '../database'
import { ImportExportService } from '../services/library/import-export.service'
import { MetadataService } from '../services/library/metadata.service'
import { ScannerService } from '../services/library/scanner.service'
import { getSetting } from '../utils/settings'

function isHistoryEnabled(): boolean {
  const db = getDatabase()
  const value = getSetting(db, 'privacy_history_enabled')
  if (value === null) {
    return true
  }
  return value === '1' || value.toLowerCase() === 'true'
}

function isHiddenFolderEnabled(): boolean {
  const db = getDatabase()
  const value = getSetting(db, 'privacy_hidden_folder_enabled')
  if (value === null) {
    return false
  }
  return value === '1' || value.toLowerCase() === 'true'
}

function isSecureDeleteEnabled(): boolean {
  const db = getDatabase()
  const value = getSetting(db, 'privacy_secure_delete_enabled')
  if (value === null) {
    return false
  }
  return value === '1' || value.toLowerCase() === 'true'
}

export function registerLibraryHandlers(): void {
  const db = getDatabase()
  const scanner = new ScannerService(db, new MetadataService())
  const scanControllers = new Map<string, AbortController>()
  const deleteVideoRecords = (videoId: string): void => {
    db.prepare('DELETE FROM video_tags WHERE video_id = ?').run(videoId)
    db.prepare('DELETE FROM tag_events WHERE video_id = ?').run(videoId)
    db.prepare('DELETE FROM video_frames WHERE video_id = ?').run(videoId)
    db.prepare('DELETE FROM video_embeddings WHERE video_id = ?').run(videoId)
    db.prepare('DELETE FROM private_items WHERE video_id = ?').run(videoId)
    db.prepare('DELETE FROM watch_history WHERE video_id = ?').run(videoId)
    db.prepare('DELETE FROM collection_videos WHERE video_id = ?').run(videoId)
    db.prepare('DELETE FROM jobs WHERE video_id = ?').run(videoId)
    db.prepare('UPDATE downloads SET video_id = NULL WHERE video_id = ?').run(videoId)
    db.prepare('DELETE FROM videos WHERE id = ?').run(videoId)
  }

  ipcMain.handle('library/select-folder', async () => {
    const focusedWindow = BrowserWindow.getFocusedWindow()
    const dialogOptions: Electron.OpenDialogOptions = {
      properties: ['openDirectory', 'createDirectory']
    }
    const result = focusedWindow
      ? await dialog.showOpenDialog(focusedWindow, dialogOptions)
      : await dialog.showOpenDialog(dialogOptions)

    if (result.canceled || result.filePaths.length === 0) {
      return { ok: false, canceled: true }
    }

    return { ok: true, path: result.filePaths[0] }
  })

  ipcMain.handle('library/scan-start', async (event, path: string) => {
    if (!path) {
      return { ok: false, error: 'No scan path provided.' }
    }

    const scanId = randomUUID()
    const controller = new AbortController()
    scanControllers.set(scanId, controller)

    const sender = event.sender
    void scanner
      .scan(
        { rootPath: path },
        {
          signal: controller.signal,
          onProgress: (progress) => {
            sender.send('library/scan-progress', {
              scanId,
              ...progress
            })
          }
        }
      )
      .then((result) => {
        sender.send('library/scan-complete', {
          scanId,
          ok: true,
          result
        })
      })
      .catch((error) => {
        sender.send('library/scan-complete', {
          scanId,
          ok: false,
          error: error instanceof Error ? error.message : 'Library scan failed.'
        })
      })
      .finally(() => {
        scanControllers.delete(scanId)
      })

    return { ok: true, scanId }
  })

  ipcMain.handle('library/scan-cancel', async (_event, scanId: string) => {
    if (!scanId) {
      return { ok: false, error: 'No scan id provided.' }
    }
    const controller = scanControllers.get(scanId)
    if (!controller) {
      return { ok: false, error: 'Scan not found.' }
    }

    controller.abort()
    return { ok: true }
  })

  ipcMain.handle('library/scan', async (_event, path: string) => {
    if (!path) {
      return { ok: false, error: 'No scan path provided.' }
    }

    try {
      const result = await scanner.scan({ rootPath: path })
      return { ok: true, result }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Library scan failed.' }
    }
  })

  ipcMain.handle('library/stats', async () => {
    const totals = db
      .prepare('SELECT COUNT(*) as count, SUM(duration) as totalDuration, SUM(file_size) as totalSize FROM videos')
      .get() as { count?: number; totalDuration?: number; totalSize?: number } | undefined

    const hidden = db
      .prepare('SELECT COUNT(*) as count FROM private_items WHERE is_hidden = 1')
      .get() as { count?: number } | undefined

    const downloadRows = db
      .prepare('SELECT status, COUNT(*) as count FROM downloads GROUP BY status')
      .all() as Array<{ status: string; count: number }>

    const downloadStats: Record<string, number> = {
      queued: 0,
      downloading: 0,
      completed: 0,
      failed: 0,
      canceled: 0
    }

    for (const row of downloadRows) {
      if (!row?.status) {
        continue
      }
      downloadStats[row.status] = row.count
    }

    return {
      ok: true,
      stats: {
        videoCount: totals?.count ?? 0,
        totalDuration: totals?.totalDuration ?? 0,
        totalSize: totals?.totalSize ?? 0,
        hiddenCount: hidden?.count ?? 0,
        downloads: downloadStats
      }
    }
  })

  ipcMain.handle('library/select-export-folder', async () => {
    const focusedWindow = BrowserWindow.getFocusedWindow()
    const dialogOptions: Electron.OpenDialogOptions = {
      properties: ['openDirectory', 'createDirectory']
    }
    const result = focusedWindow
      ? await dialog.showOpenDialog(focusedWindow, dialogOptions)
      : await dialog.showOpenDialog(dialogOptions)

    if (result.canceled || result.filePaths.length === 0) {
      return { ok: false, canceled: true }
    }

    return { ok: true, path: result.filePaths[0] }
  })

  ipcMain.handle('library/export-assets', async (_event, payload: {
    videoId: string
    includeTranscript?: boolean
    includeSummary?: boolean
    includeCaptions?: boolean
    includeMetadata?: boolean
    targetDir?: string | null
  }) => {
    if (!payload?.videoId) {
      return { ok: false, error: 'missing_video' }
    }

    const row = db
      .prepare('SELECT file_path, file_name, title, transcript, summary, duration FROM videos WHERE id = ?')
      .get(payload.videoId) as {
      file_path?: string
      file_name?: string | null
      title?: string | null
      transcript?: string | null
      summary?: string | null
      duration?: number | null
    } | undefined

    if (!row?.file_path) {
      return { ok: false, error: 'video_not_found' }
    }

    const baseName = row.file_name ? parse(row.file_name).name : parse(row.file_path).name
    const parsedSource = parse(row.file_path)
    const exportDir = payload.targetDir && payload.targetDir.trim()
      ? payload.targetDir
      : parsedSource.dir
    const vttPath = join(parsedSource.dir, `${parsedSource.name}.vtt`)

    if (payload.includeCaptions && !existsSync(vttPath) && !row.transcript) {
      return { ok: false, error: 'missing_transcript' }
    }

    try {
      const results: string[] = []

      const transcriptTarget = join(exportDir, `${baseName}.txt`)
      const summaryTarget = join(exportDir, `${baseName}.summary.txt`)
      const metadataTarget = join(exportDir, `${baseName}.metadata.json`)
      const captionsTarget = join(exportDir, `${baseName}.vtt`)

      if (payload.includeTranscript) {
        await writeFile(transcriptTarget, row.transcript ?? '', 'utf-8')
        results.push(transcriptTarget)
      }

      if (payload.includeSummary) {
        await writeFile(summaryTarget, row.summary ?? '', 'utf-8')
        results.push(summaryTarget)
      }

      if (payload.includeMetadata) {
        const metadata = {
          id: payload.videoId,
          title: row.title,
          fileName: row.file_name ?? null,
          sourcePath: row.file_path,
          duration: row.duration ?? null
        }
        await writeFile(metadataTarget, JSON.stringify(metadata, null, 2), 'utf-8')
        results.push(metadataTarget)
      }

      if (payload.includeCaptions) {
        if (existsSync(vttPath)) {
          await writeFile(captionsTarget, await readFile(vttPath, 'utf-8'), 'utf-8')
        } else if (row.transcript) {
          const duration = Number.isFinite(row.duration) && row.duration ? row.duration : 300
          const content = buildSingleCueVtt(row.transcript, duration)
          await writeFile(captionsTarget, content, 'utf-8')
        }
        results.push(captionsTarget)
      }

      if (results.length && exportDir) {
        shell.showItemInFolder(results[0])
      }

      return { ok: true, files: results, exportDir }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'export_failed' }
    }
  })

  ipcMain.handle('library/integrity-scan', async () => {
    const videos = db
      .prepare('SELECT id, file_path, title, file_name FROM videos')
      .all() as Array<{ id: string; file_path: string; title: string | null; file_name: string | null }>
    const downloads = db
      .prepare("SELECT id, url, output_path, status FROM downloads WHERE status = 'completed'")
      .all() as Array<{ id: string; url: string; output_path: string | null; status: string }>

    const missingVideos: Array<{ id: string; file_path: string; title: string | null; file_name: string | null }> = []
    for (const video of videos) {
      if (!video.file_path || !existsSync(video.file_path)) {
        missingVideos.push(video)
      }
    }

    const missingDownloads: Array<{ id: string; url: string; output_path: string | null; status: string }> = []
    for (const download of downloads) {
      if (!download.output_path || !existsSync(download.output_path)) {
        missingDownloads.push(download)
      }
    }

    return {
      ok: true,
      summary: {
        videosTotal: videos.length,
        missingVideos: missingVideos.length,
        downloadsTotal: downloads.length,
        missingDownloads: missingDownloads.length
      },
      missingVideos,
      missingDownloads
    }
  })

  ipcMain.handle(
    'library/integrity-fix',
    async (_event, payload: { missingVideoIds?: string[]; missingDownloadIds?: string[] }) => {
      if (!payload) {
        return { ok: false, error: 'missing_payload' }
      }

      const missingVideoIds = Array.isArray(payload.missingVideoIds) ? payload.missingVideoIds : []
      const missingDownloadIds = Array.isArray(payload.missingDownloadIds) ? payload.missingDownloadIds : []

      const now = new Date().toISOString()
      let removedVideos = 0
      let markedDownloads = 0

      const tx = db.transaction(() => {
        for (const videoId of missingVideoIds) {
          if (!videoId) {
            continue
          }
          deleteVideoRecords(videoId)
          removedVideos += 1
        }

        for (const downloadId of missingDownloadIds) {
          if (!downloadId) {
            continue
          }
          const result = db
            .prepare('UPDATE downloads SET status = ?, error_message = ?, updated_at = ? WHERE id = ?')
            .run('failed', 'missing_output', now, downloadId)
          if (result.changes > 0) {
            markedDownloads += 1
          }
        }
      })

      tx()

      return { ok: true, removedVideos, markedDownloads }
    }
  )

  ipcMain.handle('library/get-playback', async (_event, videoId: string) => {
    if (!videoId) {
      return { ok: false, error: 'No video id provided.' }
    }

    if (!isHistoryEnabled()) {
      return { ok: true, position: 0 }
    }

    const row = db
      .prepare('SELECT position FROM watch_history WHERE video_id = ? ORDER BY watched_at DESC LIMIT 1')
      .get(videoId) as { position?: number } | undefined

    return { ok: true, position: row?.position ?? 0 }
  })

  ipcMain.handle('library/save-playback', async (_event, payload: {
    videoId: string
    position: number
    duration?: number
  }) => {
    if (!payload?.videoId) {
      return { ok: false, error: 'No video id provided.' }
    }

    if (!isHistoryEnabled()) {
      return { ok: true }
    }

    const position = Number.isFinite(payload.position) ? payload.position : 0
    const duration = Number.isFinite(payload.duration) ? payload.duration : null

    db.prepare(`
      INSERT INTO watch_history (video_id, position, duration)
      VALUES (?, ?, ?)
    `).run(payload.videoId, position, duration)

    db.prepare(`
      UPDATE videos
      SET last_watched_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(payload.videoId)

    if (duration && position >= duration * 0.95) {
      db.prepare(`
        UPDATE videos
        SET watch_count = COALESCE(watch_count, 0) + 1
        WHERE id = ?
      `).run(payload.videoId)
    }

    return { ok: true }
  })

  ipcMain.handle('library/get-transcript', async (_event, videoId: string) => {
    if (!videoId) {
      return { ok: false, error: 'missing_video' }
    }

    const row = db
      .prepare('SELECT transcript FROM videos WHERE id = ?')
      .get(videoId) as { transcript?: string | null } | undefined

    if (!row) {
      return { ok: false, error: 'video_not_found' }
    }

    return { ok: true, transcript: row.transcript ?? '' }
  })

  ipcMain.handle('library/update-transcript', async (_event, payload: { videoId: string; transcript: string }) => {
    if (!payload?.videoId) {
      return { ok: false, error: 'missing_video' }
    }

    const transcript = payload.transcript ?? ''
    const result = db
      .prepare('UPDATE videos SET transcript = ?, updated_at = ? WHERE id = ?')
      .run(transcript, new Date().toISOString(), payload.videoId)

    return result.changes > 0 ? { ok: true } : { ok: false, error: 'video_not_found' }
  })

  ipcMain.handle('library/export-captions', async (_event, payload: { videoId: string }) => {
    if (!payload?.videoId) {
      return { ok: false, error: 'missing_video' }
    }

    const row = db
      .prepare('SELECT file_path, transcript, duration FROM videos WHERE id = ?')
      .get(payload.videoId) as { file_path?: string; transcript?: string | null; duration?: number | null } | undefined

    if (!row?.file_path) {
      return { ok: false, error: 'video_not_found' }
    }

    const parsed = parse(row.file_path)
    const vttPath = join(parsed.dir, `${parsed.name}.vtt`)

    if (existsSync(vttPath)) {
      return { ok: true, path: vttPath }
    }

    if (!row.transcript) {
      return { ok: false, error: 'missing_transcript' }
    }

    const duration = Number.isFinite(row.duration) && row.duration ? row.duration : 300
    const content = buildSingleCueVtt(row.transcript, duration)
    await writeFile(vttPath, content, 'utf-8')
    return { ok: true, path: vttPath }
  })

  ipcMain.handle('library/list', async (_event, includeHidden?: boolean) => {
    const hideHidden = isHiddenFolderEnabled()
    const shouldHide = hideHidden && !includeHidden
    const query = shouldHide
      ? `SELECT videos.id, videos.file_path, videos.file_name, videos.title, videos.summary, videos.file_size, videos.duration, videos.width, videos.height, videos.codec, videos.container, videos.bitrate, videos.created_at, videos.updated_at,
           CASE WHEN private_items.video_id IS NULL THEN 0 ELSE 1 END AS is_hidden
         FROM videos
         LEFT JOIN private_items ON private_items.video_id = videos.id AND private_items.is_hidden = 1
         WHERE private_items.video_id IS NULL
         ORDER BY videos.created_at DESC`
      : `SELECT videos.id, videos.file_path, videos.file_name, videos.title, videos.summary, videos.file_size, videos.duration, videos.width, videos.height, videos.codec, videos.container, videos.bitrate, videos.created_at, videos.updated_at,
           CASE WHEN private_items.video_id IS NULL THEN 0 ELSE 1 END AS is_hidden
         FROM videos
         LEFT JOIN private_items ON private_items.video_id = videos.id AND private_items.is_hidden = 1
         ORDER BY videos.created_at DESC`
    const rows = db
      .prepare(query)
      .all() as Array<{
      id: string
      file_path: string
      file_name: string | null
      title: string | null
      summary: string | null
      file_size: number | null
      duration: number | null
      width: number | null
      height: number | null
      codec: string | null
      container: string | null
      bitrate: number | null
      is_hidden: number
      created_at: string
      updated_at: string | null
    }>

    return {
      ok: true,
      videos: rows.map((row) => ({
        ...row,
        is_hidden: row.is_hidden === 1
      }))
    }
  })

  ipcMain.handle('library/set-hidden', async (_event, payload: { videoId: string; hidden: boolean }) => {
    if (!payload?.videoId) {
      return { ok: false, error: 'missing_video' }
    }

    if (payload.hidden) {
      db.prepare(
        'INSERT INTO private_items (video_id, is_hidden, created_at) VALUES (?, 1, CURRENT_TIMESTAMP) ON CONFLICT(video_id) DO UPDATE SET is_hidden = 1'
      ).run(payload.videoId)
    } else {
      db.prepare('DELETE FROM private_items WHERE video_id = ?').run(payload.videoId)
    }

    return { ok: true }
  })

  ipcMain.handle('library/delete', async (_event, payload: { videoId: string }) => {
    if (!payload?.videoId) {
      return { ok: false, error: 'missing_video' }
    }

    const row = db
      .prepare('SELECT file_path FROM videos WHERE id = ?')
      .get(payload.videoId) as { file_path?: string } | undefined

    if (!row?.file_path) {
      return { ok: false, error: 'file_not_found' }
    }

    const secureDelete = isSecureDeleteEnabled()
    try {
      await removeFile(row.file_path, secureDelete)
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Unable to delete file.' }
    }

    db.prepare('DELETE FROM video_tags WHERE video_id = ?').run(payload.videoId)
    db.prepare('DELETE FROM tag_events WHERE video_id = ?').run(payload.videoId)
    db.prepare('DELETE FROM video_frames WHERE video_id = ?').run(payload.videoId)
    db.prepare('DELETE FROM video_embeddings WHERE video_id = ?').run(payload.videoId)
    db.prepare('DELETE FROM private_items WHERE video_id = ?').run(payload.videoId)
    db.prepare('DELETE FROM watch_history WHERE video_id = ?').run(payload.videoId)
    db.prepare('DELETE FROM collection_videos WHERE video_id = ?').run(payload.videoId)
    db.prepare('DELETE FROM jobs WHERE video_id = ?').run(payload.videoId)
    db.prepare('UPDATE downloads SET video_id = NULL WHERE video_id = ?').run(payload.videoId)
    db.prepare('DELETE FROM videos WHERE id = ?').run(payload.videoId)

    return { ok: true, removedPath: row.file_path }
  })

  // Import/Export handlers
  const metadataService = new MetadataService()
  const importExportService = new ImportExportService(db, metadataService)

  ipcMain.handle('library/select-import-files', async () => {
    const focusedWindow = BrowserWindow.getFocusedWindow()
    const dialogOptions: Electron.OpenDialogOptions = {
      properties: ['openFile', 'multiSelections'],
      filters: [
        {
          name: 'Video Files',
          extensions: ['mp4', 'mkv', 'mov', 'webm', 'avi', 'flv', 'm4v', 'wmv', 'mpg', 'mpeg']
        }
      ]
    }
    const result = focusedWindow
      ? await dialog.showOpenDialog(focusedWindow, dialogOptions)
      : await dialog.showOpenDialog(dialogOptions)

    if (result.canceled || result.filePaths.length === 0) {
      return { ok: false, canceled: true }
    }

    return { ok: true, paths: result.filePaths }
  })

  ipcMain.handle(
    'library/export-videos',
    async (
      event,
      payload: {
        videoIds: string[]
        destinationDir: string
      }
    ) => {
      if (!payload?.videoIds?.length || !payload.destinationDir) {
        return { ok: false, error: 'Missing required parameters' }
      }

      const sender = event.sender

      try {
        const result = await importExportService.exportVideos(
          { videoIds: payload.videoIds, destinationDir: payload.destinationDir },
          (progress) => {
            sender.send('library/import-export-event', {
              operationType: 'export',
              ...progress
            })
          }
        )

        return {
          ok: true,
          exportedCount: result.exportedCount,
          failedCount: result.failedCount,
          errors: result.errors
        }
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : 'Export failed' }
      }
    }
  )

  ipcMain.handle(
    'library/import-videos',
    async (
      event,
      payload: {
        filePaths: string[]
      }
    ) => {
      if (!payload?.filePaths?.length) {
        return { ok: false, error: 'No files provided' }
      }

      // Get library folder from settings or use download path
      const libraryDir =
        getSetting(db, 'library_import_folder') ??
        getSetting(db, 'download_path') ??
        getDefaultDownloadPath()

      const sender = event.sender

      try {
        const result = await importExportService.importVideos(
          { filePaths: payload.filePaths, libraryDir },
          (progress) => {
            sender.send('library/import-export-event', {
              operationType: 'import',
              ...progress
            })
          }
        )

        return {
          ok: true,
          importedCount: result.importedCount,
          skippedCount: result.skippedCount,
          failedCount: result.failedCount,
          errors: result.errors
        }
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : 'Import failed' }
      }
    }
  )
}

function getDefaultDownloadPath(): string {
  return app.getPath('downloads')
}

async function removeFile(filePath: string, secureDelete: boolean): Promise<void> {
  if (!secureDelete) {
    try {
      await unlink(filePath)
    } catch (error) {
      if (isMissingFileError(error)) {
        return
      }
      throw error
    }
    return
  }

  let info
  try {
    info = await stat(filePath)
  } catch (error) {
    if (isMissingFileError(error)) {
      return
    }
    throw error
  }
  if (info.size <= 0) {
    try {
      await unlink(filePath)
    } catch (error) {
      if (isMissingFileError(error)) {
        return
      }
      throw error
    }
    return
  }

  const handle = await open(filePath, 'r+')
  const buffer = Buffer.alloc(1024 * 1024)
  let offset = 0
  try {
    while (offset < info.size) {
      const chunkSize = Math.min(buffer.length, info.size - offset)
      randomFillSync(buffer, 0, chunkSize)
      await handle.write(buffer, 0, chunkSize, offset)
      offset += chunkSize
    }
    await handle.sync()
  } finally {
    await handle.close()
  }

  try {
    await unlink(filePath)
  } catch (error) {
    if (isMissingFileError(error)) {
      return
    }
    throw error
  }
}

function isMissingFileError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'ENOENT'
}

function formatVttTimestamp(seconds: number): string {
  const safe = Math.max(0, seconds)
  const hrs = Math.floor(safe / 3600)
  const mins = Math.floor((safe % 3600) / 60)
  const secs = Math.floor(safe % 60)
  const ms = Math.floor((safe - Math.floor(safe)) * 1000)
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`
}

function buildSingleCueVtt(transcript: string, duration: number): string {
  const end = formatVttTimestamp(duration)
  return `WEBVTT

00:00:00.000 --> ${end}
${transcript.trim()}
`
}
