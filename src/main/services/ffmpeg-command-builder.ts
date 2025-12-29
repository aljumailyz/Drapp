import type {
  VideoEncodingConfig,
  HWAccelerator,
  VideoCodec,
  ScalingAlgorithm
} from '../../shared/types/encoding.types'

/**
 * Builds FFmpeg command arguments from encoding configuration
 */
export function buildFFmpegArgs(
  inputPath: string,
  outputPath: string,
  config: VideoEncodingConfig,
  sourceInfo?: { width: number; height: number; frameRate: number }
): string[] {
  const args: string[] = []

  // Hardware acceleration (must come before -i for input decoding)
  const hwAccelInput = getHWAccelInputArgs(config.hwAccel)
  args.push(...hwAccelInput)

  // Input
  args.push('-i', inputPath)

  // Video filters
  const filters = buildVideoFilters(config, sourceInfo)
  if (filters.length > 0) {
    args.push('-vf', filters.join(','))
  }

  // Video codec
  if (config.videoCodec === 'copy') {
    args.push('-c:v', 'copy')
  } else {
    const videoCodecArgs = buildVideoCodecArgs(config)
    args.push(...videoCodecArgs)
  }

  // Audio codec
  if (config.audioCodec === 'none') {
    args.push('-an')
  } else if (config.audioCodec === 'copy') {
    args.push('-c:a', 'copy')
  } else {
    const audioArgs = buildAudioArgs(config)
    args.push(...audioArgs)
  }

  // Container-specific options
  if (config.container === 'mp4' && config.fastStart) {
    args.push('-movflags', '+faststart')
  }

  // Frame rate
  if (config.frameRate !== 'source') {
    const fps = config.frameRate === 'custom' ? config.customFrameRate : parseInt(config.frameRate)
    if (fps) {
      args.push('-r', fps.toString())
    }
  }

  // Overwrite output
  args.push('-y')

  // Output
  args.push(outputPath)

  return args
}

/**
 * Get hardware acceleration input arguments
 */
function getHWAccelInputArgs(hwAccel: HWAccelerator): string[] {
  switch (hwAccel) {
    case 'videotoolbox':
      return ['-hwaccel', 'videotoolbox']
    case 'nvenc':
      return ['-hwaccel', 'cuda']
    case 'amf':
      return ['-hwaccel', 'dxva2'] // Windows DirectX
    case 'qsv':
      return ['-hwaccel', 'qsv']
    default:
      return []
  }
}

/**
 * Build video codec arguments
 */
function buildVideoCodecArgs(config: VideoEncodingConfig): string[] {
  const args: string[] = []

  // Get encoder name based on codec and hardware acceleration
  const encoder = getEncoderName(config.videoCodec, config.hwAccel)
  args.push('-c:v', encoder)

  // Profile (for H.264/H.265)
  if (config.profile && (config.videoCodec === 'h264' || config.videoCodec === 'h265')) {
    if (config.hwAccel === 'none') {
      args.push('-profile:v', config.profile)
    }
    // Hardware encoders have different profile naming
  }

  // Encoding speed preset
  if (config.hwAccel === 'none') {
    args.push('-preset', config.encodingSpeed)
  } else if (config.hwAccel === 'nvenc') {
    // NVENC preset mapping
    const nvencPreset = mapToNVENCPreset(config.encodingSpeed)
    args.push('-preset', nvencPreset)
  } else if (config.hwAccel === 'videotoolbox') {
    // VideoToolbox doesn't use presets the same way
    // Quality is controlled via bitrate or quality parameter
  }

  // Quality control
  if (config.bitrateMode === 'crf') {
    if (config.hwAccel === 'none') {
      args.push('-crf', config.crf.toString())
    } else if (config.hwAccel === 'nvenc') {
      // NVENC uses -cq for constant quality
      args.push('-cq', config.crf.toString())
      args.push('-rc', 'vbr')
    } else if (config.hwAccel === 'videotoolbox') {
      // VideoToolbox quality (0-100, inverted)
      const vtQuality = Math.max(0, Math.min(100, 100 - config.crf * 2))
      args.push('-q:v', vtQuality.toString())
    } else if (config.hwAccel === 'amf') {
      // AMF quality preset
      args.push('-quality', 'quality')
      args.push('-rc', 'cqp')
      args.push('-qp_i', config.crf.toString())
      args.push('-qp_p', (config.crf + 2).toString())
    }
  } else if (config.bitrateMode === 'cbr' && config.targetBitrate) {
    args.push('-b:v', `${config.targetBitrate}k`)
    args.push('-maxrate', `${config.targetBitrate}k`)
    args.push('-bufsize', `${config.targetBitrate * 2}k`)
  } else if (config.bitrateMode === 'vbr' && config.targetBitrate) {
    args.push('-b:v', `${config.targetBitrate}k`)
    if (config.maxBitrate) {
      args.push('-maxrate', `${config.maxBitrate}k`)
      args.push('-bufsize', `${config.maxBitrate * 2}k`)
    }
  }

  // Pixel format (for 10-bit profiles)
  if (config.profile === 'high10' || config.profile === 'main10') {
    args.push('-pix_fmt', 'yuv420p10le')
  } else if (config.videoCodec !== 'prores') {
    args.push('-pix_fmt', 'yuv420p')
  }

  return args
}

/**
 * Get encoder name based on codec and hardware acceleration
 */
function getEncoderName(codec: VideoCodec, hwAccel: HWAccelerator): string {
  const encoderMap: Record<VideoCodec, Record<HWAccelerator, string>> = {
    h264: {
      none: 'libx264',
      videotoolbox: 'h264_videotoolbox',
      nvenc: 'h264_nvenc',
      amf: 'h264_amf',
      qsv: 'h264_qsv'
    },
    h265: {
      none: 'libx265',
      videotoolbox: 'hevc_videotoolbox',
      nvenc: 'hevc_nvenc',
      amf: 'hevc_amf',
      qsv: 'hevc_qsv'
    },
    vp9: {
      none: 'libvpx-vp9',
      videotoolbox: 'libvpx-vp9',
      nvenc: 'libvpx-vp9',
      amf: 'libvpx-vp9',
      qsv: 'libvpx-vp9'
    },
    av1: {
      none: 'libsvtav1',
      videotoolbox: 'libsvtav1',
      nvenc: 'av1_nvenc', // Only on RTX 40 series
      amf: 'libsvtav1',
      qsv: 'av1_qsv'
    },
    prores: {
      none: 'prores_ks',
      videotoolbox: 'prores_videotoolbox',
      nvenc: 'prores_ks',
      amf: 'prores_ks',
      qsv: 'prores_ks'
    },
    copy: {
      none: 'copy',
      videotoolbox: 'copy',
      nvenc: 'copy',
      amf: 'copy',
      qsv: 'copy'
    }
  }

  return encoderMap[codec][hwAccel] || encoderMap[codec].none
}

/**
 * Map encoding speed to NVENC preset
 */
function mapToNVENCPreset(speed: string): string {
  const map: Record<string, string> = {
    ultrafast: 'p1',
    superfast: 'p2',
    veryfast: 'p3',
    faster: 'p4',
    fast: 'p5',
    medium: 'p5',
    slow: 'p6',
    slower: 'p7',
    veryslow: 'p7',
    placebo: 'p7'
  }
  return map[speed] || 'p5'
}

/**
 * Build video filter chain
 */
function buildVideoFilters(
  config: VideoEncodingConfig,
  sourceInfo?: { width: number; height: number; frameRate: number }
): string[] {
  const filters: string[] = []

  // Deinterlace
  if (config.filters.deinterlace) {
    filters.push('yadif=mode=0:parity=-1:deint=0')
  }

  // Crop
  if (config.cropMode !== 'none') {
    const cropFilter = buildCropFilter(config, sourceInfo)
    if (cropFilter) {
      filters.push(cropFilter)
    }
  }

  // Scale
  const scaleFilter = buildScaleFilter(config, sourceInfo)
  if (scaleFilter) {
    filters.push(scaleFilter)
  }

  // Denoise
  if (config.filters.denoise !== 'none') {
    const denoiseStrength = { light: '3:3:2:2', medium: '5:5:4:4', heavy: '8:8:6:6' }
    filters.push(`hqdn3d=${denoiseStrength[config.filters.denoise]}`)
  }

  // Sharpen
  if (config.filters.sharpen !== 'none') {
    const sharpenStrength = { light: '0.5', medium: '1.0', strong: '1.5' }
    filters.push(`unsharp=5:5:${sharpenStrength[config.filters.sharpen]}:5:5:0`)
  }

  // Color adjustments
  const { brightness, contrast, saturation, gamma } = config.filters
  if (brightness !== 0 || contrast !== 1 || saturation !== 1 || gamma !== 1) {
    const eqParts: string[] = []
    if (brightness !== 0) eqParts.push(`brightness=${brightness}`)
    if (contrast !== 1) eqParts.push(`contrast=${contrast}`)
    if (saturation !== 1) eqParts.push(`saturation=${saturation}`)
    if (gamma !== 1) eqParts.push(`gamma=${gamma}`)
    if (eqParts.length > 0) {
      filters.push(`eq=${eqParts.join(':')}`)
    }
  }

  // Speed adjustment
  if (config.filters.speed !== 1) {
    filters.push(`setpts=${1 / config.filters.speed}*PTS`)
  }

  return filters
}

/**
 * Build crop filter
 */
function buildCropFilter(
  config: VideoEncodingConfig,
  sourceInfo?: { width: number; height: number }
): string | null {
  if (config.cropMode === 'auto') {
    // Auto detect crop (black bar removal)
    return 'cropdetect=24:16:0'
  }

  if (config.cropMode === 'custom' && config.customCrop) {
    const { x, y, width, height } = config.customCrop
    return `crop=${width}:${height}:${x}:${y}`
  }

  // Aspect ratio crops
  const aspectRatios: Record<string, number> = {
    '16:9': 16 / 9,
    '4:3': 4 / 3,
    '1:1': 1,
    '9:16': 9 / 16,
    '21:9': 21 / 9
  }

  const targetRatio = aspectRatios[config.cropMode]
  if (!targetRatio || !sourceInfo) return null

  const sourceRatio = sourceInfo.width / sourceInfo.height

  if (Math.abs(sourceRatio - targetRatio) < 0.01) {
    // Already correct aspect ratio
    return null
  }

  if (sourceRatio > targetRatio) {
    // Source is wider, crop width
    const newWidth = Math.round(sourceInfo.height * targetRatio)
    const x = Math.round((sourceInfo.width - newWidth) / 2)
    return `crop=${newWidth}:${sourceInfo.height}:${x}:0`
  } else {
    // Source is taller, crop height
    const newHeight = Math.round(sourceInfo.width / targetRatio)
    const y = Math.round((sourceInfo.height - newHeight) / 2)
    return `crop=${sourceInfo.width}:${newHeight}:0:${y}`
  }
}

/**
 * Build scale filter
 */
function buildScaleFilter(
  config: VideoEncodingConfig,
  sourceInfo?: { width: number; height: number }
): string | null {
  if (config.resolution === 'source') {
    return null
  }

  let targetWidth: number
  let targetHeight: number

  if (config.resolution === 'custom') {
    if (!config.customWidth || !config.customHeight) return null
    targetWidth = config.customWidth
    targetHeight = config.customHeight
  } else {
    const preset = {
      '4k': { width: 3840, height: 2160 },
      '1440p': { width: 2560, height: 1440 },
      '1080p': { width: 1920, height: 1080 },
      '720p': { width: 1280, height: 720 },
      '480p': { width: 854, height: 480 },
      '360p': { width: 640, height: 360 }
    }[config.resolution]

    if (!preset) return null
    targetWidth = preset.width
    targetHeight = preset.height
  }

  // Map scaling algorithm to FFmpeg flag
  const scaleFlags: Record<ScalingAlgorithm, string> = {
    lanczos: 'lanczos',
    bicubic: 'bicubic',
    bilinear: 'bilinear',
    neighbor: 'neighbor',
    spline: 'spline'
  }

  const flags = scaleFlags[config.scalingAlgorithm] || 'lanczos'

  // Use -2 to maintain aspect ratio and ensure even dimensions
  return `scale=${targetWidth}:-2:flags=${flags}`
}

/**
 * Build audio arguments
 */
function buildAudioArgs(config: VideoEncodingConfig): string[] {
  const args: string[] = []

  // Audio codec
  const audioEncoders: Record<string, string> = {
    aac: 'aac',
    mp3: 'libmp3lame',
    opus: 'libopus',
    flac: 'flac'
  }

  args.push('-c:a', audioEncoders[config.audioCodec] || 'aac')

  // Audio bitrate (not for FLAC)
  if (config.audioCodec !== 'flac' && config.audioBitrate > 0) {
    args.push('-b:a', `${config.audioBitrate}k`)
  }

  // Channels
  if (config.audioChannels !== 'copy') {
    const channelMap: Record<string, string> = {
      mono: '1',
      stereo: '2',
      '5.1': '6'
    }
    args.push('-ac', channelMap[config.audioChannels] || '2')
  }

  // Sample rate
  args.push('-ar', config.audioSampleRate.toString())

  // Build audio filter chain (combine all audio filters into single -af)
  const audioFilters: string[] = []

  // Audio normalization
  if (config.normalizeAudio) {
    audioFilters.push('loudnorm=I=-16:TP=-1.5:LRA=11')
  }

  // Speed adjustment for audio (must match video)
  if (config.filters.speed !== 1) {
    const audioSpeed = config.filters.speed
    if (audioSpeed >= 0.5 && audioSpeed <= 2) {
      // atempo only supports 0.5-2x, need to chain for more extreme values
      audioFilters.push(`atempo=${audioSpeed}`)
    } else if (audioSpeed < 0.5) {
      const tempo1 = 0.5
      const tempo2 = audioSpeed / 0.5
      audioFilters.push(`atempo=${tempo1}`, `atempo=${tempo2}`)
    } else {
      const tempo1 = 2
      const tempo2 = audioSpeed / 2
      audioFilters.push(`atempo=${tempo1}`, `atempo=${tempo2}`)
    }
  }

  // Apply combined audio filters
  if (audioFilters.length > 0) {
    args.push('-af', audioFilters.join(','))
  }

  return args
}

/**
 * Estimate output file size based on config and duration
 */
export function estimateFileSize(
  config: VideoEncodingConfig,
  durationSeconds: number,
  sourceInfo?: { width: number; height: number; bitrate: number }
): { min: number; max: number; unit: 'MB' | 'GB' } {
  // Very rough estimation based on CRF and resolution
  let baseBitrate: number // in kbps

  // Resolution multiplier
  const resolutionMultipliers: Record<string, number> = {
    '4k': 4,
    '1440p': 2.5,
    '1080p': 1,
    '720p': 0.5,
    '480p': 0.25,
    '360p': 0.15,
    source: 1,
    custom: 1
  }

  const resMult = resolutionMultipliers[config.resolution] || 1

  // CRF to bitrate estimation (very rough)
  // CRF 18 ≈ 8-12 Mbps for 1080p
  // CRF 23 ≈ 4-6 Mbps for 1080p
  // Each CRF point roughly doubles/halves size
  const crfBase = Math.pow(2, (23 - config.crf) / 6) * 5000 // 5 Mbps at CRF 23
  baseBitrate = crfBase * resMult

  // Codec efficiency
  const codecMultipliers: Record<string, number> = {
    h264: 1,
    h265: 0.6,
    vp9: 0.65,
    av1: 0.5,
    prores: 10,
    copy: 1
  }
  baseBitrate *= codecMultipliers[config.videoCodec] || 1

  // Audio bitrate
  const audioBitrate = config.audioCodec === 'none' ? 0 : config.audioBitrate

  // Total bitrate
  const totalBitrate = baseBitrate + audioBitrate

  // Calculate size in MB
  const sizeKB = (totalBitrate * durationSeconds) / 8
  const sizeMB = sizeKB / 1024

  // Return range (±30%)
  const min = sizeMB * 0.7
  const max = sizeMB * 1.3

  if (max > 1024) {
    return { min: min / 1024, max: max / 1024, unit: 'GB' }
  }
  return { min, max, unit: 'MB' }
}

