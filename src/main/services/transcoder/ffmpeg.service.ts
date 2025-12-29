import { spawn } from 'node:child_process'
import { accessSync, constants } from 'node:fs'
import { Logger } from '../../utils/logger'
import { resolveBundledBinary } from '../../utils/binary'

export type TranscodeRequest = {
  inputPath: string
  outputPath: string
  args: string[]
  signal?: AbortSignal
  onProgress?: (outTimeMs: number) => void
  onLog?: (chunk: string) => void
}

export class FfmpegService {
  private readonly logger = new Logger('FfmpegService')

  async transcode(request: TranscodeRequest): Promise<void> {
    const binaryPath = resolveBundledBinary('ffmpeg')
    this.logger.info('transcode requested', { input: request.inputPath, output: request.outputPath })

    try {
      accessSync(binaryPath, constants.X_OK)
    } catch (error) {
      throw new Error(`ffmpeg not executable at ${binaryPath}`)
    }

    await new Promise<void>((resolve, reject) => {
      if (request.signal?.aborted) {
        const error = new Error('canceled')
        error.name = 'AbortError'
        reject(error)
        return
      }

      const child = spawn(
        binaryPath,
        ['-y', '-i', request.inputPath, ...request.args, '-progress', 'pipe:1', '-nostats', request.outputPath],
        {
          stdio: 'pipe'
        }
      )
      let stderr = ''
      let stdoutBuffer = ''
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

      child.stdout.on('data', (chunk: Buffer) => {
        stdoutBuffer += chunk.toString()
        const lines = stdoutBuffer.split('\n')
        stdoutBuffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) {
            continue
          }
          const [key, value] = trimmed.split('=')
          if (!value) {
            continue
          }
          if (key === 'out_time_ms') {
            const outTimeMs = Number.parseInt(value, 10)
            if (Number.isFinite(outTimeMs)) {
              request.onProgress?.(Math.floor(outTimeMs / 1000))
            }
          } else if (key === 'out_time') {
            const outTimeMs = this.parseOutTime(value)
            if (outTimeMs !== null) {
              request.onProgress?.(outTimeMs)
            }
          }
        }
      })

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
          finalize(new Error(stderr || `ffmpeg exited with code ${code ?? 'unknown'}`))
        }
      })
    })
  }

  private parseOutTime(value: string): number | null {
    const parts = value.trim().split(':')
    if (parts.length !== 3) {
      return null
    }
    const [hours, minutes, secondsRaw] = parts
    const seconds = Number.parseFloat(secondsRaw)
    const hrs = Number.parseInt(hours, 10)
    const mins = Number.parseInt(minutes, 10)
    if (!Number.isFinite(seconds) || !Number.isFinite(hrs) || !Number.isFinite(mins)) {
      return null
    }
    return Math.max(0, (hrs * 3600 + mins * 60 + seconds) * 1000)
  }
}
