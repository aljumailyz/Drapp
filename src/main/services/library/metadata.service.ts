import { spawn } from 'node:child_process'
import { statSync } from 'node:fs'
import { Logger } from '../../utils/logger'
import { resolveBundledBinary } from '../../utils/binary'

export type MetadataRequest = {
  filePath: string
}

export type MetadataResult = {
  duration: number | null
  width: number | null
  height: number | null
  fps: number | null
  codec: string | null
  container: string | null
  bitrate: number | null
  fileSize: number | null
}

export class MetadataService {
  private readonly logger = new Logger('MetadataService')

  async extract(request: MetadataRequest): Promise<MetadataResult> {
    this.logger.info('metadata extraction requested', { file: request.filePath })
    const binaryPath = resolveBundledBinary('ffprobe')
    const args = ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', request.filePath]

    const raw = await new Promise<string>((resolve, reject) => {
      const child = spawn(binaryPath, args, { stdio: 'pipe' })
      let stdout = ''
      let stderr = ''

      child.stdout.on('data', (chunk: Buffer) => {
        stdout += chunk.toString()
      })

      child.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString()
      })

      child.on('error', (error) => {
        reject(error)
      })

      child.on('close', (code) => {
        if (code === 0) {
          resolve(stdout)
        } else {
          reject(new Error(stderr || `ffprobe exited with code ${code ?? 'unknown'}`))
        }
      })
    })

    const parsed = JSON.parse(raw) as {
      format?: { duration?: string; size?: string; bit_rate?: string; format_name?: string }
      streams?: Array<{
        codec_type?: string
        codec_name?: string
        width?: number
        height?: number
        avg_frame_rate?: string
        r_frame_rate?: string
      }>
    }

    const format = parsed.format ?? {}
    const streams = parsed.streams ?? []
    const videoStream = streams.find((stream) => stream.codec_type === 'video')

    const duration = this.parseFloatOrNull(format.duration)
    const bitrate = this.parseIntOrNull(format.bit_rate)
    const container = format.format_name ? format.format_name.split(',')[0] : null
    const fileSize = this.parseIntOrNull(format.size) ?? this.statSize(request.filePath)

    return {
      duration,
      width: videoStream?.width ?? null,
      height: videoStream?.height ?? null,
      fps: this.parseFps(videoStream?.avg_frame_rate ?? videoStream?.r_frame_rate),
      codec: videoStream?.codec_name ?? null,
      container,
      bitrate,
      fileSize
    }
  }

  private parseFloatOrNull(value?: string): number | null {
    if (!value) {
      return null
    }
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  private parseIntOrNull(value?: string): number | null {
    if (!value) {
      return null
    }
    const parsed = Number.parseInt(value, 10)
    return Number.isFinite(parsed) ? parsed : null
  }

  private parseFps(value?: string): number | null {
    if (!value) {
      return null
    }
    const [num, den] = value.split('/').map((part) => Number.parseFloat(part))
    if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0) {
      return null
    }
    return num / den
  }

  private statSize(filePath: string): number | null {
    try {
      return statSync(filePath).size
    } catch {
      return null
    }
  }
}
