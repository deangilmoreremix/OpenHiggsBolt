import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

function makeRequest(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(url, init)
}

describe('GET /api/brands', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.doMock('@/src/lib/supabaseServer', () => ({
      getSupabaseAdmin: vi.fn(() => ({
        from: () => ({
          select: () => ({
            order: () => ({
              range: () =>
                Promise.resolve({
                  data: [],
                  count: 0,
                  error: null,
                }),
            }),
          }),
        }),
      })),
    }))
  })

  it('returns empty list when no brands exist', async () => {
    const { GET } = await import('@/app/api/brands/route')
    const req = makeRequest('http://localhost/api/brands')
    const res = await GET(req)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.data).toEqual([])
    expect(data.pagination.total).toBe(0)
  })
})

describe('POST /api/brands', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.doMock('@/src/lib/supabaseServer', () => ({
      getSupabaseAdmin: vi.fn(() => ({
        from: () => ({
          insert: () => ({
            select: () => ({
              single: () =>
                Promise.resolve({
                  data: {
                    id: 'br_123',
                    url: 'https://example.com',
                    brand_name: 'https://example.com',
                    industry: 'General',
                    primary_colors: null,
                  },
                  error: null,
                }),
            }),
          }),
        }),
      })),
    }))
  })

  it('creates a brand and returns it', async () => {
    const { POST } = await import('@/app/api/brands/route')
    const req = makeRequest('http://localhost/api/brands', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com' }),
    })
    const res = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.url).toBe('https://example.com')
  })
})
