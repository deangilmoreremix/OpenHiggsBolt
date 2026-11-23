import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

function makeRequest(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(url, init)
}

function mockEntitledUser() {
  vi.doMock('@clerk/nextjs/server', () => ({
    auth: async () => ({ userId: 'test_user' }),
  }))
  vi.doMock('@/access/resolveAccess', () => ({
    resolveSmartVideoAccessForUser: vi.fn(async () => ({
      clerkUserId: 'test_user',
      email: 'test@example.com',
      entitlements: { smartvideo_go: true },
      status: 'active',
      source: 'manual',
      hasSmartVideoGo: true,
    })),
  }))
}

function mockUnauthenticatedUser() {
  vi.doMock('@clerk/nextjs/server', () => ({
    auth: async () => ({ userId: null }),
  }))
  vi.doMock('@/access/resolveAccess', () => ({
    resolveSmartVideoAccessForUser: vi.fn(async () => null),
  }))
}

function mockUnentitledUser() {
  vi.doMock('@clerk/nextjs/server', () => ({
    auth: async () => ({ userId: 'test_user' }),
  }))
  vi.doMock('@/access/resolveAccess', () => ({
    resolveSmartVideoAccessForUser: vi.fn(async () => ({
      clerkUserId: 'test_user',
      email: 'test@example.com',
      entitlements: { smartvideo_go: false },
      status: 'inactive',
      source: 'manual',
      hasSmartVideoGo: false,
    })),
  }))
}

describe('route module exports', () => {
  it('app/api/brand/route.ts exports GET, PATCH, and not POST', async () => {
    const mod = await import('@/app/api/brand/route')
    expect(typeof mod.GET).toBe('function')
    expect(typeof mod.PATCH).toBe('function')
    expect(mod.POST).toBeUndefined()
  }, 30_000)

  it('app/api/brand/analyze/route.ts exports POST', async () => {
    const mod = await import('@/app/api/brand/analyze/route')
    expect(typeof mod.POST).toBe('function')
  }, 30_000)
})

describe('GET /api/brand', () => {
  beforeEach(() => {
    vi.resetModules()
    mockEntitledUser()
    vi.doMock('@/src/lib/supabaseServer', () => ({
      getSupabaseAdmin: vi.fn(() => ({
        from: () => ({
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: { id: 'brand-1', brand_name: 'Test' },
                  error: null,
                }),
            }),
          }),
        }),
      })),
    }))
  })

  it('returns 400 without id', async () => {
    const { GET } = await import('@/app/api/brand/route')
    const req = makeRequest('http://localhost/api/brand')
    const res = await GET(req)
    expect(res.status).toBe(400)
  }, 30_000)
})

describe('PATCH /api/brand', () => {
  beforeEach(() => {
    vi.resetModules()
    mockEntitledUser()
    vi.doMock('@/src/lib/supabaseServer', () => ({
      getSupabaseAdmin: vi.fn(() => ({
        from: () => ({
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: { id: 'brand-1', brand_name: 'Test' },
                  error: null,
                }),
            }),
          }),
          update: () => ({
            eq: () => ({
              select: () => ({
                single: () =>
                  Promise.resolve({
                    data: { id: 'brand-1', brand_name: 'Updated' },
                    error: null,
                  }),
              }),
            }),
          }),
        }),
      })),
    }))
  })

  it('returns 400 without id', async () => {
    const { PATCH } = await import('@/app/api/brand/route')
    const req = makeRequest('http://localhost/api/brand', {
      method: 'PATCH',
      body: JSON.stringify({ brand_name: 'New' }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(400)
  }, 30_000)

  it('returns 401 when unauthenticated', async () => {
    mockUnauthenticatedUser()
    const { PATCH } = await import('@/app/api/brand/route')
    const req = makeRequest('http://localhost/api/brand?id=brand-1', {
      method: 'PATCH',
      body: JSON.stringify({ brand_name: 'New' }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'UNAUTHENTICATED' })
  }, 30_000)

  it('returns 403 PAYMENT_REQUIRED when authenticated but unentitled', async () => {
    mockUnentitledUser()
    const { PATCH } = await import('@/app/api/brand/route')
    const req = makeRequest('http://localhost/api/brand?id=brand-1', {
      method: 'PATCH',
      body: JSON.stringify({ brand_name: 'New' }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({
      error: 'PAYMENT_REQUIRED',
      entitlement: 'smartvideo_go',
      upgradeRequired: true,
    })
  }, 30_000)
})

describe('POST /api/brand/analyze', () => {
  beforeEach(() => {
    vi.resetModules()
    mockEntitledUser()
    // BYOK: the analyze flow resolves the authenticated user's own OpenAI key
    // from the server-side store instead of any env key.
    vi.doMock('@/src/lib/openaiKeyServer', () => ({
      getOpenAiKeyForUser: vi.fn(async () => 'sk-user-openai-key'),
    }))
    vi.doMock('@/src/lib/supabaseServer', () => ({
      getSupabaseAdmin: vi.fn(() => ({
        from: () => ({
          insert: () => ({
            select: () => ({
              single: () =>
                Promise.resolve({
                  data: { id: 'brand-1', brand_name: 'Analyzed' },
                  error: null,
                }),
            }),
          }),
        }),
        storage: {
          from: () => ({
            upload: () => ({ error: null }),
            getPublicUrl: () => ({ data: { publicUrl: 'https://example.com/img.png' } }),
          }),
        },
      })),
    }))

    vi.doMock('@/lib/scraper', () => ({
      scrapeUrl: vi.fn().mockResolvedValue({
        html: '<html></html>',
        title: 'Test',
        description: 'Desc',
        ogImage: '',
        themeColor: '',
        colors: ['#111111'],
        fonts: ['Arial'],
        bodyText: 'body',
      }),
    }))

    vi.doMock('@/shared/api/openai', () => ({
      callOpenAIResponses: vi.fn().mockResolvedValue('{"brand_name":"Analyzed"}'),
    }))
  })

  it('returns 400 without url', async () => {
    const { POST } = await import('@/app/api/brand/analyze/route')
    const req = makeRequest('http://localhost/api/brand/analyze', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  }, 30_000)

  it('returns 401 when unauthenticated', async () => {
    mockUnauthenticatedUser()
    const { POST } = await import('@/app/api/brand/analyze/route')
    const req = makeRequest('http://localhost/api/brand/analyze', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'UNAUTHENTICATED' })
  }, 30_000)

  it('returns 403 PAYMENT_REQUIRED when authenticated but unentitled', async () => {
    mockUnentitledUser()
    const { POST } = await import('@/app/api/brand/analyze/route')
    const req = makeRequest('http://localhost/api/brand/analyze', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({
      error: 'PAYMENT_REQUIRED',
      entitlement: 'smartvideo_go',
      upgradeRequired: true,
    })
  }, 30_000)

  it('does not accept openaiKey from the request body', async () => {
    const SENTINEL_KEY = 'sentinel-server-key'
    const originalKey = process.env.OPENAI_API_KEY
    process.env.OPENAI_API_KEY = SENTINEL_KEY

    try {
      const { POST } = await import('@/app/api/brand/analyze/route')
      const callOpenAIResponses = (await import('@/shared/api/openai')).callOpenAIResponses as ReturnType<typeof vi.fn>

      let capturedInput: any[] | undefined
      vi.mocked(callOpenAIResponses).mockImplementation(async (input: any[]) => {
        capturedInput = input
        return '{"brand_name":"Analyzed"}'
      })

      const req = makeRequest('http://localhost/api/brand/analyze', {
        method: 'POST',
        body: JSON.stringify({ url: 'https://example.com', openaiKey: 'client-key' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      expect(callOpenAIResponses).toHaveBeenCalledTimes(1)
      expect(capturedInput).toBeDefined()
      expect(capturedInput).toEqual(expect.arrayContaining([
        expect.objectContaining({ role: 'system' }),
        expect.objectContaining({ role: 'user' }),
      ]))
      expect(JSON.stringify(capturedInput)).not.toContain('client-key')
    } finally {
      process.env.OPENAI_API_KEY = originalKey
    }
  }, 30_000)
})
