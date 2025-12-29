import type {
  TagCandidate,
  SimilarVideo,
  LLMRefinementInput,
  LLMRefinementOutput,
  LLMRefinedTag,
  LLMDroppedTag
} from '../../../shared/types/smart-tagging.types'

interface LLMConfig {
  baseUrl: string
  modelName: string
  timeout: number
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

export class LLMRefinerService {
  private config: LLMConfig

  constructor(config: Partial<LLMConfig> = {}) {
    this.config = {
      baseUrl: 'http://localhost:1234/v1',
      modelName: 'auto',
      timeout: 30000,
      ...config
    }
  }

  /**
   * Check if LM Studio is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/models`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      })

      if (!response.ok) return false

      const data = await response.json()
      return Array.isArray(data.data) && data.data.length > 0
    } catch {
      return false
    }
  }

  /**
   * Get available models from LM Studio
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/models`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      })

      if (!response.ok) return []

      const data = await response.json()
      return data.data?.map((m: { id: string }) => m.id) || []
    } catch {
      return []
    }
  }

  /**
   * Refine tag candidates using the local LLM
   */
  async refine(input: LLMRefinementInput): Promise<LLMRefinementOutput> {
    const systemPrompt = this.buildSystemPrompt(input)
    const userPrompt = this.buildUserPrompt(input)

    let response: string
    try {
      response = await this.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ])
    } catch (error) {
      console.error('LLM chat failed:', error)
      throw error
    }

    // Parse and validate JSON
    let parsed: unknown
    try {
      parsed = JSON.parse(response)
    } catch {
      // Retry once with correction prompt
      console.warn('Invalid JSON from LLM, retrying...')

      try {
        response = await this.chat([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
          { role: 'assistant', content: response },
          {
            role: 'user',
            content: 'Your response was not valid JSON. Please respond with ONLY a valid JSON object matching the required schema. No markdown, no explanation, just the JSON.'
          }
        ])

        parsed = JSON.parse(response)
      } catch (retryError) {
        console.error('LLM retry failed:', retryError)
        throw new Error('Failed to get valid JSON from LLM after retry')
      }
    }

    // Validate and filter output
    return this.validateOutput(parsed, input.allowedTags)
  }

  private async chat(messages: ChatMessage[]): Promise<string> {
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.config.modelName === 'auto' ? undefined : this.config.modelName,
        messages,
        temperature: 0.1, // Low temperature for determinism
        max_tokens: 2000
      }),
      signal: AbortSignal.timeout(this.config.timeout)
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`LLM request failed: ${response.status} ${error}`)
    }

    const data = await response.json() as ChatCompletionResponse
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('No content in LLM response')
    }

    // Clean up response - remove markdown code blocks if present
    return content
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()
  }

  private buildSystemPrompt(input: LLMRefinementInput): string {
    // Build taxonomy section
    const taxonomyLines: string[] = []
    for (const [section, tags] of input.taxonomyBySection) {
      taxonomyLines.push(`[${section}]`)
      taxonomyLines.push(tags.join(', '))
      taxonomyLines.push('')
    }

    return `You are a tag refinement assistant for a video library application.

Your job is to:
1. Review tag candidates generated from similar video analysis
2. Resolve any conflicts or redundancies between tags
3. Map synonyms to canonical tags from the allowed taxonomy
4. Provide brief reasons for significant decisions

CRITICAL RULES:
- You may ONLY output tags that exist in the allowed taxonomy below
- You must NEVER invent new tags or use variations not in the list
- You must NEVER infer sensitive attributes (age, ethnicity, identity, etc.)
- Be deterministic and consistent
- When in doubt, drop the tag rather than guess

ALLOWED TAXONOMY:
${taxonomyLines.join('\n')}

OUTPUT FORMAT (strict JSON, no markdown):
{
  "refined_tags": [
    { "tag_name": "exact-tag-from-taxonomy", "section": "section-name", "confidence": 0.85, "reason": "optional explanation" }
  ],
  "dropped_tags": [
    { "tag_name": "original-tag", "reason": "why it was dropped" }
  ]
}

IMPORTANT: Respond with ONLY the JSON object. No markdown code blocks, no explanation text, just the raw JSON.`
  }

  private buildUserPrompt(input: LLMRefinementInput): string {
    // Format candidates
    const candidatesLines = input.candidates
      .slice(0, 20) // Limit to top 20
      .map(c => `- ${c.tagName} (${c.section}): confidence=${c.confidence.toFixed(3)}`)
      .join('\n')

    // Format similar videos
    const similarLines = input.similarVideos
      .slice(0, 5) // Limit to top 5
      .map(v => {
        const tagList = v.tags.map(t => t.name).join(', ')
        return `- "${v.title || v.videoId}" (sim=${v.similarity.toFixed(3)}): [${tagList}]`
      })
      .join('\n')

    let prompt = `Refine these tag candidates for a video:

TAG CANDIDATES (from neighbor voting):
${candidatesLines}

SIMILAR VIDEOS USED:
${similarLines}
`

    if (input.videoTitle) {
      prompt += `\nVIDEO TITLE: ${input.videoTitle}`
    }

    if (input.videoDescription) {
      const desc = input.videoDescription.slice(0, 500)
      prompt += `\nVIDEO DESCRIPTION: ${desc}${input.videoDescription.length > 500 ? '...' : ''}`
    }

    if (input.userNotes) {
      prompt += `\nUSER NOTES: ${input.userNotes}`
    }

    prompt += `\n\nRespond with ONLY the JSON object.`

    return prompt
  }

  private validateOutput(parsed: unknown, allowedTags: string[]): LLMRefinementOutput {
    const allowedSet = new Set(allowedTags.map(t => t.toLowerCase()))
    const refinedTags: LLMRefinedTag[] = []
    const droppedTags: LLMDroppedTag[] = []

    // Type guard
    if (!parsed || typeof parsed !== 'object') {
      return { refinedTags: [], droppedTags: [] }
    }

    const data = parsed as Record<string, unknown>

    // Process refined tags
    const rawRefined = Array.isArray(data.refined_tags) ? data.refined_tags : []

    for (const tag of rawRefined) {
      if (!tag || typeof tag !== 'object') continue

      const tagObj = tag as Record<string, unknown>
      const rawName = tagObj.tag_name

      if (typeof rawName !== 'string') continue

      const normalizedName = rawName.toLowerCase().trim().replace(/\s+/g, '-')

      // Validate against allowed tags
      if (!allowedSet.has(normalizedName)) {
        console.warn(`LLM produced unknown tag: ${rawName}`)
        droppedTags.push({
          tagName: rawName,
          reason: 'Not in allowed taxonomy'
        })
        continue
      }

      refinedTags.push({
        tagName: normalizedName,
        section: typeof tagObj.section === 'string' ? tagObj.section : 'Unknown',
        confidence: Math.min(1, Math.max(0, typeof tagObj.confidence === 'number' ? tagObj.confidence : 0)),
        reason: typeof tagObj.reason === 'string' ? tagObj.reason : undefined
      })
    }

    // Process dropped tags from LLM
    const rawDropped = Array.isArray(data.dropped_tags) ? data.dropped_tags : []

    for (const tag of rawDropped) {
      if (!tag || typeof tag !== 'object') continue

      const tagObj = tag as Record<string, unknown>

      if (typeof tagObj.tag_name === 'string') {
        droppedTags.push({
          tagName: tagObj.tag_name,
          reason: typeof tagObj.reason === 'string' ? tagObj.reason : 'Dropped by LLM'
        })
      }
    }

    return { refinedTags, droppedTags }
  }

  /**
   * Update LLM configuration
   */
  configure(config: Partial<LLMConfig>): void {
    this.config = { ...this.config, ...config }
  }

  getConfig(): LLMConfig {
    return { ...this.config }
  }
}
