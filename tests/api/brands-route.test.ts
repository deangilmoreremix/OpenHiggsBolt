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

describe('GET /api/brands', () => {
  beforeEach(() => {
    vi.resetModules()
    mockEntitledUser()
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
  }, 30_000)
})

describe('POST /api/brands', () => {
  beforeEach(() => {
    vi.resetModules()
    mockEntitledUser()
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
  }, 30_000)

  it('returns 401 when unauthenticated', async () => {
    mockUnauthenticatedUser()
    const { POST } = await import('@/app/api/brands/route')
    const req = makeRequest('http://localhost/api/brands', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'UNAUTHENTICATED' })
  }, 30_000)

  it('returns 403 PAYMENT_REQUIRED when authenticated but unentitled', async () => {
    mockUnentitledUser()
    const { POST } = await import('@/app/api/brands/route')
    const req = makeRequest('http://localhost/api/brands', {
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
})
