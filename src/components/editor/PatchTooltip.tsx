'use client'

import { useState } from 'react'
import { Selection } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { X, Wand2, Loader2 } from 'lucide-react'

interface PatchTooltipProps {
  selection: Selection
  onClose: () => void
  onGeneratePatch: (originalText: string, patchPrompt: string) => Promise<void>
  isGenerating?: boolean
}

export function PatchTooltip({ 
  selection, 
  onClose, 
  onGeneratePatch,
  isGenerating = false 
}: PatchTooltipProps) {
  const [patchPrompt, setPatchPrompt] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!patchPrompt.trim() || isGenerating) return

    await onGeneratePatch(selection.text, patchPrompt)
    setPatchPrompt('')
    onClose()
  }

  // Calculate better positioning for the tooltip
  const calculatePosition = () => {
    const { top, left, height } = selection.position
    const tooltipWidth = 400
    const tooltipHeight = 200 // Approximate height
    
    // Safety check for browser environment
    if (typeof window === 'undefined') {
      return { top, left }
    }
    
    // Get viewport dimensions
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    // Position below the selection by default
    let tooltipTop = top + height + 10
    let tooltipLeft = left
    
    // If tooltip would go off the right edge, adjust
    if (tooltipLeft + tooltipWidth > viewportWidth) {
      tooltipLeft = viewportWidth - tooltipWidth - 20
    }
    
    // If tooltip would go off the bottom edge, position above
    if (tooltipTop + tooltipHeight > viewportHeight) {
      tooltipTop = top - tooltipHeight - 10
    }
    
    // Ensure tooltip doesn't go off the left edge
    if (tooltipLeft < 20) {
      tooltipLeft = 20
    }
    
    // Ensure tooltip doesn't go off the top edge
    if (tooltipTop < 20) {
      tooltipTop = 20
    }
    
    return { top: tooltipTop, left: tooltipLeft }
  }

  const position = calculatePosition()

  return (
    <div 
      data-testid="patch-tooltip"
      className="fixed z-50"
      style={{
        top: position.top,
        left: position.left,
        maxWidth: '400px',
      }}
    >
      <Card className="shadow-lg border-2 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Edit Selected Text
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
              aria-label="Close patch tooltip"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selected text preview */}
          <div className="bg-muted/50 rounded-md p-3 text-sm">
            <div className="font-medium text-muted-foreground mb-1">Selected text:</div>
            <div className="text-foreground line-clamp-3">{selection.text}</div>
          </div>

          {/* Patch prompt input */}
          <form onSubmit={handleSubmit} className="space-y-3" role="form">
            <div>
              <Textarea
                placeholder="Describe how you want to modify this text..."
                value={patchPrompt}
                onChange={(e) => setPatchPrompt(e.target.value)}
                className="min-h-[80px] resize-none"
                disabled={isGenerating}
                autoFocus
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isGenerating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!patchPrompt.trim() || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate Patch
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}