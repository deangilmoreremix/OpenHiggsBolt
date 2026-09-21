import { beforeEach, describe, expect, it, vi } from 'vitest'

const callOpenAIChat = vi.fn()

vi.mock('@/shared/api/openai', () => ({
  callOpenAIChat,
}))

import { personalizePrompt } from '../promptPersonalizer'
import { EMPTY_ASSET_LIBRARY, EMPTY_CLIENT } from '../types'

describe('SmartVideo GO Vision prompt personalization', () => {
  beforeEach(() => {
    callOpenAIChat.mockReset()
    callOpenAIChat.mockResolvedValue('personalized result')
  })

  it('passes Vision asset intelligence and Video Ready status into the generation prompt', async () => {
    const product = {
      id: 'product-1',
      role: 'product_reference' as const,
      name: 'roofing-product.png',
      url: 'https://example.com/product.png',
      uploadedUrl: 'https://example.com/product.png',
      isPrimary: false,
      createdAt: new Date().toISOString(),
      uploadStatus: 'ready' as const,
      videoReady: true,
      sourceCategory: 'product' as const,
      visionAnalysis: {
        category: 'product' as const,
        confidence: 97,
        qualityScore: 90,
        relevanceScore: 96,
        targetRole: 'Product Overlay',
        preserve: ['packaging', 'logo', 'label text'],
        issues: ['busy background'],
        recommendedOperations: ['product_isolate'],
        transparencyRecommended: true,
        precisionRecommended: true,
        textDetected: true,
        duplicateLikely: false,
        summary: 'Primary roofing product package.',
        analyzedAt: new Date().toISOString(),
      },
    }

    await personalizePrompt({
      originalPrompt: 'Create a strong product ad.',
      client: {
        ...EMPTY_CLIENT,
        businessName: 'Acme Roofing',
        industry: 'Roofing',
      },
      assets: {
        ...EMPTY_ASSET_LIBRARY,
        products: [product],
      },
      outputType: 'video',
    })

    expect(callOpenAIChat).toHaveBeenCalledTimes(1)
    const messages = callOpenAIChat.mock.calls[0][0]
    const system = messages[0].content
    const user = messages[1].content

    expect(system).toContain('SmartVideo GO')
    expect(system).toContain('Vision asset intelligence')
    expect(user).toContain('SMARTVIDEO GO VISION ASSET INTELLIGENCE')
    expect(user).toContain('Primary roofing product package.')
    expect(user).toContain('target role: Product Overlay')
    expect(user).toContain('protect: packaging, logo, label text')
    expect(user).toContain('status: video ready')
  })
})
