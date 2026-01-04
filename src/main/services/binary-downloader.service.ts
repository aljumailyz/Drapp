import { createWriteStream, existsSync } from 'node:fs'
import { mkdir, rename, unlink, chmod } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { createGunzip } from 'node:zlib'
import { spawn } from 'node:child_process'
import { app } from 'electron'
import { getBundledBinaryDir, resolveBundledBinary, type BinaryName } from '../utils/binary'

type DownloadProgress = {
  binary: BinaryName
  stage: 'downloading' | 'extracting' | 'installing' | 'done' | 'error'
  progress?: number
  error?: string
}

type DownloadResult = {
  success: boolean
  binary: BinaryName
  error?: string
}

type BinaryDownloadInfo = {
  url: string
  archiveType: 'exe' | 'zip' | '7z' | 'tar.xz'
  pathInArchive?: string
}

const DOWNLOAD_URLS: Record<string, Record<BinaryName, BinaryDownloadInfo | null>> = {
  win32: {
    'yt-dlp': {
      url: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe',
      archiveType: 'exe'
    },
    ffmpeg: {
      url: 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip',
      archiveType: 'zip',
      pathInArchive: 'ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe'
    },
    ffprobe: {
      url: 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip',
      archiveType: 'zip',
      pathInArchive: 'ffmpeg-master-latest-win64-gpl/bin/ffprobe.exe'
    },
    whisper: null, // Whisper.cpp requires manual setup - too complex for auto-download
    'faster-whisper': null // Python package - install via: pip install faster-whisper
  },
  darwin: {
    'yt-dlp': {
      url: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos',
      archiveType: 'exe'
    },
    ffmpeg: {
      url: 'https://evermeet.cx/ffmpeg/getrelease/zip',
      archiveType: 'zip',
      pathInArchive: 'ffmpeg'
    },
    ffprobe: {
      url: 'https://evermeet.cx/ffmpeg/getrelease/ffprobe/zip',
      archiveType: 'zip',
      pathInArchive: 'ffprobe'
    },
    whisper: null,
    'faster-whisper': null // Python package - install via: pip install faster-whisper
  },
  linux: {
    'yt-dlp': {
      url: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp',
      archiveType: 'exe'
    },
    // BtbN provides static FFmpeg builds for Linux (same source as Windows builds)
    // These are fully static and include all common codecs (x264, x265, av1, etc.)
    ffmpeg: {
      url: 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz',
      archiveType: 'tar.xz',
      pathInArchive: 'ffmpeg-master-latest-linux64-gpl/bin/ffmpeg'
    },
    ffprobe: {
      url: 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz',
      archiveType: 'tar.xz',
      pathInArchive: 'ffmpeg-master-latest-linux64-gpl/bin/ffprobe'
    },
    whisper: null,
    'faster-whisper': null // Python package - install via: pip install faster-whisper
  }
}

class BinaryDownloaderService {
  private downloadCache: Map<string, Promise<string>> = new Map()
  private progressCallbacks: Set<(progress: DownloadProgress) => void> = new Set()

  onProgress(callback: (progress: DownloadProgress) => void): () => void {
    this.progressCallbacks.add(callback)
    return () => this.progressCallbacks.delete(callback)
  }

  private emitProgress(progress: DownloadProgress): void {
    for (const callback of this.progressCallbacks) {
      callback(progress)
    }
  }

  async checkMissingBinaries(): Promise<BinaryName[]> {
    const binaries: BinaryName[] = ['yt-dlp', 'ffmpeg', 'ffprobe', 'whisper']
    const missing: BinaryName[] = []

    for (const name of binaries) {
      const path = resolveBundledBinary(name)
      if (!existsSync(path)) {
        missing.push(name)
      }
    }

    return missing
  }

  async downloadMissingBinaries(
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<DownloadResult[]> {
    const missing = await this.checkMissingBinaries()
    const results: DownloadResult[] = []

    // Ensure binary directory exists
    const binDir = getBundledBinaryDir()
    await mkdir(binDir, { recursive: true })

    // Download ffmpeg and ffprobe together if both missing (same archive)
    const needsFfmpeg = missing.includes('ffmpeg') || missing.includes('ffprobe')
    const ffmpegDownloaded = new Set<BinaryName>()

    for (const binary of missing) {
      const info = DOWNLOAD_URLS[process.platform]?.[binary]

      if (!info) {
        results.push({
          success: false,
          binary,
          error: `No download available for ${binary} on ${process.platform}`
        })
        continue
      }

      // Skip if already downloaded as part of ffmpeg bundle
      if (ffmpegDownloaded.has(binary)) {
        continue
      }

      try {
        onProgress?.({ binary, stage: 'downloading', progress: 0 })
        this.emitProgress({ binary, stage: 'downloading', progress: 0 })

        const result = await this.downloadBinary(binary, info, (progress) => {
          onProgress?.({ binary, stage: 'downloading', progress })
          this.emitProgress({ binary, stage: 'downloading', progress })
        })

        // If this was ffmpeg/ffprobe, mark both as downloaded
        if (binary === 'ffmpeg' || binary === 'ffprobe') {
          ffmpegDownloaded.add('ffmpeg')
          ffmpegDownloaded.add('ffprobe')

          // Also extract the other binary if needed
          const otherBinary = binary === 'ffmpeg' ? 'ffprobe' : 'ffmpeg'
          if (missing.includes(otherBinary)) {
            const otherInfo = DOWNLOAD_URLS[process.platform]?.[otherBinary]
            if (otherInfo && result.archivePath) {
              await this.extractFromArchive(result.archivePath, otherBinary, otherInfo)
              results.push({ success: true, binary: otherBinary })
            }
          }
        }

        onProgress?.({ binary, stage: 'done' })
        this.emitProgress({ binary, stage: 'done' })
        results.push({ success: true, binary })
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        onProgress?.({ binary, stage: 'error', error: errorMsg })
        this.emitProgress({ binary, stage: 'error', error: errorMsg })
        results.push({ success: false, binary, error: errorMsg })
      }
    }

    return results
  }

  private async downloadBinary(
    binary: BinaryName,
    info: BinaryDownloadInfo,
    onProgress?: (progress: number) => void
  ): Promise<{ archivePath?: string }> {
    const tempDir = app.getPath('temp')
    const targetPath = resolveBundledBinary(binary)

    if (info.archiveType === 'exe') {
      // Direct executable download
      await this.downloadFile(info.url, targetPath, onProgress)

      // Make executable on Unix
      if (process.platform !== 'win32') {
        await chmod(targetPath, 0o755)
      }

      return {}
    }

    // Archive download
    const archiveExtMap: Record<string, string> = {
      'zip': '.zip',
      '7z': '.7z',
      'tar.xz': '.tar.xz'
    }
    const archiveExt = archiveExtMap[info.archiveType] || '.zip'
    const archivePath = join(tempDir, `drapp-${binary}${archiveExt}`)

    // Check if we already have this archive cached
    const cacheKey = info.url
    if (!this.downloadCache.has(cacheKey)) {
      this.downloadCache.set(
        cacheKey,
        this.downloadFile(info.url, archivePath, onProgress).then(() => archivePath)
      )
    }

    await this.downloadCache.get(cacheKey)
    await this.extractFromArchive(archivePath, binary, info)

    return { archivePath }
  }

  private async downloadFile(
    url: string,
    destPath: string,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    // Ensure directory exists
    await mkdir(dirname(destPath), { recursive: true })

    // Follow redirects and download
    const response = await fetch(url, { redirect: 'follow' })

    if (!response.ok) {
      throw new Error(`Failed to download: ${response.status} ${response.statusText}`)
    }

    const contentLength = response.headers.get('content-length')
    const totalBytes = contentLength ? parseInt(contentLength, 10) : 0
    let downloadedBytes = 0

    const fileStream = createWriteStream(destPath)
    const reader = response.body?.getReader()

    if (!reader) {
      throw new Error('No response body')
    }

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        fileStream.write(Buffer.from(value))
        downloadedBytes += value.length

        if (totalBytes > 0 && onProgress) {
          onProgress(Math.round((downloadedBytes / totalBytes) * 100))
        }
      }
    } finally {
      fileStream.close()
    }
  }

  private async extractFromArchive(
    archivePath: string,
    binary: BinaryName,
    info: BinaryDownloadInfo
  ): Promise<void> {
    const targetPath = resolveBundledBinary(binary)
    await mkdir(dirname(targetPath), { recursive: true })

    if (info.archiveType === 'zip') {
      await this.extractFromZip(archivePath, info.pathInArchive!, targetPath)
    } else if (info.archiveType === 'tar.xz') {
      await this.extractFromTarXz(archivePath, info.pathInArchive!, targetPath)
    }

    // Make executable on Unix
    if (process.platform !== 'win32') {
      await chmod(targetPath, 0o755)
    }
  }

  private async extractFromZip(
    zipPath: string,
    pathInArchive: string,
    targetPath: string
  ): Promise<void> {
    // Use PowerShell on Windows, unzip on Unix
    if (process.platform === 'win32') {
      await this.extractWithPowerShell(zipPath, pathInArchive, targetPath)
    } else {
      await this.extractWithUnzip(zipPath, pathInArchive, targetPath)
    }
  }

  private async extractWithPowerShell(
    zipPath: string,
    pathInArchive: string,
    targetPath: string
  ): Promise<void> {
    const tempExtractDir = join(app.getPath('temp'), `drapp-extract-${Date.now()}`)

    return new Promise((resolve, reject) => {
      const ps = spawn('powershell', [
        '-NoProfile',
        '-Command',
        `
        $ErrorActionPreference = 'Stop'
        Expand-Archive -Path '${zipPath}' -DestinationPath '${tempExtractDir}' -Force
        $source = Join-Path '${tempExtractDir}' '${pathInArchive}'
        Copy-Item -Path $source -Destination '${targetPath}' -Force
        Remove-Item -Path '${tempExtractDir}' -Recurse -Force
        `
      ], { stdio: 'pipe' })

      let stderr = ''
      ps.stderr.on('data', (data) => { stderr += data.toString() })

      ps.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`PowerShell extraction failed: ${stderr}`))
        }
      })

      ps.on('error', reject)
    })
  }

  private async extractWithUnzip(
    zipPath: string,
    pathInArchive: string,
    targetPath: string
  ): Promise<void> {
    const tempExtractDir = join(app.getPath('temp'), `drapp-extract-${Date.now()}`)

    return new Promise((resolve, reject) => {
      const unzip = spawn('unzip', ['-o', zipPath, pathInArchive, '-d', tempExtractDir], {
        stdio: 'pipe'
      })

      unzip.on('close', async (code) => {
        if (code === 0) {
          try {
            const extractedPath = join(tempExtractDir, pathInArchive)
            await rename(extractedPath, targetPath)
            resolve()
          } catch (error) {
            reject(error)
          }
        } else {
          reject(new Error(`unzip failed with code ${code}`))
        }
      })

      unzip.on('error', reject)
    })
  }

  /**
   * Extract a file from a tar.xz archive (used for Linux FFmpeg builds)
   * Uses the system 'tar' command which handles .xz decompression natively
   */
  private async extractFromTarXz(
    tarPath: string,
    pathInArchive: string,
    targetPath: string
  ): Promise<void> {
    const tempExtractDir = join(app.getPath('temp'), `drapp-extract-${Date.now()}`)
    await mkdir(tempExtractDir, { recursive: true })

    return new Promise((resolve, reject) => {
      // Extract using tar with xz decompression
      // -x: extract, -J: use xz decompression, -f: archive file
      // --strip-components removes leading directory components
      const tar = spawn('tar', [
        '-xJf', tarPath,
        '-C', tempExtractDir,
        pathInArchive
      ], { stdio: 'pipe' })

      let stderr = ''
      tar.stderr.on('data', (data) => { stderr += data.toString() })

      tar.on('close', async (code) => {
        if (code === 0) {
          try {
            const extractedPath = join(tempExtractDir, pathInArchive)
            await rename(extractedPath, targetPath)

            // Clean up temp directory
            const { rm } = await import('node:fs/promises')
            await rm(tempExtractDir, { recursive: true, force: true }).catch(() => {})

            resolve()
          } catch (error) {
            reject(error)
          }
        } else {
          reject(new Error(`tar extraction failed with code ${code}: ${stderr}`))
        }
      })

      tar.on('error', (error) => {
        // If tar command fails, try alternative approach
        reject(new Error(`tar command failed: ${error.message}. Please install tar or xz-utils.`))
      })
    })
  }

  async downloadSingleBinary(binary: BinaryName): Promise<DownloadResult> {
    const info = DOWNLOAD_URLS[process.platform]?.[binary]

    if (!info) {
      return {
        success: false,
        binary,
        error: `No download available for ${binary} on ${process.platform}`
      }
    }

    try {
      await this.downloadBinary(binary, info)
      return { success: true, binary }
    } catch (error) {
      return {
        success: false,
        binary,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

export const binaryDownloaderService = new BinaryDownloaderService()
