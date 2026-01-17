import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import VideoPlayer from '../components/player/VideoPlayer'
import VideoTagManager from '../components/smart-tagging/VideoTagManager'
import { useVideoSmartTagging } from '../hooks/useSmartTagging'
import { useDownloadsStore } from '../stores/downloads.store'
import type { ImportExportProgressEvent, LibraryIntegrityScanResponse, LibraryStatsResponse, PrivacySettings } from '../../preload/api'

type LibraryVideo = {
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
}

type ScanProgress = {
  scanId: string
  found: number
  processed: number
  inserted: number
  updated: number
  errors: number
  currentPath?: string
}

export default function Library(): JSX.Element {
  const downloads = useDownloadsStore((state) => state.downloads)
  const startPolling = useDownloadsStore((state) => state.startPolling)
  const stopPolling = useDownloadsStore((state) => state.stopPolling)
  const startRealtime = useDownloadsStore((state) => state.startRealtime)
  const stopRealtime = useDownloadsStore((state) => state.stopRealtime)
  const [videos, setVideos] = useState<LibraryVideo[]>([])
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null)
  const [libraryError, setLibraryError] = useState<string | null>(null)
  const [scanStatus, setScanStatus] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scanId, setScanId] = useState<string | null>(null)
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const deferredSearchQuery = useDeferredValue(searchQuery)
  const [containerFilter, setContainerFilter] = useState('all')
  const listRef = useRef<HTMLDivElement | null>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(520)
  const scanIdRef = useRef<string | null>(null)
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null)
  const [privacyError, setPrivacyError] = useState<string | null>(null)
  const [showHidden, setShowHidden] = useState(false)
  const [hiddenPin, setHiddenPin] = useState('')
  const [hiddenPinError, setHiddenPinError] = useState<string | null>(null)
  const [hiddenUnlocked, setHiddenUnlocked] = useState(false)
  const [integrityResult, setIntegrityResult] = useState<LibraryIntegrityScanResponse | null>(null)
  const [integrityStatus, setIntegrityStatus] = useState<string | null>(null)
  const [integrityError, setIntegrityError] = useState<string | null>(null)
  const [isIntegrityScanning, setIsIntegrityScanning] = useState(false)
  const [isIntegrityFixing, setIsIntegrityFixing] = useState(false)
  const [confirmIntegrityFix, setConfirmIntegrityFix] = useState(false)
  const [stats, setStats] = useState<LibraryStatsResponse['stats'] | null>(null)
  const [statsError, setStatsError] = useState<string | null>(null)

  // Import/Export state
  const [selectedVideoIds, setSelectedVideoIds] = useState<Set<string>>(new Set())
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importExportProgress, setImportExportProgress] = useState<ImportExportProgressEvent | null>(null)
  const [importExportError, setImportExportError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  useEffect(() => {
    startPolling(15000)
    startRealtime()

    return () => {
      stopPolling()
      stopRealtime()
    }
  }, [startPolling, startRealtime, stopPolling, stopRealtime])

  useEffect(() => {
    let active = true
    window.api
      .privacyGetSettings()
      .then((result) => {
        if (!active) {
          return
        }
        if (result.ok && result.settings) {
          setPrivacySettings(result.settings)
          setPrivacyError(null)
        } else {
          setPrivacyError(result.error ?? 'Unable to load privacy settings.')
        }
      })
      .catch((error) => {
        if (active) {
          setPrivacyError(error instanceof Error ? error.message : 'Unable to load privacy settings.')
        }
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!privacySettings?.hiddenFolderEnabled) {
      setShowHidden(false)
      setHiddenUnlocked(false)
      setHiddenPin('')
      setHiddenPinError(null)
    }
  }, [privacySettings?.hiddenFolderEnabled])

  const handleUnlockHidden = async (): Promise<void> => {
    if (!hiddenPin.trim()) {
      setHiddenPinError('Enter your PIN to unlock hidden items.')
      return
    }

    try {
      const result = await window.api.privacyVerifyPin(hiddenPin.trim())
      if (result.ok && result.valid) {
        setHiddenUnlocked(true)
        setShowHidden(true)
        setHiddenPin('')
        setHiddenPinError(null)
      } else {
        setHiddenPinError('Incorrect PIN.')
      }
    } catch (error) {
      setHiddenPinError(error instanceof Error ? error.message : 'Unable to verify PIN.')
    }
  }

  const recentDownloads = useMemo(() => downloads.slice(0, 3), [downloads])
  const completedCount = useMemo(
    () => downloads.filter((item) => item.status === 'completed').length,
    [downloads]
  )
  const inProgressCount = useMemo(
    () => downloads.filter((item) => ['queued', 'downloading'].includes(item.status)).length,
    [downloads]
  )
  const activityFeed = useMemo(() => {
    const sorted = [...downloads].sort((a, b) => {
      const aTime = new Date(a.updatedAt ?? a.createdAt).getTime()
      const bTime = new Date(b.updatedAt ?? b.createdAt).getTime()
      return bTime - aTime
    })
    return sorted.slice(0, 5).map((item) => ({
      id: item.id,
      status: item.status,
      title: item.url,
      timestamp: item.updatedAt ?? item.createdAt
    }))
  }, [downloads])

  const formatBytes = (bytes: number | null): string | null => {
    if (!bytes || bytes <= 0) {
      return null
    }
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
    const value = bytes / Math.pow(1024, index)
    return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`
  }

  const formatDuration = (seconds: number | null): string | null => {
    if (!seconds || seconds <= 0) {
      return null
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

  const formatTotalDuration = (seconds: number | null): string | null => {
    if (!seconds || seconds <= 0) {
      return null
    }
    const hrs = Math.floor(seconds / 3600)
    if (hrs >= 1) {
      return `${hrs}h`
    }
    return formatDuration(seconds)
  }

  const formatBitrate = (bitrate: number | null): string | null => {
    if (!bitrate || bitrate <= 0) {
      return null
    }
    const kbps = bitrate / 1000
    if (kbps < 1000) {
      return `${Math.round(kbps)} Kbps`
    }
    const mbps = kbps / 1000
    return `${mbps.toFixed(mbps >= 10 ? 0 : 1)} Mbps`
  }

  const formatResolutionLabel = (width: number | null, height: number | null): string | null => {
    if (!width || !height) {
      return null
    }
    const standards = [2160, 1440, 1080, 720, 480, 360, 240]
    const nearest = standards.reduce((best, current) =>
      Math.abs(height - current) < Math.abs(height - best) ? current : best
    )
    const label = Math.abs(height - nearest) <= 120 ? `${nearest}p` : `${height}p`
    return `${width}x${height} (${label})`
  }

  const formatMetadataLine = (video: LibraryVideo): string | null => {
    const line = [
      formatDuration(video.duration),
      formatBytes(video.file_size),
      formatResolutionLabel(video.width, video.height),
      video.container ? video.container.toUpperCase() : null,
      video.codec ? video.codec.toUpperCase() : null,
      formatBitrate(video.bitrate)
    ]
      .filter(Boolean)
      .join(' · ')
    return line || null
  }

  const loadLibrary = useCallback(async (): Promise<void> => {
    try {
      const result = await window.api.libraryList(showHidden)
      if (result.ok) {
        setVideos(result.videos)
        setLibraryError(null)
      } else {
        setLibraryError('Unable to load library.')
      }
    } catch (err) {
      setLibraryError(err instanceof Error ? err.message : 'Unable to load library.')
    }
  }, [showHidden])

  useEffect(() => {
    void loadLibrary()
  }, [completedCount, loadLibrary])

  // Clean up stale selections when videos change
  useEffect(() => {
    if (selectedVideoIds.size > 0) {
      const videoIdSet = new Set(videos.map((v) => v.id))
      const validSelections = new Set(
        Array.from(selectedVideoIds).filter((id) => videoIdSet.has(id))
      )
      if (validSelections.size !== selectedVideoIds.size) {
        setSelectedVideoIds(validSelections)
      }
    }
  }, [videos, selectedVideoIds])

  useEffect(() => {
    let active = true
    window.api
      .libraryStats()
      .then((result) => {
        if (!active) {
          return
        }
        if (result.ok && result.stats) {
          setStats(result.stats)
          setStatsError(null)
        } else {
          setStatsError(result.error ?? 'Unable to load library stats.')
        }
      })
      .catch((error) => {
        if (active) {
          setStatsError(error instanceof Error ? error.message : 'Unable to load library stats.')
        }
      })
    return () => {
      active = false
    }
  }, [videos.length, completedCount])

  useEffect(() => {
    scanIdRef.current = scanId
  }, [scanId])

  useEffect(() => {
    const unsubscribeProgress = window.api.onLibraryScanProgress((payload) => {
      if (scanIdRef.current && payload.scanId === scanIdRef.current) {
        setScanProgress(payload)
      }
    })

    const unsubscribeComplete = window.api.onLibraryScanComplete((payload) => {
      if (!scanIdRef.current || payload.scanId !== scanIdRef.current) {
        return
      }

      setIsScanning(false)
      setScanId(null)
      setScanProgress(null)

      if (!payload.ok || !payload.result) {
        setLibraryError(payload.error ?? 'Library scan failed.')
        return
      }

      const summary = payload.result.canceled
        ? `Scan canceled · Found ${payload.result.found} files · Added ${payload.result.inserted}`
        : `Found ${payload.result.found} files · Added ${payload.result.inserted} · Updated ${payload.result.updated} · Errors ${payload.result.errors}`
      setScanStatus(summary)
      void loadLibrary()
    })

    return () => {
      unsubscribeProgress()
      unsubscribeComplete()
    }
  }, [loadLibrary])

  const containerOptions = useMemo(() => {
    const containers = new Set<string>()
    for (const video of videos) {
      if (video.container) {
        containers.add(video.container.toLowerCase())
      }
    }
    return Array.from(containers).sort()
  }, [videos])

  const filteredVideos = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase()
    return videos.filter((video) => {
      if (containerFilter !== 'all') {
        if (!video.container || video.container.toLowerCase() !== containerFilter) {
          return false
        }
      }

      if (!query) {
        return true
      }

      const haystack = [
        video.title,
        video.file_name,
        video.file_path
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(query)
    })
  }, [containerFilter, deferredSearchQuery, videos])

  useEffect(() => {
    const updateSize = (): void => {
      if (listRef.current) {
        setViewportHeight(listRef.current.clientHeight)
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => {
      window.removeEventListener('resize', updateSize)
    }
  }, [])

  useEffect(() => {
    if (filteredVideos.length === 0) {
      setSelectedVideoId(null)
      return
    }

    const stillVisible = selectedVideoId && filteredVideos.some((video) => video.id === selectedVideoId)
    if (!stillVisible) {
      setSelectedVideoId(filteredVideos[0].id)
    }
  }, [filteredVideos, selectedVideoId])

  const selectedVideo = useMemo(
    () => filteredVideos.find((video) => video.id === selectedVideoId) ?? null,
    [filteredVideos, selectedVideoId]
  )

  const handleScanLibrary = async (): Promise<void> => {
    setIsScanning(true)
    setLibraryError(null)
    setScanStatus(null)
    setScanProgress(null)

    try {
      const selection = await window.api.librarySelectFolder()
      if (!selection.ok || !selection.path) {
        if (!selection.canceled) {
          setLibraryError(selection.error ?? 'Unable to select a folder.')
        }
        setIsScanning(false)
        return
      }

      const result = await window.api.libraryScanStart(selection.path)
      if (!result.ok || !result.scanId) {
        setLibraryError(result.error ?? 'Unable to start library scan.')
        setIsScanning(false)
        return
      }

      setScanId(result.scanId)
      scanIdRef.current = result.scanId
    } catch (err) {
      setLibraryError(err instanceof Error ? err.message : 'Library scan failed.')
      setIsScanning(false)
    }
  }

  const handleCancelScan = async (): Promise<void> => {
    if (!scanId) {
      return
    }
    try {
      const result = await window.api.libraryScanCancel(scanId)
      if (!result.ok) {
        setLibraryError(result.error ?? 'Unable to cancel scan.')
      }
    } catch (err) {
      setLibraryError(err instanceof Error ? err.message : 'Unable to cancel scan.')
    }
  }

  const handleIntegrityScan = async (): Promise<void> => {
    setIsIntegrityScanning(true)
    setIntegrityStatus(null)
    setIntegrityError(null)
    setIntegrityResult(null)
    setConfirmIntegrityFix(false)
    try {
      const result = await window.api.libraryIntegrityScan()
      if (result.ok) {
        setIntegrityResult(result)
      } else {
        setIntegrityError(result.error ?? 'Unable to run integrity scan.')
      }
    } catch (error) {
      setIntegrityError(error instanceof Error ? error.message : 'Unable to run integrity scan.')
    } finally {
      setIsIntegrityScanning(false)
    }
  }

  const handleIntegrityFix = async (): Promise<void> => {
    if (!integrityResult?.ok) {
      return
    }
    const missingVideoIds = integrityResult.missingVideos?.map((item) => item.id) ?? []
    const missingDownloadIds = integrityResult.missingDownloads?.map((item) => item.id) ?? []
    if (missingVideoIds.length === 0 && missingDownloadIds.length === 0) {
      setIntegrityStatus('No missing entries to fix.')
      setConfirmIntegrityFix(false)
      return
    }

    setIsIntegrityFixing(true)
    setIntegrityStatus(null)
    setIntegrityError(null)
    try {
      const result = await window.api.libraryIntegrityFix({ missingVideoIds, missingDownloadIds })
      if (result.ok) {
        setIntegrityStatus(
          `Removed ${result.removedVideos ?? 0} missing videos · Marked ${result.markedDownloads ?? 0} downloads.`
        )
        setIntegrityResult(null)
        setConfirmIntegrityFix(false)
        void loadLibrary()
      } else {
        setIntegrityError(result.error ?? 'Unable to apply integrity fixes.')
      }
    } catch (error) {
      setIntegrityError(error instanceof Error ? error.message : 'Unable to apply integrity fixes.')
    } finally {
      setIsIntegrityFixing(false)
    }
  }

  // Import/Export event listener
  useEffect(() => {
    const unsubscribe = window.api.onLibraryImportExportEvent((event) => {
      setImportExportProgress(event)
      if (event.status === 'complete') {
        setIsExporting(false)
        setIsImporting(false)
        setImportExportProgress(null)
        void loadLibrary()
      }
      if (event.status === 'error' && event.error) {
        setImportExportError(event.error)
      }
    })
    return () => unsubscribe()
  }, [loadLibrary])

  // Video extensions for drag-drop filtering
  const videoExtensions = new Set(['.mp4', '.mkv', '.mov', '.webm', '.avi', '.flv', '.m4v', '.wmv', '.mpg', '.mpeg'])

  const handleDragOver = (e: React.DragEvent): void => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent): void => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent): Promise<void> => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
      .filter((f) => {
        const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase()
        return videoExtensions.has(ext)
      })
      .map((f) => f.path)

    if (files.length > 0) {
      await handleImportFiles(files)
    }
  }

  const handleImportFiles = async (filePaths: string[]): Promise<void> => {
    setIsImporting(true)
    setImportExportError(null)
    try {
      const result = await window.api.libraryImportVideos({ filePaths })
      if (!result.ok) {
        setImportExportError(result.error ?? 'Import failed')
      }
    } catch (error) {
      setImportExportError(error instanceof Error ? error.message : 'Import failed')
    } finally {
      setIsImporting(false)
      setImportExportProgress(null)
    }
  }

  const handleSelectImportFiles = async (): Promise<void> => {
    const result = await window.api.librarySelectImportFiles()
    if (result.ok && result.paths) {
      await handleImportFiles(result.paths)
    }
  }

  const handleExportSelected = async (): Promise<void> => {
    if (selectedVideoIds.size === 0) return

    const folderResult = await window.api.librarySelectExportFolder()
    if (!folderResult.ok || !folderResult.path) return

    setIsExporting(true)
    setImportExportError(null)
    try {
      const result = await window.api.libraryExportVideos({
        videoIds: Array.from(selectedVideoIds),
        destinationDir: folderResult.path
      })
      if (!result.ok) {
        setImportExportError(result.error ?? 'Export failed')
      }
    } catch (error) {
      setImportExportError(error instanceof Error ? error.message : 'Export failed')
    } finally {
      setIsExporting(false)
      setImportExportProgress(null)
      setSelectedVideoIds(new Set())
      setIsMultiSelectMode(false)
    }
  }

  const toggleVideoSelection = (videoId: string): void => {
    setSelectedVideoIds((prev) => {
      const next = new Set(prev)
      if (next.has(videoId)) {
        next.delete(videoId)
      } else {
        next.add(videoId)
      }
      return next
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 lg:grid-cols-3">
        {[
          { label: 'Downloads completed', value: completedCount.toString(), note: 'Ready for library scan' },
          { label: 'Downloads active', value: inProgressCount.toString(), note: 'Queued or running' },
          { label: 'AI tags ready', value: '--', note: 'No processed videos yet' }
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{card.label}</p>
            <p className="mt-4 text-3xl font-semibold text-slate-900">{card.value}</p>
            <p className="mt-2 text-sm text-slate-500">{card.note}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        {[
          {
            label: 'Total videos',
            value: stats?.videoCount ?? 0,
            note: stats?.hiddenCount ? `${stats.hiddenCount} hidden` : 'Visible by default'
          },
          {
            label: 'Total duration',
            value: formatTotalDuration(stats?.totalDuration ?? 0) ?? '--',
            note: 'Across all videos'
          },
          {
            label: 'Library size',
            value: formatBytes(stats?.totalSize ?? 0) ?? '--',
            note: 'Stored on disk'
          },
          {
            label: 'Failed downloads',
            value: stats?.downloads.failed ?? 0,
            note: 'Check queue for details'
          }
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{card.label}</p>
            <p className="mt-4 text-2xl font-semibold text-slate-900">{card.value}</p>
            <p className="mt-2 text-sm text-slate-500">{card.note}</p>
          </div>
        ))}
        {statsError ? (
          <div className="lg:col-span-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {statsError}
          </div>
        ) : null}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Library timeline</h3>
          <p className="mt-2 text-sm text-slate-500">
            Once scans run, you will see recently ingested videos, AI outputs, and processing activity here.
          </p>
          <div className="mt-6 space-y-4">
            {recentDownloads.length === 0 ? (
              <div className="space-y-3">
                {['Scan a folder to populate your collection', 'Track metadata + thumbnails', 'Attach AI tags & notes'].map(
                  (item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 px-4 py-3"
                    >
                      <span className="text-lg">-</span>
                      <span className="text-sm text-slate-600">{item}</span>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {recentDownloads.map((item) => (
                  <div key={item.id} className="rounded-xl border border-slate-200 px-4 py-3">
                    <p className="truncate text-sm font-semibold text-slate-900">{item.url}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {item.status} · {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Recent files</p>
              {libraryError ? (
                <p className="mt-2 text-sm text-rose-600">{libraryError}</p>
              ) : videos.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">No completed files yet.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {videos.slice(0, 3).map((video) => (
                    <div key={video.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                      <p className="truncate text-sm font-semibold text-slate-900">{video.title ?? video.file_name}</p>
                      <p className="mt-1 truncate text-xs text-slate-400">{video.file_path}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatMetadataLine(video) ?? 'Metadata pending'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/70 bg-slate-900 p-6 text-white shadow-lg shadow-slate-900/20">
          <div>
            <h3 className="text-lg font-semibold">Activity feed</h3>
            <p className="mt-2 text-sm text-slate-300">Latest download and processing events.</p>
          </div>
          {activityFeed.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-slate-300">
              No recent activity
            </div>
          ) : (
            <div className="space-y-3">
              {activityFeed.map((item) => (
                <div key={item.id} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="truncate text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-300">
                    {item.status} · {new Date(item.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            className="mt-auto w-full rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900"
          >
            Open activity log
          </button>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div
          className="relative rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={(e) => void handleDrop(e)}
        >
          {/* Drop zone overlay */}
          {isDragOver && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl border-2 border-dashed border-slate-400 bg-slate-50/95">
              <div className="text-center">
                <p className="text-lg font-semibold text-slate-700">Drop videos here to import</p>
                <p className="mt-1 text-sm text-slate-500">Videos will be copied to your library</p>
              </div>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-900">Library catalog</h3>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {videos.length
                  ? `${filteredVideos.length} / ${videos.length}`
                  : 'Empty'}
              </span>
              <button
                type="button"
                onClick={() => void handleScanLibrary()}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600"
                disabled={isScanning}
              >
                {isScanning ? 'Scanning...' : 'Scan folder'}
              </button>
              {isScanning && scanId ? (
                <button
                  type="button"
                  onClick={() => void handleCancelScan()}
                  className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-600"
                >
                  Cancel
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => void handleSelectImportFiles()}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600"
                disabled={isImporting || isExporting}
              >
                {isImporting ? 'Importing...' : 'Import'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMultiSelectMode(!isMultiSelectMode)
                  if (isMultiSelectMode) setSelectedVideoIds(new Set())
                }}
                className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                  isMultiSelectMode
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 text-slate-600'
                }`}
                disabled={isImporting || isExporting}
              >
                {isMultiSelectMode ? `${selectedVideoIds.size} selected` : 'Select'}
              </button>
              {isMultiSelectMode && selectedVideoIds.size > 0 && (
                <button
                  type="button"
                  onClick={() => void handleExportSelected()}
                  className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white"
                  disabled={isExporting}
                >
                  {isExporting ? 'Exporting...' : `Export ${selectedVideoIds.size}`}
                </button>
              )}
            </div>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            {isMultiSelectMode
              ? 'Click videos to select them for export.'
              : 'Select a video to inspect metadata and smart tags. Drag videos here to import.'}
          </p>
          {scanStatus ? <p className="mt-3 text-xs text-emerald-600">{scanStatus}</p> : null}
          {libraryError ? <p className="mt-2 text-xs text-rose-600">{libraryError}</p> : null}
          {importExportError ? <p className="mt-2 text-xs text-rose-600">{importExportError}</p> : null}
          {(isImporting || isExporting) && importExportProgress && (
            <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span>
                  {importExportProgress.operationType === 'import' ? 'Importing' : 'Exporting'}{' '}
                  {importExportProgress.current} / {importExportProgress.total}
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-slate-900 transition-all"
                  style={{
                    width: `${
                      importExportProgress.total > 0
                        ? Math.round((importExportProgress.current / importExportProgress.total) * 100)
                        : 0
                    }%`
                  }}
                />
              </div>
              <p className="mt-2 truncate text-[11px] text-slate-400">{importExportProgress.currentFile}</p>
            </div>
          )}
          <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">Library integrity</p>
                <p className="mt-1 text-xs text-slate-500">Check for missing files and stale downloads.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleIntegrityScan()}
                  className="rounded-full border border-slate-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600"
                  disabled={isIntegrityScanning}
                >
                  {isIntegrityScanning ? 'Scanning...' : 'Run scan'}
                </button>
                {integrityResult?.summary &&
                (integrityResult.summary.missingVideos > 0 || integrityResult.summary.missingDownloads > 0) ? (
                  confirmIntegrityFix ? (
                    <>
                      <button
                        type="button"
                        onClick={() => void handleIntegrityFix()}
                        className="rounded-full bg-rose-600 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white"
                        disabled={isIntegrityFixing}
                      >
                        {isIntegrityFixing ? 'Fixing...' : 'Confirm'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmIntegrityFix(false)}
                        className="rounded-full border border-slate-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmIntegrityFix(true)}
                      className="rounded-full border border-rose-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-rose-600"
                    >
                      Fix missing
                    </button>
                  )
                ) : null}
              </div>
            </div>
            {integrityStatus ? <p className="mt-2 text-xs text-emerald-600">{integrityStatus}</p> : null}
            {integrityError ? <p className="mt-2 text-xs text-rose-600">{integrityError}</p> : null}
            {integrityResult?.summary ? (
              <div className="mt-3 space-y-2">
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                  <span>{integrityResult.summary.missingVideos} missing videos</span>
                  <span>{integrityResult.summary.missingDownloads} missing downloads</span>
                </div>
                {integrityResult.missingVideos && integrityResult.missingVideos.length > 0 ? (
                  <div className="space-y-1">
                    {integrityResult.missingVideos.slice(0, 3).map((item) => (
                      <div key={item.id} className="truncate text-[11px] text-slate-400">
                        Missing: {item.title ?? item.file_name ?? item.file_path}
                      </div>
                    ))}
                  </div>
                ) : null}
                {integrityResult.missingDownloads && integrityResult.missingDownloads.length > 0 ? (
                  <div className="space-y-1">
                    {integrityResult.missingDownloads.slice(0, 3).map((item) => (
                      <div key={item.id} className="truncate text-[11px] text-slate-400">
                        Download missing: {item.url}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
          {isScanning && scanProgress ? (
            <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span>
                  {scanProgress.processed} / {scanProgress.found} processed
                </span>
                <span>
                  +{scanProgress.inserted} · {scanProgress.updated} updated · {scanProgress.errors} errors
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-slate-900 transition-all"
                  style={{
                    width: `${scanProgress.found > 0 ? Math.min(100, Math.round((scanProgress.processed / scanProgress.found) * 100)) : 0}%`
                  }}
                />
              </div>
              {scanProgress.currentPath ? (
                <p className="mt-2 truncate text-[11px] text-slate-400">
                  {scanProgress.currentPath}
                </p>
              ) : null}
            </div>
          ) : null}
          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_180px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search title or path"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 outline-none focus:border-slate-400"
            />
            <select
              value={containerFilter}
              onChange={(event) => setContainerFilter(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
            >
              <option value="all">All formats</option>
              {containerOptions.map((container) => (
                <option key={container} value={container}>
                  {container.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          {privacySettings?.hiddenFolderEnabled ? (
            <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  <input
                    type="checkbox"
                    checked={showHidden}
                    onChange={(event) => {
                      const next = event.target.checked
                      setShowHidden(next)
                      if (!next) {
                        setHiddenUnlocked(false)
                        setHiddenPin('')
                        setHiddenPinError(null)
                      }
                    }}
                    disabled={(privacySettings?.pinSet ?? false) && !hiddenUnlocked}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900"
                  />
                  Show hidden items
                </label>
                {(privacySettings?.pinSet ?? false) && !hiddenUnlocked ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="password"
                      value={hiddenPin}
                      onChange={(event) => setHiddenPin(event.target.value)}
                      placeholder="PIN"
                      className="w-32 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600"
                    />
                    <button
                      type="button"
                      onClick={() => void handleUnlockHidden()}
                      className="rounded-full border border-slate-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600"
                    >
                      Unlock
                    </button>
                  </div>
                ) : null}
              </div>
              {hiddenPinError ? <p className="mt-2 text-xs text-rose-500">{hiddenPinError}</p> : null}
            </div>
          ) : null}
          <div className="mt-4 space-y-3">
            {filteredVideos.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
                {videos.length === 0 ? 'No videos in the library yet.' : 'No videos match this filter.'}
              </div>
            ) : (
              <div
                ref={listRef}
                className="max-h-[520px] overflow-y-auto pr-1"
                onScroll={(event) => {
                  setScrollTop(event.currentTarget.scrollTop)
                }}
              >
                {(() => {
                  const itemHeight = 104
                  const overscan = 6
                  const totalHeight = filteredVideos.length * itemHeight
                  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
                  const endIndex = Math.min(
                    filteredVideos.length,
                    Math.ceil((scrollTop + viewportHeight) / itemHeight) + overscan
                  )
                  const visibleItems = filteredVideos.slice(startIndex, endIndex)
                  const offsetY = startIndex * itemHeight

                  return (
                    <div style={{ height: totalHeight, position: 'relative' }}>
                      <div
                        className="absolute left-0 right-0 space-y-2"
                        style={{ transform: `translateY(${offsetY}px)` }}
                      >
                        {visibleItems.map((video) => {
                          const isSelected = video.id === selectedVideoId
                          const isChecked = selectedVideoIds.has(video.id)
                          return (
                            <button
                              key={video.id}
                              type="button"
                              onClick={() => {
                                if (isMultiSelectMode) {
                                  toggleVideoSelection(video.id)
                                } else {
                                  setSelectedVideoId(video.id)
                                }
                              }}
                              className={`h-[96px] w-full rounded-xl border px-4 py-3 text-left transition ${
                                isMultiSelectMode && isChecked
                                  ? 'border-blue-500 bg-blue-50 text-slate-900'
                                  : isSelected
                                    ? 'border-slate-900 bg-slate-900 text-white'
                                    : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                {isMultiSelectMode && (
                                  <div
                                    className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border ${
                                      isChecked
                                        ? 'border-blue-500 bg-blue-500'
                                        : 'border-slate-300 bg-white'
                                    }`}
                                  >
                                    {isChecked && (
                                      <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                          fillRule="evenodd"
                                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    )}
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold">
                                    {video.title ?? video.file_name ?? 'Untitled'}
                                  </p>
                                  <p
                                    className={`mt-1 truncate text-xs ${
                                      isMultiSelectMode && isChecked
                                        ? 'text-slate-500'
                                        : isSelected
                                          ? 'text-slate-200'
                                          : 'text-slate-400'
                                    }`}
                                  >
                                    {video.file_path}
                                  </p>
                                  <p
                                    className={`mt-1 text-xs ${
                                      isMultiSelectMode && isChecked
                                        ? 'text-slate-600'
                                        : isSelected
                                          ? 'text-slate-200'
                                          : 'text-slate-500'
                                    }`}
                                  >
                                    {formatMetadataLine(video) ?? 'Metadata pending'}
                                  </p>
                                  {video.is_hidden ? (
                                    <span
                                      className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                        isSelected && !isMultiSelectMode
                                          ? 'bg-white/20 text-white'
                                          : 'bg-slate-100 text-slate-500'
                                      }`}
                                    >
                                      Hidden
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Video details</h3>
          <p className="mt-2 text-sm text-slate-500">
            Review file metadata, manage tags, and trigger smart tagging analysis.
          </p>
          <div className="mt-5">
            {selectedVideo ? (
              <LibraryVideoDetails
                video={selectedVideo}
                formatMetadataLine={formatMetadataLine}
                showPreview={privacySettings?.showThumbnails ?? true}
                privacyError={privacyError}
                onRefresh={() => void loadLibrary()}
              />
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
                Select a video from the catalog to see details.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

function LibraryVideoDetails({
  video,
  formatMetadataLine,
  showPreview,
  privacyError,
  onRefresh
}: {
  video: LibraryVideo
  formatMetadataLine: (video: LibraryVideo) => string | null
  showPreview: boolean
  privacyError: string | null
  onRefresh: () => void
}): JSX.Element {
  const {
    tags,
    isIndexed,
    frameCount,
    suggestions,
    taxonomy,
    llmAvailable,
    isIndexing,
    isSuggesting,
    index,
    suggest,
    regenerate,
    acceptTag,
    rejectTag,
    addTag,
    removeTag,
    lockTag,
    unlockTag
  } = useVideoSmartTagging(video.id, video.file_path)
  const [actionStatus, setActionStatus] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isMutating, setIsMutating] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [summaryStatus, setSummaryStatus] = useState<string | null>(null)
  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [transcriptText, setTranscriptText] = useState('')
  const [transcriptDraft, setTranscriptDraft] = useState('')
  const [transcriptStatus, setTranscriptStatus] = useState<string | null>(null)
  const [transcriptError, setTranscriptError] = useState<string | null>(null)
  const [isTranscriptLoading, setIsTranscriptLoading] = useState(false)
  const [isTranscriptSaving, setIsTranscriptSaving] = useState(false)
  const [isTranscriptCleaning, setIsTranscriptCleaning] = useState(false)
  const [captionStatus, setCaptionStatus] = useState<string | null>(null)
  const [captionError, setCaptionError] = useState<string | null>(null)
  const [isCaptionExporting, setIsCaptionExporting] = useState(false)
  const [exportTarget, setExportTarget] = useState<string | null>(null)
  const [exportTranscript, setExportTranscript] = useState(true)
  const [exportSummary, setExportSummary] = useState(false)
  const [exportCaptions, setExportCaptions] = useState(true)
  const [exportMetadata, setExportMetadata] = useState(false)
  const [exportStatus, setExportStatus] = useState<string | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const isHidden = Boolean(video.is_hidden)

  useEffect(() => {
    setActionStatus(null)
    setActionError(null)
    setConfirmDelete(false)
    setSummaryStatus(null)
    setSummaryError(null)
    setTranscriptStatus(null)
    setTranscriptError(null)
    setCaptionStatus(null)
    setCaptionError(null)
    setExportStatus(null)
    setExportError(null)
  }, [video.id])

  useEffect(() => {
    let active = true
    setIsTranscriptLoading(true)
    window.api
      .libraryGetTranscript(video.id)
      .then((result) => {
        if (!active) {
          return
        }
        if (result.ok) {
          const text = result.transcript ?? ''
          setTranscriptText(text)
          setTranscriptDraft(text)
          setTranscriptError(null)
        } else {
          setTranscriptError(result.error ?? 'Unable to load transcript.')
        }
      })
      .catch((error) => {
        if (active) {
          setTranscriptError(error instanceof Error ? error.message : 'Unable to load transcript.')
        }
      })
      .finally(() => {
        if (active) {
          setIsTranscriptLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [video.id])

  const handleToggleHidden = async (): Promise<void> => {
    setIsMutating(true)
    setActionStatus(null)
    setActionError(null)
    try {
      const result = await window.api.librarySetHidden({
        videoId: video.id,
        hidden: !isHidden
      })
      if (result.ok) {
        setActionStatus(isHidden ? 'Removed from hidden items.' : 'Marked as hidden.')
        onRefresh()
      } else {
        setActionError(result.error ?? 'Unable to update hidden status.')
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to update hidden status.')
    } finally {
      setIsMutating(false)
    }
  }

  const handleDelete = async (): Promise<void> => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setIsMutating(true)
    setActionStatus(null)
    setActionError(null)
    try {
      const result = await window.api.libraryDeleteVideo({ videoId: video.id })
      if (result.ok) {
        setActionStatus('Video deleted from library.')
        onRefresh()
      } else {
        setActionError(result.error ?? 'Unable to delete video.')
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to delete video.')
    } finally {
      setIsMutating(false)
      setConfirmDelete(false)
    }
  }

  const handleSummarize = async (): Promise<void> => {
    setIsSummarizing(true)
    setSummaryStatus(null)
    setSummaryError(null)
    try {
      const result = await window.api.llmSummarizeVideo(video.id)
      if (result.ok) {
        setSummaryStatus('Summary generated.')
        onRefresh()
      } else {
        setSummaryError(result.error ?? 'Unable to generate summary.')
      }
    } catch (error) {
      setSummaryError(error instanceof Error ? error.message : 'Unable to generate summary.')
    } finally {
      setIsSummarizing(false)
    }
  }

  const handleSaveTranscript = async (): Promise<void> => {
    setTranscriptStatus(null)
    setTranscriptError(null)
    setIsTranscriptSaving(true)
    try {
      const result = await window.api.libraryUpdateTranscript({
        videoId: video.id,
        transcript: transcriptDraft
      })
      if (result.ok) {
        setTranscriptText(transcriptDraft)
        setTranscriptStatus('Transcript saved.')
      } else {
        setTranscriptError(result.error ?? 'Unable to save transcript.')
      }
    } catch (error) {
      setTranscriptError(error instanceof Error ? error.message : 'Unable to save transcript.')
    } finally {
      setIsTranscriptSaving(false)
    }
  }

  const handleCleanupTranscript = async (): Promise<void> => {
    setIsTranscriptCleaning(true)
    setTranscriptStatus(null)
    setTranscriptError(null)
    try {
      const result = await window.api.llmCleanupTranscript(video.id)
      if (result.ok && result.transcript !== undefined) {
        setTranscriptDraft(result.transcript)
        setTranscriptStatus('Transcript cleaned. Review and save.')
      } else {
        setTranscriptError(result.error ?? 'Unable to clean transcript.')
      }
    } catch (error) {
      setTranscriptError(error instanceof Error ? error.message : 'Unable to clean transcript.')
    } finally {
      setIsTranscriptCleaning(false)
    }
  }

  const handleExportCaptions = async (): Promise<void> => {
    setIsCaptionExporting(true)
    setCaptionStatus(null)
    setCaptionError(null)
    try {
      const result = await window.api.libraryExportCaptions({ videoId: video.id })
      if (result.ok && result.path) {
        setCaptionStatus('Captions exported.')
        await window.api.revealInFolder(result.path)
      } else {
        setCaptionError(result.error ?? 'Unable to export captions.')
      }
    } catch (error) {
      setCaptionError(error instanceof Error ? error.message : 'Unable to export captions.')
    } finally {
      setIsCaptionExporting(false)
    }
  }

  const handleSelectExportFolder = async (): Promise<void> => {
    try {
      const result = await window.api.librarySelectExportFolder()
      if (result.ok && result.path) {
        setExportTarget(result.path)
        setExportError(null)
      } else if (!result.canceled) {
        setExportError(result.error ?? 'Unable to select export folder.')
      }
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Unable to select export folder.')
    }
  }

  const handleExportAssets = async (): Promise<void> => {
    setIsExporting(true)
    setExportStatus(null)
    setExportError(null)
    try {
      const result = await window.api.libraryExportAssets({
        videoId: video.id,
        includeTranscript: exportTranscript,
        includeSummary: exportSummary,
        includeCaptions: exportCaptions,
        includeMetadata: exportMetadata,
        targetDir: exportTarget
      })
      if (result.ok) {
        setExportStatus(`Exported ${result.files?.length ?? 0} files.`)
      } else {
        setExportError(result.error ?? 'Unable to export assets.')
      }
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Unable to export assets.')
    } finally {
      setIsExporting(false)
    }
  }

  const videoSrc = useMemo(() => {
    try {
      return window.api.toFileUrl(video.file_path)
    } catch {
      return null
    }
  }, [video.file_path])

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Selected video</p>
        <p className="mt-2 text-sm font-semibold text-slate-900">
          {video.title ?? video.file_name ?? 'Untitled'}
        </p>
        <p className="mt-1 truncate text-xs text-slate-500">{video.file_path}</p>
        <p className="mt-2 text-xs text-slate-600">{formatMetadataLine(video) ?? 'Metadata pending'}</p>
        <p className="mt-2 text-xs text-slate-400">
          {isIndexed ? `Indexed frames: ${frameCount ?? 'unknown'}` : 'Not indexed yet'}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handleToggleHidden()}
            className="rounded-full border border-slate-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600"
            disabled={isMutating}
          >
            {isHidden ? 'Unhide' : 'Hide'}
          </button>
          <button
            type="button"
            onClick={() => void handleDelete()}
            className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide ${
              confirmDelete ? 'bg-rose-600 text-white' : 'border border-rose-200 text-rose-600'
            }`}
            disabled={isMutating}
          >
            {confirmDelete ? 'Confirm delete' : 'Delete'}
          </button>
          {confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="rounded-full border border-slate-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600"
            >
              Cancel
            </button>
          ) : null}
        </div>
        {actionStatus ? <p className="mt-2 text-xs text-emerald-600">{actionStatus}</p> : null}
        {actionError ? <p className="mt-2 text-xs text-rose-600">{actionError}</p> : null}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Player</p>
        <div className="mt-3">
          {!showPreview ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-center text-xs text-slate-300">
              <p className="text-sm font-semibold text-slate-100">Preview hidden</p>
              <p>Enable thumbnails in privacy settings to show previews.</p>
              {privacyError ? <p className="text-rose-400">{privacyError}</p> : null}
            </div>
          ) : videoSrc ? (
            <VideoPlayer videoId={video.id} src={videoSrc} />
          ) : (
            <div className="flex h-48 items-center justify-center rounded-lg bg-slate-900 text-xs text-slate-300">
              Preview unavailable
            </div>
          )}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          If playback fails, confirm the file exists and has read permissions.
        </p>
      </div>

      <VideoTagManager
        videoId={video.id}
        videoTitle={video.title ?? undefined}
        tags={tags}
        taxonomy={taxonomy}
        suggestions={suggestions}
        isIndexed={isIndexed}
        isIndexing={isIndexing}
        isSuggesting={isSuggesting}
        llmAvailable={llmAvailable}
        onIndex={() => void index()}
        onSuggest={(useLLM) => void suggest(useLLM, video.title ?? undefined)}
        onAcceptTag={(tagName) => void acceptTag(tagName)}
        onRejectTag={(tagName) => void rejectTag(tagName)}
        onAddTag={(tagName, lock) => void addTag(tagName, lock)}
        onRemoveTag={(tagName, force) => void removeTag(tagName, force)}
        onLockTag={(tagName) => void lockTag(tagName)}
        onUnlockTag={(tagName) => void unlockTag(tagName)}
        onRegenerate={() => void regenerate()}
      />

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Transcript</p>
            <p className="mt-2 text-sm text-slate-700">
              {transcriptText ? 'Edit or clean the transcript.' : 'No transcript attached yet.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleCleanupTranscript()}
              className="rounded-full border border-slate-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600"
              disabled={isTranscriptCleaning || isTranscriptLoading}
            >
              {isTranscriptCleaning ? 'Cleaning...' : 'AI cleanup'}
            </button>
            <button
              type="button"
              onClick={() => void handleExportCaptions()}
              className="rounded-full border border-slate-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600"
              disabled={isCaptionExporting || isTranscriptLoading}
            >
              {isCaptionExporting ? 'Exporting...' : 'Export VTT'}
            </button>
            <button
              type="button"
              onClick={() => void handleSaveTranscript()}
              className="rounded-full bg-slate-900 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white"
              disabled={isTranscriptSaving || isTranscriptLoading}
            >
              {isTranscriptSaving ? 'Saving...' : 'Save transcript'}
            </button>
          </div>
        </div>
        <div className="mt-3">
          <textarea
            value={transcriptDraft}
            onChange={(event) => setTranscriptDraft(event.target.value)}
            placeholder={isTranscriptLoading ? 'Loading transcript...' : 'Transcript will appear here.'}
            className="min-h-[140px] w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
          />
        </div>
        {transcriptStatus ? <p className="mt-2 text-xs text-emerald-600">{transcriptStatus}</p> : null}
        {transcriptError ? <p className="mt-2 text-xs text-rose-600">{transcriptError}</p> : null}
        {captionStatus ? <p className="mt-2 text-xs text-emerald-600">{captionStatus}</p> : null}
        {captionError ? <p className="mt-2 text-xs text-rose-600">{captionError}</p> : null}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Export + share</p>
            <p className="mt-2 text-sm text-slate-700">Bundle transcripts, captions, and metadata for sharing.</p>
          </div>
          <button
            type="button"
            onClick={() => void handleSelectExportFolder()}
            className="rounded-full border border-slate-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600"
          >
            {exportTarget ? 'Change folder' : 'Choose folder'}
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {exportTarget ?? 'Default: video folder'}
        </p>
        <div className="mt-3 grid gap-2 text-[11px] text-slate-500 sm:grid-cols-2">
          {[
            { label: 'Transcript (.txt)', value: exportTranscript, setter: setExportTranscript },
            { label: 'Summary (.summary.txt)', value: exportSummary, setter: setExportSummary },
            { label: 'Captions (.vtt)', value: exportCaptions, setter: setExportCaptions },
            { label: 'Metadata (.json)', value: exportMetadata, setter: setExportMetadata }
          ].map((item) => (
            <label key={item.label} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={item.value}
                onChange={(event) => item.setter(event.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900"
              />
              {item.label}
            </label>
          ))}
        </div>
        <button
          type="button"
          onClick={() => void handleExportAssets()}
          disabled={isExporting}
          className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isExporting ? 'Exporting...' : 'Export selected assets'}
        </button>
        {exportStatus ? <p className="mt-2 text-xs text-emerald-600">{exportStatus}</p> : null}
        {exportError ? <p className="mt-2 text-xs text-rose-600">{exportError}</p> : null}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">AI summary</p>
            <p className="mt-2 text-sm text-slate-700">
              {video.summary ? 'Summary ready.' : 'Generate a quick summary from the transcript.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleSummarize()}
            className="rounded-full bg-slate-900 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white"
            disabled={isSummarizing}
          >
            {isSummarizing ? 'Summarizing...' : video.summary ? 'Regenerate' : 'Generate'}
          </button>
        </div>
        <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-3 text-sm text-slate-600">
          {video.summary ? (
            <p className="whitespace-pre-wrap">{video.summary}</p>
          ) : (
            <p className="text-xs text-slate-500">No summary generated yet.</p>
          )}
        </div>
        {summaryStatus ? <p className="mt-2 text-xs text-emerald-600">{summaryStatus}</p> : null}
        {summaryError ? <p className="mt-2 text-xs text-rose-600">{summaryError}</p> : null}
      </div>
    </div>
  )
}
