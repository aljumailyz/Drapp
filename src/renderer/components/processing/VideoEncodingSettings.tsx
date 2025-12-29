import { useState, useMemo, useCallback } from 'react'
import Tooltip, { InfoTooltip, TooltipHeading, TooltipText, TooltipList } from '../ui/Tooltip'
import type {
  VideoEncodingConfig,
  ResolutionPreset,
  ScalingAlgorithm,
  CropMode,
  VideoCodec,
  EncodingSpeed,
  ContainerFormat,
  HWAccelerator,
  AudioCodec,
  DenoiseLevel,
  SharpenLevel
} from '../../../shared/types/encoding.types'
import {
  RESOLUTION_PRESETS,
  SCALING_ALGORITHMS,
  CROP_OPTIONS,
  VIDEO_CODECS,
  ENCODING_SPEEDS,
  H264_PROFILES,
  H265_PROFILES,
  CRF_GUIDE,
  CONTAINER_FORMATS,
  HW_ACCELERATORS,
  AUDIO_CODECS,
  ENCODING_PRESETS,
  DEFAULT_ENCODING_CONFIG,
  DEFAULT_FILTERS
} from '../../../shared/types/encoding.types'

type VideoEncodingSettingsProps = {
  config: VideoEncodingConfig
  onChange: (config: VideoEncodingConfig) => void
  sourceInfo?: {
    width: number
    height: number
    duration: number
    codec: string
    frameRate: number
    bitrate: number
  }
  availableHWAccel?: HWAccelerator[]
}

type TabId = 'presets' | 'video' | 'audio' | 'filters' | 'output'
type UIMode = 'simple' | 'advanced'

// Recommended options per category
const RECOMMENDED = {
  codec: 'h264',
  profile: 'high',
  scaling: 'lanczos',
  container: 'mp4',
  audioCodec: 'aac',
  crf: 20,
  encodingSpeed: 'medium',
  resolution: '1080p'
} as const

// Check if codec is compatible with container
function isCodecContainerCompatible(codec: VideoCodec, container: ContainerFormat): boolean {
  const codecInfo = VIDEO_CODECS.find(c => c.id === codec)
  if (!codecInfo) return true
  return codecInfo.fileExtensions.includes(container)
}

// Get incompatibility warnings
function getIncompatibilityWarnings(config: VideoEncodingConfig): string[] {
  const warnings: string[] = []

  if (!isCodecContainerCompatible(config.videoCodec, config.container)) {
    const containerLabel = CONTAINER_FORMATS.find(c => c.id === config.container)?.label || config.container
    const codecLabel = VIDEO_CODECS.find(c => c.id === config.videoCodec)?.label || config.videoCodec
    warnings.push(`${codecLabel} is not compatible with ${containerLabel} container. Video may not play correctly.`)
  }

  if (config.videoCodec === 'vp9' && config.container !== 'webm' && config.container !== 'mkv') {
    warnings.push('VP9 works best with WebM or MKV containers.')
  }

  if (config.videoCodec === 'prores' && config.container !== 'mov') {
    warnings.push('ProRes requires MOV container.')
  }

  if (config.audioCodec === 'opus' && config.container === 'mp4') {
    warnings.push('Opus audio in MP4 may have limited player support.')
  }

  if (config.hwAccel !== 'none' && config.videoCodec === 'av1' && config.hwAccel !== 'nvenc') {
    warnings.push('AV1 hardware encoding is only available on NVIDIA RTX 40-series GPUs.')
  }

  if (config.resolution === '4k' && config.profile === 'baseline') {
    warnings.push('Baseline profile at 4K may cause compatibility issues with some players.')
  }

  return warnings
}

// Estimate file size based on settings
function estimateFileSize(
  config: VideoEncodingConfig,
  durationSeconds: number,
  sourceBitrate?: number
): { min: number; max: number; display: string } {
  if (!durationSeconds || durationSeconds <= 0) {
    return { min: 0, max: 0, display: 'N/A' }
  }

  // For copy codec, use source bitrate if available
  if (config.videoCodec === 'copy') {
    if (sourceBitrate) {
      const sizeMB = (sourceBitrate * durationSeconds) / 8 / 1024
      if (sizeMB > 1024) {
        return { min: sizeMB, max: sizeMB, display: `~${(sizeMB / 1024).toFixed(1)} GB (same as source)` }
      }
      return { min: sizeMB, max: sizeMB, display: `~${Math.round(sizeMB)} MB (same as source)` }
    }
    return { min: 0, max: 0, display: 'Same as source' }
  }

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

  // CRF to bitrate estimation (kbps)
  const crfBase = Math.pow(2, (23 - config.crf) / 6) * 5000
  let baseBitrate = crfBase * resMult

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

  const min = sizeMB * 0.7
  const max = sizeMB * 1.3

  let display: string
  if (max > 1024) {
    display = `${(min / 1024).toFixed(1)} - ${(max / 1024).toFixed(1)} GB`
  } else if (max > 100) {
    display = `${Math.round(min)} - ${Math.round(max)} MB`
  } else {
    display = `${min.toFixed(1)} - ${max.toFixed(1)} MB`
  }

  return { min, max, display }
}

// Estimate encoding time
function estimateEncodingTime(
  config: VideoEncodingConfig,
  durationSeconds: number
): string {
  if (!durationSeconds || durationSeconds <= 0) {
    return 'N/A'
  }

  // Base encoding speed (x realtime for 1080p with medium preset, software)
  let baseSpeed = 1.5 // 1.5x realtime

  // Encoding speed multipliers
  const speedMultipliers: Record<string, number> = {
    ultrafast: 10,
    superfast: 8,
    veryfast: 5,
    faster: 3,
    fast: 2,
    medium: 1,
    slow: 0.5,
    slower: 0.25,
    veryslow: 0.125,
    placebo: 0.05
  }
  baseSpeed *= speedMultipliers[config.encodingSpeed] || 1

  // Hardware acceleration boost
  if (config.hwAccel !== 'none') {
    baseSpeed *= 5 // HW encoding is roughly 5x faster
  }

  // Resolution impact
  const resolutionMultipliers: Record<string, number> = {
    '4k': 0.25,
    '1440p': 0.5,
    '1080p': 1,
    '720p': 2,
    '480p': 3,
    '360p': 4,
    source: 1,
    custom: 1
  }
  baseSpeed *= resolutionMultipliers[config.resolution] || 1

  // Codec impact
  const codecMultipliers: Record<string, number> = {
    h264: 1,
    h265: 0.5,
    vp9: 0.4,
    av1: 0.1,
    prores: 3,
    copy: 100 // Instant
  }
  baseSpeed *= codecMultipliers[config.videoCodec] || 1

  // Calculate time
  const encodingSeconds = durationSeconds / baseSpeed

  if (encodingSeconds < 60) {
    return `~${Math.max(1, Math.round(encodingSeconds))}s`
  } else if (encodingSeconds < 3600) {
    return `~${Math.round(encodingSeconds / 60)}m`
  } else {
    const hours = Math.floor(encodingSeconds / 3600)
    const mins = Math.round((encodingSeconds % 3600) / 60)
    return `~${hours}h ${mins}m`
  }
}

// Compare current config to applied preset
function getPresetDifferences(
  config: VideoEncodingConfig,
  presetId: string | null
): string[] {
  if (!presetId) return []

  const preset = ENCODING_PRESETS.find(p => p.id === presetId)
  if (!preset) return []

  const differences: string[] = []
  const presetConfig = { ...DEFAULT_ENCODING_CONFIG, ...preset.config }

  if (config.resolution !== presetConfig.resolution) {
    differences.push(`Resolution: ${config.resolution} (was ${presetConfig.resolution})`)
  }
  if (config.videoCodec !== presetConfig.videoCodec) {
    differences.push(`Codec: ${config.videoCodec} (was ${presetConfig.videoCodec})`)
  }
  if (config.crf !== presetConfig.crf) {
    differences.push(`CRF: ${config.crf} (was ${presetConfig.crf})`)
  }
  if (config.encodingSpeed !== presetConfig.encodingSpeed) {
    differences.push(`Speed: ${config.encodingSpeed} (was ${presetConfig.encodingSpeed})`)
  }
  if (config.container !== presetConfig.container) {
    differences.push(`Container: ${config.container} (was ${presetConfig.container})`)
  }
  if (config.audioCodec !== presetConfig.audioCodec) {
    differences.push(`Audio: ${config.audioCodec} (was ${presetConfig.audioCodec})`)
  }
  if (config.hwAccel !== presetConfig.hwAccel) {
    differences.push(`HW Accel: ${config.hwAccel} (was ${presetConfig.hwAccel})`)
  }

  return differences
}

// Badge component for recommended options
function RecommendedBadge(): JSX.Element {
  return (
    <span className="ml-1.5 inline-flex items-center rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
      Recommended
    </span>
  )
}

// Helper to reset profile when codec changes to one without profiles
function getValidProfile(codec: VideoCodec, currentProfile: string): string {
  if (codec === 'h264') {
    return H264_PROFILES.some(p => p.id === currentProfile) ? currentProfile : 'high'
  }
  if (codec === 'h265') {
    return H265_PROFILES.some(p => p.id === currentProfile) ? currentProfile : 'main10'
  }
  return currentProfile // Other codecs don't use profiles
}

export default function VideoEncodingSettings({
  config,
  onChange,
  sourceInfo,
  availableHWAccel = ['none', 'videotoolbox']
}: VideoEncodingSettingsProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<TabId>('presets')
  const [uiMode, setUIMode] = useState<UIMode>('simple')
  const [appliedPreset, setAppliedPreset] = useState<string | null>(null)

  const updateConfig = useCallback(<K extends keyof VideoEncodingConfig>(
    key: K,
    value: VideoEncodingConfig[K]
  ) => {
    let newConfig = { ...config, [key]: value }

    // When codec changes, ensure profile is valid for new codec
    if (key === 'videoCodec') {
      const validProfile = getValidProfile(value as VideoCodec, config.profile)
      newConfig = { ...newConfig, profile: validProfile }

      // Also auto-switch container if current one is incompatible
      const codecInfo = VIDEO_CODECS.find(c => c.id === value)
      if (codecInfo && !codecInfo.fileExtensions.includes(config.container)) {
        newConfig = { ...newConfig, container: codecInfo.fileExtensions[0] as ContainerFormat }
      }
    }

    onChange(newConfig)
  }, [config, onChange])

  const updateFilters = useCallback(<K extends keyof typeof config.filters>(
    key: K,
    value: typeof config.filters[K]
  ) => {
    onChange({ ...config, filters: { ...config.filters, [key]: value } })
  }, [config, onChange])

  const applyPreset = useCallback((presetId: string) => {
    const preset = ENCODING_PRESETS.find((p) => p.id === presetId)
    if (preset) {
      onChange({ ...DEFAULT_ENCODING_CONFIG, ...preset.config })
      setAppliedPreset(presetId)
    }
  }, [onChange])

  // Get profiles based on selected codec
  const availableProfiles = useMemo(() => {
    if (config.videoCodec === 'h264') return H264_PROFILES
    if (config.videoCodec === 'h265') return H265_PROFILES
    return []
  }, [config.videoCodec])

  // Get compatible containers for selected codec
  const compatibleContainers = useMemo(() => {
    const codec = VIDEO_CODECS.find((c) => c.id === config.videoCodec)
    if (!codec) return CONTAINER_FORMATS
    return CONTAINER_FORMATS.filter((f) => codec.fileExtensions.includes(f.id))
  }, [config.videoCodec])

  // Get CRF recommendation based on current value
  const crfInfo = useMemo(() => {
    const sorted = [...CRF_GUIDE].sort((a, b) => Math.abs(a.value - config.crf) - Math.abs(b.value - config.crf))
    return sorted[0]
  }, [config.crf])

  // Incompatibility warnings
  const warnings = useMemo(() => getIncompatibilityWarnings(config), [config])

  // File size estimate
  const fileSizeEstimate = useMemo(
    () => estimateFileSize(config, sourceInfo?.duration || 0, sourceInfo?.bitrate),
    [config, sourceInfo?.duration, sourceInfo?.bitrate]
  )

  // Encoding time estimate
  const encodingTimeEstimate = useMemo(
    () => estimateEncodingTime(config, sourceInfo?.duration || 0),
    [config, sourceInfo?.duration]
  )

  // Preset differences
  const presetDifferences = useMemo(
    () => getPresetDifferences(config, appliedPreset),
    [config, appliedPreset]
  )

  const simpleTabs: TabId[] = ['presets', 'video', 'output']
  const tabs: Array<{ id: TabId; label: string }> = uiMode === 'simple'
    ? [
        { id: 'presets', label: 'Presets' },
        { id: 'video', label: 'Quality' },
        { id: 'output', label: 'Output' }
      ]
    : [
        { id: 'presets', label: 'Presets' },
        { id: 'video', label: 'Video' },
        { id: 'audio', label: 'Audio' },
        { id: 'filters', label: 'Filters' },
        { id: 'output', label: 'Output' }
      ]

  // Reset to valid tab when switching to simple mode
  const handleModeChange = useCallback((newMode: UIMode) => {
    setUIMode(newMode)
    if (newMode === 'simple' && !simpleTabs.includes(activeTab)) {
      setActiveTab('video') // Default to Quality tab
    }
  }, [activeTab])

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      {/* Header with Mode Toggle */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700">Mode:</span>
          <div className="flex rounded-lg bg-slate-100 p-0.5">
            <button
              type="button"
              onClick={() => handleModeChange('simple')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                uiMode === 'simple'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Simple
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('advanced')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                uiMode === 'advanced'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Advanced
            </button>
          </div>
          <InfoTooltip
            content={
              <>
                <TooltipHeading>UI Mode</TooltipHeading>
                <TooltipText>
                  Simple mode shows essential settings only. Advanced mode reveals all options for fine-grained control.
                </TooltipText>
              </>
            }
          />
        </div>

        {warnings.length > 0 && (
          <Tooltip
            content={
              <>
                <TooltipHeading>Compatibility Warnings</TooltipHeading>
                <TooltipList items={warnings} type="cons" />
              </>
            }
            position="bottom"
            maxWidth={400}
          >
            <div className="flex cursor-help items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {warnings.length} warning{warnings.length > 1 ? 's' : ''}
            </div>
          </Tooltip>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-slate-100 px-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`
              relative px-4 py-3 text-sm font-medium transition
              ${activeTab === tab.id ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}
            `}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-slate-900" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'presets' && (
          <PresetsTab
            onApplyPreset={applyPreset}
            appliedPreset={appliedPreset}
            presetDifferences={presetDifferences}
          />
        )}

        {activeTab === 'video' && (
          <VideoTab
            config={config}
            updateConfig={updateConfig}
            sourceInfo={sourceInfo}
            availableProfiles={availableProfiles}
            availableHWAccel={availableHWAccel}
            crfInfo={crfInfo}
            uiMode={uiMode}
          />
        )}

        {activeTab === 'audio' && uiMode === 'advanced' && (
          <AudioTab config={config} updateConfig={updateConfig} />
        )}

        {activeTab === 'filters' && uiMode === 'advanced' && (
          <FiltersTab
            filters={config.filters}
            updateFilters={updateFilters}
          />
        )}

        {activeTab === 'output' && (
          <OutputTab
            config={config}
            updateConfig={updateConfig}
            compatibleContainers={compatibleContainers}
            uiMode={uiMode}
          />
        )}
      </div>

      {/* Summary Panel */}
      <SummaryPanel
        config={config}
        sourceInfo={sourceInfo}
        fileSizeEstimate={fileSizeEstimate}
        encodingTimeEstimate={encodingTimeEstimate}
        warnings={warnings}
      />
    </div>
  )
}

// ============================================================================
// SUMMARY PANEL
// ============================================================================
function SummaryPanel({
  config,
  sourceInfo,
  fileSizeEstimate,
  encodingTimeEstimate,
  warnings
}: {
  config: VideoEncodingConfig
  sourceInfo?: { width: number; height: number; duration: number; codec: string; frameRate: number; bitrate: number }
  fileSizeEstimate: { min: number; max: number; display: string }
  encodingTimeEstimate: string
  warnings: string[]
}): JSX.Element {
  const codecLabel = VIDEO_CODECS.find(c => c.id === config.videoCodec)?.label || config.videoCodec
  const containerLabel = CONTAINER_FORMATS.find(c => c.id === config.container)?.label || config.container

  return (
    <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {/* Output Format */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Output</span>
          <span className="rounded bg-slate-200 px-2 py-0.5 text-sm font-medium text-slate-700">
            {config.resolution === 'source' ? 'Source' : config.resolution} • {codecLabel} • .{config.container}
          </span>
        </div>

        {/* Quality */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Quality</span>
          <span className="text-sm text-slate-700">CRF {config.crf}</span>
        </div>

        {/* Estimated Size */}
        {sourceInfo?.duration && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Est. Size</span>
            <span className="text-sm font-medium text-slate-700">{fileSizeEstimate.display}</span>
          </div>
        )}

        {/* Estimated Time */}
        {sourceInfo?.duration && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Est. Time</span>
            <span className="text-sm text-slate-700">{encodingTimeEstimate}</span>
          </div>
        )}

        {/* Hardware */}
        {config.hwAccel !== 'none' && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Encoder</span>
            <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              {HW_ACCELERATORS.find(h => h.id === config.hwAccel)?.label || config.hwAccel}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// PRESETS TAB
// ============================================================================
function PresetsTab({
  onApplyPreset,
  appliedPreset,
  presetDifferences
}: {
  onApplyPreset: (id: string) => void
  appliedPreset: string | null
  presetDifferences: string[]
}): JSX.Element {
  const categories = [
    { id: 'social', label: 'Social Media', icon: '📱' },
    { id: 'compatibility', label: 'Compatibility', icon: '🌐' },
    { id: 'archive', label: 'Archive', icon: '💾' },
    { id: 'fast', label: 'Fast Export', icon: '⚡' }
  ] as const

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">
        Choose a preset to quickly configure encoding settings, then customize in other tabs if needed.
      </p>

      {/* Show modifications if preset was customized */}
      {appliedPreset && presetDifferences.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm font-medium text-amber-800">
              Preset "{ENCODING_PRESETS.find(p => p.id === appliedPreset)?.name}" has been modified:
            </span>
          </div>
          <ul className="mt-2 space-y-1">
            {presetDifferences.map((diff, i) => (
              <li key={i} className="text-xs text-amber-700">• {diff}</li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => onApplyPreset(appliedPreset)}
            className="mt-2 text-xs font-medium text-amber-700 underline hover:text-amber-900"
          >
            Reset to original preset
          </button>
        </div>
      )}

      {categories.map((cat) => (
        <div key={cat.id}>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <span>{cat.icon}</span>
            {cat.label}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {ENCODING_PRESETS.filter((p) => p.category === cat.id).map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => onApplyPreset(preset.id)}
                className={`rounded-lg border p-3 text-left transition ${
                  appliedPreset === preset.id
                    ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-900">{preset.name}</p>
                  {appliedPreset === preset.id && (
                    <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                      Active
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500">{preset.description}</p>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// VIDEO TAB
// ============================================================================
function VideoTab({
  config,
  updateConfig,
  sourceInfo,
  availableProfiles,
  availableHWAccel,
  crfInfo,
  uiMode
}: {
  config: VideoEncodingConfig
  updateConfig: <K extends keyof VideoEncodingConfig>(key: K, value: VideoEncodingConfig[K]) => void
  sourceInfo?: { width: number; height: number; duration: number; codec: string; frameRate: number; bitrate: number }
  availableProfiles: typeof H264_PROFILES
  availableHWAccel: HWAccelerator[]
  crfInfo: typeof CRF_GUIDE[number]
  uiMode: UIMode
}): JSX.Element {
  const [showAdvanced, setShowAdvanced] = useState(false)

  return (
    <div className="space-y-6">
      {/* Source Info */}
      {sourceInfo && (
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Source</p>
          <p className="mt-1 text-sm text-slate-700">
            {sourceInfo.width}×{sourceInfo.height} • {sourceInfo.codec} • {sourceInfo.frameRate}fps • {Math.round(sourceInfo.bitrate / 1000)}Mbps
          </p>
        </div>
      )}

      {/* Resolution */}
      <SettingGroup
        label="Output Resolution"
        tooltip={
          <>
            <TooltipHeading>Output Resolution</TooltipHeading>
            <TooltipText>
              The final dimensions of your video. Downscaling can significantly reduce file size while maintaining perceived quality. Upscaling is generally not recommended as it doesn't add detail.
            </TooltipText>
          </>
        }
      >
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(RESOLUTION_PRESETS) as ResolutionPreset[]).map((key) => {
            const res = RESOLUTION_PRESETS[key]
            const isRecommended = key === RECOMMENDED.resolution
            return (
              <button
                key={key}
                type="button"
                onClick={() => updateConfig('resolution', key)}
                className={`relative rounded-lg border px-3 py-2 text-sm transition ${
                  config.resolution === key
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                {key === 'source' ? 'Source' : key === 'custom' ? 'Custom' : key}
                {res && (
                  <span className="ml-1 text-xs opacity-60">{res.width}×{res.height}</span>
                )}
                {isRecommended && config.resolution !== key && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[8px] text-white">
                    ★
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {config.resolution === 'custom' && (
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="16"
                max="7680"
                value={config.customWidth || ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value)
                  updateConfig('customWidth', val > 0 && val <= 7680 ? val : undefined)
                }}
                placeholder="Width"
                className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <span className="text-slate-400">×</span>
              <input
                type="number"
                min="16"
                max="4320"
                value={config.customHeight || ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value)
                  updateConfig('customHeight', val > 0 && val <= 4320 ? val : undefined)
                }}
                placeholder="Height"
                className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            {(config.customWidth && config.customWidth % 2 !== 0) || (config.customHeight && config.customHeight % 2 !== 0) ? (
              <p className="mt-1 text-xs text-amber-600">Dimensions should be even numbers for best compatibility</p>
            ) : null}
          </div>
        )}
      </SettingGroup>

      {/* Quality (CRF) with Enhanced Slider - only for re-encoding codecs */}
      {config.videoCodec !== 'copy' && (
      <SettingGroup
        label="Quality (CRF)"
        tooltip={
          <>
            <TooltipHeading>Constant Rate Factor (CRF)</TooltipHeading>
            <TooltipText>
              CRF is the recommended quality control mode. Lower values = higher quality and larger files. The encoder adjusts bitrate to maintain consistent quality.
            </TooltipText>
            <div className="mt-2 space-y-1 text-xs">
              <p className="text-emerald-400">0-17: Visually lossless (archival)</p>
              <p className="text-blue-400">18-22: High quality (recommended)</p>
              <p className="text-amber-400">23-28: Good quality (smaller files)</p>
              <p className="text-red-400">29+: Visible quality loss</p>
            </div>
          </>
        }
      >
        <div className="space-y-3">
          {/* Enhanced CRF Slider with Visual Zones */}
          <div className="relative">
            <div className="mb-2 flex items-center gap-4">
              <div className="relative flex-1">
                {/* Zone background */}
                <div className="absolute inset-0 flex h-2 overflow-hidden rounded-full">
                  <div className="w-[33%] bg-emerald-400" /> {/* 0-17 */}
                  <div className="w-[10%] bg-blue-400" /> {/* 18-22 */}
                  <div className="w-[12%] bg-amber-400" /> {/* 23-28 */}
                  <div className="w-[45%] bg-red-400" /> {/* 29-51 */}
                </div>
                {/* Slider input */}
                <input
                  type="range"
                  min="0"
                  max="51"
                  value={config.crf}
                  onChange={(e) => updateConfig('crf', parseInt(e.target.value))}
                  className="relative z-10 h-2 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-slate-900 [&::-webkit-slider-thumb]:shadow-lg"
                />
              </div>
              <span className="w-12 text-right font-mono text-lg font-bold text-slate-900">
                {config.crf}
              </span>
            </div>

            {/* Zone labels */}
            <div className="flex text-[10px] font-medium uppercase tracking-wide">
              <span className="w-[33%] text-emerald-600">Lossless</span>
              <span className="w-[10%] text-blue-600">High</span>
              <span className="w-[12%] text-amber-600">Good</span>
              <span className="w-[45%] text-right text-red-600">Low</span>
            </div>
          </div>

          {/* CRF Info Panel */}
          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-slate-900">{crfInfo.label}</p>
                {config.crf === RECOMMENDED.crf && <RecommendedBadge />}
              </div>
              <p className="text-xs text-slate-500">{crfInfo.description}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Est. file size</p>
              <p className="text-sm font-medium text-slate-700">{crfInfo.fileSize}</p>
            </div>
          </div>
        </div>
      </SettingGroup>
      )}

      {/* Video Codec */}
      <SettingGroup
        label="Video Codec"
        tooltip={
          <>
            <TooltipHeading>Video Codec</TooltipHeading>
            <TooltipText>
              The compression algorithm used to encode your video. Different codecs offer different tradeoffs between file size, quality, and compatibility.
            </TooltipText>
          </>
        }
      >
        <div className="grid grid-cols-3 gap-2">
          {VIDEO_CODECS.map((codec) => {
            const isRecommended = codec.id === RECOMMENDED.codec
            return (
              <Tooltip
                key={codec.id}
                content={
                  <>
                    <TooltipHeading>{codec.label}</TooltipHeading>
                    <TooltipText>{codec.description}</TooltipText>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs font-medium text-emerald-400">Pros</p>
                        <TooltipList items={codec.pros} type="pros" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-red-400">Cons</p>
                        <TooltipList items={codec.cons} type="cons" />
                      </div>
                    </div>
                  </>
                }
                position="bottom"
                maxWidth={400}
              >
                <button
                  type="button"
                  onClick={() => updateConfig('videoCodec', codec.id)}
                  className={`relative w-full rounded-lg border px-3 py-2 text-sm transition ${
                    config.videoCodec === codec.id
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {codec.label}
                  {isRecommended && config.videoCodec !== codec.id && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[8px] text-white">
                      ★
                    </span>
                  )}
                </button>
              </Tooltip>
            )
          })}
        </div>
      </SettingGroup>

      {/* Hardware Acceleration */}
      <SettingGroup
        label="Hardware Acceleration"
        tooltip={
          <>
            <TooltipHeading>Hardware Acceleration</TooltipHeading>
            <TooltipText>
              Use GPU hardware to speed up encoding. Much faster but may produce slightly lower quality than software encoding.
            </TooltipText>
          </>
        }
      >
        <div className="grid grid-cols-3 gap-2">
          {HW_ACCELERATORS.filter((hw) => availableHWAccel.includes(hw.id)).map((hw) => (
            <Tooltip
              key={hw.id}
              content={
                <>
                  <TooltipHeading>{hw.label}</TooltipHeading>
                  <TooltipText>{hw.description}</TooltipText>
                  <p className="mt-1 text-xs text-amber-400">{hw.qualityNote}</p>
                </>
              }
              position="bottom"
            >
              <button
                type="button"
                onClick={() => updateConfig('hwAccel', hw.id)}
                className={`w-full rounded-lg border px-3 py-2 text-sm transition ${
                  config.hwAccel === hw.id
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                {hw.label}
                <span className={`block text-xs ${config.hwAccel === hw.id ? 'text-slate-300' : 'text-slate-400'}`}>
                  {hw.vendor}
                </span>
              </button>
            </Tooltip>
          ))}
        </div>
      </SettingGroup>

      {/* Advanced Settings (only in advanced mode or when toggled) */}
      {uiMode === 'advanced' && (
        <>
          {/* Scaling Algorithm */}
          <SettingGroup
            label="Scaling Algorithm"
            tooltip={
              <>
                <TooltipHeading>Scaling Algorithm</TooltipHeading>
                <TooltipText>
                  The mathematical method used to resize the video. Better algorithms produce sharper results but take longer to process.
                </TooltipText>
              </>
            }
          >
            <select
              value={config.scalingAlgorithm}
              onChange={(e) => updateConfig('scalingAlgorithm', e.target.value as ScalingAlgorithm)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {SCALING_ALGORITHMS.map((alg) => (
                <option key={alg.id} value={alg.id}>
                  {alg.label} {alg.id === RECOMMENDED.scaling ? '(Recommended)' : ''} - {alg.description.split('.')[0]}
                </option>
              ))}
            </select>
          </SettingGroup>

          {/* Crop */}
          <SettingGroup
            label="Crop / Aspect Ratio"
            tooltip={
              <>
                <TooltipHeading>Crop / Aspect Ratio</TooltipHeading>
                <TooltipText>
                  Crop the video to a specific aspect ratio. Useful for converting between formats (e.g., landscape to vertical for TikTok).
                </TooltipText>
              </>
            }
          >
            <div className="grid grid-cols-4 gap-2">
              {CROP_OPTIONS.map((opt) => (
                <Tooltip
                  key={opt.id}
                  content={<TooltipText>{opt.description}</TooltipText>}
                  position="bottom"
                >
                  <button
                    type="button"
                    onClick={() => updateConfig('cropMode', opt.id)}
                    className={`w-full rounded-lg border px-3 py-2 text-sm transition ${
                      config.cropMode === opt.id
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                </Tooltip>
              ))}
            </div>
          </SettingGroup>

          {/* Encoding Speed */}
          <SettingGroup
            label="Encoding Speed"
            tooltip={
              <>
                <TooltipHeading>Encoding Speed (Preset)</TooltipHeading>
                <TooltipText>
                  Controls how much time the encoder spends optimizing compression. Slower = smaller files at same quality, but much longer encoding time.
                </TooltipText>
              </>
            }
          >
            <select
              value={config.encodingSpeed}
              onChange={(e) => updateConfig('encodingSpeed', e.target.value as EncodingSpeed)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {ENCODING_SPEEDS.map((speed) => (
                <option key={speed.id} value={speed.id}>
                  {speed.label} {speed.id === RECOMMENDED.encodingSpeed ? '(Recommended)' : ''} ({speed.estimatedTime})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              {ENCODING_SPEEDS.find((s) => s.id === config.encodingSpeed)?.description}
            </p>
          </SettingGroup>

          {/* Profile */}
          {availableProfiles.length > 0 && (
            <SettingGroup
              label="Profile"
              tooltip={
                <>
                  <TooltipHeading>Codec Profile</TooltipHeading>
                  <TooltipText>
                    Profiles define which codec features are used. Higher profiles enable better compression but may not play on older devices.
                  </TooltipText>
                  <TooltipList
                    items={[
                      'Baseline: Maximum compatibility (old phones, set-top boxes)',
                      'Main: Good compatibility with better compression',
                      'High: Best compression, works on most modern devices'
                    ]}
                    type="neutral"
                  />
                </>
              }
            >
              <div className="grid grid-cols-2 gap-2">
                {availableProfiles.map((profile) => {
                  const isRecommended = profile.id === RECOMMENDED.profile
                  return (
                    <Tooltip
                      key={profile.id}
                      content={
                        <>
                          <TooltipHeading>{profile.label}</TooltipHeading>
                          <TooltipText>{profile.description}</TooltipText>
                          <TooltipList items={profile.features} type="neutral" />
                        </>
                      }
                      position="bottom"
                    >
                      <button
                        type="button"
                        onClick={() => updateConfig('profile', profile.id)}
                        className={`relative w-full rounded-lg border px-3 py-2 text-sm transition ${
                          config.profile === profile.id
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {profile.label}
                        <span className={`ml-1 text-xs ${config.profile === profile.id ? 'text-slate-300' : 'text-slate-400'}`}>
                          ({profile.compatibility} compat.)
                        </span>
                        {isRecommended && config.profile !== profile.id && (
                          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[8px] text-white">
                            ★
                          </span>
                        )}
                      </button>
                    </Tooltip>
                  )
                })}
              </div>
            </SettingGroup>
          )}

          {/* Advanced Toggle for even more options */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            {showAdvanced ? '− Hide Extra Options' : '+ Show Extra Options'}
          </button>

          {/* Extra Advanced Options */}
          {showAdvanced && (
            <div className="space-y-6 border-t border-slate-100 pt-6">
              {/* Frame Rate */}
              <SettingGroup
                label="Frame Rate"
                tooltip={
                  <>
                    <TooltipHeading>Frame Rate</TooltipHeading>
                    <TooltipText>
                      Changing frame rate affects smoothness and file size. Reducing from 60fps to 30fps roughly halves file size.
                    </TooltipText>
                  </>
                }
              >
                <div className="grid grid-cols-4 gap-2">
                  {(['source', '24', '30', '60'] as const).map((fps) => (
                    <button
                      key={fps}
                      type="button"
                      onClick={() => updateConfig('frameRate', fps)}
                      className={`rounded-lg border px-3 py-2 text-sm transition ${
                        config.frameRate === fps
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {fps === 'source' ? 'Source' : `${fps}fps`}
                    </button>
                  ))}
                </div>
              </SettingGroup>

              {/* Bitrate Mode */}
              <SettingGroup
                label="Bitrate Mode"
                tooltip={
                  <>
                    <TooltipHeading>Bitrate Mode</TooltipHeading>
                    <TooltipText>
                      CRF (recommended) adjusts bitrate to maintain quality. CBR uses constant bitrate (for streaming). VBR varies bitrate within limits.
                    </TooltipText>
                  </>
                }
              >
                <div className="grid grid-cols-3 gap-2">
                  {(['crf', 'vbr', 'cbr'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => updateConfig('bitrateMode', mode)}
                      className={`rounded-lg border px-3 py-2 text-sm uppercase transition ${
                        config.bitrateMode === mode
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {mode}
                      {mode === 'crf' && <RecommendedBadge />}
                    </button>
                  ))}
                </div>

                {(config.bitrateMode === 'cbr' || config.bitrateMode === 'vbr') && (
                  <div className="mt-3 flex items-center gap-4">
                    <div>
                      <label className="text-xs text-slate-500">Target Bitrate (kbps)</label>
                      <input
                        type="number"
                        value={config.targetBitrate || ''}
                        onChange={(e) => updateConfig('targetBitrate', parseInt(e.target.value) || undefined)}
                        placeholder="5000"
                        className="mt-1 w-28 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      />
                    </div>
                    {config.bitrateMode === 'vbr' && (
                      <div>
                        <label className="text-xs text-slate-500">Max Bitrate (kbps)</label>
                        <input
                          type="number"
                          value={config.maxBitrate || ''}
                          onChange={(e) => updateConfig('maxBitrate', parseInt(e.target.value) || undefined)}
                          placeholder="8000"
                          className="mt-1 w-28 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        />
                      </div>
                    )}
                  </div>
                )}
              </SettingGroup>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ============================================================================
// AUDIO TAB
// ============================================================================
function AudioTab({
  config,
  updateConfig
}: {
  config: VideoEncodingConfig
  updateConfig: <K extends keyof VideoEncodingConfig>(key: K, value: VideoEncodingConfig[K]) => void
}): JSX.Element {
  return (
    <div className="space-y-6">
      {/* Audio Codec */}
      <SettingGroup
        label="Audio Codec"
        tooltip={
          <>
            <TooltipHeading>Audio Codec</TooltipHeading>
            <TooltipText>
              AAC is recommended for maximum compatibility. Opus offers better quality at low bitrates. FLAC is lossless for archiving.
            </TooltipText>
          </>
        }
      >
        <div className="grid grid-cols-3 gap-2">
          {AUDIO_CODECS.map((codec) => {
            const isRecommended = codec.id === RECOMMENDED.audioCodec
            return (
              <Tooltip
                key={codec.id}
                content={<TooltipText>{codec.description}</TooltipText>}
                position="bottom"
              >
                <button
                  type="button"
                  onClick={() => updateConfig('audioCodec', codec.id)}
                  className={`relative w-full rounded-lg border px-3 py-2 text-sm transition ${
                    config.audioCodec === codec.id
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {codec.label}
                  {isRecommended && config.audioCodec !== codec.id && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[8px] text-white">
                      ★
                    </span>
                  )}
                </button>
              </Tooltip>
            )
          })}
        </div>
      </SettingGroup>

      {/* Audio Bitrate */}
      {config.audioCodec !== 'copy' && config.audioCodec !== 'none' && config.audioCodec !== 'flac' && (
        <SettingGroup
          label="Audio Bitrate"
          tooltip={
            <>
              <TooltipHeading>Audio Bitrate</TooltipHeading>
              <TooltipText>
                Higher bitrate = better audio quality. 192kbps is transparent for most listeners. 128kbps is fine for speech.
              </TooltipText>
            </>
          }
        >
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="64"
              max="320"
              step="32"
              value={config.audioBitrate}
              onChange={(e) => updateConfig('audioBitrate', parseInt(e.target.value))}
              className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-slate-200"
            />
            <span className="w-16 text-right font-mono text-sm font-medium text-slate-900">
              {config.audioBitrate}kbps
            </span>
          </div>
          <div className="mt-2 flex justify-between text-xs text-slate-400">
            <span>Lower quality</span>
            <span>Higher quality</span>
          </div>
        </SettingGroup>
      )}

      {/* Audio Channels */}
      <SettingGroup
        label="Channels"
        tooltip={
          <>
            <TooltipHeading>Audio Channels</TooltipHeading>
            <TooltipText>
              Stereo is standard for most content. Mono halves file size for voice-only content.
            </TooltipText>
          </>
        }
      >
        <div className="grid grid-cols-4 gap-2">
          {(['stereo', 'mono', '5.1', 'copy'] as const).map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => updateConfig('audioChannels', ch)}
              className={`rounded-lg border px-3 py-2 text-sm capitalize transition ${
                config.audioChannels === ch
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              {ch}
            </button>
          ))}
        </div>
      </SettingGroup>

      {/* Normalize Audio */}
      <SettingGroup
        label="Normalize Audio"
        tooltip={
          <>
            <TooltipHeading>Audio Normalization</TooltipHeading>
            <TooltipText>
              Automatically adjusts volume to a consistent level. Useful for videos with varying audio levels.
            </TooltipText>
          </>
        }
      >
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={config.normalizeAudio}
            onChange={(e) => updateConfig('normalizeAudio', e.target.checked)}
            className="h-5 w-5 rounded border-slate-300"
          />
          <span className="text-sm text-slate-700">Enable loudness normalization (EBU R128)</span>
        </label>
      </SettingGroup>
    </div>
  )
}

// ============================================================================
// FILTERS TAB
// ============================================================================
function FiltersTab({
  filters,
  updateFilters
}: {
  filters: typeof DEFAULT_FILTERS
  updateFilters: <K extends keyof typeof DEFAULT_FILTERS>(key: K, value: typeof DEFAULT_FILTERS[K]) => void
}): JSX.Element {
  return (
    <div className="space-y-6">
      {/* Deinterlace */}
      <SettingGroup
        label="Deinterlace"
        tooltip={
          <>
            <TooltipHeading>Deinterlacing</TooltipHeading>
            <TooltipText>
              Removes interlacing artifacts from old TV/video content. Only enable if you see horizontal lines or combing.
            </TooltipText>
          </>
        }
      >
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={filters.deinterlace}
            onChange={(e) => updateFilters('deinterlace', e.target.checked)}
            className="h-5 w-5 rounded border-slate-300"
          />
          <span className="text-sm text-slate-700">Enable deinterlacing (yadif filter)</span>
        </label>
      </SettingGroup>

      {/* Denoise */}
      <SettingGroup
        label="Denoise"
        tooltip={
          <>
            <TooltipHeading>Noise Reduction</TooltipHeading>
            <TooltipText>
              Reduces grain and noise in video. Can improve compression but may remove fine detail. Use sparingly.
            </TooltipText>
          </>
        }
      >
        <div className="grid grid-cols-4 gap-2">
          {(['none', 'light', 'medium', 'heavy'] as DenoiseLevel[]).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => updateFilters('denoise', level)}
              className={`rounded-lg border px-3 py-2 text-sm capitalize transition ${
                filters.denoise === level
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </SettingGroup>

      {/* Sharpen */}
      <SettingGroup
        label="Sharpen"
        tooltip={
          <>
            <TooltipHeading>Sharpening</TooltipHeading>
            <TooltipText>
              Enhances edge definition. Useful after scaling down or for soft source material. Over-sharpening creates halos.
            </TooltipText>
          </>
        }
      >
        <div className="grid grid-cols-4 gap-2">
          {(['none', 'light', 'medium', 'strong'] as SharpenLevel[]).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => updateFilters('sharpen', level)}
              className={`rounded-lg border px-3 py-2 text-sm capitalize transition ${
                filters.sharpen === level
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </SettingGroup>

      {/* Color Adjustments */}
      <SettingGroup
        label="Color Adjustments"
        tooltip={
          <>
            <TooltipHeading>Color Correction</TooltipHeading>
            <TooltipText>
              Adjust brightness, contrast, saturation, and gamma. Use reset to return to original values.
            </TooltipText>
          </>
        }
      >
        <div className="space-y-4">
          <SliderSetting
            label="Brightness"
            value={filters.brightness}
            min={-1}
            max={1}
            step={0.05}
            defaultValue={0}
            onChange={(v) => updateFilters('brightness', v)}
          />
          <SliderSetting
            label="Contrast"
            value={filters.contrast}
            min={0.5}
            max={2}
            step={0.05}
            defaultValue={1}
            onChange={(v) => updateFilters('contrast', v)}
          />
          <SliderSetting
            label="Saturation"
            value={filters.saturation}
            min={0}
            max={2}
            step={0.05}
            defaultValue={1}
            onChange={(v) => updateFilters('saturation', v)}
          />
          <SliderSetting
            label="Gamma"
            value={filters.gamma}
            min={0.5}
            max={2}
            step={0.05}
            defaultValue={1}
            onChange={(v) => updateFilters('gamma', v)}
          />
        </div>
      </SettingGroup>

      {/* Speed */}
      <SettingGroup
        label="Playback Speed"
        tooltip={
          <>
            <TooltipHeading>Speed Adjustment</TooltipHeading>
            <TooltipText>
              Change video playback speed. Audio pitch is preserved. 0.5x = half speed, 2x = double speed.
            </TooltipText>
          </>
        }
      >
        <SliderSetting
          label="Speed"
          value={filters.speed}
          min={0.25}
          max={4}
          step={0.25}
          defaultValue={1}
          onChange={(v) => updateFilters('speed', v)}
          formatValue={(v) => `${v}x`}
        />
      </SettingGroup>
    </div>
  )
}

// ============================================================================
// OUTPUT TAB
// ============================================================================
function OutputTab({
  config,
  updateConfig,
  compatibleContainers,
  uiMode
}: {
  config: VideoEncodingConfig
  updateConfig: <K extends keyof VideoEncodingConfig>(key: K, value: VideoEncodingConfig[K]) => void
  compatibleContainers: typeof CONTAINER_FORMATS
  uiMode: UIMode
}): JSX.Element {
  // Check for container incompatibility
  const containerWarning = useMemo(() => {
    if (!isCodecContainerCompatible(config.videoCodec, config.container)) {
      const codecLabel = VIDEO_CODECS.find(c => c.id === config.videoCodec)?.label || config.videoCodec
      return `${codecLabel} may not work correctly in .${config.container} files. Consider using a compatible container.`
    }
    return null
  }, [config.videoCodec, config.container])

  return (
    <div className="space-y-6">
      {/* Container Warning */}
      {containerWarning && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm text-amber-800">{containerWarning}</p>
        </div>
      )}

      {/* Container Format */}
      <SettingGroup
        label="Container Format"
        tooltip={
          <>
            <TooltipHeading>Container Format</TooltipHeading>
            <TooltipText>
              The file format that wraps the video and audio streams. MP4 is most compatible. MKV supports more features.
            </TooltipText>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-2">
          {compatibleContainers.map((container) => {
            const isRecommended = container.id === RECOMMENDED.container
            const isIncompatible = !isCodecContainerCompatible(config.videoCodec, container.id)
            return (
              <Tooltip
                key={container.id}
                content={
                  <>
                    <TooltipHeading>{container.label}</TooltipHeading>
                    <TooltipText>{container.description}</TooltipText>
                    <TooltipList items={container.features} type="neutral" />
                    <p className="mt-2 text-xs text-blue-400">{container.compatibility}</p>
                    {isIncompatible && (
                      <p className="mt-1 text-xs text-red-400">Not recommended with {config.videoCodec}</p>
                    )}
                  </>
                }
                position="bottom"
                maxWidth={300}
              >
                <button
                  type="button"
                  onClick={() => updateConfig('container', container.id)}
                  className={`relative w-full rounded-lg border px-3 py-2 text-sm transition ${
                    config.container === container.id
                      ? isIncompatible
                        ? 'border-amber-500 bg-amber-500 text-white'
                        : 'border-slate-900 bg-slate-900 text-white'
                      : isIncompatible
                        ? 'border-amber-200 bg-amber-50 text-amber-700'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  .{container.id}
                  <span className={`ml-1 text-xs ${
                    config.container === container.id ? 'text-slate-300' : 'text-slate-400'
                  }`}>
                    {container.label}
                  </span>
                  {isRecommended && config.container !== container.id && !isIncompatible && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[8px] text-white">
                      ★
                    </span>
                  )}
                  {isIncompatible && config.container !== container.id && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[8px] text-white">
                      !
                    </span>
                  )}
                </button>
              </Tooltip>
            )
          })}
        </div>
      </SettingGroup>

      {/* Fast Start */}
      {config.container === 'mp4' && (
        <SettingGroup
          label="Web Optimization"
          tooltip={
            <>
              <TooltipHeading>Fast Start (moov atom)</TooltipHeading>
              <TooltipText>
                Moves metadata to the beginning of the file, allowing videos to start playing before fully downloaded. Essential for web streaming.
              </TooltipText>
            </>
          }
        >
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={config.fastStart}
              onChange={(e) => updateConfig('fastStart', e.target.checked)}
              className="h-5 w-5 rounded border-slate-300"
            />
            <span className="text-sm text-slate-700">Enable fast start for web streaming</span>
            <RecommendedBadge />
          </label>
        </SettingGroup>
      )}

      {/* Audio Settings in Simple Mode */}
      {uiMode === 'simple' && (
        <>
          <SettingGroup
            label="Audio"
            tooltip={
              <>
                <TooltipHeading>Audio Settings</TooltipHeading>
                <TooltipText>
                  Configure audio codec and quality. AAC is recommended for maximum compatibility.
                </TooltipText>
              </>
            }
          >
            <div className="flex items-center gap-4">
              <select
                value={config.audioCodec}
                onChange={(e) => updateConfig('audioCodec', e.target.value as AudioCodec)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {AUDIO_CODECS.map((codec) => (
                  <option key={codec.id} value={codec.id}>
                    {codec.label} {codec.id === RECOMMENDED.audioCodec ? '(Recommended)' : ''}
                  </option>
                ))}
              </select>

              {config.audioCodec !== 'copy' && config.audioCodec !== 'none' && config.audioCodec !== 'flac' && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">Quality:</span>
                  <select
                    value={config.audioBitrate}
                    onChange={(e) => updateConfig('audioBitrate', parseInt(e.target.value))}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
                  >
                    <option value="128">128 kbps (Good)</option>
                    <option value="192">192 kbps (High)</option>
                    <option value="256">256 kbps (Very High)</option>
                    <option value="320">320 kbps (Maximum)</option>
                  </select>
                </div>
              )}
            </div>
          </SettingGroup>
        </>
      )}
    </div>
  )
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================
function SettingGroup({
  label,
  tooltip,
  children
}: {
  label: string
  tooltip: React.ReactNode
  children: React.ReactNode
}): JSX.Element {
  return (
    <div>
      <div className="mb-2 flex items-center">
        <label className="text-sm font-medium text-slate-900">{label}</label>
        <InfoTooltip content={tooltip} />
      </div>
      {children}
    </div>
  )
}

function SliderSetting({
  label,
  value,
  min,
  max,
  step,
  defaultValue,
  onChange,
  formatValue
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  defaultValue: number
  onChange: (value: number) => void
  formatValue?: (value: number) => string
}): JSX.Element {
  const displayValue = formatValue ? formatValue(value) : value.toFixed(2)
  const isDefault = Math.abs(value - defaultValue) < 0.001

  return (
    <div className="flex items-center gap-4">
      <span className="w-24 text-sm text-slate-600">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-slate-200"
      />
      <span className="w-14 text-right font-mono text-sm text-slate-900">{displayValue}</span>
      {!isDefault && (
        <button
          type="button"
          onClick={() => onChange(defaultValue)}
          className="text-xs text-slate-400 hover:text-slate-600"
        >
          Reset
        </button>
      )}
    </div>
  )
}
