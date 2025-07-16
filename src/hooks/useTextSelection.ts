import { useState, useCallback, useRef } from 'react'
import { Selection, Patch } from '@/lib/types'

// Function to add custom highlight to selected text
const highlightSelectedText = (range: Range): Range => {
  try {
    // Don't add custom highlighting during text selection to avoid DOM manipulation issues
    // Just return the original range
    return range
  } catch (error) {
    console.warn('Failed to highlight selected text:', error)
    return range
  }
}

// Function to clear existing highlights
const clearHighlight = () => {
  if (typeof document === 'undefined') return
  
  const existingHighlights = document.querySelectorAll('[data-selection-highlight="true"]')
  existingHighlights.forEach(highlight => {
    const parent = highlight.parentNode
    if (parent) {
      // Move all child nodes out of the highlight span
      while (highlight.firstChild) {
        parent.insertBefore(highlight.firstChild, highlight)
      }
      // Remove the highlight span
      parent.removeChild(highlight)
    }
  })
}

export function useTextSelection() {
  const [selection, setSelection] = useState<Selection | null>(null)
  const [patches, setPatches] = useState<Patch[]>([])
  const selectionRef = useRef<Selection | null>(null)
  const isProcessingRef = useRef(false)

  const handleTextSelection = useCallback((event?: MouseEvent) => {
    if (isProcessingRef.current) return
    if (typeof window === 'undefined' || !window.getSelection) return
    
    // Check if there's an active modal or tooltip that might interfere
    const activeModal = document.querySelector('[data-testid="patch-tooltip"]')
    if (activeModal) return

    const windowSelection = window.getSelection()
    if (!windowSelection || windowSelection.rangeCount === 0) return

    const range = windowSelection.getRangeAt(0)
    const selectedText = range.toString().trim()

    // Only proceed if there's actual text selected
    if (!selectedText) return

    // Check if selection is within the rich text editor
    const container = range.commonAncestorContainer
    const richTextEditor = window.document.querySelector('.rich-text-editor')
    
    if (!richTextEditor || (!richTextEditor.contains(container) && container !== richTextEditor)) {
      return
    }

    isProcessingRef.current = true

    // Clear any existing highlights
    clearHighlight()

    // Get cursor position - use end of selection (where cursor would be after selecting)
    let cursorPosition = { x: 0, y: 0 }
    if (event) {
      cursorPosition = { x: event.clientX, y: event.clientY }
    } else {
      // Create a range at the end of the selection to get precise cursor position
      const endRange = range.cloneRange()
      endRange.collapse(false) // Collapse to end
      const endRect = endRange.getBoundingClientRect()
      cursorPosition = { x: endRect.right, y: endRect.bottom }
    }

    // Get the position of the actual selection
    const rect = range.getBoundingClientRect()
    const position = {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      height: rect.height,
      cursorX: cursorPosition.x,
      cursorY: cursorPosition.y + window.scrollY,
    }

    // Add custom highlight to the selected text
    const highlightedRange = highlightSelectedText(range)

    const newSelection: Selection = {
      text: selectedText,
      range: range.cloneRange(),
      position,
      highlightedRange,
    }

    setSelection(newSelection)
    selectionRef.current = newSelection
    
    // Reset processing flag after a short delay
    setTimeout(() => {
      isProcessingRef.current = false
    }, 200)
  }, [])

  const clearSelection = useCallback(() => {
    if (isProcessingRef.current) return
    
    isProcessingRef.current = true
    
    // Clear the custom highlight
    clearHighlight()
    
    setSelection(null)
    selectionRef.current = null
    
    // Clear any browser text selection
    if (typeof window !== 'undefined' && window.getSelection) {
      window.getSelection()?.removeAllRanges()
    }
    
    // Reset processing flag
    setTimeout(() => {
      isProcessingRef.current = false
    }, 100)
  }, [])

  const createPatch = useCallback((originalText: string, patchedText: string, position: Selection['position']) => {
    const patch: Patch = {
      id: crypto.randomUUID(),
      originalText,
      patchedText,
      position,
      status: 'pending',
      createdAt: new Date(),
      patchPrompt: '',
    }

    setPatches(prev => [...prev, patch])
    return patch
  }, [])

  const updatePatchStatus = useCallback((patchId: string, status: Patch['status']) => {
    setPatches(prev => 
      prev.map(patch => 
        patch.id === patchId ? { ...patch, status } : patch
      )
    )
  }, [])

  const removePatch = useCallback((patchId: string) => {
    setPatches(prev => prev.filter(patch => patch.id !== patchId))
  }, [])

  const getPendingPatches = useCallback(() => {
    return patches.filter(patch => patch.status === 'pending')
  }, [patches])

  const getAppliedPatches = useCallback(() => {
    return patches.filter(patch => patch.status === 'applied')
  }, [patches])

  return {
    selection,
    patches,
    handleTextSelection,
    clearSelection,
    createPatch,
    updatePatchStatus,
    removePatch,
    getPendingPatches,
    getAppliedPatches,
  }
}