import { ipcMain } from 'electron'
import type { SmartTaggingService } from '../services/smart-tagging'
import { getDatabase } from '../database'
import { getSetting } from '../utils/settings'

const DEFAULT_LMSTUDIO_URL = 'http://localhost:1234/v1'

export function registerSmartTaggingHandlers(smartTagging: SmartTaggingService): void {
  // Index a video
  ipcMain.handle('smart-tagging:index-video', async (_event, params: {
    videoId: string
    videoPath: string
  }) => {
    return smartTagging.indexVideo(params.videoId, params.videoPath)
  })

  // Suggest tags for a video
  ipcMain.handle('smart-tagging:suggest-tags', async (_event, params: {
    videoId: string
    topK?: number
    useLLMRefinement?: boolean
    videoTitle?: string
    videoDescription?: string
    userNotes?: string
  }) => {
    return smartTagging.suggestTags(params.videoId, {
      topK: params.topK,
      useLLMRefinement: params.useLLMRefinement,
      videoTitle: params.videoTitle,
      videoDescription: params.videoDescription,
      userNotes: params.userNotes
    })
  })

  // Apply tag decision (accept/reject)
  ipcMain.handle('smart-tagging:apply-decision', async (_event, params: {
    videoId: string
    tagName: string
    decision: 'accept' | 'reject'
  }) => {
    await smartTagging.applyTagDecision(params.videoId, params.tagName, params.decision)
    return { success: true }
  })

  // Add a user tag
  ipcMain.handle('smart-tagging:add-tag', async (_event, params: {
    videoId: string
    tagName: string
    lock?: boolean
  }) => {
    try {
      smartTagging.addUserTag(params.videoId, params.tagName, params.lock)
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // Remove a tag
  ipcMain.handle('smart-tagging:remove-tag', async (_event, params: {
    videoId: string
    tagName: string
    force?: boolean
  }) => {
    return smartTagging.removeTag(params.videoId, params.tagName, params.force)
  })

  // Lock a tag
  ipcMain.handle('smart-tagging:lock-tag', async (_event, params: {
    videoId: string
    tagName: string
  }) => {
    try {
      smartTagging.lockTag(params.videoId, params.tagName)
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // Unlock a tag
  ipcMain.handle('smart-tagging:unlock-tag', async (_event, params: {
    videoId: string
    tagName: string
  }) => {
    try {
      smartTagging.unlockTag(params.videoId, params.tagName)
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  // Regenerate suggestions
  ipcMain.handle('smart-tagging:regenerate', async (_event, params: {
    videoId: string
  }) => {
    return smartTagging.regenerateSuggestions(params.videoId)
  })

  // Get taxonomy
  ipcMain.handle('smart-tagging:get-taxonomy', async () => {
    return smartTagging.getTaxonomy()
  })

  // Reload taxonomy
  ipcMain.handle('smart-tagging:reload-taxonomy', async () => {
    return smartTagging.reloadTaxonomy()
  })

  // Get video tags
  ipcMain.handle('smart-tagging:get-video-tags', async (_event, params: {
    videoId: string
  }) => {
    return { tags: smartTagging.getVideoTags(params.videoId) }
  })

  // Check if video is indexed
  ipcMain.handle('smart-tagging:is-indexed', async (_event, params: {
    videoId: string
  }) => {
    return smartTagging.isVideoIndexed(params.videoId)
  })

  // Cleanup video data
  ipcMain.handle('smart-tagging:cleanup', async (_event, params: {
    videoId: string
  }) => {
    await smartTagging.cleanupVideo(params.videoId)
    return { success: true }
  })

  // Check LLM availability
  ipcMain.handle('smart-tagging:llm-available', async () => {
    const db = getDatabase()
    const provider = getSetting(db, 'llm_provider') ?? 'lmstudio'

    // For OpenRouter, check if API key is set
    if (provider === 'openrouter') {
      const apiKey = getSetting(db, 'openrouter_api_key')
      return { available: Boolean(apiKey) }
    }

    // For LM Studio, test the connection using current settings
    const baseUrl = getSetting(db, 'lmstudio_url') ?? DEFAULT_LMSTUDIO_URL
    try {
      const response = await fetch(`${baseUrl}/models`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      })
      if (!response.ok) {
        return { available: false }
      }
      const data = await response.json()
      return { available: Array.isArray(data.data) && data.data.length > 0 }
    } catch {
      return { available: false }
    }
  })

  // Get LLM models
  ipcMain.handle('smart-tagging:llm-models', async () => {
    const db = getDatabase()
    const baseUrl = getSetting(db, 'lmstudio_url') ?? DEFAULT_LMSTUDIO_URL
    try {
      const response = await fetch(`${baseUrl}/models`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      })
      if (!response.ok) {
        return { models: [] }
      }
      const data = await response.json()
      return { models: data.data?.map((m: { id: string }) => m.id) || [] }
    } catch {
      return { models: [] }
    }
  })
}
