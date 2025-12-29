import { spawn } from 'node:child_process'
import { accessSync, constants } from 'node:fs'
import { basename, join } from 'node:path'
import { Logger } from '../../utils/logger'
import { resolveBundledBinary } from '../../utils/binary'
import { getDownloadPath } from '../../utils/paths'

export type DownloadProgress = {
  percent: number | null
  speed?: string
  eta?: string
}

export type DownloadRequest = {
  url: string
  outputPath?: string
  cookiesPath?: string
  headers?: Record<string, string>
  proxy?: string
  rateLimit?: string
  onProgress?: (progress: DownloadProgress) => void
  onDestination?: (path: string) => void
  signal?: AbortSignal
}

export type DownloadResult = {
  outputPath: string | null
  fileName: string | null
}

export class YtDlpService {
  private readonly logger = new Logger('YtDlpService')

  async download(request: DownloadRequest): Promise<DownloadResult> {
    const outputTemplate = request.outputPath ?? join(getDownloadPath(), '%(title)s.%(ext)s')
    const binaryPath = resolveBundledBinary('yt-dlp')
    let outputPath: string | null = null

    try {
      accessSync(binaryPath, constants.X_OK)
    } catch (error) {
      throw new Error(`yt-dlp not executable at ${binaryPath}`)
    }

    this.logger.info('download requested', { url: request.url, output: outputTemplate })

    await new Promise<void>((resolve, reject) => {
      if (request.signal?.aborted) {
        const error = new Error('canceled')
        error.name = 'AbortError'
        reject(error)
        return
      }

      const args = ['--no-playlist', '--newline', '-o', outputTemplate]
      if (request.cookiesPath) {
        args.push('--cookies', request.cookiesPath)
      }
      if (request.proxy) {
        args.push('--proxy', request.proxy)
      }
      if (request.rateLimit) {
        args.push('--limit-rate', request.rateLimit)
      }
      if (request.headers) {
        for (const [key, value] of Object.entries(request.headers)) {
          if (!key || typeof value !== 'string') {
            continue
          }
          args.push('--add-header', `${key}: ${value}`)
        }
      }
      args.push(request.url)
      const child = spawn(binaryPath, args, { stdio: 'pipe' })

      let stderr = ''
      let stdoutBuffer = ''
      let stderrBuffer = ''
      let settled = false

      const handleLine = (line: string): void => {
        const trimmed = line.trim()
        if (!trimmed) {
          return
        }

        const destination = this.extractDestination(trimmed)
        if (destination) {
          outputPath = destination
          request.onDestination?.(destination)
        }

        if (trimmed.startsWith('[download]')) {
          const percentMatch = trimmed.match(/(\d+(?:\.\d+)?)%/)
          const speedMatch = trimmed.match(/at\s+([0-9A-Za-z._-]+)\/s/i)
          const etaMatch = trimmed.match(/ETA\s+([0-9:]+)/i)

          const percent = percentMatch ? Number.parseFloat(percentMatch[1]) : null
          if (percentMatch || speedMatch || etaMatch) {
            request.onProgress?.({
              percent: Number.isFinite(percent) ? percent : null,
              speed: speedMatch?.[1],
              eta: etaMatch?.[1]
            })
          }
        }
      }

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

      const handleChunk = (chunk: Buffer, buffer: string, collectError: boolean): string => {
        const text = chunk.toString()
        if (collectError) {
          stderr += text
          if (stderr.length > 8000) {
            stderr = stderr.slice(-8000)
          }
        }

        const combined = buffer + text
        const lines = combined.split('\n')
        const remainder = lines.pop() ?? ''
        lines.forEach(handleLine)
        return remainder
      }

      child.stdout.on('data', (chunk: Buffer) => {
        stdoutBuffer = handleChunk(chunk, stdoutBuffer, false)
      })

      child.stderr.on('data', (chunk: Buffer) => {
        stderrBuffer = handleChunk(chunk, stderrBuffer, true)
      })

      child.on('error', (error) => {
        finalize(error)
      })

      child.on('close', (code) => {
        if (stdoutBuffer.trim()) {
          handleLine(stdoutBuffer)
        }
        if (stderrBuffer.trim()) {
          handleLine(stderrBuffer)
        }
        if (code === 0) {
          finalize()
        } else {
          finalize(new Error(stderr || `yt-dlp exited with code ${code ?? 'unknown'}`))
        }
      })
    })

    return {
      outputPath,
      fileName: outputPath ? basename(outputPath) : null
    }
  }

  private extractDestination(line: string): string | null {
    const destinationMatch = line.match(/Destination:\s(.+)$/)
    if (destinationMatch) {
      return destinationMatch[1].trim().replace(/^"|"$/g, '')
    }

    const mergeMatch = line.match(/Merging formats into\s+"(.+)"$/)
    if (mergeMatch) {
      return mergeMatch[1].trim()
    }

    return null
  }
}
