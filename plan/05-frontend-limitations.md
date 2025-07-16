# Frontend-Specific Limitations & Considerations

## API-Based LLM Considerations

Since we're using external LLM APIs (OpenAI, Anthropic) through LangChain.js, we avoid the heavy model download requirements but face different constraints:

### 1. API Key Security
- **Issue**: Exposing API keys in frontend code
- **Solutions**:
  - Use environment variables with `NEXT_PUBLIC_` prefix
  - Implement a simple proxy endpoint if needed
  - Allow users to input their own API keys
  - Store keys in localStorage (with encryption in production)

### 2. Rate Limiting
- **Issue**: API providers have rate limits
- **Solutions**:
  - Implement request queuing
  - Show rate limit warnings
  - Add retry logic with exponential backoff
  - Display usage estimates

### 3. Network Latency
- **Issue**: API calls depend on network speed
- **Solutions**:
  - Implement streaming responses for better UX
  - Show progress indicators
  - Cache common responses in IndexedDB
  - Implement request cancellation

## Storage Limitations

### 1. LocalStorage (5-10MB limit)
- **Use for**: API keys, user preferences, small metadata
- **Avoid**: Documents, patches, large data

### 2. IndexedDB (Better option)
```typescript
// lib/storage/indexedDB.ts
import { openDB } from 'idb';

export const storage = {
  async saveDocument(doc: Document) {
    const db = await openDB('prompt-patch', 1, {
      upgrade(db) {
        db.createObjectStore('documents', { keyPath: 'id' });
        db.createObjectStore('patches', { keyPath: 'id' });
      },
    });
    await db.put('documents', doc);
  },
  
  async loadDocument(id: string) {
    const db = await openDB('prompt-patch', 1);
    return db.get('documents', id);
  }
};
```

## UX Edge Cases

### 1. Text Selection Issues
- **Multiple selections**: Only allow one active patch at a time
- **Overlapping patches**: Prevent or merge intelligently
- **Cross-element selection**: Handle gracefully or restrict

### 2. Patch Positioning
```typescript
// Handle viewport changes
window.addEventListener('scroll', updatePatchPositions);
window.addEventListener('resize', updatePatchPositions);

// Account for dynamic content
const observer = new ResizeObserver(updatePatchPositions);
observer.observe(documentContainer);
```

### 3. Concurrent Operations
- Queue patch requests to prevent conflicts
- Disable UI during processing
- Show clear loading states
- Allow request cancellation

## Browser Compatibility

### Required APIs
- Fetch API (for LLM requests)
- IndexedDB (for storage)
- Selection API (for text selection)
- ResizeObserver (for layout updates)

### Polyfills
```typescript
// Check for required features
const checkBrowserSupport = () => {
  const required = {
    fetch: 'fetch' in window,
    indexedDB: 'indexedDB' in window,
    selection: 'getSelection' in window,
    resizeObserver: 'ResizeObserver' in window,
  };
  
  const missing = Object.entries(required)
    .filter(([_, supported]) => !supported)
    .map(([feature]) => feature);
    
  if (missing.length > 0) {
    console.warn(`Missing browser features: ${missing.join(', ')}`);
  }
  
  return missing.length === 0;
};
```

## Performance Optimization

### 1. Request Optimization
```typescript
// Debounce patch requests
const debouncedPatchRequest = useMemo(
  () => debounce(requestPatch, 500),
  [requestPatch]
);

// Cancel in-flight requests
const abortController = useRef<AbortController>();

const makeRequest = async () => {
  abortController.current?.abort();
  abortController.current = new AbortController();
  
  try {
    const response = await fetch(url, {
      signal: abortController.current.signal,
    });
    // Handle response
  } catch (error) {
    if (error.name !== 'AbortError') {
      throw error;
    }
  }
};
```

### 2. Streaming Response Handling
```typescript
const handleStreamingResponse = async (
  promptlet: string,
  onToken: (token: string) => void
) => {
  const response = await generateDocument(promptlet, onToken);
  // Tokens are streamed via onToken callback
  // Full response returned at the end
};
```

### 3. Virtual Scrolling for Large Documents
```typescript
import { FixedSizeList } from 'react-window';

const VirtualDocument = ({ paragraphs }) => (
  <FixedSizeList
    height={600}
    itemCount={paragraphs.length}
    itemSize={100}
    width="100%"
  >
    {({ index, style }) => (
      <div style={style}>
        {paragraphs[index]}
      </div>
    )}
  </FixedSizeList>
);
```

## Mobile Considerations

### 1. Touch Selection
```typescript
// Custom touch handler for mobile selection
const handleTouchSelection = (e: TouchEvent) => {
  e.preventDefault();
  
  const touch = e.touches[0];
  const range = document.caretRangeFromPoint(touch.clientX, touch.clientY);
  
  if (range) {
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }
};
```

### 2. Responsive Patch UI
- Larger touch targets for mobile
- Bottom sheet pattern for patch actions
- Swipe gestures for accept/reject

### 3. API Usage on Mobile
- Warn about data usage
- Implement offline queue
- Reduce request frequency

## Cost Considerations

### 1. API Usage Tracking
```typescript
interface UsageTracker {
  tokens: number;
  requests: number;
  cost: number;
}

const trackUsage = (response: LLMResponse): UsageTracker => {
  const usage = response.usage;
  return {
    tokens: usage.total_tokens,
    requests: 1,
    cost: calculateCost(usage, provider),
  };
};
```

### 2. Cost Optimization
- Cache common prompts
- Implement prompt compression
- Show cost estimates before operations
- Allow users to set spending limits

## Error Handling

### 1. Network Errors
```typescript
const retryWithBackoff = async (fn: Function, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }
};
```

### 2. User-Friendly Error Messages
```typescript
const errorMessages = {
  API_KEY_MISSING: 'Please add your API key in settings',
  RATE_LIMIT: 'Too many requests. Please wait a moment.',
  NETWORK: 'Connection error. Please check your internet.',
  TIMEOUT: 'Request timed out. Try a shorter prompt.',
};
```

## Security Best Practices

### 1. Content Security Policy
```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; connect-src 'self' https://api.openai.com https://api.anthropic.com;"
  }
];
```

### 2. Input Sanitization
- Sanitize prompts before sending to API
- Validate response format
- Escape HTML in generated content