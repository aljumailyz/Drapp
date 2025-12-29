import { BrowserWindow, dialog, ipcMain } from 'electron'
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

let archivalService: ArchivalService | null = null

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
      }
    ): Promise<{ ok: boolean; job?: ArchivalBatchJob; error?: string }> => {
      const { inputPaths, outputDir, config } = request

      if (!inputPaths || inputPaths.length === 0) {
        return { ok: false, error: 'No input files specified' }
      }

      if (!outputDir) {
        return { ok: false, error: 'No output directory specified' }
      }

      try {
        const service = getService()
        const job = await service.startBatch(inputPaths, outputDir, config)
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
