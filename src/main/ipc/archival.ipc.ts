import { BrowserWindow, dialog, ipcMain } from 'electron'
import { readdir } from 'node:fs/promises'
import { join, extname, relative } from 'node:path'
import {
  ArchivalService,
  detectAv1Encoders,
  upgradeFFmpeg,
  type EncoderInfo,
  type UpgradeProgress
} from '../services/archival'
import type {
  ArchivalEncodingConfig,
  ArchivalBatchJob,
  ArchivalProgressEvent,
  VideoSourceInfo
} from '../../shared/types/archival.types'
import { DEFAULT_ARCHIVAL_CONFIG } from '../../shared/types/archival.types'
import { getDatabase } from '../database'
import { getSetting } from '../utils/settings'

// Supported video extensions for folder scanning
const VIDEO_EXTENSIONS = new Set([
  '.mp4', '.mkv', '.mov', '.webm', '.avi',
  '.m4v', '.ts', '.mts', '.m2ts', '.flv', '.wmv'
])

// Directories to ignore during recursive scanning
const IGNORED_DIRS = new Set(['.drapp', '.git', 'node_modules', '$RECYCLE.BIN', 'System Volume Information'])

type VideoFileInfo = {
  absolutePath: string
  relativePath: string
}

/**
 * Recursively find all video files in a directory
 */
async function findVideoFilesRecursively(
  rootPath: string,
  basePath: string = rootPath
): Promise<VideoFileInfo[]> {
  const files: VideoFileInfo[] = []

  async function walk(dir: string): Promise<void> {
    try {
      const entries = await readdir(dir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = join(dir, entry.name)

        if (entry.isDirectory()) {
          // Skip hidden and ignored directories
          if (IGNORED_DIRS.has(entry.name) || entry.name.startsWith('.')) {
            continue
          }
          await walk(fullPath)
        } else if (entry.isFile()) {
          const ext = extname(entry.name).toLowerCase()
          if (VIDEO_EXTENSIONS.has(ext)) {
            files.push({
              absolutePath: fullPath,
              relativePath: relative(basePath, fullPath)
            })
          }
        }
      }
    } catch {
      // Skip directories we can't read (permission issues, etc.)
    }
  }

  await walk(rootPath)
  return files
}

let archivalService: ArchivalService | null = null

/**
 * Get the archival service instance (for use by other modules like graceful shutdown)
 */
export function getArchivalService(): ArchivalService | null {
  return archivalService
}

function getMainWindow(): BrowserWindow | null {
  const windows = BrowserWindow.getAllWindows()
  return windows.length > 0 ? windows[0] : null
}

function emitArchivalEvent(event: ArchivalProgressEvent): void {
  const mainWindow = getMainWindow()
  if (mainWindow) {
    mainWindow.webContents.send('archival/event', event)
  }
}

function getService(): ArchivalService {
  if (!archivalService) {
    archivalService = new ArchivalService(emitArchivalEvent)
    // Set up whisper model path getter for caption extraction
    archivalService.setWhisperModelPathGetter(() => {
      const db = getDatabase()
      return getSetting(db, 'whisper_model_path')
    })
    // Set up whisper provider getter for caption extraction
    archivalService.setWhisperProviderGetter(() => {
      const db = getDatabase()
      const provider = getSetting(db, 'whisper_provider') ?? 'bundled'
      const endpoint = getSetting(db, 'whisper_lmstudio_endpoint') ?? 'http://localhost:1234/v1/audio/transcriptions'
      return { provider, endpoint }
    })
    // Set up whisper GPU settings getter
    archivalService.setWhisperGpuEnabledGetter(() => {
      const db = getDatabase()
      const value = getSetting(db, 'whisper_gpu_enabled')
      // Default to true (use GPU if available) when not explicitly set
      return value !== null ? value === '1' : true
    })
  }
  return archivalService
}

export function registerArchivalHandlers(): void {
  /**
   * Select multiple video files for archival processing
   */
  ipcMain.handle('archival/select-files', async () => {
    const focusedWindow = BrowserWindow.getFocusedWindow()
    const dialogOptions: Electron.OpenDialogOptions = {
      properties: ['openFile', 'multiSelections'],
      filters: [
        {
          name: 'Video files',
          extensions: ['mp4', 'mkv', 'mov', 'webm', 'avi', 'm4v', 'ts', 'mts', 'm2ts', 'flv', 'wmv']
        }
      ],
      title: 'Select Videos for Archival Processing'
    }

    const result = focusedWindow
      ? await dialog.showOpenDialog(focusedWindow, dialogOptions)
      : await dialog.showOpenDialog(dialogOptions)

    if (result.canceled || result.filePaths.length === 0) {
      return { ok: false, canceled: true }
    }

    return { ok: true, paths: result.filePaths }
  })

  /**
   * Select output directory for archived videos
   */
  ipcMain.handle('archival/select-output-dir', async () => {
    const focusedWindow = BrowserWindow.getFocusedWindow()
    const dialogOptions: Electron.OpenDialogOptions = {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Output Directory for Archived Videos'
    }

    const result = focusedWindow
      ? await dialog.showOpenDialog(focusedWindow, dialogOptions)
      : await dialog.showOpenDialog(dialogOptions)

    if (result.canceled || result.filePaths.length === 0) {
      return { ok: false, canceled: true }
    }

    return { ok: true, path: result.filePaths[0] }
  })

  /**
   * Select a folder and recursively find all video files
   * Returns both absolute paths and relative paths for structure preservation
   */
  ipcMain.handle('archival/select-folder', async () => {
    const focusedWindow = BrowserWindow.getFocusedWindow()
    const dialogOptions: Electron.OpenDialogOptions = {
      properties: ['openDirectory'],
      title: 'Select Folder for Archival Processing'
    }

    const result = focusedWindow
      ? await dialog.showOpenDialog(focusedWindow, dialogOptions)
      : await dialog.showOpenDialog(dialogOptions)

    if (result.canceled || result.filePaths.length === 0) {
      return { ok: false, canceled: true }
    }

    const folderPath = result.filePaths[0]

    try {
      const videoFiles = await findVideoFilesRecursively(folderPath)

      if (videoFiles.length === 0) {
        return { ok: false, error: 'No video files found in the selected folder' }
      }

      // Sort files by relative path for predictable order
      videoFiles.sort((a, b) => a.relativePath.localeCompare(b.relativePath))

      return {
        ok: true,
        folderPath,
        paths: videoFiles.map(f => f.absolutePath),
        fileInfo: videoFiles
      }
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to scan folder'
      }
    }
  })

  /**
   * Get default archival configuration
   */
  ipcMain.handle('archival/get-default-config', async () => {
    return {
      ok: true,
      config: DEFAULT_ARCHIVAL_CONFIG
    }
  })

  /**
   * Detect available AV1 encoders
   * Returns info about which encoders are available and which is recommended
   */
  ipcMain.handle('archival/detect-encoders', async (): Promise<{
    ok: boolean
    encoderInfo?: EncoderInfo
    error?: string
  }> => {
    try {
      const encoderInfo = await detectAv1Encoders()
      return { ok: true, encoderInfo }
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to detect encoders'
      }
    }
  })

  /**
   * Upgrade FFmpeg to a version with SVT-AV1 support
   * Downloads and installs an enhanced FFmpeg build
   */
  ipcMain.handle('archival/upgrade-ffmpeg', async (): Promise<{
    ok: boolean
    encoderInfo?: EncoderInfo
    error?: string
  }> => {
    try {
      const mainWindow = getMainWindow()

      // Send progress updates to renderer
      const result = await upgradeFFmpeg((progress: UpgradeProgress) => {
        if (mainWindow) {
          mainWindow.webContents.send('archival/upgrade-progress', progress)
        }
      })

      if (!result.success) {
        return { ok: false, error: result.error }
      }

      // Return updated encoder info
      const encoderInfo = await detectAv1Encoders()
      return { ok: true, encoderInfo }
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to upgrade FFmpeg'
      }
    }
  })

  /**
   * Start batch archival processing
   */
  ipcMain.handle(
    'archival/start-batch',
    async (
      _event,
      request: {
        inputPaths: string[]
        outputDir: string
        config?: Partial<ArchivalEncodingConfig>
        folderRoot?: string
        relativePaths?: string[]
      }
    ): Promise<{ ok: boolean; job?: ArchivalBatchJob; error?: string }> => {
      const { inputPaths, outputDir, config, folderRoot, relativePaths } = request

      if (!inputPaths || inputPaths.length === 0) {
        return { ok: false, error: 'No input files specified' }
      }

      if (!outputDir) {
        return { ok: false, error: 'No output directory specified' }
      }

      try {
        const service = getService()
        const job = await service.startBatch(inputPaths, outputDir, config, folderRoot, relativePaths)
        return { ok: true, job }
      } catch (error) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : 'Failed to start archival batch'
        }
      }
    }
  )

  /**
   * Get current batch status
   */
  ipcMain.handle('archival/get-status', async (): Promise<{
    ok: boolean
    job?: ArchivalBatchJob | null
  }> => {
    const service = getService()
    const job = service.getStatus()
    return { ok: true, job }
  })

  /**
   * Cancel the current batch
   */
  ipcMain.handle('archival/cancel', async (): Promise<{ ok: boolean; canceled: boolean }> => {
    const service = getService()
    const canceled = service.cancel()
    return { ok: true, canceled }
  })

  /**
   * Pause the current batch (stops immediately)
   */
  ipcMain.handle('archival/pause', async (): Promise<{ ok: boolean; paused: boolean; error?: string }> => {
    try {
      const service = getService()
      const paused = await service.pause()
      return { ok: true, paused }
    } catch (error) {
      return {
        ok: false,
        paused: false,
        error: error instanceof Error ? error.message : 'Failed to pause'
      }
    }
  })

  /**
   * Resume a paused batch
   */
  ipcMain.handle('archival/resume', async (): Promise<{ ok: boolean; resumed: boolean; error?: string }> => {
    try {
      const service = getService()
      const resumed = await service.resume()
      return { ok: true, resumed }
    } catch (error) {
      return {
        ok: false,
        resumed: false,
        error: error instanceof Error ? error.message : 'Failed to resume'
      }
    }
  })

  /**
   * Check if there's a recoverable state from a crash/exit
   */
  ipcMain.handle('archival/check-recovery', async (): Promise<{
    ok: boolean
    hasRecovery: boolean
    recoveryInfo?: {
      jobId: string
      totalItems: number
      completedItems: number
      failedItems: number
      savedAt: string
    }
  }> => {
    try {
      const service = getService()
      const state = await service.checkForRecovery()

      if (state) {
        return {
          ok: true,
          hasRecovery: true,
          recoveryInfo: {
            jobId: state.job.id,
            totalItems: state.job.totalItems,
            completedItems: state.job.completedItems,
            failedItems: state.job.failedItems,
            savedAt: state.savedAt
          }
        }
      }

      return { ok: true, hasRecovery: false }
    } catch (error) {
      return { ok: false, hasRecovery: false }
    }
  })

  /**
   * Resume from a recovered state
   */
  ipcMain.handle('archival/resume-recovery', async (): Promise<{
    ok: boolean
    job?: ArchivalBatchJob
    error?: string
  }> => {
    try {
      const service = getService()
      const state = await service.checkForRecovery()

      if (!state) {
        return { ok: false, error: 'No recovery state found' }
      }

      const job = await service.resumeFromRecovery(state)
      return { ok: true, job }
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to resume from recovery'
      }
    }
  })

  /**
   * Discard a recovered state
   */
  ipcMain.handle('archival/discard-recovery', async (): Promise<{ ok: boolean; error?: string }> => {
    try {
      const service = getService()
      const state = await service.checkForRecovery()

      if (state) {
        await service.discardRecovery(state)
      }

      return { ok: true }
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to discard recovery'
      }
    }
  })

  /**
   * Get pause state
   */
  ipcMain.handle('archival/get-pause-state', async (): Promise<{ ok: boolean; isPaused: boolean }> => {
    const service = getService()
    return { ok: true, isPaused: service.getIsPaused() }
  })

  /**
   * Preview encoding command for a single file
   */
  ipcMain.handle(
    'archival/preview-command',
    async (
      _event,
      request: {
        inputPath: string
        outputDir: string
        config?: Partial<ArchivalEncodingConfig>
      }
    ): Promise<{
      ok: boolean
      command?: string[]
      description?: string
      sourceInfo?: VideoSourceInfo
      error?: string
    }> => {
      const { inputPath, outputDir, config } = request

      if (!inputPath || !outputDir) {
        return { ok: false, error: 'Missing input path or output directory' }
      }

      try {
        const service = getService()
        const result = await service.previewCommand(inputPath, outputDir, config)
        return {
          ok: true,
          command: result.command,
          description: result.description,
          sourceInfo: result.sourceInfo
        }
      } catch (error) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : 'Failed to preview command'
        }
      }
    }
  )

  /**
   * Estimate output size for a video
   */
  ipcMain.handle(
    'archival/estimate-size',
    async (
      _event,
      inputPath: string
    ): Promise<{
      ok: boolean
      sourceInfo?: VideoSourceInfo
      effectiveCrf?: number
      estimatedMB?: number
      minMB?: number
      maxMB?: number
      error?: string
    }> => {
      if (!inputPath) {
        return { ok: false, error: 'Missing input path' }
      }

      try {
        const service = getService()
        const result = await service.estimateSize(inputPath)
        return { ok: true, ...result }
      } catch (error) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : 'Failed to estimate size'
        }
      }
    }
  )

  /**
   * Get batch info: total duration, estimated size, and disk space check
   * Used to display summary before starting encoding
   */
  ipcMain.handle(
    'archival/get-batch-info',
    async (
      _event,
      request: {
        inputPaths: string[]
        outputDir: string
      }
    ): Promise<{
      ok: boolean
      totalDurationSeconds?: number
      totalInputBytes?: number
      estimatedOutputBytes?: number
      availableBytes?: number
      hasEnoughSpace?: boolean
      existingCount?: number
      error?: string
    }> => {
      const { inputPaths, outputDir } = request

      if (!inputPaths || inputPaths.length === 0) {
        return { ok: false, error: 'No input files specified' }
      }

      if (!outputDir) {
        return { ok: false, error: 'No output directory specified' }
      }

      try {
        const service = getService()

        // Check disk space
        const diskCheck = await service.checkDiskSpace(outputDir, inputPaths)

        // Get batch info (duration and existing files check)
        const batchInfo = await service.getBatchInfo(inputPaths, outputDir)

        return {
          ok: true,
          totalDurationSeconds: batchInfo.totalDurationSeconds,
          totalInputBytes: batchInfo.totalInputBytes,
          estimatedOutputBytes: diskCheck.requiredBytes,
          availableBytes: diskCheck.availableBytes,
          hasEnoughSpace: diskCheck.ok,
          existingCount: batchInfo.existingCount
        }
      } catch (error) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : 'Failed to get batch info'
        }
      }
    }
  )

  /**
   * Analyze a video file for HDR and other properties
   */
  ipcMain.handle(
    'archival/analyze-video',
    async (
      _event,
      inputPath: string
    ): Promise<{
      ok: boolean
      sourceInfo?: VideoSourceInfo
      effectiveCrf?: number
      isHdr?: boolean
      resolution?: string
      error?: string
    }> => {
      if (!inputPath) {
        return { ok: false, error: 'Missing input path' }
      }

      try {
        const service = getService()
        const result = await service.estimateSize(inputPath)

        // Determine resolution label
        let resolution: string
        const maxDim = Math.max(result.sourceInfo.width, result.sourceInfo.height)
        if (maxDim >= 3840) resolution = '4K'
        else if (maxDim >= 2560) resolution = '1440p'
        else if (maxDim >= 1920) resolution = '1080p'
        else if (maxDim >= 1280) resolution = '720p'
        else if (maxDim >= 854) resolution = '480p'
        else resolution = '360p'

        return {
          ok: true,
          sourceInfo: result.sourceInfo,
          effectiveCrf: result.effectiveCrf,
          isHdr: result.sourceInfo.isHdr,
          resolution
        }
      } catch (error) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : 'Failed to analyze video'
        }
      }
    }
  )
}
