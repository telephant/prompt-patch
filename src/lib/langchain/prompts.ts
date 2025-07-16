import { PromptTemplate } from '@langchain/core/prompts'

export const documentGenerationPrompt = PromptTemplate.fromTemplate(`
You are a professional writing assistant. Generate a comprehensive, well-structured document based on the following prompt:

{promptlet}

Requirements:
- Create a complete, professional document that fully addresses the prompt
- Use proper markdown formatting with headers, lists, and emphasis where appropriate
- Write in a clear, engaging style appropriate for the content type
- Include relevant details and examples where helpful
- Organize content logically with clear sections
- Aim for 300-800 words depending on the topic complexity

Format your response in markdown and ensure it's ready for publication.
`)

export const patchGenerationPrompt = PromptTemplate.fromTemplate(`
You are helping to improve a specific section of a document. Here is the context:

Original text:
{originalText}

User's improvement request:
{patchPrompt}

Instructions:
- Revise the original text according to the user's request
- Maintain the same general length and style as the original
- Keep the content contextually appropriate for the surrounding document
- Only return the revised text, no explanations or additional commentary
- Preserve any markdown formatting that exists in the original

Revised text:
`)

export const promptletRegenerationPrompt = PromptTemplate.fromTemplate(`
Analyze the following document and generate a concise prompt that would produce this content:

Document:
{document}

Create a prompt that:
- Captures the main intent and purpose of the document
- Is concise but specific (1-2 sentences)
- Would generate similar content when used with an AI writing assistant
- Focuses on the key requirements and style

Prompt:
`)