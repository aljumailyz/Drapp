import { spawn } from 'node:child_process'
import { createWriteStream, existsSync, unlinkSync } from 'node:fs'
import { chmod, mkdir, rename, rm } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { createGunzip } from 'node:zlib'
import { resolveBundledBinary, getBundledBinaryDir } from '../../utils/binary'
import { Logger } from '../../utils/logger'
import type { Av1Encoder, H265Encoder } from '../../../shared/types/archival.types'

const logger = new Logger('EncoderDetector')

export interface EncoderInfo {
  available: Av1Encoder[]
  recommended: Av1Encoder | null
  hasAv1Support: boolean
  // H.265 encoder info
  h265Available: H265Encoder[]
  hasH265Support: boolean
  canUpgrade: boolean // True if we can download a better FFmpeg
}

export interface UpgradeProgress {
  stage: 'downloading' | 'extracting' | 'installing' | 'verifying' | 'complete' | 'error'
  progress?: number // 0-100 for download progress
  error?: string
}

let cachedEncoderInfo: EncoderInfo | null = null

/**
 * Detect available AV1 and H.265 encoders in the bundled FFmpeg
 * Results are cached after first detection
 */
export async function detectAv1Encoders(): Promise<EncoderInfo> {
  if (cachedEncoderInfo) {
    return cachedEncoderInfo
  }

  const ffmpegPath = resolveBundledBinary('ffmpeg')
  const available: Av1Encoder[] = []
  const h265Available: H265Encoder[] = []

  try {
    const encoders = await getEncoderList(ffmpegPath)

    // Check for AV1 encoders
    // Check for libaom-av1 (more widely available)
    if (encoders.includes('libaom-av1')) {
      available.push('libaom-av1')
    }

    // Check for libsvtav1 (faster, but less common)
    if (encoders.includes('libsvtav1')) {
      available.push('libsvtav1')
    }

    // Check for H.265/HEVC encoders
    // libx265 is the standard software encoder for HEVC
    if (encoders.includes('libx265')) {
      h265Available.push('libx265')
    }
  } catch {
    // If detection fails, assume no encoders available
  }

  // Recommend based on availability
  // Prefer libsvtav1 if available (faster), otherwise libaom-av1
  let recommended: Av1Encoder | null = null
  if (available.includes('libsvtav1')) {
    recommended = 'libsvtav1'
  } else if (available.includes('libaom-av1')) {
    recommended = 'libaom-av1'
  }

  // Determine if we can upgrade (only if we don't have SVT-AV1)
  const canUpgrade = !available.includes('libsvtav1') &&
    (process.platform === 'darwin' || process.platform === 'win32')

  cachedEncoderInfo = {
    available,
    recommended,
    hasAv1Support: available.length > 0,
    h265Available,
    hasH265Support: h265Available.length > 0,
    canUpgrade
  }

  return cachedEncoderInfo
}

/**
 * Get the best available encoder, with fallback
 */
export async function getBestEncoder(preferred?: Av1Encoder): Promise<Av1Encoder | null> {
  const info = await detectAv1Encoders()

  if (!info.hasAv1Support) {
    return null
  }

  // If preferred encoder is available, use it
  if (preferred && info.available.includes(preferred)) {
    return preferred
  }

  // Otherwise use recommended
  return info.recommended
}

/**
 * Check if a specific encoder is available
 */
export async function isEncoderAvailable(encoder: Av1Encoder): Promise<boolean> {
  const info = await detectAv1Encoders()
  return info.available.includes(encoder)
}

/**
 * Clear the encoder cache (useful if FFmpeg is updated)
 */
export function clearEncoderCache(): void {
  cachedEncoderInfo = null
}

/**
 * Get list of available encoders from FFmpeg
 */
function getEncoderList(ffmpegPath: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, ['-encoders', '-hide_banner'])

    let stdout = ''
    proc.stdout.on('data', (data: Buffer) => {
      stdout += data.toString()
    })

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`FFmpeg exited with code ${code}`))
        return
      }

      // Parse encoder list - each line starts with encoder type and name
      // Format: " V..... libx264          libx264 H.264..."
      const encoders: string[] = []
      const lines = stdout.split('\n')

      for (const line of lines) {
        // Match video encoders (start with V)
        const match = line.match(/^\s*V[.\w]+\s+(\S+)/)
        if (match) {
          encoders.push(match[1])
        }
      }

      resolve(encoders)
    })

    proc.on('error', reject)
  })
}

/**
 * FFmpeg download URLs for builds with SVT-AV1 support
 * These are static builds from trusted sources with modern AV1 encoders
 */
const FFMPEG_DOWNLOAD_URLS: Record<string, { url: string; type: 'zip' | 'tar.xz' | 'dmg' }> = {
  // macOS arm64 (Apple Silicon) - evermeet.cx builds include SVT-AV1
  'darwin-arm64': {
    url: 'https://evermeet.cx/ffmpeg/ffmpeg-7.1.1.zip',
    type: 'zip'
  },
  // macOS x64 (Intel)
  'darwin-x64': {
    url: 'https://evermeet.cx/ffmpeg/ffmpeg-7.1.1.zip',
    type: 'zip'
  },
  // Windows x64 - gyan.dev builds include SVT-AV1
  'win32-x64': {
    url: 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip',
    type: 'zip'
  }
}

export type UpgradeProgressCallback = (progress: UpgradeProgress) => void

/**
 * Upgrade FFmpeg to a build with better AV1 encoder support (SVT-AV1)
 * Downloads and installs an enhanced FFmpeg build
 */
export async function upgradeFFmpeg(
  onProgress?: UpgradeProgressCallback
): Promise<{ success: boolean; error?: string }> {
  const platform = process.platform
  const arch = process.arch
  const key = `${platform}-${arch}`

  const downloadInfo = FFMPEG_DOWNLOAD_URLS[key]
  if (!downloadInfo) {
    return {
      success: false,
      error: `No FFmpeg upgrade available for ${platform}-${arch}`
    }
  }

  const binaryDir = getBundledBinaryDir()
  const ffmpegPath = resolveBundledBinary('ffmpeg')
  const backupPath = `${ffmpegPath}.backup`
  const tempDir = join(binaryDir, '.ffmpeg-upgrade-temp')

  try {
    // Create temp directory
    await mkdir(tempDir, { recursive: true })

    // Step 1: Download
    onProgress?.({ stage: 'downloading', progress: 0 })
    logger.info('Downloading enhanced FFmpeg', { url: downloadInfo.url })

    const downloadPath = join(tempDir, `ffmpeg-download.${downloadInfo.type}`)
    await downloadFile(downloadInfo.url, downloadPath, (progress) => {
      onProgress?.({ stage: 'downloading', progress })
    })

    // Step 2: Extract
    onProgress?.({ stage: 'extracting' })
    logger.info('Extracting FFmpeg')

    const extractedBinary = await extractFFmpeg(downloadPath, tempDir, downloadInfo.type, platform)
    if (!extractedBinary) {
      throw new Error('Failed to find FFmpeg binary in downloaded archive')
    }

    // Step 3: Install
    onProgress?.({ stage: 'installing' })
    logger.info('Installing enhanced FFmpeg')

    // Backup existing FFmpeg
    if (existsSync(ffmpegPath)) {
      await rename(ffmpegPath, backupPath)
    }

    // Move new FFmpeg to binary directory
    await rename(extractedBinary, ffmpegPath)

    // Set executable permissions on Unix
    if (platform !== 'win32') {
      await chmod(ffmpegPath, 0o755)
    }

    // Step 4: Verify
    onProgress?.({ stage: 'verifying' })
    logger.info('Verifying new FFmpeg')

    // Clear cache and re-detect encoders
    clearEncoderCache()
    const newInfo = await detectAv1Encoders()

    if (!newInfo.available.includes('libsvtav1')) {
      // Verification failed, restore backup
      logger.warn('New FFmpeg does not have SVT-AV1, restoring backup')
      if (existsSync(backupPath)) {
        await rm(ffmpegPath, { force: true })
        await rename(backupPath, ffmpegPath)
      }
      throw new Error('Downloaded FFmpeg does not include SVT-AV1 encoder')
    }

    // Clean up backup
    if (existsSync(backupPath)) {
      await rm(backupPath, { force: true })
    }

    // Clean up temp directory
    await rm(tempDir, { recursive: true, force: true })

    onProgress?.({ stage: 'complete' })
    logger.info('FFmpeg upgrade complete', { encoders: newInfo.available })

    return { success: true }

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error('FFmpeg upgrade failed', { error: message })

    // Restore backup if it exists
    if (existsSync(backupPath)) {
      try {
        await rm(ffmpegPath, { force: true })
        await rename(backupPath, ffmpegPath)
      } catch {
        // Ignore restore errors
      }
    }

    // Clean up temp directory
    try {
      await rm(tempDir, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }

    onProgress?.({ stage: 'error', error: message })
    return { success: false, error: message }
  }
}

/**
 * Download a file with progress tracking
 */
async function downloadFile(
  url: string,
  destPath: string,
  onProgress?: (percent: number) => void
): Promise<void> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Drapp/1.0'
    }
  })

  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`)
  }

  const contentLength = Number(response.headers.get('content-length') || 0)
  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('No response body')
  }

  const writer = createWriteStream(destPath)
  let downloadedBytes = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      writer.write(Buffer.from(value))
      downloadedBytes += value.length

      if (contentLength > 0) {
        onProgress?.(Math.round((downloadedBytes / contentLength) * 100))
      }
    }
  } finally {
    writer.end()
    await new Promise<void>((resolve) => writer.on('finish', resolve))
  }
}

/**
 * Extract FFmpeg binary from downloaded archive
 */
async function extractFFmpeg(
  archivePath: string,
  tempDir: string,
  type: 'zip' | 'tar.xz' | 'dmg',
  platform: string
): Promise<string | null> {
  const binaryName = platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'

  if (type === 'zip') {
    // Use unzip command (available on macOS and Windows with PowerShell)
    const extractDir = join(tempDir, 'extracted')
    await mkdir(extractDir, { recursive: true })

    await new Promise<void>((resolve, reject) => {
      let proc
      if (platform === 'win32') {
        // Windows: Use PowerShell
        proc = spawn('powershell', [
          '-Command',
          `Expand-Archive -Path "${archivePath}" -DestinationPath "${extractDir}" -Force`
        ])
      } else {
        // macOS/Linux: Use unzip
        proc = spawn('unzip', ['-o', archivePath, '-d', extractDir])
      }

      proc.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`Extraction failed with code ${code}`))
        }
      })
      proc.on('error', reject)
    })

    // Find ffmpeg binary in extracted files
    return findBinaryInDir(extractDir, binaryName)
  }

  // For tar.xz (Linux), we'd use tar -xJf
  // For dmg (macOS alternative), we'd need to mount and copy
  // For now, we only support zip which covers macOS and Windows

  return null
}

/**
 * Recursively find a binary in a directory
 */
async function findBinaryInDir(dir: string, binaryName: string): Promise<string | null> {
  const { readdir, stat } = await import('node:fs/promises')

  const entries = await readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)

    if (entry.isDirectory()) {
      const found = await findBinaryInDir(fullPath, binaryName)
      if (found) return found
    } else if (entry.name === binaryName || entry.name.toLowerCase() === binaryName.toLowerCase()) {
      return fullPath
    }
  }

  return null
}
