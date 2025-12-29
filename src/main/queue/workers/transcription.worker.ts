import type { Database } from 'better-sqlite3'
import { stat } from 'node:fs/promises'
import { basename, dirname, extname } from 'node:path'
import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { Logger } from '../../utils/logger'
import { WhisperService } from '../../services/transcription'
import { MetadataService } from '../../services/library/metadata.service'

type JobRow = {
  id: string
  input_path: string | null
  output_path: string | null
  config_json: string | null
  video_id: string | null
}

type TranscriptionConfig = {
  modelPath?: string
  language?: string
}

type ProcessingJobEvent = {
  jobId: string
  jobType: 'transcription'
  kind: 'progress' | 'log' | 'status' | 'result'
  progress?: number
  logTail?: string
  status?: string
  error?: string | null
  updatedAt?: string
  result?: Record<string, unknown> | null
}

export class TranscriptionWorker {
  private readonly logger = new Logger('TranscriptionWorker')
  private isRunning = false
  private timer: NodeJS.Timeout | null = null
  private activeJobId: string | null = null
  private activeAbort: AbortController | null = null

  constructor(
    private readonly db: Database,
    private readonly service: WhisperService,
    private readonly metadata: MetadataService = new MetadataService(),
    private readonly onJobEvent?: (event: ProcessingJobEvent) => void
  ) {}

  start(pollMs = 6000): void {
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
    let progressTimer: NodeJS.Timeout | null = null
    let logTail = ''
    let lastLogAt = 0

    try {
      job = this.db
        .prepare("SELECT id, input_path, output_path, config_json, video_id FROM jobs WHERE type = 'transcription' AND status = 'queued' ORDER BY created_at ASC LIMIT 1")
        .get() as JobRow | undefined

      if (!job) {
        return
      }

      if (!job.input_path) {
        this.markJob(job.id, 'failed', 'missing_input')
        return
      }

      const config = this.safeParse(job.config_json)
      const modelPath = config?.modelPath
      if (!modelPath) {
        this.markJob(job.id, 'failed', 'missing_model')
        return
      }

      this.markJob(job.id, 'running')
      this.updateJobTimes(job.id, 'started_at')
      this.updateJobProgress(job.id, 1)

      const abortController = new AbortController()
      this.activeJobId = job.id
      this.activeAbort = abortController

      const jobId = job.id
      progressTimer = await this.startProgressTimer(jobId, job.input_path, abortController.signal)
      const result = await this.service.transcribe({
        audioPath: job.input_path,
        modelPath,
        outputDir: job.output_path ? dirname(job.output_path) : undefined,
        language: config?.language,
        signal: abortController.signal,
        onLog: (chunk) => {
          logTail = this.appendLog(logTail, chunk)
          const now = Date.now()
          if (now - lastLogAt > 1000) {
            lastLogAt = now
            this.updateJobLog(jobId, logTail)
          }
        }
      })

      const videoId = job.video_id ?? this.findVideoId(job.input_path) ?? this.createVideo(job.input_path)
      this.db
        .prepare('UPDATE videos SET transcript = ?, updated_at = ? WHERE id = ?')
        .run(result.transcript, new Date().toISOString(), videoId)

      this.markJob(job.id, 'completed')
      this.updateJobTimes(job.id, 'completed_at', 100)
      this.updateJobProgress(job.id, 100)
      const outputMeta = await this.safeTranscriptMeta(result.outputPath, result.transcript)
      const captionPath = this.resolveCaptionPath(result.outputPath)
      const resultPayload = {
        outputPath: result.outputPath,
        captionPath,
        ...outputMeta
      }
      this.db
        .prepare('UPDATE jobs SET result_json = ?, updated_at = ? WHERE id = ?')
        .run(JSON.stringify(resultPayload), new Date().toISOString(), job.id)
      this.emit({
        jobId: job.id,
        kind: 'result',
        result: resultPayload
      })
    } catch (error) {
      const message = this.errorMessage(error)
      if (job && this.isAbortError(error)) {
        this.markJob(job.id, 'cancelled', 'canceled_by_user')
      } else {
        this.logger.error('transcription failed', { error: message })
        if (job) {
          this.markJob(job.id, 'failed', message)
        }
      }
    } finally {
      if (progressTimer) {
        clearInterval(progressTimer)
      }
      if (job && logTail) {
        this.updateJobLog(job.id, logTail)
      }
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

  private async startProgressTimer(jobId: string, filePath: string, signal: AbortSignal): Promise<NodeJS.Timeout | null> {
    const durationMs = await this.getDurationMs(filePath)
    if (!durationMs) {
      return null
    }

    const startedAt = Date.now()
    const timer = setInterval(() => {
      if (signal.aborted) {
        clearInterval(timer)
        return
      }
      const elapsed = Date.now() - startedAt
      const percent = Math.min(95, Math.max(1, Math.round((elapsed / durationMs) * 100)))
      this.updateJobProgress(jobId, percent)
    }, 4000)

    return timer
  }

  private safeParse(config: string | null): TranscriptionConfig | null {
    if (!config) {
      return null
    }
    try {
      return JSON.parse(config) as TranscriptionConfig
    } catch (error) {
      this.logger.warn('invalid transcription config', { error: this.errorMessage(error) })
      return null
    }
  }

  private findVideoId(filePath: string): string | null {
    const row = this.db
      .prepare('SELECT id FROM videos WHERE file_path = ? ORDER BY created_at DESC LIMIT 1')
      .get(filePath) as { id?: string } | undefined
    return row?.id ?? null
  }

  private createVideo(filePath: string): string {
    const id = randomUUID()
    const fileName = basename(filePath)
    const title = fileName.replace(new RegExp(`${extname(fileName)}$`), '')
    const now = new Date().toISOString()
    this.db
      .prepare('INSERT INTO videos (id, file_path, file_name, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, filePath, fileName, title, now, now)
    return id
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'unknown error'
  }

  private isAbortError(error: unknown): boolean {
    return error instanceof Error && (error.name === 'AbortError' || error.message === 'canceled')
  }

  private async getDurationMs(filePath: string): Promise<number | null> {
    try {
      const metadata = await this.metadata.extract({ filePath })
      if (!metadata.duration || metadata.duration <= 0) {
        return null
      }
      return Math.round(metadata.duration * 1000)
    } catch (error) {
      this.logger.warn('failed to read duration for transcription progress', { error: this.errorMessage(error) })
      return null
    }
  }

  private async safeTranscriptMeta(outputPath: string, transcript: string): Promise<{ transcriptLength: number; outputSize: number | null }> {
    try {
      const info = await stat(outputPath)
      return { transcriptLength: transcript.length, outputSize: info.size }
    } catch {
      return { transcriptLength: transcript.length, outputSize: null }
    }
  }

  private resolveCaptionPath(outputPath: string): string | null {
    const vttPath = outputPath.replace(/\.txt$/i, '.vtt')
    if (vttPath !== outputPath && existsSync(vttPath)) {
      return vttPath
    }
    return null
  }

  private emit(event: Omit<ProcessingJobEvent, 'jobType'>): void {
    if (!this.onJobEvent) {
      return
    }
    this.onJobEvent({ jobType: 'transcription', ...event })
  }
}
