import { ChatPromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { createLLM, getAvailableLLM } from './llm'
import { LLMProvider } from './config'
import { handleLLMError, LLMError } from './errors'

const OPTIMIZE_PROMPT_TEMPLATE = `You are an expert prompt engineer. Your task is to analyze an original prompt and the enhancement tips that users applied to improve the generated content, then create an optimized version of the original prompt that incorporates these improvements.

Original Prompt:
{originalPrompt}

Enhancement Tips (from user patch prompts):
{enhancementTips}

Please analyze the original prompt and the enhancement tips that users applied to improve the generated content. Then create an optimized prompt that incorporates these improvements directly.

Guidelines:
1. Preserve the core intent and style of the original prompt
2. Integrate the enhancement tips seamlessly into the original prompt
3. Make the prompt more specific and actionable based on the improvements
4. Include any formatting, style, or content requirements from the enhancement tips
5. Keep the optimized prompt concise but comprehensive
6. If no enhancement tips are provided, return the original prompt unchanged

Return only the optimized prompt, nothing else.`

export async function optimizePrompt(
  originalPrompt: string,
  patchPrompts: string[],
  options?: {
    provider?: LLMProvider
    model?: string
  }
): Promise<string> {
  let llm
  let provider = options?.provider
  
  try {
    if (!originalPrompt.trim()) {
      throw new LLMError('Original prompt is required', 'INVALID_INPUT')
    }

    if (provider) {
      llm = createLLM(provider, options?.model)
    } else {
      const available = getAvailableLLM()
      llm = available.llm
      provider = available.provider
    }
    
    // Format enhancement tips from patch prompts
    const enhancementTips = patchPrompts.length > 0 
      ? patchPrompts.map((prompt, index) => `${index + 1}. ${prompt}`).join('\n')
      : 'No enhancement tips provided.'
    
    const promptTemplate = ChatPromptTemplate.fromTemplate(OPTIMIZE_PROMPT_TEMPLATE)
    const outputParser = new StringOutputParser()
    
    const chain = promptTemplate.pipe(llm).pipe(outputParser)
    
    const optimizedPrompt = await chain.invoke({
      originalPrompt: originalPrompt.trim(),
      enhancementTips,
    })

    return optimizedPrompt.trim()
  } catch (error) {
    throw handleLLMError(error, provider)
  }
}

export class PromptOptimizer {
  async optimizePrompt(
    originalPrompt: string,
    patchPrompts: string[],
    provider: 'openai' | 'anthropic' = 'openai'
  ): Promise<string> {
    // Convert legacy provider format to LLMProvider
    const llmProvider: LLMProvider = provider === 'openai' ? 'openai' : 'anthropic'
    return optimizePrompt(originalPrompt, patchPrompts, { provider: llmProvider })
  }
}

export const promptOptimizer = new PromptOptimizer()