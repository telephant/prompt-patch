'use client'

import { Patch } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, X, RefreshCw, Clock } from 'lucide-react'

interface PatchPreviewProps {
  patch: Patch
  onAccept: (patchId: string) => void
  onReject: (patchId: string) => void
  onRefine?: (patchId: string) => void
}

export function PatchPreview({ 
  patch, 
  onAccept, 
  onReject, 
  onRefine 
}: PatchPreviewProps) {
  const getStatusIcon = () => {
    switch (patch.status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'applied':
        return <Check className="h-4 w-4 text-green-500" />
      case 'rejected':
        return <X className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusColor = () => {
    switch (patch.status) {
      case 'pending':
        return 'border-yellow-200 bg-yellow-50/50'
      case 'applied':
        return 'border-green-200 bg-green-50/50'
      case 'rejected':
        return 'border-red-200 bg-red-50/50'
    }
  }

  // Calculate better positioning for the patch preview
  const calculatePosition = () => {
    const { top, left, height } = patch.position
    const previewWidth = 500
    const previewHeight = 300 // Approximate height
    
    // Safety check for browser environment
    if (typeof window === 'undefined') {
      return { top, left }
    }
    
    // Get viewport dimensions
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    // Position below the selection by default
    let previewTop = top + height + 10
    let previewLeft = left
    
    // If preview would go off the right edge, adjust
    if (previewLeft + previewWidth > viewportWidth) {
      previewLeft = viewportWidth - previewWidth - 20
    }
    
    // If preview would go off the bottom edge, position above
    if (previewTop + previewHeight > viewportHeight) {
      previewTop = top - previewHeight - 10
    }
    
    // Ensure preview doesn't go off the left edge
    if (previewLeft < 20) {
      previewLeft = 20
    }
    
    // Ensure preview doesn't go off the top edge
    if (previewTop < 20) {
      previewTop = 20
    }
    
    return { top: previewTop, left: previewLeft }
  }

  const position = calculatePosition()

  return (
    <div 
      className="fixed z-40"
      style={{
        top: position.top,
        left: position.left,
        maxWidth: '500px',
      }}
    >
      <Card className={`shadow-lg border-2 ${getStatusColor()}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {getStatusIcon()}
              AI Patch Suggestion
            </CardTitle>
            <div className="text-xs text-muted-foreground">
              {patch.createdAt.toLocaleTimeString()}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Original text */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Original
            </div>
            <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm">
              <div className="text-red-800 line-clamp-3">
                {patch.originalText}
              </div>
            </div>
          </div>

          {/* Patched text */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Suggested Change
            </div>
            <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm">
              <div className="text-green-800">
                {patch.patchedText}
              </div>
            </div>
          </div>

          {/* Actions */}
          {patch.status === 'pending' && (
            <div className="flex justify-end space-x-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReject(patch.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4 mr-1" />
                Reject
              </Button>
              
              {onRefine && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRefine(patch.id)}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refine
                </Button>
              )}
              
              <Button
                size="sm"
                onClick={() => onAccept(patch.id)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-1" />
                Accept
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}