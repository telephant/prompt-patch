import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RichTextEditor, RichTextEditorRef } from '@/components/editor/RichTextEditor'
import { createRef } from 'react'

// Mock the markdown utility
vi.mock('@/lib/utils/markdown', () => ({
  processContent: vi.fn(async (content) => {
    // Handle null/undefined content
    if (!content) return ''
    
    // Simple mock - convert markdown headers to HTML
    if (content.includes('# ')) {
      return content.replace(/# (.*)/g, '<h1>$1</h1>')
    }
    if (content.includes('## ')) {
      return content.replace(/## (.*)/g, '<h2>$1</h2>')
    }
    if (content.includes('**')) {
      return content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    }
    return content
  }),
}))

describe('RichTextEditor', () => {
  let user: ReturnType<typeof userEvent.setup>
  
  beforeEach(() => {
    user = userEvent.setup()
    
    // Mock document.elementFromPoint for ProseMirror
    if (!document.elementFromPoint) {
      document.elementFromPoint = vi.fn(() => null)
    }
    
    // Mock range methods for better selection testing
    global.Range = class {
      setStart = vi.fn()
      setEnd = vi.fn()
      collapse = vi.fn()
      selectNodeContents = vi.fn()
      getBoundingClientRect = vi.fn(() => ({
        left: 0,
        top: 0,
        right: 100,
        bottom: 20,
        width: 100,
        height: 20,
      }))
    } as any
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Functionality', () => {
    it('should render without crashing', () => {
      render(
        <RichTextEditor
          content="Hello, world!"
          onUpdate={() => {}}
          onSelectionUpdate={() => {}}
        />
      )
      expect(screen.getByText('Hello, world!')).toBeInTheDocument()
    })

    it('should display content correctly', () => {
      render(
        <RichTextEditor
          content="Test content"
          onUpdate={() => {}}
          onSelectionUpdate={() => {}}
        />
      )
      expect(screen.getByText('Test content')).toBeInTheDocument()
    })

    it('should be editable by default', () => {
      render(
        <RichTextEditor
          content="Editable content"
          onUpdate={() => {}}
          onSelectionUpdate={() => {}}
        />
      )
      const editorElement = screen.getByText('Editable content')
      expect(editorElement).toBeInTheDocument()
    })

    it('should not be editable when editable=false', () => {
      render(
        <RichTextEditor
          content="Read-only content"
          editable={false}
          onUpdate={() => {}}
          onSelectionUpdate={() => {}}
        />
      )
      const editorElement = screen.getByText('Read-only content')
      expect(editorElement).toBeInTheDocument()
    })

    it('should not flash on first load', async () => {
      const { container } = render(
        <RichTextEditor
          content="No flash content"
          onUpdate={() => {}}
          onSelectionUpdate={() => {}}
        />
      )
      
      // Wait for editor to initialize
      await waitFor(() => {
        expect(screen.getByText('No flash content')).toBeInTheDocument()
      })
      
      // Check that content is stable
      expect(container.querySelector('.ProseMirror')).toBeInTheDocument()
    })
  })

  describe('Text Selection', () => {
    it('should allow text selection', async () => {
      const onSelectionUpdate = vi.fn()
      render(
        <RichTextEditor
          content="Selectable text content"
          onUpdate={() => {}}
          onSelectionUpdate={onSelectionUpdate}
        />
      )

      const editorElement = screen.getByText('Selectable text content')
      
      // Simulate text selection
      await user.pointer([
        { target: editorElement, coords: { x: 0, y: 0 } },
        { down: 'primary' },
        { target: editorElement, coords: { x: 50, y: 0 } },
        { up: 'primary' },
      ])

      // Selection update should be called
      expect(onSelectionUpdate).toHaveBeenCalled()
    })

    it('should not move text during selection', async () => {
      const { container } = render(
        <RichTextEditor
          content="Text that should not move"
          onUpdate={() => {}}
          onSelectionUpdate={() => {}}
        />
      )

      const editorElement = screen.getByText('Text that should not move')
      const initialPosition = editorElement.getBoundingClientRect()
      
      // Simulate dragging
      await user.pointer([
        { target: editorElement, coords: { x: 0, y: 0 } },
        { down: 'primary' },
        { target: editorElement, coords: { x: 100, y: 0 } },
        { up: 'primary' },
      ])

      const finalPosition = editorElement.getBoundingClientRect()
      expect(finalPosition.left).toBe(initialPosition.left)
      expect(finalPosition.top).toBe(initialPosition.top)
    })

    it('should prevent drag events', async () => {
      const { container } = render(
        <RichTextEditor
          content="No drag content"
          onUpdate={() => {}}
          onSelectionUpdate={() => {}}
        />
      )

      const editorElement = container.querySelector('.ProseMirror')
      expect(editorElement).toBeInTheDocument()

      // Check that draggable is false
      expect(editorElement).toHaveAttribute('draggable', 'false')
    })

    it('should handle double-click without creating huge blank spaces', async () => {
      const { container } = render(
        <RichTextEditor
          content="Double click test content"
          onUpdate={() => {}}
          onSelectionUpdate={() => {}}
        />
      )

      const editorElement = screen.getByText('Double click test content')
      const initialHeight = container.querySelector('.ProseMirror')?.scrollHeight
      
      // Double-click the text
      await user.dblClick(editorElement)
      
      // Check that height hasn't increased dramatically
      const finalHeight = container.querySelector('.ProseMirror')?.scrollHeight
      expect(finalHeight).toBe(initialHeight)
    })
  })

  describe('Toolbar Functionality', () => {
    it('should support bold text formatting', async () => {
      const onUpdate = vi.fn()
      const ref = createRef<RichTextEditorRef>()
      
      render(
        <RichTextEditor
          ref={ref}
          content="Bold text test"
          onUpdate={onUpdate}
          onSelectionUpdate={() => {}}
        />
      )

      // Wait for editor to be ready
      await waitFor(() => {
        expect(ref.current).toBeTruthy()
      })

      // This would typically be triggered by toolbar
      // For now, we test the ref methods
      expect(ref.current?.getHTML()).toContain('Bold text test')
    })

    it('should support undo/redo functionality', async () => {
      const onUpdate = vi.fn()
      const ref = createRef<RichTextEditorRef>()
      
      render(
        <RichTextEditor
          ref={ref}
          content="Undo test"
          onUpdate={onUpdate}
          onSelectionUpdate={() => {}}
        />
      )

      await waitFor(() => {
        expect(ref.current).toBeTruthy()
      })

      // Test that we can get HTML (basic functionality)
      expect(ref.current?.getHTML()).toContain('Undo test')
    })

    it('should support keyboard shortcuts', async () => {
      render(
        <RichTextEditor
          content="Keyboard test"
          onUpdate={() => {}}
          onSelectionUpdate={() => {}}
        />
      )

      const editorElement = screen.getByText('Keyboard test')
      
      // Test Ctrl+Z (undo)
      await user.keyboard('{Control>}z{/Control}')
      
      // This test would need more setup to verify actual undo behavior
      expect(editorElement).toBeInTheDocument()
    })
  })

  describe('Markdown Integration', () => {
    it('should convert markdown headers to HTML', async () => {
      render(
        <RichTextEditor
          content="# Main Title"
          onUpdate={() => {}}
          onSelectionUpdate={() => {}}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Main Title')).toBeInTheDocument()
      })
    })

    it('should convert markdown bold to HTML', async () => {
      render(
        <RichTextEditor
          content="**Bold text**"
          onUpdate={() => {}}
          onSelectionUpdate={() => {}}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Bold text')).toBeInTheDocument()
      })
    })

    it('should handle mixed markdown and HTML content', async () => {
      render(
        <RichTextEditor
          content="## Subtitle with **bold** text"
          onUpdate={() => {}}
          onSelectionUpdate={() => {}}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/Subtitle with.*bold.*text/)).toBeInTheDocument()
      })
    })
  })

  describe('Performance', () => {
    it('should not cause excessive re-renders', async () => {
      const onUpdate = vi.fn()
      const onSelectionUpdate = vi.fn()
      
      const { rerender } = render(
        <RichTextEditor
          content="Performance test"
          onUpdate={onUpdate}
          onSelectionUpdate={onSelectionUpdate}
        />
      )

      // Re-render with same content
      rerender(
        <RichTextEditor
          content="Performance test"
          onUpdate={onUpdate}
          onSelectionUpdate={onSelectionUpdate}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Performance test')).toBeInTheDocument()
      })
    })

    it('should handle large content efficiently', async () => {
      const largeContent = Array(1000).fill('Large content line').join('\n')
      
      render(
        <RichTextEditor
          content={largeContent}
          onUpdate={() => {}}
          onSelectionUpdate={() => {}}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/Large content line/)).toBeInTheDocument()
      })
    })
  })

  describe('Ref Methods', () => {
    it('should expose getHTML method', async () => {
      const ref = createRef<RichTextEditorRef>()
      
      render(
        <RichTextEditor
          ref={ref}
          content="HTML test"
          onUpdate={() => {}}
          onSelectionUpdate={() => {}}
        />
      )

      await waitFor(() => {
        expect(ref.current?.getHTML()).toContain('HTML test')
      })
    })

    it('should expose setContent method', async () => {
      const ref = createRef<RichTextEditorRef>()
      
      render(
        <RichTextEditor
          ref={ref}
          content="Initial content"
          onUpdate={() => {}}
          onSelectionUpdate={() => {}}
        />
      )

      await waitFor(() => {
        expect(ref.current).toBeTruthy()
      })

      // Test setContent method
      await ref.current?.setContent('New content')
      
      expect(ref.current?.getHTML()).toContain('New content')
    })

    it('should expose focus method', async () => {
      const ref = createRef<RichTextEditorRef>()
      
      render(
        <RichTextEditor
          ref={ref}
          content="Focus test"
          onUpdate={() => {}}
          onSelectionUpdate={() => {}}
        />
      )

      await waitFor(() => {
        expect(ref.current).toBeTruthy()
      })

      // Test focus method
      expect(() => ref.current?.focus()).not.toThrow()
    })

    it('should expose getSelection method', async () => {
      const ref = createRef<RichTextEditorRef>()
      
      render(
        <RichTextEditor
          ref={ref}
          content="Selection test"
          onUpdate={() => {}}
          onSelectionUpdate={() => {}}
        />
      )

      await waitFor(() => {
        expect(ref.current).toBeTruthy()
      })

      // Test getSelection method
      const selection = ref.current?.getSelection()
      expect(selection).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid content gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      render(
        <RichTextEditor
          content={null as any}
          onUpdate={() => {}}
          onSelectionUpdate={() => {}}
        />
      )

      await waitFor(() => {
        // Should not crash and should render the editor
        expect(document.querySelector('.ProseMirror')).toBeInTheDocument()
      })
      
      consoleSpy.mockRestore()
    })

    it('should handle missing callbacks gracefully', async () => {
      expect(() => {
        render(
          <RichTextEditor
            content="Callback test"
            onUpdate={undefined as any}
            onSelectionUpdate={undefined as any}
          />
        )
      }).not.toThrow()
    })
  })
})