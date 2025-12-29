// Archival Processing Types for SVT-AV1 Encoding
// Designed for long-term video archival with optimal compression

export type ArchivalResolution = '4k' | '1440p' | '1080p' | '720p' | '480p' | '360p' | 'source'

export type ArchivalColorMode = 'hdr' | 'sdr' | 'auto'

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
 * AV1 encoder type
 * - libaom-av1: Higher quality, slower (default, widely available)
 * - libsvtav1: Faster encoding, slightly lower quality (if available)
 */
export type Av1Encoder = 'libaom-av1' | 'libsvtav1'

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
}

/**
 * Complete archival encoding configuration
 */
export interface ArchivalEncodingConfig {
  // Video settings
  resolution: ArchivalResolution
  colorMode: ArchivalColorMode

  // AV1 encoder settings (supports libaom-av1 and libsvtav1)
  av1: Av1Options

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
  deleteOriginal: boolean // Dangerous - disabled by default
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

  av1: {
    encoder: 'libsvtav1', // Faster than libaom with excellent quality
    preset: 6, // SVT-AV1: 0-13, lower=slower/better. 6 is balanced
    keyframeInterval: 240, // ~8-10 seconds at 24-30fps
    sceneChangeDetection: true, // CRITICAL: prevents GOP crossing scene cuts
    filmGrainSynthesis: 10, // Helps with noisy footage, disable for screen recordings
    tune: 0, // VQ (visual quality) - best for archival viewing
    adaptiveQuantization: true, // Better detail in complex areas
    crf: 30 // Will be auto-adjusted based on resolution/HDR
  },

  audioCopy: true, // Preserve original audio losslessly
  audioCodec: 'opus', // Fallback if copy fails
  audioBitrate: 160, // 160kbps for music, 128k for speech

  container: 'mkv', // Best for AV1 + various audio formats
  preserveStructure: false,
  overwriteExisting: false,
  deleteOriginal: false // Safety: never auto-delete originals
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
      filmGrainSynthesis: 10
    }
  },

  // Maximum compression: Slower but smaller files (~3-5% smaller)
  'max-compression': {
    av1: {
      ...DEFAULT_ARCHIVAL_CONFIG.av1,
      preset: 4, // Slower, better compression
      filmGrainSynthesis: 12 // More aggressive grain synthesis
    }
  },

  // Fast: Faster encoding, slightly larger files
  fast: {
    av1: {
      ...DEFAULT_ARCHIVAL_CONFIG.av1,
      preset: 8, // Faster
      filmGrainSynthesis: 8
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
 * Progress event for archival batch processing
 */
export interface ArchivalProgressEvent {
  batchId: string
  itemId: string
  kind: 'item_start' | 'item_progress' | 'item_complete' | 'item_error' | 'batch_complete'
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
  customMatrix?: Partial<ArchivalCrfMatrix>
): number {
  const matrix = { ...ARCHIVAL_CRF_DEFAULTS, ...customMatrix }
  const resolution = getResolutionCategory(sourceInfo.width, sourceInfo.height)

  // Handle 'source' resolution by defaulting to 1080p CRF
  const lookupResolution = resolution === 'source' ? '1080p' : resolution

  if (sourceInfo.isHdr) {
    return matrix.hdr[lookupResolution] ?? matrix.hdr['1080p']
  }
  return matrix.sdr[lookupResolution] ?? matrix.sdr['1080p']
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
