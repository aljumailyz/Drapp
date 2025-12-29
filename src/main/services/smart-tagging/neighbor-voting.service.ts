import type { TagCandidate, SimilarVideo } from '../../../shared/types/smart-tagging.types'
import type { TaxonomyService } from './taxonomy.service'
import type { SimilarityService } from './similarity.service'

export class NeighborVotingService {
  private taxonomyService: TaxonomyService
  private similarityService: SimilarityService

  constructor(taxonomyService: TaxonomyService, similarityService: SimilarityService) {
    this.taxonomyService = taxonomyService
    this.similarityService = similarityService
  }

  /**
   * Generate tag candidates using weighted neighbor voting
   *
   * For each tag in the taxonomy:
   *   confidence(tag) = sum(similarity_i * has_tag_i) / sum(similarity_i)
   *
   * where has_tag_i is 1 if neighbor i has the tag, 0 otherwise
   */
  async generateCandidates(
    targetVideoId: string,
    topK: number = 10
  ): Promise<TagCandidate[]> {
    // Find similar videos with their tags
    const similarVideos = await this.similarityService.findSimilarVideos(targetVideoId, topK)

    if (similarVideos.length === 0) {
      return []
    }

    return this.computeVotes(similarVideos)
  }

  /**
   * Generate candidates from a list of similar videos (for when we already have them)
   */
  computeVotes(similarVideos: SimilarVideo[]): TagCandidate[] {
    if (similarVideos.length === 0) {
      return []
    }

    // Track votes for each tag
    const tagVotes = new Map<string, {
      weightedSum: number
      totalWeight: number
      contributors: Array<{ videoId: string; similarity: number }>
    }>()

    // Get all allowed tags from taxonomy
    const allowedTags = new Set(this.taxonomyService.getAllowedTags())

    // Initialize vote tracking for all allowed tags
    for (const tagName of allowedTags) {
      tagVotes.set(tagName, {
        weightedSum: 0,
        totalWeight: 0,
        contributors: []
      })
    }

    // Accumulate votes from each similar video
    for (const video of similarVideos) {
      const videoTagNames = new Set(video.tags.map(t => t.name))

      // Process each allowed tag
      for (const tagName of allowedTags) {
        const votes = tagVotes.get(tagName)!

        if (videoTagNames.has(tagName)) {
          // Video has this tag - positive vote weighted by similarity
          votes.weightedSum += video.similarity
          votes.contributors.push({
            videoId: video.videoId,
            similarity: video.similarity
          })
        }

        // Always add to total weight for normalization
        votes.totalWeight += video.similarity
      }
    }

    // Calculate confidence for each tag and filter to those with positive votes
    const candidates: TagCandidate[] = []

    for (const [tagName, votes] of tagVotes) {
      // Skip tags with no positive votes
      if (votes.contributors.length === 0) continue

      // Skip if total weight is 0 (shouldn't happen but be safe)
      if (votes.totalWeight === 0) continue

      const confidence = votes.weightedSum / votes.totalWeight
      const tagConfig = this.taxonomyService.getTagConfig(tagName)

      if (!tagConfig) continue

      candidates.push({
        tagName,
        section: tagConfig.section,
        confidence,
        contributors: votes.contributors
      })
    }

    // Sort by confidence descending
    candidates.sort((a, b) => b.confidence - a.confidence)

    return candidates
  }

  /**
   * Generate candidates from similar videos found by embedding
   */
  async generateCandidatesFromEmbedding(
    embedding: Float32Array,
    topK: number = 10,
    excludeVideoId?: string
  ): Promise<TagCandidate[]> {
    const similarVideos = await this.similarityService.findSimilarByEmbedding(
      embedding,
      topK,
      0.3, // minSimilarity
      excludeVideoId
    )

    return this.computeVotes(similarVideos)
  }

  /**
   * Get tag distribution across similar videos
   */
  getTagDistribution(similarVideos: SimilarVideo[]): Map<string, {
    count: number
    avgSimilarity: number
    videos: string[]
  }> {
    const distribution = new Map<string, {
      count: number
      totalSimilarity: number
      videos: string[]
    }>()

    for (const video of similarVideos) {
      for (const tag of video.tags) {
        const existing = distribution.get(tag.name) || {
          count: 0,
          totalSimilarity: 0,
          videos: []
        }

        existing.count++
        existing.totalSimilarity += video.similarity
        existing.videos.push(video.videoId)

        distribution.set(tag.name, existing)
      }
    }

    // Convert to final format with avgSimilarity
    const result = new Map<string, {
      count: number
      avgSimilarity: number
      videos: string[]
    }>()

    for (const [tag, data] of distribution) {
      result.set(tag, {
        count: data.count,
        avgSimilarity: data.totalSimilarity / data.count,
        videos: data.videos
      })
    }

    return result
  }
}
