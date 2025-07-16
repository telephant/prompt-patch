import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLangChain } from '@/hooks/useLangChain'
import * as chains from '@/lib/langchain/chains'
import { APIKeyManager } from '@/lib/api-keys/manager'
import { LLMError } from '@/lib/langchain/errors'

// Mock the chains module
vi.mock('@/lib/langchain/chains', () => ({
  generateDocument: vi.fn(),
  generatePatch: vi.fn(),
  regeneratePromptlet: vi.fn(),
}))

// Mock APIKeyManager
vi.mock('@/lib/api-keys/manager', () => ({
  APIKeyManager: {
    hasKey: vi.fn(),
    getAvailableProviders: vi.fn(),
    hasAnyKey: vi.fn(),
  },
}))

describe('useLangChain', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(APIKeyManager.hasKey).mockReturnValue(true)
    vi.mocked(APIKeyManager.getAvailableProviders).mockReturnValue(['openai'])
    vi.mocked(APIKeyManager.hasAnyKey).mockReturnValue(true)
  })

  describe('generateDocument', () => {
    it('should generate document successfully', async () => {
      const mockResult = 'Generated document content'
      vi.mocked(chains.generateDocument).mockResolvedValue(mockResult)

      const { result } = renderHook(() => useLangChain())

      let generatedDoc: string | null = null
      await act(async () => {
        generatedDoc = await result.current.generateDocument('Test prompt')
      })

      expect(generatedDoc).toBe(mockResult)
      expect(chains.generateDocument).toHaveBeenCalledWith('Test prompt', expect.any(Object))
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it('should handle streaming tokens', async () => {
      const mockTokens = ['Hello', ' world', '!']
      const mockResult = 'Hello world!'
      
      vi.mocked(chains.generateDocument).mockImplementation(async (promptlet, options) => {
        // Simulate streaming
        if (options?.onToken) {
          for (const token of mockTokens) {
            options.onToken(token)
          }
        }
        return mockResult
      })

      const { result } = renderHook(() => useLangChain())
      
      const tokens: string[] = []
      const onToken = (token: string) => tokens.push(token)

      await act(async () => {
        await result.current.generateDocument('Test prompt', onToken)
      })

      expect(tokens).toEqual(mockTokens)
    })

    it('should handle empty promptlet', async () => {
      const { result } = renderHook(() => useLangChain())

      let generatedDoc: string | null = null
      await act(async () => {
        generatedDoc = await result.current.generateDocument('')
      })

      expect(generatedDoc).toBe(null)
      expect(result.current.error).toBeInstanceOf(LLMError)
      expect(result.current.error?.code).toBe('INVALID_REQUEST')
    })

    it('should handle LangChain errors', async () => {
      const mockError = new LLMError('API key missing', 'API_KEY_MISSING')
      vi.mocked(chains.generateDocument).mockRejectedValue(mockError)

      const { result } = renderHook(() => useLangChain())

      let generatedDoc: string | null = null
      await act(async () => {
        generatedDoc = await result.current.generateDocument('Test prompt')
      })

      expect(generatedDoc).toBe(null)
      expect(result.current.error).toBe(mockError)
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('generatePatch', () => {
    it('should generate patch successfully', async () => {
      const mockResult = 'Patched content'
      vi.mocked(chains.generatePatch).mockResolvedValue(mockResult)

      const { result } = renderHook(() => useLangChain())

      let patchedText: string | null = null
      await act(async () => {
        patchedText = await result.current.generatePatch('Original text', 'Make it better')
      })

      expect(patchedText).toBe(mockResult)
      expect(chains.generatePatch).toHaveBeenCalledWith('Original text', 'Make it better', expect.any(Object))
    })

    it('should handle empty inputs', async () => {
      const { result } = renderHook(() => useLangChain())

      await act(async () => {
        const result1 = await result.current.generatePatch('', 'patch prompt')
        const result2 = await result.current.generatePatch('original', '')
        
        expect(result1).toBe(null)
        expect(result2).toBe(null)
      })

      expect(result.current.error).toBeInstanceOf(LLMError)
    })
  })

  describe('regeneratePromptlet', () => {
    it('should regenerate promptlet successfully', async () => {
      const mockResult = 'Regenerated promptlet'
      vi.mocked(chains.regeneratePromptlet).mockResolvedValue(mockResult)

      const { result } = renderHook(() => useLangChain())

      let promptlet: string | null = null
      await act(async () => {
        promptlet = await result.current.regeneratePromptlet('Document content')
      })

      expect(promptlet).toBe(mockResult)
      expect(chains.regeneratePromptlet).toHaveBeenCalledWith('Document content', undefined)
    })
  })

  describe('hasApiKey', () => {
    it('should return true when API key exists', () => {
      vi.mocked(APIKeyManager.hasAnyKey).mockReturnValue(true)
      
      const { result } = renderHook(() => useLangChain({ provider: 'openai' }))
      
      expect(result.current.hasApiKey()).toBe(true)
    })

    it('should return true even when no custom keys exist (default key)', () => {
      vi.mocked(APIKeyManager.hasKey).mockReturnValue(false)
      vi.mocked(APIKeyManager.getAvailableProviders).mockReturnValue([])
      vi.mocked(APIKeyManager.hasAnyKey).mockReturnValue(true) // Always true due to default key
      
      const { result } = renderHook(() => useLangChain())
      
      expect(result.current.hasApiKey()).toBe(true)
    })
  })

  describe('clearError', () => {
    it('should clear error state', async () => {
      const mockError = new LLMError('Test error', 'UNKNOWN')
      vi.mocked(chains.generateDocument).mockRejectedValue(mockError)

      const { result } = renderHook(() => useLangChain())

      // Generate an error
      await act(async () => {
        await result.current.generateDocument('Test prompt')
      })

      expect(result.current.error).toBeTruthy()

      // Clear the error
      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBe(null)
    })
  })
})