import type { Database } from 'better-sqlite3'
import { Logger } from '../utils/logger'

export type JobPayload = Record<string, unknown>

export type Job = {
  id: string
  type: string
  payload: JobPayload
  inputPath?: string
  outputPath?: string
  config?: Record<string, unknown>
  videoId?: string
  priority?: number
}

export class QueueManager {
  private readonly logger = new Logger('QueueManager')

  constructor(private readonly db: Database) {}

  enqueue(job: Job): void {
    const createdAt = new Date().toISOString()
    const payloadJson = JSON.stringify(job.payload)
    const configJson = job.config ? JSON.stringify(job.config) : null
    this.db
      .prepare(
        'INSERT INTO jobs (id, type, status, payload, created_at, updated_at, error_message, input_path, output_path, config_json, video_id, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .run(
        job.id,
        job.type,
        'queued',
        payloadJson,
        createdAt,
        createdAt,
        null,
        job.inputPath ?? null,
        job.outputPath ?? null,
        configJson,
        job.videoId ?? null,
        job.priority ?? 0
      )
    this.logger.info('job enqueued', { id: job.id, type: job.type })
  }
}
