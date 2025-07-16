'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, BookOpen, Save } from 'lucide-react'
import { PromptManager } from './PromptManager'
import { SavePromptDialog } from './SavePromptDialog'
import { SavedPrompt } from '@/lib/storage/promptStorage'

interface PromptletInputProps {
  onSubmit?: (promptlet: string) => void
  isLoading?: boolean
}

export function PromptletInput({ onSubmit, isLoading = false }: PromptletInputProps) {
  const [promptlet, setPromptlet] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (promptlet.trim() && onSubmit) {
      onSubmit(promptlet.trim())
    }
  }

  const handleSelectPrompt = (prompt: SavedPrompt) => {
    setPromptlet(prompt.content)
  }

  const handlePromptSaved = () => {
    // Optional: Show success message or refresh prompt list
    console.log('Prompt saved successfully!')
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-2">Start with a Promptlet</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Enter a prompt to generate your document. You can edit any part later.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Textarea
            data-testid="promptlet-input"
            placeholder="e.g., Write a professional email about project updates..."
            value={promptlet}
            onChange={(e) => setPromptlet(e.target.value)}
            disabled={isLoading}
            rows={20}
          />
        </div>
        
        {/* Prompt Management Buttons */}
        <div className="flex gap-2">
          <PromptManager onSelectPrompt={handleSelectPrompt}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Saved Prompts
            </Button>
          </PromptManager>
          
          <SavePromptDialog
            promptContent={promptlet}
            onSaved={handlePromptSaved}
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!promptlet.trim() || isLoading}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Prompt
            </Button>
          </SavePromptDialog>
        </div>
        
        <Button 
          data-testid="generate-button"
          type="submit" 
          disabled={!promptlet.trim() || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Document'
          )}
        </Button>
      </form>
      
      {isLoading && (
        <div className="text-xs text-muted-foreground">
          This may take a few seconds...
        </div>
      )}
    </div>
  )
}