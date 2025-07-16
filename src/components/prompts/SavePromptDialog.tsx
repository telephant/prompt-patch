'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { promptStorage } from '@/lib/storage/promptStorage'
import { Save, Plus, X } from 'lucide-react'

interface SavePromptDialogProps {
  promptContent: string
  onSaved?: () => void
  children: React.ReactNode
}

export function SavePromptDialog({ promptContent, onSaved, children }: SavePromptDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [content, setContent] = useState(promptContent)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleSave = async () => {
    if (!name.trim() || !content.trim()) return

    setIsSaving(true)
    try {
      await promptStorage.savePrompt({
        name: name.trim(),
        content: content.trim(),
        tags: tags.length > 0 ? tags : undefined
      })
      
      // Reset form
      setName('')
      setContent('')
      setTags([])
      setTagInput('')
      setIsOpen(false)
      
      onSaved?.()
    } catch (error) {
      console.error('Failed to save prompt:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      setContent(promptContent)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Save Prompt
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Name Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              placeholder="Enter a name for this prompt..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Content Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Content</label>
            <Textarea
              placeholder="Enter your prompt content..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="resize-none"
            />
          </div>

          {/* Tags Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tags (optional)</label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Display Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1 hover:bg-transparent focus-visible:ring-1 focus-visible:ring-offset-1"
                      onClick={() => handleRemoveTag(tag)}
                      aria-label={`Remove tag: ${tag}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!name.trim() || !content.trim() || isSaving}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Prompt
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}