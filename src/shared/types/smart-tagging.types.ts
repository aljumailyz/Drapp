// Smart Tagging System Types

// Taxonomy Configuration
export interface TaxonomyTag {
  name: string
  section: string
  minConfidence: number
}

export interface TaxonomySection {
  name: string
  minConfidence: number
  tags: TaxonomyTag[]
}

export interface TaxonomyConfig {
  defaultMinConf: number
  lowConfidencePolicy: 'omit' | 'suggest' | 'ask'
  sections: Map<string, TaxonomySection>
  allTags: Map<string, TaxonomyTag>
}

// Frame Extraction
export interface ExtractedFrame {
  index: number
  timestampMs: number
  filePath: string
}

export interface FrameExtractionOptions {
  maxFrames: number
  sceneChangeThreshold: number
  minIntervalMs: number
  outputDir: string
}

// Embeddings
export interface FrameEmbedding {
  frameIndex: number
  embedding: Float32Array
}

export interface VideoEmbedding {
  videoId: string
  embedding: Float32Array
  frameCount: number
  modelVersion: string
}

// Similarity Search
export interface SimilarVideo {
  videoId: string
  title?: string
  similarity: number
  tags: VideoTagInfo[]
}

export interface VideoTagInfo {
  name: string
  confidence: number | null
  isLocked: boolean
}

// Tag Candidates
export interface TagCandidate {
  tagName: string
  section: string
  confidence: number
  contributors: TagContributor[]
  reason?: string
}

export interface TagContributor {
  videoId: string
  similarity: number
}

// Confidence Thresholds
export interface ConfidenceResult {
  accepted: TagCandidate[]
  suggestedLowConfidence: TagCandidate[]
  needsReview: TagCandidate[]
}

// LLM Refinement
export interface LLMRefinementInput {
  videoTitle?: string
  videoDescription?: string
  userNotes?: string
  candidates: TagCandidate[]
  similarVideos: SimilarVideo[]
  allowedTags: string[]
  taxonomyBySection: Map<string, string[]>
}

export interface LLMRefinedTag {
  tagName: string
  section: string
  confidence: number
  reason?: string
}

export interface LLMDroppedTag {
  tagName: string
  reason: string
}

export interface LLMRefinementOutput {
  refinedTags: LLMRefinedTag[]
  droppedTags: LLMDroppedTag[]
}

// Final Suggestion Result
export interface TagSuggestionResult {
  accepted: AcceptedTag[]
  suggestedLowConfidence: SuggestedTag[]
  needsReview: SuggestedTag[]
  evidence: SuggestionEvidence
}

export interface AcceptedTag {
  tagName: string
  section: string
  confidence: number
  reason?: string
}

export interface SuggestedTag {
  tagName: string
  section: string
  confidence: number
}

export interface SuggestionEvidence {
  similarVideos: SimilarVideoEvidence[]
  candidatesGenerated: number
  llmRefined: boolean
}

export interface SimilarVideoEvidence {
  videoId: string
  title?: string
  similarity: number
  tags: string[]
}

// Tag Events (Audit)
export type TagEventType = 'add' | 'remove' | 'lock' | 'unlock' | 'accept' | 'reject'
export type TagSource = 'user' | 'suggested' | 'ai_refined' | 'imported'
export type SuggestionState = 'accepted' | 'rejected' | 'pending' | null

export interface TagEvent {
  id: number
  videoId: string
  tagId: number
  eventType: TagEventType
  source: TagSource
  confidence?: number
  metadata?: Record<string, unknown>
  createdAt: string
}

// Service Configuration
export interface SmartTaggingConfig {
  enabled: boolean
  maxFramesPerVideo: number
  sceneChangeThreshold: number
  topKNeighbors: number
  minSimilarity: number
  useLLMRefinement: boolean
  lmStudioUrl: string
  lmStudioModel: string
  embeddingModel: string
  autoSuggestOnImport: boolean
  autoIndexOnImport: boolean
  taxonomyPath: string
}

export const DEFAULT_SMART_TAGGING_CONFIG: SmartTaggingConfig = {
  enabled: true,
  maxFramesPerVideo: 30,
  sceneChangeThreshold: 0.3,
  topKNeighbors: 10,
  minSimilarity: 0.3,
  useLLMRefinement: true,
  lmStudioUrl: 'http://localhost:1234/v1',
  lmStudioModel: 'auto',
  embeddingModel: 'clip-vit-base-patch32',
  autoSuggestOnImport: false,
  autoIndexOnImport: true,
  taxonomyPath: ''  // Set at runtime based on library path
}

// IPC Channel Types
export interface SmartTaggingIPC {
  // Indexing
  'smart-tagging:index-video': {
    params: { videoId: string; videoPath: string }
    result: { success: boolean; frameCount: number }
  }

  // Suggestions
  'smart-tagging:suggest-tags': {
    params: {
      videoId: string
      topK?: number
      useLLMRefinement?: boolean
      videoTitle?: string
      videoDescription?: string
      userNotes?: string
    }
    result: TagSuggestionResult
  }

  // Tag Management
  'smart-tagging:apply-decision': {
    params: { videoId: string; tagName: string; decision: 'accept' | 'reject' }
    result: { success: boolean }
  }

  'smart-tagging:add-tag': {
    params: { videoId: string; tagName: string; lock?: boolean }
    result: { success: boolean }
  }

  'smart-tagging:remove-tag': {
    params: { videoId: string; tagName: string; force?: boolean }
    result: { success: boolean; wasLocked: boolean }
  }

  'smart-tagging:lock-tag': {
    params: { videoId: string; tagName: string }
    result: { success: boolean }
  }

  'smart-tagging:unlock-tag': {
    params: { videoId: string; tagName: string }
    result: { success: boolean }
  }

  // Regeneration
  'smart-tagging:regenerate': {
    params: { videoId: string }
    result: TagSuggestionResult
  }

  // Taxonomy
  'smart-tagging:get-taxonomy': {
    params: Record<string, never>
    result: { sections: Record<string, string[]>; config: { defaultMinConf: number; policy: string } }
  }

  'smart-tagging:reload-taxonomy': {
    params: Record<string, never>
    result: { success: boolean; tagCount: number }
  }

  // Status
  'smart-tagging:get-video-tags': {
    params: { videoId: string }
    result: { tags: Array<{ name: string; section: string; confidence: number | null; isLocked: boolean; source: TagSource }> }
  }

  'smart-tagging:is-indexed': {
    params: { videoId: string }
    result: { indexed: boolean; frameCount: number | null }
  }
}
