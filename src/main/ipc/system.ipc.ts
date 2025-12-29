import { ipcMain, shell, BrowserWindow } from 'electron'
import { accessSync, constants, existsSync } from 'node:fs'
import { chmod } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { getBundledBinaryDir, resolveBundledBinary, type BinaryName } from '../utils/binary'
import { binaryDownloaderService } from '../services/binary-downloader.service'

type BinaryStatus = {
  name: BinaryName
  path: string
  exists: boolean
  executable: boolean
  version: string | null
  error?: string
}

const VERSION_ARGS: Record<BinaryName, string[]> = {
  'yt-dlp': ['--version'],
  ffmpeg: ['-version'],
  ffprobe: ['-version'],
  whisper: ['-h']
}

export function registerSystemHandlers(): void {
  ipcMain.handle('system/binaries', async () => {
    const results = await Promise.all(
      (Object.keys(VERSION_ARGS) as BinaryName[]).map(async (name) => checkBinary(name))
    )
    return { ok: true, binaries: results }
  })

  ipcMain.handle('system/open-binaries-folder', async () => {
    try {
      await shell.openPath(getBundledBinaryDir())
      return { ok: true }
    } catch (error) {
      return { ok: false, error: errorMessage(error) }
    }
  })

  ipcMain.handle('system/repair-binaries', async () => {
    const repaired: BinaryName[] = []
    const missing: BinaryName[] = []
    const downloaded: BinaryName[] = []
    const errors: Array<{ name: BinaryName; error: string }> = []

    for (const name of Object.keys(VERSION_ARGS) as BinaryName[]) {
      const path = resolveBundledBinary(name)
      if (!existsSync(path)) {
        missing.push(name)
        continue
      }
      if (process.platform === 'win32') {
        continue
      }
      try {
        await chmod(path, 0o755)
        repaired.push(name)
      } catch (error) {
        errors.push({ name, error: errorMessage(error) })
      }
    }

    // Try to download missing binaries
    if (missing.length > 0) {
      const results = await binaryDownloaderService.downloadMissingBinaries()
      for (const result of results) {
        if (result.success) {
          downloaded.push(result.binary)
          // Remove from missing list
          const idx = missing.indexOf(result.binary)
          if (idx !== -1) {
            missing.splice(idx, 1)
          }
        } else if (result.error) {
          errors.push({ name: result.binary, error: result.error })
        }
      }
    }

    return { ok: true, repaired, downloaded, missing, errors }
  })

  ipcMain.handle('system/download-binaries', async () => {
    const mainWindow = BrowserWindow.getAllWindows()[0]
    const results = await binaryDownloaderService.downloadMissingBinaries((progress) => {
      if (mainWindow) {
        mainWindow.webContents.send('binary-download/progress', progress)
      }
    })

    return {
      ok: true,
      results,
      downloaded: results.filter((r) => r.success).map((r) => r.binary),
      failed: results.filter((r) => !r.success).map((r) => ({ binary: r.binary, error: r.error }))
    }
  })

  ipcMain.handle('system/check-missing-binaries', async () => {
    const missing = await binaryDownloaderService.checkMissingBinaries()
    return { ok: true, missing }
  })
}

async function checkBinary(name: BinaryName): Promise<BinaryStatus> {
  const path = resolveBundledBinary(name)
  const exists = existsSync(path)
  const executable = exists ? isExecutable(path) : false

  if (!exists) {
    return { name, path, exists, executable, version: null, error: 'missing' }
  }

  if (!executable) {
    return { name, path, exists, executable, version: null, error: 'not_executable' }
  }

  try {
    const version = await getVersion(path, VERSION_ARGS[name])
    return { name, path, exists, executable, version }
  } catch (error) {
    return { name, path, exists, executable, version: null, error: errorMessage(error) }
  }
}

function isExecutable(path: string): boolean {
  if (process.platform === 'win32') {
    return existsSync(path)
  }

  try {
    accessSync(path, constants.X_OK)
    return true
  } catch {
    return false
  }
}

async function getVersion(path: string, args: string[]): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const child = spawn(path, args, { stdio: 'pipe' })
    let output = ''

    child.stdout.on('data', (chunk: Buffer) => {
      output += chunk.toString()
    })

    child.stderr.on('data', (chunk: Buffer) => {
      output += chunk.toString()
    })

    child.on('error', (error) => {
      reject(error)
    })

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`exit_code_${code ?? 'unknown'}`))
        return
      }
      const line = output.split('\n').find((entry) => entry.trim().length > 0)
      resolve(line ? line.trim() : null)
    })
  })
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'unknown error'
}
