import { describe, it, expect, beforeEach, vi } from 'vitest'
import { APIKeyManager } from '@/lib/api-keys/manager'
import { DEFAULT_API_CONFIG } from '@/lib/langchain/config'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

vi.stubGlobal('localStorage', localStorageMock)

describe('Default Key Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  describe('getEffective', () => {
    it('should return default key when no custom keys exist', () => {
      localStorageMock.getItem.mockReturnValue(null)
      
      const effective = APIKeyManager.getEffective()
      
      expect(effective).toEqual({
        key: DEFAULT_API_CONFIG.apiKey,
        provider: 'default',
        isDefault: true
      })
    })

    it('should return custom key when available', () => {
      // Mock that we have a custom OpenAI key
      localStorageMock.getItem.mockReturnValue('{"openai":"encrypted_key"}')
      
      // Mock the decryption (in real scenario, this would be properly decrypted)
      vi.spyOn(APIKeyManager, 'get').mockImplementation((provider) => {
        if (provider === 'openai') return 'sk-custom-openai-key'
        return null
      })
      
      const effective = APIKeyManager.getEffective('openai')
      
      expect(effective).toEqual({
        key: 'sk-custom-openai-key',
        provider: 'openai',
        isDefault: false
      })
    })

    it('should prefer OpenAI when multiple custom keys exist', () => {
      // Mock that we have multiple custom keys
      localStorageMock.getItem.mockReturnValue('{"openai":"encrypted_openai","anthropic":"encrypted_anthropic"}')
      
      vi.spyOn(APIKeyManager, 'get').mockImplementation((provider) => {
        if (provider === 'openai') return 'sk-custom-openai-key'
        if (provider === 'anthropic') return 'sk-ant-custom-anthropic-key'
        return null
      })
      
      const effective = APIKeyManager.getEffective()
      
      expect(effective).toEqual({
        key: 'sk-custom-openai-key',
        provider: 'openai',
        isDefault: false
      })
    })
  })

  describe('hasAnyKey', () => {
    it('should always return true due to default key', () => {
      localStorageMock.getItem.mockReturnValue(null)
      
      expect(APIKeyManager.hasAnyKey()).toBe(true)
    })

    it('should return true even with custom keys', () => {
      localStorageMock.getItem.mockReturnValue('{"openai":"encrypted_key"}')
      
      expect(APIKeyManager.hasAnyKey()).toBe(true)
    })
  })

  describe('isUsingDefault', () => {
    it('should return true when no custom keys exist', () => {
      localStorageMock.getItem.mockReturnValue(null)
      
      // Mock hasKey to return false for all providers
      vi.spyOn(APIKeyManager, 'hasKey').mockImplementation(() => false)
      
      expect(APIKeyManager.isUsingDefault()).toBe(true)
    })

    it('should return false when custom keys exist', () => {
      localStorageMock.getItem.mockReturnValue('{"openai":"encrypted_key"}')
      
      // Mock that we have a custom key
      vi.spyOn(APIKeyManager, 'hasKey').mockImplementation((provider) => {
        return provider === 'openai'
      })
      
      expect(APIKeyManager.isUsingDefault()).toBe(false)
    })
  })
})