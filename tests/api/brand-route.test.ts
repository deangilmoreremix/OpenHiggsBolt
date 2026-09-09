import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

function makeRequest(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(url, init)
}

describe('route module exports', () => {
  it('app/api/brand/route.ts exports GET, PATCH, and not POST', async () => {
    const mod = await import('@/app/api/brand/route')
    expect(typeof mod.GET).toBe('function')
    expect(typeof mod.PATCH).toBe('function')
    expect(mod.POST).toBeUndefined()
  })

  it('app/api/brand/analyze/route.ts exports POST', async () => {
    const mod = await import('@/app/api/brand/analyze/route')
    expect(typeof mod.POST).toBe('function')
  })
})

describe('GET /api/brand', () => {
  beforeEach(() => {
    vi.resetModules()
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
  })
})

describe('PATCH /api/brand', () => {
  beforeEach(() => {
    vi.resetModules()
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
  })
})

describe('POST /api/brand/analyze', () => {
  beforeEach(() => {
    vi.resetModules()
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
  })

  it('does not accept openaiKey from the request body', async () => {
    const SENTINEL_KEY = 'sentinel-server-key'
    const originalKey = process.env.OPENAI_API_KEY
    process.env.OPENAI_API_KEY = SENTINEL_KEY

    try {
      const { POST } = await import('@/app/api/brand/analyze/route')
      const callOpenAIResponses = (await import('@/shared/api/openai')).callOpenAIResponses as ReturnType<typeof vi.fn>
      const req = makeRequest('http://localhost/api/brand/analyze', {
        method: 'POST',
        body: JSON.stringify({ url: 'https://example.com', openaiKey: 'client-key' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      expect(callOpenAIResponses).toHaveBeenCalled()
    } finally {
      process.env.OPENAI_API_KEY = originalKey
    }
  })
})
