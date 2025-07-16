# LangChain.ts Integration Plan

## Overview
Using LangChain.js for prompt management and LLM invocation only. All LLM calls will be made to external API endpoints (OpenAI, Anthropic, etc.) - no local model downloads required.

## Chain Architecture

### 1. Document Generation Chain
```typescript
// lib/langchain/chains.ts
import { PromptTemplate } from "@langchain/core/prompts";
import { LLMChain } from "langchain/chains";
import { ChatOpenAI } from "@langchain/openai";

const documentGenerationPrompt = PromptTemplate.fromTemplate(`
Generate a comprehensive document based on the following prompt:
{promptlet}

Requirements:
- Well-structured with clear sections
- Professional tone
- Markdown formatting
`);

export const createDocumentChain = (llm: ChatOpenAI) => {
  return new LLMChain({
    llm,
    prompt: documentGenerationPrompt,
  });
};
```

### 2. Patch Generation Chain
```typescript
const patchGenerationPrompt = PromptTemplate.fromTemplate(`
Original text:
{originalText}

User request:
{patchPrompt}

Generate a revised version that addresses the user's request while maintaining context and flow.
Only return the revised text, no explanations.
`);

export const createPatchChain = (llm: ChatOpenAI) => {
  return new LLMChain({
    llm,
    prompt: patchGenerationPrompt,
  });
};
```

### 3. Promptlet Regeneration Chain
```typescript
const promptletRegenerationPrompt = PromptTemplate.fromTemplate(`
Given the following document:
{document}

Generate a concise prompt that would produce this document.
The prompt should capture the main intent and key requirements.
`);

export const createPromptletChain = (llm: ChatOpenAI) => {
  return new LLMChain({
    llm,
    prompt: promptletRegenerationPrompt,
  });
};
```

## API-Based LLM Setup

### Configuration
```typescript
// lib/langchain/config.ts
export const LLM_CONFIG = {
  openai: {
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    model: 'gpt-4-turbo-preview',
    temperature: 0.7,
  },
  anthropic: {
    apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
    model: 'claude-3-opus-20240229',
    temperature: 0.7,
  }
};
```

### LLM Initialization
```typescript
// lib/langchain/llm.ts
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";

export function initializeLLM(provider: 'openai' | 'anthropic' = 'openai') {
  switch (provider) {
    case 'openai':
      return new ChatOpenAI({
        openAIApiKey: LLM_CONFIG.openai.apiKey,
        modelName: LLM_CONFIG.openai.model,
        temperature: LLM_CONFIG.openai.temperature,
        streaming: true,
      });
    
    case 'anthropic':
      return new ChatAnthropic({
        anthropicApiKey: LLM_CONFIG.anthropic.apiKey,
        modelName: LLM_CONFIG.anthropic.model,
        temperature: LLM_CONFIG.anthropic.temperature,
        streaming: true,
      });
    
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
```

## Hooks for LangChain

### useLangChain Hook with Streaming
```typescript
// hooks/useLangChain.ts
import { useCallback, useState } from 'react';
import { initializeLLM } from '@/lib/langchain/llm';
import { createDocumentChain, createPatchChain, createPromptletChain } from '@/lib/langchain/chains';

export function useLangChain(provider: 'openai' | 'anthropic' = 'openai') {
  const [isLoading, setIsLoading] = useState(false);
  
  const generateDocument = useCallback(async (
    promptlet: string,
    onToken?: (token: string) => void
  ) => {
    setIsLoading(true);
    try {
      const llm = initializeLLM(provider);
      const chain = createDocumentChain(llm);
      
      if (onToken) {
        const stream = await chain.stream({ promptlet });
        let fullText = '';
        
        for await (const chunk of stream) {
          const token = chunk.text || '';
          fullText += token;
          onToken(token);
        }
        
        return fullText;
      } else {
        const result = await chain.invoke({ promptlet });
        return result.text;
      }
    } finally {
      setIsLoading(false);
    }
  }, [provider]);
  
  const generatePatch = useCallback(async (
    originalText: string,
    patchPrompt: string,
    onToken?: (token: string) => void
  ) => {
    const llm = initializeLLM(provider);
    const chain = createPatchChain(llm);
    
    if (onToken) {
      const stream = await chain.stream({ originalText, patchPrompt });
      let fullText = '';
      
      for await (const chunk of stream) {
        const token = chunk.text || '';
        fullText += token;
        onToken(token);
      }
      
      return fullText;
    } else {
      const result = await chain.invoke({ originalText, patchPrompt });
      return result.text;
    }
  }, [provider]);
  
  const regeneratePromptlet = useCallback(async (document: string) => {
    const llm = initializeLLM(provider);
    const chain = createPromptletChain(llm);
    const result = await chain.invoke({ document });
    return result.text;
  }, [provider]);
  
  return {
    isLoading,
    generateDocument,
    generatePatch,
    regeneratePromptlet,
  };
}
```

## API Key Management

### Secure Storage
```typescript
// components/settings/APIKeyManager.tsx
import { useState, useEffect } from 'react';

export function APIKeyManager() {
  const [keys, setKeys] = useState({
    openai: '',
    anthropic: '',
  });
  
  useEffect(() => {
    // Load from localStorage (encrypted in production)
    const stored = localStorage.getItem('llm-api-keys');
    if (stored) {
      setKeys(JSON.parse(stored));
    }
  }, []);
  
  const saveKeys = (newKeys: typeof keys) => {
    localStorage.setItem('llm-api-keys', JSON.stringify(newKeys));
    setKeys(newKeys);
    // Reload the page to use new keys
    window.location.reload();
  };
  
  return (
    <div className="space-y-4">
      <input
        type="password"
        placeholder="OpenAI API Key"
        value={keys.openai}
        onChange={(e) => setKeys({ ...keys, openai: e.target.value })}
      />
      <input
        type="password"
        placeholder="Anthropic API Key"
        value={keys.anthropic}
        onChange={(e) => setKeys({ ...keys, anthropic: e.target.value })}
      />
      <button onClick={() => saveKeys(keys)}>Save API Keys</button>
    </div>
  );
}
```

## Error Handling

```typescript
// lib/langchain/errors.ts
export class LLMError extends Error {
  constructor(
    message: string,
    public code: 'API_KEY_MISSING' | 'RATE_LIMIT' | 'NETWORK' | 'UNKNOWN',
    public provider?: string
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

export function handleLLMError(error: any): LLMError {
  if (error.message?.includes('API key')) {
    return new LLMError('API key is missing or invalid', 'API_KEY_MISSING');
  }
  if (error.message?.includes('rate limit')) {
    return new LLMError('Rate limit exceeded. Please try again later.', 'RATE_LIMIT');
  }
  if (error.message?.includes('network')) {
    return new LLMError('Network error. Please check your connection.', 'NETWORK');
  }
  return new LLMError('An unexpected error occurred', 'UNKNOWN');
}
```

## Usage Example

```typescript
// components/Editor.tsx
function Editor() {
  const { generateDocument, generatePatch, isLoading } = useLangChain('openai');
  const [document, setDocument] = useState('');
  
  const handleGenerateDocument = async (promptlet: string) => {
    try {
      const doc = await generateDocument(promptlet, (token) => {
        // Stream tokens as they arrive
        setDocument(prev => prev + token);
      });
    } catch (error) {
      const llmError = handleLLMError(error);
      toast.error(llmError.message);
    }
  };
  
  return (
    // Component JSX
  );
}
```