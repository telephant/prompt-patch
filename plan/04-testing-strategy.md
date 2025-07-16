# Testing Strategy

## Test-First Development Workflow

1. **Write failing test** → 2. **Implement feature** → 3. **Make test pass** → 4. **Refactor**

## Testing Stack

- **Unit Tests**: Vitest + @testing-library/react
- **E2E Tests**: Playwright
- **Coverage**: Vitest coverage (aim for >80%)

## Unit Test Structure

### Component Test Example: PatchTooltip
```typescript
// tests/unit/components/patches/PatchTooltip.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PatchTooltip } from '@/components/patches/PatchTooltip';

describe('PatchTooltip', () => {
  const mockPatch = {
    id: '1',
    originalText: 'Hello world',
    patchedText: 'Hello universe',
    position: { top: 100, left: 50 },
  };

  it('displays patch preview in green', () => {
    render(
      <PatchTooltip
        patch={mockPatch}
        onAccept={() => {}}
        onReject={() => {}}
      />
    );
    
    const preview = screen.getByText('Hello universe');
    expect(preview).toHaveClass('text-green-600');
  });

  it('calls onAccept when accept button clicked', () => {
    const onAccept = vi.fn();
    render(
      <PatchTooltip
        patch={mockPatch}
        onAccept={onAccept}
        onReject={() => {}}
      />
    );
    
    fireEvent.click(screen.getByText('Accept'));
    expect(onAccept).toHaveBeenCalledWith(mockPatch.id);
  });

  it('positions tooltip above original text', () => {
    const { container } = render(
      <PatchTooltip
        patch={mockPatch}
        onAccept={() => {}}
        onReject={() => {}}
      />
    );
    
    const tooltip = container.firstChild as HTMLElement;
    expect(tooltip.style.top).toBe('100px');
    expect(tooltip.style.left).toBe('50px');
  });
});
```

### Hook Test Example: usePatches
```typescript
// tests/unit/hooks/usePatches.test.ts
import { renderHook, act } from '@testing-library/react';
import { usePatches } from '@/hooks/usePatches';

describe('usePatches', () => {
  it('adds new patch to pending list', () => {
    const { result } = renderHook(() => usePatches());
    
    act(() => {
      result.current.addPatch({
        originalText: 'test',
        patchedText: 'updated test',
        position: { top: 0, left: 0 },
      });
    });
    
    expect(result.current.pendingPatches).toHaveLength(1);
    expect(result.current.pendingPatches[0].originalText).toBe('test');
  });

  it('moves patch from pending to applied on accept', () => {
    const { result } = renderHook(() => usePatches());
    
    act(() => {
      result.current.addPatch({
        originalText: 'test',
        patchedText: 'updated',
        position: { top: 0, left: 0 },
      });
    });
    
    const patchId = result.current.pendingPatches[0].id;
    
    act(() => {
      result.current.acceptPatch(patchId);
    });
    
    expect(result.current.pendingPatches).toHaveLength(0);
    expect(result.current.appliedPatches).toHaveLength(1);
  });
});
```

## E2E Test Structure

### Patch Workflow Test
```typescript
// tests/e2e/patch-workflow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Patch Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Generate initial document
    await page.fill('[data-testid="promptlet-input"]', 'Write a story about a cat');
    await page.click('[data-testid="generate-button"]');
    await page.waitForSelector('[data-testid="document-content"]');
  });

  test('user can create and accept a patch', async ({ page }) => {
    // Double-click to select text
    const paragraph = page.locator('[data-testid="document-content"] p').first();
    await paragraph.dblclick();
    
    // Wait for selection UI
    await expect(page.locator('[data-testid="patch-prompt-input"]')).toBeVisible();
    
    // Enter patch prompt
    await page.fill('[data-testid="patch-prompt-input"]', 'Make it more exciting');
    await page.keyboard.press('Enter');
    
    // Wait for patch preview
    await expect(page.locator('[data-testid="patch-preview"]')).toBeVisible();
    await expect(page.locator('[data-testid="patch-preview"]')).toHaveCSS('color', 'rgb(22 163 74)'); // green-600
    
    // Accept patch
    await page.click('[data-testid="accept-patch-button"]');
    
    // Verify patch applied
    const updatedText = await paragraph.textContent();
    expect(updatedText).not.toBe('');
    await expect(page.locator('[data-testid="patch-preview"]')).not.toBeVisible();
  });

  test('user can reject a patch', async ({ page }) => {
    const paragraph = page.locator('[data-testid="document-content"] p').first();
    const originalText = await paragraph.textContent();
    
    await paragraph.dblclick();
    await page.fill('[data-testid="patch-prompt-input"]', 'Change this text');
    await page.keyboard.press('Enter');
    await page.waitForSelector('[data-testid="patch-preview"]');
    
    // Reject patch
    await page.click('[data-testid="reject-patch-button"]');
    
    // Verify text unchanged
    const currentText = await paragraph.textContent();
    expect(currentText).toBe(originalText);
  });

  test('keyboard shortcuts work for patch actions', async ({ page }) => {
    const paragraph = page.locator('[data-testid="document-content"] p').first();
    await paragraph.dblclick();
    await page.fill('[data-testid="patch-prompt-input"]', 'Update text');
    await page.keyboard.press('Enter');
    await page.waitForSelector('[data-testid="patch-preview"]');
    
    // Press 'y' to accept
    await page.keyboard.press('y');
    await expect(page.locator('[data-testid="patch-preview"]')).not.toBeVisible();
  });
});
```

## Test Configuration

### Vitest Config
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.ts',
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/', '*.config.*'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Playwright Config
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    port: 3000,
  },
});
```

## Test Commands

```json
// package.json scripts
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "vitest run && playwright test"
  }
}
```