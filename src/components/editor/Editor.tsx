'use client'

import { useState, useEffect, useRef } from 'react'
import { useTextSelection } from '@/hooks/useTextSelection'
import { useLangChain } from '@/hooks/useLangChain'
import { SelectionButton } from './SelectionButton'
import { PatchTooltip } from './PatchTooltip'
import { PatchPreview } from './PatchPreview'
import { RichTextEditor, RichTextEditorRef } from './RichTextEditor'
import { processContent } from '@/lib/utils/markdown'

interface EditorProps {
  document?: string
  onDocumentChange?: (document: string) => void
  onPatchAccepted?: (patchPrompt: string) => void
}

export function Editor({ document = '', onDocumentChange, onPatchAccepted }: EditorProps) {
  const [currentDocument, setCurrentDocument] = useState(document)
  const [isGeneratingPatch, setIsGeneratingPatch] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [preventSelectionClear, setPreventSelectionClear] = useState(false)
  const editorRef = useRef<RichTextEditorRef>(null)
  
  const {
    selection,
    patches,
    handleTextSelection,
    clearSelection,
    createPatch,
    updatePatchStatus,
    removePatch,
  } = useTextSelection()

  const { generatePatch } = useLangChain()

  // Update internal state when document prop changes
  useEffect(() => {
    const updateDocument = async () => {
      if (!document) {
        setCurrentDocument('')
        return
      }

      // Process markdown content to HTML
      const processedContent = await processContent(document)
      setCurrentDocument(processedContent)
    }

    updateDocument()
  }, [document])

  const handleGeneratePatch = async (originalText: string, patchPrompt: string) => {
    if (!selection) return

    setIsGeneratingPatch(true)
    try {
      const patchedText = await generatePatch(originalText, patchPrompt)
      
      if (patchedText) {
        const patch = createPatch(originalText, patchedText, selection.position)
        console.log('Created patch:', patch)
      }
    } catch (error) {
      console.error('Failed to generate patch:', error)
    } finally {
      setIsGeneratingPatch(false)
    }
  }

  const handleAcceptPatch = async (patchId: string) => {
    const patch = patches.find(p => p.id === patchId)
    if (!patch) return

    // Replace the original text with the patched text in the document
    const updatedDocument = currentDocument.replace(patch.originalText, patch.patchedText)
    setCurrentDocument(updatedDocument)
    onDocumentChange?.(updatedDocument)
    
    // Update the editor content
    if (editorRef.current) {
      const processedContent = await processContent(updatedDocument)
      await editorRef.current.setContent(processedContent)
    }
    
    // Update patch status
    updatePatchStatus(patchId, 'applied')
    
    // Remove the patch after a brief delay
    setTimeout(() => {
      removePatch(patchId)
    }, 2000)
  }

  const handleRejectPatch = (patchId: string) => {
    updatePatchStatus(patchId, 'rejected')
    
    // Remove the patch after a brief delay
    setTimeout(() => {
      removePatch(patchId)
    }, 1000)
  }

  const handleShowEditModal = () => {
    if (showEditModal) return // Prevent multiple calls
    
    setPreventSelectionClear(true)
    setShowEditModal(true)
    
    // Reset prevention after a short delay
    setTimeout(() => {
      setPreventSelectionClear(false)
    }, 500) // Increased timeout to be safe
  }

  const handleCloseEditModal = () => {
    if (!showEditModal) return // Prevent multiple calls
    
    setShowEditModal(false)
    setTimeout(() => {
      clearSelection()
    }, 50) // Small delay to prevent conflicts
  }


  const handleSelectionUpdate = (newSelection: boolean | null) => {
    // Don't handle selection updates directly from RichTextEditor
    // Let the global selection handler manage this to avoid conflicts
    return
  }

  // Add global selection change listener with debounce
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.document === 'undefined') {
      return
    }

    let timeoutId: NodeJS.Timeout
    let isProcessing = false

    const handleSelectionChange = () => {
      if (isProcessing || showEditModal || preventSelectionClear) return
      
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        if (typeof window !== 'undefined' && window.getSelection) {
          const windowSelection = window.getSelection()
          const selectedText = windowSelection?.toString().trim()
          
          if (selectedText) {
            // Check if selection is within rich text editor
            const range = windowSelection?.getRangeAt(0)
            if (range) {
              const container = range.commonAncestorContainer
              const richTextEditor = window.document.querySelector('.rich-text-editor')
              
              if (richTextEditor && (richTextEditor.contains(container) || container === richTextEditor)) {
                isProcessing = true
                try {
                  handleTextSelection()
                } finally {
                  setTimeout(() => {
                    isProcessing = false
                  }, 200)
                }
              }
            }
          } else if (selection && !showEditModal && !preventSelectionClear) {
            clearSelection()
            setShowEditModal(false)
          }
        }
      }, 100) // Increased debounce to 100ms
    }

    window.document.addEventListener('selectionchange', handleSelectionChange)
    
    return () => {
      clearTimeout(timeoutId)
      window.document.removeEventListener('selectionchange', handleSelectionChange)
    }
  }, [selection, clearSelection, showEditModal, handleTextSelection, preventSelectionClear])

  // Handle click outside to clear selection
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.document === 'undefined') {
      return
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      
      // Don't close if clicking inside the document content, selection button, or edit modal
      if (
        target.closest('[data-testid="document-content"]') ||
        target.closest('[data-testid="selection-button"]') ||
        target.closest('[data-testid="patch-tooltip"]') ||
        target.closest('.rich-text-editor')
      ) {
        return
      }
      
      if (selection) {
        clearSelection()
        setShowEditModal(false)
      }
    }

    window.document.addEventListener('click', handleClickOutside)
    
    return () => {
      window.document.removeEventListener('click', handleClickOutside)
    }
  }, [selection, clearSelection, showEditModal])

  if (!currentDocument) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Document</h2>
        </div>
        <div className="flex-1 border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="text-muted-foreground mb-4">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              No document yet
            </h3>
            <p className="text-sm text-muted-foreground">
              Enter a promptlet to generate your first document
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Document</h2>
      </div>
      
      <div 
        data-testid="document-content"
        className="bg-card border rounded-lg overflow-hidden flex-1 flex flex-col"
      >
        <RichTextEditor
          ref={editorRef}
          content={currentDocument}
          onUpdate={(content) => {
            setCurrentDocument(content)
            onDocumentChange?.(content)
          }}
          onSelectionUpdate={handleSelectionUpdate}
          editable={true}
          className="h-full"
        />
      </div>

      {/* Selection Button */}
      {selection && !showEditModal && (
        <SelectionButton
          selection={selection}
          onEdit={handleShowEditModal}
        />
      )}
      

      {/* Patch Tooltip */}
      {selection && showEditModal && (
        <PatchTooltip
          selection={selection}
          onClose={handleCloseEditModal}
          onGeneratePatch={handleGeneratePatch}
          isGenerating={isGeneratingPatch}
        />
      )}

      {/* Patch Previews */}
      {patches.map((patch) => (
        <PatchPreview
          key={patch.id}
          patch={patch}
          onAccept={handleAcceptPatch}
          onReject={handleRejectPatch}
        />
      ))}
    </div>
  )
}