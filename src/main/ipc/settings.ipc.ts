import type { Database } from 'better-sqlite3'
import { BrowserWindow, dialog, ipcMain } from 'electron'
import { createHash } from 'node:crypto'
import { getDatabase } from '../database'
import { getDownloadPath } from '../utils/paths'
import { getSetting, setSetting } from '../utils/settings'
import type { WatchFolderService } from '../services/watch-folder.service'

const DEFAULT_PRIVACY = {
  historyEnabled: true,
  showThumbnails: true,
  hiddenFolderEnabled: false,
  secureDeleteEnabled: false
}

const PRIVACY_PIN_KEY = 'privacy_hidden_pin_hash'

function getBooleanSetting(database: Database, key: string, fallback: boolean): boolean {
  const value = getSetting(database, key)
  if (value === null) {
    return fallback
  }
  return value === '1' || value.toLowerCase() === 'true'
}

function setBooleanSetting(database: Database, key: string, value: boolean): void {
  setSetting(database, key, value ? '1' : '0')
}

function parseRateLimitMs(value: string | null): number {
  if (!value) {
    return 0
  }
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0
  }
  return Math.round(parsed)
}

function hashPin(pin: string): string {
  return createHash('sha256').update(pin).digest('hex')
}

type SettingsHandlerDeps = {
  watchFolderService?: WatchFolderService
}

export function registerSettingsHandlers(deps: SettingsHandlerDeps = {}): void {
  const db = getDatabase()

  ipcMain.handle('settings/get-download-path', async () => {
    const path = getSetting(db, 'download_path') ?? getDownloadPath()
    return { ok: true, path }
  })

  ipcMain.handle('settings/get-download-settings', async () => {
    const proxy = getSetting(db, 'download_proxy')
    const rateLimit = getSetting(db, 'download_rate_limit')
    const rateLimitMs = parseRateLimitMs(getSetting(db, 'download_rate_limit_ms'))
    const dedupeEnabled = getBooleanSetting(db, 'download_dedupe_enabled', true)
    return {
      ok: true,
      settings: {
        proxy: proxy && proxy.trim() ? proxy : null,
        rateLimit: rateLimit && rateLimit.trim() ? rateLimit : null,
        rateLimitMs,
        dedupeEnabled
      }
    }
  })

  ipcMain.handle(
    'settings/update-download-settings',
    async (_event, payload: { proxy?: string | null; rateLimit?: string | null; rateLimitMs?: number; dedupeEnabled?: boolean }) => {
    if (!payload) {
      return { ok: false, error: 'missing_payload' }
    }

    if (payload.proxy !== undefined) {
      setSetting(db, 'download_proxy', payload.proxy?.trim() ?? '')
    }
    if (payload.rateLimit !== undefined) {
      setSetting(db, 'download_rate_limit', payload.rateLimit?.trim() ?? '')
    }
    if (payload.rateLimitMs !== undefined) {
      const safe = Number.isFinite(payload.rateLimitMs) && payload.rateLimitMs > 0 ? Math.round(payload.rateLimitMs) : 0
      setSetting(db, 'download_rate_limit_ms', safe.toString())
    }
    if (typeof payload.dedupeEnabled === 'boolean') {
      setBooleanSetting(db, 'download_dedupe_enabled', payload.dedupeEnabled)
    }

    const proxy = getSetting(db, 'download_proxy')
    const rateLimit = getSetting(db, 'download_rate_limit')
    const rateLimitMs = parseRateLimitMs(getSetting(db, 'download_rate_limit_ms'))
    const dedupeEnabled = getBooleanSetting(db, 'download_dedupe_enabled', true)
    return {
      ok: true,
      settings: {
        proxy: proxy && proxy.trim() ? proxy : null,
        rateLimit: rateLimit && rateLimit.trim() ? rateLimit : null,
        rateLimitMs,
        dedupeEnabled
      }
    }
  })

  ipcMain.handle('settings/select-download-path', async () => {
    const focusedWindow = BrowserWindow.getFocusedWindow()
    const dialogOptions: Electron.OpenDialogOptions = {
      properties: ['openDirectory', 'createDirectory']
    }
    const result = focusedWindow
      ? await dialog.showOpenDialog(focusedWindow, dialogOptions)
      : await dialog.showOpenDialog(dialogOptions)

    if (result.canceled || result.filePaths.length === 0) {
      return { ok: false, canceled: true }
    }

    const selectedPath = result.filePaths[0]
    setSetting(db, 'download_path', selectedPath)
    return { ok: true, path: selectedPath }
  })

  ipcMain.handle('settings/get-ui-settings', async () => {
    const theme = getSetting(db, 'ui_theme') ?? 'light'
    return { ok: true, settings: { theme } }
  })

  ipcMain.handle('settings/update-ui-settings', async (_event, payload: { theme?: string }) => {
    if (!payload) {
      return { ok: false, error: 'missing_payload' }
    }
    if (payload.theme) {
      const next = payload.theme === 'dark' ? 'dark' : 'light'
      setSetting(db, 'ui_theme', next)
    }
    const theme = getSetting(db, 'ui_theme') ?? 'light'
    return { ok: true, settings: { theme } }
  })

  ipcMain.handle('settings/get-watch-folder', async () => {
    const enabled = getBooleanSetting(db, 'watch_folder_enabled', false)
    const path = getSetting(db, 'watch_folder_path')
    return { ok: true, settings: { enabled, path: path && path.trim() ? path : null } }
  })

  ipcMain.handle('settings/select-watch-folder', async () => {
    const focusedWindow = BrowserWindow.getFocusedWindow()
    const dialogOptions: Electron.OpenDialogOptions = {
      properties: ['openDirectory', 'createDirectory']
    }
    const result = focusedWindow
      ? await dialog.showOpenDialog(focusedWindow, dialogOptions)
      : await dialog.showOpenDialog(dialogOptions)

    if (result.canceled || result.filePaths.length === 0) {
      return { ok: false, canceled: true }
    }

    const selectedPath = result.filePaths[0]
    setSetting(db, 'watch_folder_path', selectedPath)
    return { ok: true, path: selectedPath }
  })

  ipcMain.handle('settings/update-watch-folder', async (_event, payload: { enabled?: boolean; path?: string | null }) => {
    if (!payload) {
      return { ok: false, error: 'missing_payload' }
    }

    if (typeof payload.enabled === 'boolean') {
      setBooleanSetting(db, 'watch_folder_enabled', payload.enabled)
    }
    if (payload.path !== undefined) {
      setSetting(db, 'watch_folder_path', payload.path ?? '')
    }

    await deps.watchFolderService?.configure({
      enabled: typeof payload.enabled === 'boolean' ? payload.enabled : undefined,
      path: payload.path !== undefined ? payload.path ?? null : undefined
    })

    const enabled = getBooleanSetting(db, 'watch_folder_enabled', false)
    const path = getSetting(db, 'watch_folder_path')
    return { ok: true, settings: { enabled, path: path && path.trim() ? path : null } }
  })

  ipcMain.handle('settings/watch-folder-scan', async () => {
    await deps.watchFolderService?.scanNow()
    return { ok: true }
  })

  ipcMain.handle('settings/get-whisper-model', async () => {
    const path = getSetting(db, 'whisper_model_path')
    return { ok: true, path }
  })

  ipcMain.handle('settings/select-whisper-model', async () => {
    const focusedWindow = BrowserWindow.getFocusedWindow()
    const dialogOptions: Electron.OpenDialogOptions = {
      properties: ['openFile'],
      filters: [
        {
          name: 'Whisper model',
          extensions: ['bin', 'ggml', 'gguf']
        }
      ]
    }
    const result = focusedWindow
      ? await dialog.showOpenDialog(focusedWindow, dialogOptions)
      : await dialog.showOpenDialog(dialogOptions)

    if (result.canceled || result.filePaths.length === 0) {
      return { ok: false, canceled: true }
    }

    const selectedPath = result.filePaths[0]
    setSetting(db, 'whisper_model_path', selectedPath)
    return { ok: true, path: selectedPath }
  })

  ipcMain.handle('settings/get-privacy', async () => {
    const pinHash = getSetting(db, PRIVACY_PIN_KEY)
    return {
      ok: true,
      settings: {
        historyEnabled: getBooleanSetting(db, 'privacy_history_enabled', DEFAULT_PRIVACY.historyEnabled),
        showThumbnails: getBooleanSetting(db, 'privacy_show_thumbnails', DEFAULT_PRIVACY.showThumbnails),
        hiddenFolderEnabled: getBooleanSetting(db, 'privacy_hidden_folder_enabled', DEFAULT_PRIVACY.hiddenFolderEnabled),
        secureDeleteEnabled: getBooleanSetting(db, 'privacy_secure_delete_enabled', DEFAULT_PRIVACY.secureDeleteEnabled),
        pinSet: Boolean(pinHash)
      }
    }
  })

  ipcMain.handle('settings/update-privacy', async (_event, payload: Partial<typeof DEFAULT_PRIVACY>) => {
    if (!payload) {
      return { ok: false, error: 'missing_payload' }
    }

    if (typeof payload.historyEnabled === 'boolean') {
      setBooleanSetting(db, 'privacy_history_enabled', payload.historyEnabled)
    }
    if (typeof payload.showThumbnails === 'boolean') {
      setBooleanSetting(db, 'privacy_show_thumbnails', payload.showThumbnails)
    }
    if (typeof payload.hiddenFolderEnabled === 'boolean') {
      setBooleanSetting(db, 'privacy_hidden_folder_enabled', payload.hiddenFolderEnabled)
    }
    if (typeof payload.secureDeleteEnabled === 'boolean') {
      setBooleanSetting(db, 'privacy_secure_delete_enabled', payload.secureDeleteEnabled)
    }

    return {
      ok: true,
      settings: {
        historyEnabled: getBooleanSetting(db, 'privacy_history_enabled', DEFAULT_PRIVACY.historyEnabled),
        showThumbnails: getBooleanSetting(db, 'privacy_show_thumbnails', DEFAULT_PRIVACY.showThumbnails),
        hiddenFolderEnabled: getBooleanSetting(db, 'privacy_hidden_folder_enabled', DEFAULT_PRIVACY.hiddenFolderEnabled),
        secureDeleteEnabled: getBooleanSetting(db, 'privacy_secure_delete_enabled', DEFAULT_PRIVACY.secureDeleteEnabled),
        pinSet: Boolean(getSetting(db, PRIVACY_PIN_KEY))
      }
    }
  })

  ipcMain.handle('settings/set-privacy-pin', async (_event, pin: string) => {
    const trimmed = typeof pin === 'string' ? pin.trim() : ''
    if (trimmed.length < 4) {
      return { ok: false, error: 'Pin must be at least 4 characters.' }
    }
    setSetting(db, PRIVACY_PIN_KEY, hashPin(trimmed))
    return { ok: true }
  })

  ipcMain.handle('settings/clear-privacy-pin', async () => {
    setSetting(db, PRIVACY_PIN_KEY, '')
    return { ok: true }
  })

  ipcMain.handle('settings/verify-privacy-pin', async (_event, pin: string) => {
    const stored = getSetting(db, PRIVACY_PIN_KEY)
    if (!stored) {
      return { ok: true, valid: true }
    }
    const trimmed = typeof pin === 'string' ? pin.trim() : ''
    if (!trimmed) {
      return { ok: true, valid: false }
    }
    const digest = hashPin(trimmed)
    return { ok: true, valid: digest === stored }
  })
}
