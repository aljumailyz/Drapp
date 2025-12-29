import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import VideoPlayer from '../components/player/VideoPlayer'
import VideoThumbnail from '../components/video/VideoThumbnail'

type Video = {
  id: string
  file_path: string
  file_name: string | null
  title: string | null
  duration: number | null
  width: number | null
  height: number | null
  file_size: number | null
  created_at: string
}

type SortOption = 'recent' | 'title' | 'duration' | 'size'
type ViewMode = 'grid' | 'list'

function formatDuration(seconds: number | null): string {
  if (seconds == null || !Number.isFinite(seconds)) return '--:--'
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }
  return `${mins}:${String(secs).padStart(2, '0')}`
}

function formatFileSize(bytes: number | null): string {
  if (bytes == null) return '--'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function formatResolution(width: number | null, height: number | null): string {
  if (!width || !height) return ''
  if (height >= 2160) return '4K'
  if (height >= 1440) return '1440p'
  if (height >= 1080) return '1080p'
  if (height >= 720) return '720p'
  if (height >= 480) return '480p'
  return `${width}x${height}`
}

export default function Watch(): JSX.Element {
  const [videos, setVideos] = useState<Video[]>([])
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Load videos
  useEffect(() => {
    let active = true
    setIsLoading(true)

    window.api
      .libraryList(false)
      .then((result) => {
        if (active && result.ok) {
          setVideos(result.videos)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      if (e.key === 'Escape' && selectedVideo) {
        setSelectedVideo(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedVideo])

  // Filter and sort videos
  const filteredVideos = useMemo(() => {
    let result = [...videos]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (v) =>
          v.title?.toLowerCase().includes(query) ||
          v.file_name?.toLowerCase().includes(query) ||
          v.file_path.toLowerCase().includes(query)
      )
    }

    // Sort
    switch (sortBy) {
      case 'title':
        result.sort((a, b) => (a.title || a.file_name || '').localeCompare(b.title || b.file_name || ''))
        break
      case 'duration':
        result.sort((a, b) => (b.duration ?? 0) - (a.duration ?? 0))
        break
      case 'size':
        result.sort((a, b) => (b.file_size ?? 0) - (a.file_size ?? 0))
        break
      case 'recent':
      default:
        result.sort((a, b) => {
          const timeA = a.created_at ? new Date(a.created_at).getTime() : 0
          const timeB = b.created_at ? new Date(b.created_at).getTime() : 0
          return (Number.isFinite(timeB) ? timeB : 0) - (Number.isFinite(timeA) ? timeA : 0)
        })
    }

    return result
  }, [videos, searchQuery, sortBy])

  const handleVideoSelect = useCallback((video: Video) => {
    setSelectedVideo(video)
  }, [])

  const handleClosePlayer = useCallback(() => {
    setSelectedVideo(null)
  }, [])

  const getVideoSrc = useCallback((filePath: string) => {
    try {
      return window.api.toFileUrl(filePath)
    } catch {
      return null
    }
  }, [])

  // Full-screen player view
  if (selectedVideo) {
    const videoSrc = getVideoSrc(selectedVideo.file_path)
    return (
      <div className="fixed inset-0 z-50 bg-black">
        <div className="absolute left-4 top-4 z-50 flex items-center gap-4">
          <button
            type="button"
            onClick={handleClosePlayer}
            className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/20"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Library
          </button>
        </div>
        <div className="flex h-full items-center justify-center p-8 pt-16">
          {videoSrc ? (
            <div className="w-full max-w-7xl">
              <VideoPlayer
                videoId={selectedVideo.id}
                src={videoSrc}
                title={selectedVideo.title || selectedVideo.file_name || 'Untitled'}
                onClose={handleClosePlayer}
              />
              <div className="mt-4 text-center">
                <h2 className="text-xl font-semibold text-white">
                  {selectedVideo.title || selectedVideo.file_name || 'Untitled'}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {formatDuration(selectedVideo.duration)} · {formatResolution(selectedVideo.width, selectedVideo.height)} · {formatFileSize(selectedVideo.file_size)}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-400">
              <p className="text-lg font-medium">Unable to load video</p>
              <p className="mt-2 text-sm">The file may have been moved or deleted.</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search videos... (⌘F)"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-purple-500 focus:outline-none"
        >
          <option value="recent">Recent</option>
          <option value="title">Title</option>
          <option value="duration">Duration</option>
          <option value="size">Size</option>
        </select>

        {/* View Mode Toggle */}
        <div className="flex rounded-xl border border-slate-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              viewMode === 'grid' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              viewMode === 'list' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-4 text-sm text-slate-500">
        <span>{filteredVideos.length} videos</span>
        {searchQuery && <span>matching "{searchQuery}"</span>}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-purple-600" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredVideos.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-20">
          <svg className="h-16 w-16 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p className="mt-4 text-lg font-medium text-slate-600">No videos found</p>
          <p className="mt-2 text-sm text-slate-400">
            {searchQuery ? 'Try a different search term' : 'Scan a folder in the Library tab to add videos'}
          </p>
        </div>
      )}

      {/* Grid View */}
      {!isLoading && viewMode === 'grid' && filteredVideos.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredVideos.map((video) => (
            <VideoCard key={video.id} video={video} onClick={() => handleVideoSelect(video)} />
          ))}
        </div>
      )}

      {/* List View */}
      {!isLoading && viewMode === 'list' && filteredVideos.length > 0 && (
        <div className="space-y-2">
          {filteredVideos.map((video) => (
            <VideoListItem key={video.id} video={video} onClick={() => handleVideoSelect(video)} />
          ))}
        </div>
      )}
    </div>
  )
}

// Video Card Component for Grid View
function VideoCard({ video, onClick }: { video: Video; onClick: () => void }): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white text-left transition hover:border-slate-300 hover:shadow-lg"
    >
      {/* Thumbnail with hover preview */}
      <VideoThumbnail
        videoId={video.id}
        videoPath={video.file_path}
        duration={video.duration}
        width={video.width}
        height={video.height}
        className="aspect-video"
        hoverPreview
      />

      {/* Info */}
      <div className="p-3">
        <h3 className="truncate text-sm font-medium text-slate-900">
          {video.title || video.file_name || 'Untitled'}
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          {formatFileSize(video.file_size)}
        </p>
      </div>
    </button>
  )
}

// Video List Item for List View
function VideoListItem({ video, onClick }: { video: Video; onClick: () => void }): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-slate-300 hover:bg-slate-50"
    >
      {/* Thumbnail */}
      <VideoThumbnail
        videoId={video.id}
        videoPath={video.file_path}
        duration={video.duration}
        width={video.width}
        height={video.height}
        className="h-16 w-28 flex-shrink-0 rounded-lg"
        showResolution={false}
        hoverPreview={false}
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="truncate text-sm font-medium text-slate-900">
          {video.title || video.file_name || 'Untitled'}
        </h3>
        <p className="mt-1 truncate text-xs text-slate-500">{video.file_path}</p>
      </div>

      {/* Meta */}
      <div className="flex flex-shrink-0 items-center gap-4 text-xs text-slate-500">
        {video.height && video.height >= 720 && (
          <span className="rounded bg-purple-100 px-2 py-0.5 font-medium text-purple-700">
            {formatResolution(video.width, video.height)}
          </span>
        )}
        <span>{formatFileSize(video.file_size)}</span>
      </div>

      {/* Play Icon */}
      <div className="flex-shrink-0 rounded-full bg-slate-100 p-2 text-slate-600 transition group-hover:bg-purple-100 group-hover:text-purple-600">
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </button>
  )
}
