'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { APIKeyManager } from '@/lib/api-keys/manager'
import { LLMProvider, LLM_CONFIG } from '@/lib/langchain/config'
import { Eye, EyeOff, Key, Trash2, CheckCircle, AlertCircle } from 'lucide-react'

interface APIKeySettings {
  openai: string
  anthropic: string
}

export function APIKeyManagerComponent() {
  const [keys, setKeys] = useState<APIKeySettings>({ openai: '', anthropic: '' })
  const [showKeys, setShowKeys] = useState<Record<LLMProvider, boolean>>({
    openai: false,
    anthropic: false,
    default: false,
  })
  const [savedStatus, setSavedStatus] = useState<Record<LLMProvider, boolean>>({
    openai: false,
    anthropic: false,
    default: true,
  })
  const [errors, setErrors] = useState<Record<LLMProvider, string>>({
    openai: '',
    anthropic: '',
    default: '',
  })

  useEffect(() => {
    // Load existing API key status (but not the actual keys for security)
    const status: Record<LLMProvider, boolean> = {
      openai: APIKeyManager.hasKey('openai'),
      anthropic: APIKeyManager.hasKey('anthropic'),
      default: true, // Default key is always available
    }
    setSavedStatus(status)
  }, [])

  const validateAndSaveKey = (provider: LLMProvider, apiKey: string) => {
    // Clear previous errors
    setErrors(prev => ({ ...prev, [provider]: '' }))

    if (!apiKey.trim()) {
      setErrors(prev => ({ ...prev, [provider]: 'API key cannot be empty' }))
      return
    }

    if (!APIKeyManager.validateKeyFormat(provider, apiKey)) {
      const expectedFormat = provider === 'openai' ? 'sk-...' : 'sk-ant-...'
      setErrors(prev => ({ 
        ...prev, 
        [provider]: `Invalid API key format. Expected format: ${expectedFormat}` 
      }))
      return
    }

    try {
      APIKeyManager.save(provider, apiKey)
      setSavedStatus(prev => ({ ...prev, [provider]: true }))
      setKeys(prev => ({ ...prev, [provider]: '' })) // Clear input after saving
      
      // Show success message briefly
      setTimeout(() => {
        setSavedStatus(prev => ({ ...prev, [provider]: APIKeyManager.hasKey(provider) }))
      }, 2000)
    } catch (error) {
      setErrors(prev => ({ 
        ...prev, 
        [provider]: error instanceof Error ? error.message : 'Failed to save API key' 
      }))
    }
  }

  const removeKey = (provider: LLMProvider) => {
    APIKeyManager.remove(provider)
    setSavedStatus(prev => ({ ...prev, [provider]: false }))
    setKeys(prev => ({ ...prev, [provider]: '' }))
    setErrors(prev => ({ ...prev, [provider]: '' }))
  }

  const toggleShowKey = (provider: LLMProvider) => {
    setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }))
  }

  const isUsingDefault = APIKeyManager.isUsingDefault()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">API Configuration</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Add your API keys to enable AI-powered document generation. Keys are encrypted and stored locally.
        </p>
      </div>

      {/* Default Key Status */}
      <Alert variant={isUsingDefault ? "default" : "destructive"}>
        <Key className="h-4 w-4" />
        <AlertDescription>
          {isUsingDefault ? (
            <>
              <strong>Using free default key</strong> - You can start using the app immediately! 
              The free tier has limited usage. Add your own API key below for unlimited access.
            </>
          ) : (
            <>
              <strong>Using your custom API key</strong> - You have unlimited access with your own API key.
            </>
          )}
        </AlertDescription>
      </Alert>

      <div className="grid gap-4">
        {(Object.keys(LLM_CONFIG) as LLMProvider[])
          .filter(provider => provider !== 'default')
          .map((provider) => (
          <Card key={provider}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base capitalize flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    {provider} API Key
                  </CardTitle>
                  <CardDescription>
                    Default model: {LLM_CONFIG[provider].defaultModel}
                  </CardDescription>
                </div>
                {savedStatus[provider] && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeKey(provider)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {savedStatus[provider] ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    API key is configured and ready to use.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        type={showKeys[provider] ? 'text' : 'password'}
                        placeholder={`Enter your ${provider} API key`}
                        value={keys[provider]}
                        onChange={(e) => setKeys(prev => ({ ...prev, [provider]: e.target.value }))}
                        className={errors[provider] ? 'border-destructive' : ''}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleShowKey(provider)}
                    >
                      {showKeys[provider] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      onClick={() => validateAndSaveKey(provider, keys[provider])}
                      disabled={!keys[provider].trim()}
                    >
                      Save
                    </Button>
                  </div>
                  
                  {errors[provider] && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{errors[provider]}</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        <p>• API keys are encrypted and stored locally in your browser</p>
        <p>• Get OpenAI API keys from: <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">platform.openai.com/api-keys</a></p>
        <p>• Get Anthropic API keys from: <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="underline">console.anthropic.com</a></p>
      </div>
    </div>
  )
}