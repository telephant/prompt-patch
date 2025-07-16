import CryptoJS from 'crypto-js'
import { LLMProvider, DEFAULT_API_CONFIG } from '@/lib/langchain/config'

export class APIKeyManager {
  private static readonly STORAGE_KEY = 'pp-api-keys'
  private static readonly ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'prompt-patch-key-2024'

  static save(provider: LLMProvider, apiKey: string): void {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('API key cannot be empty')
    }

    try {
      const encrypted = CryptoJS.AES.encrypt(apiKey.trim(), this.ENCRYPTION_KEY).toString()
      const keys = this.getAll()
      keys[provider] = encrypted
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(keys))
    } catch (error) {
      console.error('Failed to save API key:', error)
      throw new Error('Failed to save API key')
    }
  }

  static get(provider: LLMProvider): string | null {
    try {
      const keys = this.getAll()
      const encrypted = keys[provider]
      if (!encrypted) return null

      const bytes = CryptoJS.AES.decrypt(encrypted, this.ENCRYPTION_KEY)
      const decrypted = bytes.toString(CryptoJS.enc.Utf8)
      
      return decrypted || null
    } catch (error) {
      console.error('Failed to decrypt API key:', error)
      return null
    }
  }

  static getEffective(provider?: LLMProvider): { key: string; provider: LLMProvider; isDefault: boolean } | null {
    // If a specific provider is requested and has a key, use it
    if (provider && provider !== 'default') {
      const userKey = this.get(provider)
      if (userKey) {
        return { key: userKey, provider, isDefault: false }
      }
    }
    
    // Check if user has any custom keys
    const availableProviders = this.getAvailableProviders()
    if (availableProviders.length > 0) {
      const preferredProvider = availableProviders.includes('openai') ? 'openai' : availableProviders[0]
      const userKey = this.get(preferredProvider)
      if (userKey) {
        return { key: userKey, provider: preferredProvider, isDefault: false }
      }
    }
    
    // Fall back to default key
    return { 
      key: DEFAULT_API_CONFIG.apiKey, 
      provider: 'default', 
      isDefault: true 
    }
  }

  static remove(provider: LLMProvider): void {
    try {
      const keys = this.getAll()
      delete keys[provider]
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(keys))
    } catch (error) {
      console.error('Failed to remove API key:', error)
    }
  }

  static hasKey(provider: LLMProvider): boolean {
    const key = this.get(provider)
    return key !== null && key.trim() !== ''
  }

  static getAvailableProviders(): LLMProvider[] {
    const providers: LLMProvider[] = []
    if (this.hasKey('openai')) providers.push('openai')
    if (this.hasKey('anthropic')) providers.push('anthropic')
    return providers
  }

  static hasAnyKey(): boolean {
    // Always return true since we have a default key
    return true
  }

  static isUsingDefault(): boolean {
    return this.getAvailableProviders().length === 0
  }

  static clear(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear API keys:', error)
    }
  }

  private static getAll(): Record<string, string> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch (error) {
      console.error('Failed to load API keys:', error)
      return {}
    }
  }

  // Validate API key format (basic checks)
  static validateKeyFormat(provider: LLMProvider, apiKey: string): boolean {
    if (!apiKey || apiKey.trim() === '') return false

    switch (provider) {
      case 'openai':
        return apiKey.startsWith('sk-') && apiKey.length > 20
      case 'anthropic':
        return apiKey.startsWith('sk-ant-') && apiKey.length > 20
      default:
        return false
    }
  }
}