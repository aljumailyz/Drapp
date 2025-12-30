import type {
  ArchivalEncodingConfig,
  VideoSourceInfo,
  Av1Options
} from '../../../shared/types/archival.types'
import { getOptimalCrf, getResolutionCategory } from '../../../shared/types/archival.types'

/**
 * Builds FFmpeg command arguments for archival AV1 encoding
 *
 * Supports two encoders:
 * - libaom-av1: Higher quality, slower, widely available
 * - libsvtav1: Faster, slightly lower quality, may not be available
 *
 * Key features:
 * - Scene-change aware keyframe placement (prevents GOP crossing scene cuts)
 * - Film grain synthesis (SVT-AV1 only)
 * - HDR passthrough with proper color metadata
 * - Audio stream copy by default
 */
export function buildArchivalFFmpegArgs(
  inputPath: string,
  outputPath: string,
  config: ArchivalEncodingConfig,
  sourceInfo: VideoSourceInfo
): string[] {
  const args: string[] = []

  // Input
  args.push('-i', inputPath)

  // Video encoding with selected AV1 encoder
  const encoder = config.av1.encoder
  args.push('-c:v', encoder)

  // Determine effective CRF based on source info and config
  const effectiveCrf = config.av1.crf !== 30
    ? config.av1.crf
    : getOptimalCrf(sourceInfo)

  // CRF quality
  args.push('-crf', effectiveCrf.toString())

  // Build encoder-specific parameters
  if (encoder === 'libsvtav1') {
    // SVT-AV1 preset (0-13, lower = slower/better)
    args.push('-preset', config.av1.preset.toString())

    // Build SVT-AV1 params string
    const svtParams = buildSvtAv1Params(config.av1, sourceInfo)
    if (svtParams) {
      args.push('-svtav1-params', svtParams)
    }
  } else {
    // libaom-av1 parameters
    // cpu-used: 0-8 (lower = slower/better quality)
    args.push('-cpu-used', config.av1.preset.toString())

    // Build libaom params
    args.push(...buildLibaomParams(config.av1, sourceInfo))
  }

  // Handle HDR passthrough
  if (sourceInfo.isHdr) {
    args.push(...buildHdrArgs(sourceInfo))
  } else {
    // SDR: Use standard 8-bit pixel format
    args.push('-pix_fmt', 'yuv420p')
  }

  // Preserve frame rate from source
  // No explicit -r flag means FFmpeg uses source frame rate

  // Preserve resolution from source (no scaling)
  // No -vf scale filter needed

  // Audio handling
  if (config.audioCopy) {
    args.push('-c:a', 'copy')
  } else {
    args.push(...buildAudioArgs(config))
  }

  // Map video and audio streams explicitly
  // Don't try to copy subtitle streams from containers that may not support them (like MOV)
  args.push('-map', '0:v:0') // First video stream
  args.push('-map', '0:a?')  // All audio streams (optional - ? means don't fail if none)

  // Container-specific options
  if (config.container === 'mp4') {
    // Enable faststart for MP4 (moves moov atom to beginning)
    args.push('-movflags', '+faststart')
  }

  // Overwrite output
  args.push('-y')

  // Output
  args.push(outputPath)

  return args
}

/**
 * Build libaom-av1 specific parameters
 * These are passed directly as FFmpeg arguments
 */
function buildLibaomParams(options: Av1Options, sourceInfo: VideoSourceInfo): string[] {
  const args: string[] = []

  // Keyframe interval (GOP size)
  // -g sets max keyframe interval
  args.push('-g', options.keyframeInterval.toString())

  // Scene change detection - libaom handles this automatically
  // but we can influence it with -sc_threshold
  if (options.sceneChangeDetection) {
    args.push('-sc_threshold', '40') // Default is 40, 0 disables
  } else {
    args.push('-sc_threshold', '0')
  }

  // Tile columns and rows for parallel encoding
  // Helps with encoding speed on multi-core systems
  if (sourceInfo.width >= 1920) {
    args.push('-tile-columns', '2')
    args.push('-tile-rows', '1')
  }

  // Row-based multi-threading
  args.push('-row-mt', '1')

  // Adaptive quantization for better perceptual quality
  if (options.adaptiveQuantization) {
    args.push('-aq-mode', '1') // Variance-based AQ
  }

  // For HDR content
  if (sourceInfo.isHdr) {
    // libaom handles HDR automatically when given correct pixel format
    // Additional tuning for HDR
    args.push('-enable-cdef', '1')
  }

  // Usage mode: 0=good (default), 1=realtime
  // Good mode is better for archival
  args.push('-usage', 'good')

  // Lag-in-frames: allows encoder to look ahead for better decisions
  // Higher = better quality, more memory. 48 is a good balance
  args.push('-lag-in-frames', '48')

  // Auto-alt-ref: enables automatic alternate reference frames
  args.push('-auto-alt-ref', '1')

  return args
}

/**
 * Build SVT-AV1 specific parameters string
 * These go into the -svtav1-params option
 *
 * Optimized for archival use with focus on:
 * - Maximum quality preservation
 * - Scene-aware keyframes for better seeking without crossing scenes
 * - Film grain synthesis for natural appearance and better compression
 * - Proper HDR handling
 */
function buildSvtAv1Params(options: Av1Options, sourceInfo: VideoSourceInfo): string {
  const params: string[] = []

  // Keyframe interval (GOP size)
  // Use keyint for max interval, with scene detection to prevent crossing scene cuts
  // 240 frames (~8-10 seconds at 24-30fps) is good for archival - long enough for
  // compression efficiency but not so long that seeking becomes problematic
  params.push(`keyint=${options.keyframeInterval}`)

  // Scene change detection - CRITICAL for archival
  // scd=1 enables scene change detection, inserting keyframes at scene changes
  // This prevents the encoder from trying to predict across scene cuts
  if (options.sceneChangeDetection) {
    params.push('scd=1')
  } else {
    params.push('scd=0')
  }

  // Film grain synthesis
  // 0 = disabled, 1-50 = synthesis level
  // This is a key feature for archival - it analyzes and removes grain during encode,
  // then synthesizes it at decode time. This significantly improves compression
  // while maintaining the original film-like appearance.
  // Level 8-12 is good for most content; higher for very grainy footage
  if (options.filmGrainSynthesis > 0) {
    params.push(`film-grain=${options.filmGrainSynthesis}`)
    // Enable film grain denoising to work with synthesis
    params.push('film-grain-denoise=1')
  }

  // Tune mode for archival
  // 0 = VQ (visual quality) - best for archival as it optimizes for perceptual quality
  // 1 = PSNR - objective metric, not ideal for viewing
  // 2 = SSIM - structural similarity, better than PSNR but VQ is still preferred
  params.push(`tune=${options.tune}`)

  // Adaptive quantization for better perceptual quality
  if (options.adaptiveQuantization) {
    // enable-qm enables quantization matrices for better detail preservation
    params.push('enable-qm=1')
    // aq-mode=2 (deltaq) provides the best perceptual quality
    // by adjusting quantization based on spatial complexity
    params.push('aq-mode=2')
  }

  // Lookahead distance - more frames = better rate control decisions
  // For archival, we want maximum quality so use full lookahead
  // Default is 120 at preset 6, but we can be explicit
  params.push('lookahead=120')

  // For HDR content, ensure proper handling
  if (sourceInfo.isHdr) {
    // Enable HDR metadata passthrough
    params.push('enable-hdr=1')
  }

  // fast-decode=0 means no decode optimizations that would hurt quality
  // For archival we prioritize quality over decode speed
  params.push('fast-decode=0')

  // enable-tf (temporal filtering) - helps with grain and noise
  // Good for archival as it can smooth out compression artifacts
  params.push('enable-tf=1')

  return params.join(':')
}

/**
 * Build HDR passthrough arguments
 * Preserves HDR metadata and uses appropriate pixel format
 */
function buildHdrArgs(sourceInfo: VideoSourceInfo): string[] {
  const args: string[] = []

  // Use 10-bit pixel format for HDR
  args.push('-pix_fmt', 'yuv420p10le')

  // Preserve color metadata
  // These ensure the encoder doesn't override the source color info
  if (sourceInfo.colorSpace) {
    const colorParams = parseColorSpace(sourceInfo.colorSpace)
    if (colorParams.primaries) {
      args.push('-color_primaries', colorParams.primaries)
    }
    if (colorParams.transfer) {
      args.push('-color_trc', colorParams.transfer)
    }
    if (colorParams.matrix) {
      args.push('-colorspace', colorParams.matrix)
    }
  } else {
    // Default HDR color space (BT.2020 with PQ)
    args.push('-color_primaries', 'bt2020')
    args.push('-color_trc', 'smpte2084')
    args.push('-colorspace', 'bt2020nc')
  }

  return args
}

/**
 * Parse color space string to FFmpeg color parameters
 */
function parseColorSpace(colorSpace: string): {
  primaries?: string
  transfer?: string
  matrix?: string
} {
  const lower = colorSpace.toLowerCase()

  // BT.2020 / Rec. 2020 (common HDR)
  if (lower.includes('bt2020') || lower.includes('rec2020') || lower.includes('2020')) {
    return {
      primaries: 'bt2020',
      transfer: lower.includes('hlg') ? 'arib-std-b67' : 'smpte2084',
      matrix: 'bt2020nc'
    }
  }

  // BT.709 / Rec. 709 (SDR standard)
  if (lower.includes('bt709') || lower.includes('rec709') || lower.includes('709')) {
    return {
      primaries: 'bt709',
      transfer: 'bt709',
      matrix: 'bt709'
    }
  }

  // PQ transfer (HDR10)
  if (lower.includes('pq') || lower.includes('smpte2084') || lower.includes('2084')) {
    return {
      primaries: 'bt2020',
      transfer: 'smpte2084',
      matrix: 'bt2020nc'
    }
  }

  // HLG transfer
  if (lower.includes('hlg') || lower.includes('arib') || lower.includes('b67')) {
    return {
      primaries: 'bt2020',
      transfer: 'arib-std-b67',
      matrix: 'bt2020nc'
    }
  }

  return {}
}

/**
 * Build audio encoding arguments when not copying
 */
function buildAudioArgs(config: ArchivalEncodingConfig): string[] {
  const args: string[] = []

  switch (config.audioCodec) {
    case 'opus':
      args.push('-c:a', 'libopus')
      args.push('-b:a', `${config.audioBitrate ?? 128}k`)
      // Opus works best with 48kHz
      args.push('-ar', '48000')
      break

    case 'flac':
      args.push('-c:a', 'flac')
      // FLAC is lossless, no bitrate needed
      break

    case 'aac':
      args.push('-c:a', 'aac')
      args.push('-b:a', `${config.audioBitrate ?? 192}k`)
      break

    default:
      args.push('-c:a', 'copy')
  }

  return args
}

/**
 * Get a human-readable description of the encoding settings
 */
export function describeArchivalSettings(
  config: ArchivalEncodingConfig,
  sourceInfo?: VideoSourceInfo
): string {
  const lines: string[] = []
  const encoder = config.av1.encoder

  const encoderName = encoder === 'libsvtav1' ? 'SVT-AV1 (libsvtav1)' : 'libaom-av1'
  lines.push(`Encoder: ${encoderName}`)
  lines.push(`Preset: ${config.av1.preset} (${describePreset(config.av1.preset, encoder)})`)

  if (sourceInfo) {
    const effectiveCrf = getOptimalCrf(sourceInfo)
    const resolution = getResolutionCategory(sourceInfo.width, sourceInfo.height)
    lines.push(`Resolution: ${sourceInfo.width}x${sourceInfo.height} (${resolution})`)
    lines.push(`CRF: ${effectiveCrf} (${sourceInfo.isHdr ? 'HDR' : 'SDR'} profile)`)
    lines.push(`Frame Rate: ${sourceInfo.frameRate.toFixed(2)} fps`)
    lines.push(`Color: ${sourceInfo.isHdr ? 'HDR (10-bit)' : 'SDR (8-bit)'}`)
  } else {
    lines.push(`CRF: ${config.av1.crf} (auto-adjusted per video)`)
  }

  lines.push(`GOP Size: ${config.av1.keyframeInterval} frames (scene-aware)`)

  // Film grain only applies to SVT-AV1
  if (encoder === 'libsvtav1') {
    lines.push(`Film Grain: ${config.av1.filmGrainSynthesis > 0 ? `Level ${config.av1.filmGrainSynthesis}` : 'Disabled'}`)
  }

  lines.push(`Audio: ${config.audioCopy ? 'Copy (lossless)' : config.audioCodec?.toUpperCase()}`)
  lines.push(`Container: ${config.container.toUpperCase()}`)

  return lines.join('\n')
}

function describePreset(preset: number, encoder: string): string {
  if (encoder === 'libsvtav1') {
    // SVT-AV1: 0-13
    if (preset <= 2) return 'Very Slow - Maximum Quality'
    if (preset <= 4) return 'Slow - High Quality'
    if (preset <= 6) return 'Balanced Quality/Speed'
    if (preset <= 8) return 'Fast - Good Quality'
    if (preset <= 10) return 'Very Fast - Acceptable Quality'
    return 'Ultra Fast - Lower Quality'
  } else {
    // libaom-av1: 0-8
    if (preset <= 1) return 'Very Slow - Maximum Quality'
    if (preset <= 3) return 'Slow - High Quality'
    if (preset <= 5) return 'Balanced Quality/Speed'
    if (preset <= 6) return 'Fast - Good Quality'
    return 'Very Fast - Acceptable Quality'
  }
}

/**
 * Estimate output file size based on source info and CRF
 * This is a rough estimate - actual size depends heavily on content
 */
export function estimateArchivalFileSize(
  sourceInfo: VideoSourceInfo,
  crf: number
): { minMB: number; maxMB: number; estimatedMB: number } {
  // Base bitrate estimation for AV1 at CRF 30, 1080p, 30fps
  // AV1 is roughly 30-50% more efficient than HEVC
  const baseBitrateKbps = 2500 // ~2.5 Mbps for 1080p CRF 30

  // Resolution factor
  const pixels = sourceInfo.width * sourceInfo.height
  const basePixels = 1920 * 1080
  const resolutionFactor = pixels / basePixels

  // Frame rate factor
  const baseFps = 30
  const fpsFactor = sourceInfo.frameRate / baseFps

  // CRF factor (each CRF point roughly changes size by ~10-15%)
  const crfDiff = crf - 30
  const crfFactor = Math.pow(0.87, crfDiff) // ~13% per CRF point

  // HDR typically needs ~20% more bitrate for same perceptual quality
  const hdrFactor = sourceInfo.isHdr ? 1.2 : 1.0

  // Calculate estimated bitrate
  const estimatedBitrateKbps = baseBitrateKbps * resolutionFactor * fpsFactor * crfFactor * hdrFactor

  // Convert to file size
  const durationSeconds = sourceInfo.duration
  const estimatedBits = estimatedBitrateKbps * 1000 * durationSeconds
  const estimatedMB = estimatedBits / 8 / 1024 / 1024

  // Provide range (AV1 can vary significantly based on content complexity)
  return {
    minMB: Math.round(estimatedMB * 0.6),
    maxMB: Math.round(estimatedMB * 1.5),
    estimatedMB: Math.round(estimatedMB)
  }
}
