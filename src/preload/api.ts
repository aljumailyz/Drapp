import { ipcRenderer, type IpcRendererEvent } from 'electron'
import type {
  TagSuggestionResult,
  TagSource
} from '../shared/types/smart-tagging.types'
import type { VideoEncodingConfig, HWAccelerator } from '../shared/types/encoding.types'

// Download Types
export type DownloadStartResponse = {
  ok: boolean
  downloadId?: string
  jobId?: string
  status?: string
  error?: string
}

export type DownloadListResponse = {
  ok: boolean
  downloads: Array<{
    id: string
    url: string
    job_id: string | null
    status: string
    created_at: string
    progress: number | null
    speed: string | null
    eta: string | null
    output_path: string | null
    updated_at: string | null
    error_message: string | null
    video_id: string | null
  }>
}

export type DownloadCancelResponse = {
  ok: boolean
  status?: string
  error?: string
}

export type DownloadRetryResponse = {
  ok: boolean
  jobId?: string
  status?: string
  error?: string
}

export type DownloadBatchResponse = {
  ok: boolean
  queued: number
  skipped: number
  failed: number
  results: Array<{
    url: string
    status: 'queued' | 'skipped' | 'error'
    reason?: string
    downloadId?: string
    jobId?: string
  }>
  error?: string
}

export type DownloadPathResponse = {
  ok: boolean
  path?: string
  canceled?: boolean
  error?: string
}

export type DownloadSettings = {
  proxy: string | null
  rateLimit: string | null
  rateLimitMs: number
  dedupeEnabled: boolean
}

export type DownloadSettingsResponse = {
  ok: boolean
  settings?: DownloadSettings
  error?: string
}

export type ClientErrorPayload = {
  message: string
  stack?: string
  source?: string
  level?: 'error' | 'warn' | 'info'
}

export type ClientErrorResponse = {
  ok: boolean
  error?: string
}

export type UiSettings = {
  theme: 'light' | 'dark'
}

export type UiSettingsResponse = {
  ok: boolean
  settings?: UiSettings
  error?: string
}

export type WhisperModelResponse = {
  ok: boolean
  path?: string
  canceled?: boolean
  error?: string
}

export type WhisperProvider = 'bundled' | 'lmstudio'

export type WhisperProviderResponse = {
  ok: boolean
  provider?: WhisperProvider
  endpoint?: string
  error?: string
}

export type WhisperGpuSettings = {
  enabled: boolean
  available: boolean
  platform: 'darwin' | 'win32' | 'linux'
  gpuType: 'metal' | 'none' // Metal for Apple Silicon, none for others
  reason?: string // Why GPU is not available
}

export type WhisperGpuSettingsResponse = {
  ok: boolean
  settings?: WhisperGpuSettings
  error?: string
}

export type LibraryListResponse = {
  ok: boolean
  videos: Array<{
    id: string
    file_path: string
    file_name: string | null
    title: string | null
    summary?: string | null
    file_size: number | null
    duration: number | null
    width: number | null
    height: number | null
    codec: string | null
    container: string | null
    bitrate: number | null
    is_hidden?: boolean
    created_at: string
    updated_at: string | null
  }>
}

export type LibrarySelectResponse = {
  ok: boolean
  path?: string
  canceled?: boolean
  error?: string
}

export type LibraryScanStartResponse = {
  ok: boolean
  scanId?: string
  error?: string
}

export type LibraryScanCancelResponse = {
  ok: boolean
  error?: string
}

export type LibraryScanProgress = {
  scanId: string
  found: number
  processed: number
  inserted: number
  updated: number
  errors: number
  currentPath?: string
}

export type LibraryScanComplete = {
  scanId: string
  ok: boolean
  result?: {
    found: number
    inserted: number
    updated: number
    errors: number
    canceled: boolean
  }
  error?: string
}

export type LibraryScanResponse = {
  ok: boolean
  result?: {
    found: number
    inserted: number
    updated: number
    errors: number
    canceled: boolean
  }
  error?: string
}

export type LibraryMutationResponse = {
  ok: boolean
  error?: string
}

export type LibraryExportFolderResponse = {
  ok: boolean
  path?: string
  canceled?: boolean
  error?: string
}

export type LibraryExportAssetsResponse = {
  ok: boolean
  files?: string[]
  exportDir?: string
  error?: string
}

export type LibraryStatsResponse = {
  ok: boolean
  stats?: {
    videoCount: number
    totalDuration: number
    totalSize: number
    hiddenCount: number
    downloads: {
      queued: number
      downloading: number
      completed: number
      failed: number
      canceled: number
      [key: string]: number
    }
  }
  error?: string
}

export type LibraryIntegrityScanResponse = {
  ok: boolean
  summary?: {
    videosTotal: number
    missingVideos: number
    downloadsTotal: number
    missingDownloads: number
  }
  missingVideos?: Array<{
    id: string
    file_path: string
    title: string | null
    file_name: string | null
  }>
  missingDownloads?: Array<{
    id: string
    url: string
    output_path: string | null
    status: string
  }>
  error?: string
}

export type LibraryIntegrityFixResponse = {
  ok: boolean
  removedVideos?: number
  markedDownloads?: number
  error?: string
}

export type LibraryDeleteResponse = {
  ok: boolean
  removedPath?: string | null
  error?: string
}

export type LibraryCaptionExportResponse = {
  ok: boolean
  path?: string
  error?: string
}

export type LibraryTranscriptResponse = {
  ok: boolean
  transcript?: string
  error?: string
}

export type BinaryStatus = {
  name: 'yt-dlp' | 'ffmpeg' | 'ffprobe' | 'whisper'
  path: string
  exists: boolean
  executable: boolean
  version: string | null
  error?: string
}

export type BinaryStatusResponse = {
  ok: boolean
  binaries: BinaryStatus[]
}

export type BinaryRepairResponse = {
  ok: boolean
  repaired?: string[]
  downloaded?: string[]
  missing?: string[]
  errors?: Array<{ name: string; error: string }>
  error?: string
}

export type BinaryDownloadProgress = {
  binary: 'yt-dlp' | 'ffmpeg' | 'ffprobe' | 'whisper'
  stage: 'downloading' | 'extracting' | 'installing' | 'done' | 'error'
  progress?: number
  error?: string
}

export type BinaryDownloadResponse = {
  ok: boolean
  downloaded?: string[]
  failed?: Array<{ binary: string; error?: string }>
  error?: string
}

export type BinaryMissingResponse = {
  ok: boolean
  missing?: string[]
  error?: string
}

export type LlmProvider = 'openrouter' | 'lmstudio'

export type LlmSettings = {
  provider: LlmProvider
  openrouter: {
    apiKeySet: boolean
    model: string | null
  }
  lmstudio: {
    baseUrl: string
    model: string | null
  }
}

export type LlmSettingsResponse = {
  ok: boolean
  settings?: LlmSettings
  error?: string
}

export type LlmUpdatePayload = {
  provider?: LlmProvider
  openrouterApiKey?: string
  openrouterModel?: string | null
  lmstudioBaseUrl?: string | null
  lmstudioModel?: string | null
}

export type LlmUpdateResponse = {
  ok: boolean
  settings?: LlmSettings
  error?: string
}

export type LlmTestResponse = {
  ok: boolean
  available: boolean
  error?: string
}

export type LlmSummaryResponse = {
  ok: boolean
  summary?: string
  error?: string
}

export type LlmTranscriptResponse = {
  ok: boolean
  transcript?: string
  error?: string
}
export type AuthSession = {
  id: string
  platform: string
  accountName: string | null
  isActive: boolean
  createdAt: string
  lastUsedAt: string | null
  expiresAt: string | null
}

export type AuthListResponse = {
  ok: boolean
  sessions?: AuthSession[]
  error?: string
}

export type AuthSelectCookieResponse = {
  ok: boolean
  path?: string
  canceled?: boolean
  error?: string
}

export type AuthImportResponse = {
  ok: boolean
  sessionId?: string
  cookieCount?: number
  expiresAt?: string | null
  accountName?: string | null
  storage?: 'secure' | 'plain'
  error?: string
}

export type AuthMutationResponse = {
  ok: boolean
  error?: string
}

export type PrivacySettings = {
  historyEnabled: boolean
  showThumbnails: boolean
  hiddenFolderEnabled: boolean
  secureDeleteEnabled: boolean
  pinSet?: boolean
}

export type PrivacySettingsResponse = {
  ok: boolean
  settings?: PrivacySettings
  error?: string
}

export type PrivacyPinResponse = {
  ok: boolean
  valid?: boolean
  error?: string
}

export type WatchFolderSettings = {
  enabled: boolean
  path: string | null
}

export type WatchFolderSettingsResponse = {
  ok: boolean
  settings?: WatchFolderSettings
  path?: string
  canceled?: boolean
  error?: string
}

export type ProcessingSelectResponse = {
  ok: boolean
  path?: string
  canceled?: boolean
  error?: string
}

export type ProcessingSelectBatchResponse = {
  ok: boolean
  paths?: string[]
  canceled?: boolean
  error?: string
}

export type ProcessingPreset = {
  id: string
  label: string
  description: string
  outputExtension?: string | null
}

export type ProcessingPresetsResponse = {
  ok: boolean
  presets: ProcessingPreset[]
}

export type ProcessingTranscodeResponse = {
  ok: boolean
  jobId?: string
  outputPath?: string
  error?: string
}

export type ProcessingTranscribeResponse = {
  ok: boolean
  jobId?: string
  outputPath?: string
  error?: string
}
export type ProcessingListResponse = {
  ok: boolean
  jobs: Array<{
    id: string
    status: string
    input_path: string | null
    output_path: string | null
    progress: number | null
    created_at: string
    updated_at: string | null
    error_message: string | null
    log_tail?: string | null
    result_json?: Record<string, unknown> | null
  }>
}

export type ProcessingDetailsResponse = {
  ok: boolean
  job?: {
    id: string
    type: string
    status: string
    input_path: string | null
    output_path: string | null
    progress: number | null
    created_at: string
    updated_at: string | null
    error_message: string | null
    log_tail: string | null
    result_json: Record<string, unknown> | null
  }
  error?: string
}

export type ProcessingCancelResponse = {
  ok: boolean
  error?: string
}

export type CPUSIMDCapabilities = {
  sse: boolean
  sse2: boolean
  sse3: boolean
  ssse3: boolean
  sse41: boolean
  sse42: boolean
  avx: boolean
  avx2: boolean
  avx512: boolean
  cpuModel: string | null
}

export type HWAccelDetectResponse = {
  ok: boolean
  available?: HWAccelerator[]
  recommended?: HWAccelerator
  platform?: 'darwin' | 'win32' | 'linux'
  gpuVendor?: string | null
  gpuModel?: string | null
  cpuCapabilities?: CPUSIMDCapabilities | null
  error?: string
}

export type AdvancedTranscodeResponse = {
  ok: boolean
  jobId?: string
  outputPath?: string
  ffmpegCommand?: string[]
  error?: string
}

export type VideoProbeResponse = {
  ok: boolean
  metadata?: {
    duration: number | null
    width: number | null
    height: number | null
    frameRate: number | null
    bitrate: number | null
    codec: string | null
    container: string | null
    fileSize: number | null
  }
  error?: string
}

export type VisionAnalysisResponse = {
  ok: boolean
  analysis?: string
  tags?: string[]
  framesAnalyzed?: number
  error?: string
}

export type ThumbnailResponse = {
  ok: boolean
  thumbnailPath?: string
  thumbnailBase64?: string
  error?: string
}

export type ProcessingJobEvent = {
  jobId: string
  jobType: 'transcode' | 'transcription'
  kind: 'progress' | 'log' | 'status' | 'result'
  progress?: number
  logTail?: string
  status?: string
  error?: string | null
  updatedAt?: string
  result?: Record<string, unknown> | null
}

// Archival Processing Types
export type ArchivalJobStatus =
  | 'queued'
  | 'analyzing'
  | 'encoding'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'skipped'

export type ArchivalVideoSourceInfo = {
  width: number
  height: number
  frameRate: number
  duration: number
  bitDepth?: number
  colorSpace?: string
  hdrFormat?: string | null
  isHdr: boolean
  bitrate?: number
  audioCodec?: string
}

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

export type ArchivalBatchItem = {
  id: string
  inputPath: string
  outputPath: string
  status: ArchivalJobStatus
  progress: number
  sourceInfo?: ArchivalVideoSourceInfo
  effectiveCrf?: number
  error?: string
  errorType?: ArchivalErrorType
  startedAt?: string
  completedAt?: string
  inputSize?: number
  outputSize?: number
  compressionRatio?: number
  // ETA tracking
  encodingSpeed?: number
  etaSeconds?: number
  elapsedSeconds?: number
  // Thumbnail
  thumbnailPath?: string
  // Captions
  captionPath?: string
}

export type ArchivalBatchJob = {
  id: string
  items: ArchivalBatchItem[]
  config: ArchivalEncodingConfigFull
  status: 'pending' | 'running' | 'completed' | 'cancelled'
  totalItems: number
  completedItems: number
  failedItems: number
  skippedItems: number
  createdAt: string
  startedAt?: string
  completedAt?: string
  // Batch-level ETA tracking
  totalDurationSeconds?: number
  processedDurationSeconds?: number
  batchEtaSeconds?: number
  averageSpeed?: number
  estimatedTotalOutputBytes?: number
  actualOutputBytes?: number
}

export type ArchivalEncodingConfigFull = {
  resolution: 'source' | '4k' | '1440p' | '1080p' | '720p' | '480p' | '360p'
  colorMode: 'hdr' | 'sdr' | 'auto'
  codec: 'av1' | 'h265'
  av1: {
    encoder: 'libaom-av1' | 'libsvtav1'
    preset: number
    keyframeInterval: number
    sceneChangeDetection: boolean
    filmGrainSynthesis: number
    tune: 0 | 1 | 2
    adaptiveQuantization: boolean
    crf: number
    twoPass?: boolean
  }
  h265: {
    encoder: 'libx265'
    preset: 'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium' | 'slow' | 'slower' | 'veryslow'
    tune?: 'film' | 'animation' | 'grain' | 'fastdecode' | 'zerolatency'
    crf: number
    keyframeInterval: number
    bframes: number
    twoPass?: boolean
  }
  audioCopy: boolean
  audioCodec?: 'opus' | 'flac' | 'aac'
  audioBitrate?: number
  container: 'mkv' | 'mp4' | 'webm'
  outputDir: string
  preserveStructure: boolean
  overwriteExisting: boolean
  fillMode: boolean
  deleteOriginal: boolean
  deleteOutputIfLarger: boolean
  extractThumbnail: boolean
  thumbnailTimestamp?: number
  extractCaptions: boolean
  captionLanguage?: string
  threadLimit: 0 | 4 | 6
}

export type ArchivalProgressEvent = {
  batchId: string
  itemId: string
  kind: 'item_start' | 'item_progress' | 'item_complete' | 'item_error' | 'batch_complete'
  progress?: number
  status?: ArchivalJobStatus
  error?: string
  errorType?: ArchivalErrorType
  sourceInfo?: ArchivalVideoSourceInfo
  effectiveCrf?: number
  outputSize?: number
  compressionRatio?: number
  // ETA fields
  encodingSpeed?: number
  itemEtaSeconds?: number
  batchEtaSeconds?: number
  elapsedSeconds?: number
  // Batch progress
  batchProgress?: number
  processedItems?: number
  totalItems?: number
  // Captions
  captionPath?: string
}

export type ArchivalSelectFilesResponse = {
  ok: boolean
  paths?: string[]
  canceled?: boolean
}

export type ArchivalSelectOutputDirResponse = {
  ok: boolean
  path?: string
  canceled?: boolean
}

export type ArchivalSelectFolderResponse = {
  ok: boolean
  folderPath?: string
  paths?: string[]
  fileInfo?: Array<{ absolutePath: string; relativePath: string }>
  canceled?: boolean
  error?: string
}

export type ArchivalStartBatchResponse = {
  ok: boolean
  job?: ArchivalBatchJob
  error?: string
}

export type ArchivalStatusResponse = {
  ok: boolean
  job?: ArchivalBatchJob | null
}

export type ArchivalCancelResponse = {
  ok: boolean
  canceled: boolean
}

export type ArchivalPreviewCommandResponse = {
  ok: boolean
  command?: string[]
  description?: string
  sourceInfo?: ArchivalVideoSourceInfo
  error?: string
}

export type ArchivalEstimateSizeResponse = {
  ok: boolean
  sourceInfo?: ArchivalVideoSourceInfo
  effectiveCrf?: number
  estimatedMB?: number
  minMB?: number
  maxMB?: number
  error?: string
}

export type ArchivalAnalyzeVideoResponse = {
  ok: boolean
  sourceInfo?: ArchivalVideoSourceInfo
  effectiveCrf?: number
  isHdr?: boolean
  resolution?: string
  error?: string
}

export type ArchivalBatchInfoResponse = {
  ok: boolean
  totalDurationSeconds?: number
  totalInputBytes?: number
  estimatedOutputBytes?: number
  availableBytes?: number
  hasEnoughSpace?: boolean
  existingCount?: number
  error?: string
}

export type ArchivalEncoderInfo = {
  available: Array<'libaom-av1' | 'libsvtav1'>
  recommended: 'libaom-av1' | 'libsvtav1' | null
  hasAv1Support: boolean
  // H.265 encoder info
  h265Available: Array<'libx265'>
  hasH265Support: boolean
  canUpgrade: boolean
}

export type ArchivalDetectEncodersResponse = {
  ok: boolean
  encoderInfo?: ArchivalEncoderInfo
  error?: string
}

export type ArchivalUpgradeProgress = {
  stage: 'downloading' | 'extracting' | 'installing' | 'verifying' | 'complete' | 'error'
  progress?: number
  error?: string
}

export type ArchivalUpgradeFFmpegResponse = {
  ok: boolean
  encoderInfo?: ArchivalEncoderInfo
  error?: string
}

export type DownloadEvent =
  | { type: 'status'; downloadId: string; status: string; error?: string }
  | { type: 'progress'; downloadId: string; progress: number | null; speed?: string; eta?: string }

// Smart Tagging Types
export type VideoTag = {
  name: string
  section: string
  confidence: number | null
  isLocked: boolean
  source: TagSource
}

export type TaxonomyData = {
  sections: Record<string, string[]>
  config: { defaultMinConf: number; policy: string }
}

// Smart Tagging API
export type SmartTaggingApi = {
  indexVideo: (videoId: string, videoPath: string) => Promise<{ success: boolean; frameCount: number }>
  suggestTags: (params: {
    videoId: string
    topK?: number
    useLLMRefinement?: boolean
    videoTitle?: string
    videoDescription?: string
    userNotes?: string
  }) => Promise<TagSuggestionResult>
  applyDecision: (videoId: string, tagName: string, decision: 'accept' | 'reject') => Promise<{ success: boolean }>
  addTag: (videoId: string, tagName: string, lock?: boolean) => Promise<{ success: boolean; error?: string }>
  removeTag: (videoId: string, tagName: string, force?: boolean) => Promise<{ success: boolean; wasLocked: boolean }>
  lockTag: (videoId: string, tagName: string) => Promise<{ success: boolean; error?: string }>
  unlockTag: (videoId: string, tagName: string) => Promise<{ success: boolean; error?: string }>
  regenerate: (videoId: string) => Promise<TagSuggestionResult>
  getTaxonomy: () => Promise<TaxonomyData>
  reloadTaxonomy: () => Promise<{ success: boolean; tagCount: number }>
  getVideoTags: (videoId: string) => Promise<{ tags: VideoTag[] }>
  isIndexed: (videoId: string) => Promise<{ indexed: boolean; frameCount: number | null }>
  cleanup: (videoId: string) => Promise<{ success: boolean }>
  llmAvailable: () => Promise<{ available: boolean }>
  llmModels: () => Promise<{ models: string[] }>
}

export type Api = {
  ping: () => Promise<string>
  toFileUrl: (filePath: string) => string
  copyToClipboard: (text: string) => Promise<{ ok: boolean; error?: string }>
  revealInFolder: (path: string) => Promise<{ ok: boolean; error?: string }>
  downloadStart: (url: string) => Promise<DownloadStartResponse>
  downloadBatch: (payload: { urls: string[] }) => Promise<DownloadBatchResponse>
  downloadList: () => Promise<DownloadListResponse>
  downloadCancel: (downloadId: string) => Promise<DownloadCancelResponse>
  downloadRetry: (downloadId: string) => Promise<DownloadRetryResponse>
  getDownloadPath: () => Promise<DownloadPathResponse>
  downloadGetSettings: () => Promise<DownloadSettingsResponse>
  downloadUpdateSettings: (payload: Partial<DownloadSettings>) => Promise<DownloadSettingsResponse>
  uiGetSettings: () => Promise<UiSettingsResponse>
  uiUpdateSettings: (payload: Partial<UiSettings>) => Promise<UiSettingsResponse>
  reportError: (payload: ClientErrorPayload) => Promise<ClientErrorResponse>
  selectDownloadPath: () => Promise<DownloadPathResponse>
  getWhisperModel: () => Promise<WhisperModelResponse>
  selectWhisperModel: () => Promise<WhisperModelResponse>
  getWhisperProvider: () => Promise<WhisperProviderResponse>
  setWhisperProvider: (payload: { provider: WhisperProvider; endpoint?: string }) => Promise<{ ok: boolean; error?: string }>
  getWhisperGpuSettings: () => Promise<WhisperGpuSettingsResponse>
  setWhisperGpuEnabled: (enabled: boolean) => Promise<{ ok: boolean; error?: string }>
  libraryList: (includeHidden?: boolean) => Promise<LibraryListResponse>
  librarySelectFolder: () => Promise<LibrarySelectResponse>
  libraryScan: (path: string) => Promise<LibraryScanResponse>
  libraryScanStart: (path: string) => Promise<LibraryScanStartResponse>
  libraryScanCancel: (scanId: string) => Promise<LibraryScanCancelResponse>
  libraryGetTranscript: (videoId: string) => Promise<LibraryTranscriptResponse>
  libraryUpdateTranscript: (payload: { videoId: string; transcript: string }) => Promise<LibraryMutationResponse>
  libraryExportCaptions: (payload: { videoId: string }) => Promise<LibraryCaptionExportResponse>
  libraryIntegrityScan: () => Promise<LibraryIntegrityScanResponse>
  libraryIntegrityFix: (payload: { missingVideoIds?: string[]; missingDownloadIds?: string[] }) => Promise<LibraryIntegrityFixResponse>
  librarySelectExportFolder: () => Promise<LibraryExportFolderResponse>
  libraryExportAssets: (payload: {
    videoId: string
    includeTranscript?: boolean
    includeSummary?: boolean
    includeCaptions?: boolean
    includeMetadata?: boolean
    targetDir?: string | null
  }) => Promise<LibraryExportAssetsResponse>
  libraryStats: () => Promise<LibraryStatsResponse>
  librarySetHidden: (payload: { videoId: string; hidden: boolean }) => Promise<LibraryMutationResponse>
  libraryDeleteVideo: (payload: { videoId: string }) => Promise<LibraryDeleteResponse>
  onLibraryScanProgress: (listener: (payload: LibraryScanProgress) => void) => () => void
  onLibraryScanComplete: (listener: (payload: LibraryScanComplete) => void) => () => void
  libraryGetPlayback: (videoId: string) => Promise<{ ok: boolean; position?: number; error?: string }>
  librarySavePlayback: (payload: { videoId: string; position: number; duration?: number }) => Promise<{ ok: boolean; error?: string }>
  systemBinaries: () => Promise<BinaryStatusResponse>
  systemRepairBinaries: () => Promise<BinaryRepairResponse>
  systemOpenBinariesFolder: () => Promise<{ ok: boolean; error?: string }>
  systemDownloadBinaries: () => Promise<BinaryDownloadResponse>
  systemCheckMissingBinaries: () => Promise<BinaryMissingResponse>
  onBinaryDownloadProgress: (listener: (progress: BinaryDownloadProgress) => void) => () => void
  llmGetSettings: () => Promise<LlmSettingsResponse>
  llmUpdateSettings: (payload: LlmUpdatePayload) => Promise<LlmUpdateResponse>
  llmTestConnection: (provider?: LlmProvider) => Promise<LlmTestResponse>
  llmSummarizeVideo: (videoId: string) => Promise<LlmSummaryResponse>
  llmCleanupTranscript: (videoId: string) => Promise<LlmTranscriptResponse>
  watchFolderGetSettings: () => Promise<WatchFolderSettingsResponse>
  watchFolderSelectPath: () => Promise<WatchFolderSettingsResponse>
  watchFolderUpdateSettings: (payload: Partial<WatchFolderSettings>) => Promise<WatchFolderSettingsResponse>
  watchFolderScanNow: () => Promise<{ ok: boolean; error?: string }>
  authSelectCookieFile: () => Promise<AuthSelectCookieResponse>
  authImportCookies: (payload: { platform: string; filePath: string; accountName?: string | null }) => Promise<AuthImportResponse>
  authListSessions: () => Promise<AuthListResponse>
  authSetActive: (sessionId: string) => Promise<AuthMutationResponse>
  authDeleteSession: (sessionId: string) => Promise<AuthMutationResponse>
  privacyGetSettings: () => Promise<PrivacySettingsResponse>
  privacyUpdateSettings: (payload: Partial<PrivacySettings>) => Promise<PrivacySettingsResponse>
  privacySetPin: (pin: string) => Promise<PrivacyPinResponse>
  privacyClearPin: () => Promise<PrivacyPinResponse>
  privacyVerifyPin: (pin: string) => Promise<PrivacyPinResponse>
  processingSelectInput: () => Promise<ProcessingSelectResponse>
  processingSelectBatch: () => Promise<ProcessingSelectBatchResponse>
  processingPresets: () => Promise<ProcessingPresetsResponse>
  processingTranscode: (payload: { inputPath: string; presetId?: string }) => Promise<ProcessingTranscodeResponse>
  processingTranscribe: (payload: { inputPath: string; modelPath?: string; language?: string }) => Promise<ProcessingTranscribeResponse>
  processingList: (type?: string) => Promise<ProcessingListResponse>
  processingDetails: (jobId: string) => Promise<ProcessingDetailsResponse>
  processingCancel: (jobId: string) => Promise<ProcessingCancelResponse>
  processingDetectHWAccel: () => Promise<HWAccelDetectResponse>
  processingAdvancedTranscode: (payload: {
    inputPath: string
    config: VideoEncodingConfig
    outputDir?: string
  }) => Promise<AdvancedTranscodeResponse>
  processingPreviewCommand: (payload: {
    inputPath: string
    config: VideoEncodingConfig
  }) => Promise<{ ok: boolean; command?: string[]; error?: string }>
  processingProbeVideo: (filePath: string) => Promise<VideoProbeResponse>
  processingAnalyzeVision: (payload: {
    videoPath: string
    maxFrames?: number
    prompt?: string
    visionModel?: string
  }) => Promise<VisionAnalysisResponse>
  processingGenerateThumbnail: (payload: {
    videoPath: string
    videoId: string
    timestampMs?: number
  }) => Promise<ThumbnailResponse>
  onProcessingEvent: (listener: (event: ProcessingJobEvent) => void) => () => void
  onDownloadEvent: (listener: (event: DownloadEvent) => void) => () => void
  // Archival Processing API
  archivalSelectFiles: () => Promise<ArchivalSelectFilesResponse>
  archivalSelectOutputDir: () => Promise<ArchivalSelectOutputDirResponse>
  archivalSelectFolder: () => Promise<ArchivalSelectFolderResponse>
  archivalGetDefaultConfig: () => Promise<{ ok: boolean; config: Omit<ArchivalEncodingConfigFull, 'outputDir'> }>
  archivalStartBatch: (payload: {
    inputPaths: string[]
    outputDir: string
    config?: Partial<ArchivalEncodingConfigFull>
    folderRoot?: string
    relativePaths?: string[]
  }) => Promise<ArchivalStartBatchResponse>
  archivalGetStatus: () => Promise<ArchivalStatusResponse>
  archivalCancel: () => Promise<ArchivalCancelResponse>
  archivalPreviewCommand: (payload: {
    inputPath: string
    outputDir: string
    config?: Partial<ArchivalEncodingConfigFull>
  }) => Promise<ArchivalPreviewCommandResponse>
  archivalEstimateSize: (inputPath: string) => Promise<ArchivalEstimateSizeResponse>
  archivalAnalyzeVideo: (inputPath: string) => Promise<ArchivalAnalyzeVideoResponse>
  archivalGetBatchInfo: (payload: { inputPaths: string[]; outputDir: string }) => Promise<ArchivalBatchInfoResponse>
  archivalDetectEncoders: () => Promise<ArchivalDetectEncodersResponse>
  archivalUpgradeFFmpeg: () => Promise<ArchivalUpgradeFFmpegResponse>
  onArchivalEvent: (listener: (event: ArchivalProgressEvent) => void) => () => void
  onArchivalUpgradeProgress: (listener: (progress: ArchivalUpgradeProgress) => void) => () => void
  smartTagging: SmartTaggingApi
  // App lock password
  appCheckPasswordSet: () => Promise<{ ok: boolean; isSet?: boolean; isEnabled?: boolean; error?: string }>
  appSetPassword: (password: string) => Promise<{ ok: boolean; error?: string }>
  appVerifyPassword: (password: string) => Promise<{ ok: boolean; valid?: boolean; error?: string }>
  appChangePassword: (payload: { currentPassword: string; newPassword: string }) => Promise<{ ok: boolean; error?: string }>
  appRemovePassword: (password: string) => Promise<{ ok: boolean; error?: string }>
  appToggleLock: (enabled: boolean) => Promise<{ ok: boolean; error?: string }>
}

export const api: Api = {
  ping: () => ipcRenderer.invoke('app/ping') as Promise<string>,
  toFileUrl: (filePath) => {
    // Use custom media:// protocol which handles cross-origin issues in dev mode
    // media://path/to/file -> served by custom protocol handler in main process
    const normalized = filePath.replace(/\\/g, '/')
    // Handle Windows drive letters (C:/path) and Unix paths (/path)
    if (normalized.startsWith('/')) {
      return `media://${normalized}`
    }
    // Windows: C:/path -> media://C:/path
    return `media://${normalized}`
  },
  copyToClipboard: (text) => ipcRenderer.invoke('app/copy-to-clipboard', text) as Promise<{ ok: boolean; error?: string }>,
  revealInFolder: (path) => ipcRenderer.invoke('app/reveal-path', path) as Promise<{ ok: boolean; error?: string }>,
  downloadStart: (url: string) => ipcRenderer.invoke('download/start', url) as Promise<DownloadStartResponse>,
  downloadBatch: (payload) => ipcRenderer.invoke('download/batch', payload) as Promise<DownloadBatchResponse>,
  downloadList: () => ipcRenderer.invoke('download/list') as Promise<DownloadListResponse>,
  downloadCancel: (downloadId: string) => ipcRenderer.invoke('download/cancel', downloadId) as Promise<DownloadCancelResponse>,
  downloadRetry: (downloadId: string) => ipcRenderer.invoke('download/retry', downloadId) as Promise<DownloadRetryResponse>,
  getDownloadPath: () => ipcRenderer.invoke('settings/get-download-path') as Promise<DownloadPathResponse>,
  downloadGetSettings: () => ipcRenderer.invoke('settings/get-download-settings') as Promise<DownloadSettingsResponse>,
  downloadUpdateSettings: (payload) =>
    ipcRenderer.invoke('settings/update-download-settings', payload) as Promise<DownloadSettingsResponse>,
  uiGetSettings: () => ipcRenderer.invoke('settings/get-ui-settings') as Promise<UiSettingsResponse>,
  uiUpdateSettings: (payload) => ipcRenderer.invoke('settings/update-ui-settings', payload) as Promise<UiSettingsResponse>,
  reportError: (payload) => ipcRenderer.invoke('app/log-client-error', payload) as Promise<ClientErrorResponse>,
  selectDownloadPath: () => ipcRenderer.invoke('settings/select-download-path') as Promise<DownloadPathResponse>,
  getWhisperModel: () => ipcRenderer.invoke('settings/get-whisper-model') as Promise<WhisperModelResponse>,
  selectWhisperModel: () => ipcRenderer.invoke('settings/select-whisper-model') as Promise<WhisperModelResponse>,
  getWhisperProvider: () => ipcRenderer.invoke('settings/get-whisper-provider') as Promise<WhisperProviderResponse>,
  setWhisperProvider: (payload) => ipcRenderer.invoke('settings/set-whisper-provider', payload) as Promise<{ ok: boolean; error?: string }>,
  getWhisperGpuSettings: () => ipcRenderer.invoke('settings/get-whisper-gpu') as Promise<WhisperGpuSettingsResponse>,
  setWhisperGpuEnabled: (enabled) => ipcRenderer.invoke('settings/set-whisper-gpu', enabled) as Promise<{ ok: boolean; error?: string }>,
  libraryList: (includeHidden) => ipcRenderer.invoke('library/list', includeHidden) as Promise<LibraryListResponse>,
  librarySelectFolder: () => ipcRenderer.invoke('library/select-folder') as Promise<LibrarySelectResponse>,
  libraryScan: (path: string) => ipcRenderer.invoke('library/scan', path) as Promise<LibraryScanResponse>,
  libraryScanStart: (path: string) => ipcRenderer.invoke('library/scan-start', path) as Promise<LibraryScanStartResponse>,
  libraryScanCancel: (scanId: string) => ipcRenderer.invoke('library/scan-cancel', scanId) as Promise<LibraryScanCancelResponse>,
  libraryGetTranscript: (videoId) => ipcRenderer.invoke('library/get-transcript', videoId) as Promise<LibraryTranscriptResponse>,
  libraryUpdateTranscript: (payload) => ipcRenderer.invoke('library/update-transcript', payload) as Promise<LibraryMutationResponse>,
  libraryExportCaptions: (payload) => ipcRenderer.invoke('library/export-captions', payload) as Promise<LibraryCaptionExportResponse>,
  libraryIntegrityScan: () => ipcRenderer.invoke('library/integrity-scan') as Promise<LibraryIntegrityScanResponse>,
  libraryIntegrityFix: (payload) =>
    ipcRenderer.invoke('library/integrity-fix', payload) as Promise<LibraryIntegrityFixResponse>,
  librarySelectExportFolder: () =>
    ipcRenderer.invoke('library/select-export-folder') as Promise<LibraryExportFolderResponse>,
  libraryExportAssets: (payload) =>
    ipcRenderer.invoke('library/export-assets', payload) as Promise<LibraryExportAssetsResponse>,
  libraryStats: () => ipcRenderer.invoke('library/stats') as Promise<LibraryStatsResponse>,
  librarySetHidden: (payload) => ipcRenderer.invoke('library/set-hidden', payload) as Promise<LibraryMutationResponse>,
  libraryDeleteVideo: (payload) => ipcRenderer.invoke('library/delete', payload) as Promise<LibraryDeleteResponse>,
  onLibraryScanProgress: (listener) => {
    const handler = (_event: IpcRendererEvent, payload: LibraryScanProgress) => {
      listener(payload)
    }
    ipcRenderer.on('library/scan-progress', handler)
    return () => {
      ipcRenderer.removeListener('library/scan-progress', handler)
    }
  },
  onLibraryScanComplete: (listener) => {
    const handler = (_event: IpcRendererEvent, payload: LibraryScanComplete) => {
      listener(payload)
    }
    ipcRenderer.on('library/scan-complete', handler)
    return () => {
      ipcRenderer.removeListener('library/scan-complete', handler)
    }
  },
  libraryGetPlayback: (videoId) =>
    ipcRenderer.invoke('library/get-playback', videoId) as Promise<{ ok: boolean; position?: number; error?: string }>,
  librarySavePlayback: (payload) =>
    ipcRenderer.invoke('library/save-playback', payload) as Promise<{ ok: boolean; error?: string }>,
  systemBinaries: () => ipcRenderer.invoke('system/binaries') as Promise<BinaryStatusResponse>,
  systemRepairBinaries: () => ipcRenderer.invoke('system/repair-binaries') as Promise<BinaryRepairResponse>,
  systemOpenBinariesFolder: () => ipcRenderer.invoke('system/open-binaries-folder') as Promise<{ ok: boolean; error?: string }>,
  systemDownloadBinaries: () => ipcRenderer.invoke('system/download-binaries') as Promise<BinaryDownloadResponse>,
  systemCheckMissingBinaries: () => ipcRenderer.invoke('system/check-missing-binaries') as Promise<BinaryMissingResponse>,
  onBinaryDownloadProgress: (listener) => {
    const handler = (_event: IpcRendererEvent, payload: BinaryDownloadProgress) => {
      listener(payload)
    }
    ipcRenderer.on('binary-download/progress', handler)
    return () => {
      ipcRenderer.removeListener('binary-download/progress', handler)
    }
  },
  llmGetSettings: () => ipcRenderer.invoke('llm/get-settings') as Promise<LlmSettingsResponse>,
  llmUpdateSettings: (payload) => ipcRenderer.invoke('llm/update-settings', payload) as Promise<LlmUpdateResponse>,
  llmTestConnection: (provider) => ipcRenderer.invoke('llm/test-connection', provider) as Promise<LlmTestResponse>,
  llmSummarizeVideo: (videoId) => ipcRenderer.invoke('llm/summarize-video', { videoId }) as Promise<LlmSummaryResponse>,
  llmCleanupTranscript: (videoId) => ipcRenderer.invoke('llm/cleanup-transcript', { videoId }) as Promise<LlmTranscriptResponse>,
  watchFolderGetSettings: () => ipcRenderer.invoke('settings/get-watch-folder') as Promise<WatchFolderSettingsResponse>,
  watchFolderSelectPath: () => ipcRenderer.invoke('settings/select-watch-folder') as Promise<WatchFolderSettingsResponse>,
  watchFolderUpdateSettings: (payload) => ipcRenderer.invoke('settings/update-watch-folder', payload) as Promise<WatchFolderSettingsResponse>,
  watchFolderScanNow: () => ipcRenderer.invoke('settings/watch-folder-scan') as Promise<{ ok: boolean; error?: string }>,
  authSelectCookieFile: () => ipcRenderer.invoke('auth/select-cookie-file') as Promise<AuthSelectCookieResponse>,
  authImportCookies: (payload) => ipcRenderer.invoke('auth/import-cookies', payload) as Promise<AuthImportResponse>,
  authListSessions: () => ipcRenderer.invoke('auth/list-sessions') as Promise<AuthListResponse>,
  authSetActive: (sessionId) => ipcRenderer.invoke('auth/set-active', sessionId) as Promise<AuthMutationResponse>,
  authDeleteSession: (sessionId) => ipcRenderer.invoke('auth/delete-session', sessionId) as Promise<AuthMutationResponse>,
  privacyGetSettings: () => ipcRenderer.invoke('settings/get-privacy') as Promise<PrivacySettingsResponse>,
  privacyUpdateSettings: (payload) => ipcRenderer.invoke('settings/update-privacy', payload) as Promise<PrivacySettingsResponse>,
  privacySetPin: (pin) => ipcRenderer.invoke('settings/set-privacy-pin', pin) as Promise<PrivacyPinResponse>,
  privacyClearPin: () => ipcRenderer.invoke('settings/clear-privacy-pin') as Promise<PrivacyPinResponse>,
  privacyVerifyPin: (pin) => ipcRenderer.invoke('settings/verify-privacy-pin', pin) as Promise<PrivacyPinResponse>,
  processingSelectInput: () => ipcRenderer.invoke('processing/select-input') as Promise<ProcessingSelectResponse>,
  processingSelectBatch: () => ipcRenderer.invoke('processing/select-batch') as Promise<ProcessingSelectBatchResponse>,
  processingPresets: () => ipcRenderer.invoke('processing/presets') as Promise<ProcessingPresetsResponse>,
  processingTranscode: (payload) =>
    ipcRenderer.invoke('processing/transcode', payload) as Promise<ProcessingTranscodeResponse>,
  processingTranscribe: (payload) =>
    ipcRenderer.invoke('processing/transcribe', payload) as Promise<ProcessingTranscribeResponse>,
  processingList: (type) => ipcRenderer.invoke('processing/list', type) as Promise<ProcessingListResponse>,
  processingDetails: (jobId) => ipcRenderer.invoke('processing/details', jobId) as Promise<ProcessingDetailsResponse>,
  processingCancel: (jobId) => ipcRenderer.invoke('processing/cancel', jobId) as Promise<ProcessingCancelResponse>,
  processingDetectHWAccel: () => ipcRenderer.invoke('processing/detect-hw-accel') as Promise<HWAccelDetectResponse>,
  processingAdvancedTranscode: (payload) =>
    ipcRenderer.invoke('processing/advanced-transcode', payload) as Promise<AdvancedTranscodeResponse>,
  processingPreviewCommand: (payload) =>
    ipcRenderer.invoke('processing/preview-command', payload) as Promise<{ ok: boolean; command?: string[]; error?: string }>,
  processingProbeVideo: (filePath) =>
    ipcRenderer.invoke('processing/probe-video', filePath) as Promise<VideoProbeResponse>,
  processingAnalyzeVision: (payload) =>
    ipcRenderer.invoke('processing/analyze-video-vision', payload) as Promise<VisionAnalysisResponse>,
  processingGenerateThumbnail: (payload) =>
    ipcRenderer.invoke('processing/generate-thumbnail', payload) as Promise<ThumbnailResponse>,
  onProcessingEvent: (listener) => {
    const handler = (_event: IpcRendererEvent, payload: ProcessingJobEvent) => {
      listener(payload)
    }
    ipcRenderer.on('processing/event', handler)
    return () => {
      ipcRenderer.removeListener('processing/event', handler)
    }
  },
  onDownloadEvent: (listener) => {
    const handler = (_event: IpcRendererEvent, payload: DownloadEvent) => {
      listener(payload)
    }
    ipcRenderer.on('download/event', handler)
    return () => {
      ipcRenderer.removeListener('download/event', handler)
    }
  },

  // Archival Processing API
  archivalSelectFiles: () =>
    ipcRenderer.invoke('archival/select-files') as Promise<ArchivalSelectFilesResponse>,
  archivalSelectOutputDir: () =>
    ipcRenderer.invoke('archival/select-output-dir') as Promise<ArchivalSelectOutputDirResponse>,
  archivalSelectFolder: () =>
    ipcRenderer.invoke('archival/select-folder') as Promise<ArchivalSelectFolderResponse>,
  archivalGetDefaultConfig: () =>
    ipcRenderer.invoke('archival/get-default-config') as Promise<{ ok: boolean; config: Omit<ArchivalEncodingConfigFull, 'outputDir'> }>,
  archivalStartBatch: (payload) =>
    ipcRenderer.invoke('archival/start-batch', payload) as Promise<ArchivalStartBatchResponse>,
  archivalGetStatus: () =>
    ipcRenderer.invoke('archival/get-status') as Promise<ArchivalStatusResponse>,
  archivalCancel: () =>
    ipcRenderer.invoke('archival/cancel') as Promise<ArchivalCancelResponse>,
  archivalPreviewCommand: (payload) =>
    ipcRenderer.invoke('archival/preview-command', payload) as Promise<ArchivalPreviewCommandResponse>,
  archivalEstimateSize: (inputPath) =>
    ipcRenderer.invoke('archival/estimate-size', inputPath) as Promise<ArchivalEstimateSizeResponse>,
  archivalAnalyzeVideo: (inputPath) =>
    ipcRenderer.invoke('archival/analyze-video', inputPath) as Promise<ArchivalAnalyzeVideoResponse>,
  archivalGetBatchInfo: (payload) =>
    ipcRenderer.invoke('archival/get-batch-info', payload) as Promise<ArchivalBatchInfoResponse>,
  archivalDetectEncoders: () =>
    ipcRenderer.invoke('archival/detect-encoders') as Promise<ArchivalDetectEncodersResponse>,
  archivalUpgradeFFmpeg: () =>
    ipcRenderer.invoke('archival/upgrade-ffmpeg') as Promise<ArchivalUpgradeFFmpegResponse>,
  onArchivalEvent: (listener) => {
    const handler = (_event: IpcRendererEvent, payload: ArchivalProgressEvent) => {
      listener(payload)
    }
    ipcRenderer.on('archival/event', handler)
    return () => {
      ipcRenderer.removeListener('archival/event', handler)
    }
  },
  onArchivalUpgradeProgress: (listener) => {
    const handler = (_event: IpcRendererEvent, payload: ArchivalUpgradeProgress) => {
      listener(payload)
    }
    ipcRenderer.on('archival/upgrade-progress', handler)
    return () => {
      ipcRenderer.removeListener('archival/upgrade-progress', handler)
    }
  },

  // Smart Tagging API
  smartTagging: {
    indexVideo: (videoId, videoPath) =>
      ipcRenderer.invoke('smart-tagging:index-video', { videoId, videoPath }),

    suggestTags: (params) =>
      ipcRenderer.invoke('smart-tagging:suggest-tags', params),

    applyDecision: (videoId, tagName, decision) =>
      ipcRenderer.invoke('smart-tagging:apply-decision', { videoId, tagName, decision }),

    addTag: (videoId, tagName, lock) =>
      ipcRenderer.invoke('smart-tagging:add-tag', { videoId, tagName, lock }),

    removeTag: (videoId, tagName, force) =>
      ipcRenderer.invoke('smart-tagging:remove-tag', { videoId, tagName, force }),

    lockTag: (videoId, tagName) =>
      ipcRenderer.invoke('smart-tagging:lock-tag', { videoId, tagName }),

    unlockTag: (videoId, tagName) =>
      ipcRenderer.invoke('smart-tagging:unlock-tag', { videoId, tagName }),

    regenerate: (videoId) =>
      ipcRenderer.invoke('smart-tagging:regenerate', { videoId }),

    getTaxonomy: () =>
      ipcRenderer.invoke('smart-tagging:get-taxonomy'),

    reloadTaxonomy: () =>
      ipcRenderer.invoke('smart-tagging:reload-taxonomy'),

    getVideoTags: (videoId) =>
      ipcRenderer.invoke('smart-tagging:get-video-tags', { videoId }),

    isIndexed: (videoId) =>
      ipcRenderer.invoke('smart-tagging:is-indexed', { videoId }),

    cleanup: (videoId) =>
      ipcRenderer.invoke('smart-tagging:cleanup', { videoId }),

    llmAvailable: () =>
      ipcRenderer.invoke('smart-tagging:llm-available'),

    llmModels: () =>
      ipcRenderer.invoke('smart-tagging:llm-models')
  },

  // App lock password
  appCheckPasswordSet: () =>
    ipcRenderer.invoke('app/check-password-set') as Promise<{ ok: boolean; isSet?: boolean; isEnabled?: boolean; error?: string }>,
  appSetPassword: (password) =>
    ipcRenderer.invoke('app/set-password', password) as Promise<{ ok: boolean; error?: string }>,
  appVerifyPassword: (password) =>
    ipcRenderer.invoke('app/verify-password', password) as Promise<{ ok: boolean; valid?: boolean; error?: string }>,
  appChangePassword: (payload) =>
    ipcRenderer.invoke('app/change-password', payload) as Promise<{ ok: boolean; error?: string }>,
  appRemovePassword: (password) =>
    ipcRenderer.invoke('app/remove-password', password) as Promise<{ ok: boolean; error?: string }>,
  appToggleLock: (enabled) =>
    ipcRenderer.invoke('app/toggle-lock', enabled) as Promise<{ ok: boolean; error?: string }>
}
