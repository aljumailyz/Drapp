// Video Encoding Configuration Types

// ============================================================================
// RESOLUTION
// ============================================================================
export type ResolutionPreset = '4k' | '1440p' | '1080p' | '720p' | '480p' | '360p' | 'custom' | 'source'

export interface Resolution {
  width: number
  height: number
  label: string
}

export const RESOLUTION_PRESETS: Record<ResolutionPreset, Resolution | null> = {
  '4k': { width: 3840, height: 2160, label: '4K Ultra HD' },
  '1440p': { width: 2560, height: 1440, label: '2K QHD' },
  '1080p': { width: 1920, height: 1080, label: 'Full HD' },
  '720p': { width: 1280, height: 720, label: 'HD' },
  '480p': { width: 854, height: 480, label: 'SD' },
  '360p': { width: 640, height: 360, label: 'Low' },
  'custom': null,
  'source': null
}

// ============================================================================
// SCALING ALGORITHM
// ============================================================================
export type ScalingAlgorithm = 'lanczos' | 'bicubic' | 'bilinear' | 'neighbor' | 'spline'

export interface ScalingOption {
  id: ScalingAlgorithm
  label: string
  description: string
  quality: 'best' | 'good' | 'fast' | 'fastest'
}

export const SCALING_ALGORITHMS: ScalingOption[] = [
  {
    id: 'lanczos',
    label: 'Lanczos',
    description: 'Highest quality, best for downscaling. Slower but produces sharpest results with minimal artifacts.',
    quality: 'best'
  },
  {
    id: 'bicubic',
    label: 'Bicubic',
    description: 'Good balance of quality and speed. Produces smooth gradients and works well for most content.',
    quality: 'good'
  },
  {
    id: 'bilinear',
    label: 'Bilinear',
    description: 'Fast and produces acceptable results. Good for previews or when speed is priority.',
    quality: 'fast'
  },
  {
    id: 'spline',
    label: 'Spline',
    description: 'Similar to bicubic with slightly different characteristics. Good for upscaling.',
    quality: 'good'
  },
  {
    id: 'neighbor',
    label: 'Nearest Neighbor',
    description: 'Fastest but lowest quality. Preserves hard edges, good for pixel art or retro content.',
    quality: 'fastest'
  }
]

// ============================================================================
// CROP OPTIONS
// ============================================================================
export type CropMode = 'none' | 'auto' | '16:9' | '4:3' | '1:1' | '9:16' | '21:9' | 'custom'

export interface CropOption {
  id: CropMode
  label: string
  description: string
  aspectRatio?: number // width/height
}

export const CROP_OPTIONS: CropOption[] = [
  { id: 'none', label: 'No Crop', description: 'Keep original frame, no cropping applied.' },
  { id: 'auto', label: 'Auto (Remove Black Bars)', description: 'Automatically detect and remove black bars/letterboxing.' },
  { id: '16:9', label: '16:9 Widescreen', description: 'Standard widescreen format for modern displays and YouTube.', aspectRatio: 16/9 },
  { id: '4:3', label: '4:3 Classic', description: 'Classic TV/monitor aspect ratio.', aspectRatio: 4/3 },
  { id: '1:1', label: '1:1 Square', description: 'Square format, ideal for Instagram posts.', aspectRatio: 1 },
  { id: '9:16', label: '9:16 Vertical', description: 'Vertical video for TikTok, Instagram Reels, YouTube Shorts.', aspectRatio: 9/16 },
  { id: '21:9', label: '21:9 Ultrawide', description: 'Cinematic ultrawide format.', aspectRatio: 21/9 },
  { id: 'custom', label: 'Custom', description: 'Specify exact crop dimensions manually.' }
]

// ============================================================================
// VIDEO CODEC
// ============================================================================
export type VideoCodec = 'h264' | 'h265' | 'vp9' | 'av1' | 'prores' | 'copy'

export interface CodecOption {
  id: VideoCodec
  label: string
  description: string
  pros: string[]
  cons: string[]
  fileExtensions: string[]
  hwAccelSupport: HWAccelerator[]
}

export const VIDEO_CODECS: CodecOption[] = [
  {
    id: 'h264',
    label: 'H.264 (AVC)',
    description: 'Most compatible codec. Plays on virtually every device and platform.',
    pros: ['Universal compatibility', 'Fast encoding', 'Hardware acceleration everywhere'],
    cons: ['Larger files than H.265', 'Less efficient compression'],
    fileExtensions: ['mp4', 'mkv', 'mov'],
    hwAccelSupport: ['videotoolbox', 'nvenc', 'amf', 'qsv']
  },
  {
    id: 'h265',
    label: 'H.265 (HEVC)',
    description: '50% smaller files than H.264 at same quality. Good for archiving.',
    pros: ['Excellent compression', 'Great for 4K content', 'Smaller file sizes'],
    cons: ['Slower encoding', 'Some older devices lack support', 'Patent licensing issues'],
    fileExtensions: ['mp4', 'mkv', 'mov'],
    hwAccelSupport: ['videotoolbox', 'nvenc', 'amf', 'qsv']
  },
  {
    id: 'vp9',
    label: 'VP9',
    description: 'Google\'s open codec. Used by YouTube. Royalty-free alternative to H.265.',
    pros: ['Royalty-free', 'Good compression', 'YouTube native'],
    cons: ['Slower encoding', 'Limited hardware support', 'Less compatible than H.264'],
    fileExtensions: ['webm', 'mkv'],
    hwAccelSupport: []
  },
  {
    id: 'av1',
    label: 'AV1',
    description: 'Next-gen codec with best compression. Very slow to encode but smallest files.',
    pros: ['Best compression available', 'Royalty-free', 'Future-proof'],
    cons: ['Very slow encoding', 'Limited device support', 'High CPU usage'],
    fileExtensions: ['mp4', 'mkv', 'webm'],
    hwAccelSupport: ['nvenc'] // Only newest NVIDIA cards
  },
  {
    id: 'prores',
    label: 'ProRes',
    description: 'Apple\'s professional editing codec. Large files but no quality loss.',
    pros: ['Professional quality', 'Fast editing', 'No generation loss'],
    cons: ['Very large files', 'macOS/Apple ecosystem', 'Not for final delivery'],
    fileExtensions: ['mov'],
    hwAccelSupport: ['videotoolbox']
  },
  {
    id: 'copy',
    label: 'Copy (No Re-encode)',
    description: 'Copy video stream without re-encoding. Fastest, no quality loss.',
    pros: ['Instant processing', 'No quality loss', 'No CPU usage'],
    cons: ['Cannot change codec/quality', 'Limited editing options'],
    fileExtensions: ['mp4', 'mkv', 'mov'],
    hwAccelSupport: []
  }
]

// ============================================================================
// ENCODING PRESET (Speed vs Quality)
// ============================================================================
export type EncodingSpeed = 'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium' | 'slow' | 'slower' | 'veryslow' | 'placebo'

export interface EncodingSpeedOption {
  id: EncodingSpeed
  label: string
  description: string
  speedRating: number // 1-10, higher = faster
  qualityRating: number // 1-10, higher = better
  estimatedTime: string // relative to medium
}

export const ENCODING_SPEEDS: EncodingSpeedOption[] = [
  { id: 'ultrafast', label: 'Ultra Fast', description: 'Fastest encoding, lowest compression efficiency. Good for quick previews.', speedRating: 10, qualityRating: 3, estimatedTime: '~10x faster' },
  { id: 'superfast', label: 'Super Fast', description: 'Very fast with slightly better quality than ultrafast.', speedRating: 9, qualityRating: 4, estimatedTime: '~8x faster' },
  { id: 'veryfast', label: 'Very Fast', description: 'Fast encoding, acceptable quality. Good for streaming.', speedRating: 8, qualityRating: 5, estimatedTime: '~5x faster' },
  { id: 'faster', label: 'Faster', description: 'Good balance for quick exports.', speedRating: 7, qualityRating: 6, estimatedTime: '~3x faster' },
  { id: 'fast', label: 'Fast', description: 'Slightly faster than medium with minimal quality loss.', speedRating: 6, qualityRating: 7, estimatedTime: '~2x faster' },
  { id: 'medium', label: 'Medium (Recommended)', description: 'Default balanced preset. Best tradeoff between speed and quality.', speedRating: 5, qualityRating: 8, estimatedTime: 'baseline' },
  { id: 'slow', label: 'Slow', description: 'Better compression, smaller files. Good for final exports.', speedRating: 4, qualityRating: 8.5, estimatedTime: '~2x slower' },
  { id: 'slower', label: 'Slower', description: 'High quality compression. Recommended for archiving.', speedRating: 3, qualityRating: 9, estimatedTime: '~4x slower' },
  { id: 'veryslow', label: 'Very Slow', description: 'Maximum practical quality. Best for important content.', speedRating: 2, qualityRating: 9.5, estimatedTime: '~8x slower' },
  { id: 'placebo', label: 'Placebo', description: 'Diminishing returns. Only marginally better than veryslow.', speedRating: 1, qualityRating: 10, estimatedTime: '~20x slower' }
]

// ============================================================================
// PROFILE (H.264/H.265 compatibility levels)
// ============================================================================
export type H264Profile = 'baseline' | 'main' | 'high' | 'high10' | 'high422' | 'high444'
export type H265Profile = 'main' | 'main10' | 'main12' | 'main422-10' | 'main444-10'

export interface ProfileOption {
  id: string
  label: string
  description: string
  compatibility: 'maximum' | 'high' | 'medium' | 'low'
  features: string[]
}

export const H264_PROFILES: ProfileOption[] = [
  {
    id: 'baseline',
    label: 'Baseline',
    description: 'Maximum compatibility. Works on all devices including very old ones.',
    compatibility: 'maximum',
    features: ['No B-frames', 'No CABAC', 'Basic features only']
  },
  {
    id: 'main',
    label: 'Main',
    description: 'Good compatibility with better compression than Baseline.',
    compatibility: 'high',
    features: ['B-frames', 'CABAC entropy coding', 'Interlaced support']
  },
  {
    id: 'high',
    label: 'High (Recommended)',
    description: 'Best quality/compression. Works on most modern devices.',
    compatibility: 'medium',
    features: ['8x8 transform', 'Custom quant matrices', 'Best compression']
  },
  {
    id: 'high10',
    label: 'High 10-bit',
    description: '10-bit color depth for HDR content and color grading.',
    compatibility: 'low',
    features: ['10-bit color', 'HDR support', 'Better gradients']
  }
]

export const H265_PROFILES: ProfileOption[] = [
  {
    id: 'main',
    label: 'Main',
    description: 'Standard 8-bit profile. Good compatibility.',
    compatibility: 'high',
    features: ['8-bit color', 'Standard compression']
  },
  {
    id: 'main10',
    label: 'Main 10 (Recommended)',
    description: '10-bit color for better quality and HDR support.',
    compatibility: 'medium',
    features: ['10-bit color', 'HDR support', 'Better banding reduction']
  }
]

// ============================================================================
// CRF (Constant Rate Factor) - Quality setting
// ============================================================================
export interface CRFGuide {
  value: number
  label: string
  description: string
  useCase: string
  fileSize: string
}

export const CRF_GUIDE: CRFGuide[] = [
  { value: 0, label: 'Lossless', description: 'Mathematically lossless. Massive files.', useCase: 'Source archival, editing masters', fileSize: 'Huge (10x+)' },
  { value: 14, label: 'Visually Lossless', description: 'Indistinguishable from source to human eye.', useCase: 'Professional archival, masters', fileSize: 'Very Large (3-5x)' },
  { value: 17, label: 'Excellent', description: 'Extremely high quality, minimal compression artifacts.', useCase: 'High-quality archives, 4K content', fileSize: 'Large (2-3x)' },
  { value: 18, label: 'Very High', description: 'Excellent quality, nearly transparent.', useCase: 'Personal archives, quality-focused', fileSize: 'Large (1.5-2x)' },
  { value: 20, label: 'High (Recommended)', description: 'Great quality with good file size. Sweet spot.', useCase: 'General use, sharing, streaming', fileSize: 'Medium' },
  { value: 23, label: 'Good', description: 'Good quality, noticeable on close inspection.', useCase: 'Web video, social media', fileSize: 'Smaller' },
  { value: 26, label: 'Acceptable', description: 'Visible artifacts in complex scenes.', useCase: 'Previews, drafts', fileSize: 'Small' },
  { value: 28, label: 'Low', description: 'Obvious quality loss. Use for drafts only.', useCase: 'Quick previews, low bandwidth', fileSize: 'Very Small' },
  { value: 32, label: 'Very Low', description: 'Heavy compression artifacts. Not recommended.', useCase: 'Extreme size constraints', fileSize: 'Tiny' },
  { value: 51, label: 'Minimum', description: 'Maximum compression. Extremely poor quality.', useCase: 'Testing only', fileSize: 'Smallest possible' }
]

// ============================================================================
// CONTAINER FORMAT
// ============================================================================
export type ContainerFormat = 'mp4' | 'mkv' | 'webm' | 'mov' | 'avi'

export interface ContainerOption {
  id: ContainerFormat
  label: string
  description: string
  supportedCodecs: VideoCodec[]
  features: string[]
  compatibility: string
}

export const CONTAINER_FORMATS: ContainerOption[] = [
  {
    id: 'mp4',
    label: 'MP4',
    description: 'Most widely supported format. Works everywhere.',
    supportedCodecs: ['h264', 'h265', 'av1'],
    features: ['Streaming support', 'Fast-start (moov atom)', 'Chapters', 'Subtitles (limited)'],
    compatibility: 'Universal - all devices, browsers, platforms'
  },
  {
    id: 'mkv',
    label: 'MKV (Matroska)',
    description: 'Flexible container supporting nearly all codecs. Great for archiving.',
    supportedCodecs: ['h264', 'h265', 'vp9', 'av1'],
    features: ['Multiple audio tracks', 'Multiple subtitles', 'Chapters', 'Attachments'],
    compatibility: 'Most media players, limited browser support'
  },
  {
    id: 'webm',
    label: 'WebM',
    description: 'Web-optimized format. Great for browsers.',
    supportedCodecs: ['vp9', 'av1'],
    features: ['Browser native', 'Streaming optimized', 'Royalty-free'],
    compatibility: 'Modern browsers, some media players'
  },
  {
    id: 'mov',
    label: 'MOV (QuickTime)',
    description: 'Apple\'s format. Best for macOS/iOS editing workflows.',
    supportedCodecs: ['h264', 'h265', 'prores'],
    features: ['Pro editing support', 'Timecode', 'ProRes support'],
    compatibility: 'Apple ecosystem, professional editors'
  }
]

// ============================================================================
// HARDWARE ACCELERATION
// ============================================================================
export type HWAccelerator = 'none' | 'videotoolbox' | 'nvenc' | 'amf' | 'qsv'

export interface HWAcceleratorOption {
  id: HWAccelerator
  label: string
  vendor: string
  description: string
  platform: 'all' | 'macos' | 'windows' | 'linux'
  qualityNote: string
}

export const HW_ACCELERATORS: HWAcceleratorOption[] = [
  {
    id: 'none',
    label: 'Software (CPU)',
    vendor: 'Any',
    description: 'Uses CPU for encoding. Slowest but highest quality and most compatible.',
    platform: 'all',
    qualityNote: 'Best quality, reference encoder'
  },
  {
    id: 'videotoolbox',
    label: 'VideoToolbox',
    vendor: 'Apple',
    description: 'Apple\'s hardware encoder for Mac. Uses Apple Silicon or Intel Quick Sync.',
    platform: 'macos',
    qualityNote: 'Good quality on Apple Silicon, very fast'
  },
  {
    id: 'nvenc',
    label: 'NVENC',
    vendor: 'NVIDIA',
    description: 'NVIDIA GPU encoding. Very fast with good quality.',
    platform: 'all',
    qualityNote: 'Good quality on RTX cards, slightly below software'
  },
  {
    id: 'amf',
    label: 'AMF/VCE',
    vendor: 'AMD',
    description: 'AMD GPU encoding for Radeon graphics cards.',
    platform: 'all',
    qualityNote: 'Decent quality, improving with newer cards'
  },
  {
    id: 'qsv',
    label: 'Quick Sync',
    vendor: 'Intel',
    description: 'Intel integrated GPU encoding. Available on most Intel CPUs.',
    platform: 'all',
    qualityNote: 'Good quality on newer Intel chips'
  }
]

// ============================================================================
// AUDIO SETTINGS
// ============================================================================
export type AudioCodec = 'aac' | 'mp3' | 'opus' | 'flac' | 'copy' | 'none'

export interface AudioCodecOption {
  id: AudioCodec
  label: string
  description: string
  defaultBitrate: number
  bitrateRange: [number, number]
}

export const AUDIO_CODECS: AudioCodecOption[] = [
  { id: 'aac', label: 'AAC', description: 'Best compatibility. Standard for MP4.', defaultBitrate: 192, bitrateRange: [64, 320] },
  { id: 'mp3', label: 'MP3', description: 'Legacy format. Universal but less efficient.', defaultBitrate: 192, bitrateRange: [64, 320] },
  { id: 'opus', label: 'Opus', description: 'Best quality per bitrate. Great for low bitrates.', defaultBitrate: 128, bitrateRange: [32, 256] },
  { id: 'flac', label: 'FLAC', description: 'Lossless compression. Large files.', defaultBitrate: 0, bitrateRange: [0, 0] },
  { id: 'copy', label: 'Copy', description: 'Keep original audio without re-encoding.', defaultBitrate: 0, bitrateRange: [0, 0] },
  { id: 'none', label: 'No Audio', description: 'Remove audio track entirely.', defaultBitrate: 0, bitrateRange: [0, 0] }
]

// ============================================================================
// FILTERS
// ============================================================================
export interface VideoFilters {
  deinterlace: boolean
  denoise: DenoiseLevel
  sharpen: SharpenLevel
  brightness: number // -1 to 1
  contrast: number // 0.5 to 2
  saturation: number // 0 to 2
  gamma: number // 0.5 to 2
  speed: number // 0.25 to 4
}

export type DenoiseLevel = 'none' | 'light' | 'medium' | 'heavy'
export type SharpenLevel = 'none' | 'light' | 'medium' | 'strong'

export const DEFAULT_FILTERS: VideoFilters = {
  deinterlace: false,
  denoise: 'none',
  sharpen: 'none',
  brightness: 0,
  contrast: 1,
  saturation: 1,
  gamma: 1,
  speed: 1
}

// ============================================================================
// COMPLETE ENCODING CONFIG
// ============================================================================
export interface VideoEncodingConfig {
  // Output
  resolution: ResolutionPreset
  customWidth?: number
  customHeight?: number
  scalingAlgorithm: ScalingAlgorithm
  cropMode: CropMode
  customCrop?: { x: number; y: number; width: number; height: number }

  // Video codec
  videoCodec: VideoCodec
  encodingSpeed: EncodingSpeed
  profile: string
  crf: number

  // Bitrate (alternative to CRF)
  bitrateMode: 'crf' | 'cbr' | 'vbr'
  targetBitrate?: number // kbps
  maxBitrate?: number // kbps

  // Container
  container: ContainerFormat
  fastStart: boolean // moov atom at start for streaming

  // Hardware
  hwAccel: HWAccelerator

  // Audio
  audioCodec: AudioCodec
  audioBitrate: number
  audioChannels: 'stereo' | 'mono' | '5.1' | 'copy'
  audioSampleRate: 44100 | 48000
  normalizeAudio: boolean

  // Filters
  filters: VideoFilters

  // Frame rate
  frameRate: 'source' | '24' | '25' | '30' | '50' | '60' | 'custom'
  customFrameRate?: number
}

export const DEFAULT_ENCODING_CONFIG: VideoEncodingConfig = {
  resolution: 'source',
  scalingAlgorithm: 'lanczos',
  cropMode: 'none',
  videoCodec: 'h264',
  encodingSpeed: 'medium',
  profile: 'high',
  crf: 20,
  bitrateMode: 'crf',
  container: 'mp4',
  fastStart: true,
  hwAccel: 'none',
  audioCodec: 'aac',
  audioBitrate: 192,
  audioChannels: 'stereo',
  audioSampleRate: 48000,
  normalizeAudio: false,
  filters: DEFAULT_FILTERS,
  frameRate: 'source'
}

// ============================================================================
// QUICK PRESETS
// ============================================================================
export interface EncodingPreset {
  id: string
  name: string
  description: string
  category: 'quality' | 'compatibility' | 'social' | 'archive' | 'fast'
  config: Partial<VideoEncodingConfig>
}

export const ENCODING_PRESETS: EncodingPreset[] = [
  {
    id: 'web-optimized',
    name: 'Web Optimized',
    description: 'Best for websites and general sharing. Good quality, fast loading.',
    category: 'compatibility',
    config: {
      resolution: '1080p',
      videoCodec: 'h264',
      encodingSpeed: 'medium',
      profile: 'high',
      crf: 22,
      container: 'mp4',
      fastStart: true,
      audioCodec: 'aac',
      audioBitrate: 192
    }
  },
  {
    id: 'youtube-4k',
    name: 'YouTube 4K',
    description: 'Optimized for YouTube. High bitrate for upload processing.',
    category: 'social',
    config: {
      resolution: '4k',
      videoCodec: 'h264',
      encodingSpeed: 'slow',
      profile: 'high',
      crf: 18,
      container: 'mp4',
      fastStart: true,
      audioCodec: 'aac',
      audioBitrate: 256
    }
  },
  {
    id: 'youtube-1080p',
    name: 'YouTube 1080p',
    description: 'Standard YouTube upload. Balances quality and upload time.',
    category: 'social',
    config: {
      resolution: '1080p',
      videoCodec: 'h264',
      encodingSpeed: 'medium',
      profile: 'high',
      crf: 20,
      container: 'mp4',
      fastStart: true,
      audioCodec: 'aac',
      audioBitrate: 192
    }
  },
  {
    id: 'tiktok-vertical',
    name: 'TikTok / Reels',
    description: 'Vertical 9:16 format for TikTok, Instagram Reels, YouTube Shorts.',
    category: 'social',
    config: {
      resolution: '1080p',
      cropMode: '9:16',
      videoCodec: 'h264',
      encodingSpeed: 'fast',
      profile: 'high',
      crf: 22,
      container: 'mp4',
      fastStart: true,
      audioCodec: 'aac',
      audioBitrate: 192
    }
  },
  {
    id: 'instagram-square',
    name: 'Instagram Square',
    description: 'Square 1:1 format for Instagram feed posts.',
    category: 'social',
    config: {
      resolution: '1080p',
      cropMode: '1:1',
      videoCodec: 'h264',
      encodingSpeed: 'fast',
      profile: 'high',
      crf: 22,
      container: 'mp4',
      fastStart: true,
      audioCodec: 'aac',
      audioBitrate: 192
    }
  },
  {
    id: 'archive-quality',
    name: 'Archive (Best Quality)',
    description: 'Maximum quality for long-term storage. Larger files.',
    category: 'archive',
    config: {
      resolution: 'source',
      videoCodec: 'h265',
      encodingSpeed: 'slower',
      profile: 'main10',
      crf: 18,
      container: 'mkv',
      audioCodec: 'flac',
      normalizeAudio: false
    }
  },
  {
    id: 'archive-efficient',
    name: 'Archive (Space Efficient)',
    description: 'Good quality with efficient compression. Saves storage.',
    category: 'archive',
    config: {
      resolution: 'source',
      videoCodec: 'h265',
      encodingSpeed: 'slow',
      profile: 'main10',
      crf: 22,
      container: 'mkv',
      audioCodec: 'aac',
      audioBitrate: 192
    }
  },
  {
    id: 'mobile-friendly',
    name: 'Mobile Friendly',
    description: 'Smaller files for mobile viewing. Saves bandwidth.',
    category: 'compatibility',
    config: {
      resolution: '720p',
      videoCodec: 'h264',
      encodingSpeed: 'fast',
      profile: 'main',
      crf: 24,
      container: 'mp4',
      fastStart: true,
      audioCodec: 'aac',
      audioBitrate: 128
    }
  },
  {
    id: 'quick-preview',
    name: 'Quick Preview',
    description: 'Ultra-fast encoding for quick previews. Lower quality.',
    category: 'fast',
    config: {
      resolution: '720p',
      videoCodec: 'h264',
      encodingSpeed: 'ultrafast',
      profile: 'baseline',
      crf: 26,
      container: 'mp4',
      fastStart: true,
      audioCodec: 'aac',
      audioBitrate: 128
    }
  },
  {
    id: 'editing-proxy',
    name: 'Editing Proxy',
    description: 'Low-res proxy for video editing. Link to original for export.',
    category: 'fast',
    config: {
      resolution: '720p',
      videoCodec: 'h264',
      encodingSpeed: 'veryfast',
      profile: 'high',
      crf: 23,
      container: 'mp4',
      fastStart: true,
      audioCodec: 'aac',
      audioBitrate: 128
    }
  },
  {
    id: 'discord',
    name: 'Discord (8MB)',
    description: 'Optimized for Discord free tier 8MB limit.',
    category: 'social',
    config: {
      resolution: '720p',
      videoCodec: 'h264',
      encodingSpeed: 'medium',
      profile: 'high',
      bitrateMode: 'vbr',
      targetBitrate: 1000,
      maxBitrate: 1500,
      container: 'mp4',
      fastStart: true,
      audioCodec: 'aac',
      audioBitrate: 96
    }
  }
]
