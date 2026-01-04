import type {
  ArchivalEncodingConfig,
  VideoSourceInfo,
  Av1Options,
  H265Options,
  HdrMasteringDisplayMetadata,
  HdrContentLightLevel
} from '../../../shared/types/archival.types'
import { getOptimalCrf, getResolutionCategory } from '../../../shared/types/archival.types'
import type { CPUSIMDCapabilities } from '../hw-accel-detector'

/**
 * Determine the appropriate H.265 level based on resolution
 * Uses actual pixel count (luma samples) rather than just width/height
 *
 * Level limits (MaxLumaSamples):
 * - Level 4.0: 2,228,224 (~2048x1088)
 * - Level 4.1: 2,228,224 (~2048x1088) - higher bitrate than 4.0
 * - Level 5.0: 8,912,896 (~4096x2176)
 * - Level 5.1: 8,912,896 (~4096x2176) - higher bitrate than 5.0
 *
 * @returns level-idc value (40, 41, 50, or 51)
 */
function getH265Level(width: number, height: number): number {
  const lumaSamples = width * height

  // Level 4.1 max: 2,228,224 samples
  // Level 5.0/5.1 max: 8,912,896 samples
  if (lumaSamples > 8_912_896) {
    // Beyond 5.1 - use highest available
    return 62 // Level 6.2 for 8K
  } else if (lumaSamples > 2_228_224) {
    // Exceeds Level 4.1, need Level 5.x
    // Use 5.1 for higher bitrate headroom
    return 51
  } else if (lumaSamples > 983_040) {
    // Exceeds 720p (1280x720), use Level 4.1
    return 41
  }
  // Default for smaller resolutions
  return 40
}

/**
 * Two-pass encoding arguments
 * Contains separate argument arrays for each pass
 */
export interface TwoPassArgs {
  pass1: string[]
  pass2: string[]
  passLogFile: string
}

/**
 * Builds FFmpeg command arguments for archival encoding
 *
 * Supports two codecs:
 * - AV1 (libaom-av1, libsvtav1): Best compression for archival
 * - H.265/HEVC (libx265): Better compatibility for web delivery
 *
 * Key features:
 * - Scene-change aware keyframe placement (prevents GOP crossing scene cuts)
 * - Film grain synthesis (SVT-AV1 only)
 * - HDR passthrough with proper color metadata and HDR10 static metadata preservation
 * - Audio stream copy by default
 * - Two-pass encoding for better quality/size efficiency (optional)
 * - AVX-512 optimizations when available (for x265)
 *
 * @param inputPath - Path to input video file
 * @param outputPath - Path to output video file
 * @param config - Archival encoding configuration
 * @param sourceInfo - Source video metadata including HDR info
 * @param cpuCapabilities - Optional CPU SIMD capabilities for optimization
 */
export function buildArchivalFFmpegArgs(
  inputPath: string,
  outputPath: string,
  config: ArchivalEncodingConfig,
  sourceInfo: VideoSourceInfo,
  cpuCapabilities?: CPUSIMDCapabilities | null
): string[] {
  // Dispatch to codec-specific builder
  if (config.codec === 'h265') {
    return buildH265FFmpegArgs(inputPath, outputPath, config, sourceInfo, cpuCapabilities)
  }
  return buildAv1FFmpegArgs(inputPath, outputPath, config, sourceInfo)
}

/**
 * Check if two-pass encoding is enabled for the current config
 */
export function isTwoPassEnabled(config: ArchivalEncodingConfig): boolean {
  if (config.codec === 'h265') {
    return config.h265.twoPass === true
  }
  // For SVT-AV1, two-pass through FFmpeg isn't well supported
  // Only enable for libaom-av1
  if (config.av1.encoder === 'libaom-av1') {
    return config.av1.twoPass === true
  }
  return false
}

/**
 * Builds FFmpeg arguments for two-pass encoding
 * Returns separate argument arrays for pass 1 and pass 2
 *
 * @param inputPath - Path to input video file
 * @param outputPath - Path to output video file
 * @param config - Archival encoding configuration
 * @param sourceInfo - Source video metadata
 * @param passLogDir - Directory to store pass log files
 * @param cpuCapabilities - Optional CPU SIMD capabilities for optimization
 * @returns TwoPassArgs with pass1, pass2, and passLogFile paths
 */
export function buildTwoPassArgs(
  inputPath: string,
  outputPath: string,
  config: ArchivalEncodingConfig,
  sourceInfo: VideoSourceInfo,
  passLogDir: string,
  cpuCapabilities?: CPUSIMDCapabilities | null
): TwoPassArgs {
  const { basename, join } = require('node:path')
  const inputName = basename(inputPath, require('node:path').extname(inputPath))
  const passLogFile = join(passLogDir, `${inputName}-pass`)

  if (config.codec === 'h265') {
    return buildH265TwoPassArgs(inputPath, outputPath, config, sourceInfo, passLogFile, cpuCapabilities)
  }
  return buildAv1TwoPassArgs(inputPath, outputPath, config, sourceInfo, passLogFile)
}

/**
 * Build two-pass arguments for AV1 (libaom-av1 only)
 */
function buildAv1TwoPassArgs(
  inputPath: string,
  outputPath: string,
  config: ArchivalEncodingConfig,
  sourceInfo: VideoSourceInfo,
  passLogFile: string
): TwoPassArgs {
  const options = config.av1
  const encoder = options.encoder

  // Determine effective CRF
  const effectiveCrf = options.crf !== 30 ? options.crf : getOptimalCrf(sourceInfo)

  // ===== PASS 1 =====
  const pass1: string[] = []
  pass1.push('-i', inputPath)

  // Apply configured thread limit
  if (config.threadLimit > 0) {
    pass1.push('-threads', String(config.threadLimit))
  }

  pass1.push('-c:v', encoder)
  pass1.push('-crf', effectiveCrf.toString())

  if (encoder === 'libaom-av1') {
    pass1.push('-cpu-used', options.preset.toString())
    pass1.push(...buildLibaomParams(options, sourceInfo))
    pass1.push('-pass', '1')
    pass1.push('-passlogfile', passLogFile)
  }

  // HDR handling
  if (sourceInfo.isHdr) {
    pass1.push(...buildHdrArgs(sourceInfo))
  } else {
    pass1.push('-pix_fmt', 'yuv420p')
  }

  // No audio for pass 1
  pass1.push('-an')

  // Null output for pass 1
  pass1.push('-f', 'null')
  pass1.push('-y')
  pass1.push(process.platform === 'win32' ? 'NUL' : '/dev/null')

  // ===== PASS 2 =====
  const pass2: string[] = []
  pass2.push('-i', inputPath)

  // Apply configured thread limit
  if (config.threadLimit > 0) {
    pass2.push('-threads', String(config.threadLimit))
  }

  pass2.push('-c:v', encoder)
  pass2.push('-crf', effectiveCrf.toString())

  if (encoder === 'libaom-av1') {
    pass2.push('-cpu-used', options.preset.toString())
    pass2.push(...buildLibaomParams(options, sourceInfo))
    pass2.push('-pass', '2')
    pass2.push('-passlogfile', passLogFile)
  }

  // HDR handling
  if (sourceInfo.isHdr) {
    pass2.push(...buildHdrArgs(sourceInfo))
  } else {
    pass2.push('-pix_fmt', 'yuv420p')
  }

  // Audio handling (same as single-pass)
  const needsWebmAudioReencode = config.container === 'webm' &&
    config.audioCopy &&
    !isWebmCompatibleAudio(sourceInfo.audioCodec)

  const needsMp4AudioReencode = config.container === 'mp4' &&
    config.audioCopy &&
    isPcmAudio(sourceInfo.audioCodec)

  if (needsWebmAudioReencode) {
    pass2.push('-c:a', 'libopus')
    pass2.push('-b:a', `${config.audioBitrate ?? 128}k`)
    pass2.push('-ar', '48000')
  } else if (needsMp4AudioReencode) {
    // PCM audio must be transcoded for MP4 container
    pass2.push('-c:a', 'aac')
    pass2.push('-b:a', `${config.audioBitrate ?? 192}k`)
  } else if (config.audioCopy) {
    pass2.push('-c:a', 'copy')
  } else {
    pass2.push(...buildAudioArgs(config))
  }

  // Map streams
  pass2.push('-map', '0:v:0')
  pass2.push('-map', '0:a?')

  // Container options
  if (config.container === 'mp4') {
    pass2.push('-movflags', '+faststart')
  }

  pass2.push('-y')
  pass2.push(outputPath)

  return { pass1, pass2, passLogFile }
}

/**
 * Build two-pass arguments for H.265
 */
function buildH265TwoPassArgs(
  inputPath: string,
  outputPath: string,
  config: ArchivalEncodingConfig,
  sourceInfo: VideoSourceInfo,
  passLogFile: string,
  cpuCapabilities?: CPUSIMDCapabilities | null
): TwoPassArgs {
  const options = config.h265

  // ===== PASS 1 =====
  const pass1: string[] = []
  pass1.push('-i', inputPath)

  // Apply configured thread limit
  if (config.threadLimit > 0) {
    pass1.push('-threads', String(config.threadLimit))
  }

  pass1.push('-c:v', options.encoder)
  pass1.push('-crf', options.crf.toString())
  pass1.push('-preset', options.preset)

  // Build x265-params with pass=1
  const x265ParamsPass1 = buildX265ParamsWithPass(options, sourceInfo, 1, passLogFile, cpuCapabilities)
  if (x265ParamsPass1) {
    pass1.push('-x265-params', x265ParamsPass1)
  }

  if (options.tune) {
    pass1.push('-tune', options.tune)
  }

  // HDR handling
  if (sourceInfo.isHdr) {
    pass1.push(...buildHdrArgsH265(sourceInfo))
  } else {
    pass1.push('-pix_fmt', 'yuv420p')
  }

  // No audio for pass 1
  pass1.push('-an')

  // Null output for pass 1
  pass1.push('-f', 'null')
  pass1.push('-y')
  pass1.push(process.platform === 'win32' ? 'NUL' : '/dev/null')

  // ===== PASS 2 =====
  const pass2: string[] = []
  pass2.push('-i', inputPath)

  // Apply configured thread limit
  if (config.threadLimit > 0) {
    pass2.push('-threads', String(config.threadLimit))
  }

  pass2.push('-c:v', options.encoder)
  pass2.push('-crf', options.crf.toString())
  pass2.push('-preset', options.preset)

  // Build x265-params with pass=2
  const x265ParamsPass2 = buildX265ParamsWithPass(options, sourceInfo, 2, passLogFile, cpuCapabilities)
  if (x265ParamsPass2) {
    pass2.push('-x265-params', x265ParamsPass2)
  }

  if (options.tune) {
    pass2.push('-tune', options.tune)
  }

  // HDR handling
  if (sourceInfo.isHdr) {
    pass2.push(...buildHdrArgsH265(sourceInfo))
  } else {
    pass2.push('-pix_fmt', 'yuv420p')
  }

  // Audio handling (same as single-pass)
  // MP4 containers cannot store PCM audio - must transcode to AAC
  const needsMp4AudioReencode = config.container === 'mp4' &&
    config.audioCopy &&
    isPcmAudio(sourceInfo.audioCodec)

  if (needsMp4AudioReencode) {
    // PCM audio must be transcoded for MP4 container
    pass2.push('-c:a', 'aac')
    pass2.push('-b:a', `${config.audioBitrate ?? 192}k`)
  } else if (config.audioCopy) {
    pass2.push('-c:a', 'copy')
  } else {
    pass2.push(...buildAudioArgs(config))
  }

  // Map streams
  pass2.push('-map', '0:v:0')
  pass2.push('-map', '0:a?')

  // Container options
  if (config.container === 'mp4') {
    pass2.push('-movflags', '+faststart')
    pass2.push('-tag:v', 'hvc1')
  }

  pass2.push('-y')
  pass2.push(outputPath)

  return { pass1, pass2, passLogFile }
}

/**
 * Build x265-params string with pass information for two-pass encoding
 *
 * Note: x265 two-pass with CRF requires VBV settings (vbv-maxrate and vbv-bufsize)
 * We use "capped CRF" mode which provides consistent quality with bitrate limits
 *
 * @param options - H.265 encoding options
 * @param sourceInfo - Source video metadata including HDR info
 * @param passNumber - Which pass (1 or 2)
 * @param statsFile - Path to stats file for two-pass
 * @param cpuCapabilities - Optional CPU SIMD capabilities for optimization
 */
function buildX265ParamsWithPass(
  options: H265Options,
  sourceInfo: VideoSourceInfo,
  passNumber: 1 | 2,
  statsFile: string,
  cpuCapabilities?: CPUSIMDCapabilities | null
): string {
  const params: string[] = []

  // Pass control
  params.push(`pass=${passNumber}`)
  params.push(`stats=${statsFile}.log`)

  // VBV settings required for two-pass with CRF
  // Estimate reasonable bitrate based on resolution for "capped CRF" mode
  const vbvMaxrate = estimateVbvMaxrate(sourceInfo.width, sourceInfo.height, sourceInfo.frameRate)
  params.push(`vbv-maxrate=${vbvMaxrate}`)
  params.push(`vbv-bufsize=${vbvMaxrate * 2}`) // Buffer = 2x maxrate for smoother output

  // Standard params (same as single-pass)
  params.push(`keyint=${options.keyframeInterval}`)
  params.push(`min-keyint=${Math.min(options.keyframeInterval, 25)}`)
  params.push(`bframes=${options.bframes}`)
  params.push('scenecut=40')
  params.push('ref=4')
  params.push('rc-lookahead=40')
  params.push('sao=1')

  // HDR handling with full metadata preservation
  if (sourceInfo.isHdr) {
    params.push('hdr10=1')
    params.push('hdr10-opt=1')

    // Add HDR10 static metadata if available
    const masterDisplayStr = buildMasterDisplayString(sourceInfo.masteringDisplay)
    if (masterDisplayStr) {
      params.push(`master-display=${masterDisplayStr}`)
    }

    // Add content light level if available
    const maxCllStr = buildMaxCllString(sourceInfo.contentLightLevel)
    if (maxCllStr) {
      params.push(`max-cll=${maxCllStr}`)
    }
  }

  params.push('aq-mode=3')

  // Set appropriate level based on actual pixel count
  const level = getH265Level(sourceInfo.width, sourceInfo.height)
  params.push(`level-idc=${level}`)

  // Enable AVX-512 optimizations if available
  if (cpuCapabilities?.avx512) {
    params.push('asm=avx512')
  }

  return params.join(':')
}

/**
 * Estimate VBV maxrate (in kbps) based on resolution and frame rate
 * These are generous limits that allow CRF to work normally while enabling two-pass
 */
function estimateVbvMaxrate(width: number, height: number, frameRate: number): number {
  const pixels = width * height
  const fps = frameRate || 30

  // Base bitrates for different resolutions (in kbps)
  // These are high enough to not constrain CRF quality much
  let baseBitrate: number
  if (pixels >= 3840 * 2160) {
    baseBitrate = 40000 // 4K: 40 Mbps max
  } else if (pixels >= 2560 * 1440) {
    baseBitrate = 20000 // 1440p: 20 Mbps max
  } else if (pixels >= 1920 * 1080) {
    baseBitrate = 12000 // 1080p: 12 Mbps max
  } else if (pixels >= 1280 * 720) {
    baseBitrate = 8000 // 720p: 8 Mbps max
  } else {
    baseBitrate = 4000 // SD: 4 Mbps max
  }

  // Adjust for high frame rate content
  if (fps > 30) {
    baseBitrate = Math.round(baseBitrate * (fps / 30))
  }

  return baseBitrate
}

/**
 * Builds FFmpeg command arguments for AV1 encoding
 */
function buildAv1FFmpegArgs(
  inputPath: string,
  outputPath: string,
  config: ArchivalEncodingConfig,
  sourceInfo: VideoSourceInfo
): string[] {
  const args: string[] = []

  // Input
  args.push('-i', inputPath)

  // Apply configured thread limit
  if (config.threadLimit > 0) {
    args.push('-threads', String(config.threadLimit))
  }

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
  // WebM container only supports Opus and Vorbis audio codecs
  // MP4 container cannot store PCM audio
  // If audioCopy is enabled but source audio is incompatible, re-encode appropriately
  const needsWebmAudioReencode = config.container === 'webm' &&
    config.audioCopy &&
    !isWebmCompatibleAudio(sourceInfo.audioCodec)

  const needsMp4AudioReencode = config.container === 'mp4' &&
    config.audioCopy &&
    isPcmAudio(sourceInfo.audioCodec)

  if (needsWebmAudioReencode) {
    // Source audio is incompatible with WebM, re-encode to Opus
    args.push('-c:a', 'libopus')
    args.push('-b:a', `${config.audioBitrate ?? 128}k`)
    args.push('-ar', '48000')
  } else if (needsMp4AudioReencode) {
    // PCM audio must be transcoded for MP4 container - use AAC for best compatibility
    args.push('-c:a', 'aac')
    args.push('-b:a', `${config.audioBitrate ?? 192}k`)
  } else if (config.audioCopy) {
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
 * Builds FFmpeg command arguments for H.265/HEVC encoding
 * Optimized for web delivery with broad compatibility
 */
function buildH265FFmpegArgs(
  inputPath: string,
  outputPath: string,
  config: ArchivalEncodingConfig,
  sourceInfo: VideoSourceInfo,
  cpuCapabilities?: CPUSIMDCapabilities | null
): string[] {
  const args: string[] = []

  // Input
  args.push('-i', inputPath)

  // Apply configured thread limit
  if (config.threadLimit > 0) {
    args.push('-threads', String(config.threadLimit))
  }

  // Video encoding with libx265
  args.push('-c:v', config.h265.encoder)

  // CRF quality (H.265 uses 0-51 scale, 23 is default)
  args.push('-crf', config.h265.crf.toString())

  // Preset for encoding speed/quality tradeoff
  args.push('-preset', config.h265.preset)

  // Build x265-params string (includes AVX-512 optimization when available)
  const x265Params = buildX265Params(config.h265, sourceInfo, cpuCapabilities)
  if (x265Params) {
    args.push('-x265-params', x265Params)
  }

  // Tune for specific content (optional)
  if (config.h265.tune) {
    args.push('-tune', config.h265.tune)
  }

  // Handle HDR passthrough
  if (sourceInfo.isHdr) {
    args.push(...buildHdrArgsH265(sourceInfo))
  } else {
    // SDR: Use standard 8-bit pixel format
    args.push('-pix_fmt', 'yuv420p')
  }

  // Audio handling for H.265 (typically paired with AAC for web delivery)
  // MP4 containers cannot store PCM audio - must transcode to AAC
  const needsMp4AudioReencode = config.container === 'mp4' &&
    config.audioCopy &&
    isPcmAudio(sourceInfo.audioCodec)

  if (needsMp4AudioReencode) {
    // PCM audio must be transcoded for MP4 container
    args.push('-c:a', 'aac')
    args.push('-b:a', `${config.audioBitrate ?? 192}k`)
  } else if (config.audioCopy) {
    args.push('-c:a', 'copy')
  } else {
    args.push(...buildAudioArgs(config))
  }

  // Map video and audio streams explicitly
  args.push('-map', '0:v:0') // First video stream
  args.push('-map', '0:a?')  // All audio streams (optional)

  // Container-specific options
  if (config.container === 'mp4') {
    // Enable faststart for MP4 (moves moov atom to beginning for web streaming)
    args.push('-movflags', '+faststart')
  }

  // Tag for better compatibility (hvc1 is more widely supported than hev1)
  if (config.container === 'mp4') {
    args.push('-tag:v', 'hvc1')
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
 * - Proper HDR handling with full metadata preservation
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

  // For HDR content, ensure proper handling with full metadata preservation
  if (sourceInfo.isHdr) {
    // Enable HDR metadata passthrough
    params.push('enable-hdr=1')

    // SVT-AV1 HDR10 static metadata passthrough
    // Format for mastering-display: G(x,y)B(x,y)R(x,y)WP(x,y)L(max,min)
    // Note: SVT-AV1 uses the same format as x265
    const masterDisplayStr = buildMasterDisplayString(sourceInfo.masteringDisplay)
    if (masterDisplayStr) {
      params.push(`mastering-display=${masterDisplayStr}`)
    }

    // Content light level: maxCLL,maxFALL
    const maxCllStr = buildMaxCllString(sourceInfo.contentLightLevel)
    if (maxCllStr) {
      params.push(`content-light=${maxCllStr}`)
    }
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
 * Build x265-specific parameters string
 * Optimized for web delivery with good compression
 *
 * @param options - H.265 encoding options
 * @param sourceInfo - Source video metadata including HDR info
 * @param cpuCapabilities - Optional CPU SIMD capabilities for optimization
 */
function buildX265Params(
  options: H265Options,
  sourceInfo: VideoSourceInfo,
  cpuCapabilities?: CPUSIMDCapabilities | null
): string {
  const params: string[] = []

  // Keyframe interval (GOP size)
  // For web delivery, shorter GOPs are better for seeking
  params.push(`keyint=${options.keyframeInterval}`)
  params.push(`min-keyint=${Math.min(options.keyframeInterval, 25)}`)

  // B-frames for better compression
  params.push(`bframes=${options.bframes}`)

  // Scene cut detection for better keyframe placement
  params.push('scenecut=40')

  // Reference frames for better compression
  params.push('ref=4')

  // Lookahead for better rate control
  params.push('rc-lookahead=40')

  // Enable SAO (Sample Adaptive Offset) for better quality
  params.push('sao=1')

  // For HDR content, ensure proper handling with full metadata preservation
  if (sourceInfo.isHdr) {
    params.push('hdr10=1')
    params.push('hdr10-opt=1')

    // Add HDR10 static metadata if available
    const masterDisplayStr = buildMasterDisplayString(sourceInfo.masteringDisplay)
    if (masterDisplayStr) {
      params.push(`master-display=${masterDisplayStr}`)
    }

    // Add content light level if available
    const maxCllStr = buildMaxCllString(sourceInfo.contentLightLevel)
    if (maxCllStr) {
      params.push(`max-cll=${maxCllStr}`)
    }
  }

  // Adaptive quantization for better perceptual quality
  params.push('aq-mode=3') // Auto-variance AQ

  // Set appropriate level based on actual pixel count
  const level = getH265Level(sourceInfo.width, sourceInfo.height)
  params.push(`level-idc=${level}`)

  // Enable AVX-512 optimizations if available
  // x265 auto-detects, but we can force it for maximum performance
  if (cpuCapabilities?.avx512) {
    params.push('asm=avx512')
  }

  return params.join(':')
}

/**
 * Build x265 master-display string from HDR metadata
 * Format: G(x,y)B(x,y)R(x,y)WP(x,y)L(max,min)
 * All chromaticity values are in 0.00002 units (multiply by 50000)
 * Luminance is in 0.0001 cd/m² units
 */
function buildMasterDisplayString(metadata?: HdrMasteringDisplayMetadata): string | null {
  if (!metadata) return null

  // Ensure we have valid data
  if (!metadata.greenX || !metadata.blueX || !metadata.redX) return null

  // Format: G(gx,gy)B(bx,by)R(rx,ry)WP(wpx,wpy)L(maxL,minL)
  // x265 expects coordinates as integers where 50000 = 1.0
  // and luminance where 10000 = 1 cd/m²
  const maxL = Math.round(metadata.maxLuminance * 10000)
  const minL = Math.round(metadata.minLuminance * 10000)

  return `G(${metadata.greenX},${metadata.greenY})B(${metadata.blueX},${metadata.blueY})R(${metadata.redX},${metadata.redY})WP(${metadata.whitePointX},${metadata.whitePointY})L(${maxL},${minL})`
}

/**
 * Build x265 max-cll string from content light level metadata
 * Format: maxCLL,maxFALL (both in cd/m²)
 */
function buildMaxCllString(metadata?: HdrContentLightLevel): string | null {
  if (!metadata) return null
  if (metadata.maxCll === 0 && metadata.maxFall === 0) return null

  return `${metadata.maxCll},${metadata.maxFall}`
}

/**
 * Build HDR passthrough arguments for H.265
 * Preserves HDR metadata with proper color parameters
 */
function buildHdrArgsH265(sourceInfo: VideoSourceInfo): string[] {
  const args: string[] = []

  // Use 10-bit pixel format for HDR
  args.push('-pix_fmt', 'yuv420p10le')

  // Use precise color metadata from source if available
  if (sourceInfo.colorPrimaries || sourceInfo.colorTransfer || sourceInfo.colorMatrix) {
    // Use exact values from source
    if (sourceInfo.colorPrimaries) {
      args.push('-color_primaries', sourceInfo.colorPrimaries)
    }
    if (sourceInfo.colorTransfer) {
      args.push('-color_trc', sourceInfo.colorTransfer)
    }
    if (sourceInfo.colorMatrix) {
      args.push('-colorspace', sourceInfo.colorMatrix)
    }
  } else if (sourceInfo.colorSpace) {
    // Fall back to parsing combined color space string
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
 * Build HDR passthrough arguments
 * Preserves HDR metadata and uses appropriate pixel format
 */
function buildHdrArgs(sourceInfo: VideoSourceInfo): string[] {
  const args: string[] = []

  // Use 10-bit pixel format for HDR
  args.push('-pix_fmt', 'yuv420p10le')

  // Use precise color metadata from source if available
  if (sourceInfo.colorPrimaries || sourceInfo.colorTransfer || sourceInfo.colorMatrix) {
    // Use exact values from source
    if (sourceInfo.colorPrimaries) {
      args.push('-color_primaries', sourceInfo.colorPrimaries)
    }
    if (sourceInfo.colorTransfer) {
      args.push('-color_trc', sourceInfo.colorTransfer)
    }
    if (sourceInfo.colorMatrix) {
      args.push('-colorspace', sourceInfo.colorMatrix)
    }
  } else if (sourceInfo.colorSpace) {
    // Fall back to parsing combined color space string
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
 * Check if an audio codec is compatible with WebM container
 * WebM only supports Vorbis and Opus audio codecs
 */
function isWebmCompatibleAudio(audioCodec?: string): boolean {
  if (!audioCodec) return false
  const codec = audioCodec.toLowerCase()
  return codec === 'opus' || codec === 'vorbis'
}

/**
 * Check if an audio codec is PCM (uncompressed)
 * PCM audio cannot be stored in MP4 containers - needs transcoding
 */
function isPcmAudio(audioCodec?: string): boolean {
  if (!audioCodec) return false
  const codec = audioCodec.toLowerCase()
  // PCM formats: pcm_s16le, pcm_s24le, pcm_s32le, pcm_f32le, pcm_s16be, etc.
  return codec.startsWith('pcm_')
}

/**
 * Check if an audio codec is compatible with MP4 container
 * MP4 supports AAC, AC3, EAC3, ALAC, MP3, Opus, and FLAC (in some players)
 * PCM audio is NOT supported in MP4
 */
function isMp4CompatibleAudio(audioCodec?: string): boolean {
  if (!audioCodec) return false
  const codec = audioCodec.toLowerCase()
  // Common MP4-compatible audio codecs
  const compatible = ['aac', 'mp3', 'ac3', 'eac3', 'alac', 'opus', 'flac']
  return compatible.includes(codec) || !isPcmAudio(audioCodec)
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

  // Codec selection
  lines.push(`Codec: ${config.codec === 'h265' ? 'H.265/HEVC' : 'AV1'}`)

  if (config.codec === 'h265') {
    // H.265 settings
    lines.push(`Encoder: libx265`)
    lines.push(`Preset: ${config.h265.preset}`)

    if (sourceInfo) {
      const resolution = getResolutionCategory(sourceInfo.width, sourceInfo.height)
      lines.push(`Resolution: ${sourceInfo.width}x${sourceInfo.height} (${resolution})`)
      lines.push(`CRF: ${config.h265.crf}`)
      lines.push(`Frame Rate: ${sourceInfo.frameRate.toFixed(2)} fps`)
      lines.push(`Color: ${sourceInfo.isHdr ? 'HDR (10-bit)' : 'SDR (8-bit)'}`)
    } else {
      lines.push(`CRF: ${config.h265.crf}`)
    }

    lines.push(`GOP Size: ${config.h265.keyframeInterval} frames`)
    lines.push(`B-frames: ${config.h265.bframes}`)

    if (config.h265.tune) {
      lines.push(`Tune: ${config.h265.tune}`)
    }
  } else {
    // AV1 settings
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
  }

  // Determine audio handling description
  let audioDesc: string
  if (config.audioCopy) {
    // Check if WebM would need re-encoding
    const needsWebmReencode = config.container === 'webm' &&
      sourceInfo &&
      !isWebmCompatibleAudio(sourceInfo.audioCodec)
    // Check if MP4 has PCM audio that needs re-encoding
    const needsMp4Reencode = config.container === 'mp4' &&
      sourceInfo &&
      isPcmAudio(sourceInfo.audioCodec)
    if (needsWebmReencode) {
      audioDesc = `Opus (re-encoded for WebM, source: ${sourceInfo.audioCodec || 'unknown'})`
    } else if (needsMp4Reencode) {
      audioDesc = `AAC (re-encoded for MP4, source: ${sourceInfo.audioCodec || 'PCM'})`
    } else {
      audioDesc = 'Copy (lossless)'
    }
  } else {
    audioDesc = config.audioCodec?.toUpperCase() ?? 'Copy'
  }
  lines.push(`Audio: ${audioDesc}`)
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
