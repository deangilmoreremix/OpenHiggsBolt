import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

function makeRequest(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(url, init)
}

describe('POST /api/animate', () => {
  let originalFetch: typeof global.fetch

  beforeEach(() => {
    originalFetch = global.fetch
    vi.resetModules()
    vi.doMock('@clerk/nextjs/server', () => ({
      auth: async () => ({ userId: 'test_user' }),
    }))
    vi.doMock('@/src/lib/supabaseServer', () => ({
      getSupabaseAdmin: vi.fn(() => ({
        from: () => ({
          insert: () => ({
            select: () => ({
              single: () =>
                Promise.resolve({
                  data: { id: 'anim-123', request_id: 'req-123' },
                  error: null,
                }),
            }),
          }),
          update: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        }),
      })),
    }))
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        async json() {
          return { request_id: 'mu-req-123', status: 'queued' }
        },
      }))
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    global.fetch = originalFetch
  })

  it('returns 400 without source_url', async () => {
    const req = makeRequest('http://localhost/api/animate', { method: 'POST', body: JSON.stringify({}) })
    const res = await (await import('@/app/api/animate/route')).POST(req)
    expect(res.status).toBe(400)
  })
})
