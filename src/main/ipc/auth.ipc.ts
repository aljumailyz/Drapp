import { BrowserWindow, dialog, ipcMain } from 'electron'
import { createHash } from 'node:crypto'
import { getDatabase } from '../database'
import { CookieService } from '../services/auth/cookie.service'
import { KeychainService } from '../services/auth/keychain.service'
import { SessionService } from '../services/auth/session.service'
import { getSetting, setSetting } from '../utils/settings'

function hashPassword(password: string): string {
  return createHash('sha256').update(password + 'drapp_salt_2024').digest('hex')
}

export function registerAuthHandlers(): void {
  const db = getDatabase()
  const sessionService = new SessionService(db)
  const keychainService = new KeychainService()
  const cookieService = new CookieService(sessionService, keychainService)

  ipcMain.handle('auth/select-cookie-file', async () => {
    const focusedWindow = BrowserWindow.getFocusedWindow()
    const dialogOptions: Electron.OpenDialogOptions = {
      properties: ['openFile'],
      filters: [
        { name: 'Cookie files', extensions: ['txt', 'json'] },
        { name: 'All files', extensions: ['*'] }
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

  ipcMain.handle('auth/import-cookies', async (_event, payload: { platform: string; filePath: string; accountName?: string | null }) => {
    const platform = payload?.platform?.trim().toLowerCase()
    const filePath = payload?.filePath?.trim()
    if (!platform || !filePath) {
      return { ok: false, error: 'missing_payload' }
    }

    try {
      const result = await cookieService.importCookies({
        platform,
        filePath,
        accountName: payload.accountName ?? null
      })
      return { ok: true, ...result }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Unable to import cookies.' }
    }
  })

  ipcMain.handle('auth/list-sessions', async () => {
    try {
      return { ok: true, sessions: sessionService.listSessions() }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Unable to list sessions.' }
    }
  })

  ipcMain.handle('auth/set-active', async (_event, sessionId: string) => {
    if (!sessionId) {
      return { ok: false, error: 'missing_session' }
    }

    try {
      const ok = sessionService.setActive(sessionId)
      return ok ? { ok: true } : { ok: false, error: 'not_found' }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Unable to update session.' }
    }
  })

  ipcMain.handle('auth/delete-session', async (_event, sessionId: string) => {
    if (!sessionId) {
      return { ok: false, error: 'missing_session' }
    }

    try {
      const ok = sessionService.deleteSession(sessionId)
      return ok ? { ok: true } : { ok: false, error: 'not_found' }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Unable to delete session.' }
    }
  })

  // App lock password handlers
  ipcMain.handle('app/check-password-set', async () => {
    try {
      const passwordHash = getSetting(db, 'app_password_hash')
      const lockEnabled = getSetting(db, 'app_lock_enabled')
      return {
        ok: true,
        isSet: Boolean(passwordHash),
        isEnabled: lockEnabled === 'true'
      }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Failed to check password' }
    }
  })

  ipcMain.handle('app/set-password', async (_event, password: string) => {
    if (!password || password.length < 4) {
      return { ok: false, error: 'Password must be at least 4 characters' }
    }

    try {
      const hash = hashPassword(password)
      setSetting(db, 'app_password_hash', hash)
      setSetting(db, 'app_lock_enabled', 'true')
      return { ok: true }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Failed to set password' }
    }
  })

  ipcMain.handle('app/verify-password', async (_event, password: string) => {
    if (!password) {
      return { ok: false, valid: false, error: 'Password is required' }
    }

    try {
      const storedHash = getSetting(db, 'app_password_hash')
      if (!storedHash) {
        return { ok: true, valid: true } // No password set, allow access
      }

      const inputHash = hashPassword(password)
      const valid = storedHash === inputHash
      return { ok: true, valid }
    } catch (error) {
      return { ok: false, valid: false, error: error instanceof Error ? error.message : 'Failed to verify password' }
    }
  })

  ipcMain.handle('app/change-password', async (_event, payload: { currentPassword: string; newPassword: string }) => {
    if (!payload.currentPassword || !payload.newPassword) {
      return { ok: false, error: 'Both passwords are required' }
    }

    if (payload.newPassword.length < 4) {
      return { ok: false, error: 'New password must be at least 4 characters' }
    }

    try {
      const storedHash = getSetting(db, 'app_password_hash')
      if (storedHash) {
        const currentHash = hashPassword(payload.currentPassword)
        if (storedHash !== currentHash) {
          return { ok: false, error: 'Current password is incorrect' }
        }
      }

      const newHash = hashPassword(payload.newPassword)
      setSetting(db, 'app_password_hash', newHash)
      return { ok: true }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Failed to change password' }
    }
  })

  ipcMain.handle('app/remove-password', async (_event, password: string) => {
    if (!password) {
      return { ok: false, error: 'Password is required' }
    }

    try {
      const storedHash = getSetting(db, 'app_password_hash')
      if (storedHash) {
        const inputHash = hashPassword(password)
        if (storedHash !== inputHash) {
          return { ok: false, error: 'Incorrect password' }
        }
      }

      setSetting(db, 'app_password_hash', '')
      setSetting(db, 'app_lock_enabled', 'false')
      return { ok: true }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Failed to remove password' }
    }
  })

  ipcMain.handle('app/toggle-lock', async (_event, enabled: boolean) => {
    try {
      const passwordHash = getSetting(db, 'app_password_hash')
      if (!passwordHash && enabled) {
        return { ok: false, error: 'Set a password first' }
      }

      setSetting(db, 'app_lock_enabled', enabled ? 'true' : 'false')
      return { ok: true }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Failed to toggle lock' }
    }
  })

  // Reset password without verification (for forgotten passwords)
  // This is a destructive operation that wipes all user data
  ipcMain.handle('app/reset-password', async () => {
    try {
      // Wrap all deletions in a transaction for atomicity
      db.exec('BEGIN TRANSACTION')
      try {
        // Clear all user data tables
        db.exec('DELETE FROM watch_history')
        db.exec('DELETE FROM collection_videos')
        db.exec('DELETE FROM collections')
        db.exec('DELETE FROM private_items')
        db.exec('DELETE FROM tag_events')
        db.exec('DELETE FROM video_tags')
        db.exec('DELETE FROM video_frames')
        db.exec('DELETE FROM video_embeddings')
        db.exec('DELETE FROM downloads')
        db.exec('DELETE FROM jobs')
        db.exec('DELETE FROM auth_sessions')
        db.exec('DELETE FROM videos')
        db.exec('DELETE FROM tags')
        db.exec('DELETE FROM taxonomy_cache')
        db.exec('DELETE FROM settings')
        db.exec('COMMIT')
      } catch (innerError) {
        db.exec('ROLLBACK')
        throw innerError
      }

      return { ok: true }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Failed to reset password' }
    }
  })
}
