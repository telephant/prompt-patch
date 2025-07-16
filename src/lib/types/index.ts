export interface Patch {
  id: string
  originalText: string
  patchedText: string
  patchPrompt: string
  position: {
    top: number
    left: number
    width: number
    height: number
  }
  status: 'pending' | 'applied' | 'rejected'
  createdAt: Date
}

export interface DocumentState {
  content: string
  promptlet: string
  patches: Patch[]
  history: DocumentVersion[]
}

export interface DocumentVersion {
  id: string
  content: string
  timestamp: Date
  description: string
}

export interface Selection {
  text: string
  range: Range
  position: {
    top: number
    left: number
    width: number
    height: number
    cursorX: number
    cursorY: number
  }
  highlightedRange?: Range
}

export interface LLMProvider {
  name: 'openai' | 'anthropic'
  model: string
  apiKey: string
}

export interface LLMResponse {
  text: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}