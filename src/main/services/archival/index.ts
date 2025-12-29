export { ArchivalService, type ArchivalEventHandler } from './archival.service'
export {
  buildArchivalFFmpegArgs,
  describeArchivalSettings,
  estimateArchivalFileSize
} from './archival-command-builder'
export {
  detectAv1Encoders,
  getBestEncoder,
  isEncoderAvailable,
  clearEncoderCache,
  upgradeFFmpeg,
  type EncoderInfo,
  type UpgradeProgress,
  type UpgradeProgressCallback
} from './encoder-detector'
