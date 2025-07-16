import { ChatOpenAI } from '@langchain/openai'
import { ChatAnthropic } from '@langchain/anthropic'
import { APIKeyManager } from '@/lib/api-keys/manager'
import { LLM_CONFIG, LLMProvider } from './config'
import { LLMError } from './errors'

export function createLLM(provider?: LLMProvider, model?: string) {
  const effectiveKey = APIKeyManager.getEffective(provider)
  
  if (!effectiveKey) {
    throw new LLMError(
      'No API key available. This should not happen.',
      'API_KEY_MISSING'
    )
  }

  const config = LLM_CONFIG[effectiveKey.provider]
  const modelName = model || config.defaultModel
  
  switch (effectiveKey.provider) {
    case 'openai':
      return new ChatOpenAI({
        apiKey: effectiveKey.key,
        modelName: modelName,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        streaming: true,
        timeout: 30000,
        // Custom keys use official endpoints (no baseURL override)
      })
    
    case 'anthropic':
      return new ChatAnthropic({
        apiKey: effectiveKey.key,
        modelName: modelName,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        streaming: true,
        // Custom keys use official endpoints (no baseURL override)
      })
    
    case 'default':
      // Use OpenAI-compatible endpoint with default key
      return new ChatOpenAI({
        apiKey: effectiveKey.key,
        modelName: modelName,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        streaming: true,
        timeout: 30000,
        configuration: {
          baseURL: 'endpoint' in config ? config.endpoint : undefined,
        },
      })
    
    default:
      throw new LLMError(
        `Unknown provider: ${effectiveKey.provider}`,
        'INVALID_REQUEST'
      )
  }
}

export function getAvailableLLM(): { provider: LLMProvider; llm: ChatOpenAI | ChatAnthropic; isDefault: boolean } {
  const effectiveKey = APIKeyManager.getEffective()
  
  if (!effectiveKey) {
    throw new LLMError(
      'No API key available. This should not happen.',
      'API_KEY_MISSING'
    )
  }
  
  try {
    const llm = createLLM(effectiveKey.provider)
    return { 
      provider: effectiveKey.provider, 
      llm,
      isDefault: effectiveKey.isDefault
    }
  } catch (error) {
    console.error('Failed to create LLM:', error)
    throw error
  }
}