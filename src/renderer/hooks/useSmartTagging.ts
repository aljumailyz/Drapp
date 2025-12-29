import { useEffect, useCallback } from 'react'
import { useSmartTaggingStore } from '../stores/smart-tagging.store'

/**
 * Hook to initialize smart tagging system
 * Call this once at app startup to load taxonomy and check LLM
 */
export function useSmartTaggingInit() {
  const { loadTaxonomy, checkLLMAvailability, taxonomy, isLoadingTaxonomy } =
    useSmartTaggingStore()

  useEffect(() => {
    loadTaxonomy()
    checkLLMAvailability()
  }, [loadTaxonomy, checkLLMAvailability])

  return { taxonomy, isLoading: isLoadingTaxonomy }
}

/**
 * Hook to manage smart tagging for a specific video
 */
export function useVideoSmartTagging(videoId: string, videoPath?: string) {
  const {
    taxonomy,
    llmAvailable,
    getVideoState,
    isVideoIndexing,
    isVideoSuggesting,
    loadVideoTags,
    checkVideoIndexed,
    indexVideo,
    suggestTags,
    regenerateSuggestions,
    acceptTag,
    rejectTag,
    addTag,
    removeTag,
    lockTag,
    unlockTag,
    cleanupVideo
  } = useSmartTaggingStore()

  const videoState = getVideoState(videoId)
  const isIndexing = isVideoIndexing(videoId)
  const isSuggesting = isVideoSuggesting(videoId)

  // Load video state on mount
  useEffect(() => {
    loadVideoTags(videoId)
    checkVideoIndexed(videoId)
  }, [videoId, loadVideoTags, checkVideoIndexed])

  // Action handlers
  const handleIndex = useCallback(async () => {
    if (!videoPath) {
      console.error('No video path provided for indexing')
      return { success: false, frameCount: 0 }
    }
    return indexVideo(videoId, videoPath)
  }, [videoId, videoPath, indexVideo])

  const handleSuggest = useCallback(
    async (useLLM = true, videoTitle?: string, videoDescription?: string) => {
      return suggestTags(videoId, {
        useLLMRefinement: useLLM,
        videoTitle,
        videoDescription
      })
    },
    [videoId, suggestTags]
  )

  const handleRegenerate = useCallback(async () => {
    return regenerateSuggestions(videoId)
  }, [videoId, regenerateSuggestions])

  const handleAcceptTag = useCallback(
    async (tagName: string) => {
      return acceptTag(videoId, tagName)
    },
    [videoId, acceptTag]
  )

  const handleRejectTag = useCallback(
    async (tagName: string) => {
      return rejectTag(videoId, tagName)
    },
    [videoId, rejectTag]
  )

  const handleAddTag = useCallback(
    async (tagName: string, lock?: boolean) => {
      return addTag(videoId, tagName, lock)
    },
    [videoId, addTag]
  )

  const handleRemoveTag = useCallback(
    async (tagName: string, force?: boolean) => {
      return removeTag(videoId, tagName, force)
    },
    [videoId, removeTag]
  )

  const handleLockTag = useCallback(
    async (tagName: string) => {
      return lockTag(videoId, tagName)
    },
    [videoId, lockTag]
  )

  const handleUnlockTag = useCallback(
    async (tagName: string) => {
      return unlockTag(videoId, tagName)
    },
    [videoId, unlockTag]
  )

  const handleCleanup = useCallback(async () => {
    return cleanupVideo(videoId)
  }, [videoId, cleanupVideo])

  return {
    // State
    tags: videoState?.tags || [],
    isIndexed: videoState?.isIndexed || false,
    frameCount: videoState?.frameCount || null,
    suggestions: videoState?.suggestions || null,
    taxonomy,
    llmAvailable,

    // Loading states
    isIndexing,
    isSuggesting,

    // Actions
    index: handleIndex,
    suggest: handleSuggest,
    regenerate: handleRegenerate,
    acceptTag: handleAcceptTag,
    rejectTag: handleRejectTag,
    addTag: handleAddTag,
    removeTag: handleRemoveTag,
    lockTag: handleLockTag,
    unlockTag: handleUnlockTag,
    cleanup: handleCleanup
  }
}

/**
 * Hook to access taxonomy data
 */
export function useTaxonomy() {
  const { taxonomy, isLoadingTaxonomy, reloadTaxonomy } = useSmartTaggingStore()

  const allTags = taxonomy
    ? Object.values(taxonomy.sections).flat()
    : []

  const tagsBySection = taxonomy?.sections || {}

  const isValidTag = useCallback(
    (tagName: string) => {
      if (!taxonomy) return false
      const normalized = tagName.toLowerCase().trim()
      return allTags.some((t) => t.toLowerCase() === normalized)
    },
    [taxonomy, allTags]
  )

  const getTagSection = useCallback(
    (tagName: string): string | null => {
      if (!taxonomy) return null
      const normalized = tagName.toLowerCase().trim()
      for (const [section, tags] of Object.entries(taxonomy.sections)) {
        if (tags.some((t) => t.toLowerCase() === normalized)) {
          return section
        }
      }
      return null
    },
    [taxonomy]
  )

  return {
    taxonomy,
    allTags,
    tagsBySection,
    isLoading: isLoadingTaxonomy,
    reload: reloadTaxonomy,
    isValidTag,
    getTagSection
  }
}

/**
 * Hook to check LLM availability
 */
export function useLLMStatus() {
  const { llmAvailable, llmModels, isCheckingLLM, checkLLMAvailability } =
    useSmartTaggingStore()

  return {
    available: llmAvailable,
    models: llmModels,
    isChecking: isCheckingLLM,
    refresh: checkLLMAvailability
  }
}
