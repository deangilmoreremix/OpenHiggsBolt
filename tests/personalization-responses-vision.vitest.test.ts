import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

let authUserId: string | null = 'user-123'
let openAiKey: string | null = 'sk-test'

function installCommonMocks() {
  vi.doMock('@clerk/nextjs/server', () => ({
    auth: vi.fn(async () => ({ userId: authUserId })),
  }))
  vi.doMock('@/access/apiRequireEntitlement', () => ({
    requireApiEntitlement: vi.fn(async () => ({ allowed: true, status: 200 })),
    entitlementForbiddenResponse: vi.fn(() => new Response(JSON.stringify({ error: 'FORBIDDEN' }), { status: 403 })),
  }))
  vi.doMock('@/access/entitlements', () => ({
    ENTITLEMENTS: { SMARTVIDEO_GO: 'smartvideo_go' },
  }))
  vi.doMock('@/src/lib/openaiKeyServer', () => ({
    getOpenAiKeyForUser: vi.fn(async () => openAiKey),
  }))
  vi.doMock('@/lib/rateLimit', () => ({
    rateLimit: vi.fn(() => ({ allowed: true, remaining: 10, retryAfterMs: 0 })),
    rateLimit429: vi.fn(() => new Response(JSON.stringify({ error: 'rate limited' }), { status: 429 })),
  }))
}

beforeEach(() => {
  vi.resetModules()
  authUserId = 'user-123'
  openAiKey = 'sk-test'
  installCommonMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

describe('POST /api/personalization/image-analyze', () => {
  it('returns structured SmartVideo GO Vision analysis', async () => {
    const analysis = {
      id: 'asset-1',
      category: 'product',
      confidence: 96,
      qualityScore: 82,
      relevanceScore: 91,
      targetRole: 'Product Overlay',
      preserve: ['packaging', 'logo', 'label text'],
      issues: ['busy background'],
      recommendedOperations: ['product_isolate', 'enhance', 'not_real'],
      transparencyRecommended: true,
      precisionRecommended: true,
      textDetected: true,
      duplicateLikely: false,
      summary: 'Strong product asset that needs isolation.',
    }

    const fetchMock = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      const headers = init?.headers as Record<string, string>
      expect(headers.Authorization).toBe('Bearer sk-test')
      const body = JSON.parse(String(init?.body || '{}'))
      expect(body.model).toBeTruthy()
      expect(body.input?.[0]?.content?.some((item: any) => item.type === 'input_image')).toBe(true)
      return {
        ok: true,
        status: 200,
        async json() {
          return { id: 'resp_vision', output_text: JSON.stringify({ analyses: [analysis] }) }
        },
      } as Response
    })
    vi.spyOn(globalThis, 'fetch').mockImplementation(fetchMock)

    const { POST } = await import('@/app/api/personalization/image-analyze/route')
    const request = new NextRequest('http://localhost/api/personalization/image-analyze', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        mode: 'analyze',
        images: [{
          id: 'asset-1',
          imageUrl: 'data:image/png;base64,ZmFrZQ==',
          categoryHint: 'product',
        }],
        businessContext: { businessName: 'Acme Roofing', industry: 'Roofing' },
        targetVideoFormat: '9:16',
      }),
    })

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.analyses).toHaveLength(1)
    expect(payload.analyses[0].category).toBe('product')
    expect(payload.analyses[0].recommendedOperations).toEqual(['product_isolate', 'enhance'])
    expect(payload.analyses[0].analyzedAt).toBeTruthy()
  })

  it('compares original and edited assets for visual QA', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(vi.fn(async () => ({
      ok: true,
      status: 200,
      async json() {
        return {
          output_text: JSON.stringify({
            passed: true,
            confidence: 94,
            issues: [],
            preserved: ['logo', 'packaging'],
            changed: ['background'],
            summary: 'Requested background edit succeeded.',
          }),
        }
      },
    } as Response)))

    const { POST } = await import('@/app/api/personalization/image-analyze/route')
    const response = await POST(new NextRequest('http://localhost/api/personalization/image-analyze', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        mode: 'validate',
        originalImageUrl: 'data:image/png;base64,b3JpZw==',
        editedImageUrl: 'data:image/png;base64,ZWRpdA==',
        preserve: ['logo', 'packaging'],
        intendedOperation: 'remove_background',
      }),
    }))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.validation.passed).toBe(true)
    expect(payload.validation.changed).toContain('background')
  })
})

describe('POST /api/personalization/image-smart-edit', () => {
  it('uses Responses image_generation with GPT Image 2.5 and returns conversation metadata', async () => {
    const fetchMock = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body || '{}'))
      expect(body.tools?.[0]?.type).toBe('image_generation')
      expect(body.tools?.[0]?.model).toBe('gpt-image-2.5-sunburst')
      expect(body.tools?.[0]?.input_fidelity).toBe('high')
      return {
        ok: true,
        status: 200,
        async json() {
          return {
            id: 'resp_123',
            output: [{
              type: 'image_generation_call',
              id: 'ig_123',
              result: 'ZmFrZQ==',
              revised_prompt: 'Preserve the product and remove the background.',
            }],
            usage: { input_tokens: 10 },
          }
        },
      } as Response
    })
    vi.spyOn(globalThis, 'fetch').mockImplementation(fetchMock)

    const { POST } = await import('@/app/api/personalization/image-smart-edit/route')
    const response = await POST(new NextRequest('http://localhost/api/personalization/image-smart-edit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        imageUrl: 'data:image/png;base64,ZmFrZQ==',
        prompt: 'Remove the background.',
        imageModel: 'gpt-image-2.5-sunburst',
        action: 'edit',
        quality: 'high',
        background: 'transparent',
        inputFidelity: 'high',
        outputFormat: 'png',
        businessContext: {
          businessName: 'Acme',
          targetRole: 'Product Overlay',
          preserve: ['packaging', 'logo'],
        },
      }),
    }))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.imageDataUrl).toBe('data:image/png;base64,ZmFrZQ==')
    expect(payload.responseId).toBe('resp_123')
    expect(payload.imageGenerationCallId).toBe('ig_123')
    expect(payload.revisedPrompt).toBeTruthy()
  })

  it('accepts a previous response id for a conversational follow-up turn', async () => {
    const fetchMock = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body || '{}'))
      expect(body.previous_response_id).toBe('resp_previous')
      expect(typeof body.input).toBe('string')
      return {
        ok: true,
        status: 200,
        async json() {
          return {
            id: 'resp_next',
            output: [{ type: 'image_generation_call', id: 'ig_next', result: 'bmV4dA==' }],
          }
        },
      } as Response
    })
    vi.spyOn(globalThis, 'fetch').mockImplementation(fetchMock)

    const { POST } = await import('@/app/api/personalization/image-smart-edit/route')
    const response = await POST(new NextRequest('http://localhost/api/personalization/image-smart-edit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Now make the background slightly darker.',
        previousResponseId: 'resp_previous',
        imageModel: 'gpt-image-2.5-flare',
      }),
    }))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.responseId).toBe('resp_next')
  })
})
