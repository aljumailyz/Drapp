import { useState, useEffect, useRef, useCallback } from 'react'

type VideoThumbnailProps = {
  videoId: string
  videoPath: string
  duration?: number | null
  width?: number | null
  height?: number | null
  className?: string
  showDuration?: boolean
  showResolution?: boolean
  hoverPreview?: boolean
}

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

function formatResolution(width: number | null | undefined, height: number | null | undefined): string {
  if (!width || !height) return ''
  if (height >= 2160) return '4K'
  if (height >= 1440) return '1440p'
  if (height >= 1080) return '1080p'
  if (height >= 720) return '720p'
  if (height >= 480) return '480p'
  return `${width}x${height}`
}

// Cache thumbnails in memory
const thumbnailCache = new Map<string, string>()

export default function VideoThumbnail({
  videoId,
  videoPath,
  duration,
  width,
  height,
  className = '',
  showDuration = true,
  showResolution = true,
  hoverPreview = true
}: VideoThumbnailProps): JSX.Element {
  const [thumbnail, setThumbnail] = useState<string | null>(thumbnailCache.get(videoId) || null)
  const [isLoading, setIsLoading] = useState(!thumbnailCache.has(videoId))
  const [error, setError] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [previewReady, setPreviewReady] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load thumbnail on mount
  useEffect(() => {
    if (thumbnailCache.has(videoId)) {
      setThumbnail(thumbnailCache.get(videoId)!)
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)

    window.api
      .processingGenerateThumbnail({ videoPath, videoId })
      .then((result) => {
        if (cancelled) return
        if (result.ok && result.thumbnailBase64) {
          thumbnailCache.set(videoId, result.thumbnailBase64)
          setThumbnail(result.thumbnailBase64)
        } else {
          setError(true)
        }
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [videoId, videoPath])

  // Handle hover preview
  const handleMouseEnter = useCallback(() => {
    if (!hoverPreview) return

    // Delay hover preview to avoid accidental triggers
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovering(true)
    }, 300)
  }, [hoverPreview])

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    setIsHovering(false)
    setPreviewReady(false)
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }, [])

  // Start video playback when hovering
  useEffect(() => {
    if (isHovering && videoRef.current && previewReady) {
      videoRef.current.play().catch(() => {
        // Ignore autoplay errors
      })
    }
  }, [isHovering, previewReady])

  const videoSrc = hoverPreview ? window.api.toFileUrl(videoPath) : null
  const resolution = formatResolution(width, height)

  return (
    <div
      className={`relative overflow-hidden bg-slate-900 ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-600 border-t-slate-300" />
        </div>
      )}

      {/* Error/Placeholder state */}
      {!isLoading && (error || !thumbnail) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="h-12 w-12 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      )}

      {/* Thumbnail image */}
      {thumbnail && !isLoading && (
        <img
          src={thumbnail}
          alt=""
          className={`h-full w-full object-cover transition-opacity duration-200 ${
            isHovering && previewReady ? 'opacity-0' : 'opacity-100'
          }`}
        />
      )}

      {/* Hover preview video */}
      {hoverPreview && isHovering && videoSrc && (
        <video
          ref={videoRef}
          src={videoSrc}
          className="absolute inset-0 h-full w-full object-cover"
          muted
          loop
          playsInline
          onCanPlay={() => setPreviewReady(true)}
          onError={() => setPreviewReady(false)}
        />
      )}

      {/* Duration badge */}
      {showDuration && duration != null && (
        <div className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
          {formatDuration(duration)}
        </div>
      )}

      {/* Resolution badge */}
      {showResolution && resolution && height && height >= 720 && (
        <div className="absolute left-2 top-2 rounded bg-purple-600/90 px-1.5 py-0.5 text-xs font-medium text-white">
          {resolution}
        </div>
      )}

      {/* Play icon overlay on hover */}
      {!isHovering && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity group-hover:bg-black/30 group-hover:opacity-100">
          <div className="rounded-full bg-white/20 p-3 backdrop-blur">
            <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Preview indicator */}
      {isHovering && previewReady && (
        <div className="absolute bottom-2 left-2 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
          Preview
        </div>
      )}
    </div>
  )
}
