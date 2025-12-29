import { LMStudioService } from './lmstudio.service'
import { OpenRouterService } from './openrouter.service'

export type LlmProvider = 'openrouter' | 'lmstudio'

export type ImageContent = {
  type: 'image_url'
  image_url: {
    url: string // base64 data URL or http URL
  }
}

export type TextContent = {
  type: 'text'
  text: string
}

export type MessageContent = string | Array<TextContent | ImageContent>

export type LlmClient = {
  complete: (request: {
    prompt: string
    model: string
    systemPrompt?: string
    temperature?: number
    maxTokens?: number
  }) => Promise<string>
  completeWithVision?: (request: {
    content: MessageContent
    model: string
    systemPrompt?: string
    temperature?: number
    maxTokens?: number
  }) => Promise<string>
}

export function createLlmProvider(
  provider: LlmProvider,
  config: { apiKey?: string; baseUrl?: string }
): LlmClient {
  if (provider === 'lmstudio') {
    return new LMStudioService({ baseUrl: config.baseUrl ?? 'http://localhost:1234/v1' })
  }

  return new OpenRouterService({ apiKey: config.apiKey ?? '', baseUrl: config.baseUrl })
}
