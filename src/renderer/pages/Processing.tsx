import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import type { ProcessingPreset, CPUSIMDCapabilities } from '../../preload/api'
import VideoEncodingSettings from '../components/processing/VideoEncodingSettings'
import { DEFAULT_ENCODING_CONFIG } from '../../shared/types/encoding.types'
import type { VideoEncodingConfig, HWAccelerator } from '../../shared/types/encoding.types'

type ProcessingJob = {
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
}

type ProcessingJobDetails = {
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

export default function Processing(): JSX.Element {
  const [transcodeInput, setTranscodeInput] = useState<string | null>(null)
  const [transcriptionInput, setTranscriptionInput] = useState<string | null>(null)
  const [presets, setPresets] = useState<ProcessingPreset[]>([])
  const [presetId, setPresetId] = useState('source-copy')
  const [transcodeJobs, setTranscodeJobs] = useState<ProcessingJob[]>([])
  const [transcriptionJobs, setTranscriptionJobs] = useState<ProcessingJob[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [modelPath, setModelPath] = useState<string | null>(null)
  const [isCanceling, setIsCanceling] = useState(false)
  const [batchInputs, setBatchInputs] = useState<string[]>([])
  const [batchStatus, setBatchStatus] = useState<string | null>(null)
  const [isBatchQueueing, setIsBatchQueueing] = useState(false)
  const [detailsJobId, setDetailsJobId] = useState<string | null>(null)
  const [detailsJob, setDetailsJob] = useState<ProcessingJobDetails | null>(null)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [isDetailsLoading, setIsDetailsLoading] = useState(false)
  const [detailsNotice, setDetailsNotice] = useState<string | null>(null)
  const detailsJobIdRef = useRef<string | null>(null)

  // Advanced encoding state
  const [advancedInput, setAdvancedInput] = useState<string | null>(null)
  const [advancedConfig, setAdvancedConfig] = useState<VideoEncodingConfig>(DEFAULT_ENCODING_CONFIG)
  const [availableHWAccel, setAvailableHWAccel] = useState<HWAccelerator[]>(['none'])
  const [cpuCapabilities, setCpuCapabilities] = useState<CPUSIMDCapabilities | null>(null)
  const [isAdvancedSubmitting, setIsAdvancedSubmitting] = useState(false)
  const [advancedError, setAdvancedError] = useState<string | null>(null)
  const [showAdvancedPanel, setShowAdvancedPanel] = useState(false)
  const [ffmpegPreview, setFfmpegPreview] = useState<string[] | null>(null)
  const [sourceInfo, setSourceInfo] = useState<{
    duration: number
    width: number
    height: number
    frameRate: number
    bitrate: number
    codec: string
  } | undefined>(undefined)
  const [isProbing, setIsProbing] = useState(false)

  // AI Tools state
  const [aiVideoPath, setAiVideoPath] = useState<string | null>(null)
  const [isAiProcessing, setIsAiProcessing] = useState(false)
  const [aiResult, setAiResult] = useState<{ tags?: string[]; analysis?: string; framesAnalyzed?: number; error?: string } | null>(null)
  const [llmAvailable, setLlmAvailable] = useState(false)
  const [aiFrameCount, setAiFrameCount] = useState(8) // Number of frames to analyze

  const selectedPreset = useMemo(
    () => presets.find((preset) => preset.id === presetId) ?? null,
    [presetId, presets]
  )

  useEffect(() => {
    let active = true
    let intervalId: NodeJS.Timeout | null = null

    const loadJobs = async (): Promise<void> => {
      try {
        const [transcodeResult, transcriptionResult] = await Promise.all([
          window.api.processingList('transcode'),
          window.api.processingList('transcription')
        ])
        if (!active) {
          return
        }
        if (transcodeResult.ok) {
          setTranscodeJobs(transcodeResult.jobs)
          setError(null)
        } else {
          setError('Unable to load processing jobs.')
        }
        if (transcriptionResult.ok) {
          setTranscriptionJobs(transcriptionResult.jobs)
        }

        if (detailsJobIdRef.current) {
          const detailResult = await window.api.processingDetails(detailsJobIdRef.current)
          if (active) {
            if (detailResult.ok && detailResult.job) {
              setDetailsJob(detailResult.job)
              setDetailsError(null)
            } else if (detailResult.error) {
              setDetailsError(detailResult.error)
            }
          }
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Unable to load processing jobs.')
        }
      }
    }

    void loadJobs()
    window.api
      .processingPresets()
      .then((result) => {
        if (active && result.ok) {
          setPresets(result.presets)
          if (result.presets.length > 0 && !result.presets.some((preset) => preset.id === presetId)) {
            setPresetId(result.presets[0].id)
          }
        }
      })
      .catch(() => {
        if (active) {
          setPresets([])
        }
      })
    window.api
      .getWhisperModel()
      .then((result) => {
        if (active && result.ok && result.path) {
          setModelPath(result.path)
        }
      })
      .catch(() => {
        if (active) {
          setModelPath(null)
        }
      })
    intervalId = setInterval(loadJobs, 5000)

    return () => {
      active = false
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [])

  useEffect(() => {
    const unsubscribe = window.api.onProcessingEvent((event) => {
      const patchJob = (job: ProcessingJob): ProcessingJob => {
        if (job.id !== event.jobId) {
          return job
        }

        const updated = { ...job }
        if (event.kind === 'progress' && event.progress != null) {
          updated.progress = event.progress
        }
        if (event.kind === 'log' && event.logTail != null) {
          updated.log_tail = event.logTail
        }
        if (event.kind === 'status') {
          if (event.status) {
            updated.status = event.status
          }
          if (event.error != null) {
            updated.error_message = event.error
          }
        }
        if (event.kind === 'result' && event.result) {
          updated.result_json = event.result
        }
        if (event.updatedAt) {
          updated.updated_at = event.updatedAt
        }
        return updated
      }

      if (event.jobType === 'transcode') {
        setTranscodeJobs((prev) => prev.map(patchJob))
      } else if (event.jobType === 'transcription') {
        setTranscriptionJobs((prev) => prev.map(patchJob))
      }

      if (detailsJobIdRef.current === event.jobId) {
        setDetailsJob((prev) => {
          if (!prev) {
            return prev
          }
          const updated = { ...prev }
          if (event.kind === 'progress' && event.progress != null) {
            updated.progress = event.progress
          }
          if (event.kind === 'log' && event.logTail != null) {
            updated.log_tail = event.logTail
          }
          if (event.kind === 'status') {
            if (event.status) {
              updated.status = event.status
            }
            if (event.error != null) {
              updated.error_message = event.error
            }
          }
          if (event.kind === 'result' && event.result) {
            updated.result_json = event.result
          }
          if (event.updatedAt) {
            updated.updated_at = event.updatedAt
          }
          return updated
        })
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    detailsJobIdRef.current = detailsJobId
  }, [detailsJobId])

  // Detect available hardware accelerators on mount
  useEffect(() => {
    window.api.processingDetectHWAccel()
      .then((result) => {
        if (result.ok && result.available) {
          setAvailableHWAccel(result.available)
          // Auto-select recommended accelerator
          if (result.recommended && result.recommended !== 'none') {
            setAdvancedConfig(prev => ({ ...prev, hwAccel: result.recommended! }))
          }
          // Store CPU capabilities for UI display
          if (result.cpuCapabilities) {
            setCpuCapabilities(result.cpuCapabilities)
          }
        }
      })
      .catch(() => {
        // Fallback to software-only
        setAvailableHWAccel(['none'])
      })

    // Check if LLM is available
    window.api.smartTagging.llmAvailable()
      .then((result) => {
        setLlmAvailable(result.available)
      })
      .catch(() => {
        setLlmAvailable(false)
      })
  }, [])

  // Update FFmpeg command preview when config changes
  useEffect(() => {
    if (!advancedInput) {
      setFfmpegPreview(null)
      return
    }

    // Debounce the preview request
    const timeoutId = setTimeout(() => {
      window.api.processingPreviewCommand({ inputPath: advancedInput, config: advancedConfig })
        .then((result) => {
          if (result.ok && result.command) {
            setFfmpegPreview(result.command)
          } else {
            console.warn('Preview command failed:', result.error)
            setFfmpegPreview(null)
          }
        })
        .catch((err) => {
          console.error('Preview command error:', err)
          setFfmpegPreview(null)
        })
    }, 150)

    return () => clearTimeout(timeoutId)
  }, [advancedInput, advancedConfig])

  const handleAdvancedSelectInput = async (): Promise<void> => {
    try {
      const result = await window.api.processingSelectInput()
      if (result.ok && result.path) {
        setAdvancedInput(result.path)
        setAdvancedError(null)
        setSourceInfo(undefined)

        // Probe the video for metadata
        setIsProbing(true)
        try {
          const probeResult = await window.api.processingProbeVideo(result.path)
          if (probeResult.ok && probeResult.metadata) {
            const m = probeResult.metadata
            if (m.duration && m.width && m.height) {
              setSourceInfo({
                duration: m.duration,
                width: m.width,
                height: m.height,
                frameRate: m.frameRate ?? 30,
                bitrate: m.bitrate ?? 0,
                codec: m.codec ?? 'unknown'
              })
            }
          }
        } catch {
          // Probe failed silently - estimates will just be less accurate
        } finally {
          setIsProbing(false)
        }
      } else if (!result.canceled) {
        setAdvancedError(result.error ?? 'Unable to select file.')
      }
    } catch (err) {
      setAdvancedError(err instanceof Error ? err.message : 'Unable to select file.')
    }
  }

  const handleAdvancedTranscode = async (): Promise<void> => {
    if (!advancedInput) {
      setAdvancedError('Select a file to encode.')
      return
    }

    setIsAdvancedSubmitting(true)
    setAdvancedError(null)

    try {
      const result = await window.api.processingAdvancedTranscode({
        inputPath: advancedInput,
        config: advancedConfig
      })

      if (!result.ok) {
        setAdvancedError(result.error ?? 'Unable to queue encoding job.')
        return
      }

      // Success - clear input, sourceInfo and close panel
      setAdvancedInput(null)
      setSourceInfo(undefined)
      setShowAdvancedPanel(false)
    } catch (err) {
      setAdvancedError(err instanceof Error ? err.message : 'Unable to queue encoding job.')
    } finally {
      setIsAdvancedSubmitting(false)
    }
  }

  const handleConfigChange = useCallback((newConfig: VideoEncodingConfig) => {
    setAdvancedConfig(newConfig)
  }, [])

  // AI Tools handlers
  const handleAiSelectVideo = async (): Promise<void> => {
    try {
      const result = await window.api.processingSelectInput()
      if (result.ok && result.path) {
        setAiVideoPath(result.path)
        setAiResult(null)
      }
    } catch (err) {
      setAiResult({ error: err instanceof Error ? err.message : 'Failed to select file' })
    }
  }

  const handleAiAnalyze = async (): Promise<void> => {
    if (!aiVideoPath) {
      setAiResult({ error: 'Select a video file first' })
      return
    }

    setIsAiProcessing(true)
    setAiResult(null)

    try {
      // Use vision-based analysis that sends frames directly to the LLM
      const result = await window.api.processingAnalyzeVision({
        videoPath: aiVideoPath,
        maxFrames: aiFrameCount
      })

      if (!result.ok) {
        setAiResult({ error: result.error ?? 'Vision analysis failed' })
        return
      }

      setAiResult({
        analysis: result.analysis,
        tags: result.tags,
        framesAnalyzed: result.framesAnalyzed
      })
    } catch (err) {
      setAiResult({ error: err instanceof Error ? err.message : 'AI analysis failed' })
    } finally {
      setIsAiProcessing(false)
    }
  }

  const handleSelectInput = async (setter: (value: string | null) => void): Promise<void> => {
    try {
      const result = await window.api.processingSelectInput()
      if (result.ok && result.path) {
        setter(result.path)
        setError(null)
      } else if (!result.canceled) {
        setError(result.error ?? 'Unable to select file.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to select file.')
    }
  }

  const handleTranscode = async (): Promise<void> => {
    if (!transcodeInput) {
      setError('Select a file to transcode.')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await window.api.processingTranscode({ inputPath: transcodeInput, presetId })
      if (!result.ok) {
        setError(result.error ?? 'Unable to queue transcode.')
        return
      }
      setTranscodeInput(null)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to queue transcode.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSelectModel = async (): Promise<void> => {
    try {
      const result = await window.api.selectWhisperModel()
      if (result.ok && result.path) {
        setModelPath(result.path)
        setError(null)
      } else if (!result.canceled) {
        setError(result.error ?? 'Unable to select model.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to select model.')
    }
  }

  const handleTranscribe = async (): Promise<void> => {
    if (!transcriptionInput) {
      setError('Select a file to transcribe.')
      return
    }
    if (!modelPath) {
      setError('Select a whisper model.')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await window.api.processingTranscribe({ inputPath: transcriptionInput, modelPath })
      if (!result.ok) {
        setError(result.error ?? 'Unable to queue transcription.')
        return
      }
      setTranscriptionInput(null)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to queue transcription.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelJob = async (jobId: string): Promise<void> => {
    setIsCanceling(true)
    try {
      const result = await window.api.processingCancel(jobId)
      if (!result.ok) {
        setError(result.error ?? 'Unable to cancel job.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to cancel job.')
    } finally {
      setIsCanceling(false)
    }
  }

  const handleOpenDetails = async (jobId: string): Promise<void> => {
    setDetailsJobId(jobId)
    setIsDetailsLoading(true)
    setDetailsError(null)
    try {
      const result = await window.api.processingDetails(jobId)
      if (result.ok && result.job) {
        setDetailsJob(result.job)
      } else {
        setDetailsError(result.error ?? 'Unable to load job details.')
      }
    } catch (err) {
      setDetailsError(err instanceof Error ? err.message : 'Unable to load job details.')
    } finally {
      setIsDetailsLoading(false)
    }
  }

  const handleCloseDetails = (): void => {
    setDetailsJobId(null)
    setDetailsJob(null)
    setDetailsError(null)
    setDetailsNotice(null)
  }

  const handleCopyLog = async (): Promise<void> => {
    if (!detailsJob?.log_tail) {
      setDetailsNotice('No logs to copy.')
      return
    }
    try {
      const result = await window.api.copyToClipboard(detailsJob.log_tail)
      setDetailsNotice(result.ok ? 'Log copied to clipboard.' : result.error ?? 'Unable to copy log.')
    } catch (err) {
      setDetailsNotice(err instanceof Error ? err.message : 'Unable to copy log.')
    }
  }

  const handleRevealOutput = async (): Promise<void> => {
    if (!detailsJob?.output_path) {
      setDetailsNotice('No output path available.')
      return
    }
    try {
      const result = await window.api.revealInFolder(detailsJob.output_path)
      if (!result.ok) {
        setDetailsNotice(result.error ?? 'Unable to reveal output.')
      }
    } catch (err) {
      setDetailsNotice(err instanceof Error ? err.message : 'Unable to reveal output.')
    }
  }

  const formatLogSnippet = (logTail?: string | null): string | null => {
    if (!logTail) {
      return null
    }
    const lines = logTail.trim().split('\n')
    return lines[lines.length - 1] ?? null
  }

  const renderOutputMetadata = (details: ProcessingJobDetails): JSX.Element | null => {
    if (!details.result_json) {
      return null
    }

    const metadata = details.result_json.metadata as Record<string, unknown> | undefined
    const transcriptLength = details.result_json.transcriptLength as number | undefined
    const outputSize = details.result_json.outputSize as number | undefined

    if (!metadata && transcriptLength == null && outputSize == null) {
      return null
    }

    const formatBytes = (bytes?: number): string => {
      if (!bytes || bytes <= 0) {
        return 'n/a'
      }
      const units = ['B', 'KB', 'MB', 'GB', 'TB']
      const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
      const value = bytes / Math.pow(1024, index)
      return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`
    }

    const formatDuration = (seconds?: number): string => {
      if (!seconds || seconds <= 0) {
        return 'n/a'
      }
      const total = Math.floor(seconds)
      const hrs = Math.floor(total / 3600)
      const mins = Math.floor((total % 3600) / 60)
      const secs = total % 60
      if (hrs > 0) {
        return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      }
      return `${mins}:${String(secs).padStart(2, '0')}`
    }

    const formatBitrate = (value?: number): string => {
      if (!value || value <= 0) {
        return 'n/a'
      }
      const kbps = value / 1000
      if (kbps < 1000) {
        return `${Math.round(kbps)} Kbps`
      }
      const mbps = kbps / 1000
      return `${mbps.toFixed(mbps >= 10 ? 0 : 1)} Mbps`
    }

    const formatMetaValue = (key: string, value: unknown): string => {
      if (value == null) {
        return 'n/a'
      }
      if (key === 'fileSize') {
        return formatBytes(value as number)
      }
      if (key === 'bitrate') {
        return formatBitrate(value as number)
      }
      if (key === 'duration') {
        return formatDuration(value as number)
      }
      return String(value)
    }

    return (
      <div className="space-y-2 text-xs text-slate-600">
        {metadata ? (
          <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Output metadata</p>
            <div className="mt-2 grid gap-1">
              {Object.entries(metadata).map(([key, value]) => (
                <p key={key}>
                  <span className="font-semibold">{key}:</span> {formatMetaValue(key, value)}
                </p>
              ))}
            </div>
          </div>
        ) : null}
        {transcriptLength != null || outputSize != null ? (
          <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Transcript stats</p>
            <p className="mt-2">
              <span className="font-semibold">Characters:</span> {transcriptLength ?? 'n/a'}
            </p>
            <p>
              <span className="font-semibold">Output size:</span> {formatBytes(outputSize)}
            </p>
          </div>
        ) : null}
      </div>
    )
  }

  const handleSelectBatch = async (): Promise<void> => {
    setBatchStatus(null)
    try {
      const result = await window.api.processingSelectBatch()
      if (result.ok && result.paths) {
        setBatchInputs(result.paths)
      } else if (!result.canceled) {
        setError(result.error ?? 'Unable to select files.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to select files.')
    }
  }

  const handleQueueBatch = async (): Promise<void> => {
    if (batchInputs.length === 0) {
      setBatchStatus('Select at least one file.')
      return
    }

    setIsBatchQueueing(true)
    setBatchStatus(null)
    let queued = 0
    let failed = 0

    try {
      for (const inputPath of batchInputs) {
        const result = await window.api.processingTranscode({ inputPath, presetId })
        if (result.ok) {
          queued += 1
        } else {
          failed += 1
        }
      }
      setBatchStatus(`Queued ${queued} jobs${failed ? ` · ${failed} failed` : ''}`)
      if (failed === 0) {
        setBatchInputs([])
      }
    } catch (err) {
      setBatchStatus(err instanceof Error ? err.message : 'Unable to queue batch.')
    } finally {
      setIsBatchQueueing(false)
    }
  }

  const statusTone = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-700'
      case 'running':
        return 'bg-slate-900 text-white'
      case 'failed':
        return 'bg-rose-100 text-rose-700'
      case 'cancelled':
        return 'bg-slate-100 text-slate-500'
      case 'queued':
      default:
        return 'bg-amber-100 text-amber-700'
    }
  }

  const formatErrorMessage = (job: ProcessingJob | ProcessingJobDetails): string | null => {
    if (!job.error_message) {
      return null
    }
    if (job.status === 'cancelled') {
      return 'Canceled by user.'
    }
    if (job.error_message === 'missing_input') {
      return 'Missing input file.'
    }
    if (job.error_message === 'missing_model') {
      return 'Missing transcription model.'
    }
    return job.error_message
  }

  const renderProgress = (job: ProcessingJob | ProcessingJobDetails): JSX.Element | null => {
    if (job.progress == null) {
      if (job.status === 'running') {
        return <p className="mt-2 text-[11px] text-slate-400">Progress: estimating...</p>
      }
      return null
    }
    const value = Math.max(0, Math.min(100, Math.round(job.progress)))
    return (
      <div className="mt-2 space-y-1">
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>Progress</span>
          <span>{value}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-slate-900" style={{ width: `${value}%` }} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Transcode a file</h3>
          <p className="mt-2 text-sm text-slate-500">
            Run ffmpeg presets on local files. Output files are created alongside the source.
          </p>
          <div className="mt-5 space-y-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Input file</p>
              <p className="mt-2 truncate">{transcodeInput ?? 'No file selected'}</p>
              <button
                type="button"
                onClick={() => void handleSelectInput(setTranscodeInput)}
                className="mt-3 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Choose file
              </button>
            </div>
            <label className="block text-sm font-semibold text-slate-700">
              Preset
              <select
                value={presetId}
                onChange={(event) => setPresetId(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
              >
                {presets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-600">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Preset details</p>
              <p className="mt-2 text-sm text-slate-600">
                {selectedPreset?.description ?? 'Select a preset to see details.'}
              </p>
              {selectedPreset?.outputExtension ? (
                <p className="mt-2 text-xs text-slate-500">
                  Output extension: {selectedPreset.outputExtension}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => void handleTranscode()}
              disabled={isSubmitting}
              className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Queueing...' : 'Queue transcode'}
            </button>
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Processing queue</h3>
          <p className="mt-2 text-sm text-slate-500">Recent transcode jobs and their status.</p>
          <div className="mt-5 space-y-3">
            {transcodeJobs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
                No processing jobs yet
              </div>
            ) : (
              transcodeJobs.map((job) => (
                <div key={job.id} className="rounded-xl border border-slate-200 px-4 py-3">
                  <p className="truncate text-sm font-semibold text-slate-900">{job.input_path ?? 'Unknown input'}</p>
                  <p className="mt-1 truncate text-xs text-slate-400">{job.output_path ?? 'Output pending'}</p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusTone(job.status)}`}>
                      {job.status}
                    </span>
                    <span>{new Date(job.created_at).toLocaleString()}</span>
                  </div>
                  {renderProgress(job)}
                  {formatErrorMessage(job) ? (
                    <p className="mt-2 text-xs text-rose-600">{formatErrorMessage(job)}</p>
                  ) : null}
                  {formatLogSnippet(job.log_tail) ? (
                    <p className="mt-2 truncate text-[11px] text-slate-400">
                      {formatLogSnippet(job.log_tail)}
                    </p>
                  ) : null}
                  {['queued', 'running'].includes(job.status) ? (
                    <button
                      type="button"
                      onClick={() => void handleCancelJob(job.id)}
                      disabled={isCanceling}
                      className="mt-3 rounded-full border border-rose-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-rose-600"
                    >
                      {isCanceling ? 'Canceling...' : 'Cancel'}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void handleOpenDetails(job.id)}
                    className="mt-3 rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600"
                  >
                    Details
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Transcribe audio</h3>
          <p className="mt-2 text-sm text-slate-500">
            Whisper transcription jobs attach transcripts to library items.
          </p>
          <div className="mt-5 space-y-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Input file</p>
              <p className="mt-2 truncate">{transcriptionInput ?? 'No file selected'}</p>
              <button
                type="button"
                onClick={() => void handleSelectInput(setTranscriptionInput)}
                className="mt-3 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Choose file
              </button>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Model</p>
              <p className="mt-2 truncate">{modelPath ?? 'No model selected'}</p>
              <button
                type="button"
                onClick={() => void handleSelectModel()}
                className="mt-3 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Choose model
              </button>
            </div>
            <button
              type="button"
              onClick={() => void handleTranscribe()}
              disabled={isSubmitting}
              className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Queueing...' : 'Queue transcription'}
            </button>
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          </div>
          <div className="mt-6 space-y-3">
            {transcriptionJobs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400">
                No transcription jobs yet
              </div>
            ) : (
              transcriptionJobs.map((job) => (
                <div key={job.id} className="rounded-xl border border-slate-200 px-4 py-3">
                  <p className="truncate text-sm font-semibold text-slate-900">{job.input_path ?? 'Unknown input'}</p>
                  <p className="mt-1 truncate text-xs text-slate-400">{job.output_path ?? 'Output pending'}</p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusTone(job.status)}`}>
                      {job.status}
                    </span>
                    <span>{new Date(job.created_at).toLocaleString()}</span>
                  </div>
                  {renderProgress(job)}
                  {formatErrorMessage(job) ? (
                    <p className="mt-2 text-xs text-rose-600">{formatErrorMessage(job)}</p>
                  ) : null}
                  {formatLogSnippet(job.log_tail) ? (
                    <p className="mt-2 truncate text-[11px] text-slate-400">
                      {formatLogSnippet(job.log_tail)}
                    </p>
                  ) : null}
                  {['queued', 'running'].includes(job.status) ? (
                    <button
                      type="button"
                      onClick={() => void handleCancelJob(job.id)}
                      disabled={isCanceling}
                      className="mt-3 rounded-full border border-rose-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-rose-600"
                    >
                      {isCanceling ? 'Canceling...' : 'Cancel'}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void handleOpenDetails(job.id)}
                    className="mt-3 rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600"
                  >
                    Details
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/70 bg-slate-900 p-6 text-white shadow-lg shadow-slate-900/20">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Automation</p>
            <h3 className="mt-3 text-xl font-semibold">Create a processing batch</h3>
            <p className="mt-2 text-sm text-slate-300">
              Queue multiple files with the selected preset.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void handleSelectBatch()}
              className="rounded-full border border-white/30 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white"
            >
              Select files
            </button>
            <button
              type="button"
              onClick={() => setBatchInputs([])}
              className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/80"
              disabled={batchInputs.length === 0}
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => void handleQueueBatch()}
              className="rounded-full bg-white px-5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-900"
              disabled={isBatchQueueing || batchInputs.length === 0}
            >
              {isBatchQueueing ? 'Queueing...' : 'Queue batch'}
            </button>
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
          <p>
            {batchInputs.length === 0
              ? 'No files selected.'
              : `${batchInputs.length} file${batchInputs.length === 1 ? '' : 's'} selected`}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Preset: {selectedPreset?.label ?? 'Source Copy'}
          </p>
          {batchInputs.length > 0 ? (
            <div className="mt-3 max-h-28 space-y-1 overflow-y-auto text-xs text-slate-400">
              {batchInputs.slice(0, 6).map((path) => (
                <p key={path} className="truncate">
                  {path}
                </p>
              ))}
              {batchInputs.length > 6 ? (
                <p className="text-[11px] text-slate-500">
                  +{batchInputs.length - 6} more
                </p>
              ) : null}
            </div>
          ) : null}
          {batchStatus ? (
            <p
              className={`mt-3 text-xs ${
                batchStatus.toLowerCase().includes('fail') ? 'text-rose-300' : 'text-emerald-300'
              }`}
            >
              {batchStatus}
            </p>
          ) : null}
        </div>
      </section>

      {/* Advanced Encoding Section */}
      <section className="rounded-2xl border border-slate-200/70 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setShowAdvancedPanel(!showAdvancedPanel)}
          className="flex w-full items-center justify-between p-6"
        >
          <div className="text-left">
            <h3 className="text-lg font-semibold text-slate-900">Advanced Encoding</h3>
            <p className="mt-1 text-sm text-slate-500">
              Full control over video codec, quality, resolution, filters, and hardware acceleration.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {availableHWAccel.length > 1 && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                HW Accel Available
              </span>
            )}
            <svg
              className={`h-5 w-5 text-slate-400 transition-transform ${showAdvancedPanel ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {showAdvancedPanel && (
          <div className="border-t border-slate-100 p-6">
            <div className="mb-6 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Input file</p>
              <p className="mt-2 truncate text-sm text-slate-600">{advancedInput ?? 'No file selected'}</p>
              <button
                type="button"
                onClick={() => void handleAdvancedSelectInput()}
                className="mt-3 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Choose file
              </button>
            </div>

            {isProbing && (
              <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyzing video...
              </div>
            )}

            {sourceInfo && (
              <div className="mb-4 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <span className="font-medium">Source:</span>{' '}
                {sourceInfo.width}×{sourceInfo.height} • {sourceInfo.codec.toUpperCase()} • {Math.round(sourceInfo.frameRate)}fps • {Math.floor(sourceInfo.duration / 60)}:{String(Math.floor(sourceInfo.duration % 60)).padStart(2, '0')}
                {sourceInfo.bitrate > 0 && ` • ${(sourceInfo.bitrate / 1000000).toFixed(1)} Mbps`}
              </div>
            )}

            <VideoEncodingSettings
              config={advancedConfig}
              onChange={handleConfigChange}
              sourceInfo={sourceInfo}
              availableHWAccel={availableHWAccel}
              cpuCapabilities={cpuCapabilities}
            />

            {/* FFmpeg Command Preview */}
            {ffmpegPreview && (
              <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">FFmpeg command preview</p>
                <pre className="mt-2 max-h-24 overflow-x-auto whitespace-pre-wrap break-all rounded-lg bg-white p-3 text-[11px] text-slate-600">
                  ffmpeg {ffmpegPreview.join(' ')}
                </pre>
              </div>
            )}

            <div className="mt-6 flex items-center gap-4">
              <button
                type="button"
                onClick={() => void handleAdvancedTranscode()}
                disabled={isAdvancedSubmitting || !advancedInput}
                className="flex-1 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isAdvancedSubmitting ? 'Queueing...' : 'Start Encoding'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdvancedConfig(DEFAULT_ENCODING_CONFIG)
                  setAdvancedInput(null)
                  setSourceInfo(undefined)
                }}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600"
              >
                Reset
              </button>
            </div>

            {advancedError && (
              <p className="mt-4 text-sm text-rose-600">{advancedError}</p>
            )}
          </div>
        )}
      </section>

      {/* AI Video Analysis Section */}
      <section className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-violet-50 to-indigo-50 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-slate-900">AI Video Analysis</h3>
              {llmAvailable ? (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                  LLM Connected
                </span>
              ) : (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                  LLM Not Configured
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Analyze the entire video with AI vision. Frames are extracted and sent directly to the LLM for comprehensive analysis.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div className="rounded-xl border border-white/50 bg-white/70 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Video file</p>
            <p className="mt-2 truncate text-sm text-slate-600">{aiVideoPath ?? 'No file selected'}</p>
            <button
              type="button"
              onClick={() => void handleAiSelectVideo()}
              className="mt-3 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Choose file
            </button>
          </div>

          {/* Frame count slider */}
          <div className="rounded-xl border border-white/50 bg-white/70 px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Frames to analyze</p>
              <span className="text-sm font-semibold text-violet-600">{aiFrameCount}</span>
            </div>
            <input
              type="range"
              min={4}
              max={20}
              step={2}
              value={aiFrameCount}
              onChange={(e) => setAiFrameCount(Number(e.target.value))}
              className="mt-2 w-full accent-violet-600"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              More frames = more comprehensive analysis but higher cost/time
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void handleAiAnalyze()}
              disabled={isAiProcessing || !aiVideoPath || !llmAvailable}
              className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-violet-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isAiProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analyzing {aiFrameCount} frames...
                </span>
              ) : (
                `Analyze with AI (${aiFrameCount} frames)`
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setAiVideoPath(null)
                setAiResult(null)
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600"
            >
              Clear
            </button>
          </div>

          {!llmAvailable && (
            <p className="text-xs text-amber-600">
              Configure an LLM provider in Settings to enable AI analysis.
            </p>
          )}

          {aiResult?.error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
              <p className="text-sm text-rose-600">{aiResult.error}</p>
            </div>
          )}

          {aiResult?.analysis && (
            <div className="space-y-4">
              {/* Analysis text */}
              <div className="rounded-xl border border-violet-200 bg-white px-4 py-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-[0.3em] text-violet-600">Analysis</p>
                  {aiResult.framesAnalyzed && (
                    <span className="text-[11px] text-slate-400">{aiResult.framesAnalyzed} frames analyzed</span>
                  )}
                </div>
                <div className="mt-3 max-h-64 overflow-y-auto whitespace-pre-wrap text-sm text-slate-700">
                  {aiResult.analysis}
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (aiResult.analysis) {
                      await window.api.copyToClipboard(aiResult.analysis)
                    }
                  }}
                  className="mt-3 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-violet-600"
                >
                  Copy analysis
                </button>
              </div>

              {/* Suggested tags */}
              {aiResult.tags && aiResult.tags.length > 0 && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                  <p className="text-xs font-medium uppercase tracking-[0.3em] text-emerald-600">Suggested Tags</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {aiResult.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700 shadow-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (aiResult.tags) {
                        await window.api.copyToClipboard(aiResult.tags.join(', '))
                      }
                    }}
                    className="mt-3 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-600"
                  >
                    Copy tags
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {detailsJobId ? (
        <div className="fixed inset-0 z-50 flex">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={handleCloseDetails}
            aria-label="Close details"
          />
          <aside className="relative ml-auto h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Job details</p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">
                  {detailsJob?.type ?? 'Processing'} · {detailsJob?.status ?? ''}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseDetails}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600"
              >
                Close
              </button>
            </div>

            {isDetailsLoading ? (
              <p className="mt-6 text-sm text-slate-500">Loading details...</p>
            ) : detailsError ? (
              <p className="mt-6 text-sm text-rose-600">{detailsError}</p>
            ) : detailsJob ? (
              <div className="mt-6 space-y-4 text-sm text-slate-600">
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Paths</p>
                  <p className="mt-2 text-xs text-slate-500">Input</p>
                  <p className="mt-1 break-words text-sm text-slate-700">{detailsJob.input_path ?? 'n/a'}</p>
                  <p className="mt-3 text-xs text-slate-500">Output</p>
                  <p className="mt-1 break-words text-sm text-slate-700">{detailsJob.output_path ?? 'n/a'}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void handleRevealOutput()}
                      className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600"
                      disabled={!detailsJob.output_path}
                    >
                      Reveal output
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Status</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusTone(detailsJob.status)}`}>
                      {detailsJob.status}
                    </span>
                    <span className="text-xs text-slate-500">
                      Created {new Date(detailsJob.created_at).toLocaleString()}
                    </span>
                    {detailsJob.updated_at ? (
                      <span className="text-xs text-slate-500">
                        Updated {new Date(detailsJob.updated_at).toLocaleString()}
                      </span>
                    ) : null}
                  </div>
                  {detailsJob.progress != null ? (
                    <div className="mt-3">
                      {renderProgress(detailsJob)}
                    </div>
                  ) : null}
                  {formatErrorMessage(detailsJob) ? (
                    <p className="mt-3 text-xs text-rose-600">{formatErrorMessage(detailsJob)}</p>
                  ) : null}
                </div>

                {renderOutputMetadata(detailsJob)}

                <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Log tail</p>
                  {detailsJob.log_tail ? (
                    <pre className="mt-2 max-h-56 overflow-y-auto whitespace-pre-wrap rounded-lg bg-white p-3 text-[11px] text-slate-700">
                      {detailsJob.log_tail}
                    </pre>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500">No logs captured yet.</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void handleCopyLog()}
                      className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600"
                      disabled={!detailsJob.log_tail}
                    >
                      Copy log
                    </button>
                  </div>
                </div>
                {detailsNotice ? (
                  <p className="text-xs text-slate-500">{detailsNotice}</p>
                ) : null}
              </div>
            ) : (
              <p className="mt-6 text-sm text-slate-500">No job selected.</p>
            )}
          </aside>
        </div>
      ) : null}
    </div>
  )
}
