# Technical Decisions & Rationale

## Editor Architecture

### Decision: Simple ContentEditable over Rich-Text Framework
**Rationale**: 
- TipTap complexity was causing toolbar issues and selection conflicts
- ContentEditable provides direct HTML editing without framework overhead
- Simpler codebase with fewer dependencies
- Focus on core AI editing functionality rather than rich formatting
- Easier to maintain and debug

```typescript
// components/editor/RichTextEditor.tsx
export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  ({ content, onUpdate, onSelectionUpdate, editable = true, className = '' }, ref) => {
    const [currentContent, setCurrentContent] = useState(content)
    const editorRef = useRef<HTMLDivElement>(null)
    
    return (
      <div
        ref={editorRef}
        contentEditable={editable}
        onInput={handleInput}
        onMouseUp={handleSelectionChange}
        onKeyUp={handleSelectionChange}
        className="content-editable prose prose-neutral max-w-none"
        suppressContentEditableWarning={true}
      />
    )
  }
)
```

**Trade-offs**:
- ✅ Simpler, more reliable
- ✅ Fewer dependencies
- ✅ Direct HTML control
- ❌ No built-in formatting toolbar
- ❌ Manual undo/redo implementation needed
- ❌ Less sophisticated editing features

## State Management

### Decision: Zustand over Redux/Context
```typescript
// store/documentStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DocumentStore {
  document: string;
  promptlet: string;
  patches: Patch[];
  setDocument: (doc: string) => void;
  addPatch: (patch: Patch) => void;
  applyPatch: (patchId: string) => void;
}

export const useDocumentStore = create<DocumentStore>()(
  persist(
    (set) => ({
      document: '',
      promptlet: '',
      patches: [],
      setDocument: (doc) => set({ document: doc }),
      addPatch: (patch) => set((state) => ({ 
        patches: [...state.patches, patch] 
      })),
      applyPatch: (patchId) => set((state) => {
        const patch = state.patches.find(p => p.id === patchId);
        if (!patch) return state;
        
        return {
          document: state.document.replace(
            patch.originalText,
            patch.patchedText
          ),
          patches: state.patches.map(p => 
            p.id === patchId ? { ...p, applied: true } : p
          )
        };
      }),
    }),
    {
      name: 'document-storage',
    }
  )
);
```

**Rationale**:
- Simpler than Redux
- Built-in persistence
- TypeScript friendly
- Minimal boilerplate

## LLM Provider Selection

### Decision: API-based LLMs (OpenAI/Anthropic) via LangChain.js
**Rationale**:
- No local infrastructure required
- Faster initial load (no model downloads)
- Access to latest model updates
- Better model quality than local alternatives
- Simpler deployment and maintenance

### Provider Strategy
```typescript
// lib/langchain/providers.ts
export const LLM_PROVIDERS = {
  openai: {
    models: ['gpt-4-turbo-preview', 'gpt-3.5-turbo'],
    pricing: { input: 0.01, output: 0.03 }, // per 1K tokens
  },
  anthropic: {
    models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229'],
    pricing: { input: 0.015, output: 0.075 },
  },
};

// Allow user to choose provider
const selectProvider = (preference: string, budget: number) => {
  if (budget < 10) return 'openai'; // More cost-effective
  if (preference === 'quality') return 'anthropic';
  return 'openai'; // Default
};
```

## Text Selection Strategy

### Decision: Custom Selection Handler
```typescript
// lib/utils/text-selection.ts
export class TextSelectionManager {
  private container: HTMLElement;
  private onSelection: (selection: Selection) => void;
  
  constructor(container: HTMLElement, onSelection: (selection: Selection) => void) {
    this.container = container;
    this.onSelection = onSelection;
    this.init();
  }
  
  private init() {
    this.container.addEventListener('dblclick', this.handleDoubleClick);
  }
  
  private handleDoubleClick = (e: MouseEvent) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    this.onSelection({
      text: selection.toString(),
      range,
      position: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      },
    });
  };
  
  destroy() {
    this.container.removeEventListener('dblclick', this.handleDoubleClick);
  }
}
```

**Rationale**:
- Full control over selection behavior
- Can handle edge cases
- Works consistently across browsers

## Patch Positioning

### Decision: Floating UI (formerly Popper.js)
```typescript
// components/patches/PatchOverlay.tsx
import { useFloating, autoUpdate, offset, flip, shift } from '@floating-ui/react';

export function PatchOverlay({ patch, children }) {
  const { refs, floatingStyles } = useFloating({
    placement: 'top',
    middleware: [offset(10), flip(), shift()],
    whileElementsMounted: autoUpdate,
  });
  
  return (
    <>
      <span ref={refs.setReference}>{patch.originalText}</span>
      <div
        ref={refs.setFloating}
        style={floatingStyles}
        className="patch-overlay"
      >
        {children}
      </div>
    </>
  );
}
```

**Rationale**:
- Handles viewport boundaries
- Auto-repositioning
- Smaller than Popper.js
- Better tree-shaking

## API Key Management

### Decision: Client-side storage with user-provided keys
```typescript
// lib/api-keys/manager.ts
import CryptoJS from 'crypto-js';

export class APIKeyManager {
  private static STORAGE_KEY = 'pp-api-keys';
  private static ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'default-key';
  
  static save(provider: string, apiKey: string) {
    const encrypted = CryptoJS.AES.encrypt(apiKey, this.ENCRYPTION_KEY).toString();
    const keys = this.getAll();
    keys[provider] = encrypted;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(keys));
  }
  
  static get(provider: string): string | null {
    const keys = this.getAll();
    const encrypted = keys[provider];
    if (!encrypted) return null;
    
    const bytes = CryptoJS.AES.decrypt(encrypted, this.ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
  
  static remove(provider: string) {
    const keys = this.getAll();
    delete keys[provider];
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(keys));
  }
  
  private static getAll(): Record<string, string> {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  }
}
```

**Rationale**:
- Users control their own API keys
- No backend required
- Basic encryption for localStorage
- Easy to implement

## Testing Framework Choices

### Unit Testing: Vitest
**Rationale**:
- Faster than Jest
- Native ESM support
- Compatible with Vite
- Great DX with UI mode

### E2E Testing: Playwright
**Rationale**:
- Better than Cypress for our needs
- Supports multiple browsers
- Great debugging tools
- Parallel execution

## Build & Development Tools

### Decision: Turbo for build orchestration
```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": []
    },
    "lint": {
      "outputs": []
    }
  }
}
```

**Rationale**:
- Caches builds
- Parallel execution
- Great for monorepos
- Works well with pnpm

## CSS Architecture

### Decision: Tailwind CSS + CSS Modules for complex components
```typescript
// Complex component with CSS Module
// components/Editor/Editor.module.css
.editor {
  @apply relative w-full min-h-screen p-8;
  
  &:has(.patch-active) {
    @apply selection:bg-transparent;
  }
}

.selection-highlight {
  @apply bg-yellow-200 dark:bg-yellow-900;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
```

**Rationale**:
- Tailwind for rapid development
- CSS Modules for component-specific complex styles
- Better performance than CSS-in-JS
- Type-safe with CSS Modules

## Performance Optimizations

### Decision: React Query for API state management
```typescript
// hooks/useDocument.ts
import { useQuery, useMutation } from '@tanstack/react-query';

export function useDocument(id: string) {
  return useQuery({
    queryKey: ['document', id],
    queryFn: () => storage.loadDocument(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useGenerateDocument() {
  return useMutation({
    mutationFn: async ({ promptlet, onToken }) => {
      const { generateDocument } = useLangChain();
      return generateDocument(promptlet, onToken);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['documents']);
    },
  });
}
```

**Rationale**:
- Built-in caching
- Request deduplication
- Optimistic updates
- Better than manual state management

## Request Handling

### Decision: Axios with interceptors
```typescript
// lib/api/client.ts
import axios from 'axios';
import { APIKeyManager } from '@/lib/api-keys/manager';

const apiClient = axios.create({
  timeout: 30000,
});

apiClient.interceptors.request.use((config) => {
  const provider = config.baseURL?.includes('openai') ? 'openai' : 'anthropic';
  const apiKey = APIKeyManager.get(provider);
  
  if (apiKey) {
    config.headers.Authorization = `Bearer ${apiKey}`;
  }
  
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 429) {
      // Rate limit - implement retry
      return retryWithBackoff(() => apiClient.request(error.config));
    }
    throw error;
  }
);
```

**Rationale**:
- Centralized error handling
- Automatic retries
- Request/response transformation
- Better than fetch for complex scenarios