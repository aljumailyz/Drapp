import { Logger } from '../../utils/logger'
import type { MessageContent } from './llm.factory'

export type LocalLlmRequest = {
  prompt: string
  model: string
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
}

export type LocalVisionRequest = {
  content: MessageContent
  model: string
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
}

export class LMStudioService {
  private readonly logger = new Logger('LMStudioService')

  constructor(private readonly config: { baseUrl: string }) {}

  async complete(request: LocalLlmRequest): Promise<string> {
    this.logger.info('lm studio completion requested', { model: request.model })
    const baseUrl = (this.config.baseUrl ?? 'http://localhost:1234/v1').replace(/\/$/, '')

    let response: Response
    try {
      response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
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
        }),
        signal: AbortSignal.timeout(120000) // 2 minute timeout
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      if (message.includes('fetch failed') || message.includes('ECONNREFUSED')) {
        throw new Error('Cannot connect to LM Studio. Make sure LM Studio is running and the server is started on port 1234.')
      }
      throw new Error(`LM Studio connection failed: ${message}`)
    }

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`LM Studio error ${response.status}: ${errorText}`)
    }

    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> }
    const content = data.choices?.[0]?.message?.content?.trim()
    if (!content) {
      throw new Error('LM Studio returned empty response')
    }

    return content
  }

  async completeWithVision(request: LocalVisionRequest): Promise<string> {
    this.logger.info('lm studio vision completion requested', { model: request.model })
    const baseUrl = (this.config.baseUrl ?? 'http://localhost:1234/v1').replace(/\/$/, '')
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
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
      signal: AbortSignal.timeout(180000) // 3 minute timeout for vision (images take longer)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`LM Studio vision error ${response.status}: ${errorText}`)
    }

    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> }
    const content = data.choices?.[0]?.message?.content?.trim()
    if (!content) {
      throw new Error('LM Studio returned empty response')
    }

    return content
  }
}
