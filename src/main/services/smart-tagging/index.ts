import { join } from 'node:path'
import { app } from 'electron'
import type Database from 'better-sqlite3'
import type {
  TagSuggestionResult,
  AcceptedTag,
  SuggestedTag,
  TagCandidate,
  SmartTaggingConfig,
  DEFAULT_SMART_TAGGING_CONFIG,
  TagSource
} from '../../../shared/types/smart-tagging.types'

import { TaxonomyService } from './taxonomy.service'
import { FrameExtractorService } from './frame-extractor.service'
import { EmbeddingService } from './embedding.service'
import { SimilarityService } from './similarity.service'
import { NeighborVotingService } from './neighbor-voting.service'
import { ConfidenceService } from './confidence.service'
import { LLMRefinerService } from './llm-refiner.service'

export class SmartTaggingService {
  private db: Database.Database
  private config: SmartTaggingConfig
  private taxonomyService: TaxonomyService
  private frameExtractor: FrameExtractorService
  private embeddingService: EmbeddingService
  private similarityService: SimilarityService
  private neighborVoting: NeighborVotingService
  private confidenceService: ConfidenceService
  private llmRefiner: LLMRefinerService
  private initialized = false

  constructor(db: Database.Database, config: Partial<SmartTaggingConfig> = {}) {
    this.db = db

    // Merge with defaults
    const defaultConfig = {
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
      taxonomyPath: join(app.getPath('userData'), 'tags.txt')
    }

    this.config = { ...defaultConfig, ...config }

    // Initialize services
    this.taxonomyService = new TaxonomyService(this.config.taxonomyPath)
    this.frameExtractor = new FrameExtractorService()
    this.embeddingService = new EmbeddingService(db, {
      modelName: this.config.embeddingModel
    })
    this.similarityService = new SimilarityService(db, this.embeddingService)
    this.neighborVoting = new NeighborVotingService(this.taxonomyService, this.similarityService)
    this.confidenceService = new ConfidenceService(this.taxonomyService)
    this.llmRefiner = new LLMRefinerService({
      baseUrl: this.config.lmStudioUrl,
      modelName: this.config.lmStudioModel
    })
  }

  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      await this.taxonomyService.load()
      console.log(`Loaded taxonomy with ${this.taxonomyService.getTagCount()} tags`)
    } catch (error) {
      console.warn('Failed to load taxonomy:', error)
    }

    try {
      await this.embeddingService.initialize()
    } catch (error) {
      console.warn('Failed to initialize embedding service:', error)
    }

    this.initialized = true
  }

  /**
   * Index a video: extract frames, compute embeddings, store
   */
  async indexVideo(videoId: string, videoPath: string): Promise<{ success: boolean; frameCount: number }> {
    if (!this.config.enabled) {
      return { success: false, frameCount: 0 }
    }

    try {
      // Extract frames
      const frames = await this.frameExtractor.extractFrames(videoPath, videoId, {
        maxFrames: this.config.maxFramesPerVideo,
        sceneChangeThreshold: this.config.sceneChangeThreshold
      })

      if (frames.length === 0) {
        console.warn(`No frames extracted for video ${videoId}`)
        return { success: false, frameCount: 0 }
      }

      // Check if embedding service is available
      if (!this.embeddingService.isAvailable()) {
        console.warn('Embedding service not available, skipping embedding')
        return { success: true, frameCount: frames.length }
      }

      // Compute embeddings for each frame
      const embeddings = await this.embeddingService.embedFrames(frames)

      // Store frame embeddings
      for (const frame of frames) {
        const embedding = embeddings.get(frame.index)
        if (embedding) {
          this.embeddingService.storeFrameEmbedding(
            videoId,
            frame.index,
            frame.timestampMs,
            frame.filePath,
            embedding
          )
        }
      }

      // Compute and store aggregated embedding
      const allEmbeddings = Array.from(embeddings.values())
      if (allEmbeddings.length > 0) {
        const aggregated = this.embeddingService.computeAggregatedEmbedding(allEmbeddings)
        this.embeddingService.storeVideoEmbedding(videoId, aggregated, frames.length)
      }

      return { success: true, frameCount: frames.length }
    } catch (error) {
      console.error(`Failed to index video ${videoId}:`, error)
      return { success: false, frameCount: 0 }
    }
  }

  /**
   * Suggest tags for a video based on similar tagged videos
   */
  async suggestTags(
    videoId: string,
    options: {
      topK?: number
      useLLMRefinement?: boolean
      videoTitle?: string
      videoDescription?: string
      userNotes?: string
    } = {}
  ): Promise<TagSuggestionResult> {
    const {
      topK = this.config.topKNeighbors,
      useLLMRefinement = this.config.useLLMRefinement,
      videoTitle,
      videoDescription,
      userNotes
    } = options

    // Generate candidates via neighbor voting
    const candidates = await this.neighborVoting.generateCandidates(videoId, topK)

    // Get similar videos for evidence
    const similarVideos = await this.similarityService.findSimilarVideos(videoId, topK)

    let finalCandidates = candidates
    let llmRefined = false

    // Optional LLM refinement
    if (useLLMRefinement && await this.llmRefiner.isAvailable()) {
      try {
        const refined = await this.llmRefiner.refine({
          videoTitle,
          videoDescription,
          userNotes,
          candidates,
          similarVideos,
          allowedTags: this.taxonomyService.getAllowedTags(),
          taxonomyBySection: this.taxonomyService.getTagsBySection()
        })

        // Replace candidates with refined version, preserving contributor info
        finalCandidates = refined.refinedTags.map(t => {
          const originalCandidate = candidates.find(c => c.tagName === t.tagName)
          return {
            tagName: t.tagName,
            section: t.section,
            confidence: t.confidence,
            contributors: originalCandidate?.contributors || [],
            reason: t.reason
          }
        })

        llmRefined = true
      } catch (error) {
        console.warn('LLM refinement failed, using raw candidates:', error)
      }
    }

    // Apply confidence thresholds
    const { accepted, suggestedLowConfidence, needsReview } =
      this.confidenceService.applyThresholds(finalCandidates)

    // Build result
    return {
      accepted: accepted.map(c => ({
        tagName: c.tagName,
        section: c.section,
        confidence: c.confidence,
        reason: c.reason
      })),
      suggestedLowConfidence: suggestedLowConfidence.map(c => ({
        tagName: c.tagName,
        section: c.section,
        confidence: c.confidence
      })),
      needsReview: needsReview.map(c => ({
        tagName: c.tagName,
        section: c.section,
        confidence: c.confidence
      })),
      evidence: {
        similarVideos: similarVideos.map(v => ({
          videoId: v.videoId,
          title: v.title,
          similarity: v.similarity,
          tags: v.tags.map(t => t.name)
        })),
        candidatesGenerated: candidates.length,
        llmRefined
      }
    }
  }

  /**
   * Apply user's tag decision (accept/reject a suggestion)
   */
  async applyTagDecision(
    videoId: string,
    tagName: string,
    decision: 'accept' | 'reject'
  ): Promise<void> {
    const tag = this.getOrCreateTag(tagName)

    if (decision === 'accept') {
      const id = `${videoId}_${tag.id}`
      this.db.prepare(`
        INSERT OR REPLACE INTO video_tags
        (id, video_id, tag_id, source, suggestion_state, updated_at)
        VALUES (?, ?, ?, 'suggested', 'accepted', CURRENT_TIMESTAMP)
      `).run(id, videoId, tag.id)
    }

    // Log the event
    this.db.prepare(`
      INSERT INTO tag_events (video_id, tag_id, event_type, source)
      VALUES (?, ?, ?, 'user')
    `).run(videoId, tag.id, decision)
  }

  /**
   * Add a user tag manually
   * Supports both taxonomy tags and custom user-defined tags
   */
  addUserTag(videoId: string, tagName: string, lock: boolean = false): void {
    // Allow custom tags - if not in taxonomy, create it in the "Custom" section
    const isFromTaxonomy = this.taxonomyService.isValidTag(tagName)
    const tag = isFromTaxonomy
      ? this.getOrCreateTag(tagName)
      : this.getOrCreateCustomTag(tagName)

    const id = `${videoId}_${tag.id}`

    this.db.prepare(`
      INSERT OR REPLACE INTO video_tags
      (id, video_id, tag_id, source, is_locked, locked_at, suggestion_state, updated_at)
      VALUES (?, ?, ?, 'user', ?, ?, NULL, CURRENT_TIMESTAMP)
    `).run(
      id,
      videoId,
      tag.id,
      lock ? 1 : 0,
      lock ? new Date().toISOString() : null
    )

    this.db.prepare(`
      INSERT INTO tag_events (video_id, tag_id, event_type, source)
      VALUES (?, ?, 'add', 'user')
    `).run(videoId, tag.id)
  }

  /**
   * Lock a tag (protected from regeneration)
   */
  lockTag(videoId: string, tagName: string): void {
    const tag = this.getTag(tagName)
    if (!tag) {
      throw new Error(`Tag "${tagName}" not found`)
    }

    this.db.prepare(`
      UPDATE video_tags
      SET is_locked = 1, locked_at = CURRENT_TIMESTAMP, locked_by = 'user'
      WHERE video_id = ? AND tag_id = ?
    `).run(videoId, tag.id)

    this.db.prepare(`
      INSERT INTO tag_events (video_id, tag_id, event_type, source)
      VALUES (?, ?, 'lock', 'user')
    `).run(videoId, tag.id)
  }

  /**
   * Unlock a tag
   */
  unlockTag(videoId: string, tagName: string): void {
    const tag = this.getTag(tagName)
    if (!tag) {
      throw new Error(`Tag "${tagName}" not found`)
    }

    this.db.prepare(`
      UPDATE video_tags
      SET is_locked = 0, locked_at = NULL, locked_by = NULL
      WHERE video_id = ? AND tag_id = ?
    `).run(videoId, tag.id)

    this.db.prepare(`
      INSERT INTO tag_events (video_id, tag_id, event_type, source)
      VALUES (?, ?, 'unlock', 'user')
    `).run(videoId, tag.id)
  }

  /**
   * Remove a tag (respects locks)
   */
  removeTag(videoId: string, tagName: string, force: boolean = false): { success: boolean; wasLocked: boolean } {
    const tag = this.getTag(tagName)
    if (!tag) {
      return { success: false, wasLocked: false }
    }

    // Check if locked
    const existing = this.db.prepare(`
      SELECT is_locked FROM video_tags
      WHERE video_id = ? AND tag_id = ?
    `).get(videoId, tag.id) as { is_locked: number } | undefined

    const wasLocked = existing?.is_locked === 1

    if (wasLocked && !force) {
      return { success: false, wasLocked: true }
    }

    this.db.prepare(`
      DELETE FROM video_tags
      WHERE video_id = ? AND tag_id = ?
    `).run(videoId, tag.id)

    this.db.prepare(`
      INSERT INTO tag_events (video_id, tag_id, event_type, source)
      VALUES (?, ?, 'remove', 'user')
    `).run(videoId, tag.id)

    return { success: true, wasLocked }
  }

  /**
   * Regenerate suggestions (preserves locked tags)
   */
  async regenerateSuggestions(videoId: string): Promise<TagSuggestionResult> {
    // Get locked tags
    const lockedTags = this.db.prepare(`
      SELECT t.name FROM video_tags vt
      JOIN tags t ON vt.tag_id = t.id
      WHERE vt.video_id = ? AND vt.is_locked = 1
    `).all(videoId) as Array<{ name: string }>

    const lockedTagNames = new Set(lockedTags.map(t => t.name))

    // Clear non-locked suggested tags
    this.db.prepare(`
      DELETE FROM video_tags
      WHERE video_id = ? AND is_locked = 0 AND source IN ('suggested', 'ai_refined')
    `).run(videoId)

    // Generate new suggestions
    const suggestions = await this.suggestTags(videoId)

    // Filter out already-locked tags from accepted
    suggestions.accepted = suggestions.accepted.filter(t => !lockedTagNames.has(t.tagName))

    return suggestions
  }

  /**
   * Get tags for a video
   */
  getVideoTags(videoId: string): Array<{
    name: string
    section: string
    confidence: number | null
    isLocked: boolean
    source: TagSource
  }> {
    const rows = this.db.prepare(`
      SELECT t.name, t.section, vt.confidence, vt.is_locked, vt.source
      FROM video_tags vt
      JOIN tags t ON vt.tag_id = t.id
      WHERE vt.video_id = ?
      AND (vt.suggestion_state IS NULL OR vt.suggestion_state = 'accepted')
    `).all(videoId) as Array<{
      name: string
      section: string | null
      confidence: number | null
      is_locked: number
      source: string
    }>

    return rows.map(row => ({
      name: row.name,
      section: row.section || 'Unknown',
      confidence: row.confidence,
      isLocked: row.is_locked === 1,
      source: row.source as TagSource
    }))
  }

  /**
   * Check if a video is indexed
   */
  isVideoIndexed(videoId: string): { indexed: boolean; frameCount: number | null } {
    return this.embeddingService.isVideoIndexed(videoId)
  }

  /**
   * Get taxonomy information
   */
  getTaxonomy(): { sections: Record<string, string[]>; config: { defaultMinConf: number; policy: string } } {
    return this.taxonomyService.toJSON()
  }

  /**
   * Reload taxonomy from file
   */
  async reloadTaxonomy(): Promise<{ success: boolean; tagCount: number }> {
    try {
      await this.taxonomyService.load()
      return { success: true, tagCount: this.taxonomyService.getTagCount() }
    } catch (error) {
      console.error('Failed to reload taxonomy:', error)
      return { success: false, tagCount: 0 }
    }
  }

  /**
   * Cleanup resources for a video
   */
  async cleanupVideo(videoId: string): Promise<void> {
    // Delete embeddings
    this.embeddingService.deleteVideoEmbeddings(videoId)

    // Cleanup frame files
    await this.frameExtractor.cleanup(videoId)
  }

  // Helper methods
  private getTag(tagName: string): { id: number; name: string } | undefined {
    const normalized = this.taxonomyService.normalizeTagName(tagName)
    return this.db.prepare('SELECT id, name FROM tags WHERE name = ?').get(normalized) as
      { id: number; name: string } | undefined
  }

  private getOrCreateTag(tagName: string): { id: number; name: string } {
    const normalized = this.taxonomyService.normalizeTagName(tagName)
    let existing = this.getTag(normalized)

    if (existing) return existing

    const tagConfig = this.taxonomyService.getTagConfig(normalized)

    this.db.prepare(`
      INSERT INTO tags (name, section, is_ai_generated) VALUES (?, ?, 0)
    `).run(normalized, tagConfig?.section || null)

    existing = this.getTag(normalized)
    if (!existing) {
      throw new Error(`Failed to create tag: ${normalized}`)
    }

    return existing
  }

  private getOrCreateCustomTag(tagName: string): { id: number; name: string } {
    // Normalize custom tag name: lowercase, trim, replace spaces with dashes
    const normalized = tagName.toLowerCase().trim().replace(/\s+/g, '-')

    // Check if tag already exists
    let existing = this.getTag(normalized)
    if (existing) return existing

    // Create new custom tag in the "Custom" section
    this.db.prepare(`
      INSERT INTO tags (name, section, is_ai_generated) VALUES (?, 'Custom', 0)
    `).run(normalized)

    existing = this.getTag(normalized)
    if (!existing) {
      throw new Error(`Failed to create custom tag: ${normalized}`)
    }

    return existing
  }

  // Expose services for advanced usage
  getTaxonomyService(): TaxonomyService {
    return this.taxonomyService
  }

  getEmbeddingService(): EmbeddingService {
    return this.embeddingService
  }

  getSimilarityService(): SimilarityService {
    return this.similarityService
  }

  getLLMRefiner(): LLMRefinerService {
    return this.llmRefiner
  }
}

// Re-export all services
export { TaxonomyService } from './taxonomy.service'
export { FrameExtractorService } from './frame-extractor.service'
export { EmbeddingService } from './embedding.service'
export { SimilarityService } from './similarity.service'
export { NeighborVotingService } from './neighbor-voting.service'
export { ConfidenceService } from './confidence.service'
export { LLMRefinerService } from './llm-refiner.service'
