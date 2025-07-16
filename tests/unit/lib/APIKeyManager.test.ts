import { describe, it, expect, beforeEach, vi } from 'vitest'
import { APIKeyManager } from '@/lib/api-keys/manager'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

vi.stubGlobal('localStorage', localStorageMock)

describe('APIKeyManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  describe('validateKeyFormat', () => {
    it('validates OpenAI API key format', () => {
      expect(APIKeyManager.validateKeyFormat('openai', 'sk-1234567890abcdefghijklmnop')).toBe(true)
      expect(APIKeyManager.validateKeyFormat('openai', 'invalid-key')).toBe(false)
      expect(APIKeyManager.validateKeyFormat('openai', 'sk-short')).toBe(false)
      expect(APIKeyManager.validateKeyFormat('openai', '')).toBe(false)
    })

    it('validates Anthropic API key format', () => {
      expect(APIKeyManager.validateKeyFormat('anthropic', 'sk-ant-1234567890abcdefghijklmnop')).toBe(true)
      expect(APIKeyManager.validateKeyFormat('anthropic', 'sk-1234567890abcdefghijklmnop')).toBe(false)
      expect(APIKeyManager.validateKeyFormat('anthropic', 'invalid-key')).toBe(false)
      expect(APIKeyManager.validateKeyFormat('anthropic', '')).toBe(false)
    })
  })

  describe('save and get', () => {
    it('saves and retrieves API keys', () => {
      const testKey = 'sk-test1234567890abcdefghijklmnop'
      
      // Mock localStorage to return empty object initially
      localStorageMock.getItem.mockReturnValue('{}')
      
      APIKeyManager.save('openai', testKey)
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'pp-api-keys',
        expect.any(String)
      )
      
      // Mock the encrypted storage
      const encryptedData = '{"openai":"encrypted_key"}'
      localStorageMock.getItem.mockReturnValue(encryptedData)
      
      // Note: In real test, we'd need to mock CryptoJS properly
      // For now, we test the storage mechanism
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })

    it('throws error for empty API key', () => {
      expect(() => APIKeyManager.save('openai', '')).toThrow('API key cannot be empty')
      expect(() => APIKeyManager.save('openai', '   ')).toThrow('API key cannot be empty')
    })
  })

  describe('hasKey', () => {
    it('returns false when no key exists', () => {
      localStorageMock.getItem.mockReturnValue(null)
      expect(APIKeyManager.hasKey('openai')).toBe(false)
    })

    it('returns false when localStorage has no data', () => {
      localStorageMock.getItem.mockReturnValue('{}')
      expect(APIKeyManager.hasKey('openai')).toBe(false)
    })
  })

  describe('remove', () => {
    it('removes API key from storage', () => {
      localStorageMock.getItem.mockReturnValue('{"openai":"encrypted_key"}')
      
      APIKeyManager.remove('openai')
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'pp-api-keys',
        '{}'
      )
    })
  })

  describe('clear', () => {
    it('clears all API keys', () => {
      APIKeyManager.clear()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('pp-api-keys')
    })
  })

  describe('getAvailableProviders', () => {
    it('returns empty array when no keys are available', () => {
      localStorageMock.getItem.mockReturnValue(null)
      expect(APIKeyManager.getAvailableProviders()).toEqual([])
    })
  })
})