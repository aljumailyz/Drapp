// Archival Processing Types for SVT-AV1 Encoding
// Designed for long-term video archival with optimal compression

export type ArchivalResolution = '4k' | '1440p' | '1080p' | '720p' | '480p' | '360p' | 'source'

export type ArchivalColorMode = 'hdr' | 'sdr' | 'auto'

/**
 * HDR10 static metadata for mastering display
 * Chromaticity values are stored as integers where 50000 = 1.0 (e.g., 13250 = 0.265)
 * Luminance values are stored in nits (cd/m²)
 */
export interface HdrMasteringDisplayMetadata {
  // Display primaries (xy chromaticity coordinates as integers, 50000 = 1.0)
  // e.g., for BT.2020: G(8500,39850) B(6550,2300) R(35400,14600)
  greenX: number
  greenY: number
  blueX: number
  blueY: number
  redX: number
  redY: number
  // White point (xy chromaticity coordinates as integers, 50000 = 1.0)
  whitePointX: number
  whitePointY: number
  // Luminance in nits (cd/m²) - will be multiplied by 10000 for x265/SVT-AV1 format
  maxLuminance: number // e.g., 1000 for 1000 nits peak brightness
  minLuminance: number // e.g., 0.0001 for very dark blacks
}

/**
 * Content light level metadata (MaxCLL, MaxFALL)
 */
export interface HdrContentLightLevel {
  maxCll: number // Maximum Content Light Level in nits
  maxFall: number // Maximum Frame Average Light Level in nits
}

/**
 * Video metadata used for determining optimal encoding settings
 */
export interface VideoSourceInfo {
  width: number
  height: number
  frameRate: number
  duration: number // in seconds
  bitDepth?: number // 8, 10, or 12
  colorSpace?: string // bt709, bt2020, etc.
  hdrFormat?: string | null // HDR10, HLG, DolbyVision, etc.
  isHdr: boolean
  bitrate?: number // Source bitrate in bits per second
  videoCodec?: string // Source video codec (h264, hevc, vp9, av1, etc.)
  audioCodec?: string // Source audio codec (aac, opus, vorbis, flac, pcm_s16le, etc.)
  container?: string // Source container format (mp4, mkv, webm, mov, avi, etc.)
  // HDR10 static metadata (for proper HDR preservation)
  masteringDisplay?: HdrMasteringDisplayMetadata
  contentLightLevel?: HdrContentLightLevel
  // Color primaries and transfer characteristics from source
  colorPrimaries?: string // bt709, bt2020, etc.
  colorTransfer?: string // smpte2084 (PQ), arib-std-b67 (HLG), bt709, etc.
  colorMatrix?: string // bt709, bt2020nc, bt2020c, etc.
}

/**
 * CRF settings based on resolution and HDR status
 * Lower CRF = higher quality = larger files
 */
export interface ArchivalCrfMatrix {
  hdr: {
    '4k': number
    '1440p': number
    '1080p': number
    '720p': number
    '480p': number
    '360p': number
  }
  sdr: {
    '4k': number
    '1440p': number
    '1080p': number
    '720p': number
    '480p': number
    '360p': number
  }
}

/**
 * Default CRF values for archival encoding
 * These are tuned for SVT-AV1 and optimized for archival quality:
 * - HDR content uses lower CRF (higher quality) to preserve dynamic range
 * - Lower resolutions can use higher CRF while maintaining perceptual quality
 *
 * CRF Scale:
 * - 18-24: Visually lossless (large files)
 * - 25-30: Very high quality (good archival)
 * - 31-35: Good quality (aggressive archival)
 * - 36+: Acceptable quality (very aggressive)
 */
export const ARCHIVAL_CRF_DEFAULTS: ArchivalCrfMatrix = {
  hdr: {
    '4k': 29,    // Ultra-safe: 28, aggressive: 30 max
    '1440p': 28, // aggressive: 29 max
    '1080p': 28, // default 28, aggressive: 29 max
    '720p': 27,  // aggressive: 28 max
    '480p': 27,
    '360p': 27
  },
  sdr: {
    '4k': 30,    // aggressive: 31 max
    '1440p': 31, // aggressive: 32 max
    '1080p': 29, // aggressive: 31-32 max
    '720p': 32,  // default 32, aggressive: 34 max
    '480p': 34,  // default 34
    '360p': 36   // default 36, aggressive: 37 max
  }
}

/**
 * Maximum CRF values - going beyond these will cause visible quality loss
 */
export const ARCHIVAL_CRF_MAX: ArchivalCrfMatrix = {
  hdr: {
    '4k': 30,
    '1440p': 29,
    '1080p': 29,
    '720p': 28,
    '480p': 28,
    '360p': 28
  },
  sdr: {
    '4k': 32,
    '1440p': 33,
    '1080p': 32,
    '720p': 34,
    '480p': 36,
    '360p': 38
  }
}

/**
 * Bitrate thresholds for CRF adjustment (in bits per second)
 *
 * If source bitrate is below these thresholds, we raise CRF to avoid
 * over-compressing already-compressed content. This prevents quality loss
 * from re-encoding low-bitrate sources.
 *
 * - Below `low`: Source is very compressed, raise CRF by 3
 * - Below `medium`: Source is moderately compressed, raise CRF by 1
 * - Above `medium`: High bitrate source, use default CRF
 */
export const BITRATE_THRESHOLDS: Record<
  Exclude<ArchivalResolution, 'source'>,
  { low: number; medium: number }
> = {
  '4k': { low: 8_000_000, medium: 15_000_000 }, // 8 Mbps / 15 Mbps
  '1440p': { low: 4_000_000, medium: 8_000_000 }, // 4 Mbps / 8 Mbps
  '1080p': { low: 2_500_000, medium: 5_000_000 }, // 2.5 Mbps / 5 Mbps
  '720p': { low: 1_500_000, medium: 3_000_000 }, // 1.5 Mbps / 3 Mbps
  '480p': { low: 800_000, medium: 1_500_000 }, // 800 kbps / 1.5 Mbps
  '360p': { low: 400_000, medium: 800_000 } // 400 kbps / 800 kbps
}

/**
 * Adjust CRF based on source bitrate to avoid over-compression
 *
 * Low-bitrate sources are already compressed and re-encoding them with
 * aggressive CRF can cause generation loss. This function raises CRF
 * for such sources to preserve quality.
 *
 * @returns Object with adjusted CRF, the adjustment amount, and optional reason
 */
export function getBitrateAdjustedCrf(
  sourceInfo: VideoSourceInfo,
  baseCrf: number
): { adjustedCrf: number; adjustment: number; reason?: string } {
  if (!sourceInfo.bitrate || sourceInfo.bitrate <= 0) {
    return { adjustedCrf: baseCrf, adjustment: 0 }
  }

  const resolution = getResolutionCategory(sourceInfo.width, sourceInfo.height)
  if (resolution === 'source') {
    return { adjustedCrf: baseCrf, adjustment: 0 }
  }

  const thresholds = BITRATE_THRESHOLDS[resolution]
  if (!thresholds) {
    return { adjustedCrf: baseCrf, adjustment: 0 }
  }

  const bitrateMbps = (sourceInfo.bitrate / 1_000_000).toFixed(1)

  if (sourceInfo.bitrate < thresholds.low) {
    // Very low bitrate source - significant CRF increase to avoid artifacts
    const adjustment = 3
    return {
      adjustedCrf: Math.min(baseCrf + adjustment, 45), // Cap at CRF 45
      adjustment,
      reason: `Low bitrate source (${bitrateMbps} Mbps) - raising CRF to avoid over-compression`
    }
  }

  if (sourceInfo.bitrate < thresholds.medium) {
    // Moderately compressed source - small CRF increase
    const adjustment = 1
    return {
      adjustedCrf: Math.min(baseCrf + adjustment, 45),
      adjustment,
      reason: `Moderate bitrate source (${bitrateMbps} Mbps) - slight CRF adjustment`
    }
  }

  // High bitrate source - use default CRF
  return { adjustedCrf: baseCrf, adjustment: 0 }
}

/**
 * Video codec type for archival encoding
 * - av1: Best compression, ideal for long-term archival storage
 * - h265: HEVC, better compatibility for web delivery and playback
 */
export type ArchivalCodec = 'av1' | 'h265'

/**
 * AV1 encoder type
 * - libaom-av1: Higher quality, slower (default, widely available)
 * - libsvtav1: Faster encoding, slightly lower quality (if available)
 */
export type Av1Encoder = 'libaom-av1' | 'libsvtav1'

/**
 * H.265 (HEVC) encoder type
 * - libx265: Software encoder, widely available, good quality
 */
export type H265Encoder = 'libx265'

/**
 * AV1 encoding options
 * Supports both libaom-av1 and libsvtav1 encoders
 */
export interface Av1Options {
  // Encoder to use (libaom-av1 is more widely available)
  encoder: Av1Encoder

  // CPU usage preset
  // For libaom-av1: 0-8 (lower = slower/better, 4-6 recommended for archival)
  // For libsvtav1: 0-13 (lower = slower/better, 4-6 recommended for archival)
  preset: number

  // Keyframe interval (GOP size) - max frames between keyframes
  // Using scene-change detection to avoid crossing scene cuts
  keyframeInterval: number

  // Enable scene change detection to prevent GOP crossing scene boundaries
  sceneChangeDetection: boolean

  // Film grain synthesis level (0-50, 0 = disabled)
  // Only supported by libsvtav1; ignored for libaom-av1
  filmGrainSynthesis: number

  // Tune for specific content types
  // 0 = VQ/PSNR, 1 = SSIM (libaom uses different values)
  tune: 0 | 1 | 2

  // Enable adaptive quantization for better perceptual quality
  adaptiveQuantization: boolean

  // CRF value (0-63, lower = higher quality)
  crf: number

  // Two-pass encoding for better quality/size efficiency
  // Takes longer but provides more consistent quality across the video
  twoPass?: boolean
}

/**
 * H.265 (HEVC) encoding options
 * Optimized for web delivery with broad compatibility
 */
export interface H265Options {
  // Encoder to use (libx265 is the standard software encoder)
  encoder: H265Encoder

  // Preset speed (ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow)
  // For archival/web delivery, 'medium' to 'slow' is recommended
  preset: 'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium' | 'slow' | 'slower' | 'veryslow'

  // Tune for specific content types
  // - none: Default, good for general content
  // - film: Optimized for film grain preservation
  // - animation: Better for animated content
  // - grain: Preserves film grain
  tune?: 'film' | 'animation' | 'grain' | 'fastdecode' | 'zerolatency'

  // CRF value (0-51, lower = higher quality)
  // 18-23 is considered visually lossless, 23-28 is good quality
  crf: number

  // Keyframe interval (GOP size) - max frames between keyframes
  keyframeInterval: number

  // Enable B-frames for better compression (default: enabled)
  bframes: number

  // Two-pass encoding for better quality/size efficiency
  // Takes longer but provides more consistent quality across the video
  twoPass?: boolean
}

/**
 * Complete archival encoding configuration
 */
export interface ArchivalEncodingConfig {
  // Video settings
  resolution: ArchivalResolution
  colorMode: ArchivalColorMode

  // Codec selection - AV1 for maximum compression, H.265 for web compatibility
  codec: ArchivalCodec

  // AV1 encoder settings (supports libaom-av1 and libsvtav1)
  av1: Av1Options

  // H.265 encoder settings (for web delivery)
  h265: H265Options

  // Audio settings - copy by default to preserve quality
  audioCopy: boolean
  audioCodec?: 'opus' | 'flac' | 'aac' // fallback if copy fails
  audioBitrate?: number // for lossy codecs

  // Container - MKV recommended for AV1 + various audio
  container: 'mkv' | 'mp4' | 'webm'

  // Output settings
  outputDir: string
  preserveStructure: boolean // Keep subfolder structure from input

  // Processing
  overwriteExisting: boolean
  fillMode: boolean // Skip files that would conflict with existing output names
  deleteOriginal: boolean // Dangerous - disabled by default
  deleteOutputIfLarger: boolean // Delete output and keep original if output is larger

  // Thumbnail extraction
  extractThumbnail: boolean // Extract a thumbnail from the encoded video
  thumbnailTimestamp?: number // Timestamp in seconds to extract thumbnail (default: 10% into video)

  // Caption extraction
  extractCaptions: boolean // Extract captions/subtitles using Whisper
  captionLanguage?: string // Language code for transcription (e.g., 'en', 'es', 'auto')

  // Resource management
  threadLimit: 0 | 4 | 6 // Limit encoder threads (0 = no limit)
}

/**
 * Encoding presets for common use cases
 */
export type ArchivalPreset = 'archive' | 'max-compression' | 'fast'

/**
 * Default archival configuration
 *
 * These defaults are optimized for long-term video archival:
 * - SVT-AV1 (libsvtav1): Fast encoding with excellent quality
 * - Preset 6: Balanced quality/speed (recommended for archival)
 * - 240-frame GOP with scene detection: Good compression without crossing scene cuts
 * - enable-tf (temporal filtering): Reduces bitrate for noisy/low-light footage
 * - Film grain synthesis: Preserves grain appearance while improving compression
 * - Audio copy: Preserves original audio losslessly
 * - MKV container: Best compatibility with AV1 and various audio codecs
 */
export const DEFAULT_ARCHIVAL_CONFIG: Omit<ArchivalEncodingConfig, 'outputDir'> = {
  resolution: 'source',
  colorMode: 'auto',

  codec: 'av1', // Default to AV1 for best compression

  av1: {
    encoder: 'libsvtav1', // Faster than libaom with excellent quality
    preset: 6, // SVT-AV1: 0-13, lower=slower/better. 6 is balanced
    keyframeInterval: 240, // ~8-10 seconds at 24-30fps
    sceneChangeDetection: true, // CRITICAL: prevents GOP crossing scene cuts
    filmGrainSynthesis: 10, // Helps with noisy footage, disable for screen recordings
    tune: 0, // VQ (visual quality) - best for archival viewing
    adaptiveQuantization: true, // Better detail in complex areas
    crf: 30, // Will be auto-adjusted based on resolution/HDR
    twoPass: false // Single-pass by default for faster encoding
  },

  h265: {
    encoder: 'libx265',
    preset: 'medium', // Balanced speed/quality for web delivery
    crf: 23, // Visually transparent for most content
    keyframeInterval: 250, // ~10 seconds, good for streaming
    bframes: 4, // Standard B-frame count for good compression
    twoPass: false // Single-pass by default for faster encoding
  },

  audioCopy: true, // Preserve original audio losslessly
  audioCodec: 'aac', // AAC is best for H.265/MP4 web delivery
  audioBitrate: 160, // 160kbps for music, 128k for speech

  container: 'mkv', // Best for AV1 + various audio formats
  preserveStructure: false,
  overwriteExisting: false,
  fillMode: false,
  deleteOriginal: false, // Safety: never auto-delete originals
  deleteOutputIfLarger: true, // Smart: delete output if it's larger than original
  extractThumbnail: false, // Disabled by default
  extractCaptions: false, // Disabled by default - uses Whisper for transcription
  threadLimit: 0 // Use all available threads by default
}

/**
 * Preset configurations
 */
export const ARCHIVAL_PRESETS: Record<ArchivalPreset, Partial<Omit<ArchivalEncodingConfig, 'outputDir'>>> = {
  // Recommended: Good balance of quality and speed
  archive: {
    av1: {
      ...DEFAULT_ARCHIVAL_CONFIG.av1,
      preset: 6,
      filmGrainSynthesis: 10,
      twoPass: false
    },
    h265: {
      ...DEFAULT_ARCHIVAL_CONFIG.h265,
      preset: 'medium',
      crf: 23,
      twoPass: false
    }
  },

  // Maximum compression: Slower but smaller files (~3-5% smaller)
  'max-compression': {
    av1: {
      ...DEFAULT_ARCHIVAL_CONFIG.av1,
      preset: 4, // Slower, better compression
      filmGrainSynthesis: 12, // More aggressive grain synthesis
      twoPass: false
    },
    h265: {
      ...DEFAULT_ARCHIVAL_CONFIG.h265,
      preset: 'slow', // Slower for better compression
      crf: 24, // Slightly higher CRF for smaller files
      twoPass: false
    }
  },

  // Fast: Faster encoding, slightly larger files
  fast: {
    av1: {
      ...DEFAULT_ARCHIVAL_CONFIG.av1,
      preset: 8, // Faster
      filmGrainSynthesis: 8,
      twoPass: false
    },
    h265: {
      ...DEFAULT_ARCHIVAL_CONFIG.h265,
      preset: 'fast', // Faster encoding
      crf: 22, // Lower CRF to compensate for speed
      twoPass: false
    }
  }
}

/**
 * Job status for batch archival processing
 */
export type ArchivalJobStatus =
  | 'queued'
  | 'analyzing'
  | 'encoding'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'skipped'

/**
 * Individual file in the archival batch
 */
export interface ArchivalBatchItem {
  id: string
  inputPath: string
  outputPath: string
  status: ArchivalJobStatus
  progress: number // 0-100
  sourceInfo?: VideoSourceInfo
  effectiveCrf?: number
  error?: string
  errorType?: ArchivalErrorType
  startedAt?: string
  completedAt?: string
  inputSize?: number
  outputSize?: number
  compressionRatio?: number
  // ETA tracking
  encodingSpeed?: number // fps or x realtime
  etaSeconds?: number // estimated seconds remaining for this item
  elapsedSeconds?: number // elapsed encoding time
  // Thumbnail
  thumbnailPath?: string // Path to extracted thumbnail
  // Captions
  captionPath?: string // Path to extracted captions (.vtt file)
  // Deletion tracking
  originalDeleted?: boolean // True if the original file was deleted after successful encoding
  outputDeleted?: boolean // True if output was deleted (e.g., larger than original)
}

/**
 * Error types for better error handling and user feedback
 */
export type ArchivalErrorType =
  | 'disk_full'
  | 'permission_denied'
  | 'file_not_found'
  | 'codec_unsupported'
  | 'corrupt_input'
  | 'encoder_error'
  | 'cancelled'
  | 'output_larger'
  | 'unknown'

/**
 * Batch archival job
 */
export interface ArchivalBatchJob {
  id: string
  items: ArchivalBatchItem[]
  config: ArchivalEncodingConfig
  status: 'pending' | 'running' | 'completed' | 'cancelled'
  totalItems: number
  completedItems: number
  failedItems: number
  skippedItems: number
  createdAt: string
  startedAt?: string
  completedAt?: string
  // Batch-level ETA tracking
  totalDurationSeconds?: number // total duration of all videos in batch
  processedDurationSeconds?: number // total processed duration so far
  batchEtaSeconds?: number // estimated seconds remaining for entire batch
  averageSpeed?: number // average encoding speed (x realtime)
  // Disk space tracking
  estimatedTotalOutputBytes?: number
  actualOutputBytes?: number
}

/**
 * Queue state for pause/resume functionality
 */
export type ArchivalQueueState = 'running' | 'paused' | 'pending' | 'completed' | 'cancelled'

/**
 * Persisted state for crash recovery
 * Saved to disk to allow resuming after app restart or crash
 */
export interface PersistedArchivalState {
  /** Schema version for future migrations */
  version: 1
  /** When this state was saved */
  savedAt: string
  /** The batch job state */
  job: ArchivalBatchJob
  /** ID of the item that was being encoded when paused/crashed (if any) */
  currentItemId: string | null
  /** Two-pass encoding state (if applicable) */
  twoPassState?: {
    passNumber: 1 | 2
    passLogDir: string
  }
}

/**
 * Progress event kinds including pause/resume
 */
export type ArchivalProgressKind =
  | 'item_start'
  | 'item_progress'
  | 'item_complete'
  | 'item_error'
  | 'batch_complete'
  | 'queue_paused'
  | 'queue_resumed'

/**
 * Progress event for archival batch processing
 */
export interface ArchivalProgressEvent {
  batchId: string
  itemId: string
  kind: ArchivalProgressKind
  progress?: number
  status?: ArchivalJobStatus
  error?: string
  errorType?: ArchivalErrorType
  sourceInfo?: VideoSourceInfo
  effectiveCrf?: number
  outputSize?: number
  compressionRatio?: number
  // ETA fields
  encodingSpeed?: number // current encoding speed (fps or x realtime)
  itemEtaSeconds?: number // estimated seconds remaining for current item
  batchEtaSeconds?: number // estimated seconds remaining for entire batch
  elapsedSeconds?: number // elapsed encoding time for current item
  // Batch progress
  batchProgress?: number // 0-100 overall batch progress
  processedItems?: number // number of items processed so far
  totalItems?: number // total items in batch
  // Thumbnail
  thumbnailPath?: string // Path to extracted thumbnail
  // Captions
  captionPath?: string // Path to extracted captions (.vtt file)
  // Queue state for pause/resume events
  queueState?: ArchivalQueueState
}

/**
 * Determine resolution category from video dimensions
 */
export function getResolutionCategory(width: number, height: number): ArchivalResolution {
  const pixels = Math.max(width, height)

  if (pixels >= 3840) return '4k'
  if (pixels >= 2560) return '1440p'
  if (pixels >= 1920) return '1080p'
  if (pixels >= 1280) return '720p'
  if (pixels >= 854) return '480p'
  return '360p'
}

/**
 * Get optimal CRF for given video parameters
 */
export function getOptimalCrf(
  sourceInfo: VideoSourceInfo,
  customMatrix?: Partial<ArchivalCrfMatrix>,
  enableBitrateAdjustment: boolean = true
): number {
  const matrix = { ...ARCHIVAL_CRF_DEFAULTS, ...customMatrix }
  const resolution = getResolutionCategory(sourceInfo.width, sourceInfo.height)

  // Handle 'source' resolution by defaulting to 1080p CRF
  const lookupResolution = resolution === 'source' ? '1080p' : resolution

  let baseCrf: number
  if (sourceInfo.isHdr) {
    baseCrf = matrix.hdr[lookupResolution] ?? matrix.hdr['1080p']
  } else {
    baseCrf = matrix.sdr[lookupResolution] ?? matrix.sdr['1080p']
  }

  // Apply bitrate-aware adjustment if enabled and bitrate is available
  if (enableBitrateAdjustment && sourceInfo.bitrate) {
    const { adjustedCrf } = getBitrateAdjustedCrf(sourceInfo, baseCrf)
    return adjustedCrf
  }

  return baseCrf
}

/**
 * Detect if video is HDR based on metadata
 */
export function detectHdr(colorSpace?: string, hdrFormat?: string | null, bitDepth?: number): boolean {
  // Check explicit HDR format
  if (hdrFormat) {
    const hdrFormats = ['hdr10', 'hdr10+', 'hlg', 'dolby vision', 'dv', 'pq']
    if (hdrFormats.some(fmt => hdrFormat.toLowerCase().includes(fmt))) {
      return true
    }
  }

  // Check color space
  if (colorSpace) {
    const hdrColorSpaces = ['bt2020', 'rec2020', 'smpte2084', 'arib-std-b67']
    if (hdrColorSpaces.some(cs => colorSpace.toLowerCase().includes(cs))) {
      return true
    }
  }

  // 10-bit or higher often indicates HDR (but not always)
  // Only use as hint when combined with other factors
  if (bitDepth && bitDepth >= 10 && colorSpace?.toLowerCase().includes('2020')) {
    return true
  }

  return false
}

/**
 * Check if a video is already efficiently encoded and might not benefit from re-encoding
 * Returns a reason string if skipping is recommended, null otherwise
 */
export function shouldSkipEncoding(
  sourceInfo: VideoSourceInfo,
  codec: string,
  bitrate: number
): string | null {
  const resolution = getResolutionCategory(sourceInfo.width, sourceInfo.height)
  const isHevc = codec.toLowerCase().includes('hevc') || codec.toLowerCase().includes('h265')
  const isAv1 = codec.toLowerCase().includes('av1')

  // Already AV1 encoded - skip unless very high bitrate
  if (isAv1) {
    return 'Already encoded with AV1. Re-encoding is unlikely to provide significant savings.'
  }

  // Check bitrate thresholds for HEVC (already efficient codec)
  if (isHevc) {
    const bitrateKbps = bitrate / 1000
    const thresholds: Record<string, number> = {
      '4k': 15000,   // 15 Mbps
      '1440p': 8000, // 8 Mbps
      '1080p': 4000, // 4 Mbps
      '720p': 2000,  // 2 Mbps
      '480p': 1000,  // 1 Mbps
      '360p': 500    // 0.5 Mbps
    }

    const threshold = thresholds[resolution]
    if (threshold && bitrateKbps <= threshold) {
      return `Already efficient HEVC at ${(bitrateKbps / 1000).toFixed(1)} Mbps. Re-encoding may not provide significant savings.`
    }
  }

  // Very low resolution and already small
  if (resolution === '360p' && bitrate < 500000) { // < 500 kbps
    return 'Very low resolution with low bitrate. Re-encoding may not improve quality or size.'
  }

  return null
}

/**
 * Check if source has Dolby Vision which cannot be preserved in AV1
 */
export function hasDolbyVision(hdrFormat?: string | null): boolean {
  if (!hdrFormat) return false
  const lower = hdrFormat.toLowerCase()
  return lower.includes('dolby') || lower.includes('dv')
}

/**
 * Classify error from FFmpeg stderr or error message
 */
export function classifyError(errorMessage: string): ArchivalErrorType {
  const lower = errorMessage.toLowerCase()

  // Disk space errors
  if (
    lower.includes('no space left') ||
    lower.includes('disk full') ||
    lower.includes('not enough space') ||
    lower.includes('enospc')
  ) {
    return 'disk_full'
  }

  // Permission errors
  if (
    lower.includes('permission denied') ||
    lower.includes('access denied') ||
    lower.includes('eacces') ||
    lower.includes('eperm')
  ) {
    return 'permission_denied'
  }

  // File not found
  if (
    lower.includes('no such file') ||
    lower.includes('file not found') ||
    lower.includes('enoent') ||
    lower.includes('does not exist')
  ) {
    return 'file_not_found'
  }

  // Codec/format errors
  if (
    lower.includes('decoder') ||
    lower.includes('codec not found') ||
    lower.includes('unsupported codec') ||
    lower.includes('unknown encoder')
  ) {
    return 'codec_unsupported'
  }

  // Corrupt input
  if (
    lower.includes('invalid data') ||
    lower.includes('corrupt') ||
    lower.includes('moov atom not found') ||
    lower.includes('invalid nal unit')
  ) {
    return 'corrupt_input'
  }

  // Encoder errors
  if (
    lower.includes('encoder') ||
    lower.includes('encoding') ||
    lower.includes('svtav1') ||
    lower.includes('libaom')
  ) {
    return 'encoder_error'
  }

  // Cancelled
  if (lower.includes('cancel') || lower.includes('abort') || lower.includes('killed')) {
    return 'cancelled'
  }

  return 'unknown'
}

/**
 * Get user-friendly error message for error type
 */
export function getErrorMessage(errorType: ArchivalErrorType, details?: string): string {
  const messages: Record<ArchivalErrorType, string> = {
    disk_full: 'Not enough disk space to complete encoding. Free up space and try again.',
    permission_denied: 'Cannot write to output location. Check folder permissions.',
    file_not_found: 'Input file not found. It may have been moved or deleted.',
    codec_unsupported: 'Video format not supported. The input file may use an unsupported codec.',
    corrupt_input: 'Input file appears to be corrupted or incomplete.',
    encoder_error: 'Encoder error occurred. Try a different encoder preset.',
    cancelled: 'Encoding was cancelled.',
    output_larger: 'Output file is larger than original. Source may already be well-optimized.',
    unknown: 'An unexpected error occurred.'
  }

  const base = messages[errorType]
  return details ? `${base} (${details})` : base
}

/**
 * Format seconds to human-readable duration (e.g., "2h 15m" or "45s")
 */
export function formatEta(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '--'
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60)
    const secs = Math.round(seconds % 60)
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
  }
  const hours = Math.floor(seconds / 3600)
  const mins = Math.round((seconds % 3600) / 60)
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

/**
 * Format encoding speed (e.g., "0.5x realtime" or "2.3x realtime")
 */
export function formatSpeed(speed: number): string {
  if (!isFinite(speed) || speed <= 0) return '--'
  return `${speed.toFixed(1)}x`
}

/**
 * Encoding speed multipliers for different codecs and presets
 * These are approximate values based on typical encoding performance
 * Speed is relative to realtime (1.0x = encodes as fast as playback)
 *
 * Factors affecting speed:
 * - Codec: H.265 is generally faster than AV1
 * - Preset: Faster presets = higher speed multiplier
 * - Resolution: Higher resolution = slower encoding (normalized in estimateEncodingTime)
 * - Two-pass: Approximately doubles encoding time
 */
const ENCODING_SPEED_MULTIPLIERS = {
  // AV1 SVT speed multipliers by preset (0-12)
  // Based on typical 1080p encoding speeds
  av1_svt: {
    0: 0.05,  // Very slow
    1: 0.08,
    2: 0.12,
    3: 0.18,
    4: 0.25,
    5: 0.35,
    6: 0.5,   // Default balanced
    7: 0.7,
    8: 1.0,
    9: 1.4,
    10: 2.0,
    11: 2.8,
    12: 4.0   // Very fast
  } as Record<number, number>,

  // AV1 libaom speed multipliers by preset (0-8)
  av1_libaom: {
    0: 0.02,  // Extremely slow
    1: 0.04,
    2: 0.07,
    3: 0.12,
    4: 0.2,
    5: 0.3,
    6: 0.45,
    7: 0.65,
    8: 0.9
  } as Record<number, number>,

  // H.265 libx265 speed multipliers by preset
  h265: {
    'ultrafast': 5.0,
    'superfast': 3.5,
    'veryfast': 2.5,
    'faster': 1.8,
    'fast': 1.3,
    'medium': 0.9,
    'slow': 0.5,
    'slower': 0.3,
    'veryslow': 0.15
  } as Record<string, number>
}

/**
 * Resolution scaling factors for encoding speed
 * Higher resolutions take proportionally longer to encode
 */
const RESOLUTION_SPEED_FACTORS: Record<ArchivalResolution, number> = {
  '360p': 4.0,    // Much faster
  '480p': 2.5,
  '720p': 1.5,
  '1080p': 1.0,   // Reference baseline
  '1440p': 0.6,
  '4k': 0.35,     // Much slower
  'source': 1.0   // Assume 1080p for source
}

/**
 * Estimate encoding time in seconds
 * Returns an estimate with min/max range
 *
 * @param durationSeconds - Total video duration in seconds
 * @param codec - 'av1' or 'h265'
 * @param preset - Encoder preset (number for AV1, string for H.265)
 * @param encoder - 'libsvtav1', 'libaom-av1', or 'libx265'
 * @param resolution - Target resolution
 * @param twoPass - Whether two-pass encoding is enabled
 * @returns Object with estimated, min, and max encoding times in seconds
 */
export function estimateEncodingTime(
  durationSeconds: number,
  codec: ArchivalCodec,
  preset: number | string,
  encoder: Av1Encoder | H265Encoder,
  resolution: ArchivalResolution = '1080p',
  twoPass: boolean = false
): { estimatedSeconds: number; minSeconds: number; maxSeconds: number } {
  // Get base speed multiplier based on codec and preset
  let speedMultiplier: number

  if (codec === 'h265') {
    const presetStr = preset as string
    speedMultiplier = ENCODING_SPEED_MULTIPLIERS.h265[presetStr] ?? 0.9
  } else {
    // AV1
    const presetNum = preset as number
    if (encoder === 'libsvtav1') {
      speedMultiplier = ENCODING_SPEED_MULTIPLIERS.av1_svt[presetNum] ?? 0.5
    } else {
      speedMultiplier = ENCODING_SPEED_MULTIPLIERS.av1_libaom[presetNum] ?? 0.2
    }
  }

  // Apply resolution factor
  const resolutionFactor = RESOLUTION_SPEED_FACTORS[resolution] ?? 1.0
  const adjustedSpeed = speedMultiplier * resolutionFactor

  // Calculate base encoding time
  // If speed is 0.5x realtime, encoding 60s video takes 120s
  let encodingTime = durationSeconds / adjustedSpeed

  // Double time for two-pass encoding
  if (twoPass) {
    encodingTime *= 2
  }

  // Add 10% variance for min/max estimates
  return {
    estimatedSeconds: Math.round(encodingTime),
    minSeconds: Math.round(encodingTime * 0.7),
    maxSeconds: Math.round(encodingTime * 1.5)
  }
}

/**
 * Format estimated encoding time as human-readable string
 * Returns format like "~2h 30m" or "~45m"
 */
export function formatEstimatedTime(seconds: number): string {
  if (!isFinite(seconds) || seconds <= 0) return '--'
  if (seconds < 60) return `~${Math.round(seconds)}s`
  if (seconds < 3600) {
    const mins = Math.round(seconds / 60)
    return `~${mins}m`
  }
  const hours = Math.floor(seconds / 3600)
  const mins = Math.round((seconds % 3600) / 60)
  return mins > 0 ? `~${hours}h ${mins}m` : `~${hours}h`
}
