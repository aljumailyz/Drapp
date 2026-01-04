import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import { randomUUID } from 'node:crypto'
import { spawn } from 'node:child_process'
import { dirname, join, parse } from 'node:path'
import { readFile, access, mkdir } from 'node:fs/promises'
import { getDatabase } from '../database'
import { QueueManager } from '../queue'
import { presets } from '../services/transcoder'
import { getSetting } from '../utils/settings'
import { detectHWAccelerators } from '../services/hw-accel-detector'
import { buildFFmpegArgs } from '../services/ffmpeg-command-builder'
import { MetadataService } from '../services/library/metadata.service'
import { FrameExtractorService } from '../services/smart-tagging/frame-extractor.service'
import { createLlmProvider } from '../services/llm/llm.factory'
import { resolveBundledBinary } from '../utils/binary'
import type { VideoEncodingConfig } from '../../shared/types/encoding.types'

type ProcessingDeps = {
  transcodeWorker?: import('../queue/workers/transcode.worker').TranscodeWorker
  transcriptionWorker?: import('../queue/workers/transcription.worker').TranscriptionWorker
}

export function registerProcessingHandlers(deps: ProcessingDeps = {}): void {
  const db = getDatabase()
  const queue = new QueueManager(db)

  ipcMain.handle('processing/presets', async () => {
    return {
      ok: true,
      presets: presets.map((preset) => ({
        id: preset.id,
        label: preset.label,
        description: preset.description,
        outputExtension: preset.outputExtension ?? null
      }))
    }
  })

  ipcMain.handle('processing/select-input', async () => {
    const focusedWindow = BrowserWindow.getFocusedWindow()
    const dialogOptions: Electron.OpenDialogOptions = {
      properties: ['openFile'],
      filters: [
        {
          name: 'Video files',
          extensions: ['mp4', 'mkv', 'mov', 'webm', 'avi', 'm4v']
        }
      ]
    }
    const result = focusedWindow
      ? await dialog.showOpenDialog(focusedWindow, dialogOptions)
      : await dialog.showOpenDialog(dialogOptions)

    if (result.canceled || result.filePaths.length === 0) {
      return { ok: false, canceled: true }
    }

    return { ok: true, path: result.filePaths[0] }
  })

  ipcMain.handle('processing/select-batch', async () => {
    const focusedWindow = BrowserWindow.getFocusedWindow()
    const dialogOptions: Electron.OpenDialogOptions = {
      properties: ['openFile', 'multiSelections'],
      filters: [
        {
          name: 'Video files',
          extensions: ['mp4', 'mkv', 'mov', 'webm', 'avi', 'm4v']
        }
      ]
    }
    const result = focusedWindow
      ? await dialog.showOpenDialog(focusedWindow, dialogOptions)
      : await dialog.showOpenDialog(dialogOptions)

    if (result.canceled || result.filePaths.length === 0) {
      return { ok: false, canceled: true }
    }

    return { ok: true, paths: result.filePaths }
  })

  ipcMain.handle(
    'processing/transcode',
    async (_event, request: { inputPath?: string; presetId?: string }) => {
      const inputPath = request.inputPath?.trim()
      if (!inputPath) {
        return { ok: false, error: 'missing_input' }
      }

      const preset = presets.find((item) => item.id === request.presetId) ?? presets[0]
      if (!preset) {
        return { ok: false, error: 'missing_preset' }
      }

      const parsed = parse(inputPath)
      const ext = preset.outputExtension ?? (parsed.ext || '.mp4')
      const outputPath = join(parsed.dir || dirname(inputPath), `${parsed.name}-transcoded${ext}`)

      const jobId = randomUUID()

      queue.enqueue({
        id: jobId,
        type: 'transcode',
        payload: {
          inputPath,
          outputPath,
          presetId: preset.id
        },
        inputPath,
        outputPath,
        config: {
          presetId: preset.id,
          args: preset.ffmpegArgs
        }
      })

      return { ok: true, jobId, outputPath }
    }
  )

  ipcMain.handle(
    'processing/transcribe',
    async (_event, request: { inputPath?: string; modelPath?: string; language?: string }) => {
      const inputPath = request.inputPath?.trim()
      if (!inputPath) {
        return { ok: false, error: 'missing_input' }
      }

      const modelPath = request.modelPath?.trim() ?? getSetting(db, 'whisper_model_path')
      if (!modelPath) {
        return { ok: false, error: 'missing_model' }
      }

      const parsed = parse(inputPath)
      const outputPath = join(parsed.dir || dirname(inputPath), `${parsed.name}.txt`)
      const jobId = randomUUID()

      queue.enqueue({
        id: jobId,
        type: 'transcription',
        payload: {
          inputPath,
          outputPath,
          modelPath,
          language: request.language
        },
        inputPath,
        outputPath,
        config: {
          modelPath,
          language: request.language
        }
      })

      return { ok: true, jobId, outputPath }
    }
  )

  ipcMain.handle('processing/list', async (_event, type?: string) => {
    const jobType = type ?? 'transcode'
    const rows = db
      .prepare(
        'SELECT id, status, input_path, output_path, progress, created_at, updated_at, error_message, log_tail, result_json FROM jobs WHERE type = ? ORDER BY created_at DESC'
      )
      .all(jobType) as Array<{
      id: string
      status: string
      input_path: string | null
      output_path: string | null
      progress: number | null
      created_at: string
      updated_at: string | null
      error_message: string | null
      log_tail: string | null
      result_json: string | null
    }>

    const jobs = rows.map((row) => ({
      ...row,
      result_json: row.result_json ? safeParse(row.result_json) : null
    }))

    return { ok: true, jobs }
  })

  ipcMain.handle('processing/details', async (_event, jobId: string) => {
    if (!jobId) {
      return { ok: false, error: 'missing_job_id' }
    }

    const row = db
      .prepare(
        'SELECT id, type, status, input_path, output_path, progress, created_at, updated_at, error_message, log_tail, result_json FROM jobs WHERE id = ?'
      )
      .get(jobId) as {
      id: string
      type: string
      status: string
      input_path: string | null
      output_path: string | null
      progress: number | null
      created_at: string
      updated_at: string | null
      error_message: string | null
      log_tail: string | null
      result_json: string | null
    } | undefined

    if (!row) {
      return { ok: false, error: 'job_not_found' }
    }

    const result = row.result_json ? safeParse(row.result_json) : null
    return {
      ok: true,
      job: {
        ...row,
        result_json: result
      }
    }
  })

  function safeParse(raw: string): Record<string, unknown> | null {
    try {
      return JSON.parse(raw) as Record<string, unknown>
    } catch {
      return null
    }
  }

  ipcMain.handle('processing/cancel', async (_event, jobId: string) => {
    if (!jobId) {
      return { ok: false, error: 'missing_job_id' }
    }

    const job = db
      .prepare('SELECT id, type, status FROM jobs WHERE id = ?')
      .get(jobId) as { id: string; type: string; status: string } | undefined

    if (!job) {
      return { ok: false, error: 'job_not_found' }
    }

    if (!['queued', 'running'].includes(job.status)) {
      return { ok: false, error: 'job_not_cancellable' }
    }

    if (job.status === 'queued') {
      const updatedAt = new Date().toISOString()
      db.prepare('UPDATE jobs SET status = ?, updated_at = ?, error_message = ? WHERE id = ?')
        .run('cancelled', updatedAt, 'canceled_by_user', jobId)
      return { ok: true }
    }

    if (job.type === 'transcode' && deps.transcodeWorker) {
      return { ok: deps.transcodeWorker.cancel(jobId) }
    }

    if (job.type === 'transcription' && deps.transcriptionWorker) {
      return { ok: deps.transcriptionWorker.cancel(jobId) }
    }

    return { ok: false, error: 'worker_unavailable' }
  })

  // Detect available hardware accelerators
  ipcMain.handle('processing/detect-hw-accel', async () => {
    try {
      const ffmpegPath = getSetting(db, 'ffmpeg_path') || 'ffmpeg'
      const result = await detectHWAccelerators(ffmpegPath)
      return {
        ok: true,
        available: result.available,
        recommended: result.recommended,
        platform: result.platform,
        gpuVendor: result.gpuVendor,
        gpuModel: result.gpuModel,
        cpuCapabilities: result.cpuCapabilities
      }
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to detect hardware acceleration'
      }
    }
  })

  // Preview FFmpeg command without executing
  ipcMain.handle(
    'processing/preview-command',
    async (_event, request: { inputPath?: string; config?: VideoEncodingConfig }) => {
      const inputPath = request.inputPath?.trim()
      if (!inputPath) {
        return { ok: false, error: 'missing_input' }
      }

      const config = request.config
      if (!config) {
        return { ok: false, error: 'missing_config' }
      }

      try {
        const parsed = parse(inputPath)
        const dir = parsed.dir || dirname(inputPath)
        const outputPath = join(dir, `${parsed.name}-encoded.${config.container}`)
        const args = buildFFmpegArgs(inputPath, outputPath, config)
        return { ok: true, command: args }
      } catch (error) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : 'Failed to build command'
        }
      }
    }
  )

  // Advanced transcode with full encoding config
  ipcMain.handle(
    'processing/advanced-transcode',
    async (_event, request: { inputPath?: string; config?: VideoEncodingConfig; outputDir?: string }) => {
      const inputPath = request.inputPath?.trim()
      if (!inputPath) {
        return { ok: false, error: 'missing_input' }
      }

      const config = request.config
      if (!config) {
        return { ok: false, error: 'missing_config' }
      }

      try {
        const parsed = parse(inputPath)
        const outputDir = request.outputDir || parsed.dir || dirname(inputPath)
        const outputPath = join(outputDir, `${parsed.name}-encoded.${config.container}`)

        const ffmpegArgs = buildFFmpegArgs(inputPath, outputPath, config)
        const jobId = randomUUID()

        queue.enqueue({
          id: jobId,
          type: 'transcode',
          payload: {
            inputPath,
            outputPath,
            presetId: 'custom',
            customArgs: ffmpegArgs
          },
          inputPath,
          outputPath,
          config: {
            presetId: 'custom',
            args: ffmpegArgs.slice(ffmpegArgs.indexOf('-i') + 2) // Args after input
          }
        })

        return { ok: true, jobId, outputPath, ffmpegCommand: ffmpegArgs }
      } catch (error) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : 'Failed to queue transcode'
        }
      }
    }
  )

  // Probe video file for metadata (duration, resolution, bitrate)
  const metadataService = new MetadataService()

  ipcMain.handle('processing/probe-video', async (_event, filePath: string) => {
    if (!filePath?.trim()) {
      return { ok: false, error: 'missing_file_path' }
    }

    try {
      const metadata = await metadataService.extract({ filePath: filePath.trim() })
      return {
        ok: true,
        metadata: {
          duration: metadata.duration,
          width: metadata.width,
          height: metadata.height,
          frameRate: metadata.fps,
          bitrate: metadata.bitrate,
          codec: metadata.codec,
          container: metadata.container,
          fileSize: metadata.fileSize
        }
      }
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to probe video'
      }
    }
  })

  // Vision-based video analysis - sends frames to a multimodal LLM for direct analysis
  const frameExtractor = new FrameExtractorService()

  ipcMain.handle(
    'processing/analyze-video-vision',
    async (
      _event,
      request: {
        videoPath: string
        maxFrames?: number
        prompt?: string
        visionModel?: string
      }
    ) => {
      const videoPath = request.videoPath?.trim()
      if (!videoPath) {
        return { ok: false, error: 'missing_video_path' }
      }

      const maxFrames = Math.min(request.maxFrames ?? 8, 20) // Limit to 20 frames max for API costs
      const customPrompt = request.prompt?.trim()

      // Get LLM settings early to fail fast
      const provider = (getSetting(db, 'llm_provider') as 'openrouter' | 'lmstudio' | null) ?? 'lmstudio'
      const apiKey = provider === 'openrouter' ? (getSetting(db, 'openrouter_api_key') ?? '') : ''
      const baseUrl = provider === 'lmstudio' ? (getSetting(db, 'lmstudio_url') ?? 'http://localhost:1234/v1') : undefined

      // Validate API key for OpenRouter
      if (provider === 'openrouter' && !apiKey) {
        return { ok: false, error: 'OpenRouter API key not configured. Go to Settings to add it.' }
      }

      // Get vision model - prefer user-specified, then use a default vision model
      let visionModel = request.visionModel?.trim()
      if (!visionModel) {
        if (provider === 'openrouter') {
          visionModel = 'anthropic/claude-3.5-sonnet' // Default vision-capable model
        } else {
          visionModel = getSetting(db, 'lmstudio_model') ?? 'auto'
        }
      }

      const llmClient = createLlmProvider(provider, { apiKey, baseUrl })

      if (!llmClient.completeWithVision) {
        return { ok: false, error: 'Vision not supported by current LLM provider' }
      }

      // Generate unique ID for this analysis session
      const videoId = `vision_${Date.now()}_${Math.random().toString(36).slice(2)}`

      try {
        // Extract frames from the video
        const frames = await frameExtractor.extractFrames(videoPath, videoId, {
          maxFrames,
          sceneChangeThreshold: 0.25, // Slightly lower threshold for more diverse frames
          minIntervalMs: 500
        })

        if (frames.length === 0) {
          await frameExtractor.cleanup(videoId)
          return { ok: false, error: 'Failed to extract frames from video' }
        }

        // Filter out frames that don't exist on disk (scene detection can report more than saved)
        const validFrames: typeof frames = []
        for (const frame of frames) {
          try {
            await access(frame.filePath)
            validFrames.push(frame)
          } catch {
            // Frame file doesn't exist, skip it
          }
        }

        if (validFrames.length === 0) {
          await frameExtractor.cleanup(videoId)
          return { ok: false, error: 'No valid frames could be extracted from video' }
        }

        // Convert frames to base64 (frames are already resized by ffmpeg during extraction)
        const imageContents = await Promise.all(
          validFrames.map(async (frame) => {
            const buffer = await readFile(frame.filePath)
            const base64 = buffer.toString('base64')
            return {
              type: 'image_url' as const,
              image_url: {
                url: `data:image/jpeg;base64,${base64}`
              }
            }
          })
        )

        // Build the prompt with images
        const systemPrompt = `You are a video analysis assistant. You will be shown ${validFrames.length} frames extracted from a video at different timestamps (in chronological order). Analyze the visual content comprehensively, paying attention to temporal progression.

Your task is to:
1. Describe what you see across all frames
2. Identify key subjects, objects, actions, and settings
3. Note any temporal patterns, scene changes, or narrative progression
4. Suggest relevant tags/keywords for categorizing this video

Be concise but thorough. Focus on factual observations.

IMPORTANT: End your response with a line starting with "Tags:" followed by comma-separated keywords.`

        const userPrompt = customPrompt || `Analyze these ${validFrames.length} sequential frames from a video.

Provide:
1. **Description**: A brief summary of what this video shows
2. **Content**: Key subjects, objects, actions, locations, and visual elements
3. **Progression**: How the content changes or develops across frames (if applicable)
4. **Tags**: A comma-separated list of relevant keywords for categorization

Format your tags line exactly as: Tags: keyword1, keyword2, keyword3`

        const content = [
          { type: 'text' as const, text: userPrompt },
          ...imageContents
        ]

        // Call the vision LLM
        const response = await llmClient.completeWithVision({
          content,
          model: visionModel,
          systemPrompt,
          temperature: 0.3,
          maxTokens: 1500
        })

        // Clean up extracted frames
        await frameExtractor.cleanup(videoId)

        // Parse response to extract tags if present
        const tags: string[] = []
        // Try multiple patterns to find tags
        const tagPatterns = [
          /tags?[:\s]*([^\n]+)/i,
          /suggested tags?[:\s]*([^\n]+)/i,
          /keywords?[:\s]*([^\n]+)/i
        ]
        for (const pattern of tagPatterns) {
          const match = response.match(pattern)
          if (match) {
            const tagLine = match[1]
            tags.push(
              ...tagLine
                .split(/[,;]/)
                .map((t) => t.trim().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'))
                .filter((t) => t.length > 1 && t.length < 50)
            )
            break
          }
        }

        return {
          ok: true,
          analysis: response,
          tags: [...new Set(tags)], // Dedupe
          framesAnalyzed: validFrames.length
        }
      } catch (error) {
        // Always clean up frames on error
        await frameExtractor.cleanup(videoId).catch(() => {})

        const message = error instanceof Error ? error.message : 'Vision analysis failed'

        // Provide more helpful error messages
        if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
          return { ok: false, error: 'LLM request timed out. The model may be overloaded or the video too complex.' }
        }
        if (message.includes('context') || message.includes('token')) {
          return { ok: false, error: 'Too many frames for model context. Try reducing the frame count.' }
        }

        return { ok: false, error: message }
      }
    }
  )

  // Generate video thumbnail
  ipcMain.handle(
    'processing/generate-thumbnail',
    async (
      _event,
      request: {
        videoPath: string
        videoId: string
        timestampMs?: number
      }
    ) => {
      const videoPath = request.videoPath?.trim()
      const videoId = request.videoId?.trim()

      if (!videoPath || !videoId) {
        return { ok: false, error: 'missing_video_path_or_id' }
      }

      try {
        // Check if file exists
        await access(videoPath)

        // Create a thumbnail directory
        const thumbDir = join(app.getPath('userData'), 'thumbnails')
        await mkdir(thumbDir, { recursive: true })

        const thumbPath = join(thumbDir, `${videoId}.jpg`)

        // Check if thumbnail already exists
        try {
          await access(thumbPath)
          // Already exists, return base64
          const thumbData = await readFile(thumbPath)
          return {
            ok: true,
            thumbnailPath: thumbPath,
            thumbnailBase64: `data:image/jpeg;base64,${thumbData.toString('base64')}`
          }
        } catch {
          // Doesn't exist, generate it
        }

        // Get video duration to pick a good frame
        let timestampMs = request.timestampMs
        if (timestampMs == null) {
          try {
            const metadata = await frameExtractor.getVideoMetadata(videoPath)
            // Pick frame at 10% into the video (usually past any intro)
            timestampMs = Math.round(metadata.duration * 0.1)
          } catch {
            timestampMs = 1000 // Default to 1 second
          }
        }

        // Extract single frame using ffmpeg
        const ffmpegPath = resolveBundledBinary('ffmpeg')
        const timestampSec = timestampMs / 1000

        await new Promise<void>((resolve, reject) => {
          const proc = spawn(ffmpegPath, [
            '-ss', timestampSec.toFixed(3),
            '-i', videoPath,
            '-vf', "scale='min(480,iw):-2'", // Small thumbnail, max 480px width
            '-vframes', '1',
            '-q:v', '5', // Lower quality for smaller file
            '-y',
            thumbPath
          ])

          let stderr = ''
          proc.stderr.on('data', (data) => {
            stderr += data.toString()
          })

          proc.on('close', (code) => {
            if (code === 0) {
              resolve()
            } else {
              reject(new Error(`FFmpeg failed: ${stderr.slice(-500)}`))
            }
          })

          proc.on('error', reject)
        })

        // Read and return as base64
        const thumbData = await readFile(thumbPath)
        return {
          ok: true,
          thumbnailPath: thumbPath,
          thumbnailBase64: `data:image/jpeg;base64,${thumbData.toString('base64')}`
        }
      } catch (error) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : 'Failed to generate thumbnail'
        }
      }
    }
  )
}
