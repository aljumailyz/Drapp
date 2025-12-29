import { spawn, type ChildProcess } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { access, mkdir, stat, unlink } from 'node:fs/promises'
import { basename, dirname, extname, join } from 'node:path'
import { Logger } from '../../utils/logger'
import { resolveBundledBinary } from '../../utils/binary'
import { MetadataService, type MetadataResult } from '../library/metadata.service'
import {
  buildArchivalFFmpegArgs,
  describeArchivalSettings,
  estimateArchivalFileSize
} from './archival-command-builder'
import {
  detectAv1Encoders,
  getBestEncoder,
  type EncoderInfo
} from './encoder-detector'
import {
  DEFAULT_ARCHIVAL_CONFIG,
  detectHdr,
  getOptimalCrf,
  classifyError,
  type ArchivalBatchItem,
  type ArchivalBatchJob,
  type ArchivalEncodingConfig,
  type ArchivalProgressEvent,
  type ArchivalErrorType,
  type VideoSourceInfo
} from '../../../shared/types/archival.types'
import { platform } from 'node:os'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

export type ArchivalEventHandler = (event: ArchivalProgressEvent) => void

/**
 * Service for batch archival video encoding using SVT-AV1
 *
 * Key features:
 * - Processes multiple videos sequentially
 * - Auto-detects HDR and adjusts CRF accordingly
 * - Scene-aware keyframes (long GOPs without crossing scene cuts)
 * - Film grain synthesis for better compression
 * - Skips database entirely - outputs directly to specified folder
 */
export class ArchivalService {
  private readonly logger = new Logger('ArchivalService')
  private readonly metadata = new MetadataService()
  private activeJob: ArchivalBatchJob | null = null
  private activeProcess: ChildProcess | null = null
  private abortController: AbortController | null = null

  // ETA tracking
  private encodingStartTime: number = 0
  private speedSamples: number[] = []
  private readonly maxSpeedSamples = 10 // Moving average window

  constructor(private readonly onEvent?: ArchivalEventHandler) {}

  /**
   * Get available AV1 encoders
   * Useful for UI to show available options
   */
  async getAvailableEncoders(): Promise<EncoderInfo> {
    return detectAv1Encoders()
  }

  /**
   * Check if there's enough disk space for the encoding job
   * Returns estimated required space and available space
   */
  async checkDiskSpace(
    outputDir: string,
    inputPaths: string[]
  ): Promise<{
    ok: boolean
    requiredBytes: number
    availableBytes: number
    safetyMarginBytes: number
  }> {
    let totalInputSize = 0

    // Sum up all input file sizes
    for (const inputPath of inputPaths) {
      try {
        const inputStat = await stat(inputPath)
        totalInputSize += inputStat.size
      } catch {
        // File may not exist, skip
      }
    }

    // Estimate output size (assume 50% compression ratio as conservative estimate)
    // AV1 typically achieves 30-50% of original size, but we use 70% for safety
    const estimatedOutputSize = Math.ceil(totalInputSize * 0.7)

    // Add 10% safety margin for temp files and metadata
    const safetyMargin = Math.ceil(estimatedOutputSize * 0.1)
    const requiredSpace = estimatedOutputSize + safetyMargin

    try {
      const freeSpace = await this.getFreeDiskSpace(outputDir)
      return {
        ok: freeSpace >= requiredSpace,
        requiredBytes: requiredSpace,
        availableBytes: freeSpace,
        safetyMarginBytes: safetyMargin
      }
    } catch (error) {
      this.logger.warn('Could not check disk space', { error })
      // If we can't check, assume it's okay and let encoding fail if needed
      return {
        ok: true,
        requiredBytes: requiredSpace,
        availableBytes: Number.MAX_SAFE_INTEGER,
        safetyMarginBytes: safetyMargin
      }
    }
  }

  /**
   * Get free disk space for a given path
   * Uses platform-specific commands
   */
  private async getFreeDiskSpace(dirPath: string): Promise<number> {
    const os = platform()

    if (os === 'win32') {
      // Windows: use wmic or PowerShell
      // Handle both local paths (C:\...) and UNC paths (\\server\share\...)
      const driveMatch = dirPath.match(/^([A-Za-z]):/)
      const isUncPath = dirPath.startsWith('\\\\')

      if (driveMatch) {
        // Local drive path
        const driveLetter = driveMatch[1]
        try {
          const { stdout } = await execAsync(
            `powershell -Command "(Get-PSDrive ${driveLetter}).Free"`,
            { timeout: 5000 }
          )
          const freeBytes = parseInt(stdout.trim(), 10)
          if (!isNaN(freeBytes)) {
            return freeBytes
          }
        } catch {
          // Try wmic as fallback
          try {
            const { stdout } = await execAsync(
              `wmic logicaldisk where "DeviceID='${driveLetter}:'" get FreeSpace /value`,
              { timeout: 5000 }
            )
            const match = stdout.match(/FreeSpace=(\d+)/)
            if (match) {
              return parseInt(match[1], 10)
            }
          } catch {
            // Both methods failed
          }
        }
      } else if (isUncPath) {
        // UNC path - use fsutil or PowerShell with directory path
        try {
          // Escape backslashes for PowerShell
          const escapedPath = dirPath.replace(/\\/g, '\\\\')
          const { stdout } = await execAsync(
            `powershell -Command "(Get-PSDrive -PSProvider FileSystem | Where-Object { '${escapedPath}'.StartsWith($_.Root) } | Select-Object -First 1).Free"`,
            { timeout: 5000 }
          )
          const freeBytes = parseInt(stdout.trim(), 10)
          if (!isNaN(freeBytes)) {
            return freeBytes
          }
        } catch {
          // UNC path space check failed - fall through to throw
        }
      } else {
        // Relative path or other format - try to get current drive
        try {
          const { stdout } = await execAsync(
            `powershell -Command "(Get-PSDrive -PSProvider FileSystem | Where-Object { $_.Name -eq (Get-Location).Drive.Name } | Select-Object -First 1).Free"`,
            { timeout: 5000 }
          )
          const freeBytes = parseInt(stdout.trim(), 10)
          if (!isNaN(freeBytes)) {
            return freeBytes
          }
        } catch {
          // Fallback failed
        }
      }
    } else {
      // Unix-like (macOS, Linux): use df
      try {
        const { stdout } = await execAsync(`df -k "${dirPath}" | tail -1`, { timeout: 5000 })
        const parts = stdout.trim().split(/\s+/)
        // df -k returns KB, convert to bytes
        const freeKB = parseInt(parts[3], 10)
        if (!isNaN(freeKB)) {
          return freeKB * 1024
        }
      } catch {
        // df failed
      }
    }

    throw new Error('Could not determine free disk space')
  }

  /**
   * Start a batch archival job
   */
  async startBatch(
    inputPaths: string[],
    outputDir: string,
    configOverrides?: Partial<ArchivalEncodingConfig>
  ): Promise<ArchivalBatchJob> {
    if (this.activeJob && this.activeJob.status === 'running') {
      throw new Error('Another archival job is already running')
    }

    // Validate inputs
    if (!inputPaths || inputPaths.length === 0) {
      throw new Error('No input files provided')
    }

    if (!outputDir || outputDir.trim() === '') {
      throw new Error('No output directory provided')
    }

    // Validate output directory
    try {
      await mkdir(outputDir, { recursive: true })
    } catch (error) {
      throw new Error(`Failed to create output directory: ${outputDir}`)
    }

    // Pre-flight disk space check
    const diskCheck = await this.checkDiskSpace(outputDir, inputPaths)
    if (!diskCheck.ok) {
      const requiredGB = (diskCheck.requiredBytes / (1024 * 1024 * 1024)).toFixed(1)
      const availableGB = (diskCheck.availableBytes / (1024 * 1024 * 1024)).toFixed(1)
      throw new Error(
        `Not enough disk space. Need approximately ${requiredGB} GB but only ${availableGB} GB available.`
      )
    }

    // Build config
    const config: ArchivalEncodingConfig = {
      ...DEFAULT_ARCHIVAL_CONFIG,
      ...configOverrides,
      outputDir
    }

    // Auto-detect best encoder if the configured one isn't available
    const bestEncoder = await getBestEncoder(config.av1.encoder)
    if (!bestEncoder) {
      throw new Error(
        'No AV1 encoder available. The bundled FFmpeg does not support libaom-av1 or libsvtav1.'
      )
    }

    // Update config with the best available encoder
    if (bestEncoder !== config.av1.encoder) {
      this.logger.info(`Encoder ${config.av1.encoder} not available, using ${bestEncoder}`)
      config.av1 = { ...config.av1, encoder: bestEncoder }
    }

    // Create batch job
    const batchId = randomUUID()
    const items: ArchivalBatchItem[] = inputPaths.map((inputPath) => ({
      id: randomUUID(),
      inputPath,
      outputPath: this.buildOutputPath(inputPath, outputDir, config),
      status: 'queued',
      progress: 0
    }))

    // Handle duplicate filenames from different directories
    this.deduplicateOutputPaths(items)

    this.activeJob = {
      id: batchId,
      items,
      config,
      status: 'pending',
      totalItems: items.length,
      completedItems: 0,
      failedItems: 0,
      skippedItems: 0,
      createdAt: new Date().toISOString(),
      // Initialize batch-level tracking
      totalDurationSeconds: 0,
      processedDurationSeconds: 0,
      batchEtaSeconds: undefined,
      averageSpeed: undefined,
      estimatedTotalOutputBytes: diskCheck.requiredBytes,
      actualOutputBytes: 0
    }

    // Reset speed samples for new batch
    this.speedSamples = []

    // Start processing in background
    void this.processQueue()

    return this.activeJob
  }

  /**
   * Get current job status
   */
  getStatus(): ArchivalBatchJob | null {
    return this.activeJob
  }

  /**
   * Cancel the active batch job
   */
  cancel(): boolean {
    if (!this.activeJob || this.activeJob.status !== 'running') {
      return false
    }

    this.abortController?.abort()
    this.activeJob.status = 'cancelled'

    // Kill active FFmpeg process
    if (this.activeProcess) {
      // Use appropriate signal for platform
      if (platform() === 'win32') {
        this.activeProcess.kill() // Default signal, more reliable on Windows
      } else {
        this.activeProcess.kill('SIGTERM')
      }
      this.activeProcess = null
    }

    return true
  }

  /**
   * Preview the FFmpeg command for a single file
   */
  async previewCommand(
    inputPath: string,
    outputDir: string,
    configOverrides?: Partial<ArchivalEncodingConfig>
  ): Promise<{ command: string[]; description: string; sourceInfo: VideoSourceInfo }> {
    const config: ArchivalEncodingConfig = {
      ...DEFAULT_ARCHIVAL_CONFIG,
      ...configOverrides,
      outputDir
    }

    const sourceInfo = await this.analyzeVideo(inputPath)
    const outputPath = this.buildOutputPath(inputPath, outputDir, config)
    const command = buildArchivalFFmpegArgs(inputPath, outputPath, config, sourceInfo)
    const description = describeArchivalSettings(config, sourceInfo)

    return { command, description, sourceInfo }
  }

  /**
   * Get estimated output size for a video
   */
  async estimateSize(inputPath: string): Promise<{
    sourceInfo: VideoSourceInfo
    effectiveCrf: number
    estimatedMB: number
    minMB: number
    maxMB: number
  }> {
    const sourceInfo = await this.analyzeVideo(inputPath)
    const effectiveCrf = getOptimalCrf(sourceInfo)
    const estimate = estimateArchivalFileSize(sourceInfo, effectiveCrf)

    return {
      sourceInfo,
      effectiveCrf,
      ...estimate
    }
  }

  /**
   * Process the job queue
   */
  private async processQueue(): Promise<void> {
    if (!this.activeJob) return

    this.activeJob.status = 'running'
    this.activeJob.startedAt = new Date().toISOString()
    this.abortController = new AbortController()

    for (const item of this.activeJob.items) {
      if (this.abortController.signal.aborted) {
        item.status = 'cancelled'
        continue
      }

      try {
        await this.processItem(item)
      } catch (error) {
        this.logger.error('Failed to process item', {
          itemId: item.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const finalStatus = this.abortController.signal.aborted ? 'cancelled' : 'completed'
    this.activeJob.status = finalStatus
    this.activeJob.completedAt = new Date().toISOString()

    this.emitEvent({
      batchId: this.activeJob.id,
      itemId: '',
      kind: 'batch_complete',
      // Include final stats for UI
      processedItems: this.activeJob.completedItems,
      totalItems: this.activeJob.totalItems
    })

    this.abortController = null
  }

  /**
   * Process a single item in the batch
   */
  private async processItem(item: ArchivalBatchItem): Promise<void> {
    if (!this.activeJob) return

    item.status = 'analyzing'
    item.startedAt = new Date().toISOString()

    this.emitEvent({
      batchId: this.activeJob.id,
      itemId: item.id,
      kind: 'item_start',
      status: 'analyzing'
    })

    try {
      // Check if input exists
      await access(item.inputPath)

      // Get input file size
      const inputStat = await stat(item.inputPath)
      item.inputSize = inputStat.size

      // Analyze source video
      const sourceInfo = await this.analyzeVideo(item.inputPath)
      item.sourceInfo = sourceInfo

      // Determine effective CRF
      item.effectiveCrf = getOptimalCrf(sourceInfo)

      // Check if output already exists
      if (!this.activeJob.config.overwriteExisting) {
        try {
          await access(item.outputPath)
          this.logger.info('Skipping existing output', { outputPath: item.outputPath })
          item.status = 'skipped'
          this.activeJob.skippedItems++
          return
        } catch {
          // Output doesn't exist, proceed
        }
      }

      // Create output directory if needed
      await mkdir(dirname(item.outputPath), { recursive: true })

      // Start encoding
      item.status = 'encoding'

      this.emitEvent({
        batchId: this.activeJob.id,
        itemId: item.id,
        kind: 'item_progress',
        progress: 0,
        status: 'encoding',
        sourceInfo,
        effectiveCrf: item.effectiveCrf
      })

      await this.encodeVideo(item, sourceInfo)

      // Get output size and calculate compression ratio
      const outputStat = await stat(item.outputPath)
      item.outputSize = outputStat.size
      item.compressionRatio = item.inputSize ? item.inputSize / item.outputSize : undefined

      // Update batch-level tracking
      if (this.activeJob) {
        this.activeJob.actualOutputBytes = (this.activeJob.actualOutputBytes ?? 0) + item.outputSize
        if (sourceInfo.duration) {
          this.activeJob.processedDurationSeconds =
            (this.activeJob.processedDurationSeconds ?? 0) + sourceInfo.duration
        }
      }

      item.status = 'completed'
      item.completedAt = new Date().toISOString()
      item.progress = 100
      this.activeJob.completedItems++

      this.emitEvent({
        batchId: this.activeJob.id,
        itemId: item.id,
        kind: 'item_complete',
        progress: 100,
        status: 'completed',
        outputSize: item.outputSize,
        compressionRatio: item.compressionRatio
      })

      this.logger.info('Completed archival encoding', {
        input: basename(item.inputPath),
        output: basename(item.outputPath),
        ratio: item.compressionRatio?.toFixed(2)
      })

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      const errorType = (error as Error & { errorType?: ArchivalErrorType }).errorType ?? classifyError(message)

      item.status = 'failed'
      item.error = message
      item.errorType = errorType
      item.completedAt = new Date().toISOString()
      this.activeJob.failedItems++

      this.emitEvent({
        batchId: this.activeJob.id,
        itemId: item.id,
        kind: 'item_error',
        status: 'failed',
        error: message,
        errorType
      })

      this.logger.error('Failed to encode', {
        input: item.inputPath,
        error: message,
        errorType
      })
    }
  }

  /**
   * Analyze video to get source info
   */
  private async analyzeVideo(filePath: string): Promise<VideoSourceInfo> {
    const meta = await this.metadata.extract({ filePath })
    const extendedMeta = await this.getExtendedMetadata(filePath)

    const isHdr = detectHdr(
      extendedMeta.colorSpace,
      extendedMeta.hdrFormat,
      extendedMeta.bitDepth
    )

    return {
      width: meta.width ?? 1920,
      height: meta.height ?? 1080,
      frameRate: meta.fps ?? 30,
      duration: meta.duration ?? 0,
      bitDepth: extendedMeta.bitDepth,
      colorSpace: extendedMeta.colorSpace,
      hdrFormat: extendedMeta.hdrFormat,
      isHdr
    }
  }

  /**
   * Get extended metadata including HDR info
   */
  private async getExtendedMetadata(filePath: string): Promise<{
    bitDepth?: number
    colorSpace?: string
    hdrFormat?: string | null
  }> {
    const ffprobePath = resolveBundledBinary('ffprobe')

    return new Promise((resolve) => {
      const proc = spawn(ffprobePath, [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_streams',
        '-select_streams', 'v:0',
        filePath
      ])

      let stdout = ''
      proc.stdout.on('data', (data) => { stdout += data.toString() })

      proc.on('close', () => {
        try {
          const parsed = JSON.parse(stdout) as {
            streams?: Array<{
              bits_per_raw_sample?: string
              color_space?: string
              color_primaries?: string
              color_transfer?: string
              side_data_list?: Array<{
                side_data_type?: string
              }>
            }>
          }

          const stream = parsed.streams?.[0]
          if (!stream) {
            resolve({})
            return
          }

          // Detect bit depth
          const bitDepth = stream.bits_per_raw_sample
            ? parseInt(stream.bits_per_raw_sample, 10)
            : undefined

          // Build color space string from components
          const colorParts = [
            stream.color_primaries,
            stream.color_transfer,
            stream.color_space
          ].filter(Boolean)
          const colorSpace = colorParts.length > 0 ? colorParts.join('/') : undefined

          // Check for HDR metadata in side data
          let hdrFormat: string | null = null
          if (stream.side_data_list) {
            for (const sideData of stream.side_data_list) {
              if (sideData.side_data_type?.includes('HDR')) {
                hdrFormat = sideData.side_data_type
                break
              }
              if (sideData.side_data_type?.includes('Dolby')) {
                hdrFormat = 'Dolby Vision'
                break
              }
            }
          }

          // Infer HDR from transfer characteristics
          if (!hdrFormat && stream.color_transfer) {
            const transfer = stream.color_transfer.toLowerCase()
            if (transfer.includes('smpte2084') || transfer.includes('pq')) {
              hdrFormat = 'HDR10'
            } else if (transfer.includes('arib-std-b67') || transfer.includes('hlg')) {
              hdrFormat = 'HLG'
            }
          }

          resolve({ bitDepth, colorSpace, hdrFormat })
        } catch {
          resolve({})
        }
      })

      proc.on('error', () => resolve({}))
    })
  }

  /**
   * Encode video using FFmpeg with SVT-AV1
   */
  private encodeVideo(item: ArchivalBatchItem, sourceInfo: VideoSourceInfo): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.activeJob) {
        reject(new Error('No active job'))
        return
      }

      const ffmpegPath = resolveBundledBinary('ffmpeg')
      const batchId = this.activeJob.id
      const args = buildArchivalFFmpegArgs(
        item.inputPath,
        item.outputPath,
        this.activeJob.config,
        sourceInfo
      )

      // Add progress output
      args.unshift('-progress', 'pipe:1', '-nostats')

      this.logger.debug('Starting FFmpeg', { args: args.join(' ') })

      const proc = spawn(ffmpegPath, args, { stdio: ['ignore', 'pipe', 'pipe'] })
      this.activeProcess = proc

      // Initialize timing
      this.encodingStartTime = Date.now()
      const durationMs = (sourceInfo.duration ?? 0) * 1000
      const durationSeconds = sourceInfo.duration ?? 0
      let lastProgressUpdate = 0

      // Parse progress from stdout
      proc.stdout.on('data', (data: Buffer) => {
        const lines = data.toString().split('\n')
        let encodedTimeMs: number | null = null

        for (const line of lines) {
          // Parse out_time_ms for progress calculation
          if (line.startsWith('out_time_ms=')) {
            const timeMs = parseInt(line.split('=')[1], 10)
            if (!isNaN(timeMs)) {
              encodedTimeMs = timeMs
            }
          }
          // Also check out_time format (HH:MM:SS.mmm)
          if (line.startsWith('out_time=')) {
            const timeStr = line.split('=')[1]
            const timeMs = this.parseTimeToMs(timeStr)
            if (timeMs !== null) {
              encodedTimeMs = timeMs
            }
          }
        }

        if (encodedTimeMs !== null) {
          const now = Date.now()
          const elapsedMs = now - this.encodingStartTime
          const elapsedSeconds = elapsedMs / 1000

          // Calculate progress
          let progress: number
          if (durationMs > 0) {
            progress = Math.min(99, Math.max(0, Math.round((encodedTimeMs / durationMs) * 100)))
          } else {
            // Fallback: use frame-based progress if duration is 0
            // Estimate based on elapsed time and fps (assume we're making progress)
            progress = Math.min(99, Math.round(elapsedSeconds / 60)) // Cap at 99%, assume 1% per minute
          }

          // Calculate encoding speed (x realtime)
          const encodedSeconds = encodedTimeMs / 1000
          let speed = 0
          if (elapsedSeconds > 0) {
            speed = encodedSeconds / elapsedSeconds
            // Update speed samples for moving average
            this.speedSamples.push(speed)
            if (this.speedSamples.length > this.maxSpeedSamples) {
              this.speedSamples.shift()
            }
          }

          // Calculate average speed
          const avgSpeed = this.speedSamples.length > 0
            ? this.speedSamples.reduce((a, b) => a + b, 0) / this.speedSamples.length
            : speed

          // Calculate ETA for current item
          let itemEtaSeconds: number | undefined
          if (durationSeconds > 0 && avgSpeed > 0) {
            const remainingSeconds = durationSeconds - encodedSeconds
            itemEtaSeconds = remainingSeconds / avgSpeed
          }

          // Calculate batch ETA
          let batchEtaSeconds: number | undefined
          if (this.activeJob && avgSpeed > 0) {
            // Remaining duration for current item
            const currentItemRemaining = durationSeconds > 0
              ? Math.max(0, durationSeconds - encodedSeconds)
              : 0

            // Sum remaining items' durations (those still queued)
            // For items without duration info, estimate using average of known durations
            let remainingItemsDuration = 0
            let knownDurations: number[] = []
            let unknownCount = 0

            for (const i of this.activeJob.items) {
              if (i.status === 'queued') {
                if (i.sourceInfo?.duration) {
                  remainingItemsDuration += i.sourceInfo.duration
                  knownDurations.push(i.sourceInfo.duration)
                } else {
                  unknownCount++
                }
              }
            }

            // Estimate unknown durations using average of known ones, or current item's duration
            if (unknownCount > 0) {
              const avgDuration = knownDurations.length > 0
                ? knownDurations.reduce((a, b) => a + b, 0) / knownDurations.length
                : durationSeconds > 0
                  ? durationSeconds
                  : 300 // Default to 5 minutes if no info available
              remainingItemsDuration += avgDuration * unknownCount
            }

            const totalRemainingDuration = currentItemRemaining + remainingItemsDuration
            batchEtaSeconds = totalRemainingDuration / avgSpeed
          }

          // Update item tracking
          item.progress = progress
          item.encodingSpeed = avgSpeed
          item.etaSeconds = itemEtaSeconds
          item.elapsedSeconds = elapsedSeconds

          // Update batch-level tracking
          if (this.activeJob) {
            this.activeJob.averageSpeed = avgSpeed
            this.activeJob.batchEtaSeconds = batchEtaSeconds
          }

          // Throttle progress updates (every 500ms)
          if (now - lastProgressUpdate > 500) {
            lastProgressUpdate = now

            // Calculate batch progress (guard against division by zero)
            const processedItems = this.activeJob?.completedItems ?? 0
            const totalItems = Math.max(1, this.activeJob?.totalItems ?? 1)
            const batchProgress = Math.round(
              ((processedItems + progress / 100) / totalItems) * 100
            )

            this.emitEvent({
              batchId,
              itemId: item.id,
              kind: 'item_progress',
              progress,
              status: 'encoding',
              encodingSpeed: avgSpeed,
              itemEtaSeconds,
              batchEtaSeconds,
              elapsedSeconds,
              batchProgress,
              processedItems,
              totalItems
            })
          }
        }
      })

      // Capture stderr for error messages and logging
      let stderr = ''
      proc.stderr.on('data', (data: Buffer) => {
        const chunk = data.toString()
        stderr += chunk

        // Log stderr for debugging (limit to prevent log spam)
        if (stderr.length <= 8192) {
          this.logger.debug('FFmpeg stderr', { chunk: chunk.trim() })
        }

        // Keep only last 8KB for error extraction
        if (stderr.length > 8192) {
          stderr = stderr.slice(-8192)
        }
      })

      proc.on('close', (code) => {
        this.activeProcess = null

        if (code === 0) {
          resolve()
        } else if (this.abortController?.signal.aborted) {
          // Clean up partial output file on cancel
          void this.cleanupPartialOutput(item.outputPath)
          const error = new Error('Encoding cancelled')
          ;(error as Error & { errorType: ArchivalErrorType }).errorType = 'cancelled'
          reject(error)
        } else {
          // Clean up partial output file on error
          void this.cleanupPartialOutput(item.outputPath)

          // Log full stderr for debugging
          this.logger.error('FFmpeg encoding failed', {
            input: item.inputPath,
            exitCode: code,
            stderr: stderr.slice(-2048) // Last 2KB in log
          })

          // Extract meaningful error from stderr
          const errorMatch = stderr.match(/Error[^\n]*|error[^\n]*|Invalid[^\n]*|No space[^\n]*/i)
          const errorMsg = errorMatch ? errorMatch[0] : `FFmpeg exited with code ${code}`

          // Classify the error
          const errorType = classifyError(stderr || errorMsg)

          const error = new Error(errorMsg)
          ;(error as Error & { errorType: ArchivalErrorType }).errorType = errorType
          reject(error)
        }
      })

      proc.on('error', (error) => {
        this.activeProcess = null
        void this.cleanupPartialOutput(item.outputPath)

        // Classify the error
        const typedError = error as Error & { errorType?: ArchivalErrorType }
        typedError.errorType = classifyError(error.message)
        reject(typedError)
      })

      // Handle abort signal with proper cleanup
      const abortHandler = (): void => {
        // Use SIGKILL on Windows (SIGTERM may not work), SIGTERM on Unix
        if (platform() === 'win32') {
          proc.kill() // Default signal, more reliable on Windows
        } else {
          proc.kill('SIGTERM')
        }
      }

      if (this.abortController) {
        this.abortController.signal.addEventListener('abort', abortHandler, { once: true })
      }
    })
  }

  /**
   * Clean up partial output file on error/cancel
   */
  private async cleanupPartialOutput(outputPath: string): Promise<void> {
    try {
      await unlink(outputPath)
      this.logger.debug('Cleaned up partial output', { outputPath })
    } catch {
      // File may not exist, ignore
    }
  }

  /**
   * Parse time string (HH:MM:SS.mmm or HH:MM:SS) to milliseconds
   */
  private parseTimeToMs(timeStr: string): number | null {
    if (!timeStr || typeof timeStr !== 'string') return null

    // Try with milliseconds first: HH:MM:SS.mmm
    const matchWithMs = timeStr.match(/(\d+):(\d+):(\d+)\.(\d+)/)
    if (matchWithMs) {
      const hours = parseInt(matchWithMs[1], 10)
      const minutes = parseInt(matchWithMs[2], 10)
      const seconds = parseInt(matchWithMs[3], 10)
      const ms = parseInt(matchWithMs[4].padEnd(3, '0').slice(0, 3), 10)
      return (hours * 3600 + minutes * 60 + seconds) * 1000 + ms
    }

    // Try without milliseconds: HH:MM:SS
    const matchNoMs = timeStr.match(/(\d+):(\d+):(\d+)/)
    if (matchNoMs) {
      const hours = parseInt(matchNoMs[1], 10)
      const minutes = parseInt(matchNoMs[2], 10)
      const seconds = parseInt(matchNoMs[3], 10)
      return (hours * 3600 + minutes * 60 + seconds) * 1000
    }

    return null
  }

  /**
   * Build output path for a video, handling duplicates
   */
  private buildOutputPath(
    inputPath: string,
    outputDir: string,
    config: ArchivalEncodingConfig
  ): string {
    const inputName = basename(inputPath, extname(inputPath))
    const extension = config.container

    // Simple flat output structure
    return join(outputDir, `${inputName}.${extension}`)
  }

  /**
   * Deduplicate output paths to handle files with same name from different folders
   * Uses a set to track all used paths and finds unique suffixes
   */
  private deduplicateOutputPaths(items: ArchivalBatchItem[]): void {
    const usedPaths = new Set<string>()

    for (const item of items) {
      let outputPath = item.outputPath
      let counter = 1

      // Find a unique path
      while (usedPaths.has(outputPath)) {
        const ext = extname(item.outputPath)
        const base = item.outputPath.slice(0, -ext.length)
        outputPath = `${base}_${counter}${ext}`
        counter++
      }

      item.outputPath = outputPath
      usedPaths.add(outputPath)
    }
  }

  /**
   * Emit progress event
   */
  private emitEvent(event: ArchivalProgressEvent): void {
    this.onEvent?.(event)
  }
}
