import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDownloadsStore, type DownloadItem } from '../stores/downloads.store'
import type { DownloadBatchResponse } from '../../preload/api'

type BatchParseResult = {
  urls: string[]
  total: number
  duplicates: number
  invalid: number
}

const parseBatchInput = (input: string): BatchParseResult => {
  const urls: string[] = []
  const seen = new Set<string>()
  let total = 0
  let duplicates = 0
  let invalid = 0
  const lines = input.split(/\r?\n/)
  const regex = /https?:\/\/[^\s]+/g

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }
    const matches = trimmed.match(regex)
    if (!matches) {
      invalid += 1
      continue
    }
    for (const match of matches) {
      total += 1
      if (seen.has(match)) {
        duplicates += 1
        continue
      }
      seen.add(match)
      urls.push(match)
    }
  }

  return { urls, total, duplicates, invalid }
}

const formatBatchReason = (reason?: string): string => {
  if (!reason) {
    return 'Unknown'
  }
  switch (reason) {
    case 'duplicate_in_batch':
      return 'Duplicate in batch'
    case 'already_queued':
      return 'Already queued'
    case 'already_downloaded':
      return 'Already in library'
    case 'empty':
      return 'Empty entry'
    default:
      return reason.replace(/_/g, ' ')
  }
}

export default function Downloads(): JSX.Element {
  const [url, setUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [batchInput, setBatchInput] = useState('')
  const [batchSubmitting, setBatchSubmitting] = useState(false)
  const [batchError, setBatchError] = useState<string | null>(null)
  const [batchResponse, setBatchResponse] = useState<DownloadBatchResponse | null>(null)
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null)
  const [downloadPath, setDownloadPath] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = useRef(0)

  const downloads = useDownloadsStore((state) => state.downloads)
  const error = useDownloadsStore((state) => state.error)
  const setError = useDownloadsStore((state) => state.setError)
  const addDownload = useDownloadsStore((state) => state.addDownload)
  const patchDownload = useDownloadsStore((state) => state.patchDownload)
  const startPolling = useDownloadsStore((state) => state.startPolling)
  const stopPolling = useDownloadsStore((state) => state.stopPolling)
  const startRealtime = useDownloadsStore((state) => state.startRealtime)
  const stopRealtime = useDownloadsStore((state) => state.stopRealtime)
  const parsedBatch = useMemo(() => parseBatchInput(batchInput), [batchInput])

  useEffect(() => {
    startPolling(15000)
    startRealtime()

    window.api
      .getDownloadPath()
      .then((result) => {
        if (result.ok && result.path) {
          setDownloadPath(result.path)
        }
      })
      .catch(() => {
        setDownloadPath(null)
      })

    return () => {
      stopPolling()
      stopRealtime()
    }
  }, [startPolling, startRealtime, stopPolling, stopRealtime])

  useEffect(() => {
    if (!confirmCancelId) {
      return
    }

    const entry = downloads.find((item) => item.id === confirmCancelId)
    if (!entry || !['queued', 'downloading'].includes(entry.status)) {
      setConfirmCancelId(null)
    }
  }, [confirmCancelId, downloads])

  const handleSubmit = async (): Promise<void> => {
    const trimmed = url.trim()
    if (!trimmed) {
      setError('Enter a URL to queue a download.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await window.api.downloadStart(trimmed)
      if (!result.ok || !result.downloadId) {
        const message =
          result.error === 'already_queued'
            ? 'This URL is already queued.'
            : result.error === 'already_downloaded'
              ? 'This URL is already in your library.'
              : result.error ?? 'Download could not be queued.'
        setError(message)
        return
      }

      const entry: DownloadItem = {
        id: result.downloadId,
        url: trimmed,
        jobId: result.jobId ?? null,
        status: result.status ?? 'queued',
        createdAt: new Date().toISOString(),
        progress: 0,
        error: null
      }
      addDownload(entry)
      setUrl('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = async (downloadId: string): Promise<void> => {
    try {
      const result = await window.api.downloadCancel(downloadId)
      if (!result.ok) {
        setError(result.error ?? 'Cancel failed.')
        return
      }

      patchDownload(downloadId, {
        status: result.status ?? 'canceled',
        error: 'canceled_by_user'
      })
      setConfirmCancelId(null)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cancel failed.')
    }
  }

  const handleRetry = async (downloadId: string): Promise<void> => {
    try {
      const result = await window.api.downloadRetry(downloadId)
      if (!result.ok) {
        setError(result.error ?? 'Retry failed.')
        return
      }

      patchDownload(downloadId, {
        jobId: result.jobId ?? null,
        status: result.status ?? 'queued',
        progress: 0,
        speed: undefined,
        eta: undefined,
        error: null
      })
      setConfirmCancelId(null)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Retry failed.')
    }
  }

  const handleSelectFolder = async (): Promise<void> => {
    try {
      const result = await window.api.selectDownloadPath()
      if (result.ok && result.path) {
        setDownloadPath(result.path)
        setError(null)
      } else if (!result.canceled) {
        setError(result.error ?? 'Unable to update download path.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update download path.')
    }
  }

  const applyDroppedUrls = useCallback(
    async (urls: string[]): Promise<void> => {
    if (urls.length === 0) {
      setBatchError('No valid URLs found in drop.')
      return
    }
    setBatchError(null)

    if (urls.length === 1) {
      setIsSubmitting(true)
      try {
        const result = await window.api.downloadStart(urls[0])
        if (!result.ok || !result.downloadId) {
          const message =
            result.error === 'already_queued'
              ? 'This URL is already queued.'
              : result.error === 'already_downloaded'
                ? 'This URL is already in your library.'
                : result.error ?? 'Download could not be queued.'
          setBatchError(message)
          return
        }

        addDownload({
          id: result.downloadId,
          url: urls[0],
          jobId: result.jobId ?? null,
          status: result.status ?? 'queued',
          createdAt: new Date().toISOString(),
          progress: 0,
          error: null
        })
      } catch (err) {
        setBatchError(err instanceof Error ? err.message : 'Download failed.')
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    setBatchSubmitting(true)
    setBatchResponse(null)
    try {
      const result = await window.api.downloadBatch({ urls })
      if (!result.ok) {
        setBatchError(result.error ?? 'Batch queue failed.')
        return
      }

      setBatchResponse(result)
      result.results
        .filter((item) => item.status === 'queued' && item.downloadId)
        .forEach((item) => {
          addDownload({
            id: item.downloadId ?? '',
            url: item.url,
            jobId: item.jobId ?? null,
            status: 'queued',
            createdAt: new Date().toISOString(),
            progress: 0,
            error: null
          })
        })
    } catch (err) {
      setBatchError(err instanceof Error ? err.message : 'Batch queue failed.')
    } finally {
      setBatchSubmitting(false)
    }
    },
    [addDownload]
  )

  useEffect(() => {
    const handleDragEnter = (event: DragEvent): void => {
      event.preventDefault()
      dragCounter.current += 1
      setIsDragging(true)
    }

    const handleDragOver = (event: DragEvent): void => {
      event.preventDefault()
    }

    const handleDragLeave = (event: DragEvent): void => {
      event.preventDefault()
      dragCounter.current = Math.max(0, dragCounter.current - 1)
      if (dragCounter.current === 0) {
        setIsDragging(false)
      }
    }

    const handleDrop = (event: DragEvent): void => {
      event.preventDefault()
      dragCounter.current = 0
      setIsDragging(false)

      const uriList = event.dataTransfer?.getData('text/uri-list') ?? ''
      const plainText = event.dataTransfer?.getData('text/plain') ?? ''
      const combined = [uriList, plainText].filter(Boolean).join('\n')
      const parsed = parseBatchInput(combined)
      void applyDroppedUrls(parsed.urls)
    }

    window.addEventListener('dragenter', handleDragEnter)
    window.addEventListener('dragover', handleDragOver)
    window.addEventListener('dragleave', handleDragLeave)
    window.addEventListener('drop', handleDrop)

    return () => {
      window.removeEventListener('dragenter', handleDragEnter)
      window.removeEventListener('dragover', handleDragOver)
      window.removeEventListener('dragleave', handleDragLeave)
      window.removeEventListener('drop', handleDrop)
    }
  }, [applyDroppedUrls])

  const handleBatchSubmit = async (): Promise<void> => {
    if (!parsedBatch.urls.length) {
      setBatchError('Paste at least one URL to queue.')
      return
    }

    setBatchSubmitting(true)
    setBatchError(null)
    setBatchResponse(null)

    try {
      const result = await window.api.downloadBatch({ urls: parsedBatch.urls })
      if (!result.ok) {
        setBatchError(result.error ?? 'Batch queue failed.')
        return
      }

      setBatchResponse(result)
      result.results
        .filter((item) => item.status === 'queued' && item.downloadId)
        .forEach((item) => {
          const entry: DownloadItem = {
            id: item.downloadId ?? '',
            url: item.url,
            jobId: item.jobId ?? null,
            status: 'queued',
            createdAt: new Date().toISOString(),
            progress: 0,
            error: null
          }
          addDownload(entry)
        })
      setBatchInput('')
    } catch (err) {
      setBatchError(err instanceof Error ? err.message : 'Batch queue failed.')
    } finally {
      setBatchSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {isDragging ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm">
          <div className="rounded-2xl border border-white/20 bg-white/10 px-8 py-6 text-center text-sm text-white">
            <p className="text-lg font-semibold">Drop URLs to queue</p>
            <p className="mt-2 text-xs text-white/70">Supports multiple links at once.</p>
          </div>
        </div>
      ) : null}
      <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Start a download</h3>
        <p className="mt-2 text-sm text-slate-500">
          Paste a URL or drag and drop links to begin a managed download. Jobs will appear in the queue below.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <span className="truncate">
            Download folder: {downloadPath ?? 'Default'}
          </span>
          <button
            type="button"
            onClick={() => void handleSelectFolder()}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:border-slate-300"
          >
            Change folder
          </button>
        </div>
        <div className="mt-5 flex flex-col gap-3 md:flex-row">
          <input
            type="text"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://"
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 outline-none focus:border-slate-400"
          />
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Queuing...' : 'Queue download'}
          </button>
        </div>
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      </section>

      <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Batch URL import</h3>
            <p className="mt-2 text-sm text-slate-500">
              Paste multiple URLs or a mixed list. Comments starting with # are ignored.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {parsedBatch.urls.length} ready
          </span>
        </div>
        <div className="mt-4 space-y-3">
          <textarea
            value={batchInput}
            onChange={(event) => setBatchInput(event.target.value)}
            placeholder="https://example.com/video-a"
            rows={6}
            className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 outline-none focus:border-slate-400"
          />
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span>Parsed: {parsedBatch.urls.length} URLs</span>
            <span>Total matches: {parsedBatch.total}</span>
            <span>Duplicates removed: {parsedBatch.duplicates}</span>
            <span>Invalid lines: {parsedBatch.invalid}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void handleBatchSubmit()}
              disabled={batchSubmitting || parsedBatch.urls.length === 0}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70"
            >
              {batchSubmitting ? 'Queuing batch...' : 'Queue batch'}
            </button>
            <button
              type="button"
              onClick={() => {
                setBatchInput('')
                setBatchResponse(null)
                setBatchError(null)
              }}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-500 hover:border-slate-300"
            >
              Clear
            </button>
          </div>
          {batchError ? <p className="text-sm text-rose-600">{batchError}</p> : null}
          {batchResponse ? (
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">
                  {batchResponse.queued} queued
                </span>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">
                  {batchResponse.skipped} skipped
                </span>
                <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-700">
                  {batchResponse.failed} failed
                </span>
              </div>
              {batchResponse.results.length ? (
                <div className="mt-3 max-h-56 space-y-2 overflow-y-auto">
                  {batchResponse.results.map((item, index) => (
                    <div
                      key={`${item.url}-${index}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                    >
                      <span className="min-w-0 flex-1 truncate text-slate-600">{item.url || 'Unknown URL'}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          item.status === 'queued'
                            ? 'bg-emerald-100 text-emerald-700'
                            : item.status === 'skipped'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {item.status}
                      </span>
                      {item.status !== 'queued' ? (
                        <span className="text-[10px] uppercase tracking-wide text-slate-400">
                          {formatBatchReason(item.reason)}
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Download queue</h3>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {downloads.length ? `${downloads.length} queued` : 'Empty'}
          </span>
        </div>
        <div className="mt-4 space-y-3">
          {downloads.length === 0 ? (
            ['Waiting', 'Active', 'Completed'].map((stage) => (
              <div
                key={stage}
                className="rounded-xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500"
              >
                {stage} downloads will appear here.
              </div>
            ))
          ) : (
            downloads.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 px-4 py-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{item.url}</p>
                    <p className="mt-1 text-xs text-slate-400">Queued at {new Date(item.createdAt).toLocaleString()}</p>
                    {item.error ? <p className="mt-2 text-xs text-rose-600">Error: {item.error}</p> : null}
                    {item.outputPath ? (
                      <p className="mt-2 truncate text-xs text-slate-500">Saved to: {item.outputPath}</p>
                    ) : null}
                    {typeof item.progress === 'number' ? (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>{item.progress.toFixed(1)}%</span>
                          <span>
                            {item.speed ?? '--'} {item.eta ? `ETA ${item.eta}` : ''}
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
                          <div
                            className="h-1.5 rounded-full bg-emerald-500 transition-all"
                            style={{ width: `${Math.min(100, Math.max(0, item.progress))}%` }}
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    {['queued', 'downloading'].includes(item.status) ? (
                      confirmCancelId === item.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void handleCancel(item.id)}
                            className="rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmCancelId(null)}
                            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:border-slate-300"
                          >
                            Keep
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmCancelId(item.id)}
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:border-slate-300"
                        >
                          Cancel
                        </button>
                      )
                    ) : null}
                    {['failed', 'canceled'].includes(item.status) ? (
                      <button
                        type="button"
                        onClick={() => void handleRetry(item.id)}
                        className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white"
                      >
                        Retry
                      </button>
                    ) : null}
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {item.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
