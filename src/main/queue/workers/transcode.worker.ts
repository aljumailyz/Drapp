import type { Database } from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { Logger } from '../../utils/logger'
import { FfmpegService } from '../../services/transcoder'
import { MetadataService } from '../../services/library/metadata.service'

type JobRow = {
  id: string
  input_path: string | null
  output_path: string | null
  config_json: string | null
}

type TranscodeConfig = {
  args?: string[]
}

type ProcessingJobEvent = {
  jobId: string
  jobType: 'transcode'
  kind: 'progress' | 'log' | 'status' | 'result'
  progress?: number
  logTail?: string
  status?: string
  error?: string | null
  updatedAt?: string
  result?: Record<string, unknown> | null
}

export class TranscodeWorker {
  private readonly logger = new Logger('TranscodeWorker')
  private isRunning = false
  private timer: NodeJS.Timeout | null = null
  private activeJobId: string | null = null
  private activeAbort: AbortController | null = null

  constructor(
    private readonly db: Database,
    private readonly service: FfmpegService,
    private readonly metadata: MetadataService = new MetadataService(),
    private readonly onJobEvent?: (event: ProcessingJobEvent) => void
  ) {}

  start(pollMs = 5000): void {
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

  cancel(jobId: string): boolean {
    if (this.activeJobId === jobId && this.activeAbort) {
      this.activeAbort.abort()
      return true
    }

    const updatedAt = new Date().toISOString()
    const result = this.db
      .prepare("UPDATE jobs SET status = ?, updated_at = ?, error_message = ? WHERE id = ? AND status = 'queued'")
      .run('cancelled', updatedAt, 'canceled_by_user', jobId)
    if (result.changes > 0) {
      this.emit({
        jobId,
        kind: 'status',
        status: 'cancelled',
        error: 'canceled_by_user',
        updatedAt
      })
    }
    return result.changes > 0
  }

  private async tick(): Promise<void> {
    if (this.isRunning) {
      return
    }

    this.isRunning = true
    let job: JobRow | undefined

    try {
      job = this.db
        .prepare("SELECT id, input_path, output_path, config_json FROM jobs WHERE type = 'transcode' AND status = 'queued' ORDER BY created_at ASC LIMIT 1")
        .get() as JobRow | undefined

      if (!job) {
        return
      }

      if (!job.input_path || !job.output_path) {
        this.markJob(job.id, 'failed', 'missing_input_output')
        return
      }

      const config = this.safeParse(job.config_json)
      const args = config?.args ?? []
      const totalDurationMs = await this.getDurationMs(job.input_path)

      this.markJob(job.id, 'running')
      this.updateJobTimes(job.id, 'started_at')
      this.updateJobProgress(job.id, 1)

      const abortController = new AbortController()
      this.activeJobId = job.id
      this.activeAbort = abortController

      mkdirSync(dirname(job.output_path), { recursive: true })

      const jobId = job.id
      this.logger.info('processing transcode', { jobId })
      let lastProgress = 0
      let lastProgressAt = 0
      let logTail = ''
      let lastLogAt = 0
      await this.service.transcode({
        inputPath: job.input_path,
        outputPath: job.output_path,
        args,
        signal: abortController.signal,
        onProgress: (outTimeMs) => {
          if (!totalDurationMs) {
            return
          }
          const percent = Math.max(1, Math.min(99, Math.round((outTimeMs / totalDurationMs) * 100)))
          const now = Date.now()
          if (percent !== lastProgress && now - lastProgressAt > 750) {
            lastProgress = percent
            lastProgressAt = now
            this.updateJobProgress(jobId, percent)
          }
        },
        onLog: (chunk) => {
          logTail = this.appendLog(logTail, chunk)
          const now = Date.now()
          if (now - lastLogAt > 1000) {
            lastLogAt = now
            this.updateJobLog(jobId, logTail)
          }
        }
      })

      const outputMetadata = await this.safeOutputMetadata(job.output_path)
      this.db
        .prepare('UPDATE jobs SET result_json = ?, updated_at = ? WHERE id = ?')
        .run(JSON.stringify({ outputPath: job.output_path, metadata: outputMetadata }), new Date().toISOString(), job.id)
      this.emit({
        jobId: job.id,
        kind: 'result',
        result: { outputPath: job.output_path, metadata: outputMetadata }
      })

      this.markJob(job.id, 'completed')
      this.updateJobTimes(job.id, 'completed_at', 100)
      if (logTail) {
        this.updateJobLog(job.id, logTail)
      }
    } catch (error) {
      const message = this.errorMessage(error)
      if (job && this.isAbortError(error)) {
        this.markJob(job.id, 'cancelled', 'canceled_by_user')
      } else {
        this.logger.error('transcode failed', { error: message })
        if (job) {
          this.markJob(job.id, 'failed', message)
        }
      }
    } finally {
      this.activeJobId = null
      this.activeAbort = null
      this.isRunning = false
    }
  }

  private markJob(jobId: string, status: string, error?: string): void {
    const updatedAt = new Date().toISOString()
    this.db
      .prepare('UPDATE jobs SET status = ?, updated_at = ?, error_message = ? WHERE id = ?')
      .run(status, updatedAt, error ?? null, jobId)
    this.emit({
      jobId,
      kind: 'status',
      status,
      error: error ?? null,
      updatedAt
    })
  }

  private updateJobTimes(jobId: string, column: 'started_at' | 'completed_at', progress?: number): void {
    const updatedAt = new Date().toISOString()
    if (typeof progress === 'number') {
      this.db
        .prepare(`UPDATE jobs SET ${column} = ?, updated_at = ?, progress = ? WHERE id = ?`)
        .run(updatedAt, updatedAt, progress, jobId)
    } else {
      this.db.prepare(`UPDATE jobs SET ${column} = ?, updated_at = ? WHERE id = ?`).run(updatedAt, updatedAt, jobId)
    }
  }

  private updateJobProgress(jobId: string, progress: number): void {
    const updatedAt = new Date().toISOString()
    this.db
      .prepare('UPDATE jobs SET progress = ?, updated_at = ? WHERE id = ?')
      .run(progress, updatedAt, jobId)
    this.emit({
      jobId,
      kind: 'progress',
      progress,
      updatedAt
    })
  }

  private updateJobLog(jobId: string, logTail: string): void {
    const updatedAt = new Date().toISOString()
    this.db
      .prepare('UPDATE jobs SET log_tail = ?, updated_at = ? WHERE id = ?')
      .run(logTail, updatedAt, jobId)
    this.emit({
      jobId,
      kind: 'log',
      logTail,
      updatedAt
    })
  }

  private appendLog(current: string, chunk: string, maxLength = 8000): string {
    const next = `${current}${chunk}`
    if (next.length <= maxLength) {
      return next
    }
    return next.slice(-maxLength)
  }

  private async getDurationMs(filePath: string): Promise<number | null> {
    try {
      const metadata = await this.metadata.extract({ filePath })
      if (!metadata.duration || metadata.duration <= 0) {
        return null
      }
      return Math.round(metadata.duration * 1000)
    } catch (error) {
      this.logger.warn('failed to read duration for transcode progress', { error: this.errorMessage(error) })
      return null
    }
  }

  private async safeOutputMetadata(filePath: string): Promise<Record<string, number | string | null> | null> {
    try {
      const metadata = await this.metadata.extract({ filePath })
      return {
        duration: metadata.duration,
        width: metadata.width,
        height: metadata.height,
        fps: metadata.fps,
        codec: metadata.codec,
        container: metadata.container,
        bitrate: metadata.bitrate,
        fileSize: metadata.fileSize
      }
    } catch (error) {
      this.logger.warn('failed to read output metadata', { error: this.errorMessage(error) })
      return null
    }
  }

  private safeParse(config: string | null): TranscodeConfig | null {
    if (!config) {
      return null
    }
    try {
      return JSON.parse(config) as TranscodeConfig
    } catch (error) {
      this.logger.warn('invalid transcode config', { error: this.errorMessage(error) })
      return null
    }
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'unknown error'
  }

  private isAbortError(error: unknown): boolean {
    return error instanceof Error && (error.name === 'AbortError' || error.message === 'canceled')
  }

  private emit(event: Omit<ProcessingJobEvent, 'jobType'>): void {
    if (!this.onJobEvent) {
      return
    }
    this.onJobEvent({ jobType: 'transcode', ...event })
  }
}
