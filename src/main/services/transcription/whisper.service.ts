import { spawn } from 'node:child_process'
import { accessSync, constants, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { basename, dirname, join, parse } from 'node:path'
import { Logger } from '../../utils/logger'
import { resolveBundledBinary, detectBestWhisperBackend } from '../../utils/binary'

export type TranscriptionRequest = {
  audioPath: string
  modelPath: string
  outputDir?: string
  language?: string
  signal?: AbortSignal
  onLog?: (chunk: string) => void
  /**
   * Enable GPU acceleration (Metal on Apple Silicon)
   * When false, passes -ng flag to disable GPU
   * Only effective on Apple Silicon Macs with Metal-compiled whisper binary
   */
  useGpu?: boolean
  /**
   * For faster-whisper: model size name (tiny, base, small, medium, large-v3)
   * If not provided, will try to infer from modelPath
   */
  modelSize?: string
}

export class WhisperService {
  private readonly logger = new Logger('WhisperService')
  private cachedBackend: ReturnType<typeof detectBestWhisperBackend> | null = null

  /**
   * Get the best available whisper backend for this platform
   */
  getBackend(): ReturnType<typeof detectBestWhisperBackend> {
    if (!this.cachedBackend) {
      this.cachedBackend = detectBestWhisperBackend()
      this.logger.info('detected whisper backend', {
        backend: this.cachedBackend.backend,
        reason: this.cachedBackend.reason
      })
    }
    return this.cachedBackend
  }

  /**
   * Check if any whisper backend is available
   */
  isAvailable(): boolean {
    return this.getBackend().backend !== 'none'
  }

  async transcribe(request: TranscriptionRequest): Promise<{ transcript: string; outputPath: string }> {
    const backend = this.getBackend()

    this.logger.info('transcription requested', {
      audio: request.audioPath,
      backend: backend.backend,
      useGpu: request.useGpu ?? 'default'
    })

    if (backend.backend === 'none') {
      throw new Error(`No whisper backend available. ${backend.reason}`)
    }

    if (backend.backend === 'faster-whisper') {
      return this.transcribeWithFasterWhisper(request, backend.command!)
    }

    return this.transcribeWithWhisperCpp(request)
  }

  /**
   * Transcribe using whisper.cpp binary
   */
  private async transcribeWithWhisperCpp(
    request: TranscriptionRequest
  ): Promise<{ transcript: string; outputPath: string }> {
    const binaryPath = resolveBundledBinary('whisper')
    const outputDir = request.outputDir ?? dirname(request.audioPath)
    const baseName = parse(request.audioPath).name
    const outputPrefix = join(outputDir, baseName)
    const outputPath = `${outputPrefix}.txt`

    try {
      accessSync(binaryPath, constants.X_OK)
    } catch {
      throw new Error(`whisper not executable at ${binaryPath}`)
    }

    mkdirSync(outputDir, { recursive: true })

    await this.runProcess(
      binaryPath,
      this.buildWhisperCppArgs(request, outputPrefix),
      request.signal,
      request.onLog
    )

    // Verify output file was created
    if (!existsSync(outputPath)) {
      throw new Error(`Transcription completed but output file not found: ${outputPath}`)
    }

    const transcript = readFileSync(outputPath, 'utf-8')
    return { transcript, outputPath }
  }

  /**
   * Transcribe using faster-whisper (Python-based)
   */
  private async transcribeWithFasterWhisper(
    request: TranscriptionRequest,
    command: string[]
  ): Promise<{ transcript: string; outputPath: string }> {
    // Guard against empty command array
    if (command.length === 0) {
      throw new Error('faster-whisper command not configured')
    }

    const outputDir = request.outputDir ?? dirname(request.audioPath)
    const baseName = parse(request.audioPath).name
    const outputPath = join(outputDir, `${baseName}.txt`)

    mkdirSync(outputDir, { recursive: true })

    // Determine model - faster-whisper uses model names or paths
    const modelArg = this.resolveModelForFasterWhisper(request.modelPath, request.modelSize)

    const [cmd, ...baseArgs] = command
    const args = [
      ...baseArgs,
      request.audioPath,
      '--model', modelArg,
      '--output_dir', outputDir,
      '--output_format', 'txt'
    ]

    if (request.language) {
      args.push('--language', request.language)
    }

    // faster-whisper auto-detects GPU (CUDA/cuDNN), but we can force CPU if needed
    if (request.useGpu === false) {
      args.push('--device', 'cpu')
    }

    await this.runProcess(cmd, args, request.signal, request.onLog)

    // Verify output file was created
    if (!existsSync(outputPath)) {
      throw new Error(`Transcription completed but output file not found: ${outputPath}`)
    }

    const transcript = readFileSync(outputPath, 'utf-8')
    return { transcript, outputPath }
  }

  /**
   * Build arguments for whisper.cpp
   */
  private buildWhisperCppArgs(request: TranscriptionRequest, outputPrefix: string): string[] {
    const args = [
      '-m', request.modelPath,
      '-f', request.audioPath,
      '-otxt', '-ovtt',
      '-of', outputPrefix
    ]

    if (request.language) {
      args.push('-l', request.language)
    }

    // Disable GPU if explicitly set to false (default is to use GPU if available)
    if (request.useGpu === false) {
      args.push('-ng') // --no-gpu flag for whisper.cpp
    }

    return args
  }

  /**
   * Resolve model argument for faster-whisper
   * Can be a model size name (tiny, base, small, medium, large-v3) or a path
   */
  private resolveModelForFasterWhisper(modelPath: string, modelSize?: string): string {
    // If explicit model size provided, use it
    if (modelSize) {
      return modelSize
    }

    // Try to infer from model path
    const modelName = basename(modelPath).toLowerCase()

    // Common whisper model naming patterns
    const sizePatterns = [
      { pattern: /large-v3/i, size: 'large-v3' },
      { pattern: /large-v2/i, size: 'large-v2' },
      { pattern: /large/i, size: 'large' },
      { pattern: /medium/i, size: 'medium' },
      { pattern: /small/i, size: 'small' },
      { pattern: /base/i, size: 'base' },
      { pattern: /tiny/i, size: 'tiny' }
    ]

    for (const { pattern, size } of sizePatterns) {
      if (pattern.test(modelName)) {
        this.logger.info(`inferred model size '${size}' from path`)
        return size
      }
    }

    // If path exists as a directory, it might be a downloaded model
    if (existsSync(modelPath)) {
      return modelPath
    }

    // Default to base model
    this.logger.warn('could not infer model size, defaulting to base')
    return 'base'
  }

  /**
   * Run a process with abort signal support
   */
  private async runProcess(
    command: string,
    args: string[],
    signal?: AbortSignal,
    onLog?: (chunk: string) => void
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (signal?.aborted) {
        const error = new Error('canceled')
        error.name = 'AbortError'
        reject(error)
        return
      }

      const child = spawn(command, args, { stdio: 'pipe' })
      let stderr = ''
      let settled = false

      const finalize = (error?: Error): void => {
        if (settled) return
        settled = true
        if (signal) {
          signal.removeEventListener('abort', onAbort)
        }
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      }

      const onAbort = (): void => {
        child.kill()
        const error = new Error('canceled')
        error.name = 'AbortError'
        finalize(error)
      }

      if (signal) {
        signal.addEventListener('abort', onAbort, { once: true })
      }

      // Capture stdout for faster-whisper (it logs to stdout)
      child.stdout?.on('data', (chunk: Buffer) => {
        const text = chunk.toString()
        onLog?.(text)
      })

      child.stderr.on('data', (chunk: Buffer) => {
        const text = chunk.toString()
        onLog?.(text)
        stderr += text
        if (stderr.length > 8000) {
          stderr = stderr.slice(-8000)
        }
      })

      child.on('error', (error) => {
        finalize(error)
      })

      child.on('close', (code) => {
        if (code === 0) {
          finalize()
        } else {
          finalize(new Error(stderr || `process exited with code ${code ?? 'unknown'}`))
        }
      })
    })
  }
}
