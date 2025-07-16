'use client'

import { useState, useEffect } from 'react'
import { PromptletInput } from '@/components/prompts/PromptletInput'
import { Editor } from '@/components/editor/Editor'
import { APIKeyManagerComponent } from '@/components/settings/APIKeyManager'
import { OptimizePromptDialog } from '@/components/prompts/OptimizePromptDialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useLangChain } from '@/hooks/useLangChain'
import { Settings, AlertCircle, Sparkles } from 'lucide-react'

export default function Home() {
  const [document, setDocument] = useState('')
  const [streamingDocument, setStreamingDocument] = useState('')
  const [originalDocument, setOriginalDocument] = useState('')
  const [currentPromptlet, setCurrentPromptlet] = useState('')
  const [documentModified, setDocumentModified] = useState(false)
  const [acceptedPatchPrompts, setAcceptedPatchPrompts] = useState<string[]>([])
  const [settingsOpen, setSettingsOpen] = useState(false)
  
  const { 
    generateDocument, 
    isLoading, 
    error, 
    clearError 
  } = useLangChain()

  // Track document modifications
  useEffect(() => {
    if (originalDocument && document && document !== originalDocument) {
      setDocumentModified(true)
    } else {
      setDocumentModified(false)
    }
  }, [document, originalDocument])

  const handlePromptletSubmit = async (promptlet: string) => {
    clearError()
    setStreamingDocument('')
    setCurrentPromptlet(promptlet)
    setDocumentModified(false)
    setAcceptedPatchPrompts([]) // Reset patch prompts for new document
    
    const result = await generateDocument(promptlet, (token) => {
      setStreamingDocument(prev => prev + token)
    })
    
    if (result) {
      setDocument(result)
      setOriginalDocument(result)
      setStreamingDocument('')
    }
  }

  const handleDocumentChange = (newDocument: string) => {
    setDocument(newDocument)
  }

  const handleOptimizedPrompt = (optimizedPrompt: string) => {
    // Use the optimized prompt to generate a new document
    handlePromptletSubmit(optimizedPrompt)
  }

  const handlePatchAccepted = (patchPrompt: string) => {
    // Add the patch prompt to our collection when a patch is accepted
    setAcceptedPatchPrompts(prev => [...prev, patchPrompt])
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      <header className="border-b bg-card flex-shrink-0">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Prompt Patch</h1>
              <p className="text-muted-foreground text-sm">
                AI-powered writing tool with localized editing
              </p>
            </div>
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Settings</DialogTitle>
                </DialogHeader>
                <APIKeyManagerComponent />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-4 py-8 overflow-hidden flex flex-col">
        {error && (
          <Alert variant="destructive" className="mb-6 flex-shrink-0">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error.message}
              {(error.code === 'API_KEY_MISSING' || error.code === 'QUOTA_EXCEEDED') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSettingsOpen(true)}
                  className="ml-2"
                >
                  {error.code === 'QUOTA_EXCEEDED' ? 'Add Your API Key' : 'Add API Key'}
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-8">
          <div className="lg:w-80 flex-shrink-0">
            <div className="sticky top-0">
              <PromptletInput 
                onSubmit={handlePromptletSubmit}
                isLoading={isLoading}
              />
            </div>
          </div>
          
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Optimize Prompt Button */}
            {currentPromptlet && !isLoading && (acceptedPatchPrompts.length > 0 || documentModified) && (
              <div className="mb-4 flex justify-end">
                <OptimizePromptDialog
                  originalPrompt={currentPromptlet}
                  patchPrompts={acceptedPatchPrompts}
                  onOptimizedPrompt={handleOptimizedPrompt}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20 hover:from-primary/20 hover:to-purple-500/20"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Optimize Prompt
                    {acceptedPatchPrompts.length > 0 && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {acceptedPatchPrompts.length}
                      </Badge>
                    )}
                  </Button>
                </OptimizePromptDialog>
              </div>
            )}
            
            <Editor 
              document={streamingDocument || document}
              onDocumentChange={handleDocumentChange}
            />
          </div>
        </div>
      </main>
    </div>
  )
}