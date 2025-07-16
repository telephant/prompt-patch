'use client'

import { Selection } from '@/lib/types'
import { useEffect, forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { processContent } from '@/lib/utils/markdown'

interface RichTextEditorProps {
  content: string
  onUpdate?: (content: string) => void
  onSelectionUpdate?: (selection: boolean | null) => void
  editable?: boolean
  className?: string
}

export interface RichTextEditorRef {
  getHTML: () => string
  setContent: (content: string) => Promise<void>
  focus: () => void
  getSelection: () => Selection | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getEditor: () => any | null
}

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  ({ content, onUpdate, onSelectionUpdate, editable = true, className = '' }, ref) => {
    const [currentContent, setCurrentContent] = useState(content)
    const editorRef = useRef<HTMLDivElement>(null)
    
    useImperativeHandle(ref, () => ({
      getHTML: () => editorRef.current?.innerHTML || '',
      setContent: async (newContent: string) => {
        if (editorRef.current) {
          // Process markdown content to HTML
          const processedContent = await processContent(newContent)
          editorRef.current.innerHTML = processedContent
          setCurrentContent(processedContent)
        }
      },
      focus: () => {
        editorRef.current?.focus()
      },
      getEditor: () => null, // No editor instance for simple contenteditable
      getSelection: () => {
        if (typeof window === 'undefined') return null
        
        const selection = window.getSelection()
        if (!selection || selection.rangeCount === 0) return null

        const selectedText = selection.toString().trim()
        if (!selectedText) return null

        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        
        const endRange = range.cloneRange()
        endRange.collapse(false)
        const endRect = endRange.getBoundingClientRect()

        const position = {
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
          cursorX: endRect.right,
          cursorY: endRect.bottom + window.scrollY,
        }

        return {
          text: selectedText,
          range: range,
          position,
        }
      },
    }), [])

    useEffect(() => {
      const updateContent = async () => {
        if (editorRef.current && content !== currentContent) {
          // Process markdown content to HTML
          const processedContent = await processContent(content)
          editorRef.current.innerHTML = processedContent
          setCurrentContent(processedContent)
        }
      }

      // Debounce content updates to prevent flashing
      const timeoutId = setTimeout(updateContent, 50)
      return () => clearTimeout(timeoutId)
    }, [content, currentContent])

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
      const htmlContent = e.currentTarget.innerHTML
      setCurrentContent(htmlContent)
      onUpdate?.(htmlContent)
    }

    const handleSelectionChange = () => {
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.getSelection) {
          const selection = window.getSelection()
          if (selection && selection.rangeCount > 0) {
            const selectedText = selection.toString().trim()
            if (selectedText) {
              onSelectionUpdate?.(true)
            } else {
              onSelectionUpdate?.(null)
            }
          } else {
            onSelectionUpdate?.(null)
          }
        }
      }, 100)
    }

    useEffect(() => {
      const processInitialContent = async () => {
        if (editorRef.current) {
          const processedContent = await processContent(content)
          editorRef.current.innerHTML = processedContent
          setCurrentContent(processedContent)
        }
      }
      
      processInitialContent()
    }, [])

    return (
      <div className={`rich-text-editor ${className}`} style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="editor-scroll-container" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <div
            ref={editorRef}
            contentEditable={editable}
            onInput={handleInput}
            onMouseUp={handleSelectionChange}
            onKeyUp={handleSelectionChange}
            className="content-editable prose prose-neutral max-w-none dark:prose-invert focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded-md"
            style={{ 
              lineHeight: '1.7',
              padding: '24px',
              paddingBottom: '100px',
              minHeight: '100%',
            }}
            suppressContentEditableWarning={true}
          />
        </div>
      </div>
    )
  }
)

RichTextEditor.displayName = 'RichTextEditor'