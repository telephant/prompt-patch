export const DEFAULT_API_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '', //
  endpoint: process.env.NEXT_PUBLIC_OPENAI_ENDPOINT || 'https://api.chatanywhere.tech/v1',
  model: process.env.NEXT_PUBLIC_OPENAI_MODEL || 'gpt-4-turbo-preview',
}

export const LLM_CONFIG = {
  openai: {
    defaultModel: 'gpt-4-turbo-preview',
    models: ['gpt-4-turbo-preview', 'gpt-3.5-turbo'],
    temperature: 0.7,
    maxTokens: 2000,
    pricing: { input: 0.01, output: 0.03 }, // per 1K tokens (approximate)
    // Custom OpenAI keys use official endpoint (no override needed)
  },
  anthropic: {
    defaultModel: 'claude-3-sonnet-20240229',
    models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
    temperature: 0.7,
    maxTokens: 2000,
    pricing: { input: 0.015, output: 0.075 }, // per 1K tokens (approximate)
    // Custom Anthropic keys use official endpoint (no override needed)
  },
  default: {
    defaultModel: DEFAULT_API_CONFIG.model,
    models: [DEFAULT_API_CONFIG.model],
    temperature: 0.7,
    maxTokens: 2000,
    pricing: { input: 0, output: 0 }, // Free tier
    endpoint: DEFAULT_API_CONFIG.endpoint, // Only default key uses custom endpoint
  },
} as const

export type LLMProvider = keyof typeof LLM_CONFIG
export type OpenAIModel = typeof LLM_CONFIG.openai.models[number]
export type AnthropicModel = typeof LLM_CONFIG.anthropic.models[number]