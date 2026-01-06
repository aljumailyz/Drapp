import { join, dirname } from 'node:path'
import { existsSync } from 'node:fs'
import { execSync } from 'node:child_process'

export type BinaryName = 'yt-dlp' | 'ffmpeg' | 'ffprobe' | 'whisper' | 'faster-whisper'

// Get current directory - works in both ESM and CJS
function getCurrentDir(): string {
  // Try CJS __dirname first (available when bundled as CJS)
  if (typeof __dirname !== 'undefined') {
    return __dirname
  }
  // Fall back to ESM import.meta.url
  try {
    const { fileURLToPath } = require('node:url')
    return dirname(fileURLToPath(import.meta.url))
  } catch {
    return process.cwd()
  }
}

// Check if running in Electron context
function isElectron(): boolean {
  // Check for CLI_MODE environment variable set by build
  if (process.env.CLI_MODE === 'true') return false
  return typeof process !== 'undefined' &&
    process.versions != null &&
    process.versions.electron != null
}

// Get Electron app if available
async function getElectronAppAsync(): Promise<{ isPackaged: boolean; getAppPath: () => string } | null> {
  if (!isElectron()) return null
  try {
    // Dynamic import to avoid bundling issues in CLI mode
    const electron = await import('electron')
    return electron.app
  } catch {
    return null
  }
}

// Synchronous version for compatibility - returns cached value or null
let cachedApp: { isPackaged: boolean; getAppPath: () => string } | null | undefined = undefined

function getElectronApp(): { isPackaged: boolean; getAppPath: () => string } | null {
  if (cachedApp !== undefined) return cachedApp
  if (!isElectron()) {
    cachedApp = null
    return null
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { app } = require('electron')
    cachedApp = app
    return app
  } catch {
    cachedApp = null
    return null
  }
}

/**
 * Get resources path - works in both Electron and CLI mode
 */
function getResourcesPath(): string {
  const app = getElectronApp()

  if (app) {
    // Electron mode
    return app.isPackaged ? process.resourcesPath : join(app.getAppPath(), 'resources')
  }

  // CLI mode - find resources relative to current file or cwd
  const possiblePaths = [
    join(process.cwd(), 'resources'),
    join(getCurrentDir(), '..', '..', '..', 'resources')
  ]

  for (const p of possiblePaths) {
    if (existsSync(p)) return p
  }

  return join(process.cwd(), 'resources')
}

/**
 * Whisper backend types
 * - whisper.cpp: C++ implementation, fast on Apple Silicon with Metal
 * - faster-whisper: Python-based CTranslate2 implementation, faster on CPU (especially Linux)
 */
export type WhisperBackend = 'whisper.cpp' | 'faster-whisper' | 'none'

function platformDir(): string {
  if (process.platform === 'darwin') {
    return 'darwin'
  }

  if (process.platform === 'win32') {
    return 'win32'
  }

  return 'linux'
}

/**
 * Try to find a binary in the system PATH
 * Returns the path if found, null otherwise
 */
function findInSystemPath(name: string): string | null {
  if (process.platform === 'win32') {
    // On Windows, we don't fall back to system PATH - always use bundled
    return null
  }

  try {
    // Use 'which' to find the binary in PATH
    const result = execSync(`which ${name}`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] })
    const path = result.trim()
    if (path && existsSync(path)) {
      return path
    }
  } catch {
    // 'which' failed or binary not found
  }

  // Check common installation paths on Linux/macOS
  const commonPaths = [
    `/usr/bin/${name}`,
    `/usr/local/bin/${name}`,
    `/opt/homebrew/bin/${name}`, // macOS Homebrew ARM
    `/home/linuxbrew/.linuxbrew/bin/${name}` // Linux Homebrew
  ]

  for (const path of commonPaths) {
    if (existsSync(path)) {
      return path
    }
  }

  return null
}

/**
 * Resolve the path to a bundled binary
 * On Linux, falls back to system PATH if bundled binary doesn't exist
 */
export function resolveBundledBinary(name: BinaryName): string {
  const resourcesPath = getResourcesPath()
  const binaryName = process.platform === 'win32' ? `${name}.exe` : name
  const bundledPath = join(resourcesPath, 'bin', platformDir(), binaryName)

  // If bundled binary exists, use it
  if (existsSync(bundledPath)) {
    return bundledPath
  }

  // On Linux/macOS, fall back to system PATH if bundled binary doesn't exist
  // This allows users who installed ffmpeg via package manager to use the app
  if (process.platform !== 'win32') {
    const systemPath = findInSystemPath(name)
    if (systemPath) {
      return systemPath
    }
  }

  // Return the bundled path even if it doesn't exist
  // The caller will handle the missing binary error
  return bundledPath
}

export function getBundledBinaryDir(): string {
  const resourcesPath = getResourcesPath()
  return join(resourcesPath, 'bin', platformDir())
}

/**
 * Check if a binary is available (either bundled or in system PATH)
 */
export function isBinaryAvailable(name: BinaryName): boolean {
  const path = resolveBundledBinary(name)
  return existsSync(path)
}

/**
 * Check if faster-whisper CLI is available
 * Returns the command to invoke it, or null if not available
 *
 * Note: faster-whisper is a Python library - the CLI comes from separate packages:
 * - `faster-whisper` CLI (from faster-whisper-xxl or similar)
 * - `whisper-ctranslate2` CLI (alternative faster-whisper CLI)
 */
export function detectFasterWhisper(): { available: boolean; command: string[] } {
  // CLI tools to check for (in order of preference)
  const cliTools = [
    'faster-whisper',      // Main CLI (from faster-whisper package with CLI extras)
    'whisper-ctranslate2'  // Alternative CLI that uses faster-whisper
  ]

  for (const tool of cliTools) {
    try {
      execSync(`${tool} --help`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] })
      return { available: true, command: [tool] }
    } catch {
      // Not available
    }
  }

  return { available: false, command: [] }
}

/**
 * Determine the best available Whisper backend for the current platform
 * - macOS: Prefer whisper.cpp (Metal GPU support)
 * - Linux: Prefer faster-whisper (better CPU performance)
 * - Windows: Prefer whisper.cpp
 */
export function detectBestWhisperBackend(): {
  backend: WhisperBackend
  reason: string
  command?: string[]
} {
  const whisperCppAvailable = isBinaryAvailable('whisper')
  const fasterWhisper = detectFasterWhisper()

  // On Linux, prefer faster-whisper if available (much better CPU performance)
  if (process.platform === 'linux') {
    if (fasterWhisper.available) {
      return {
        backend: 'faster-whisper',
        reason: 'faster-whisper provides better CPU performance on Linux',
        command: fasterWhisper.command
      }
    }
    if (whisperCppAvailable) {
      return {
        backend: 'whisper.cpp',
        reason: 'whisper.cpp is available (consider installing faster-whisper for better performance)',
        command: undefined
      }
    }
    return {
      backend: 'none',
      reason: 'No whisper backend available. Install faster-whisper: pip install faster-whisper'
    }
  }

  // On macOS, prefer whisper.cpp (Metal GPU support on Apple Silicon)
  if (process.platform === 'darwin') {
    if (whisperCppAvailable) {
      return {
        backend: 'whisper.cpp',
        reason: 'whisper.cpp with Metal GPU acceleration',
        command: undefined
      }
    }
    if (fasterWhisper.available) {
      return {
        backend: 'faster-whisper',
        reason: 'faster-whisper (whisper.cpp not available)',
        command: fasterWhisper.command
      }
    }
    return {
      backend: 'none',
      reason: 'No whisper backend available'
    }
  }

  // On Windows, prefer whisper.cpp
  if (whisperCppAvailable) {
    return {
      backend: 'whisper.cpp',
      reason: 'whisper.cpp',
      command: undefined
    }
  }
  if (fasterWhisper.available) {
    return {
      backend: 'faster-whisper',
      reason: 'faster-whisper (whisper.cpp not available)',
      command: fasterWhisper.command
    }
  }

  return {
    backend: 'none',
    reason: 'No whisper backend available'
  }
}
