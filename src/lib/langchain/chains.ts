import { createLLM, getAvailableLLM } from './llm'
import { documentGenerationPrompt, patchGenerationPrompt, promptletRegenerationPrompt } from './prompts'
import { LLMProvider } from './config'
import { handleLLMError, LLMError } from './errors'

export async function generateDocument(
  promptlet: string,
  options?: {
    provider?: LLMProvider
    model?: string
    onToken?: (token: string) => void
  }
): Promise<string> {
  let llm
  let provider = options?.provider
  
  try {
    if (provider) {
      llm = createLLM(provider, options?.model)
    } else {
      const available = getAvailableLLM()
      llm = available.llm
      provider = available.provider
    }

    // Format the prompt
    const formattedPrompt = await documentGenerationPrompt.format({ promptlet })

    if (options?.onToken) {
      // Streaming mode
      const stream = await llm.stream(formattedPrompt)
      let fullText = ''
      
      for await (const chunk of stream) {
        const token = typeof chunk.content === 'string' ? chunk.content : ''
        fullText += token
        options.onToken(token)
      }
      
      return fullText
    } else {
      // Non-streaming mode
      const result = await llm.invoke(formattedPrompt)
      return typeof result.content === 'string' ? result.content : ''
    }
  } catch (error) {
    throw handleLLMError(error, provider)
  }
}

export async function generatePatch(
  originalText: string,
  patchPrompt: string,
  options?: {
    provider?: LLMProvider
    model?: string
    onToken?: (token: string) => void
  }
): Promise<string> {
  let llm
  let provider = options?.provider
  
  try {
    if (provider) {
      llm = createLLM(provider, options?.model)
    } else {
      const available = getAvailableLLM()
      if (!available) {
        throw new LLMError(
          'No API keys configured. Please add an OpenAI or Anthropic API key in settings.',
          'API_KEY_MISSING'
        )
      }
      llm = available.llm
      provider = available.provider
    }

    // Format the prompt
    const formattedPrompt = await patchGenerationPrompt.format({ originalText, patchPrompt })

    if (options?.onToken) {
      // Streaming mode
      const stream = await llm.stream(formattedPrompt)
      let fullText = ''
      
      for await (const chunk of stream) {
        const token = typeof chunk.content === 'string' ? chunk.content : ''
        fullText += token
        options.onToken(token)
      }
      
      return fullText
    } else {
      // Non-streaming mode
      const result = await llm.invoke(formattedPrompt)
      return typeof result.content === 'string' ? result.content : ''
    }
  } catch (error) {
    throw handleLLMError(error, provider)
  }
}

export async function regeneratePromptlet(
  document: string,
  options?: {
    provider?: LLMProvider
    model?: string
  }
): Promise<string> {
  let llm
  let provider = options?.provider
  
  try {
    if (provider) {
      llm = createLLM(provider, options?.model)
    } else {
      const available = getAvailableLLM()
      if (!available) {
        throw new LLMError(
          'No API keys configured. Please add an OpenAI or Anthropic API key in settings.',
          'API_KEY_MISSING'
        )
      }
      llm = available.llm
      provider = available.provider
    }

    // Format the prompt
    const formattedPrompt = await promptletRegenerationPrompt.format({ document })

    const result = await llm.invoke(formattedPrompt)
    return typeof result.content === 'string' ? result.content : ''
  } catch (error) {
    throw handleLLMError(error, provider)
  }
}