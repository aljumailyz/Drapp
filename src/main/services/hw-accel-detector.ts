import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import os from 'node:os'
import type { HWAccelerator } from '../../shared/types/encoding.types'

const execFileAsync = promisify(execFile)

export type CPUSIMDCapabilities = {
  // x86 SIMD extensions
  sse: boolean
  sse2: boolean
  sse3: boolean
  ssse3: boolean
  sse41: boolean
  sse42: boolean
  avx: boolean
  avx2: boolean
  avx512: boolean
  // ARM SIMD extensions
  neon: boolean
  sve: boolean
  sve2: boolean
  // CPU info
  cpuModel: string | null
  architecture: 'x86_64' | 'arm64' | 'unknown'
}

export type HWAccelInfo = {
  available: HWAccelerator[]
  recommended: HWAccelerator
  platform: 'darwin' | 'win32' | 'linux'
  gpuVendor: string | null
  gpuModel: string | null
  cpuCapabilities: CPUSIMDCapabilities | null
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

  // Detect CPU SIMD capabilities
  const cpuCapabilities = await detectCPUSIMDCapabilities()

  return {
    available,
    recommended,
    platform,
    gpuVendor,
    gpuModel,
    cpuCapabilities
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
 * Detect CPU SIMD capabilities (SSE, AVX, AVX-512)
 */
export async function detectCPUSIMDCapabilities(): Promise<CPUSIMDCapabilities | null> {
  const platform = os.platform()

  const capabilities: CPUSIMDCapabilities = {
    // x86
    sse: false,
    sse2: false,
    sse3: false,
    ssse3: false,
    sse41: false,
    sse42: false,
    avx: false,
    avx2: false,
    avx512: false,
    // ARM
    neon: false,
    sve: false,
    sve2: false,
    // Info
    cpuModel: null,
    architecture: 'unknown'
  }

  try {
    if (platform === 'win32') {
      await detectWindowsCPUCapabilities(capabilities)
    } else if (platform === 'linux') {
      await detectLinuxCPUCapabilities(capabilities)
    } else if (platform === 'darwin') {
      await detectMacOSCPUCapabilities(capabilities)
    }
  } catch (error) {
    console.warn('CPU SIMD detection failed:', error)
    return null
  }

  return capabilities
}

/**
 * Detect CPU capabilities on Windows
 */
async function detectWindowsCPUCapabilities(capabilities: CPUSIMDCapabilities): Promise<void> {
  // Get CPU name via WMIC
  try {
    const { stdout: cpuName } = await execFileAsync('wmic', ['cpu', 'get', 'name'], {
      timeout: 5000
    })
    const lines = cpuName.trim().split('\n').filter(l => l.trim() && !l.includes('Name'))
    capabilities.cpuModel = lines[0]?.trim() || null
  } catch {
    // Ignore - will try PowerShell fallback
  }

  // Use PowerShell for more detailed detection
  try {
    const { stdout: psOutput } = await execFileAsync('powershell', [
      '-NoProfile',
      '-Command',
      `
      $cpu = Get-CimInstance -ClassName Win32_Processor
      $procName = $cpu.Name.ToLower()

      # Conservative heuristics for AVX-512 capable CPUs
      # Intel: Only specific generations have AVX-512 enabled
      #   - Ice Lake (10th gen mobile): i[3579]-10xxGx patterns
      #   - Tiger Lake (11th gen mobile): i[3579]-11xxGx patterns
      #   - Rocket Lake (11th gen desktop): i[3579]-11xxx (non-G suffix)
      #   - Xeon Scalable (various gens), Xeon W
      # Note: Intel 12th+ gen (Alder Lake, Raptor Lake) had AVX-512 disabled via microcode
      # AMD: Zen 4+ (Ryzen 7000/8000/9000 series, EPYC Genoa)

      $hasAVX512 = $false

      # Intel 10th gen mobile (Ice Lake) - pattern: i7-1065G7, i5-1035G1, etc.
      if ($procName -match 'i[3579]-10[0-9]{2}g') { $hasAVX512 = $true }

      # Intel 11th gen (Tiger Lake mobile + Rocket Lake desktop)
      if ($procName -match 'i[3579]-11[0-9]{2,3}') { $hasAVX512 = $true }

      # Intel Xeon W series (various generations with AVX-512)
      if ($procName -match 'xeon.*w-[0-9]{4,5}') { $hasAVX512 = $true }

      # Intel Xeon Scalable (Gold, Platinum, Silver, Bronze)
      if ($procName -match 'xeon.*(gold|platinum|silver|bronze)') { $hasAVX512 = $true }

      # Intel Xeon with 4-5 digit model numbers (Scalable, etc.)
      if ($procName -match 'xeon.*[0-9]{4,5}' -and $procName -notmatch 'e[357]-') { $hasAVX512 = $true }

      # AMD Ryzen 7000 series (Zen 4) - pattern: Ryzen 5 7600, Ryzen 9 7950X, etc.
      if ($procName -match 'ryzen.*[3579].*7[0-9]{3}') { $hasAVX512 = $true }

      # AMD Ryzen 8000 series (Zen 4 APUs, e.g., 8700G)
      if ($procName -match 'ryzen.*[3579].*8[0-9]{3}') { $hasAVX512 = $true }

      # AMD Ryzen 9000 series (Zen 5)
      if ($procName -match 'ryzen.*[3579].*9[0-9]{3}') { $hasAVX512 = $true }

      # AMD Ryzen AI 300 series (Strix Point, Zen 5)
      if ($procName -match 'ryzen.*ai.*3[0-9]{2}') { $hasAVX512 = $true }

      # AMD EPYC 9000 series (Genoa, Zen 4)
      if ($procName -match 'epyc.*9[0-9]{3}') { $hasAVX512 = $true }

      # AMD EPYC 8000 series (Siena, Zen 4c)
      if ($procName -match 'epyc.*8[0-9]{3}') { $hasAVX512 = $true }

      Write-Output "MODEL:$($cpu.Name)"
      Write-Output "AVX512:$hasAVX512"
      `
    ], { timeout: 10000 })

    // Parse output
    const modelMatch = psOutput.match(/MODEL:(.+)/i)
    if (modelMatch && !capabilities.cpuModel) {
      capabilities.cpuModel = modelMatch[1].trim()
    }

    if (psOutput.toLowerCase().includes('avx512:true')) {
      capabilities.avx512 = true
    }
  } catch {
    // PowerShell detection failed - continue with baseline assumptions
    console.warn('PowerShell CPU detection failed, using baseline assumptions')
  }

  // Set architecture - Windows on ARM is rare but possible
  const arch = os.arch()
  if (arch === 'arm64') {
    capabilities.architecture = 'arm64'
    capabilities.neon = true // All ARM64 has NEON
    // Windows on ARM doesn't expose SVE detection easily
    // Reset x86 flags
    capabilities.sse = false
    capabilities.sse2 = false
    capabilities.sse3 = false
    capabilities.ssse3 = false
    capabilities.sse41 = false
    capabilities.sse42 = false
    capabilities.avx = false
    capabilities.avx2 = false
    capabilities.avx512 = false
  } else {
    capabilities.architecture = 'x86_64'
    // Modern x86-64 CPUs (2013+) have at least AVX2
    // Set baseline capabilities for any modern CPU
    capabilities.sse = true
    capabilities.sse2 = true
    capabilities.sse3 = true
    capabilities.ssse3 = true
    capabilities.sse41 = true
    capabilities.sse42 = true
    capabilities.avx = true
    capabilities.avx2 = true
  }
}

/**
 * Detect CPU capabilities on Linux by reading /proc/cpuinfo
 * Supports both x86_64 and ARM64 architectures
 */
async function detectLinuxCPUCapabilities(capabilities: CPUSIMDCapabilities): Promise<void> {
  const { stdout } = await execFileAsync('cat', ['/proc/cpuinfo'], {
    timeout: 5000
  })

  // Detect architecture
  const arch = os.arch()
  const isARM = arch === 'arm64' || arch === 'aarch64'

  if (isARM) {
    capabilities.architecture = 'arm64'

    // ARM: Extract CPU model from "CPU part" or "model name" or "Hardware"
    const modelMatch = stdout.match(/model name\s*:\s*(.+)/i) ||
                       stdout.match(/Hardware\s*:\s*(.+)/i) ||
                       stdout.match(/CPU implementer\s*:\s*(.+)/i)
    capabilities.cpuModel = modelMatch ? modelMatch[1].trim() : null

    // ARM: Look for Features line (different from x86 flags)
    const featuresMatch = stdout.match(/^Features\s*:\s*(.+)$/im)
    if (featuresMatch) {
      const features = ` ${featuresMatch[1].toLowerCase()} `

      // NEON/ASIMD is standard on all ARM64
      capabilities.neon = / asimd /.test(features) || / neon /.test(features)
      if (!capabilities.neon) {
        // All ARM64 Linux systems have NEON, it might just not be listed
        capabilities.neon = true
      }

      // SVE (Scalable Vector Extension) - ARM's answer to AVX-512
      // Used in: Graviton3, A64FX, Neoverse V1
      capabilities.sve = / sve /.test(features)

      // SVE2 - Enhanced SVE, used in: Graviton4, Neoverse V2/N2, Google Axion
      capabilities.sve2 = / sve2 /.test(features)
    } else {
      // If no Features line, assume basic NEON
      capabilities.neon = true
    }

    // Try to get more specific CPU info for ARM
    if (!capabilities.cpuModel) {
      try {
        const { stdout: lscpuOut } = await execFileAsync('lscpu', [], { timeout: 3000 })
        const modelNameMatch = lscpuOut.match(/Model name:\s*(.+)/i)
        if (modelNameMatch) {
          capabilities.cpuModel = modelNameMatch[1].trim()
        }
      } catch {
        // lscpu not available
      }
    }
  } else {
    // x86_64 detection
    capabilities.architecture = 'x86_64'

    // Extract CPU model
    const modelMatch = stdout.match(/model name\s*:\s*(.+)/i)
    capabilities.cpuModel = modelMatch ? modelMatch[1].trim() : null

    // Extract flags line - more reliable than searching whole output
    const flagsMatch = stdout.match(/^flags\s*:\s*(.+)$/im)
    if (flagsMatch) {
      const flags = ` ${flagsMatch[1].toLowerCase()} ` // Pad with spaces for word boundary matching

      // Check for SIMD flags using word boundaries
      capabilities.sse = / sse /.test(flags)
      capabilities.sse2 = / sse2 /.test(flags)
      capabilities.sse3 = / sse3 /.test(flags) || / pni /.test(flags)
      capabilities.ssse3 = / ssse3 /.test(flags)
      capabilities.sse41 = / sse4_1 /.test(flags)
      capabilities.sse42 = / sse4_2 /.test(flags)
      capabilities.avx = / avx /.test(flags)
      capabilities.avx2 = / avx2 /.test(flags)

      // AVX-512 has multiple feature flags - check for any of them
      capabilities.avx512 = /avx512/.test(flags)
    }
  }
}

/**
 * Detect CPU capabilities on macOS using sysctl
 */
async function detectMacOSCPUCapabilities(capabilities: CPUSIMDCapabilities): Promise<void> {
  // First check if this is Apple Silicon
  try {
    const { stdout: archOutput } = await execFileAsync('uname', ['-m'], { timeout: 2000 })
    const isAppleSilicon = archOutput.trim().toLowerCase() === 'arm64'

    if (isAppleSilicon) {
      capabilities.architecture = 'arm64'

      // Apple Silicon - get CPU brand
      try {
        const { stdout: brandOutput } = await execFileAsync(
          'sysctl',
          ['-n', 'machdep.cpu.brand_string'],
          { timeout: 2000 }
        )
        capabilities.cpuModel = brandOutput.trim() || 'Apple Silicon'
      } catch {
        // brand_string might not work on Apple Silicon, try chip info
        try {
          const { stdout: chipOutput } = await execFileAsync(
            'sysctl',
            ['-n', 'hw.chip'],
            { timeout: 2000 }
          )
          capabilities.cpuModel = chipOutput.trim() || 'Apple Silicon'
        } catch {
          capabilities.cpuModel = 'Apple Silicon'
        }
      }

      // Apple Silicon uses NEON (ARM SIMD)
      // Note: Apple Silicon does NOT support SVE - it uses Apple's custom AMX instead
      capabilities.neon = true
      capabilities.sve = false
      capabilities.sve2 = false

      // All x86 SIMD capabilities remain false
      return
    }
  } catch {
    // If uname fails, continue with Intel detection
  }

  // Intel Mac - use sysctl to get CPU features
  capabilities.architecture = 'x86_64'

  try {
    const { stdout: brandOutput } = await execFileAsync(
      'sysctl',
      ['-n', 'machdep.cpu.brand_string'],
      { timeout: 2000 }
    )
    capabilities.cpuModel = brandOutput.trim()
  } catch {
    // Ignore - we'll try to get features anyway
  }

  // Get CPU features
  try {
    const { stdout: featuresOutput } = await execFileAsync(
      'sysctl',
      ['-n', 'machdep.cpu.features'],
      { timeout: 2000 }
    )
    const features = ` ${featuresOutput.toLowerCase()} `

    capabilities.sse = features.includes('sse')
    capabilities.sse2 = features.includes('sse2')
    capabilities.sse3 = features.includes('sse3')
    capabilities.ssse3 = features.includes('ssse3') || features.includes('supplementalsse3')
    capabilities.sse41 = features.includes('sse4.1')
    capabilities.sse42 = features.includes('sse4.2')
    capabilities.avx = features.includes('avx1.0') || / avx /.test(features)
  } catch {
    // No features available
  }

  // Get leaf7 features (AVX2, AVX-512)
  try {
    const { stdout: leaf7Output } = await execFileAsync(
      'sysctl',
      ['-n', 'machdep.cpu.leaf7_features'],
      { timeout: 2000 }
    )
    const leaf7 = leaf7Output.toLowerCase()

    capabilities.avx2 = leaf7.includes('avx2')
    capabilities.avx512 = leaf7.includes('avx512')
  } catch {
    // leaf7 not available on older CPUs
  }
}

/**
 * Check if FFmpeg's x265 encoder supports AVX-512
 */
export async function checkX265AVX512Support(ffmpegPath: string): Promise<boolean> {
  try {
    const { stderr } = await execFileAsync(
      ffmpegPath,
      ['-hide_banner', '-f', 'lavfi', '-i', 'nullsrc=s=64x64:d=0.1', '-c:v', 'libx265', '-f', 'null', '-'],
      { timeout: 15000 }
    )

    // x265 logs detected CPU capabilities to stderr
    const output = stderr.toLowerCase()
    return output.includes('avx512') || output.includes('avx-512')
  } catch (error) {
    // Check if the error output contains the info we need
    const errorOutput = (error as { stderr?: string })?.stderr?.toLowerCase() || ''
    return errorOutput.includes('avx512') || errorOutput.includes('avx-512')
  }
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
