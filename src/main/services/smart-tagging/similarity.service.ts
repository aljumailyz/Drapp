import type Database from 'better-sqlite3'
import type { SimilarVideo, VideoTagInfo } from '../../../shared/types/smart-tagging.types'
import type { EmbeddingService } from './embedding.service'

export class SimilarityService {
  private db: Database.Database
  private embeddingService: EmbeddingService

  constructor(db: Database.Database, embeddingService: EmbeddingService) {
    this.db = db
    this.embeddingService = embeddingService
  }

  /**
   * Compute cosine similarity between two normalized vectors
   */
  cosineSimilarity(a: Float32Array, b: Float32Array): number {
    if (a.length !== b.length) {
      throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`)
    }

    let dot = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB)
    if (denominator === 0) return 0

    return dot / denominator
  }

  /**
   * Find the most similar videos to a target video
   */
  async findSimilarVideos(
    targetVideoId: string,
    topK: number = 10,
    minSimilarity: number = 0.3
  ): Promise<SimilarVideo[]> {
    const targetEmbedding = this.embeddingService.getVideoEmbedding(targetVideoId)

    if (!targetEmbedding) {
      throw new Error(`No embedding found for video ${targetVideoId}`)
    }

    // Get all video embeddings
    const allEmbeddings = this.embeddingService.getAllVideoEmbeddings()

    // Calculate similarities
    const similarities: Array<{ videoId: string; similarity: number }> = []

    for (const [videoId, embedding] of allEmbeddings) {
      // Skip self
      if (videoId === targetVideoId) continue

      const similarity = this.cosineSimilarity(targetEmbedding, embedding)

      if (similarity >= minSimilarity) {
        similarities.push({ videoId, similarity })
      }
    }

    // Sort by similarity descending
    similarities.sort((a, b) => b.similarity - a.similarity)

    // Take top K
    const topSimilar = similarities.slice(0, topK)

    // Fetch tags and metadata for each similar video
    const results: SimilarVideo[] = []

    for (const { videoId, similarity } of topSimilar) {
      const tags = this.getVideoTags(videoId)
      const title = this.getVideoTitle(videoId)

      results.push({
        videoId,
        title,
        similarity,
        tags
      })
    }

    return results
  }

  /**
   * Find similar videos using a raw embedding (for videos not yet in DB)
   */
  async findSimilarByEmbedding(
    embedding: Float32Array,
    topK: number = 10,
    minSimilarity: number = 0.3,
    excludeVideoId?: string
  ): Promise<SimilarVideo[]> {
    const allEmbeddings = this.embeddingService.getAllVideoEmbeddings()

    const similarities: Array<{ videoId: string; similarity: number }> = []

    for (const [videoId, storedEmbedding] of allEmbeddings) {
      if (excludeVideoId && videoId === excludeVideoId) continue

      const similarity = this.cosineSimilarity(embedding, storedEmbedding)

      if (similarity >= minSimilarity) {
        similarities.push({ videoId, similarity })
      }
    }

    similarities.sort((a, b) => b.similarity - a.similarity)
    const topSimilar = similarities.slice(0, topK)

    const results: SimilarVideo[] = []

    for (const { videoId, similarity } of topSimilar) {
      const tags = this.getVideoTags(videoId)
      const title = this.getVideoTitle(videoId)

      results.push({
        videoId,
        title,
        similarity,
        tags
      })
    }

    return results
  }

  /**
   * Get tags for a video
   */
  private getVideoTags(videoId: string): VideoTagInfo[] {
    const rows = this.db.prepare(`
      SELECT t.name, vt.confidence, vt.is_locked
      FROM video_tags vt
      JOIN tags t ON vt.tag_id = t.id
      WHERE vt.video_id = ?
      AND (vt.suggestion_state IS NULL OR vt.suggestion_state = 'accepted')
    `).all(videoId) as Array<{ name: string; confidence: number | null; is_locked: number }>

    return rows.map(row => ({
      name: row.name,
      confidence: row.confidence,
      isLocked: row.is_locked === 1
    }))
  }

  /**
   * Get video title
   */
  private getVideoTitle(videoId: string): string | undefined {
    const row = this.db.prepare(
      'SELECT title FROM videos WHERE id = ?'
    ).get(videoId) as { title: string | null } | undefined

    return row?.title ?? undefined
  }

  /**
   * Get videos that have at least one tag from a list
   */
  getVideosWithTags(tagNames: string[]): string[] {
    if (tagNames.length === 0) return []

    const placeholders = tagNames.map(() => '?').join(', ')
    const rows = this.db.prepare(`
      SELECT DISTINCT vt.video_id
      FROM video_tags vt
      JOIN tags t ON vt.tag_id = t.id
      WHERE t.name IN (${placeholders})
      AND (vt.suggestion_state IS NULL OR vt.suggestion_state = 'accepted')
    `).all(...tagNames) as Array<{ video_id: string }>

    return rows.map(row => row.video_id)
  }

  /**
   * Get videos that have embeddings
   */
  getIndexedVideoIds(): string[] {
    const rows = this.db.prepare(
      'SELECT video_id FROM video_embeddings'
    ).all() as Array<{ video_id: string }>

    return rows.map(row => row.video_id)
  }

  /**
   * Get count of indexed videos
   */
  getIndexedCount(): number {
    const row = this.db.prepare(
      'SELECT COUNT(*) as count FROM video_embeddings'
    ).get() as { count: number }

    return row.count
  }

  /**
   * Calculate average similarity between a video and a group of videos
   */
  async getAverageSimilarity(
    videoId: string,
    otherVideoIds: string[]
  ): Promise<number> {
    if (otherVideoIds.length === 0) return 0

    const targetEmbedding = this.embeddingService.getVideoEmbedding(videoId)
    if (!targetEmbedding) return 0

    let totalSimilarity = 0
    let count = 0

    for (const otherId of otherVideoIds) {
      const otherEmbedding = this.embeddingService.getVideoEmbedding(otherId)
      if (otherEmbedding) {
        totalSimilarity += this.cosineSimilarity(targetEmbedding, otherEmbedding)
        count++
      }
    }

    return count > 0 ? totalSimilarity / count : 0
  }
}
