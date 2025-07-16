import { describe, it, expect } from 'vitest'
import { markdownToHtml, isMarkdown, processContent } from '@/lib/utils/markdown'

describe('markdown utils', () => {
  describe('isMarkdown', () => {
    it('should detect markdown headers', () => {
      expect(isMarkdown('# Title')).toBe(true)
      expect(isMarkdown('## Subtitle')).toBe(true)
      expect(isMarkdown('### Section')).toBe(true)
    })

    it('should detect markdown lists', () => {
      expect(isMarkdown('* Item 1')).toBe(true)
      expect(isMarkdown('1. Item 1')).toBe(true)
      expect(isMarkdown('- Item 1')).toBe(true)
    })

    it('should detect markdown formatting', () => {
      expect(isMarkdown('**bold text**')).toBe(true)
      expect(isMarkdown('*italic text*')).toBe(true)
      expect(isMarkdown('[link](url)')).toBe(true)
      expect(isMarkdown('```code```')).toBe(true)
    })

    it('should detect markdown blockquotes', () => {
      expect(isMarkdown('> Quote')).toBe(true)
    })

    it('should not detect plain text as markdown', () => {
      expect(isMarkdown('Just plain text')).toBe(false)
      expect(isMarkdown('This is HTML <p>content</p>')).toBe(false)
    })
  })

  describe('markdownToHtml', () => {
    it('should convert markdown headers to HTML', async () => {
      const result = await markdownToHtml('# Title')
      expect(result).toContain('<h1>Title</h1>')
    })

    it('should convert markdown lists to HTML', async () => {
      const result = await markdownToHtml('* Item 1\n* Item 2')
      expect(result).toContain('<ul>')
      expect(result).toContain('<li>Item 1</li>')
      expect(result).toContain('<li>Item 2</li>')
    })

    it('should convert markdown formatting to HTML', async () => {
      const result = await markdownToHtml('**bold** and *italic*')
      expect(result).toContain('<strong>bold</strong>')
      expect(result).toContain('<em>italic</em>')
    })

    it('should handle errors gracefully', async () => {
      const result = await markdownToHtml('# Title')
      expect(result).toBeDefined()
    })
  })

  describe('processContent', () => {
    it('should convert markdown content to HTML', async () => {
      const result = await processContent('# Title\n\n**Bold text**')
      expect(result).toContain('<h1>Title</h1>')
      expect(result).toContain('<strong>Bold text</strong>')
    })

    it('should return HTML content as-is', async () => {
      const htmlContent = '<h1>Title</h1><p>Content</p>'
      const result = await processContent(htmlContent)
      expect(result).toBe(htmlContent)
    })

    it('should return plain text as-is', async () => {
      const plainText = 'Just plain text without markdown'
      const result = await processContent(plainText)
      expect(result).toBe(plainText)
    })

    it('should handle empty content', async () => {
      const result = await processContent('')
      expect(result).toBe('')
    })
  })
})