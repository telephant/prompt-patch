export class LLMError extends Error {
  constructor(
    message: string,
    public code: 'API_KEY_MISSING' | 'RATE_LIMIT' | 'NETWORK' | 'INVALID_REQUEST' | 'QUOTA_EXCEEDED' | 'UNKNOWN',
    public provider?: string,
    public details?: unknown,
    public isDefaultKey?: boolean
  ) {
    super(message)
    this.name = 'LLMError'
  }
}

interface ErrorLike {
  status?: number
  message?: string
  code?: string
  error?: {
    type?: string
  }
}

function isErrorLike(error: unknown): error is ErrorLike {
  return typeof error === 'object' && error !== null
}

export function handleLLMError(error: unknown, provider?: string, isDefaultKey?: boolean): LLMError {
  // Type guard for error objects
  const errorObj = isErrorLike(error) ? error : {}
  
  // Check for quota exceeded errors specifically for default key
  if (isDefaultKey && (errorObj?.status === 429 || errorObj?.message?.includes('quota') || errorObj?.message?.includes('exceeded'))) {
    return new LLMError(
      'Free quota has been exceeded. Please add your own API key to continue.',
      'QUOTA_EXCEEDED',
      provider,
      error,
      true
    )
  }
  
  // OpenAI specific errors
  if (errorObj?.status === 401 || errorObj?.message?.includes('API key')) {
    return new LLMError(
      'API key is missing or invalid. Please check your settings.',
      'API_KEY_MISSING',
      provider,
      error,
      isDefaultKey
    )
  }
  
  if (errorObj?.status === 429 || errorObj?.message?.includes('rate limit')) {
    return new LLMError(
      'Rate limit exceeded. Please try again in a moment.',
      'RATE_LIMIT',
      provider,
      error,
      isDefaultKey
    )
  }
  
  if (errorObj?.status === 400 || errorObj?.message?.includes('invalid')) {
    return new LLMError(
      'Invalid request. Please check your input and try again.',
      'INVALID_REQUEST',
      provider,
      error,
      isDefaultKey
    )
  }
  
  // Network related errors
  if (errorObj?.code === 'ENOTFOUND' || errorObj?.message?.includes('network') || errorObj?.message?.includes('fetch')) {
    return new LLMError(
      'Network error. Please check your internet connection.',
      'NETWORK',
      provider,
      error,
      isDefaultKey
    )
  }
  
  // Anthropic specific errors
  if (errorObj?.error?.type === 'authentication_error') {
    return new LLMError(
      'Anthropic API key is invalid.',
      'API_KEY_MISSING',
      provider,
      error,
      isDefaultKey
    )
  }
  
  if (errorObj?.error?.type === 'rate_limit_error') {
    return new LLMError(
      'Anthropic rate limit exceeded.',
      'RATE_LIMIT',
      provider,
      error,
      isDefaultKey
    )
  }
  
  return new LLMError(
    errorObj?.message || 'An unexpected error occurred',
    'UNKNOWN',
    provider,
    error,
    isDefaultKey
  )
}

export const ERROR_MESSAGES = {
  API_KEY_MISSING: 'Please add your API key in settings',
  RATE_LIMIT: 'Too many requests. Please wait a moment.',
  NETWORK: 'Connection error. Please check your internet.',
  INVALID_REQUEST: 'Invalid request. Please check your input.',
  QUOTA_EXCEEDED: 'Free quota exceeded. Please add your own API key.',
  UNKNOWN: 'An unexpected error occurred. Please try again.',
} as const