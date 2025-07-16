import { useCallback, useState } from 'react'
import { generateDocument, generatePatch, regeneratePromptlet } from '@/lib/langchain/chains'
import { promptOptimizer } from '@/lib/langchain/optimizePrompt'
import { LLMProvider } from '@/lib/langchain/config'
import { LLMError } from '@/lib/langchain/errors'
import { APIKeyManager } from '@/lib/api-keys/manager'

interface UseLangChainOptions {
  provider?: LLMProvider
  model?: string
}

export function useLangChain(options?: UseLangChainOptions) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<LLMError | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const handleGenerateDocument = useCallback(async (
    promptlet: string,
    onToken?: (token: string) => void
  ): Promise<string | null> => {
    if (!promptlet.trim()) {
      const error = new LLMError('Promptlet cannot be empty', 'INVALID_REQUEST')
      setError(error)
      return null
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const result = await generateDocument(promptlet, {
        ...options,
        onToken,
      })
      return result
    } catch (err) {
      console.error('Document generation error:', err)
      const llmError = err instanceof LLMError ? err : new LLMError(
        `Unknown error occurred: ${err instanceof Error ? err.message : 'Unknown error'}`, 
        'UNKNOWN'
      )
      setError(llmError)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [options])

  const handleGeneratePatch = useCallback(async (
    originalText: string,
    patchPrompt: string,
    onToken?: (token: string) => void
  ): Promise<string | null> => {
    if (!originalText.trim() || !patchPrompt.trim()) {
      const error = new LLMError('Original text and patch prompt cannot be empty', 'INVALID_REQUEST')
      setError(error)
      return null
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const result = await generatePatch(originalText, patchPrompt, {
        ...options,
        onToken,
      })
      return result
    } catch (err) {
      const llmError = err instanceof LLMError ? err : new LLMError('Unknown error occurred', 'UNKNOWN')
      setError(llmError)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [options])

  const handleRegeneratePromptlet = useCallback(async (
    document: string
  ): Promise<string | null> => {
    if (!document.trim()) {
      const error = new LLMError('Document cannot be empty', 'INVALID_REQUEST')
      setError(error)
      return null
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const result = await regeneratePromptlet(document, options)
      return result
    } catch (err) {
      const llmError = err instanceof LLMError ? err : new LLMError('Unknown error occurred', 'UNKNOWN')
      setError(llmError)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [options])

  const hasApiKey = useCallback(() => {
    // Always return true since we have a default key
    return APIKeyManager.hasAnyKey()
  }, [])

  const handleOptimizePrompt = useCallback(async (
    originalPrompt: string,
    finalDocument: string,
    provider: 'openai' | 'anthropic' = 'openai'
  ): Promise<string | null> => {
    if (!originalPrompt.trim() || !finalDocument.trim()) {
      const error = new LLMError('Original prompt and final document are required', 'INVALID_REQUEST')
      setError(error)
      return null
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const result = await promptOptimizer.optimizePrompt(originalPrompt, [finalDocument], provider)
      return result
    } catch (err) {
      console.error('Prompt optimization error:', err)
      const llmError = err instanceof LLMError ? err : new LLMError(
        `Failed to optimize prompt: ${err instanceof Error ? err.message : 'Unknown error'}`, 
        'UNKNOWN'
      )
      setError(llmError)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getAvailableProviders = useCallback(() => {
    return APIKeyManager.getAvailableProviders()
  }, [])

  return {
    isLoading,
    error,
    clearError,
    generateDocument: handleGenerateDocument,
    generatePatch: handleGeneratePatch,
    regeneratePromptlet: handleRegeneratePromptlet,
    optimizePrompt: handleOptimizePrompt,
    hasApiKey,
    getAvailableProviders,
  }
}