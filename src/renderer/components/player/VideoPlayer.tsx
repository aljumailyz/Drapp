import { useEffect, useMemo, useRef, useState, useCallback } from 'react'

type VideoPlayerProps = {
  src: string
  videoId: string
  title?: string
  onClose?: () => void
}

const playbackRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3]

// Icons as simple SVG components
const PlayIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </svg>
)

const PauseIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
)

const VolumeHighIcon = () => (
  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
  </svg>
)

const VolumeMuteIcon = () => (
  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
  </svg>
)

const FullscreenIcon = () => (
  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
  </svg>
)

const ExitFullscreenIcon = () => (
  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
  </svg>
)

const SettingsIcon = () => (
  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
  </svg>
)

const PipIcon = () => (
  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z" />
  </svg>
)

const SkipBackIcon = () => (
  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" />
  </svg>
)

const SkipForwardIcon = () => (
  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" />
  </svg>
)

export default function VideoPlayer({ src, videoId, title, onClose }: VideoPlayerProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedRef = useRef(0)

  const [savedPosition, setSavedPosition] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [buffered, setBuffered] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPiP, setIsPiP] = useState(false)

  // Load saved playback position
  useEffect(() => {
    let active = true
    setSavedPosition(null)
    setError(null)
    setIsLoading(true)

    window.api
      .libraryGetPlayback(videoId)
      .then((result) => {
        if (active && result.ok) {
          setSavedPosition(result.position ?? 0)
        }
      })
      .catch(() => {
        if (active) {
          setSavedPosition(0)
        }
      })

    return () => {
      active = false
    }
  }, [videoId])

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoaded = () => {
      const total = Number.isFinite(video.duration) ? video.duration : 0
      setDuration(total)
      setIsLoading(false)
      if (savedPosition && savedPosition > 0 && savedPosition < total - 1) {
        video.currentTime = savedPosition
        setCurrentTime(savedPosition)
      }
    }

    const handleTimeUpdate = () => {
      const time = video.currentTime
      setCurrentTime(time)

      // Update buffered amount
      if (video.buffered.length > 0 && video.duration > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1)
        setBuffered((bufferedEnd / video.duration) * 100)
      }

      // Save position every 5 seconds
      if (Math.abs(time - lastSavedRef.current) >= 5) {
        lastSavedRef.current = time
        void window.api.librarySavePlayback({
          videoId,
          position: time,
          duration: video.duration
        })
      }
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => {
      setIsPlaying(false)
      void window.api.librarySavePlayback({
        videoId,
        position: video.currentTime,
        duration: video.duration
      })
    }
    const handleEnded = () => {
      setIsPlaying(false)
      void window.api.librarySavePlayback({
        videoId,
        position: video.duration,
        duration: video.duration
      })
    }
    const handleWaiting = () => setIsLoading(true)
    const handleCanPlay = () => setIsLoading(false)
    const handleError = () => {
      setError('Failed to load video. The format may not be supported.')
      setIsLoading(false)
    }

    video.addEventListener('loadedmetadata', handleLoaded)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('waiting', handleWaiting)
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('error', handleError)

    return () => {
      video.removeEventListener('loadedmetadata', handleLoaded)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('waiting', handleWaiting)
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('error', handleError)
    }
  }, [savedPosition, videoId])

  // Restore saved position
  useEffect(() => {
    const video = videoRef.current
    if (!video || savedPosition == null || savedPosition <= 0) return
    if (video.readyState >= 1) {
      const total = Number.isFinite(video.duration) ? video.duration : 0
      const next = total > 1 ? Math.min(savedPosition, total - 1) : savedPosition
      video.currentTime = next
      setCurrentTime(next)
    }
  }, [savedPosition])

  // Volume sync
  useEffect(() => {
    const video = videoRef.current
    if (video) {
      video.volume = volume
      video.muted = isMuted
    }
  }, [isMuted, volume])

  // Playback rate sync
  useEffect(() => {
    const video = videoRef.current
    if (video) {
      video.playbackRate = playbackRate
    }
  }, [playbackRate])

  // Fullscreen change handler
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // PiP change handler
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handlePiPEnter = () => setIsPiP(true)
    const handlePiPLeave = () => setIsPiP(false)

    video.addEventListener('enterpictureinpicture', handlePiPEnter)
    video.addEventListener('leavepictureinpicture', handlePiPLeave)

    return () => {
      video.removeEventListener('enterpictureinpicture', handlePiPEnter)
      video.removeEventListener('leavepictureinpicture', handlePiPLeave)
    }
  }, [])

  // Define action callbacks before they're used in useEffect
  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      void video.play()
    } else {
      video.pause()
    }
  }, [])

  const handleSeek = useCallback((value: number) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = value
    setCurrentTime(value)
  }, [])

  const handleSkip = useCallback((delta: number) => {
    const video = videoRef.current
    if (!video) return
    const maxTime = duration || video.duration || 0
    if (maxTime <= 0) return
    const next = Math.min(Math.max(video.currentTime + delta, 0), maxTime)
    video.currentTime = next
    setCurrentTime(next)
  }, [duration])

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else {
      void container.requestFullscreen()
    }
  }, [])

  const togglePiP = useCallback(async () => {
    const video = videoRef.current
    if (!video) return
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture()
      }
    } catch (err) {
      console.warn('PiP not supported:', err)
    }
  }, [])

  const cyclePlaybackRate = useCallback((direction: number) => {
    const currentIndex = playbackRates.indexOf(playbackRate)
    const nextIndex = Math.max(0, Math.min(playbackRates.length - 1, currentIndex + direction))
    setPlaybackRate(playbackRates[nextIndex])
  }, [playbackRate])

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const newTime = percent * duration
    handleSeek(newTime)
  }, [duration, handleSeek])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      const video = videoRef.current
      if (!video) return

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault()
          togglePlay()
          break
        case 'arrowleft':
        case 'j':
          e.preventDefault()
          handleSkip(-10)
          break
        case 'arrowright':
        case 'l':
          e.preventDefault()
          handleSkip(10)
          break
        case 'arrowup':
          e.preventDefault()
          setVolume((v) => Math.min(1, v + 0.1))
          break
        case 'arrowdown':
          e.preventDefault()
          setVolume((v) => Math.max(0, v - 0.1))
          break
        case 'm':
          e.preventDefault()
          setIsMuted((m) => !m)
          break
        case 'f':
          e.preventDefault()
          toggleFullscreen()
          break
        case 'escape':
          if (isFullscreen) {
            void document.exitFullscreen()
          }
          break
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          e.preventDefault()
          const percent = parseInt(e.key) * 10
          video.currentTime = (duration * percent) / 100
          break
        case ',':
          e.preventDefault()
          handleSkip(-1 / 30) // Frame back (assuming 30fps)
          break
        case '.':
          e.preventDefault()
          handleSkip(1 / 30) // Frame forward
          break
        case '<':
          e.preventDefault()
          cyclePlaybackRate(-1)
          break
        case '>':
          e.preventDefault()
          cyclePlaybackRate(1)
          break
        case 'p':
          e.preventDefault()
          togglePiP()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [duration, isFullscreen, togglePlay, handleSkip, toggleFullscreen, togglePiP, cyclePlaybackRate])

  // Auto-hide controls
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }
  }, [isPlaying])

  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true)
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [isPlaying])

  // Save on unmount
  useEffect(() => {
    return () => {
      const video = videoRef.current
      if (!video) return
      void window.api.librarySavePlayback({
        videoId,
        position: video.currentTime,
        duration: video.duration
      })
    }
  }, [videoId])

  const formattedTime = useMemo(() => {
    return `${formatTime(currentTime)} / ${formatTime(duration)}`
  }, [currentTime, duration])

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-black ${isFullscreen ? 'h-screen w-screen' : 'rounded-xl'}`}
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        key={videoId}
        src={src}
        className={`w-full bg-black ${isFullscreen ? 'h-full object-contain' : 'max-h-[520px]'}`}
        onClick={togglePlay}
        playsInline
        preload="metadata"
      />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/30 border-t-white" />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center">
            <p className="text-lg font-medium text-red-400">{error}</p>
            <p className="mt-2 text-sm text-slate-400">
              Try converting the video to a more compatible format (MP4/H.264)
            </p>
          </div>
        </div>
      )}

      {/* Center Play Button (shown when paused) */}
      {!isPlaying && !isLoading && !error && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/20 p-5 backdrop-blur-sm transition hover:bg-white/30"
        >
          <PlayIcon />
        </button>
      )}

      {/* Controls Overlay */}
      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 pb-4 pt-16 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        {/* Title */}
        {title && isFullscreen && (
          <div className="absolute left-4 top-4 text-lg font-medium text-white drop-shadow-lg">
            {title}
          </div>
        )}

        {/* Progress Bar */}
        <div
          className="group mb-3 h-1.5 cursor-pointer rounded-full bg-white/30"
          onClick={handleProgressClick}
        >
          {/* Buffered */}
          <div
            className="absolute h-1.5 rounded-full bg-white/40 transition-all"
            style={{ width: `${buffered}%` }}
          />
          {/* Progress */}
          <div
            className="relative h-1.5 rounded-full bg-white transition-all"
            style={{ width: `${progressPercent}%` }}
          >
            {/* Scrubber */}
            <div className="absolute -right-2 -top-1 h-3.5 w-3.5 rounded-full bg-white opacity-0 shadow-lg transition group-hover:opacity-100" />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-4">
          {/* Left Controls */}
          <div className="flex items-center gap-2">
            {/* Skip Back */}
            <button
              type="button"
              onClick={() => handleSkip(-10)}
              className="rounded-full p-2 text-white transition hover:bg-white/20"
              title="Skip back 10s (J)"
            >
              <SkipBackIcon />
            </button>

            {/* Play/Pause */}
            <button
              type="button"
              onClick={togglePlay}
              className="rounded-full bg-white p-2.5 text-black transition hover:bg-white/90"
              title={isPlaying ? 'Pause (K)' : 'Play (K)'}
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>

            {/* Skip Forward */}
            <button
              type="button"
              onClick={() => handleSkip(10)}
              className="rounded-full p-2 text-white transition hover:bg-white/20"
              title="Skip forward 10s (L)"
            >
              <SkipForwardIcon />
            </button>

            {/* Volume */}
            <div className="group flex items-center">
              <button
                type="button"
                onClick={() => setIsMuted((m) => !m)}
                className="rounded-full p-2 text-white transition hover:bg-white/20"
                title="Mute (M)"
              >
                {isMuted || volume === 0 ? <VolumeMuteIcon /> : <VolumeHighIcon />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(Number(e.target.value))
                  if (Number(e.target.value) > 0) setIsMuted(false)
                }}
                className="w-0 origin-left scale-x-0 accent-white transition-all group-hover:w-20 group-hover:scale-x-100"
              />
            </div>

            {/* Time */}
            <span className="ml-2 text-sm text-white/90">{formattedTime}</span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1">
            {/* Playback Rate */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className="rounded-full p-2 text-white transition hover:bg-white/20"
                title="Settings"
              >
                <SettingsIcon />
              </button>

              {/* Settings Menu */}
              {showSettings && (
                <div className="absolute bottom-full right-0 mb-2 w-48 rounded-lg bg-slate-900/95 p-2 text-sm shadow-xl backdrop-blur">
                  <div className="mb-2 border-b border-white/10 pb-2">
                    <p className="mb-1 text-xs font-medium text-white/60">Playback Speed</p>
                    <div className="grid grid-cols-5 gap-1">
                      {playbackRates.map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => setPlaybackRate(rate)}
                          className={`rounded px-1.5 py-1 text-xs transition ${
                            playbackRate === rate
                              ? 'bg-white text-black'
                              : 'text-white/80 hover:bg-white/10'
                          }`}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-white/40">
                    Shortcuts: &lt; / &gt; to change speed
                  </p>
                </div>
              )}
            </div>

            {/* PiP */}
            {document.pictureInPictureEnabled && (
              <button
                type="button"
                onClick={togglePiP}
                className={`rounded-full p-2 text-white transition hover:bg-white/20 ${isPiP ? 'bg-white/20' : ''}`}
                title="Picture-in-Picture (P)"
              >
                <PipIcon />
              </button>
            )}

            {/* Fullscreen */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="rounded-full p-2 text-white transition hover:bg-white/20"
              title="Fullscreen (F)"
            >
              {isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
            </button>
          </div>
        </div>

        {/* Keyboard Shortcuts Help (shown on hover in fullscreen) */}
        {isFullscreen && showControls && (
          <div className="mt-3 text-center text-[10px] text-white/40">
            Space/K: Play · J/L: ±10s · ←/→: ±10s · ↑/↓: Volume · M: Mute · F: Fullscreen · 0-9: Seek · ,/.: Frame step
          </div>
        )}
      </div>
    </div>
  )
}

function formatTime(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return '0:00'
  }
  const total = Math.floor(value)
  const hrs = Math.floor(total / 3600)
  const mins = Math.floor((total % 3600) / 60)
  const secs = total % 60
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }
  return `${mins}:${String(secs).padStart(2, '0')}`
}
