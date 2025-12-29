import { spawn } from 'node:child_process'
import { accessSync, constants, mkdirSync, readFileSync } from 'node:fs'
import { basename, dirname, join, parse } from 'node:path'
import { Logger } from '../../utils/logger'
import { resolveBundledBinary } from '../../utils/binary'

export type TranscriptionRequest = {
  audioPath: string
  modelPath: string
  outputDir?: string
  language?: string
  signal?: AbortSignal
  onLog?: (chunk: string) => void
}

export class WhisperService {
  private readonly logger = new Logger('WhisperService')

  async transcribe(request: TranscriptionRequest): Promise<{ transcript: string; outputPath: string }> {
    this.logger.info('transcription requested', { audio: request.audioPath })
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

    await new Promise<void>((resolve, reject) => {
      if (request.signal?.aborted) {
        const error = new Error('canceled')
        error.name = 'AbortError'
        reject(error)
        return
      }

      const args = ['-m', request.modelPath, '-f', request.audioPath, '-otxt', '-ovtt', '-of', outputPrefix]
      if (request.language) {
        args.push('-l', request.language)
      }

      const child = spawn(binaryPath, args, { stdio: 'pipe' })
      let stderr = ''
      let settled = false

      const finalize = (error?: Error): void => {
        if (settled) {
          return
        }
        settled = true
        if (request.signal) {
          request.signal.removeEventListener('abort', onAbort)
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

      if (request.signal) {
        request.signal.addEventListener('abort', onAbort, { once: true })
      }

      child.stderr.on('data', (chunk: Buffer) => {
        const text = chunk.toString()
        request.onLog?.(text)
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
          finalize(new Error(stderr || `whisper exited with code ${code ?? 'unknown'}`))
        }
      })
    })

    const transcript = readFileSync(outputPath, 'utf-8')
    return {
      transcript,
      outputPath
    }
  }
}
