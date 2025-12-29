export type TranscodePreset = {
  id: string
  label: string
  description: string
  ffmpegArgs: string[]
  outputExtension?: string
}

export const presets: TranscodePreset[] = [
  {
    id: 'source-copy',
    label: 'Source Copy',
    description: 'Fastest option, keeps original codecs and quality.',
    ffmpegArgs: ['-c', 'copy']
  },
  {
    id: 'balanced-h264',
    label: 'Balanced H.264',
    description: 'Great quality/size tradeoff for sharing and archiving.',
    ffmpegArgs: ['-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-c:a', 'aac', '-b:a', '192k'],
    outputExtension: '.mp4'
  },
  {
    id: 'high-quality-h264',
    label: 'High Quality H.264',
    description: 'Larger files with minimal compression artifacts.',
    ffmpegArgs: ['-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-c:a', 'aac', '-b:a', '320k'],
    outputExtension: '.mp4'
  },
  {
    id: 'small-file-h264',
    label: 'Small File H.264',
    description: 'Aggressive compression for smaller storage.',
    ffmpegArgs: ['-c:v', 'libx264', '-preset', 'fast', '-crf', '28', '-c:a', 'aac', '-b:a', '128k'],
    outputExtension: '.mp4'
  },
  {
    id: 'h265-efficient',
    label: 'Efficient H.265',
    description: 'Smaller files with more CPU usage on playback.',
    ffmpegArgs: ['-c:v', 'libx265', '-preset', 'medium', '-crf', '28', '-c:a', 'aac', '-b:a', '192k'],
    outputExtension: '.mp4'
  },
  {
    id: 'youtube-1080p',
    label: 'YouTube 1080p',
    description: '1080p H.264 at streaming-friendly bitrates.',
    ffmpegArgs: [
      '-vf',
      'scale=-2:1080',
      '-c:v',
      'libx264',
      '-preset',
      'medium',
      '-crf',
      '20',
      '-c:a',
      'aac',
      '-b:a',
      '192k'
    ],
    outputExtension: '.mp4'
  },
  {
    id: 'tiktok-vertical',
    label: 'TikTok Vertical',
    description: 'Portrait crop and resize for vertical platforms.',
    ffmpegArgs: [
      '-vf',
      'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920',
      '-c:v',
      'libx264',
      '-preset',
      'medium',
      '-crf',
      '22',
      '-c:a',
      'aac',
      '-b:a',
      '160k'
    ],
    outputExtension: '.mp4'
  }
]
