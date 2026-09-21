// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  analyzePersonalizationImages,
  responsesSmartEdit,
  validatePersonalizationImageEdit,
} from '../image-editor/responsesVisionApi'

describe('SmartVideo GO Responses/Vision client', () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('requests structured Vision analysis for personalization images', async () => {
    const fetchMock = vi.fn(async (_url: string, options: any) => {
      const body = JSON.parse(options.body)
      expect(body.mode).toBe('analyze')
      expect(body.images[0].categoryHint).toBe('logo')
      return {
        ok: true,
        json: async () => ({
          analyses: [{
            category: 'logo',
            confidence: 99,
            qualityScore: 90,
            relevanceScore: 98,
            targetRole: 'Logo Overlay',
            preserve: ['logo geometry'],
            issues: [],
            recommendedOperations: ['logo_cleanup'],
            transparencyRecommended: true,
            precisionRecommended: true,
            textDetected: true,
            duplicateLikely: false,
            summary: 'Logo asset',
            analyzedAt: new Date().toISOString(),
          }],
        }),
      } as any
    })
    globalThis.fetch = fetchMock as any

    const result = await analyzePersonalizationImages({
      images: [{ id: 'logo-1', imageUrl: 'data:image/png;base64,AA==', categoryHint: 'logo' }],
    })

    expect(fetchMock).toHaveBeenCalledWith('/api/personalization/image-analyze', expect.any(Object))
    expect(result[0].category).toBe('logo')
    expect(result[0].precisionRecommended).toBe(true)
  })

  it('continues conversational image edits through previous_response_id', async () => {
    const fetchMock = vi.fn(async (_url: string, options: any) => {
      const body = JSON.parse(options.body)
      expect(body.previousResponseId).toBe('resp_123')
      expect(body.prompt).toBe('Make the lighting warmer')
      return {
        ok: true,
        json: async () => ({
          imageDataUrl: 'data:image/png;base64,AA==',
          responseId: 'resp_456',
          imageGenerationCallId: 'ig_1',
          revisedPrompt: 'Warm the lighting while preserving the subject.',
          model: 'gpt-image-2.5-sunburst',
        }),
      } as any
    })
    globalThis.fetch = fetchMock as any

    const result = await responsesSmartEdit({
      prompt: 'Make the lighting warmer',
      previousResponseId: 'resp_123',
      imageModel: 'gpt-image-2.5-sunburst',
    })

    expect(result.responseId).toBe('resp_456')
    expect(result.revisedPrompt).toContain('preserving')
  })

  it('returns Vision QA validation', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        validation: {
          passed: true,
          confidence: 97,
          issues: [],
          preserved: ['identity'],
          changed: ['background'],
          summary: 'Edit passed visual QA.',
          analyzedAt: new Date().toISOString(),
        },
      }),
    })) as any

    const validation = await validatePersonalizationImageEdit({
      originalImageUrl: 'data:image/png;base64,AA==',
      editedImageUrl: 'data:image/png;base64,BB==',
      preserve: ['identity'],
      intendedOperation: 'remove_background',
    })

    expect(validation.passed).toBe(true)
    expect(validation.preserved).toContain('identity')
  })
})
