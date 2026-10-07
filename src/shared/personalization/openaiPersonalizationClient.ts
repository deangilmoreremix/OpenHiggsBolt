/**
 * OpenAI Personalization Client (stub for test resolution)
 *
 * This module provides the OpenAI client for personalization image generation.
 * The real implementation lives elsewhere in the codebase; this stub exists
 * solely to satisfy the import in generationRouter.ts during testing.
 */

export interface OpenAIImageResult {
  url: string
  revisedPrompt?: string
}

export function createPersonalizationOpenAIClient(_apiKey: string) {
  return {
    async generateImage(_params: Record<string, unknown>): Promise<OpenAIImageResult> {
      throw new Error('OpenAI personalization client not configured')
    },
    async editImage(_params: Record<string, unknown>): Promise<OpenAIImageResult> {
      throw new Error('OpenAI personalization client not configured')
    },
  }
}
