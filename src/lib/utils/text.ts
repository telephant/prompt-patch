/**
 * Utility functions for text processing
 */

/**
 * Strip HTML tags from a string and return plain text
 */
export function stripHtml(html: string): string {
  if (typeof window === 'undefined') {
    // Server-side: simple regex approach
    return html.replace(/<[^>]*>/g, '').trim()
  }
  
  // Client-side: use DOM parser for better accuracy
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body.textContent || doc.body.innerText || ''
}

/**
 * Get a preview of text content (first n characters)
 */
export function getTextPreview(text: string, maxLength: number = 100): string {
  const cleaned = stripHtml(text).trim()
  if (cleaned.length <= maxLength) return cleaned
  return cleaned.substring(0, maxLength) + '...'
}

/**
 * Count words in text content
 */
export function countWords(text: string): number {
  const cleaned = stripHtml(text).trim()
  if (!cleaned) return 0
  return cleaned.split(/\s+/).length
}

/**
 * Estimate reading time in minutes
 */
export function estimateReadingTime(text: string, wordsPerMinute: number = 200): number {
  const wordCount = countWords(text)
  return Math.ceil(wordCount / wordsPerMinute)
}