import { create } from 'zustand'
import type { VideoTag, TaxonomyData } from '../../preload/api'
import type { TagSuggestionResult } from '../../shared/types/smart-tagging.types'

type VideoTagState = {
  tags: VideoTag[]
  isIndexed: boolean
  frameCount: number | null
  suggestions: TagSuggestionResult | null
}

type SmartTaggingState = {
  // Global state
  taxonomy: TaxonomyData | null
  llmAvailable: boolean
  llmModels: string[]

  // Per-video state (keyed by videoId)
  videoStates: Map<string, VideoTagState>

  // Loading states
  isLoadingTaxonomy: boolean
  isCheckingLLM: boolean
  indexingVideos: Set<string>
  suggestingVideos: Set<string>

  // Actions
  loadTaxonomy: () => Promise<void>
  reloadTaxonomy: () => Promise<{ success: boolean; tagCount: number }>
  checkLLMAvailability: () => Promise<void>

  // Video-specific actions
  loadVideoTags: (videoId: string) => Promise<void>
  checkVideoIndexed: (videoId: string) => Promise<{ indexed: boolean; frameCount: number | null }>
  indexVideo: (videoId: string, videoPath: string) => Promise<{ success: boolean; frameCount: number }>
  suggestTags: (videoId: string, options?: {
    topK?: number
    useLLMRefinement?: boolean
    videoTitle?: string
    videoDescription?: string
    userNotes?: string
  }) => Promise<TagSuggestionResult>
  regenerateSuggestions: (videoId: string) => Promise<TagSuggestionResult>

  // Tag operations
  acceptTag: (videoId: string, tagName: string) => Promise<void>
  rejectTag: (videoId: string, tagName: string) => Promise<void>
  addTag: (videoId: string, tagName: string, lock?: boolean) => Promise<{ success: boolean; error?: string }>
  removeTag: (videoId: string, tagName: string, force?: boolean) => Promise<{ success: boolean; wasLocked: boolean }>
  lockTag: (videoId: string, tagName: string) => Promise<{ success: boolean; error?: string }>
  unlockTag: (videoId: string, tagName: string) => Promise<{ success: boolean; error?: string }>

  // Cleanup
  cleanupVideo: (videoId: string) => Promise<void>
  clearVideoState: (videoId: string) => void

  // Helpers
  getVideoState: (videoId: string) => VideoTagState | undefined
  isVideoIndexing: (videoId: string) => boolean
  isVideoSuggesting: (videoId: string) => boolean
}

const defaultVideoState: VideoTagState = {
  tags: [],
  isIndexed: false,
  frameCount: null,
  suggestions: null
}

export const useSmartTaggingStore = create<SmartTaggingState>((set, get) => ({
  // Initial state
  taxonomy: null,
  llmAvailable: false,
  llmModels: [],
  videoStates: new Map(),
  isLoadingTaxonomy: false,
  isCheckingLLM: false,
  indexingVideos: new Set(),
  suggestingVideos: new Set(),

  // Global actions
  loadTaxonomy: async () => {
    set({ isLoadingTaxonomy: true })
    try {
      const taxonomy = await window.api.smartTagging.getTaxonomy()
      set({ taxonomy, isLoadingTaxonomy: false })
    } catch (error) {
      console.error('Failed to load taxonomy:', error)
      set({ isLoadingTaxonomy: false })
    }
  },

  reloadTaxonomy: async () => {
    set({ isLoadingTaxonomy: true })
    try {
      const result = await window.api.smartTagging.reloadTaxonomy()
      if (result.success) {
        const taxonomy = await window.api.smartTagging.getTaxonomy()
        set({ taxonomy, isLoadingTaxonomy: false })
      } else {
        set({ isLoadingTaxonomy: false })
      }
      return result
    } catch (error) {
      console.error('Failed to reload taxonomy:', error)
      set({ isLoadingTaxonomy: false })
      return { success: false, tagCount: 0 }
    }
  },

  checkLLMAvailability: async () => {
    set({ isCheckingLLM: true })
    try {
      const [availabilityResult, modelsResult] = await Promise.all([
        window.api.smartTagging.llmAvailable(),
        window.api.smartTagging.llmModels()
      ])
      set({
        llmAvailable: availabilityResult.available,
        llmModels: modelsResult.models,
        isCheckingLLM: false
      })
    } catch (error) {
      console.error('Failed to check LLM availability:', error)
      set({ llmAvailable: false, llmModels: [], isCheckingLLM: false })
    }
  },

  // Video-specific actions
  loadVideoTags: async (videoId) => {
    try {
      const result = await window.api.smartTagging.getVideoTags(videoId)
      const videoStates = new Map(get().videoStates)
      const existing = videoStates.get(videoId) || { ...defaultVideoState }
      videoStates.set(videoId, { ...existing, tags: result.tags })
      set({ videoStates })
    } catch (error) {
      console.error('Failed to load video tags:', error)
    }
  },

  checkVideoIndexed: async (videoId) => {
    try {
      const result = await window.api.smartTagging.isIndexed(videoId)
      const videoStates = new Map(get().videoStates)
      const existing = videoStates.get(videoId) || { ...defaultVideoState }
      videoStates.set(videoId, {
        ...existing,
        isIndexed: result.indexed,
        frameCount: result.frameCount
      })
      set({ videoStates })
      return result
    } catch (error) {
      console.error('Failed to check video indexed:', error)
      return { indexed: false, frameCount: null }
    }
  },

  indexVideo: async (videoId, videoPath) => {
    const indexingVideos = new Set(get().indexingVideos)
    indexingVideos.add(videoId)
    set({ indexingVideos })

    try {
      const result = await window.api.smartTagging.indexVideo(videoId, videoPath)

      indexingVideos.delete(videoId)
      const videoStates = new Map(get().videoStates)
      const existing = videoStates.get(videoId) || { ...defaultVideoState }
      videoStates.set(videoId, {
        ...existing,
        isIndexed: result.success,
        frameCount: result.frameCount
      })
      set({ indexingVideos, videoStates })

      return result
    } catch (error) {
      console.error('Failed to index video:', error)
      indexingVideos.delete(videoId)
      set({ indexingVideos })
      return { success: false, frameCount: 0 }
    }
  },

  suggestTags: async (videoId, options = {}) => {
    const suggestingVideos = new Set(get().suggestingVideos)
    suggestingVideos.add(videoId)
    set({ suggestingVideos })

    try {
      const result = await window.api.smartTagging.suggestTags({
        videoId,
        ...options
      })

      suggestingVideos.delete(videoId)
      const videoStates = new Map(get().videoStates)
      const existing = videoStates.get(videoId) || { ...defaultVideoState }
      videoStates.set(videoId, { ...existing, suggestions: result })
      set({ suggestingVideos, videoStates })

      return result
    } catch (error) {
      console.error('Failed to suggest tags:', error)
      suggestingVideos.delete(videoId)
      set({ suggestingVideos })
      throw error
    }
  },

  regenerateSuggestions: async (videoId) => {
    const suggestingVideos = new Set(get().suggestingVideos)
    suggestingVideos.add(videoId)
    set({ suggestingVideos })

    try {
      const result = await window.api.smartTagging.regenerate(videoId)

      suggestingVideos.delete(videoId)
      const videoStates = new Map(get().videoStates)
      const existing = videoStates.get(videoId) || { ...defaultVideoState }
      videoStates.set(videoId, { ...existing, suggestions: result })
      set({ suggestingVideos, videoStates })

      // Refresh tags after regeneration
      await get().loadVideoTags(videoId)

      return result
    } catch (error) {
      console.error('Failed to regenerate suggestions:', error)
      suggestingVideos.delete(videoId)
      set({ suggestingVideos })
      throw error
    }
  },

  // Tag operations
  acceptTag: async (videoId, tagName) => {
    await window.api.smartTagging.applyDecision(videoId, tagName, 'accept')
    await get().loadVideoTags(videoId)
  },

  rejectTag: async (videoId, tagName) => {
    await window.api.smartTagging.applyDecision(videoId, tagName, 'reject')
    // Optionally update suggestions to remove the rejected tag
    const videoStates = new Map(get().videoStates)
    const existing = videoStates.get(videoId)
    if (existing?.suggestions) {
      const suggestions = {
        ...existing.suggestions,
        accepted: existing.suggestions.accepted.filter((t) => t.tagName !== tagName),
        suggestedLowConfidence: existing.suggestions.suggestedLowConfidence.filter(
          (t) => t.tagName !== tagName
        ),
        needsReview: existing.suggestions.needsReview.filter((t) => t.tagName !== tagName)
      }
      videoStates.set(videoId, { ...existing, suggestions })
      set({ videoStates })
    }
  },

  addTag: async (videoId, tagName, lock) => {
    const result = await window.api.smartTagging.addTag(videoId, tagName, lock)
    if (result.success) {
      await get().loadVideoTags(videoId)
    }
    return result
  },

  removeTag: async (videoId, tagName, force) => {
    const result = await window.api.smartTagging.removeTag(videoId, tagName, force)
    if (result.success) {
      await get().loadVideoTags(videoId)
    }
    return result
  },

  lockTag: async (videoId, tagName) => {
    const result = await window.api.smartTagging.lockTag(videoId, tagName)
    if (result.success) {
      await get().loadVideoTags(videoId)
    }
    return result
  },

  unlockTag: async (videoId, tagName) => {
    const result = await window.api.smartTagging.unlockTag(videoId, tagName)
    if (result.success) {
      await get().loadVideoTags(videoId)
    }
    return result
  },

  // Cleanup
  cleanupVideo: async (videoId) => {
    await window.api.smartTagging.cleanup(videoId)
    get().clearVideoState(videoId)
  },

  clearVideoState: (videoId) => {
    const videoStates = new Map(get().videoStates)
    videoStates.delete(videoId)
    set({ videoStates })
  },

  // Helpers
  getVideoState: (videoId) => {
    return get().videoStates.get(videoId)
  },

  isVideoIndexing: (videoId) => {
    return get().indexingVideos.has(videoId)
  },

  isVideoSuggesting: (videoId) => {
    return get().suggestingVideos.has(videoId)
  }
}))
