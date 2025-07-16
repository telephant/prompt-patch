'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { promptOptimizer } from '@/lib/langchain/optimizePrompt'
import { SavePromptDialog } from './SavePromptDialog'
import { stripHtml } from '@/lib/utils/text'
import { Sparkles, Copy, Check, Save, Loader2 } from 'lucide-react'

interface OptimizePromptDialogProps {
  originalPrompt: string
  patchPrompts: string[]
  onOptimizedPrompt?: (optimizedPrompt: string) => void
  children: React.ReactNode
}

export function OptimizePromptDialog({ 
  originalPrompt, 
  patchPrompts, 
  onOptimizedPrompt,
  children 
}: OptimizePromptDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [optimizedPrompt, setOptimizedPrompt] = useState('')
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCopied, setIsCopied] = useState(false)

  const handleOptimize = async () => {
    if (!originalPrompt.trim()) return

    setIsOptimizing(true)
    setError(null)
    
    try {
      const result = await promptOptimizer.optimizePrompt(
        originalPrompt,
        patchPrompts,
        'openai' // TODO: Make this configurable
      )
      
      setOptimizedPrompt(result)
    } catch (err) {
      console.error('Failed to optimize prompt:', err)
      setError(err instanceof Error ? err.message : 'Failed to optimize prompt')
    } finally {
      setIsOptimizing(false)
    }
  }

  const handleCopy = async () => {
    if (!optimizedPrompt) return
    
    try {
      await navigator.clipboard.writeText(optimizedPrompt)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleUsePrompt = () => {
    if (optimizedPrompt && onOptimizedPrompt) {
      onOptimizedPrompt(optimizedPrompt)
      setIsOpen(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      // Reset state when closing
      setOptimizedPrompt('')
      setError(null)
      setIsCopied(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Optimize Prompt
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Description */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              AI will analyze your original prompt and the enhancement tips from your accepted patches to create an optimized prompt 
              that incorporates these improvements directly.
            </p>
          </div>

          {/* Enhancement Tips Preview */}
          {patchPrompts.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Enhancement Tips</label>
                <Badge variant="outline" className="text-xs">
                  {patchPrompts.length} tips
                </Badge>
              </div>
              <div className="bg-muted/30 p-3 rounded-md max-h-32 overflow-y-auto">
                <ul className="text-sm text-muted-foreground space-y-1">
                  {patchPrompts.map((prompt, index) => (
                    <li key={index} className="line-clamp-1">
                      {index + 1}. {prompt}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {patchPrompts.length === 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                No enhancement tips available yet. Accept some AI patches to provide optimization guidance.
              </p>
            </div>
          )}

          {/* Original Prompt Preview */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Original Prompt</label>
              <Badge variant="outline" className="text-xs">
                {originalPrompt.length} characters
              </Badge>
            </div>
            <div className="bg-muted/30 p-3 rounded-md max-h-20 overflow-y-auto">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {originalPrompt}
              </p>
            </div>
          </div>

          {/* Optimization Button */}
          {!optimizedPrompt && !isOptimizing && (
            <Button
              onClick={handleOptimize}
              disabled={isOptimizing || !originalPrompt.trim()}
              className="w-full"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Optimized Prompt
            </Button>
          )}

          {/* Loading State */}
          {isOptimizing && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">
                  Analyzing your document and optimizing prompt...
                </span>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOptimize}
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Optimized Prompt Result */}
          {optimizedPrompt && (
            <div className="flex-1 overflow-hidden flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Optimized Prompt</label>
                  <Badge variant="secondary" className="text-xs">
                    {optimizedPrompt.length} characters
                  </Badge>
                </div>
              </div>
              
              <div className="flex-1 overflow-hidden">
                <Textarea
                  value={optimizedPrompt}
                  onChange={(e) => setOptimizedPrompt(e.target.value)}
                  className="h-full resize-none"
                  placeholder="Your optimized prompt will appear here..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="flex-1"
                >
                  {isCopied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
                
                <SavePromptDialog
                  promptContent={optimizedPrompt}
                  onSaved={() => {
                    // Optional: Show success message
                    console.log('Optimized prompt saved!')
                  }}
                >
                  <Button variant="outline" size="sm" className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </SavePromptDialog>
                
                <Button
                  onClick={handleUsePrompt}
                  size="sm"
                  className="flex-1"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Use This Prompt
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}