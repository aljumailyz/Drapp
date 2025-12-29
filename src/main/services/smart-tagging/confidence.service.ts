import type { TagCandidate, ConfidenceResult } from '../../../shared/types/smart-tagging.types'
import type { TaxonomyService } from './taxonomy.service'

export class ConfidenceService {
  private taxonomyService: TaxonomyService

  constructor(taxonomyService: TaxonomyService) {
    this.taxonomyService = taxonomyService
  }

  /**
   * Apply confidence thresholds to tag candidates
   *
   * For each candidate:
   * - If confidence >= tag's minConfidence → accepted
   * - If confidence < minConfidence → handled by policy (omit/suggest/ask)
   */
  applyThresholds(candidates: TagCandidate[]): ConfidenceResult {
    const config = this.taxonomyService.getConfig()
    const policy = config.lowConfidencePolicy

    const accepted: TagCandidate[] = []
    const suggestedLowConfidence: TagCandidate[] = []
    const needsReview: TagCandidate[] = []

    for (const candidate of candidates) {
      const tagConfig = this.taxonomyService.getTagConfig(candidate.tagName)

      if (!tagConfig) {
        // Tag not in taxonomy - skip
        continue
      }

      const threshold = tagConfig.minConfidence

      if (candidate.confidence >= threshold) {
        // Above threshold - accept
        accepted.push(candidate)
      } else {
        // Below threshold - apply policy
        switch (policy) {
          case 'omit':
            // Don't include at all
            break

          case 'suggest':
            // Include as low-confidence suggestion
            suggestedLowConfidence.push(candidate)
            break

          case 'ask':
            // Include as needing review
            needsReview.push(candidate)
            break
        }
      }
    }

    return { accepted, suggestedLowConfidence, needsReview }
  }

  /**
   * Filter candidates to only those meeting a minimum confidence
   */
  filterByMinConfidence(candidates: TagCandidate[], minConfidence: number): TagCandidate[] {
    return candidates.filter(c => c.confidence >= minConfidence)
  }

  /**
   * Get candidates grouped by whether they meet their thresholds
   */
  categorize(candidates: TagCandidate[]): {
    aboveThreshold: TagCandidate[]
    belowThreshold: TagCandidate[]
    unknown: TagCandidate[]
  } {
    const aboveThreshold: TagCandidate[] = []
    const belowThreshold: TagCandidate[] = []
    const unknown: TagCandidate[] = []

    for (const candidate of candidates) {
      const tagConfig = this.taxonomyService.getTagConfig(candidate.tagName)

      if (!tagConfig) {
        unknown.push(candidate)
        continue
      }

      if (candidate.confidence >= tagConfig.minConfidence) {
        aboveThreshold.push(candidate)
      } else {
        belowThreshold.push(candidate)
      }
    }

    return { aboveThreshold, belowThreshold, unknown }
  }

  /**
   * Calculate how much above/below threshold each candidate is
   */
  getThresholdDeltas(candidates: TagCandidate[]): Array<{
    candidate: TagCandidate
    threshold: number
    delta: number
    meetsThreshold: boolean
  }> {
    return candidates.map(candidate => {
      const tagConfig = this.taxonomyService.getTagConfig(candidate.tagName)
      const threshold = tagConfig?.minConfidence ?? this.taxonomyService.getDefaultMinConf()

      return {
        candidate,
        threshold,
        delta: candidate.confidence - threshold,
        meetsThreshold: candidate.confidence >= threshold
      }
    })
  }

  /**
   * Get the top N candidates that meet their thresholds
   */
  getTopAccepted(candidates: TagCandidate[], limit: number): TagCandidate[] {
    const { accepted } = this.applyThresholds(candidates)
    return accepted.slice(0, limit)
  }

  /**
   * Check if a specific confidence value meets the threshold for a tag
   */
  meetsThreshold(tagName: string, confidence: number): boolean {
    const tagConfig = this.taxonomyService.getTagConfig(tagName)
    if (!tagConfig) return false
    return confidence >= tagConfig.minConfidence
  }

  /**
   * Get the threshold for a specific tag
   */
  getThreshold(tagName: string): number {
    const tagConfig = this.taxonomyService.getTagConfig(tagName)
    return tagConfig?.minConfidence ?? this.taxonomyService.getDefaultMinConf()
  }
}
