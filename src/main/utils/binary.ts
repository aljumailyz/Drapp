import { join } from 'node:path'
import { app } from 'electron'

export type BinaryName = 'yt-dlp' | 'ffmpeg' | 'ffprobe' | 'whisper'

function platformDir(): string {
  if (process.platform === 'darwin') {
    return 'darwin'
  }

  if (process.platform === 'win32') {
    return 'win32'
  }

  return 'linux'
}

export function resolveBundledBinary(name: BinaryName): string {
  const resourcesPath = app.isPackaged ? process.resourcesPath : join(app.getAppPath(), 'resources')
  const binaryName = process.platform === 'win32' ? `${name}.exe` : name
  return join(resourcesPath, 'bin', platformDir(), binaryName)
}

export function getBundledBinaryDir(): string {
  const resourcesPath = app.isPackaged ? process.resourcesPath : join(app.getAppPath(), 'resources')
  return join(resourcesPath, 'bin', platformDir())
}
