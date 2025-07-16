import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkHtml from 'remark-html'

/**
 * Convert markdown text to HTML
 * @param markdown - The markdown string to convert
 * @returns Promise<string> - The converted HTML string
 */
export async function markdownToHtml(markdown: string): Promise<string> {
  try {
    const result = await remark()
      .use(remarkGfm) // GitHub Flavored Markdown support
      .use(remarkHtml, { 
        sanitize: false, // We trust the content from our LLM
        allowDangerousHtml: true // Allow raw HTML in markdown
      })
      .process(markdown)

    return result.toString()
  } catch (error) {
    console.error('Error converting markdown to HTML:', error)
    // Return the original markdown if conversion fails
    return markdown
  }
}

/**
 * Check if content appears to be markdown
 * @param content - The content to check
 * @returns boolean - True if content looks like markdown
 */
export function isMarkdown(content: string): boolean {
  // Simple heuristics to detect markdown
  const markdownPatterns = [
    /^#{1,6}\s/, // Headers
    /^\*\s/, // Unordered lists with asterisk
    /^-\s/, // Unordered lists with dash
    /^\d+\.\s/, // Ordered lists
    /\*\*.*\*\*/, // Bold text
    /\*.*\*/, // Italic text
    /\[.*\]\(.*\)/, // Links
    /```/, // Code blocks
    /^>\s/, // Blockquotes
  ]

  return markdownPatterns.some(pattern => pattern.test(content))
}

/**
 * Convert markdown to HTML if needed, otherwise return as-is
 * @param content - The content to process
 * @returns Promise<string> - The processed content
 */
export async function processContent(content: string): Promise<string> {
  if (!content.trim()) return content
  
  // If content looks like markdown, convert it
  if (isMarkdown(content)) {
    return await markdownToHtml(content)
  }
  
  // If it's already HTML or plain text, return as-is
  return content
}