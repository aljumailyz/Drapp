import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import os from 'node:os'
import type { HWAccelerator } from '../../shared/types/encoding.types'

const execFileAsync = promisify(execFile)

export type HWAccelInfo = {
  available: HWAccelerator[]
  recommended: HWAccelerator
  platform: 'darwin' | 'win32' | 'linux'
  gpuVendor: string | null
  gpuModel: string | null
}

/**
 * Detect available hardware acceleration options based on platform and GPU
 */
export async function detectHWAccelerators(ffmpegPath: string): Promise<HWAccelInfo> {
  const platform = os.platform() as 'darwin' | 'win32' | 'linux'
  const available: HWAccelerator[] = ['none'] // Software encoding is always available
  let gpuVendor: string | null = null
  let gpuModel: string | null = null

  try {
    // Query FFmpeg for available hardware encoders
    const { stdout } = await execFileAsync(ffmpegPath, ['-hide_banner', '-encoders'], {
      timeout: 10000
    })

    const encoderList = stdout.toLowerCase()

    // Platform-specific detection
    if (platform === 'darwin') {
      // Apple VideoToolbox
      if (encoderList.includes('h264_videotoolbox') || encoderList.includes('hevc_videotoolbox')) {
        available.push('videotoolbox')
        gpuVendor = 'Apple'
        gpuModel = await detectMacGPU()
      }
    } else if (platform === 'win32' || platform === 'linux') {
      // NVIDIA NVENC
      if (encoderList.includes('h264_nvenc') || encoderList.includes('hevc_nvenc')) {
        available.push('nvenc')
        gpuVendor = 'NVIDIA'
        gpuModel = await detectNvidiaGPU()
      }

      // AMD AMF (Windows only typically)
      if (encoderList.includes('h264_amf') || encoderList.includes('hevc_amf')) {
        available.push('amf')
        if (!gpuVendor) {
          gpuVendor = 'AMD'
          gpuModel = await detectAMDGPU()
        }
      }

      // Intel QuickSync
      if (encoderList.includes('h264_qsv') || encoderList.includes('hevc_qsv')) {
        available.push('qsv')
        if (!gpuVendor) {
          gpuVendor = 'Intel'
        }
      }
    }
  } catch (error) {
    // If detection fails, just return software-only
    console.warn('HW acceleration detection failed:', error)
  }

  // Determine recommended accelerator
  const recommended = getRecommendedAccelerator(available, platform)

  return {
    available,
    recommended,
    platform,
    gpuVendor,
    gpuModel
  }
}

/**
 * Get the recommended accelerator based on what's available
 */
function getRecommendedAccelerator(
  available: HWAccelerator[],
  platform: 'darwin' | 'win32' | 'linux'
): HWAccelerator {
  // Prefer platform-native acceleration
  if (platform === 'darwin' && available.includes('videotoolbox')) {
    return 'videotoolbox'
  }

  // NVENC is generally the best quality HW encoder
  if (available.includes('nvenc')) {
    return 'nvenc'
  }

  // AMD AMF is good on Windows
  if (available.includes('amf')) {
    return 'amf'
  }

  // QuickSync is decent for quick encodes
  if (available.includes('qsv')) {
    return 'qsv'
  }

  // Fall back to software
  return 'none'
}

/**
 * Detect Mac GPU model (Apple Silicon or AMD)
 */
async function detectMacGPU(): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync('system_profiler', ['SPDisplaysDataType', '-json'], {
      timeout: 5000
    })
    const data = JSON.parse(stdout)
    const displays = data.SPDisplaysDataType
    if (displays && displays.length > 0) {
      return displays[0].sppci_model || displays[0]._name || null
    }
  } catch {
    // Ignore errors
  }
  return null
}

/**
 * Detect NVIDIA GPU model
 */
async function detectNvidiaGPU(): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync('nvidia-smi', ['--query-gpu=name', '--format=csv,noheader'], {
      timeout: 5000
    })
    return stdout.trim().split('\n')[0] || null
  } catch {
    // nvidia-smi not available
  }
  return null
}

/**
 * Detect AMD GPU model (Windows)
 */
async function detectAMDGPU(): Promise<string | null> {
  if (os.platform() !== 'win32') return null

  try {
    // Use WMIC on Windows
    const { stdout } = await execFileAsync('wmic', ['path', 'win32_VideoController', 'get', 'name'], {
      timeout: 5000
    })
    const lines = stdout.trim().split('\n').filter(l => l.trim() && !l.includes('Name'))
    const amdGpu = lines.find(l => l.toLowerCase().includes('amd') || l.toLowerCase().includes('radeon'))
    return amdGpu?.trim() || null
  } catch {
    // WMIC not available
  }
  return null
}

/**
 * Test if a specific hardware encoder works
 */
export async function testHWEncoder(
  ffmpegPath: string,
  encoder: string
): Promise<boolean> {
  try {
    // Try to initialize the encoder with a null input
    await execFileAsync(
      ffmpegPath,
      [
        '-hide_banner',
        '-f', 'lavfi',
        '-i', 'nullsrc=s=256x256:d=0.1',
        '-c:v', encoder,
        '-f', 'null',
        '-'
      ],
      { timeout: 10000 }
    )
    return true
  } catch {
    return false
  }
}

/**
 * Get encoder name for a codec and accelerator combination
 */
export function getEncoderName(
  codec: 'h264' | 'h265' | 'av1' | 'vp9' | 'prores',
  hwAccel: HWAccelerator
): string {
  if (hwAccel === 'none') {
    switch (codec) {
      case 'h264': return 'libx264'
      case 'h265': return 'libx265'
      case 'av1': return 'libaom-av1'
      case 'vp9': return 'libvpx-vp9'
      case 'prores': return 'prores_ks'
      default: return 'libx264'
    }
  }

  if (hwAccel === 'videotoolbox') {
    switch (codec) {
      case 'h264': return 'h264_videotoolbox'
      case 'h265': return 'hevc_videotoolbox'
      case 'prores': return 'prores_videotoolbox'
      default: return 'h264_videotoolbox'
    }
  }

  if (hwAccel === 'nvenc') {
    switch (codec) {
      case 'h264': return 'h264_nvenc'
      case 'h265': return 'hevc_nvenc'
      case 'av1': return 'av1_nvenc'
      default: return 'h264_nvenc'
    }
  }

  if (hwAccel === 'amf') {
    switch (codec) {
      case 'h264': return 'h264_amf'
      case 'h265': return 'hevc_amf'
      default: return 'h264_amf'
    }
  }

  if (hwAccel === 'qsv') {
    switch (codec) {
      case 'h264': return 'h264_qsv'
      case 'h265': return 'hevc_qsv'
      case 'av1': return 'av1_qsv'
      case 'vp9': return 'vp9_qsv'
      default: return 'h264_qsv'
    }
  }

  // Fallback
  return 'libx264'
}
