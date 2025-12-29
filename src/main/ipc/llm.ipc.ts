import { ipcMain } from 'electron'
import { getDatabase } from '../database'
import { getSetting, setSetting } from '../utils/settings'
import type { SmartTaggingService } from '../services/smart-tagging'
import { createLlmProvider } from '../services/llm/llm.factory'

type LlmProvider = 'openrouter' | 'lmstudio'

type LlmSettings = {
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

const DEFAULT_LMSTUDIO_URL = 'http://localhost:1234/v1'
const DEFAULT_LMSTUDIO_MODEL = 'auto'
const DEFAULT_OPENROUTER_MODEL = 'anthropic/claude-3.5-sonnet'
const SUMMARY_MAX_CHARS = 8000
const SUMMARY_MAX_TOKENS = 480
const TRANSCRIPT_MAX_CHARS = 12000

function getLlmSettings(): LlmSettings {
  const db = getDatabase()
  const provider = (getSetting(db, 'llm_provider') as LlmProvider | null) ?? 'lmstudio'
  const openrouterModel = getSetting(db, 'openrouter_model') ?? DEFAULT_OPENROUTER_MODEL
  const openrouterKey = getSetting(db, 'openrouter_api_key') ?? ''
  const lmstudioUrl = getSetting(db, 'lmstudio_url') ?? DEFAULT_LMSTUDIO_URL
  const lmstudioModel = getSetting(db, 'lmstudio_model') ?? DEFAULT_LMSTUDIO_MODEL

  return {
    provider,
    openrouter: {
      apiKeySet: Boolean(openrouterKey),
      model: openrouterModel
    },
    lmstudio: {
      baseUrl: lmstudioUrl,
      model: lmstudioModel
    }
  }
}

async function testLmStudio(baseUrl: string): Promise<{ available: boolean; error?: string }> {
  try {
    const response = await fetch(`${baseUrl}/models`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    })
    if (!response.ok) {
      return { available: false, error: `LM Studio returned ${response.status}` }
    }
    let data: unknown
    try {
      data = await response.json()
    } catch {
      return { available: false, error: 'LM Studio returned invalid JSON response' }
    }
    const available: boolean = !!(data && typeof data === 'object' && 'data' in data && Array.isArray((data as { data: unknown[] }).data) && (data as { data: unknown[] }).data.length > 0)
    return { available, error: available ? undefined : 'No models loaded in LM Studio. Load a model first.' }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (message.includes('fetch failed') || message.includes('ECONNREFUSED')) {
      return { available: false, error: 'Cannot connect to LM Studio. Make sure LM Studio is running and the local server is started (check LM Studio → Local Server tab).' }
    }
    return { available: false, error: `LM Studio not reachable: ${message}` }
  }
}

async function testOpenRouter(apiKey: string): Promise<{ available: boolean; error?: string }> {
  if (!apiKey) {
    return { available: false, error: 'OpenRouter API key is not set' }
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`
      },
      signal: AbortSignal.timeout(8000)
    })

    if (!response.ok) {
      const text = await response.text()
      return { available: false, error: `OpenRouter error ${response.status}: ${text}` }
    }

    return { available: true }
  } catch (error) {
    return { available: false, error: error instanceof Error ? error.message : 'OpenRouter not reachable' }
  }
}

function buildSummaryPrompt(input: { title: string | null; description: string | null; transcript: string }): { system: string; prompt: string } {
  const summaryContext = [
    input.title ? `Title: ${input.title}` : null,
    input.description ? `Description: ${input.description}` : null
  ]
    .filter(Boolean)
    .join('\n')

  return {
    system: 'You summarize video transcripts into clear, concise notes.',
    prompt: `${summaryContext}\n\nTranscript:\n${input.transcript}\n\nTask: Summarize this video in 4-6 bullet points. Focus on key takeaways, avoid fluff, and keep it readable.`
  }
}

function buildTranscriptCleanupPrompt(transcript: string): { system: string; prompt: string } {
  return {
    system: 'You clean raw speech-to-text transcripts.',
    prompt: `Transcript:\n${transcript}\n\nTask: Clean up the transcript for readability. Fix punctuation, casing, and line breaks. Do not add new content. Return plain text only.`
  }
}

export function registerLlmHandlers(smartTagging?: SmartTaggingService): void {
  const db = getDatabase()

  ipcMain.handle('llm/get-settings', async () => {
    return { ok: true, settings: getLlmSettings() }
  })

  ipcMain.handle('llm/update-settings', async (_event, payload: {
    provider?: LlmProvider
    openrouterApiKey?: string
    openrouterModel?: string | null
    lmstudioBaseUrl?: string | null
    lmstudioModel?: string | null
  }) => {
    try {
      if (payload.provider) {
        setSetting(db, 'llm_provider', payload.provider)
      }
      if (payload.openrouterApiKey !== undefined) {
        setSetting(db, 'openrouter_api_key', payload.openrouterApiKey)
      }
      if (payload.openrouterModel !== undefined && payload.openrouterModel !== null) {
        setSetting(db, 'openrouter_model', payload.openrouterModel)
      }
      if (payload.lmstudioBaseUrl !== undefined && payload.lmstudioBaseUrl !== null) {
        setSetting(db, 'lmstudio_url', payload.lmstudioBaseUrl)
      }
      if (payload.lmstudioModel !== undefined && payload.lmstudioModel !== null) {
        setSetting(db, 'lmstudio_model', payload.lmstudioModel)
      }

      if (smartTagging) {
        const settings = getLlmSettings()
        smartTagging.getLLMRefiner().configure({
          baseUrl: settings.lmstudio.baseUrl,
          modelName: settings.lmstudio.model ?? DEFAULT_LMSTUDIO_MODEL
        })
      }

      return { ok: true, settings: getLlmSettings() }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Unable to update settings' }
    }
  })

  ipcMain.handle('llm/test-connection', async (_event, provider?: LlmProvider) => {
    const settings = getLlmSettings()
    const target = provider ?? settings.provider

    if (target === 'openrouter') {
      const apiKey = getSetting(db, 'openrouter_api_key') ?? ''
      const result = await testOpenRouter(apiKey)
      return { ok: true, available: result.available, error: result.error }
    }

    const result = await testLmStudio(settings.lmstudio.baseUrl)
    return { ok: true, available: result.available, error: result.error }
  })

  ipcMain.handle('llm/summarize-video', async (_event, payload: { videoId?: string }) => {
    const videoId = payload?.videoId?.trim()
    if (!videoId) {
      return { ok: false, error: 'missing_video' }
    }

    const video = db
      .prepare('SELECT title, description, transcript FROM videos WHERE id = ?')
      .get(videoId) as { title?: string | null; description?: string | null; transcript?: string | null } | undefined

    if (!video) {
      return { ok: false, error: 'video_not_found' }
    }

    if (!video.transcript || typeof video.transcript !== 'string' || !video.transcript.trim()) {
      return { ok: false, error: 'missing_transcript' }
    }

    const settings = getLlmSettings()
    const provider = settings.provider
    const model =
      provider === 'openrouter'
        ? settings.openrouter.model ?? DEFAULT_OPENROUTER_MODEL
        : settings.lmstudio.model ?? DEFAULT_LMSTUDIO_MODEL

    const apiKey = provider === 'openrouter' ? getSetting(db, 'openrouter_api_key') ?? '' : ''
    if (provider === 'openrouter' && !apiKey) {
      return { ok: false, error: 'missing_api_key' }
    }

    const transcript =
      video.transcript.length > SUMMARY_MAX_CHARS
        ? `${video.transcript.slice(0, SUMMARY_MAX_CHARS)}\n\n[Truncated]`
        : video.transcript

    const prompt = buildSummaryPrompt({
      title: video.title ?? null,
      description: video.description ?? null,
      transcript
    })

    try {
      const client = createLlmProvider(provider, {
        apiKey,
        baseUrl: provider === 'lmstudio' ? settings.lmstudio.baseUrl : undefined
      })
      const summary = await client.complete({
        prompt: prompt.prompt,
        systemPrompt: prompt.system,
        model,
        maxTokens: SUMMARY_MAX_TOKENS
      })

      try {
        db.prepare('UPDATE videos SET summary = ?, updated_at = ? WHERE id = ?')
          .run(summary, new Date().toISOString(), videoId)
      } catch (dbError) {
        console.error('Failed to save summary to database:', dbError)
        // Still return the summary even if save failed
      }

      return { ok: true, summary }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Unable to generate summary.' }
    }
  })

  ipcMain.handle('llm/cleanup-transcript', async (_event, payload: { videoId?: string }) => {
    const videoId = payload?.videoId?.trim()
    if (!videoId) {
      return { ok: false, error: 'missing_video' }
    }

    const video = db
      .prepare('SELECT transcript FROM videos WHERE id = ?')
      .get(videoId) as { transcript?: string | null } | undefined

    if (!video) {
      return { ok: false, error: 'video_not_found' }
    }

    if (!video.transcript || typeof video.transcript !== 'string' || !video.transcript.trim()) {
      return { ok: false, error: 'missing_transcript' }
    }

    const settings = getLlmSettings()
    const provider = settings.provider
    const model =
      provider === 'openrouter'
        ? settings.openrouter.model ?? DEFAULT_OPENROUTER_MODEL
        : settings.lmstudio.model ?? DEFAULT_LMSTUDIO_MODEL

    const apiKey = provider === 'openrouter' ? getSetting(db, 'openrouter_api_key') ?? '' : ''
    if (provider === 'openrouter' && !apiKey) {
      return { ok: false, error: 'missing_api_key' }
    }

    const transcriptText = video.transcript.length > TRANSCRIPT_MAX_CHARS
      ? `${video.transcript.slice(0, TRANSCRIPT_MAX_CHARS)}\n\n[Truncated]`
      : video.transcript

    const prompt = buildTranscriptCleanupPrompt(transcriptText)

    try {
      const client = createLlmProvider(provider, {
        apiKey,
        baseUrl: provider === 'lmstudio' ? settings.lmstudio.baseUrl : undefined
      })
      const cleaned = await client.complete({
        prompt: prompt.prompt,
        systemPrompt: prompt.system,
        model,
        maxTokens: SUMMARY_MAX_TOKENS
      })

      return { ok: true, transcript: cleaned }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Unable to clean transcript.' }
    }
  })
}
