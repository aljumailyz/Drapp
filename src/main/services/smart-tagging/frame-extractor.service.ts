import { spawn } from 'node:child_process'
import { mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { app } from 'electron'
import type { ExtractedFrame, FrameExtractionOptions } from '../../../shared/types/smart-tagging.types'
import { resolveBundledBinary } from '../../utils/binary'

export class FrameExtractorService {
  private ffmpegPath: string
  private ffprobePath: string

  constructor() {
    this.ffmpegPath = resolveBundledBinary('ffmpeg')
    this.ffprobePath = resolveBundledBinary('ffprobe')
  }

  async extractFrames(
    videoPath: string,
    videoId: string,
    options: Partial<FrameExtractionOptions> = {}
  ): Promise<ExtractedFrame[]> {
    const opts: FrameExtractionOptions = {
      maxFrames: 30,
      sceneChangeThreshold: 0.3,
      minIntervalMs: 1000,
      outputDir: join(app.getPath('userData'), 'frames', videoId),
      ...options
    }

    // Ensure output directory exists
    await mkdir(opts.outputDir, { recursive: true })

    // Get video duration first
    const duration = await this.getVideoDuration(videoPath)

    // Strategy: Use scene detection + uniform sampling fallback
    let frames = await this.extractWithSceneDetection(videoPath, opts)

    // If scene detection found too few frames, supplement with uniform sampling
    if (frames.length < opts.maxFrames / 2) {
      const existingTimestamps = new Set(frames.map(f => f.timestampMs))
      const uniformFrames = await this.extractUniformSamples(
        videoPath,
        opts,
        duration,
        opts.maxFrames - frames.length,
        existingTimestamps
      )
      frames = [...frames, ...uniformFrames]
    }

    // Sort by timestamp and limit
    frames.sort((a, b) => a.timestampMs - b.timestampMs)

    // Re-index after sorting
    return frames.slice(0, opts.maxFrames).map((frame, index) => ({
      ...frame,
      index
    }))
  }

  private async getVideoDuration(videoPath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const proc = spawn(this.ffprobePath, [
        '-v', 'quiet',
        '-show_entries', 'format=duration',
        '-of', 'json',
        videoPath
      ])

      let stdout = ''
      let stderr = ''

      proc.stdout.on('data', (data) => {
        stdout += data.toString()
      })

      proc.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      proc.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`ffprobe exited with code ${code}: ${stderr}`))
          return
        }
        try {
          const data = JSON.parse(stdout)
          const duration = parseFloat(data.format?.duration || '0')
          resolve(duration * 1000) // Convert to ms
        } catch (e) {
          reject(new Error(`Failed to parse ffprobe output: ${e}`))
        }
      })

      proc.on('error', reject)
    })
  }

  private async extractWithSceneDetection(
    videoPath: string,
    opts: FrameExtractionOptions
  ): Promise<ExtractedFrame[]> {
    const outputPattern = join(opts.outputDir, 'scene_%04d.jpg')

    // Use select filter with scene detection
    // The 'select' filter outputs frames where scene > threshold
    // We use showinfo to get timestamps
    // Scale down large frames to max 1280px width for reasonable base64 size
    const selectFilter = `select='gt(scene,${opts.sceneChangeThreshold})',scale='min(1280,iw):-2',showinfo`

    const args = [
      '-i', videoPath,
      '-vf', selectFilter,
      '-vsync', 'vfr',
      '-q:v', '3', // Slightly lower quality for smaller file size
      '-frames:v', String(opts.maxFrames),
      outputPattern
    ]

    return new Promise((resolve, reject) => {
      const proc = spawn(this.ffmpegPath, args)

      const frames: ExtractedFrame[] = []
      let frameIndex = 0
      let stderrBuffer = ''

      proc.stderr.on('data', (data) => {
        stderrBuffer += data.toString()

        // Parse showinfo output for timestamps
        // Format: [Parsed_showinfo_0 @ ...] n:0 pts:12345 pts_time:1.234567
        const lines = stderrBuffer.split('\n')
        stderrBuffer = lines.pop() || '' // Keep incomplete line in buffer

        for (const line of lines) {
          const ptsMatch = line.match(/pts_time:([\d.]+)/)
          if (ptsMatch) {
            const timestampSec = parseFloat(ptsMatch[1])
            frameIndex++
            frames.push({
              index: frameIndex - 1,
              timestampMs: Math.round(timestampSec * 1000),
              filePath: join(opts.outputDir, `scene_${String(frameIndex).padStart(4, '0')}.jpg`)
            })
          }
        }
      })

      proc.on('close', () => {
        // Scene detection might return 0 frames for static videos - that's ok
        resolve(frames)
      })

      proc.on('error', (err) => {
        // Don't reject - scene detection failure should fall back to uniform sampling
        console.warn('Scene detection failed:', err)
        resolve([])
      })
    })
  }

  private async extractUniformSamples(
    videoPath: string,
    opts: FrameExtractionOptions,
    durationMs: number,
    count: number,
    existingTimestamps: Set<number>
  ): Promise<ExtractedFrame[]> {
    const frames: ExtractedFrame[] = []

    if (count <= 0 || durationMs <= 0) {
      return frames
    }

    const interval = durationMs / (count + 1)

    for (let i = 1; i <= count; i++) {
      const timestampMs = Math.round(i * interval)

      // Skip if too close to an existing frame
      let tooClose = false
      for (const existing of existingTimestamps) {
        if (Math.abs(existing - timestampMs) < opts.minIntervalMs) {
          tooClose = true
          break
        }
      }
      if (tooClose) continue

      const outputPath = join(opts.outputDir, `uniform_${String(i).padStart(4, '0')}.jpg`)

      try {
        await this.extractSingleFrame(videoPath, timestampMs, outputPath)
        frames.push({
          index: frames.length,
          timestampMs,
          filePath: outputPath
        })
        existingTimestamps.add(timestampMs)
      } catch (error) {
        console.warn(`Failed to extract frame at ${timestampMs}ms:`, error)
        // Continue with other frames
      }
    }

    return frames
  }

  private async extractSingleFrame(
    videoPath: string,
    timestampMs: number,
    outputPath: string
  ): Promise<void> {
    const timestampSec = timestampMs / 1000

    return new Promise((resolve, reject) => {
      const proc = spawn(this.ffmpegPath, [
        '-ss', timestampSec.toFixed(3),
        '-i', videoPath,
        '-vf', "scale='min(1280,iw):-2'", // Scale down large frames
        '-vframes', '1',
        '-q:v', '3', // Slightly lower quality for smaller file size
        '-y',
        outputPath
      ])

      let stderr = ''
      proc.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      proc.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`Failed to extract frame: ${stderr}`))
        }
      })

      proc.on('error', reject)
    })
  }

  async getVideoMetadata(videoPath: string): Promise<{
    duration: number
    width: number
    height: number
    fps: number
    codec: string
  }> {
    return new Promise((resolve, reject) => {
      const proc = spawn(this.ffprobePath, [
        '-v', 'quiet',
        '-show_entries', 'format=duration:stream=width,height,r_frame_rate,codec_name',
        '-select_streams', 'v:0',
        '-of', 'json',
        videoPath
      ])

      let stdout = ''

      proc.stdout.on('data', (data) => {
        stdout += data.toString()
      })

      proc.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`ffprobe exited with code ${code}`))
          return
        }
        try {
          const data = JSON.parse(stdout)
          const stream = data.streams?.[0] || {}
          const format = data.format || {}

          // Parse frame rate (can be "30/1" or "29.97")
          let fps = 0
          if (stream.r_frame_rate) {
            const [num, den] = stream.r_frame_rate.split('/')
            fps = den ? parseInt(num) / parseInt(den) : parseFloat(num)
          }

          resolve({
            duration: parseFloat(format.duration || '0') * 1000,
            width: stream.width || 0,
            height: stream.height || 0,
            fps,
            codec: stream.codec_name || 'unknown'
          })
        } catch (e) {
          reject(new Error(`Failed to parse ffprobe output: ${e}`))
        }
      })

      proc.on('error', reject)
    })
  }

  async cleanup(videoId: string): Promise<void> {
    const frameDir = join(app.getPath('userData'), 'frames', videoId)
    try {
      await rm(frameDir, { recursive: true, force: true })
    } catch (error) {
      console.warn(`Failed to cleanup frames for ${videoId}:`, error)
    }
  }

  getFramesDirectory(videoId: string): string {
    return join(app.getPath('userData'), 'frames', videoId)
  }
}
