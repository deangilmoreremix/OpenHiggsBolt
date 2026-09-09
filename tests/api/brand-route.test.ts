import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, PATCH, POST } from '@/app/api/brand/route'

function makeRequest(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(url, init)
}

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

    vi.doMock('@/lib/brandAnalyzer', () => ({
      analyzeBrand: vi.fn().mockResolvedValue({ id: 'brand-1', brand_name: 'Analyzed' }),
    }))
  })

  it('returns 400 without url', async () => {
    const req = makeRequest('http://localhost/api/brand/analyze', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
