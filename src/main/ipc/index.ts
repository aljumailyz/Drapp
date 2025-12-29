import { app, clipboard, ipcMain, shell } from 'electron'
import { appendFile } from 'node:fs/promises'
import { join } from 'node:path'
import { registerDownloadHandlers } from './download.ipc'
import { registerLibraryHandlers } from './library.ipc'
import { registerProcessingHandlers } from './processing.ipc'
import { registerLlmHandlers } from './llm.ipc'
import { registerSmartTaggingHandlers } from './smart-tagging.ipc'
import { registerSettingsHandlers } from './settings.ipc'
import { registerAuthHandlers } from './auth.ipc'
import { registerSystemHandlers } from './system.ipc'
import { registerArchivalHandlers } from './archival.ipc'
import type { DownloadWorker } from '../queue/workers/download.worker'
import type { SmartTaggingService } from '../services/smart-tagging'
import type { WatchFolderService } from '../services/watch-folder.service'
import { Logger } from '../utils/logger'

type IpcHandlerDeps = {
  downloadWorker?: DownloadWorker
  smartTagging?: SmartTaggingService
  transcodeWorker?: import('../queue/workers/transcode.worker').TranscodeWorker
  transcriptionWorker?: import('../queue/workers/transcription.worker').TranscriptionWorker
  watchFolderService?: WatchFolderService
}

export function registerIpcHandlers(deps: IpcHandlerDeps = {}): void {
  const logger = new Logger('RendererError')
  const logFile = join(app.getPath('userData'), 'renderer-errors.log')

  ipcMain.handle('app/ping', () => 'pong')
  ipcMain.handle('app/copy-to-clipboard', (_event, text: string) => {
    try {
      clipboard.writeText(text ?? '')
      return { ok: true }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Unable to copy to clipboard.' }
    }
  })
  ipcMain.handle('app/reveal-path', (_event, filePath: string) => {
    if (!filePath) {
      return { ok: false, error: 'missing_path' }
    }
    try {
      shell.showItemInFolder(filePath)
      return { ok: true }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Unable to reveal path.' }
    }
  })
  ipcMain.handle('app/log-client-error', async (_event, payload: { message?: string; stack?: string; source?: string; level?: string }) => {
    const message = payload?.message?.trim()
    if (!message) {
      return { ok: false, error: 'missing_message' }
    }
    const entry = {
      message,
      stack: payload?.stack ?? null,
      source: payload?.source ?? 'renderer',
      level: payload?.level ?? 'error',
      timestamp: new Date().toISOString()
    }
    logger.error(entry.message, { source: entry.source, level: entry.level })
    try {
      await appendFile(logFile, `${JSON.stringify(entry)}\n`, 'utf-8')
    } catch {
      // Ignore log file errors.
    }
    return { ok: true }
  })
  registerDownloadHandlers({ downloadWorker: deps.downloadWorker })
  registerAuthHandlers()
  registerSettingsHandlers({ watchFolderService: deps.watchFolderService })
  registerSystemHandlers()
  registerLibraryHandlers()
  registerProcessingHandlers({
    transcodeWorker: deps.transcodeWorker,
    transcriptionWorker: deps.transcriptionWorker
  })
  registerLlmHandlers(deps.smartTagging)

  if (deps.smartTagging) {
    registerSmartTaggingHandlers(deps.smartTagging)
  }

  // Archival processing (standalone, no deps needed)
  registerArchivalHandlers()
}
