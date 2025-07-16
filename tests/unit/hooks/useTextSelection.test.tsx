import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTextSelection } from '@/hooks/useTextSelection'

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-123'),
  },
})

describe('useTextSelection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useTextSelection())
    
    expect(result.current.selection).toBeNull()
    expect(result.current.patches).toEqual([])
  })

  it('should create a patch correctly', () => {
    const { result } = renderHook(() => useTextSelection())
    
    const position = { top: 100, left: 200, width: 300, height: 40, cursorX: 500, cursorY: 140 }
    
    act(() => {
      const patch = result.current.createPatch('original text', 'patched text', position)
      expect(patch).toEqual({
        id: 'test-uuid-123',
        originalText: 'original text',
        patchedText: 'patched text',
        position,
        status: 'pending',
        createdAt: expect.any(Date),
      })
    })
    
    expect(result.current.patches).toHaveLength(1)
    expect(result.current.patches[0].originalText).toBe('original text')
  })

  it('should update patch status correctly', () => {
    const { result } = renderHook(() => useTextSelection())
    
    const position = { top: 100, left: 200, width: 300, height: 40, cursorX: 500, cursorY: 140 }
    
    act(() => {
      result.current.createPatch('original text', 'patched text', position)
    })
    
    act(() => {
      result.current.updatePatchStatus('test-uuid-123', 'applied')
    })
    
    expect(result.current.patches[0].status).toBe('applied')
  })

  it('should remove patch correctly', () => {
    const { result } = renderHook(() => useTextSelection())
    
    const position = { top: 100, left: 200, width: 300, height: 40, cursorX: 500, cursorY: 140 }
    
    act(() => {
      result.current.createPatch('original text', 'patched text', position)
    })
    
    expect(result.current.patches).toHaveLength(1)
    
    act(() => {
      result.current.removePatch('test-uuid-123')
    })
    
    expect(result.current.patches).toHaveLength(0)
  })

  it('should filter patches by status', () => {
    const { result } = renderHook(() => useTextSelection())
    
    const position = { top: 100, left: 200, width: 300, height: 40, cursorX: 500, cursorY: 140 }
    
    // Create multiple patches with different statuses
    act(() => {
      result.current.createPatch('text 1', 'patch 1', position)
      // Mock different UUIDs
      vi.mocked(crypto.randomUUID).mockReturnValueOnce('uuid-2')
      result.current.createPatch('text 2', 'patch 2', position)
    })
    
    act(() => {
      result.current.updatePatchStatus('test-uuid-123', 'applied')
    })
    
    const pendingPatches = result.current.getPendingPatches()
    const appliedPatches = result.current.getAppliedPatches()
    
    expect(pendingPatches).toHaveLength(1)
    expect(appliedPatches).toHaveLength(1)
    expect(pendingPatches[0].status).toBe('pending')
    expect(appliedPatches[0].status).toBe('applied')
  })

  it('should clear selection correctly', () => {
    const { result } = renderHook(() => useTextSelection())
    
    // Mock window.getSelection
    const mockSelection = {
      removeAllRanges: vi.fn(),
    }
    vi.stubGlobal('getSelection', vi.fn(() => mockSelection))
    
    // Set up some selection state (this would normally be done by handleTextSelection)
    act(() => {
      result.current.clearSelection()
    })
    
    expect(result.current.selection).toBeNull()
    expect(mockSelection.removeAllRanges).toHaveBeenCalled()
  })
})