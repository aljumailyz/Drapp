import { ipcMain } from 'electron'
import { randomUUID } from 'node:crypto'
import { getDatabase } from '../database'
import { QueueManager } from '../queue'
import type { DownloadWorker } from '../queue/workers/download.worker'
import { getSetting } from '../utils/settings'
import { getDownloadPath } from '../utils/paths'

type DownloadHandlerDeps = {
  downloadWorker?: DownloadWorker
}

type BatchResult = {
  url: string
  status: 'queued' | 'skipped' | 'error'
  reason?: string
  downloadId?: string
  jobId?: string
}

type DuplicateCheck = {
  exists: boolean
  source: 'downloads' | 'videos' | null
}

const parseBoolean = (value: string | null, fallback: boolean): boolean => {
  if (value === null) {
    return fallback
  }
  return value === '1' || value.toLowerCase() === 'true'
}

export function registerDownloadHandlers({ downloadWorker }: DownloadHandlerDeps = {}): void {
  const db = getDatabase()
  const queue = new QueueManager(db)
  const downloadExistsStmt = db.prepare('SELECT id FROM downloads WHERE url = ? LIMIT 1')
  const videoExistsStmt = db.prepare('SELECT id FROM videos WHERE source_url = ? LIMIT 1')

  const checkDuplicate = (url: string): DuplicateCheck => {
    const download = downloadExistsStmt.get(url) as { id?: string } | undefined
    if (download?.id) {
      return { exists: true, source: 'downloads' }
    }
    const video = videoExistsStmt.get(url) as { id?: string } | undefined
    if (video?.id) {
      return { exists: true, source: 'videos' }
    }
    return { exists: false, source: null }
  }

  ipcMain.handle('download/start', async (_event, url: string) => {
    const trimmed = url?.trim()
    if (!trimmed) {
      return { ok: false, error: 'invalid_url' }
    }

    const dedupeEnabled = parseBoolean(getSetting(db, 'download_dedupe_enabled'), true)
    if (dedupeEnabled) {
      const duplicate = checkDuplicate(trimmed)
      if (duplicate.exists) {
        return { ok: false, error: duplicate.source === 'videos' ? 'already_downloaded' : 'already_queued' }
      }
    }

    const downloadId = randomUUID()
    const jobId = randomUUID()
    const createdAt = new Date().toISOString()
    const outputDir = getSetting(db, 'download_path') ?? getDownloadPath()

    db.prepare(
      'INSERT INTO downloads (id, url, job_id, status, progress, speed, eta, output_path, downloader, created_at, updated_at, error_message) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(downloadId, trimmed, jobId, 'queued', 0, null, null, null, 'yt-dlp', createdAt, createdAt, null)

    queue.enqueue({
      id: jobId,
      type: 'download',
      payload: {
        downloadId,
        url: trimmed,
        outputDir
      }
    })

    return { ok: true, downloadId, jobId, status: 'queued' }
  })

  ipcMain.handle('download/list', async () => {
    const rows = db
      .prepare(
        'SELECT id, url, job_id, status, created_at, progress, speed, eta, output_path, updated_at, error_message, video_id FROM downloads ORDER BY created_at DESC'
      )
      .all() as Array<{
      id: string
      url: string
      job_id: string | null
      status: string
      created_at: string
      progress: number | null
      speed: string | null
      eta: string | null
      output_path: string | null
      updated_at: string | null
      error_message: string | null
      video_id: string | null
    }>
    return { ok: true, downloads: rows }
  })

  ipcMain.handle('download/cancel', async (_event, downloadId: string) => {
    const row = db
      .prepare('SELECT id, job_id, status FROM downloads WHERE id = ?')
      .get(downloadId) as { id: string; job_id: string | null; status: string } | undefined

    if (!row) {
      return { ok: false, error: 'not_found' }
    }

    if (row.status === 'completed') {
      return { ok: false, error: 'already_completed' }
    }

    const updatedAt = new Date().toISOString()
    db.prepare('UPDATE downloads SET status = ?, error_message = ?, updated_at = ? WHERE id = ?').run(
      'canceled',
      'canceled_by_user',
      updatedAt,
      row.id
    )

    if (row.job_id) {
      db.prepare('UPDATE jobs SET status = ?, updated_at = ?, error_message = ? WHERE id = ?').run(
        'canceled',
        updatedAt,
        'canceled_by_user',
        row.job_id
      )
    }

    if (downloadWorker) {
      downloadWorker.cancel(row.id)
    }

    return { ok: true, status: 'canceled' }
  })

  ipcMain.handle('download/retry', async (_event, downloadId: string) => {
    const row = db
      .prepare('SELECT id, url, status FROM downloads WHERE id = ?')
      .get(downloadId) as { id: string; url: string; status: string } | undefined

    if (!row) {
      return { ok: false, error: 'not_found' }
    }

    if (!['failed', 'canceled'].includes(row.status)) {
      return { ok: false, error: 'not_retryable' }
    }

    const jobId = randomUUID()
    const now = new Date().toISOString()
    const outputDir = getSetting(db, 'download_path') ?? getDownloadPath()

    db.prepare(
      'UPDATE downloads SET job_id = ?, status = ?, progress = ?, speed = NULL, eta = NULL, output_path = NULL, video_id = NULL, updated_at = ?, error_message = NULL WHERE id = ?'
    ).run(jobId, 'queued', 0, now, row.id)

    queue.enqueue({
      id: jobId,
      type: 'download',
      payload: {
        downloadId: row.id,
        url: row.url,
        outputDir
      }
    })

    return { ok: true, jobId, status: 'queued' }
  })

  ipcMain.handle('download/batch', async (_event, payload: { urls?: string[] }) => {
    if (!payload || !Array.isArray(payload.urls)) {
      return { ok: false, queued: 0, skipped: 0, failed: 0, results: [], error: 'invalid_payload' }
    }

    const outputDir = getSetting(db, 'download_path') ?? getDownloadPath()
    const dedupeEnabled = parseBoolean(getSetting(db, 'download_dedupe_enabled'), true)
    const seen = new Set<string>()
    const results: BatchResult[] = []
    let queued = 0
    let skipped = 0
    let failed = 0

    const insertStmt = db.prepare(
      'INSERT INTO downloads (id, url, job_id, status, progress, speed, eta, output_path, downloader, created_at, updated_at, error_message) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )

    for (const rawUrl of payload.urls) {
      const trimmed = typeof rawUrl === 'string' ? rawUrl.trim() : ''
      if (!trimmed) {
        skipped += 1
        results.push({ url: '', status: 'skipped', reason: 'empty' })
        continue
      }

      if (seen.has(trimmed)) {
        skipped += 1
        results.push({ url: trimmed, status: 'skipped', reason: 'duplicate_in_batch' })
        continue
      }
      seen.add(trimmed)

      if (dedupeEnabled) {
        const duplicate = checkDuplicate(trimmed)
        if (duplicate.exists) {
          skipped += 1
          results.push({
            url: trimmed,
            status: 'skipped',
            reason: duplicate.source === 'videos' ? 'already_downloaded' : 'already_queued'
          })
          continue
        }
      }

      try {
        const downloadId = randomUUID()
        const jobId = randomUUID()
        const createdAt = new Date().toISOString()

        insertStmt.run(downloadId, trimmed, jobId, 'queued', 0, null, null, null, 'yt-dlp', createdAt, createdAt, null)

        queue.enqueue({
          id: jobId,
          type: 'download',
          payload: {
            downloadId,
            url: trimmed,
            outputDir
          }
        })

        queued += 1
        results.push({ url: trimmed, status: 'queued', downloadId, jobId })
      } catch (error) {
        failed += 1
        results.push({
          url: trimmed,
          status: 'error',
          reason: error instanceof Error ? error.message : 'queue_failed'
        })
      }
    }

    return { ok: true, queued, skipped, failed, results }
  })
}
