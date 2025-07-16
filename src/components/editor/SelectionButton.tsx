'use client'

import { Selection } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Wand2 } from 'lucide-react'

interface SelectionButtonProps {
  selection: Selection
  onEdit: () => void
}

export function SelectionButton({ selection, onEdit }: SelectionButtonProps) {
  // Calculate positioning for the button based on cursor position
  const calculatePosition = () => {
    const { cursorX, cursorY } = selection.position
    const buttonWidth = 120
    const buttonHeight = 32
    const offset = 8 // Small offset from cursor
    
    // Safety check for browser environment
    if (typeof window === 'undefined') {
      return { top: cursorY, left: cursorX }
    }
    
    // Get viewport dimensions
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    // Position below and slightly to the right of cursor by default
    let buttonTop = cursorY + offset
    let buttonLeft = cursorX - (buttonWidth / 2)
    
    // If button would go off the left edge, align to left edge
    if (buttonLeft < 10) {
      buttonLeft = 10
    }
    
    // If button would go off the right edge, align to right edge
    if (buttonLeft + buttonWidth > viewportWidth - 10) {
      buttonLeft = viewportWidth - buttonWidth - 10
    }
    
    // If button would go off the bottom edge, position above cursor
    if (buttonTop + buttonHeight > viewportHeight - 10) {
      buttonTop = cursorY - buttonHeight - offset
    }
    
    // If still off top edge, position at top of viewport
    if (buttonTop < 10) {
      buttonTop = 10
    }
    
    return { top: buttonTop, left: buttonLeft }
  }

  const position = calculatePosition()

  return (
    <div 
      data-testid="selection-button"
      className="fixed z-50 animate-in fade-in-0 zoom-in-95 duration-200"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      <div className="relative">
        {/* Small triangle pointer */}
        <div 
          className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-primary"
        />
        <Button
          size="sm"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onEdit()
          }}
          onMouseDown={(e) => {
            // Prevent the button click from clearing the text selection
            e.preventDefault()
            e.stopPropagation()
          }}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg border border-primary/20"
        >
          <Wand2 className="h-3 w-3 mr-1" />
          Edit with AI
        </Button>
      </div>
    </div>
  )
}