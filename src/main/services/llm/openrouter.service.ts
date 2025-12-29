import { Logger } from '../../utils/logger'
import type { MessageContent } from './llm.factory'

export type LlmRequest = {
  prompt: string
  model: string
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
}

export type VisionRequest = {
  content: MessageContent
  model: string
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
}

export class OpenRouterService {
  private readonly logger = new Logger('OpenRouterService')

  constructor(private readonly config: { apiKey: string; baseUrl?: string }) {}

  async complete(request: LlmRequest): Promise<string> {
    this.logger.info('openrouter completion requested', { model: request.model })
    if (!this.config.apiKey) {
      throw new Error('OpenRouter API key is not set')
    }

    const baseUrl = (this.config.baseUrl ?? 'https://openrouter.ai/api/v1').replace(/\/$/, '')
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: request.model,
        messages: [
          request.systemPrompt ? { role: 'system', content: request.systemPrompt } : null,
          { role: 'user', content: request.prompt }
        ].filter(Boolean),
        temperature: request.temperature ?? 0.2,
        max_tokens: request.maxTokens ?? 512
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenRouter error ${response.status}: ${errorText}`)
    }

    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> }
    const content = data.choices?.[0]?.message?.content?.trim()
    if (!content) {
      throw new Error('OpenRouter returned empty response')
    }

    return content
  }

  async completeWithVision(request: VisionRequest): Promise<string> {
    this.logger.info('openrouter vision completion requested', { model: request.model })
    if (!this.config.apiKey) {
      throw new Error('OpenRouter API key is not set')
    }

    const baseUrl = (this.config.baseUrl ?? 'https://openrouter.ai/api/v1').replace(/\/$/, '')
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: request.model,
        messages: [
          request.systemPrompt ? { role: 'system', content: request.systemPrompt } : null,
          { role: 'user', content: request.content }
        ].filter(Boolean),
        temperature: request.temperature ?? 0.2,
        max_tokens: request.maxTokens ?? 1024
      }),
      signal: AbortSignal.timeout(120000) // 2 minute timeout for OpenRouter
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenRouter vision error ${response.status}: ${errorText}`)
    }

    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> }
    const content = data.choices?.[0]?.message?.content?.trim()
    if (!content) {
      throw new Error('OpenRouter returned empty response')
    }

    return content
  }
}
