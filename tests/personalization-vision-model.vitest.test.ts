import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('POST /api/personalization/image-analyze startup model validation', () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
    vi.clearAllMocks()
    vi.resetModules()
    delete process.env.SMARTVIDEO_VISION_MODEL
    for (const key of Object.keys(require.cache)) {
      if (key.includes('image-analyze/route')) {
        delete require.cache[key]
      }
    }
  })

  it('rejects startup when SMARTVIDEO_VISION_MODEL is not in the allowed set', async () => {
    process.env.SMARTVIDEO_VISION_MODEL = 'gpt-invalid-model'
    vi.resetModules()
    vi.doMock('@clerk/nextjs/server', () => ({
      auth: vi.fn(async () => ({ userId: 'user-123' })),
    }))
    vi.doMock('@/access/apiRequireEntitlement', () => ({
      requireApiEntitlement: vi.fn(async () => ({ allowed: true, status: 200 })),
      entitlementForbiddenResponse: vi.fn(() => new Response(JSON.stringify({ error: 'FORBIDDEN' }), { status: 403 })),
    }))
    vi.doMock('@/access/entitlements', () => ({
      ENTITLEMENTS: { SMARTVIDEO_GO: 'smartvideo_go' },
    }))
    vi.doMock('@/src/lib/openaiKeyServer', () => ({
      getOpenAiKeyForUser: vi.fn(async () => 'sk-test'),
    }))
    vi.doMock('@/lib/rateLimit', () => ({
      rateLimit: vi.fn(() => ({ allowed: true, remaining: 10, retryAfterMs: 0 })),
      rateLimit429: vi.fn(() => new Response(JSON.stringify({ error: 'rate limited' }), { status: 429 })),
    }))

    try {
      await import('@/app/api/personalization/image-analyze/route')
    } catch (error) {
      expect((error as Error).message).toContain('Invalid SMARTVIDEO_VISION_MODEL')
      expect((error as Error).message).toContain('gpt-invalid-model')
      return
    }
    throw new Error('Expected module import to throw for invalid vision model')
  })

  it('loads successfully with the default vision model', async () => {
    delete process.env.SMARTVIDEO_VISION_MODEL
    vi.resetModules()
    vi.doMock('@clerk/nextjs/server', () => ({
      auth: vi.fn(async () => ({ userId: 'user-123' })),
    }))
    vi.doMock('@/access/apiRequireEntitlement', () => ({
      requireApiEntitlement: vi.fn(async () => ({ allowed: true, status: 200 })),
      entitlementForbiddenResponse: vi.fn(() => new Response(JSON.stringify({ error: 'FORBIDDEN' }), { status: 403 })),
    }))
    vi.doMock('@/access/entitlements', () => ({
      ENTITLEMENTS: { SMARTVIDEO_GO: 'smartvideo_go' },
    }))
    vi.doMock('@/src/lib/openaiKeyServer', () => ({
      getOpenAiKeyForUser: vi.fn(async () => 'sk-test'),
    }))
    vi.doMock('@/lib/rateLimit', () => ({
      rateLimit: vi.fn(() => ({ allowed: true, remaining: 10, retryAfterMs: 0 })),
      rateLimit429: vi.fn(() => new Response(JSON.stringify({ error: 'rate limited' }), { status: 429 })),
    }))

    const { POST } = await import('@/app/api/personalization/image-analyze/route')
    expect(POST).toBeDefined()
  })
})
