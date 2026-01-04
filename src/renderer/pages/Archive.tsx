import { useEffect, useState, useCallback } from 'react'
import type {
  ArchivalBatchJob,
  ArchivalEncodingConfigFull,
  ArchivalEncoderInfo,
  ArchivalProgressEvent,
  ArchivalVideoSourceInfo
} from '../../preload/api'
import type { ArchivalQueueState } from '../../shared/types/archival.types'
import {
  ARCHIVAL_PRESETS,
  ARCHIVAL_CRF_DEFAULTS,
  hasDolbyVision,
  formatEta,
  formatSpeed,
  getErrorMessage,
  getResolutionCategory,
  getBitrateAdjustedCrf,
  estimateEncodingTime,
  formatEstimatedTime,
  type ArchivalPreset,
  type ArchivalErrorType,
  type ArchivalCodec,
  type ArchivalResolution,
  type Av1Encoder,
  type H265Encoder
} from '../../shared/types/archival.types'

type PartialConfig = Partial<Omit<ArchivalEncodingConfigFull, 'outputDir'>>

const RESOLUTION_OPTIONS = [
  { value: 'source', label: 'Source (no change)' },
  { value: '4k', label: '4K (2160p)' },
  { value: '1440p', label: '1440p' },
  { value: '1080p', label: '1080p' },
  { value: '720p', label: '720p' },
  { value: '480p', label: '480p' },
  { value: '360p', label: '360p' }
]

const CONTAINER_OPTIONS = [
  { value: 'mkv', label: 'MKV (recommended)' },
  { value: 'mp4', label: 'MP4' },
  { value: 'webm', label: 'WebM' }
]

const CODEC_OPTIONS: { value: ArchivalCodec; label: string; description: string }[] = [
  {
    value: 'av1',
    label: 'AV1',
    description: 'Best compression for archival. Smaller files, longer encoding.'
  },
  {
    value: 'h265',
    label: 'H.265 (HEVC)',
    description: 'Better compatibility for web delivery. Faster encoding, wider device support.'
  }
]

const H265_PRESET_OPTIONS = [
  { value: 'ultrafast', label: 'Ultrafast' },
  { value: 'superfast', label: 'Superfast' },
  { value: 'veryfast', label: 'Very Fast' },
  { value: 'faster', label: 'Faster' },
  { value: 'fast', label: 'Fast' },
  { value: 'medium', label: 'Medium (recommended)' },
  { value: 'slow', label: 'Slow' },
  { value: 'slower', label: 'Slower' },
  { value: 'veryslow', label: 'Very Slow' }
]

const PRESET_OPTIONS: { value: ArchivalPreset; label: string; description: string }[] = [
  {
    value: 'archive',
    label: 'Archive (Recommended)',
    description: 'Balanced quality and speed. Preset 6, good for most content.'
  },
  {
    value: 'max-compression',
    label: 'Max Compression',
    description: 'Slower encoding, ~3-5% smaller files. Preset 4.'
  },
  {
    value: 'fast',
    label: 'Fast',
    description: 'Faster encoding, slightly larger files. Preset 8.'
  }
]

export default function Archive(): JSX.Element {
  const [inputPaths, setInputPaths] = useState<string[]>([])
  const [outputDir, setOutputDir] = useState<string | null>(null)
  const [config, setConfig] = useState<PartialConfig>({})
  const [defaultConfig, setDefaultConfig] = useState<PartialConfig | null>(null)
  const [encoderInfo, setEncoderInfo] = useState<ArchivalEncoderInfo | null>(null)
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [upgradeProgress, setUpgradeProgress] = useState<string | null>(null)
  const [currentJob, setCurrentJob] = useState<ArchivalBatchJob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [previewCommand, setPreviewCommand] = useState<string[] | null>(null)
  const [sourceInfo, setSourceInfo] = useState<ArchivalVideoSourceInfo | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<ArchivalPreset>('archive')
  const [isDolbyVision, setIsDolbyVision] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  // ETA tracking state
  const [batchEta, setBatchEta] = useState<number | undefined>(undefined)
  const [batchSpeed, setBatchSpeed] = useState<number | undefined>(undefined)
  const [batchProgress, setBatchProgress] = useState<number>(0)
  // Folder selection state
  const [folderPath, setFolderPath] = useState<string | null>(null)
  const [fileInfos, setFileInfos] = useState<Array<{ absolutePath: string; relativePath: string }>>([])
  // Batch info state
  const [batchInfo, setBatchInfo] = useState<{
    totalDurationSeconds?: number
    totalInputBytes?: number
    estimatedOutputBytes?: number
    availableBytes?: number
    hasEnoughSpace?: boolean
    existingCount?: number
  } | null>(null)
  const [isLoadingBatchInfo, setIsLoadingBatchInfo] = useState(false)
  // Whisper provider settings for caption extraction
  const [whisperProvider, setWhisperProvider] = useState<'bundled' | 'lmstudio'>('bundled')
  const [lmstudioEndpoint, setLmstudioEndpoint] = useState('http://localhost:1234/v1/audio/transcriptions')
  // Whisper GPU acceleration settings
  const [whisperGpuEnabled, setWhisperGpuEnabled] = useState(false)
  const [whisperGpuAvailable, setWhisperGpuAvailable] = useState(false)
  const [whisperGpuType, setWhisperGpuType] = useState<'metal' | 'none'>('none')
  const [whisperGpuReason, setWhisperGpuReason] = useState<string | undefined>()
  // Queue pause/resume state
  const [queueState, setQueueState] = useState<ArchivalQueueState>('pending')
  const [isPauseLoading, setIsPauseLoading] = useState(false)
  // Recovery state
  const [showRecoveryModal, setShowRecoveryModal] = useState(false)
  const [recoveryInfo, setRecoveryInfo] = useState<{
    jobId: string
    totalItems: number
    completedItems: number
    failedItems: number
    savedAt: string
  } | null>(null)
  const [isRecovering, setIsRecovering] = useState(false)

  // Load default config and encoder info on mount
  useEffect(() => {
    let active = true

    Promise.all([
      window.api.archivalGetDefaultConfig(),
      window.api.archivalDetectEncoders(),
      window.api.archivalGetStatus(),
      window.api.getWhisperProvider(),
      window.api.getWhisperGpuSettings(),
      window.api.archivalCheckRecovery(),
      window.api.archivalGetPauseState()
    ]).then(([configResult, encoderResult, statusResult, whisperResult, gpuResult, recoveryResult, pauseResult]) => {
      if (!active) return
      // Load whisper provider settings
      if (whisperResult.ok) {
        if (whisperResult.provider) {
          setWhisperProvider(whisperResult.provider)
        }
        if (whisperResult.endpoint) {
          setLmstudioEndpoint(whisperResult.endpoint)
        }
      }
      // Load whisper GPU settings
      if (gpuResult.ok && gpuResult.settings) {
        setWhisperGpuEnabled(gpuResult.settings.enabled)
        setWhisperGpuAvailable(gpuResult.settings.available)
        setWhisperGpuType(gpuResult.settings.gpuType)
        setWhisperGpuReason(gpuResult.settings.reason)
      }
      if (configResult.ok) {
        setDefaultConfig(configResult.config)
        let initialConfig = { ...configResult.config }

        // Auto-select available codec if default (AV1) isn't available
        if (encoderResult.ok && encoderResult.encoderInfo) {
          const info = encoderResult.encoderInfo
          const defaultCodec = initialConfig.codec ?? 'av1'

          // If default codec isn't available, switch to available one
          if (defaultCodec === 'av1' && !info.hasAv1Support && info.hasH265Support) {
            initialConfig = {
              ...initialConfig,
              codec: 'h265',
              container: 'mp4',
              audioCodec: 'aac'
            }
          } else if (defaultCodec === 'h265' && !info.hasH265Support && info.hasAv1Support) {
            initialConfig = {
              ...initialConfig,
              codec: 'av1',
              container: 'mkv'
            }
          }
        }

        setConfig(initialConfig)
      }
      if (encoderResult.ok && encoderResult.encoderInfo) {
        setEncoderInfo(encoderResult.encoderInfo)
      }
      if (statusResult.ok && statusResult.job) {
        setCurrentJob(statusResult.job)
        // Set queue state based on job status
        if (statusResult.job.status === 'running') {
          setQueueState('running')
        }
      }
      // Check for crash recovery (only if no active job)
      if (!statusResult.job && recoveryResult.ok && recoveryResult.hasRecovery && recoveryResult.recoveryInfo) {
        setRecoveryInfo(recoveryResult.recoveryInfo)
        setShowRecoveryModal(true)
      }
      // Get current pause state
      if (pauseResult.ok && pauseResult.isPaused) {
        setQueueState('paused')
      }
    }).catch(() => {
      if (active) {
        setError('Failed to load archival configuration')
      }
    })

    return () => { active = false }
  }, [])

  // Subscribe to archival events
  useEffect(() => {
    const unsubscribe = window.api.onArchivalEvent((event: ArchivalProgressEvent) => {
      // Update ETA and speed from progress events
      if (event.kind === 'item_progress') {
        if (event.batchEtaSeconds !== undefined) {
          setBatchEta(event.batchEtaSeconds)
        }
        if (event.encodingSpeed !== undefined) {
          setBatchSpeed(event.encodingSpeed)
        }
        if (event.batchProgress !== undefined) {
          setBatchProgress(event.batchProgress)
        }
      }

      // Handle pause/resume events
      if (event.kind === 'queue_paused') {
        setQueueState('paused')
        setIsPauseLoading(false)
      }
      if (event.kind === 'queue_resumed') {
        setQueueState('running')
        setIsPauseLoading(false)
      }

      // Update queue state from event
      if (event.queueState) {
        setQueueState(event.queueState)
      }

      // Reset ETA when batch completes
      if (event.kind === 'batch_complete') {
        setBatchEta(undefined)
        setBatchSpeed(undefined)
        setBatchProgress(100)
        setQueueState('completed')
      }

      setCurrentJob((prev) => {
        if (!prev || prev.id !== event.batchId) return prev

        const updatedItems = prev.items.map((item) => {
          if (item.id !== event.itemId) return item

          return {
            ...item,
            status: event.status ?? item.status,
            progress: event.progress ?? item.progress,
            error: event.error ?? item.error,
            errorType: event.errorType ?? item.errorType,
            sourceInfo: event.sourceInfo ?? item.sourceInfo,
            effectiveCrf: event.effectiveCrf ?? item.effectiveCrf,
            outputSize: event.outputSize ?? item.outputSize,
            compressionRatio: event.compressionRatio ?? item.compressionRatio,
            encodingSpeed: event.encodingSpeed ?? item.encodingSpeed,
            etaSeconds: event.itemEtaSeconds ?? item.etaSeconds,
            elapsedSeconds: event.elapsedSeconds ?? item.elapsedSeconds
          }
        })

        let completedItems = prev.completedItems
        let failedItems = prev.failedItems
        let skippedItems = prev.skippedItems
        let status = prev.status

        if (event.kind === 'item_complete') {
          completedItems = updatedItems.filter((i) => i.status === 'completed').length
        }
        if (event.kind === 'item_error') {
          failedItems = updatedItems.filter((i) => i.status === 'failed').length
        }
        // Also count skipped items
        skippedItems = updatedItems.filter((i) => i.status === 'skipped').length

        if (event.kind === 'batch_complete') {
          // Check if any items were cancelled to determine final status
          const hasCancelled = updatedItems.some((i) => i.status === 'cancelled')
          status = hasCancelled ? 'cancelled' : 'completed'
        }

        return {
          ...prev,
          items: updatedItems,
          completedItems,
          failedItems,
          skippedItems,
          status,
          batchEtaSeconds: event.batchEtaSeconds ?? prev.batchEtaSeconds,
          averageSpeed: event.encodingSpeed ?? prev.averageSpeed
        }
      })
    })

    const unsubUpgrade = window.api.onArchivalUpgradeProgress((progress) => {
      if (progress.stage === 'complete') {
        setIsUpgrading(false)
        setUpgradeProgress(null)
        // Refresh encoder info
        window.api.archivalDetectEncoders().then((result) => {
          if (result.ok && result.encoderInfo) {
            setEncoderInfo(result.encoderInfo)
          }
        })
      } else if (progress.stage === 'error') {
        setIsUpgrading(false)
        setUpgradeProgress(`Error: ${progress.error}`)
      } else {
        setUpgradeProgress(`${progress.stage}${progress.progress ? ` (${progress.progress}%)` : ''}`)
      }
    })

    return () => {
      unsubscribe()
      unsubUpgrade()
    }
  }, [])

  // Update preview command when config or input changes
  useEffect(() => {
    if (inputPaths.length === 0 || !outputDir) {
      setPreviewCommand(null)
      return
    }

    const timeoutId = setTimeout(() => {
      window.api.archivalPreviewCommand({
        inputPath: inputPaths[0],
        outputDir,
        config
      }).then((result) => {
        if (result.ok && result.command) {
          setPreviewCommand(result.command)
        }
      }).catch(() => {
        setPreviewCommand(null)
      })
    }, 200)

    return () => clearTimeout(timeoutId)
  }, [inputPaths, outputDir, config])

  // Fetch batch info when inputs and output are set
  useEffect(() => {
    if (inputPaths.length === 0 || !outputDir) {
      setBatchInfo(null)
      return
    }

    let active = true
    setIsLoadingBatchInfo(true)

    const timeoutId = setTimeout(() => {
      window.api.archivalGetBatchInfo({
        inputPaths,
        outputDir
      }).then((result) => {
        if (!active) return
        if (result.ok) {
          setBatchInfo({
            totalDurationSeconds: result.totalDurationSeconds,
            totalInputBytes: result.totalInputBytes,
            estimatedOutputBytes: result.estimatedOutputBytes,
            availableBytes: result.availableBytes,
            hasEnoughSpace: result.hasEnoughSpace,
            existingCount: result.existingCount
          })
        }
        setIsLoadingBatchInfo(false)
      }).catch(() => {
        if (active) {
          setBatchInfo(null)
          setIsLoadingBatchInfo(false)
        }
      })
    }, 300)

    return () => {
      active = false
      clearTimeout(timeoutId)
    }
  }, [inputPaths, outputDir])

  const handleSelectFiles = async (): Promise<void> => {
    try {
      const result = await window.api.archivalSelectFiles()
      if (result.ok && result.paths) {
        setInputPaths(result.paths)
        setError(null)
        setIsDolbyVision(false)
        // Clear folder selection state when selecting individual files
        setFolderPath(null)
        setFileInfos([])
        setConfig((prev) => ({ ...prev, preserveStructure: false }))

        // Analyze first file for source info
        if (result.paths.length > 0) {
          setIsAnalyzing(true)
          const analyzeResult = await window.api.archivalAnalyzeVideo(result.paths[0])
          if (analyzeResult.ok && analyzeResult.sourceInfo) {
            setSourceInfo(analyzeResult.sourceInfo)
            // Check for Dolby Vision
            if (hasDolbyVision(analyzeResult.sourceInfo.hdrFormat)) {
              setIsDolbyVision(true)
            }
          }
          setIsAnalyzing(false)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select files')
    }
  }

  const handleSelectFolder = async (): Promise<void> => {
    try {
      const result = await window.api.archivalSelectFolder()
      if (result.ok && result.paths && result.fileInfo) {
        setInputPaths(result.paths)
        setFolderPath(result.folderPath ?? null)
        setFileInfos(result.fileInfo)
        setError(null)
        setIsDolbyVision(false)

        // Enable structure preservation when selecting a folder
        setConfig((prev) => ({ ...prev, preserveStructure: true }))

        // Analyze first file for source info
        if (result.paths.length > 0) {
          setIsAnalyzing(true)
          const analyzeResult = await window.api.archivalAnalyzeVideo(result.paths[0])
          if (analyzeResult.ok && analyzeResult.sourceInfo) {
            setSourceInfo(analyzeResult.sourceInfo)
            if (hasDolbyVision(analyzeResult.sourceInfo.hdrFormat)) {
              setIsDolbyVision(true)
            }
          }
          setIsAnalyzing(false)
        }
      } else if (result.error) {
        setError(result.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select folder')
    }
  }

  const handlePresetChange = (preset: ArchivalPreset): void => {
    setSelectedPreset(preset)
    const presetConfig = ARCHIVAL_PRESETS[preset]
    setConfig((prev) => ({
      ...prev,
      ...presetConfig
    }))
  }

  const handleSelectOutputDir = async (): Promise<void> => {
    try {
      const result = await window.api.archivalSelectOutputDir()
      if (result.ok && result.path) {
        setOutputDir(result.path)
        setError(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select output directory')
    }
  }

  const handleStartBatch = async (): Promise<void> => {
    if (inputPaths.length === 0) {
      setError('Select files to archive')
      return
    }
    if (!outputDir) {
      setError('Select an output directory')
      return
    }

    setIsStarting(true)
    setError(null)

    try {
      const result = await window.api.archivalStartBatch({
        inputPaths,
        outputDir,
        config,
        folderRoot: folderPath ?? undefined,
        relativePaths: fileInfos.length > 0 ? fileInfos.map(f => f.relativePath) : undefined
      })

      if (!result.ok) {
        setError(result.error ?? 'Failed to start batch')
        return
      }

      if (result.job) {
        setCurrentJob(result.job)
        setQueueState('running')
        // Clear inputs after starting
        setInputPaths([])
        setSourceInfo(null)
        setFolderPath(null)
        setFileInfos([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start batch')
    } finally {
      setIsStarting(false)
    }
  }

  const handleCancel = async (): Promise<void> => {
    try {
      await window.api.archivalCancel()
      setQueueState('cancelled')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel')
    }
  }

  const handlePause = async (): Promise<void> => {
    setIsPauseLoading(true)
    try {
      const result = await window.api.archivalPause()
      if (!result.ok) {
        setError(result.error ?? 'Failed to pause')
        setIsPauseLoading(false)
      }
      // State will be updated via event
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pause')
      setIsPauseLoading(false)
    }
  }

  const handleResume = async (): Promise<void> => {
    setIsPauseLoading(true)
    try {
      const result = await window.api.archivalResume()
      if (!result.ok) {
        setError(result.error ?? 'Failed to resume')
        setIsPauseLoading(false)
      }
      // State will be updated via event
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume')
      setIsPauseLoading(false)
    }
  }

  const handleResumeRecovery = async (): Promise<void> => {
    setIsRecovering(true)
    try {
      const result = await window.api.archivalResumeRecovery()
      if (result.ok && result.job) {
        setCurrentJob(result.job)
        setQueueState('running')
        setShowRecoveryModal(false)
        setRecoveryInfo(null)
      } else {
        setError(result.error ?? 'Failed to resume recovery')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume recovery')
    } finally {
      setIsRecovering(false)
    }
  }

  const handleDiscardRecovery = async (): Promise<void> => {
    setIsRecovering(true)
    try {
      const result = await window.api.archivalDiscardRecovery()
      if (result.ok) {
        setShowRecoveryModal(false)
        setRecoveryInfo(null)
      } else {
        setError(result.error ?? 'Failed to discard recovery')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to discard recovery')
    } finally {
      setIsRecovering(false)
    }
  }

  const handleUpgradeFFmpeg = async (): Promise<void> => {
    setIsUpgrading(true)
    setUpgradeProgress('Starting...')
    try {
      await window.api.archivalUpgradeFFmpeg()
    } catch (err) {
      setIsUpgrading(false)
      setUpgradeProgress(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const handleConfigChange = useCallback(<K extends keyof PartialConfig>(key: K, value: PartialConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleFillModeChange = useCallback((enabled: boolean) => {
    setConfig((prev) => ({
      ...prev,
      fillMode: enabled,
      ...(enabled ? { overwriteExisting: false } : {})
    }))
  }, [])

  const handleAv1Change = useCallback(<K extends keyof NonNullable<PartialConfig['av1']>>(
    key: K,
    value: NonNullable<PartialConfig['av1']>[K]
  ) => {
    setConfig((prev) => ({
      ...prev,
      av1: { ...prev.av1, [key]: value } as PartialConfig['av1']
    }))
  }, [])

  const handleH265Change = useCallback(<K extends keyof NonNullable<PartialConfig['h265']>>(
    key: K,
    value: NonNullable<PartialConfig['h265']>[K]
  ) => {
    setConfig((prev) => ({
      ...prev,
      h265: { ...prev.h265, [key]: value } as PartialConfig['h265']
    }))
  }, [])

  const handleCodecChange = useCallback((codec: ArchivalCodec) => {
    setConfig((prev) => {
      const newConfig = { ...prev, codec }
      // Adjust container based on codec for optimal compatibility
      if (codec === 'h265') {
        // H.265 is typically delivered in MP4 for web
        // Also switch from WebM if selected (not compatible with H.265)
        if (prev.container === 'webm' || !prev.container) {
          newConfig.container = 'mp4'
        }
        newConfig.audioCodec = 'aac'
      } else {
        // AV1 works best in MKV, but keep MP4/WebM if already selected
        if (!prev.container) {
          newConfig.container = 'mkv'
        }
      }
      return newConfig
    })
  }, [])

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }

  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    }
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  const formatVideoCodec = (codec?: string): string => {
    if (!codec) return 'Unknown'
    const codecMap: Record<string, string> = {
      'h264': 'H.264',
      'hevc': 'HEVC',
      'h265': 'H.265',
      'vp9': 'VP9',
      'av1': 'AV1',
      'mpeg4': 'MPEG-4',
      'prores': 'ProRes',
      'dnxhd': 'DNxHD',
      'vp8': 'VP8',
      'mjpeg': 'MJPEG'
    }
    return codecMap[codec.toLowerCase()] ?? codec.toUpperCase()
  }

  const formatAudioCodec = (codec?: string): string => {
    if (!codec) return ''
    const codecMap: Record<string, string> = {
      'aac': 'AAC',
      'mp3': 'MP3',
      'opus': 'Opus',
      'vorbis': 'Vorbis',
      'flac': 'FLAC',
      'alac': 'ALAC',
      'ac3': 'AC3',
      'eac3': 'E-AC3',
      'dts': 'DTS',
      'pcm_s16le': 'PCM',
      'pcm_s24le': 'PCM',
      'pcm_s32le': 'PCM',
      'pcm_f32le': 'PCM',
      'pcm_s16be': 'PCM',
      'pcm_s24be': 'PCM',
      'pcm_s32be': 'PCM'
    }
    // Handle PCM variants
    if (codec.toLowerCase().startsWith('pcm_')) {
      return 'PCM'
    }
    return codecMap[codec.toLowerCase()] ?? codec.toUpperCase()
  }

  const isPcmAudio = (codec?: string): boolean => {
    if (!codec) return false
    return codec.toLowerCase().startsWith('pcm_')
  }

  const formatResolution = (width?: number, height?: number): string => {
    if (!width || !height) return ''
    // Common resolution names
    const maxDim = Math.max(width, height)
    if (maxDim >= 3840) return `${width}×${height} (4K)`
    if (maxDim >= 2560) return `${width}×${height} (1440p)`
    if (maxDim >= 1920) return `${width}×${height} (1080p)`
    if (maxDim >= 1280) return `${width}×${height} (720p)`
    return `${width}×${height}`
  }

  const statusTone = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-700'
      case 'encoding':
      case 'analyzing':
        return 'bg-blue-100 text-blue-700'
      case 'failed':
        return 'bg-rose-100 text-rose-700'
      case 'cancelled':
      case 'skipped':
        return 'bg-slate-100 text-slate-500'
      case 'queued':
      default:
        return 'bg-amber-100 text-amber-700'
    }
  }

  const overallProgress = currentJob && currentJob.totalItems > 0
    ? Math.round(((currentJob.completedItems + currentJob.failedItems + currentJob.skippedItems) / currentJob.totalItems) * 100)
    : 0

  return (
    <div className="flex flex-col gap-6">
      {/* Encoder Status Banner */}
      {encoderInfo && (
        <section className={`rounded-2xl border p-4 ${(encoderInfo.hasAv1Support || encoderInfo.hasH265Support) ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${encoderInfo.hasAv1Support ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'}`}>
                  {encoderInfo.hasAv1Support ? 'AV1 Ready' : 'AV1 Not Available'}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${encoderInfo.hasH265Support ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'}`}>
                  {encoderInfo.hasH265Support ? 'H.265 Ready' : 'H.265 Not Available'}
                </span>
                {encoderInfo.recommended && (
                  <span className="text-xs text-slate-500">
                    AV1: {encoderInfo.recommended}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-600">
                {encoderInfo.hasAv1Support && encoderInfo.hasH265Support
                  ? `Available: AV1 (${encoderInfo.available.join(', ')}), H.265 (${encoderInfo.h265Available.join(', ')})`
                  : encoderInfo.hasH265Support
                    ? `H.265 available (${encoderInfo.h265Available.join(', ')}). Upgrade FFmpeg for AV1 support.`
                    : 'Upgrade FFmpeg to enable AV1 encoding for optimal archival quality.'}
              </p>
            </div>
            {encoderInfo.canUpgrade && (
              <button
                type="button"
                onClick={() => void handleUpgradeFFmpeg()}
                disabled={isUpgrading}
                className="rounded-full bg-amber-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white disabled:opacity-50"
              >
                {isUpgrading ? upgradeProgress : 'Upgrade FFmpeg'}
              </button>
            )}
          </div>
        </section>
      )}

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Selection */}
        <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Select Files</h3>
          <p className="mt-1 text-sm text-slate-500">
            Choose video files to encode. Use AV1 for archival or H.265 for web delivery.
          </p>

          <div className="mt-5 space-y-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Input files</p>
              <p className="mt-2 text-sm text-slate-600">
                {inputPaths.length === 0
                  ? 'No files selected'
                  : `${inputPaths.length} file${inputPaths.length === 1 ? '' : 's'} selected`}
              </p>
              {inputPaths.length > 0 && (
                <div className="mt-2 max-h-32 space-y-1 overflow-y-auto text-xs text-slate-500">
                  {inputPaths.slice(0, 5).map((path) => (
                    <p key={path} className="truncate">{path}</p>
                  ))}
                  {inputPaths.length > 5 && (
                    <p className="text-slate-400">+{inputPaths.length - 5} more</p>
                  )}
                </div>
              )}
              {inputPaths.length > 100 && (
                <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  <span className="font-medium">Large batch:</span> {inputPaths.length} files selected.
                  This may take a while to process.
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void handleSelectFiles()}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  {inputPaths.length > 0 ? 'Change files' : 'Select files'}
                </button>
                <button
                  type="button"
                  onClick={() => void handleSelectFolder()}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  Select folder
                </button>
              </div>
              {folderPath && (
                <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                  <span>Folder: <span className="text-slate-600">{folderPath}</span></span>
                  <label className="flex cursor-pointer items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={config.preserveStructure ?? true}
                      onChange={(e) => handleConfigChange('preserveStructure', e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={config.preserveStructure ? 'text-blue-700' : 'text-slate-500'}>
                      Preserve folder structure
                    </span>
                  </label>
                </div>
              )}
            </div>

            {isAnalyzing && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyzing video...
              </div>
            )}

            {sourceInfo && (() => {
              // Compute CRF adjustment info
              const resolution = getResolutionCategory(sourceInfo.width, sourceInfo.height)
              const lookupRes = resolution === 'source' ? '1080p' : resolution
              const baseCrf = sourceInfo.isHdr
                ? ARCHIVAL_CRF_DEFAULTS.hdr[lookupRes as keyof typeof ARCHIVAL_CRF_DEFAULTS.hdr]
                : ARCHIVAL_CRF_DEFAULTS.sdr[lookupRes as keyof typeof ARCHIVAL_CRF_DEFAULTS.sdr]
              const crfInfo = sourceInfo.bitrate
                ? getBitrateAdjustedCrf({ ...sourceInfo, bitrate: sourceInfo.bitrate }, baseCrf)
                : null

              return (
                <div className="space-y-2">
                  <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    <span className="font-medium">Source:</span>{' '}
                    {sourceInfo.width}x{sourceInfo.height}{' '}
                    {sourceInfo.isHdr && <span className="rounded bg-violet-100 px-1 text-violet-700">HDR</span>}{' '}
                    {isDolbyVision && <span className="rounded bg-amber-100 px-1 text-amber-700">Dolby Vision</span>}{' '}
                    {Math.round(sourceInfo.frameRate)}fps{' '}
                    {sourceInfo.bitrate && (
                      <span className="text-slate-500">{(sourceInfo.bitrate / 1_000_000).toFixed(1)} Mbps </span>
                    )}
                    {formatDuration(sourceInfo.duration)}
                  </div>
                  {crfInfo && crfInfo.adjustment > 0 && (
                    <div className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs text-teal-700">
                      <span className="font-medium">CRF adjusted:</span>{' '}
                      {baseCrf} → {crfInfo.adjustedCrf} ({crfInfo.reason})
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Dolby Vision Warning */}
            {isDolbyVision && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                <div className="flex items-start gap-3">
                  <span className="text-lg">&#9888;</span>
                  <div>
                    <p className="font-semibold text-amber-800">Dolby Vision Detected</p>
                    <p className="mt-1 text-sm text-amber-700">
                      AV1 cannot preserve Dolby Vision metadata. The output will be HDR10/PQ instead.
                      Visual quality will be maintained, but Dolby Vision dynamic metadata will be lost.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Output directory</p>
              <p className="mt-2 truncate text-sm text-slate-600">
                {outputDir ?? 'No directory selected'}
              </p>
              <button
                type="button"
                onClick={() => void handleSelectOutputDir()}
                className="mt-3 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                {outputDir ? 'Change directory' : 'Select directory'}
              </button>
            </div>
          </div>
        </section>

        {/* Encoding Settings */}
        <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Encoding Settings</h3>
          <p className="mt-1 text-sm text-slate-500">
            Configure encoding parameters for video archival or web delivery.
          </p>

          <div className="mt-5 space-y-4">
            {/* Codec Selector */}
            <div className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Video Codec</span>
              <div className="grid gap-2 sm:grid-cols-2">
                {CODEC_OPTIONS.map((codec) => {
                  const isDisabled = codec.value === 'av1' ? !encoderInfo?.hasAv1Support : !encoderInfo?.hasH265Support
                  return (
                    <button
                      key={codec.value}
                      type="button"
                      onClick={() => handleCodecChange(codec.value)}
                      disabled={isDisabled}
                      className={`rounded-lg border px-4 py-3 text-left transition ${
                        config.codec === codec.value
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : isDisabled
                            ? 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <p className="text-sm font-medium">{codec.label}</p>
                      <p className={`mt-0.5 text-xs ${config.codec === codec.value ? 'text-slate-300' : isDisabled ? 'text-slate-400' : 'text-slate-500'}`}>
                        {isDisabled ? 'Encoder not available' : codec.description}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Preset Selector */}
            <div className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Encoding Preset</span>
              <div className="grid gap-2">
                {PRESET_OPTIONS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => handlePresetChange(preset.value)}
                    className={`rounded-lg border px-4 py-3 text-left transition ${
                      selectedPreset === preset.value
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <p className="text-sm font-medium">{preset.label}</p>
                    <p className={`mt-0.5 text-xs ${selectedPreset === preset.value ? 'text-slate-300' : 'text-slate-500'}`}>
                      {preset.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Output Format */}
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Output Format</span>
              <select
                value={config.container ?? 'mkv'}
                onChange={(e) => handleConfigChange('container', e.target.value as PartialConfig['container'])}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                {CONTAINER_OPTIONS
                  // Filter out WebM for H.265 (not supported)
                  .filter((opt) => !(config.codec === 'h265' && opt.value === 'webm'))
                  .map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                      {config.codec === 'h265' && opt.value === 'mp4' ? ' (recommended for H.265)' : ''}
                      {config.codec !== 'h265' && opt.value === 'mkv' ? ' (recommended for AV1)' : ''}
                    </option>
                  ))}
              </select>
            </label>

            {/* Advanced Settings Toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-4 py-2 text-left text-sm text-slate-600 hover:border-slate-300"
            >
              <span>Advanced Settings</span>
              <svg
                className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showAdvanced && (
              <div className="space-y-4 rounded-lg border border-slate-100 bg-slate-50 p-4">
                {/* Resolution */}
                <label className="block">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Resolution</span>
                  <select
                    value={config.resolution ?? 'source'}
                    onChange={(e) => handleConfigChange('resolution', e.target.value as PartialConfig['resolution'])}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    {RESOLUTION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>

                {/* AV1-specific settings */}
                {config.codec !== 'h265' && (
                  <>
                    {/* AV1 Encoder */}
                    {encoderInfo && encoderInfo.available.length > 0 && (
                      <label className="block">
                        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">AV1 Encoder</span>
                        <select
                          value={config.av1?.encoder ?? encoderInfo.recommended ?? 'libsvtav1'}
                          onChange={(e) => handleAv1Change('encoder', e.target.value as 'libaom-av1' | 'libsvtav1')}
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                        >
                          {encoderInfo.available.map((enc) => (
                            <option key={enc} value={enc}>
                              {enc} {enc === encoderInfo.recommended ? '(recommended)' : ''}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}

                    {/* AV1 CRF Quality */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Quality (CRF)</span>
                        <span className="text-sm font-semibold text-slate-700">{config.av1?.crf ?? 30}</span>
                      </div>
                      <input
                        type="range"
                        min={18}
                        max={45}
                        value={config.av1?.crf ?? 30}
                        onChange={(e) => handleAv1Change('crf', Number(e.target.value))}
                        className="mt-2 w-full accent-slate-900"
                      />
                      <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                        <span>Higher quality (24-28)</span>
                        <span>Smaller file (35+)</span>
                      </div>
                      {/* CRF quick presets */}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {[
                          { value: 26, label: 'High', desc: 'Near lossless' },
                          { value: 30, label: 'Recommended', desc: 'Best balance for archival' },
                          { value: 35, label: 'Medium', desc: 'Good compression' },
                          { value: 40, label: 'Small', desc: 'Maximum compression' }
                        ].map((preset) => (
                          <button
                            key={preset.value}
                            type="button"
                            onClick={() => handleAv1Change('crf', preset.value)}
                            className={`rounded px-2 py-1 text-[10px] transition ${
                              config.av1?.crf === preset.value
                                ? 'bg-slate-700 text-white'
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            }`}
                            title={preset.desc}
                          >
                            {preset.label} ({preset.value})
                          </button>
                        ))}
                      </div>
                      <p className="mt-2 text-[10px] text-slate-400">
                        <strong>Tip:</strong> AV1 CRF 30 is excellent for archival. Auto-adjusted based on resolution and HDR.
                      </p>
                    </div>

                    {/* AV1 Preset Speed */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Speed Preset</span>
                        <span className="text-sm font-semibold text-slate-700">{config.av1?.preset ?? 6}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={12}
                        value={config.av1?.preset ?? 6}
                        onChange={(e) => handleAv1Change('preset', Number(e.target.value))}
                        className="mt-2 w-full accent-slate-900"
                      />
                      <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                        <span>Slower (better)</span>
                        <span>Faster</span>
                      </div>
                    </div>

                    {/* Film Grain Synthesis */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Film Grain</span>
                        <span className="text-sm font-semibold text-slate-700">
                          {config.av1?.filmGrainSynthesis === 0 ? 'Off' : config.av1?.filmGrainSynthesis ?? 10}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={20}
                        value={config.av1?.filmGrainSynthesis ?? 10}
                        onChange={(e) => handleAv1Change('filmGrainSynthesis', Number(e.target.value))}
                        className="mt-2 w-full accent-slate-900"
                      />
                      <p className="mt-1 text-[10px] text-slate-400">
                        Synthesizes grain for better compression. Disable (0) for screen recordings.
                      </p>
                    </div>

                    {/* Two-Pass Encoding (libaom-av1 only) */}
                    {config.av1?.encoder === 'libaom-av1' && (
                      <div className="rounded-lg border border-slate-200 bg-white p-3">
                        <label className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={config.av1?.twoPass ?? false}
                            onChange={(e) => handleAv1Change('twoPass', e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600"
                          />
                          <div>
                            <span className="text-sm font-medium text-slate-700">Two-Pass Encoding</span>
                            <p className="text-xs text-slate-400">
                              Better quality/size efficiency. Takes ~2x longer.
                            </p>
                          </div>
                        </label>
                      </div>
                    )}
                  </>
                )}

                {/* H.265-specific settings */}
                {config.codec === 'h265' && (
                  <>
                    {/* H.265 Preset */}
                    <label className="block">
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">H.265 Preset</span>
                      <select
                        value={config.h265?.preset ?? 'medium'}
                        onChange={(e) => handleH265Change('preset', e.target.value as PartialConfig['h265'] extends { preset: infer P } ? P : never)}
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                      >
                        {H265_PRESET_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </label>

                    {/* H.265 CRF Quality */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Quality (CRF)</span>
                        <span className="text-sm font-semibold text-slate-700">{config.h265?.crf ?? 23}</span>
                      </div>
                      <input
                        type="range"
                        min={18}
                        max={35}
                        value={config.h265?.crf ?? 23}
                        onChange={(e) => handleH265Change('crf', Number(e.target.value))}
                        className="mt-2 w-full accent-slate-900"
                      />
                      <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                        <span>Higher quality (18-22)</span>
                        <span>Smaller file (28+)</span>
                      </div>
                      {/* CRF quick presets */}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {[
                          { value: 20, label: 'High', desc: 'Near lossless' },
                          { value: 23, label: 'Recommended', desc: 'Best balance' },
                          { value: 26, label: 'Medium', desc: 'Good quality' },
                          { value: 28, label: 'Small', desc: 'Web optimized' }
                        ].map((preset) => (
                          <button
                            key={preset.value}
                            type="button"
                            onClick={() => handleH265Change('crf', preset.value)}
                            className={`rounded px-2 py-1 text-[10px] transition ${
                              config.h265?.crf === preset.value
                                ? 'bg-slate-700 text-white'
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            }`}
                            title={preset.desc}
                          >
                            {preset.label} ({preset.value})
                          </button>
                        ))}
                      </div>
                      <p className="mt-2 text-[10px] text-slate-400">
                        <strong>Tip:</strong> CRF 23 is ideal for web delivery. Use 20-22 for high quality archival, 26-28 for smaller files.
                      </p>
                    </div>

                    {/* H.265 Tune */}
                    <label className="block">
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Tune (optional)</span>
                      <select
                        value={config.h265?.tune ?? ''}
                        onChange={(e) => {
                          const value = e.target.value
                          // Convert empty string to undefined
                          handleH265Change('tune', value === '' ? undefined : value as 'film' | 'animation' | 'grain' | 'fastdecode' | 'zerolatency')
                        }}
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                      >
                        <option value="">None (default)</option>
                        <option value="film">Film - preserves grain</option>
                        <option value="animation">Animation - better for cartoons</option>
                        <option value="grain">Grain - heavy grain preservation</option>
                        <option value="fastdecode">Fast Decode - simpler decode</option>
                      </select>
                    </label>

                    {/* B-frames */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">B-frames</span>
                        <span className="text-sm font-semibold text-slate-700">{config.h265?.bframes ?? 4}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={8}
                        value={config.h265?.bframes ?? 4}
                        onChange={(e) => handleH265Change('bframes', Number(e.target.value))}
                        className="mt-2 w-full accent-slate-900"
                      />
                      <p className="mt-1 text-[10px] text-slate-400">
                        More B-frames = better compression. 4 recommended for web.
                      </p>
                    </div>

                    {/* Two-Pass Encoding */}
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={config.h265?.twoPass ?? false}
                          onChange={(e) => handleH265Change('twoPass', e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600"
                        />
                        <div>
                          <span className="text-sm font-medium text-slate-700">Two-Pass Encoding</span>
                          <p className="text-xs text-slate-400">
                            Better quality/size efficiency. Takes ~2x longer.
                          </p>
                        </div>
                      </label>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Audio Options */}
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={config.audioCopy ?? true}
                  onChange={(e) => handleConfigChange('audioCopy', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <span className="text-sm text-slate-600">Copy audio (no re-encoding)</span>
              </label>
            </div>

            {/* File Options */}
            <div className="space-y-2 rounded-lg border border-slate-100 bg-slate-50 p-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={config.preserveStructure ?? false}
                  onChange={(e) => handleConfigChange('preserveStructure', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <span className="text-sm text-slate-600">Preserve folder structure</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={config.overwriteExisting ?? false}
                  onChange={(e) => handleConfigChange('overwriteExisting', e.target.checked)}
                  disabled={config.fillMode ?? false}
                  className="h-4 w-4 rounded border-slate-300 disabled:opacity-50"
                />
                <span className={`text-sm ${config.fillMode ? 'text-slate-400' : 'text-slate-600'}`}>Overwrite existing files</span>
              </label>
              {config.fillMode && (
                <p className="ml-7 text-xs text-slate-400">Fill mode disables overwrite to avoid accidental replacements.</p>
              )}
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={config.fillMode ?? false}
                  onChange={(e) => handleFillModeChange(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <div className="text-sm text-slate-600">
                  <span>Fill mode</span>
                  <p className="text-xs text-slate-400">
                    Skip files that would conflict with existing output names (disables overwrite)
                  </p>
                </div>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={config.deleteOutputIfLarger ?? true}
                  onChange={(e) => handleConfigChange('deleteOutputIfLarger', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <div className="text-sm text-slate-600">
                  <span>Skip if output is larger</span>
                  <p className="text-xs text-slate-400">Keep original if re-encoding produces a larger file</p>
                </div>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={config.extractThumbnail ?? false}
                  onChange={(e) => handleConfigChange('extractThumbnail', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <div className="text-sm text-slate-600">
                  <span>Extract thumbnail</span>
                  <p className="text-xs text-slate-400">Save a JPEG thumbnail alongside each encoded video</p>
                </div>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={config.extractCaptions ?? false}
                  onChange={(e) => handleConfigChange('extractCaptions', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <div className="text-sm text-slate-600">
                  <span>Extract captions</span>
                  <p className="text-xs text-slate-400">Generate subtitles using Whisper</p>
                </div>
              </label>
              {/* Whisper provider settings - shown when extractCaptions is enabled */}
              {config.extractCaptions && (
                <div className="ml-7 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs font-medium text-slate-500">Transcription Provider</div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="whisperProvider"
                        value="bundled"
                        checked={whisperProvider === 'bundled'}
                        onChange={() => {
                          setWhisperProvider('bundled')
                          void window.api.setWhisperProvider({ provider: 'bundled' })
                        }}
                        className="h-3.5 w-3.5"
                      />
                      <span className="text-sm text-slate-600">Bundled Whisper</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="whisperProvider"
                        value="lmstudio"
                        checked={whisperProvider === 'lmstudio'}
                        onChange={() => {
                          setWhisperProvider('lmstudio')
                          void window.api.setWhisperProvider({ provider: 'lmstudio', endpoint: lmstudioEndpoint })
                        }}
                        className="h-3.5 w-3.5"
                      />
                      <span className="text-sm text-slate-600">LM Studio</span>
                    </label>
                  </div>
                  {whisperProvider === 'lmstudio' && (
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500">API Endpoint</label>
                      <input
                        type="text"
                        value={lmstudioEndpoint}
                        onChange={(e) => {
                          setLmstudioEndpoint(e.target.value)
                          void window.api.setWhisperProvider({ provider: 'lmstudio', endpoint: e.target.value })
                        }}
                        placeholder="http://localhost:1234/v1/audio/transcriptions"
                        className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 placeholder-slate-400"
                      />
                      <p className="text-xs text-slate-400">OpenAI-compatible transcription endpoint</p>
                    </div>
                  )}
                  {whisperProvider === 'bundled' && (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-400">Requires whisper model configured in Settings → Processing</p>
                      {/* GPU Acceleration toggle */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="whisper-gpu"
                            checked={whisperGpuEnabled}
                            disabled={!whisperGpuAvailable}
                            onChange={(e) => {
                              setWhisperGpuEnabled(e.target.checked)
                              void window.api.setWhisperGpuEnabled(e.target.checked)
                            }}
                            className="h-3.5 w-3.5 rounded border-slate-300 disabled:opacity-50"
                          />
                          <label htmlFor="whisper-gpu" className={`text-xs ${whisperGpuAvailable ? 'text-slate-600' : 'text-slate-400'}`}>
                            GPU Acceleration {whisperGpuType === 'metal' ? '(Metal)' : ''}
                          </label>
                        </div>
                        {whisperGpuAvailable && whisperGpuEnabled && (
                          <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700">Enabled</span>
                        )}
                      </div>
                      {!whisperGpuAvailable && whisperGpuReason && (
                        <p className="text-xs text-amber-600">{whisperGpuReason}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
              <label className="flex items-center gap-3 text-rose-600">
                <input
                  type="checkbox"
                  checked={config.deleteOriginal ?? false}
                  onChange={(e) => handleConfigChange('deleteOriginal', e.target.checked)}
                  className="h-4 w-4 rounded border-rose-300"
                />
                <span className="text-sm">Delete original after encoding</span>
              </label>
              <div>
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Thread limit</span>
                <select
                  value={String(config.threadLimit ?? 0)}
                  onChange={(e) => handleConfigChange('threadLimit', Number(e.target.value) as 0 | 4 | 6)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="0">No limit (use all threads)</option>
                  <option value="6">Limit to 6 threads</option>
                  <option value="4">Limit to 4 threads</option>
                </select>
                <p className="mt-1 text-xs text-slate-400">Lower CPU usage at the cost of slower encoding.</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Command Preview */}
      {previewCommand && previewCommand.length > 0 && (
        <section className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">FFmpeg command preview</p>
          <pre className="mt-2 max-h-20 overflow-x-auto whitespace-pre-wrap break-all rounded-lg bg-white p-3 text-[11px] text-slate-600">
            ffmpeg {previewCommand.join(' ')}
          </pre>
        </section>
      )}

      {/* Batch Info Summary */}
      {inputPaths.length > 0 && outputDir && (
        <section className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
          <h4 className="text-sm font-semibold text-slate-700">Batch Summary</h4>
          {isLoadingBatchInfo ? (
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Calculating...
            </div>
          ) : batchInfo ? (
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {/* Total Duration */}
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-400">Total Duration</p>
                <p className="text-sm font-semibold text-slate-700">
                  {batchInfo.totalDurationSeconds
                    ? formatDuration(batchInfo.totalDurationSeconds)
                    : '--'}
                </p>
              </div>
              {/* Estimated Encoding Time */}
              <div className="rounded-lg bg-blue-50 px-3 py-2">
                <p className="text-xs text-blue-500">Est. Encoding Time</p>
                <p className="text-sm font-semibold text-blue-700">
                  {batchInfo.totalDurationSeconds ? (() => {
                    const codec = config.codec ?? 'av1'
                    const preset = codec === 'h265'
                      ? (config.h265?.preset ?? 'medium')
                      : (config.av1?.preset ?? 6)
                    const encoder = codec === 'h265'
                      ? 'libx265' as H265Encoder
                      : (config.av1?.encoder ?? 'libsvtav1') as Av1Encoder
                    const resolution = (config.resolution ?? 'source') as ArchivalResolution
                    const twoPass = codec === 'h265'
                      ? (config.h265?.twoPass ?? false)
                      : (config.av1?.encoder === 'libaom-av1' && config.av1?.twoPass)
                    const estimate = estimateEncodingTime(
                      batchInfo.totalDurationSeconds,
                      codec,
                      preset,
                      encoder,
                      resolution,
                      twoPass ?? false
                    )
                    return formatEstimatedTime(estimate.estimatedSeconds)
                  })() : '--'}
                </p>
              </div>
              {/* Input Size */}
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-400">Total Input Size</p>
                <p className="text-sm font-semibold text-slate-700">
                  {batchInfo.totalInputBytes
                    ? formatFileSize(batchInfo.totalInputBytes)
                    : '--'}
                </p>
              </div>
              {/* Estimated Output */}
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-400">Est. Output Size</p>
                <p className="text-sm font-semibold text-slate-700">
                  {batchInfo.estimatedOutputBytes
                    ? formatFileSize(batchInfo.estimatedOutputBytes)
                    : '--'}
                </p>
              </div>
              {/* Available Space */}
              <div className={`rounded-lg px-3 py-2 ${
                batchInfo.hasEnoughSpace === false
                  ? 'bg-rose-50'
                  : 'bg-slate-50'
              }`}>
                <p className="text-xs text-slate-400">Available Space</p>
                <p className={`text-sm font-semibold ${
                  batchInfo.hasEnoughSpace === false
                    ? 'text-rose-600'
                    : 'text-slate-700'
                }`}>
                  {batchInfo.availableBytes
                    ? formatFileSize(batchInfo.availableBytes)
                    : '--'}
                </p>
              </div>
            </div>
          ) : null}

          {/* Warnings */}
          <div className="mt-2 space-y-2">
            {batchInfo?.hasEnoughSpace === false && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                <span className="font-semibold">Not enough disk space!</span>{' '}
                Need ~{batchInfo.estimatedOutputBytes ? formatFileSize(batchInfo.estimatedOutputBytes) : '?'}{' '}
                but only {batchInfo.availableBytes ? formatFileSize(batchInfo.availableBytes) : '?'} available.
              </div>
            )}
            {batchInfo && batchInfo.existingCount !== undefined && batchInfo.existingCount > 0 && !config.overwriteExisting && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                <span className="font-semibold">{batchInfo.existingCount} file{batchInfo.existingCount !== 1 ? 's' : ''} already exist</span>{' '}
                {config.fillMode
                  ? 'and will be skipped because Fill mode is enabled.'
                  : 'and will be skipped. Enable "Overwrite existing files" to re-encode them.'}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Start Button */}
      <section className="rounded-2xl border border-slate-200/70 bg-slate-900 p-6 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold">Start Archival Batch</h3>
            <p className="mt-1 text-sm text-slate-300">
              {inputPaths.length} file{inputPaths.length !== 1 ? 's' : ''} ready to encode
              {batchInfo?.totalDurationSeconds ? ` · ${formatDuration(batchInfo.totalDurationSeconds)} total` : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setInputPaths([])
                setOutputDir(null)
                setSourceInfo(null)
                if (defaultConfig) setConfig(defaultConfig)
              }}
              className="rounded-full border border-white/30 px-4 py-2 text-xs font-semibold uppercase tracking-wide"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => void handleStartBatch()}
              disabled={
                isStarting ||
                inputPaths.length === 0 ||
                !outputDir ||
                (config.codec === 'h265' ? !encoderInfo?.hasH265Support : !encoderInfo?.hasAv1Support)
              }
              className="rounded-full bg-white px-6 py-2 text-sm font-semibold uppercase tracking-wide text-slate-900 disabled:opacity-50"
            >
              {isStarting ? 'Starting...' : 'Start Encoding'}
            </button>
          </div>
        </div>
        {error && (
          <p className="mt-4 text-sm text-rose-300">{error}</p>
        )}
      </section>

      {/* Current Job Status */}
      {currentJob && (
        <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-slate-900">Current Batch</h3>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusTone(currentJob.status)}`}>
                  {currentJob.status}
                </span>
                {queueState === 'paused' && currentJob.status === 'running' && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                    Paused
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {currentJob.completedItems} of {currentJob.totalItems} completed
                {currentJob.failedItems > 0 && ` · ${currentJob.failedItems} failed`}
                {currentJob.skippedItems > 0 && ` · ${currentJob.skippedItems} skipped`}
              </p>
            </div>
            {(currentJob.status === 'running' || queueState === 'paused') && (
              <div className="flex items-center gap-2">
                {/* Pause/Resume button */}
                {queueState === 'running' && (
                  <button
                    type="button"
                    onClick={() => void handlePause()}
                    disabled={isPauseLoading}
                    className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-600 disabled:opacity-50"
                  >
                    {isPauseLoading ? 'Pausing...' : 'Pause'}
                  </button>
                )}
                {queueState === 'paused' && (
                  <button
                    type="button"
                    onClick={() => void handleResume()}
                    disabled={isPauseLoading}
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-600 disabled:opacity-50"
                  >
                    {isPauseLoading ? 'Resuming...' : 'Resume'}
                  </button>
                )}
                {/* Cancel button */}
                <button
                  type="button"
                  onClick={() => void handleCancel()}
                  className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-600"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Overall progress with ETA */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Overall progress</span>
              <div className="flex items-center gap-3">
                {currentJob.status === 'running' && batchSpeed !== undefined && (
                  <span className="text-blue-600">{formatSpeed(batchSpeed)} realtime</span>
                )}
                {currentJob.status === 'running' && batchEta !== undefined && (
                  <span className="font-medium text-slate-700">ETA: {formatEta(batchEta)}</span>
                )}
                <span>{batchProgress || overallProgress}%</span>
              </div>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-slate-900 transition-all"
                style={{ width: `${batchProgress || overallProgress}%` }}
              />
            </div>
          </div>

          {/* Batch stats summary */}
          {(currentJob.status === 'running' || queueState === 'paused') && (
            <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3 sm:grid-cols-4">
              <div className="text-center">
                <p className="text-xs text-slate-400">Speed</p>
                <p className="text-sm font-semibold text-slate-700">
                  {batchSpeed !== undefined ? formatSpeed(batchSpeed) : '--'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400">ETA</p>
                <p className="text-sm font-semibold text-slate-700">
                  {batchEta !== undefined ? formatEta(batchEta) : '--'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400">Remaining</p>
                <p className="text-sm font-semibold text-slate-700">
                  {currentJob.totalItems - currentJob.completedItems - currentJob.failedItems - currentJob.skippedItems} files
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400">Output Size</p>
                <p className="text-sm font-semibold text-emerald-600">
                  {currentJob.actualOutputBytes ? formatFileSize(currentJob.actualOutputBytes) : '--'}
                </p>
              </div>
            </div>
          )}

          {/* Completed batch summary */}
          {currentJob.status === 'completed' && currentJob.actualOutputBytes !== undefined && (
            <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50 p-3">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="text-center">
                  <p className="text-xs text-emerald-600">Completed</p>
                  <p className="text-sm font-semibold text-emerald-700">
                    {currentJob.completedItems} / {currentJob.totalItems}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-emerald-600">Total Output</p>
                  <p className="text-sm font-semibold text-emerald-700">
                    {formatFileSize(currentJob.actualOutputBytes)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-emerald-600">Skipped</p>
                  <p className="text-sm font-semibold text-emerald-700">
                    {currentJob.skippedItems}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-emerald-600">Failed</p>
                  <p className={`text-sm font-semibold ${currentJob.failedItems > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {currentJob.failedItems}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Items list */}
          <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
            {currentJob.items.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="flex-1 truncate text-sm font-medium text-slate-700">
                    {item.inputPath.split(/[/\\]/).pop()}
                  </p>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {/* Deletion indicators */}
                    {item.originalDeleted && (
                      <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] font-medium text-rose-600" title="Original file deleted">
                        🗑️ Original
                      </span>
                    )}
                    {item.outputDeleted && (
                      <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-medium text-amber-600" title="Output deleted (was larger)">
                        🗑️ Output
                      </span>
                    )}
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${statusTone(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
                {/* Source metadata row */}
                {item.sourceInfo && (
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-500">
                    <span title="Video codec">{formatVideoCodec(item.sourceInfo.videoCodec)}</span>
                    {item.sourceInfo.audioCodec && (
                      <>
                        <span className="text-slate-300">/</span>
                        <span title="Audio codec">{formatAudioCodec(item.sourceInfo.audioCodec)}</span>
                      </>
                    )}
                    <span className="text-slate-300">·</span>
                    <span title="Container">{(item.sourceInfo.container ?? item.inputPath.split('.').pop())?.toUpperCase()}</span>
                    <span className="text-slate-300">·</span>
                    <span title="Resolution">{formatResolution(item.sourceInfo.width, item.sourceInfo.height)}</span>
                    <span className="text-slate-300">·</span>
                    <span title="Duration">{formatDuration(item.sourceInfo.duration)}</span>
                    {item.sourceInfo.isHdr ? (
                      <>
                        <span className="text-slate-300">·</span>
                        <span className="font-medium text-purple-600" title={item.sourceInfo.hdrFormat ?? 'HDR'}>
                          {item.sourceInfo.hdrFormat ?? 'HDR'}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-400">SDR</span>
                      </>
                    )}
                    {/* Source file size with output/estimated */}
                    {item.inputSize && (
                      <>
                        <span className="text-slate-300">·</span>
                        <span title="File size" className="font-medium">
                          {formatFileSize(item.inputSize)}
                          {item.outputSize && item.status === 'completed' && (
                            <span className="text-emerald-600"> → {formatFileSize(item.outputSize)}</span>
                          )}
                          {!item.outputSize && (item.status === 'queued' || item.status === 'analyzing') && item.sourceInfo.duration > 0 && (
                            <span className="text-slate-400" title="Estimated output size based on codec settings">
                              {' '}→ ~{formatFileSize(
                                // Estimate: duration × target bitrate based on job's codec
                                // For AV1 CRF 30, roughly 1-2 Mbps for 1080p
                                // For H.265 CRF 23, roughly 2-4 Mbps for 1080p
                                item.sourceInfo.duration * (currentJob.config.codec === 'h265' ? 350000 : 200000)
                              )}
                            </span>
                          )}
                        </span>
                      </>
                    )}
                    {/* PCM audio transcoding warning - use job config, not UI config */}
                    {isPcmAudio(item.sourceInfo.audioCodec) && currentJob.config.container === 'mp4' && currentJob.config.audioCopy !== false && (
                      <span
                        className="ml-1 rounded bg-amber-100 px-1 py-0.5 text-[9px] font-medium text-amber-700"
                        title="PCM audio will be transcoded to AAC for MP4 compatibility"
                      >
                        PCM→AAC
                      </span>
                    )}
                  </div>
                )}
                {item.status === 'encoding' && item.progress != null && (
                  <div className="mt-2">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all"
                        style={{ width: `${Math.min(100, item.progress)}%` }}
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{Math.round(item.progress)}%</span>
                      <div className="flex items-center gap-2">
                        {item.encodingSpeed !== undefined && (
                          <span>{formatSpeed(item.encodingSpeed)}</span>
                        )}
                        {item.etaSeconds !== undefined && (
                          <span>ETA: {formatEta(item.etaSeconds)}</span>
                        )}
                        {item.elapsedSeconds !== undefined && (
                          <span className="text-slate-300">Elapsed: {formatEta(item.elapsedSeconds)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {item.status === 'completed' && item.compressionRatio != null && item.compressionRatio >= 1 && (
                  <p className="mt-1 text-[10px] text-emerald-600">
                    Compressed to {(100 / item.compressionRatio).toFixed(0)}% of original
                    {item.outputSize != null && ` (${formatFileSize(item.outputSize)})`}
                  </p>
                )}
                {item.status === 'completed' && item.compressionRatio != null && item.compressionRatio < 1 && (
                  <p className="mt-1 text-[10px] text-amber-600">
                    Warning: Output is {(100 / item.compressionRatio).toFixed(0)}% of original (larger)
                    {item.outputSize != null && ` (${formatFileSize(item.outputSize)})`}
                  </p>
                )}
                {item.errorType === 'output_larger' && (
                  <p className="mt-1 text-[10px] text-amber-600">
                    Skipped: Output would be larger than original ({item.compressionRatio && item.compressionRatio < 1 ? `${(100 / item.compressionRatio).toFixed(0)}% of original` : 'no savings'})
                  </p>
                )}
                {item.error && item.errorType !== 'output_larger' && (
                  <p className="mt-1 text-[10px] text-rose-600">
                    {item.errorType ? getErrorMessage(item.errorType as ArchivalErrorType) : item.error}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recovery Modal */}
      {showRecoveryModal && recoveryInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Interrupted Batch Found</h3>
                <p className="text-sm text-slate-500">Would you like to resume encoding?</p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-400">Total Items</p>
                  <p className="font-semibold text-slate-700">{recoveryInfo.totalItems}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Completed</p>
                  <p className="font-semibold text-emerald-600">{recoveryInfo.completedItems}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Failed</p>
                  <p className={`font-semibold ${recoveryInfo.failedItems > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                    {recoveryInfo.failedItems}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Remaining</p>
                  <p className="font-semibold text-slate-700">
                    {recoveryInfo.totalItems - recoveryInfo.completedItems - recoveryInfo.failedItems}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Interrupted: {new Date(recoveryInfo.savedAt).toLocaleString()}
              </p>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => void handleDiscardRecovery()}
                disabled={isRecovering}
                className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 disabled:opacity-50"
              >
                {isRecovering ? 'Processing...' : 'Discard'}
              </button>
              <button
                type="button"
                onClick={() => void handleResumeRecovery()}
                disabled={isRecovering}
                className="flex-1 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isRecovering ? 'Resuming...' : 'Resume Encoding'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
