'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { promptStorage, SavedPrompt } from '@/lib/storage/promptStorage'
import { Plus, Search, Edit2, Trash2, BookOpen, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface PromptManagerProps {
  onSelectPrompt: (prompt: SavedPrompt) => void
  children: React.ReactNode
}

export function PromptManager({ onSelectPrompt, children }: PromptManagerProps) {
  const [prompts, setPrompts] = useState<SavedPrompt[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [filteredPrompts, setFilteredPrompts] = useState<SavedPrompt[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadPrompts()
  }, [])

  useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredPrompts(
        prompts.filter(prompt =>
          prompt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          prompt.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          prompt.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      )
    } else {
      setFilteredPrompts(prompts)
    }
  }, [searchQuery, prompts])

  const loadPrompts = async () => {
    setLoading(true)
    try {
      const savedPrompts = await promptStorage.getAllPrompts()
      setPrompts(savedPrompts)
      setFilteredPrompts(savedPrompts)
    } catch (error) {
      console.error('Failed to load prompts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPrompt = (prompt: SavedPrompt) => {
    onSelectPrompt(prompt)
    setIsOpen(false)
  }

  const handleDeletePrompt = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation()
    try {
      await promptStorage.deletePrompt(id)
      await loadPrompts()
    } catch (error) {
      console.error('Failed to delete prompt:', error)
    }
  }

  const getPreviewText = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Saved Prompts
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Search Bar */}
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search prompts by name, content, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Prompt
            </Button>
          </div>

          {/* Prompts List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Loading prompts...</div>
              </div>
            ) : filteredPrompts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery ? 'No prompts found' : 'No saved prompts yet'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery 
                    ? 'Try a different search term or create a new prompt.'
                    : 'Create your first prompt to get started.'
                  }
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setIsOpen(false)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Prompt
                </Button>
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredPrompts.map((prompt) => (
                  <Card 
                    key={prompt.id} 
                    className="cursor-pointer interactive-card"
                    onClick={() => handleSelectPrompt(prompt)}
                    tabIndex={0}
                    role="button"
                    aria-label={`Select prompt: ${prompt.name}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleSelectPrompt(prompt)
                      }
                    }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base font-semibold line-clamp-1">
                            {prompt.name}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-1 text-sm mt-1">
                            <Calendar className="h-3 w-3" />
                            {formatDistanceToNow(new Date(prompt.updatedAt), { addSuffix: true })}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDeletePrompt(prompt.id, e)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive focus-visible:ring-destructive/50"
                            aria-label={`Delete prompt: ${prompt.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {getPreviewText(prompt.content)}
                      </p>
                      {prompt.tags && prompt.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {prompt.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}