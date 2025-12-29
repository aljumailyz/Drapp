import { app } from 'electron'
import { join } from 'node:path'

export function getAppDataPath(): string {
  return app.getPath('userData')
}

export function getDatabasePath(): string {
  return join(getAppDataPath(), 'drapp.sqlite')
}

export function getDownloadPath(): string {
  return app.getPath('downloads')
}
