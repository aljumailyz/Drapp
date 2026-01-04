import { spawn, type ChildProcess } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { access, mkdir, rename, rm, stat, unlink } from 'node:fs/promises'
import { basename, dirname, extname, join, parse } from 'node:path'
import { Logger } from '../../utils/logger'
import { resolveBundledBinary } from '../../utils/binary'
import { MetadataService, type MetadataResult } from '../library/metadata.service'
import { WhisperService } from '../transcription/whisper.service'
import {
  buildArchivalFFmpegArgs,
  buildTwoPassArgs,
  isTwoPassEnabled,
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
  type VideoSourceInfo,
  type PersistedArchivalState,
  type ArchivalQueueState
} from '../../../shared/types/archival.types'
import { ArchivalStatePersistence } from './archival-state-persistence'
import { detectCPUSIMDCapabilities, type CPUSIMDCapabilities } from '../hw-accel-detector'
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
  private readonly whisperService = new WhisperService()
  private readonly persistence = new ArchivalStatePersistence()
  private activeJob: ArchivalBatchJob | null = null
  private activeProcess: ChildProcess | null = null
  private abortController: AbortController | null = null
  private fillModeSeenOutputs: Set<string> | null = null

  // Pause/Resume state
  private isPaused: boolean = false
  private currentEncodingItemId: string | null = null

  // ETA tracking
  private encodingStartTime: number = 0
  private speedSamples: number[] = []
  private readonly maxSpeedSamples = 10 // Moving average window

  // CPU capabilities for SIMD optimizations (AVX-512, etc.)
  private cpuCapabilities: CPUSIMDCapabilities | null = null
  private cpuCapabilitiesDetected = false

  // Whisper model path getter (injected from outside)
  private whisperModelPathGetter: (() => string | null) | null = null
  // Whisper provider settings getter
  private whisperProviderGetter: (() => { provider: string; endpoint: string }) | null = null
  // Whisper GPU settings getter
  private whisperGpuEnabledGetter: (() => boolean) | null = null

  constructor(private readonly onEvent?: ArchivalEventHandler) {}

  /**
   * Detect and cache CPU SIMD capabilities
   * Called lazily on first encoding job
   */
  private async ensureCpuCapabilities(): Promise<CPUSIMDCapabilities | null> {
    if (this.cpuCapabilitiesDetected) {
      return this.cpuCapabilities
    }

    try {
      this.cpuCapabilities = await detectCPUSIMDCapabilities()
      this.cpuCapabilitiesDetected = true

      if (this.cpuCapabilities) {
        this.logger.info('CPU capabilities detected', {
          architecture: this.cpuCapabilities.architecture,
          avx512: this.cpuCapabilities.avx512,
          avx2: this.cpuCapabilities.avx2,
          neon: this.cpuCapabilities.neon,
          sve: this.cpuCapabilities.sve,
          model: this.cpuCapabilities.cpuModel
        })
      }
    } catch (error) {
      this.logger.warn('Failed to detect CPU capabilities', { error })
      this.cpuCapabilitiesDetected = true
    }

    return this.cpuCapabilities
  }

  /**
   * Set the function to get the Whisper model path from settings
   * This is called from the IPC handler to inject the settings getter
   */
  setWhisperModelPathGetter(getter: () => string | null): void {
    this.whisperModelPathGetter = getter
  }

  /**
   * Set the function to get the Whisper provider settings
   * This is called from the IPC handler to inject the settings getter
   */
  setWhisperProviderGetter(getter: () => { provider: string; endpoint: string }): void {
    this.whisperProviderGetter = getter
  }

  /**
   * Set the function to get the Whisper GPU enabled setting
   * GPU acceleration is only available on Apple Silicon (Metal)
   */
  setWhisperGpuEnabledGetter(getter: () => boolean): void {
    this.whisperGpuEnabledGetter = getter
  }

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
    configOverrides?: Partial<ArchivalEncodingConfig>,
    folderRoot?: string,
    relativePaths?: string[]
  ): Promise<ArchivalBatchJob> {
    if (this.activeJob && this.activeJob.status === 'running') {
      throw new Error('Another archival job is already running')
    }

    // Clear any old recovery state when starting a new batch
    await this.persistence.clearState()

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
    if (config.fillMode) {
      config.overwriteExisting = false
    }
    this.fillModeSeenOutputs = config.fillMode ? new Set<string>() : null

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
    const items: ArchivalBatchItem[] = inputPaths.map((inputPath, index) => ({
      id: randomUUID(),
      inputPath,
      outputPath: this.buildOutputPath(
        inputPath,
        outputDir,
        config,
        relativePaths?.[index]
      ),
      status: 'queued',
      progress: 0
    }))

    // Handle duplicate filenames from different directories
    if (!config.fillMode) {
      this.deduplicateOutputPaths(items)
    }

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

    // Clear persisted state on cancel
    void this.persistence.clearState()

    return true
  }

  /**
   * Pause the active batch job immediately
   * Kills the current FFmpeg process and saves state for later resume
   */
  async pause(): Promise<boolean> {
    if (!this.activeJob || this.activeJob.status !== 'running') {
      return false
    }

    this.logger.info('Pausing encoding job', { jobId: this.activeJob.id })

    // Set paused flag
    this.isPaused = true

    // Kill active FFmpeg process immediately
    if (this.activeProcess) {
      if (platform() === 'win32') {
        this.activeProcess.kill()
      } else {
        this.activeProcess.kill('SIGTERM')
      }
      this.activeProcess = null
    }

    // Clean up partial output for the interrupted item
    if (this.currentEncodingItemId) {
      const currentItem = this.activeJob.items.find(i => i.id === this.currentEncodingItemId)
      if (currentItem && currentItem.status === 'encoding') {
        // Clean up partial output
        await this.cleanupPartialOutput(currentItem.outputPath)
        // Reset item to queued so it will restart on resume
        currentItem.status = 'queued'
        currentItem.progress = 0
        currentItem.startedAt = undefined
        currentItem.encodingSpeed = undefined
        currentItem.etaSeconds = undefined
        currentItem.elapsedSeconds = undefined
      }
    }

    // Save state for recovery
    await this.saveCurrentState()

    // Emit pause event
    this.emitEvent({
      batchId: this.activeJob.id,
      itemId: '',
      kind: 'queue_paused',
      queueState: 'paused'
    })

    this.logger.info('Encoding job paused', { jobId: this.activeJob.id })
    return true
  }

  /**
   * Resume a paused batch job
   */
  async resume(): Promise<boolean> {
    if (!this.activeJob || !this.isPaused) {
      return false
    }

    this.logger.info('Resuming encoding job', { jobId: this.activeJob.id })

    // Clear pause flag
    this.isPaused = false

    // Re-check disk space before resuming
    const remainingInputPaths = this.activeJob.items
      .filter(i => i.status === 'queued')
      .map(i => i.inputPath)

    if (remainingInputPaths.length > 0) {
      const diskCheck = await this.checkDiskSpace(this.activeJob.config.outputDir, remainingInputPaths)
      if (!diskCheck.ok) {
        this.logger.error('Not enough disk space to resume', { diskCheck })
        this.isPaused = true // Re-pause
        throw new Error('Not enough disk space to resume encoding')
      }
    }

    // Emit resume event
    this.emitEvent({
      batchId: this.activeJob.id,
      itemId: '',
      kind: 'queue_resumed',
      queueState: 'running'
    })

    // Continue processing
    void this.processQueue()

    return true
  }

  /**
   * Check if a job is currently paused
   */
  getIsPaused(): boolean {
    return this.isPaused
  }

  /**
   * Check if there's a recoverable state from a previous crash or exit
   * Returns null if there's already an active job (nothing to recover)
   */
  async checkForRecovery(): Promise<PersistedArchivalState | null> {
    // If there's already an active job, no recovery needed
    if (this.activeJob && (this.activeJob.status === 'running' || this.isPaused)) {
      return null
    }

    try {
      const state = await this.persistence.loadState()
      if (state && state.job.status === 'running') {
        // Found an interrupted job
        this.logger.info('Found recoverable job state', {
          jobId: state.job.id,
          totalItems: state.job.totalItems,
          completedItems: state.job.completedItems,
          savedAt: state.savedAt
        })
        return state
      }
      return null
    } catch (error) {
      this.logger.warn('Failed to check for recovery state', { error })
      return null
    }
  }

  /**
   * Resume from a recovered state after crash/restart
   * Validates files and restarts the queue
   */
  async resumeFromRecovery(state: PersistedArchivalState): Promise<ArchivalBatchJob> {
    if (this.activeJob && this.activeJob.status === 'running') {
      throw new Error('Another archival job is already running')
    }

    this.logger.info('Resuming from recovery state', { jobId: state.job.id })

    // Restore job state
    this.activeJob = state.job

    // Reset interrupted item to queued and clean up partial outputs
    for (const item of this.activeJob.items) {
      if (item.status === 'encoding' || item.status === 'analyzing') {
        // Clean up any partial output
        await this.cleanupPartialOutput(item.outputPath)
        // Reset to queued
        item.status = 'queued'
        item.progress = 0
        item.startedAt = undefined
        item.encodingSpeed = undefined
        item.etaSeconds = undefined
        item.elapsedSeconds = undefined
      }

      // Validate source file still exists for queued items
      if (item.status === 'queued') {
        try {
          await access(item.inputPath)
        } catch {
          // Source file missing
          item.status = 'failed'
          item.error = 'Source file no longer exists'
          item.errorType = 'file_not_found'
          item.completedAt = new Date().toISOString()
          this.activeJob.failedItems++
          this.logger.warn('Source file missing during recovery', { inputPath: item.inputPath })
        }
      }
    }

    // Clean up any two-pass log files from interrupted encoding
    if (state.twoPassState) {
      try {
        await rm(state.twoPassState.passLogDir, { recursive: true, force: true })
        this.logger.debug('Cleaned up two-pass log files', { dir: state.twoPassState.passLogDir })
      } catch {
        // Ignore cleanup errors
      }
    }

    // Reset speed samples
    this.speedSamples = []
    this.isPaused = false

    // Validate output directory still exists and is accessible
    try {
      await access(this.activeJob.config.outputDir)
    } catch {
      this.activeJob = null
      throw new Error('Output directory no longer exists or is not accessible')
    }

    // Re-check disk space
    const remainingInputPaths = this.activeJob.items
      .filter(i => i.status === 'queued')
      .map(i => i.inputPath)

    if (remainingInputPaths.length > 0) {
      const diskCheck = await this.checkDiskSpace(this.activeJob.config.outputDir, remainingInputPaths)
      if (!diskCheck.ok) {
        this.activeJob = null
        throw new Error('Not enough disk space to resume encoding')
      }
    }

    // Start processing
    void this.processQueue()

    return this.activeJob
  }

  /**
   * Discard a recovered state and clean up
   */
  async discardRecovery(state: PersistedArchivalState): Promise<void> {
    this.logger.info('Discarding recovery state', { jobId: state.job.id })

    // Clean up partial outputs for any in-progress items
    for (const item of state.job.items) {
      if (item.status === 'encoding' || item.status === 'analyzing') {
        await this.cleanupPartialOutput(item.outputPath)
      }
    }

    // Clean up two-pass log files
    if (state.twoPassState) {
      try {
        await rm(state.twoPassState.passLogDir, { recursive: true, force: true })
      } catch {
        // Ignore cleanup errors
      }
    }

    // Clear persisted state
    await this.persistence.clearState()

    this.logger.info('Recovery state discarded')
  }

  /**
   * Check if there's an active job (running or paused)
   */
  hasActiveJob(): boolean {
    return this.activeJob !== null && (this.activeJob.status === 'running' || this.isPaused)
  }

  /**
   * Save current state for graceful shutdown or crash recovery
   */
  async saveCurrentState(): Promise<void> {
    if (!this.activeJob) return

    const state: PersistedArchivalState = {
      version: 1,
      savedAt: new Date().toISOString(),
      job: this.activeJob,
      currentItemId: this.currentEncodingItemId
    }

    await this.persistence.saveState(state)
    this.logger.debug('State saved', { jobId: this.activeJob.id })
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
   * Get batch info including total duration and existing files count
   * Used for pre-flight checks before starting encoding
   */
  async getBatchInfo(
    inputPaths: string[],
    outputDir: string
  ): Promise<{
    totalDurationSeconds: number
    totalInputBytes: number
    existingCount: number
  }> {
    let totalDurationSeconds = 0
    let totalInputBytes = 0
    let existingCount = 0

    // Check for all possible container formats
    const containerExtensions = ['mkv', 'mp4', 'webm']

    for (const inputPath of inputPaths) {
      try {
        // Get file size
        const inputStat = await stat(inputPath)
        totalInputBytes += inputStat.size

        // Get duration via quick metadata probe
        const meta = await this.metadata.extract({ filePath: inputPath })
        if (meta.duration) {
          totalDurationSeconds += meta.duration
        }

        // Check if output would already exist in any container format
        const inputName = basename(inputPath, extname(inputPath))
        for (const ext of containerExtensions) {
          const outputPath = join(outputDir, `${inputName}.${ext}`)
          try {
            await access(outputPath)
            existingCount++
            break // Count each input file only once even if multiple outputs exist
          } catch {
            // Output doesn't exist with this extension
          }
        }
      } catch {
        // Skip files we can't read
      }
    }

    return {
      totalDurationSeconds,
      totalInputBytes,
      existingCount
    }
  }

  /**
   * Process the job queue
   */
  private async processQueue(): Promise<void> {
    if (!this.activeJob) return

    this.activeJob.status = 'running'
    if (!this.activeJob.startedAt) {
      this.activeJob.startedAt = new Date().toISOString()
    }
    this.abortController = new AbortController()

    for (const item of this.activeJob.items) {
      // Skip already completed/failed/skipped items (for recovery)
      if (item.status === 'completed' || item.status === 'failed' || item.status === 'skipped') {
        continue
      }

      // Check if paused
      if (this.isPaused) {
        this.logger.info('Queue paused, stopping processing')
        this.abortController = null
        return // Exit without completing batch
      }

      if (this.abortController.signal.aborted) {
        item.status = 'cancelled'
        continue
      }

      // Track current encoding item
      this.currentEncodingItemId = item.id

      // Save state before starting item (for crash recovery)
      await this.saveCurrentState()

      try {
        await this.processItem(item)
      } catch (error) {
        this.logger.error('Failed to process item', {
          itemId: item.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }

      // Save state after item completes (for crash recovery)
      await this.saveCurrentState()
    }

    // Clear current encoding item
    this.currentEncodingItemId = null

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

    // Clear persisted state on successful completion
    await this.persistence.clearState()

    this.abortController = null
    this.fillModeSeenOutputs = null
    this.isPaused = false
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
      if (this.activeJob.config.fillMode) {
        const shouldSkip = await this.shouldSkipForFillMode(item.outputPath)
        if (shouldSkip) {
          this.logger.info('Skipping due to name conflict (fill mode)', {
            outputPath: item.outputPath
          })
          this.markItemSkipped(item)
          return
        }
      }

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
          this.markItemSkipped(item)
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

      // Check if output is larger than input
      const outputLarger = item.inputSize && item.outputSize > item.inputSize

      if (outputLarger && this.activeJob.config.deleteOutputIfLarger) {
        // Delete the larger output file
        await this.cleanupPartialOutput(item.outputPath)

        item.status = 'skipped'
        item.error = `Output (${this.formatBytes(item.outputSize)}) larger than input (${this.formatBytes(item.inputSize!)})`
        item.errorType = 'output_larger'
        item.outputDeleted = true // Mark that output was deleted
        item.completedAt = new Date().toISOString()
        this.activeJob.skippedItems++

        this.emitEvent({
          batchId: this.activeJob.id,
          itemId: item.id,
          kind: 'item_complete',
          progress: 100,
          status: 'skipped',
          error: item.error,
          errorType: 'output_larger',
          outputSize: item.outputSize,
          compressionRatio: item.compressionRatio
        })

        this.logger.info('Skipped - output larger than input', {
          input: basename(item.inputPath),
          inputSize: item.inputSize,
          outputSize: item.outputSize
        })

        return
      }

      // Update batch-level tracking
      if (this.activeJob) {
        this.activeJob.actualOutputBytes = (this.activeJob.actualOutputBytes ?? 0) + item.outputSize
        if (sourceInfo.duration) {
          this.activeJob.processedDurationSeconds =
            (this.activeJob.processedDurationSeconds ?? 0) + sourceInfo.duration
        }
      }

      // Extract thumbnail if enabled
      if (this.activeJob.config.extractThumbnail) {
        try {
          const thumbnailPath = await this.extractThumbnail(
            item.outputPath,
            sourceInfo,
            this.activeJob.config.thumbnailTimestamp
          )
          item.thumbnailPath = thumbnailPath
        } catch (thumbnailError) {
          // Log but don't fail the item if thumbnail extraction fails
          this.logger.warn('Thumbnail extraction failed, continuing without thumbnail', {
            input: item.inputPath,
            error: thumbnailError instanceof Error ? thumbnailError.message : 'Unknown error'
          })
        }
      }

      // Extract captions if enabled
      if (this.activeJob.config.extractCaptions) {
        try {
          const captionPath = await this.extractCaptions(
            item.outputPath,
            this.activeJob.config.captionLanguage
          )
          item.captionPath = captionPath
        } catch (captionError) {
          // Log but don't fail the item if caption extraction fails
          this.logger.warn('Caption extraction failed, continuing without captions', {
            input: item.inputPath,
            error: captionError instanceof Error ? captionError.message : 'Unknown error'
          })
        }
      }

      item.status = 'completed'
      item.completedAt = new Date().toISOString()
      item.progress = 100
      this.activeJob.completedItems++

      // Warn if output is larger but we kept it
      const warningMsg = outputLarger
        ? ` (WARNING: output larger than input)`
        : ''

      this.emitEvent({
        batchId: this.activeJob.id,
        itemId: item.id,
        kind: 'item_complete',
        progress: 100,
        status: 'completed',
        outputSize: item.outputSize,
        compressionRatio: item.compressionRatio,
        thumbnailPath: item.thumbnailPath,
        captionPath: item.captionPath
      })

      this.logger.info(`Completed archival encoding${warningMsg}`, {
        input: basename(item.inputPath),
        output: basename(item.outputPath),
        ratio: item.compressionRatio?.toFixed(2),
        outputLarger
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

    // Extract container format from file extension
    const container = extname(filePath).toLowerCase().replace('.', '') || undefined

    return {
      width: meta.width ?? 1920,
      height: meta.height ?? 1080,
      frameRate: meta.fps ?? 30,
      duration: meta.duration ?? 0,
      bitDepth: extendedMeta.bitDepth,
      colorSpace: extendedMeta.colorSpace,
      hdrFormat: extendedMeta.hdrFormat,
      isHdr,
      bitrate: meta.bitrate ?? undefined,
      videoCodec: extendedMeta.videoCodec,
      audioCodec: extendedMeta.audioCodec,
      container,
      // HDR10 static metadata
      masteringDisplay: extendedMeta.masteringDisplay,
      contentLightLevel: extendedMeta.contentLightLevel,
      // Individual color components for precise encoder configuration
      colorPrimaries: extendedMeta.colorPrimaries,
      colorTransfer: extendedMeta.colorTransfer,
      colorMatrix: extendedMeta.colorMatrix
    }
  }

  /**
   * Get extended metadata including HDR info, HDR10 static metadata, and audio codec
   */
  private async getExtendedMetadata(filePath: string): Promise<{
    bitDepth?: number
    colorSpace?: string
    hdrFormat?: string | null
    videoCodec?: string
    audioCodec?: string
    colorPrimaries?: string
    colorTransfer?: string
    colorMatrix?: string
    masteringDisplay?: import('../../../shared/types/archival.types').HdrMasteringDisplayMetadata
    contentLightLevel?: import('../../../shared/types/archival.types').HdrContentLightLevel
  }> {
    const ffprobePath = resolveBundledBinary('ffprobe')

    return new Promise((resolve) => {
      const proc = spawn(ffprobePath, [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_streams',
        '-show_frames', '-read_intervals', '%+#1', // Read first frame for side_data
        filePath
      ])

      let stdout = ''
      proc.stdout.on('data', (data) => { stdout += data.toString() })

      proc.on('close', () => {
        try {
          const parsed = JSON.parse(stdout) as {
            streams?: Array<{
              codec_type?: string
              codec_name?: string
              bits_per_raw_sample?: string
              color_space?: string
              color_primaries?: string
              color_transfer?: string
              side_data_list?: Array<{
                side_data_type?: string
                // Mastering display metadata
                red_x?: string
                red_y?: string
                green_x?: string
                green_y?: string
                blue_x?: string
                blue_y?: string
                white_point_x?: string
                white_point_y?: string
                min_luminance?: string
                max_luminance?: string
                // Content light level
                max_content?: number
                max_average?: number
              }>
            }>
            frames?: Array<{
              side_data_list?: Array<{
                side_data_type?: string
                red_x?: string
                red_y?: string
                green_x?: string
                green_y?: string
                blue_x?: string
                blue_y?: string
                white_point_x?: string
                white_point_y?: string
                min_luminance?: string
                max_luminance?: string
                max_content?: number
                max_average?: number
              }>
            }>
          }

          // Find video and audio streams
          const videoStream = parsed.streams?.find(s => s.codec_type === 'video')
          const audioStream = parsed.streams?.find(s => s.codec_type === 'audio')

          if (!videoStream) {
            resolve({ audioCodec: audioStream?.codec_name, videoCodec: undefined })
            return
          }

          // Get video codec
          const videoCodec = videoStream.codec_name

          // Detect bit depth
          const bitDepth = videoStream.bits_per_raw_sample
            ? parseInt(videoStream.bits_per_raw_sample, 10)
            : undefined

          // Store individual color components
          const colorPrimaries = videoStream.color_primaries
          const colorTransfer = videoStream.color_transfer
          const colorMatrix = videoStream.color_space

          // Build color space string from components (for backward compatibility)
          const colorParts = [colorPrimaries, colorTransfer, colorMatrix].filter(Boolean)
          const colorSpace = colorParts.length > 0 ? colorParts.join('/') : undefined

          // Check for HDR metadata in side data (both stream and frame level)
          let hdrFormat: string | null = null
          let masteringDisplay: import('../../../shared/types/archival.types').HdrMasteringDisplayMetadata | undefined
          let contentLightLevel: import('../../../shared/types/archival.types').HdrContentLightLevel | undefined

          // Combine side_data from stream and first frame
          const allSideData = [
            ...(videoStream.side_data_list || []),
            ...(parsed.frames?.[0]?.side_data_list || [])
          ]

          for (const sideData of allSideData) {
            const sideDataType = sideData.side_data_type?.toLowerCase() || ''

            // Detect HDR format
            if (sideDataType.includes('mastering display') || sideDataType.includes('hdr')) {
              if (!hdrFormat) hdrFormat = 'HDR10'

              // Extract mastering display metadata
              if (sideData.red_x && sideData.green_x && sideData.blue_x) {
                // ffprobe returns values as fractions like "13250/50000"
                const parseCoord = (val: string | undefined): number => {
                  if (!val) return 0
                  if (val.includes('/')) {
                    const [num, den] = val.split('/')
                    return Math.round((parseInt(num, 10) / parseInt(den, 10)) * 50000)
                  }
                  return parseInt(val, 10)
                }

                const parseLuminance = (val: string | undefined): number => {
                  if (!val) return 0
                  if (val.includes('/')) {
                    const [num, den] = val.split('/')
                    return parseInt(num, 10) / parseInt(den, 10)
                  }
                  return parseFloat(val)
                }

                masteringDisplay = {
                  redX: parseCoord(sideData.red_x),
                  redY: parseCoord(sideData.red_y),
                  greenX: parseCoord(sideData.green_x),
                  greenY: parseCoord(sideData.green_y),
                  blueX: parseCoord(sideData.blue_x),
                  blueY: parseCoord(sideData.blue_y),
                  whitePointX: parseCoord(sideData.white_point_x),
                  whitePointY: parseCoord(sideData.white_point_y),
                  maxLuminance: parseLuminance(sideData.max_luminance),
                  minLuminance: parseLuminance(sideData.min_luminance)
                }
              }
            }

            // Extract content light level
            if (sideDataType.includes('content light level')) {
              if (sideData.max_content !== undefined && sideData.max_average !== undefined) {
                contentLightLevel = {
                  maxCll: sideData.max_content,
                  maxFall: sideData.max_average
                }
              }
            }

            if (sideDataType.includes('dolby')) {
              hdrFormat = 'Dolby Vision'
            }
          }

          // Infer HDR from transfer characteristics if not detected from side data
          if (!hdrFormat && colorTransfer) {
            const transfer = colorTransfer.toLowerCase()
            if (transfer.includes('smpte2084') || transfer.includes('pq')) {
              hdrFormat = 'HDR10'
            } else if (transfer.includes('arib-std-b67') || transfer.includes('hlg')) {
              hdrFormat = 'HLG'
            }
          }

          // Get audio codec
          const audioCodec = audioStream?.codec_name

          resolve({
            bitDepth,
            colorSpace,
            hdrFormat,
            videoCodec,
            audioCodec,
            colorPrimaries,
            colorTransfer,
            colorMatrix,
            masteringDisplay,
            contentLightLevel
          })
        } catch {
          resolve({})
        }
      })

      proc.on('error', () => resolve({}))
    })
  }

  /**
   * Encode video using FFmpeg with SVT-AV1 or H.265
   * Supports both single-pass and two-pass encoding
   */
  private async encodeVideo(item: ArchivalBatchItem, sourceInfo: VideoSourceInfo): Promise<void> {
    if (!this.activeJob) {
      throw new Error('No active job')
    }

    const config = this.activeJob.config

    // Detect CPU capabilities for SIMD optimizations (AVX-512, etc.)
    const cpuCapabilities = await this.ensureCpuCapabilities()

    // Check if two-pass encoding is enabled
    if (isTwoPassEnabled(config)) {
      await this.encodeTwoPass(item, sourceInfo, cpuCapabilities)
    } else {
      await this.encodeSinglePass(item, sourceInfo, cpuCapabilities)
    }
  }

  /**
   * Perform two-pass encoding
   */
  private async encodeTwoPass(
    item: ArchivalBatchItem,
    sourceInfo: VideoSourceInfo,
    cpuCapabilities: CPUSIMDCapabilities | null
  ): Promise<void> {
    if (!this.activeJob) {
      throw new Error('No active job')
    }

    const config = this.activeJob.config
    const batchId = this.activeJob.id

    // Create temp directory for pass log files
    const passLogDir = join(dirname(item.outputPath), '.pass-logs')
    await mkdir(passLogDir, { recursive: true })

    try {
      // Build two-pass arguments (includes AVX-512 optimization when available)
      const twoPassArgs = buildTwoPassArgs(
        item.inputPath,
        item.outputPath,
        config,
        sourceInfo,
        passLogDir,
        cpuCapabilities
      )

      // ===== PASS 1 =====
      this.logger.info('Starting two-pass encoding - Pass 1', { input: basename(item.inputPath) })

      // Emit progress event for pass 1
      this.emitEvent({
        batchId,
        itemId: item.id,
        kind: 'item_progress',
        progress: 0,
        status: 'encoding'
      })

      await this.runFFmpegPass(item, sourceInfo, twoPassArgs.pass1, 1, batchId)

      // Check for cancellation between passes
      if (this.abortController?.signal.aborted) {
        throw new Error('Encoding cancelled')
      }

      // ===== PASS 2 =====
      this.logger.info('Starting two-pass encoding - Pass 2', { input: basename(item.inputPath) })

      await this.runFFmpegPass(item, sourceInfo, twoPassArgs.pass2, 2, batchId)

    } finally {
      // Clean up pass log files
      try {
        await rm(passLogDir, { recursive: true, force: true })
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Run a single FFmpeg pass (for two-pass encoding)
   */
  private runFFmpegPass(
    item: ArchivalBatchItem,
    sourceInfo: VideoSourceInfo,
    args: string[],
    passNumber: 1 | 2,
    batchId: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const ffmpegPath = resolveBundledBinary('ffmpeg')

      // Add progress output
      const fullArgs = ['-progress', 'pipe:1', '-nostats', ...args]

      // For pass 2, we need to clean up partial output on failure/cancel
      const isPass2 = passNumber === 2
      const outputPath = isPass2 ? item.outputPath : null

      this.logger.debug(`Starting FFmpeg pass ${passNumber}`, { args: fullArgs.join(' ') })

      const proc = spawn(ffmpegPath, fullArgs, { stdio: ['ignore', 'pipe', 'pipe'] })
      this.activeProcess = proc

      // Initialize timing
      const startTime = Date.now()
      const durationMs = (sourceInfo.duration ?? 0) * 1000
      const durationSeconds = sourceInfo.duration ?? 0
      let lastProgressUpdate = 0

      // Parse progress from stdout
      proc.stdout.on('data', (data: Buffer) => {
        const lines = data.toString().split('\n')
        let encodedTimeMs: number | null = null

        for (const line of lines) {
          if (line.startsWith('out_time_ms=')) {
            const timeMs = parseInt(line.split('=')[1], 10)
            if (!isNaN(timeMs)) {
              encodedTimeMs = timeMs
            }
          }
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
          const elapsedMs = now - startTime
          const elapsedSeconds = elapsedMs / 1000

          // Calculate progress for this pass (each pass is 50% of total for two-pass)
          let passProgress: number
          if (durationMs > 0) {
            passProgress = Math.min(99, Math.max(0, Math.round((encodedTimeMs / durationMs) * 100)))
          } else {
            passProgress = Math.min(99, Math.round(elapsedSeconds / 60))
          }

          // Overall progress: pass 1 is 0-50%, pass 2 is 50-100%
          const overallProgress = passNumber === 1
            ? Math.round(passProgress / 2)
            : 50 + Math.round(passProgress / 2)

          // Throttle progress updates
          if (now - lastProgressUpdate > 500) {
            lastProgressUpdate = now
            item.progress = overallProgress

            this.emitEvent({
              batchId,
              itemId: item.id,
              kind: 'item_progress',
              progress: overallProgress,
              status: 'encoding',
              elapsedSeconds
            })
          }
        }
      })

      // Capture stderr
      let stderr = ''
      proc.stderr.on('data', (data: Buffer) => {
        const chunk = data.toString()
        stderr += chunk
        if (stderr.length > 8192) {
          stderr = stderr.slice(-8192)
        }
      })

      proc.on('close', (code) => {
        this.activeProcess = null

        if (code === 0) {
          resolve()
        } else if (this.abortController?.signal.aborted) {
          // Clean up partial output file on cancel (pass 2 only)
          if (outputPath) {
            void this.cleanupPartialOutput(outputPath)
          }
          const error = new Error('Encoding cancelled')
          ;(error as Error & { errorType: ArchivalErrorType }).errorType = 'cancelled'
          reject(error)
        } else {
          // Clean up partial output file on error (pass 2 only)
          if (outputPath) {
            void this.cleanupPartialOutput(outputPath)
          }

          const errorPatterns = [
            /Error[^\n]*/i,
            /error[^\n]*/i,
            /Invalid[^\n]*/i
          ]

          let errorMsg = `FFmpeg pass ${passNumber} exited with code ${code}`
          for (const pattern of errorPatterns) {
            const match = stderr.match(pattern)
            if (match) {
              errorMsg = match[0].trim()
              break
            }
          }

          const errorType = classifyError(stderr || errorMsg)
          const error = new Error(errorMsg)
          ;(error as Error & { errorType: ArchivalErrorType }).errorType = errorType
          reject(error)
        }
      })

      proc.on('error', (error) => {
        this.activeProcess = null
        // Clean up partial output file on error (pass 2 only)
        if (outputPath) {
          void this.cleanupPartialOutput(outputPath)
        }
        const typedError = error as Error & { errorType?: ArchivalErrorType }
        typedError.errorType = classifyError(error.message)
        reject(typedError)
      })

      // Handle abort signal
      const abortHandler = (): void => {
        if (platform() === 'win32') {
          proc.kill()
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
   * Perform single-pass encoding (original implementation)
   */
  private encodeSinglePass(
    item: ArchivalBatchItem,
    sourceInfo: VideoSourceInfo,
    cpuCapabilities: CPUSIMDCapabilities | null
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.activeJob) {
        reject(new Error('No active job'))
        return
      }

      const ffmpegPath = resolveBundledBinary('ffmpeg')
      const batchId = this.activeJob.id
      // Build FFmpeg args (includes AVX-512 optimization when available for x265)
      const args = buildArchivalFFmpegArgs(
        item.inputPath,
        item.outputPath,
        this.activeJob.config,
        sourceInfo,
        cpuCapabilities
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
          // Look for common FFmpeg error patterns
          const errorPatterns = [
            /Error[^\n]*/i,
            /error[^\n]*/i,
            /Invalid[^\n]*/i,
            /No space[^\n]*/i,
            /Unknown encoder[^\n]*/i,
            /Encoder .* not found[^\n]*/i,
            /Option .* not found[^\n]*/i,
            /Unrecognized option[^\n]*/i,
            /Could not[^\n]*/i,
            /Cannot[^\n]*/i
          ]

          let errorMsg = `FFmpeg exited with code ${code}`
          for (const pattern of errorPatterns) {
            const match = stderr.match(pattern)
            if (match) {
              errorMsg = match[0].trim()
              break
            }
          }

          // Include last few lines of stderr for more context
          const stderrLines = stderr.trim().split('\n').filter(l => l.trim())
          const lastLines = stderrLines.slice(-3).join(' | ')
          if (lastLines && !errorMsg.includes(lastLines.slice(0, 50))) {
            errorMsg = `${errorMsg} - ${lastLines.slice(0, 200)}`
          }

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
   * Determine whether an item should be skipped in fill mode.
   * Fill mode avoids output name conflicts by skipping items that would collide.
   */
  private async shouldSkipForFillMode(outputPath: string): Promise<boolean> {
    if (!this.activeJob?.config.fillMode) return false

    if (!this.fillModeSeenOutputs) {
      this.fillModeSeenOutputs = new Set<string>()
    }

    const normalizedOutput = this.normalizeOutputPath(outputPath)
    if (this.fillModeSeenOutputs.has(normalizedOutput)) {
      return true
    }

    try {
      await access(outputPath)
      this.fillModeSeenOutputs.add(normalizedOutput)
      return true
    } catch {
      // Output doesn't exist, proceed
    }

    this.fillModeSeenOutputs.add(normalizedOutput)
    return false
  }

  /**
   * Mark an item as skipped and emit a completion event.
   */
  private markItemSkipped(item: ArchivalBatchItem): void {
    if (!this.activeJob) return

    item.status = 'skipped'
    item.completedAt = new Date().toISOString()
    this.activeJob.skippedItems++

    this.emitEvent({
      batchId: this.activeJob.id,
      itemId: item.id,
      kind: 'item_complete',
      progress: 100,
      status: 'skipped'
    })
  }

  private normalizeOutputPath(filePath: string): string {
    const normalized = filePath.replace(/\\/g, '/')
    return platform() === 'win32' ? normalized.toLowerCase() : normalized
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
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
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
   * Also handles the case where input and output would be the same file
   */
  private buildOutputPath(
    inputPath: string,
    outputDir: string,
    config: ArchivalEncodingConfig,
    relativePath?: string
  ): string {
    const inputName = basename(inputPath, extname(inputPath))
    const extension = config.container

    let outputPath: string

    // Preserve folder structure when enabled and relative path is provided
    if (config.preserveStructure && relativePath) {
      const relativeDir = dirname(relativePath)
      if (relativeDir && relativeDir !== '.') {
        outputPath = join(outputDir, relativeDir, `${inputName}.${extension}`)
      } else {
        outputPath = join(outputDir, `${inputName}.${extension}`)
      }
    } else {
      // Simple flat output structure
      outputPath = join(outputDir, `${inputName}.${extension}`)
    }

    // Check if output would be the same as input (FFmpeg can't edit in-place)
    // Normalize paths for comparison (handle case sensitivity on Windows)
    const normalizedInput = inputPath.toLowerCase().replace(/\\/g, '/')
    const normalizedOutput = outputPath.toLowerCase().replace(/\\/g, '/')

    if (normalizedInput === normalizedOutput) {
      // Add codec suffix to differentiate output from input
      const codecSuffix = config.codec === 'h265' ? '.hevc' : '.av1'
      outputPath = join(
        dirname(outputPath),
        `${inputName}${codecSuffix}.${extension}`
      )
    }

    return outputPath
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
   * Extract a thumbnail from the encoded video
   */
  private async extractThumbnail(
    videoPath: string,
    sourceInfo: VideoSourceInfo,
    thumbnailTimestamp?: number
  ): Promise<string> {
    // Check if cancelled before starting
    if (this.abortController?.signal.aborted) {
      throw new Error('Thumbnail extraction cancelled')
    }

    const ffmpegPath = resolveBundledBinary('ffmpeg')

    // Determine thumbnail timestamp
    // For custom timestamp, clamp to video duration
    // For auto, use 10% into video but handle very short videos
    const duration = sourceInfo.duration ?? 10
    let timestampSec: number
    if (thumbnailTimestamp !== undefined) {
      // Clamp custom timestamp to video duration (with small buffer)
      timestampSec = Math.min(thumbnailTimestamp, Math.max(0, duration - 0.1))
    } else {
      // Auto: 10% into video, but at least 0.5s and at most duration - 0.1s
      timestampSec = Math.min(Math.max(0.5, duration * 0.1), Math.max(0, duration - 0.1))
    }

    // Build thumbnail path next to video file
    const videoDir = dirname(videoPath)
    const videoName = basename(videoPath, extname(videoPath))
    const thumbnailPath = join(videoDir, `${videoName}.jpg`)

    return new Promise((resolve, reject) => {
      const args = [
        '-ss', String(timestampSec),
        '-i', videoPath,
        '-vf', "scale='min(480,iw)':-2",
        '-vframes', '1',
        '-q:v', '5',
        '-y',
        thumbnailPath
      ]

      this.logger.debug('Extracting thumbnail', { videoPath, thumbnailPath, timestampSec })

      const proc = spawn(ffmpegPath, args, { stdio: ['ignore', 'pipe', 'pipe'] })

      let stderr = ''
      proc.stderr.on('data', (data: Buffer) => {
        stderr += data.toString()
      })

      // Handle cancellation during extraction
      const abortHandler = (): void => {
        proc.kill()
        // Clean up partial thumbnail
        void unlink(thumbnailPath).catch(() => {})
      }
      this.abortController?.signal.addEventListener('abort', abortHandler, { once: true })

      proc.on('close', async (code) => {
        // Remove abort listener
        this.abortController?.signal.removeEventListener('abort', abortHandler)

        if (this.abortController?.signal.aborted) {
          // Clean up if cancelled
          await unlink(thumbnailPath).catch(() => {})
          reject(new Error('Thumbnail extraction cancelled'))
          return
        }

        if (code === 0) {
          this.logger.info('Thumbnail extracted', { thumbnailPath })
          resolve(thumbnailPath)
        } else {
          // Clean up failed/partial thumbnail
          await unlink(thumbnailPath).catch(() => {})
          this.logger.warn('Thumbnail extraction failed', { code, stderr: stderr.slice(-500) })
          reject(new Error(`Thumbnail extraction failed with code ${code}`))
        }
      })

      proc.on('error', async (error) => {
        // Remove abort listener
        this.abortController?.signal.removeEventListener('abort', abortHandler)
        // Clean up failed/partial thumbnail
        await unlink(thumbnailPath).catch(() => {})
        this.logger.warn('Thumbnail extraction error', { error: error.message })
        reject(error)
      })
    })
  }

  /**
   * Extract captions from video using Whisper (bundled or LM Studio)
   * Extracts audio, runs transcription, produces VTT subtitles
   */
  private async extractCaptions(
    videoPath: string,
    language?: string
  ): Promise<string> {
    // Check if cancelled before starting
    if (this.abortController?.signal.aborted) {
      throw new Error('Caption extraction cancelled')
    }

    // Get provider settings
    const providerSettings = this.whisperProviderGetter?.() ?? { provider: 'bundled', endpoint: '' }
    const useLmStudio = providerSettings.provider === 'lmstudio'

    // For bundled provider, verify model exists
    if (!useLmStudio) {
      const modelPath = this.whisperModelPathGetter?.()
      if (!modelPath) {
        throw new Error('Whisper model not configured. Please select a model in Settings.')
      }
      try {
        await access(modelPath)
      } catch {
        throw new Error(`Whisper model not found at: ${modelPath}`)
      }
    }

    const ffmpegPath = resolveBundledBinary('ffmpeg')

    // Build paths
    const videoDir = dirname(videoPath)
    const videoName = parse(videoPath).name
    // Use a unique temp name for audio to avoid conflicts
    const tempAudioName = `${videoName}_whisper_temp`
    const audioPath = join(videoDir, `${tempAudioName}.wav`)
    // WhisperService outputs files based on audio file basename, so VTT will be at:
    const vttOutputPath = join(videoDir, `${tempAudioName}.vtt`)
    const txtOutputPath = join(videoDir, `${tempAudioName}.txt`)
    // Final VTT path (renamed to match video name)
    const finalVttPath = join(videoDir, `${videoName}.vtt`)

    this.logger.info('Starting caption extraction', {
      videoPath,
      language,
      provider: useLmStudio ? 'lmstudio' : 'bundled'
    })

    try {
      // Step 1: Extract audio to WAV format for Whisper
      await this.extractAudioForWhisper(videoPath, audioPath, ffmpegPath)

      // Step 2: Run transcription based on provider
      if (useLmStudio) {
        await this.transcribeWithLmStudio(audioPath, finalVttPath, providerSettings.endpoint, language)
        // LM Studio writes directly to final path, no rename needed
        this.logger.info('Caption extraction completed (LM Studio)', { vttPath: finalVttPath })
        return finalVttPath
      } else {
        // Use bundled whisper
        const modelPath = this.whisperModelPathGetter?.()!
        const useGpu = this.whisperGpuEnabledGetter?.() ?? true // Default to GPU if available
        this.logger.info('Running Whisper transcription', { audioPath, modelPath, useGpu })

        await this.whisperService.transcribe({
          audioPath,
          modelPath,
          outputDir: videoDir,
          language: language || undefined,
          signal: this.abortController?.signal,
          useGpu,
          onLog: (chunk) => {
            this.logger.debug('Whisper output', { chunk: chunk.trim() })
          }
        })

        // Step 3: Rename VTT file to match video name
        try {
          // Check if final path already exists and remove it
          await unlink(finalVttPath).catch(() => {})
          // Rename temp VTT to final name
          await rename(vttOutputPath, finalVttPath)
        } catch (renameError) {
          // If rename fails, the temp VTT is still usable
          this.logger.warn('Failed to rename VTT file, using temp name', {
            from: vttOutputPath,
            to: finalVttPath,
            error: renameError instanceof Error ? renameError.message : 'Unknown'
          })
          // Return the temp path if rename failed
          this.logger.info('Caption extraction completed', { vttPath: vttOutputPath })
          return vttOutputPath
        }

        this.logger.info('Caption extraction completed', { vttPath: finalVttPath })
        return finalVttPath
      }
    } finally {
      // Clean up temporary files
      await unlink(audioPath).catch(() => {})
      await unlink(txtOutputPath).catch(() => {}) // Clean up .txt file too (bundled whisper)
      // Don't clean up vttOutputPath here - it's either renamed or returned
    }
  }

  /**
   * Extract audio from video to WAV format for Whisper transcription
   */
  private async extractAudioForWhisper(
    videoPath: string,
    audioPath: string,
    ffmpegPath: string
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const args = [
        '-i', videoPath,
        '-vn', // No video
        '-acodec', 'pcm_s16le', // 16-bit PCM
        '-ar', '16000', // 16kHz sample rate (required by Whisper)
        '-ac', '1', // Mono
        '-y', // Overwrite
        audioPath
      ]

      this.logger.debug('Extracting audio for transcription', { args: args.join(' ') })

      const proc = spawn(ffmpegPath, args, { stdio: ['ignore', 'pipe', 'pipe'] })

      let stderr = ''
      proc.stderr.on('data', (data: Buffer) => {
        stderr += data.toString()
      })

      // Handle cancellation during audio extraction
      const abortHandler = (): void => {
        proc.kill()
        void unlink(audioPath).catch(() => {})
      }
      this.abortController?.signal.addEventListener('abort', abortHandler, { once: true })

      proc.on('close', (code) => {
        this.abortController?.signal.removeEventListener('abort', abortHandler)

        if (this.abortController?.signal.aborted) {
          void unlink(audioPath).catch(() => {})
          reject(new Error('Caption extraction cancelled'))
          return
        }

        if (code === 0) {
          resolve()
        } else {
          void unlink(audioPath).catch(() => {})
          // Check for no audio stream
          if (stderr.includes('does not contain any stream') || stderr.includes('Output file is empty')) {
            reject(new Error('Video has no audio stream'))
          } else {
            reject(new Error(`Audio extraction failed with code ${code}`))
          }
        }
      })

      proc.on('error', (error) => {
        this.abortController?.signal.removeEventListener('abort', abortHandler)
        void unlink(audioPath).catch(() => {})
        reject(error)
      })
    })
  }

  /**
   * Transcribe audio using LM Studio's OpenAI-compatible API
   * Sends audio to the /v1/audio/transcriptions endpoint
   */
  private async transcribeWithLmStudio(
    audioPath: string,
    outputVttPath: string,
    endpoint: string,
    language?: string
  ): Promise<void> {
    const { readFile, writeFile } = await import('node:fs/promises')

    this.logger.info('Transcribing with LM Studio', { endpoint, audioPath })

    // Read the audio file
    const audioData = await readFile(audioPath)
    const audioBlob = new Blob([audioData], { type: 'audio/wav' })

    // Create form data for the OpenAI-compatible API
    const formData = new FormData()
    formData.append('file', audioBlob, 'audio.wav')
    formData.append('model', 'whisper-1') // LM Studio ignores this, uses loaded model
    formData.append('response_format', 'vtt') // Request VTT format directly
    if (language) {
      formData.append('language', language)
    }

    // Make the request with abort signal support
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      signal: this.abortController?.signal
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(`LM Studio transcription failed: ${response.status} ${response.statusText} - ${errorText}`)
    }

    // Get the VTT content
    const vttContent = await response.text()

    // Write VTT file
    await writeFile(outputVttPath, vttContent, 'utf-8')

    this.logger.info('LM Studio transcription completed', { outputVttPath })
  }

  /**
   * Emit progress event
   */
  private emitEvent(event: ArchivalProgressEvent): void {
    this.onEvent?.(event)
  }
}
