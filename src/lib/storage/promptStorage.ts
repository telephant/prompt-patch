'use client'

export interface SavedPrompt {
  id: string
  name: string
  content: string
  createdAt: Date
  updatedAt: Date
  tags?: string[]
}

class PromptStorage {
  private dbName = 'prompt-patch-db'
  private version = 1
  private storeName = 'prompts'

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' })
          store.createIndex('name', 'name', { unique: false })
          store.createIndex('createdAt', 'createdAt', { unique: false })
          store.createIndex('updatedAt', 'updatedAt', { unique: false })
        }
      }
    })
  }

  async savePrompt(prompt: Omit<SavedPrompt, 'id' | 'createdAt' | 'updatedAt'>): Promise<SavedPrompt> {
    const db = await this.openDB()
    const now = new Date()
    
    const savedPrompt: SavedPrompt = {
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      ...prompt
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.add(savedPrompt)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(savedPrompt)
    })
  }

  async updatePrompt(id: string, updates: Partial<Omit<SavedPrompt, 'id' | 'createdAt'>>): Promise<SavedPrompt> {
    const db = await this.openDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const getRequest = store.get(id)

      getRequest.onerror = () => reject(getRequest.error)
      getRequest.onsuccess = () => {
        const existingPrompt = getRequest.result
        if (!existingPrompt) {
          reject(new Error('Prompt not found'))
          return
        }

        const updatedPrompt: SavedPrompt = {
          ...existingPrompt,
          ...updates,
          updatedAt: new Date()
        }

        const putRequest = store.put(updatedPrompt)
        putRequest.onerror = () => reject(putRequest.error)
        putRequest.onsuccess = () => resolve(updatedPrompt)
      }
    })
  }

  async getAllPrompts(): Promise<SavedPrompt[]> {
    const db = await this.openDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const index = store.index('updatedAt')
      const request = index.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        // Sort by updatedAt in descending order (most recent first)
        const prompts = request.result.sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        resolve(prompts)
      }
    })
  }

  async getPrompt(id: string): Promise<SavedPrompt | null> {
    const db = await this.openDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.get(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || null)
    })
  }

  async deletePrompt(id: string): Promise<void> {
    const db = await this.openDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.delete(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async searchPrompts(query: string): Promise<SavedPrompt[]> {
    const allPrompts = await this.getAllPrompts()
    const lowercaseQuery = query.toLowerCase()
    
    return allPrompts.filter(prompt => 
      prompt.name.toLowerCase().includes(lowercaseQuery) ||
      prompt.content.toLowerCase().includes(lowercaseQuery) ||
      prompt.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    )
  }

  async clearAll(): Promise<void> {
    const db = await this.openDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.clear()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }
}

export const promptStorage = new PromptStorage()