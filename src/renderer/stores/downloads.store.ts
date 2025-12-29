import { create } from 'zustand'
import type { DownloadEvent, DownloadListResponse } from '../../preload/api'

export type DownloadItem = {
  id: string
  url: string
  jobId?: string | null
  status: string
  createdAt: string
  progress?: number | null
  speed?: string
  eta?: string
  outputPath?: string | null
  updatedAt?: string | null
  error?: string | null
  videoId?: string | null
}

type DownloadListItem = DownloadListResponse['downloads'][number]

type DownloadsStore = {
  downloads: DownloadItem[]
  error: string | null
  isLoading: boolean
  lastSynced: string | null
  setError: (error: string | null) => void
  addDownload: (download: DownloadItem) => void
  patchDownload: (downloadId: string, patch: Partial<DownloadItem>) => void
  applyEvent: (event: DownloadEvent) => void
  loadDownloads: () => Promise<void>
  startPolling: (intervalMs?: number) => void
  stopPolling: () => void
  startRealtime: () => void
  stopRealtime: () => void
}

const mapDownload = (item: DownloadListItem): DownloadItem => ({
  id: item.id,
  url: item.url,
  jobId: item.job_id,
  status: item.status,
  createdAt: item.created_at,
  progress: item.progress ?? null,
  speed: item.speed ?? undefined,
  eta: item.eta ?? undefined,
  outputPath: item.output_path ?? null,
  updatedAt: item.updated_at,
  error: item.error_message,
  videoId: item.video_id
})

let poller: NodeJS.Timeout | null = null
let unsubscribeEvents: (() => void) | null = null
let refreshTimer: NodeJS.Timeout | null = null

const scheduleRefresh = (fn: () => void, delayMs = 1500): void => {
  if (refreshTimer) {
    clearTimeout(refreshTimer)
  }
  refreshTimer = setTimeout(() => {
    refreshTimer = null
    fn()
  }, delayMs)
}

export const useDownloadsStore = create<DownloadsStore>((set, get) => ({
  downloads: [],
  error: null,
  isLoading: false,
  lastSynced: null,
  setError: (error) => set({ error }),
  addDownload: (download) => set((state) => ({ downloads: [download, ...state.downloads] })),
  patchDownload: (downloadId, patch) =>
    set((state) => ({
      downloads: state.downloads.map((item) => (item.id === downloadId ? { ...item, ...patch } : item))
    })),
  applyEvent: (event) =>
    set((state) => {
      const index = state.downloads.findIndex((item) => item.id === event.downloadId)
      if (index === -1) {
        return state
      }

      const next = [...state.downloads]
      const current = next[index]
      if (event.type === 'status') {
        next[index] = {
          ...current,
          status: event.status,
          progress: event.status === 'completed' ? 100 : current.progress,
          error: event.error ?? current.error
        }
      } else {
        next[index] = {
          ...current,
          progress: event.progress ?? current.progress,
          speed: event.speed ?? current.speed,
          eta: event.eta ?? current.eta
        }
      }
      return { ...state, downloads: next }
    }),
  loadDownloads: async () => {
    set({ isLoading: true })
    try {
      const result = await window.api.downloadList()
      if (result.ok) {
        set({
          downloads: result.downloads.map(mapDownload),
          error: null,
          lastSynced: new Date().toISOString()
        })
      } else {
        set({ error: 'Unable to load downloads.' })
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Unable to load downloads.' })
    } finally {
      set({ isLoading: false })
    }
  },
  startPolling: (intervalMs = 15000) => {
    if (poller) {
      return
    }
    poller = setInterval(() => {
      void get().loadDownloads()
    }, intervalMs)
    void get().loadDownloads()
  },
  stopPolling: () => {
    if (poller) {
      clearInterval(poller)
      poller = null
    }
  },
  startRealtime: () => {
    if (unsubscribeEvents) {
      return
    }
    unsubscribeEvents = window.api.onDownloadEvent((event) => {
      const state = get()
      if (!state.downloads.some((item) => item.id === event.downloadId)) {
        scheduleRefresh(() => {
          void state.loadDownloads()
        })
      }
      get().applyEvent(event)
    })
  },
  stopRealtime: () => {
    if (unsubscribeEvents) {
      unsubscribeEvents()
      unsubscribeEvents = null
    }
  }
}))
