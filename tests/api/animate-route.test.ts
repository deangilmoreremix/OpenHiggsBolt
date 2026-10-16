import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
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

describe('POST /api/animate', () => {
  let originalFetch: typeof global.fetch

  beforeEach(() => {
    originalFetch = global.fetch
    vi.resetModules()
    mockEntitledUser()
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
  }, 30_000)

  it('returns 401 when unauthenticated', async () => {
    mockUnauthenticatedUser()
    const req = makeRequest('http://localhost/api/animate', {
      method: 'POST',
      body: JSON.stringify({ source_url: 'https://example.com/img.png' }),
    })
    const res = await (await import('@/app/api/animate/route')).POST(req)
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'UNAUTHENTICATED' })
    expect(vi.mocked(global.fetch)).not.toHaveBeenCalled()
  }, 30_000)

  it('returns 403 PAYMENT_REQUIRED when authenticated but unentitled', async () => {
    mockUnentitledUser()
    const req = makeRequest('http://localhost/api/animate', {
      method: 'POST',
      body: JSON.stringify({ source_url: 'https://example.com/img.png' }),
    })
    const res = await (await import('@/app/api/animate/route')).POST(req)
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({
      error: 'PAYMENT_REQUIRED',
      entitlement: 'smartvideo_go',
      upgradeRequired: true,
    })
    expect(vi.mocked(global.fetch)).not.toHaveBeenCalled()
  }, 30_000)
})

describe('GET /api/animate', () => {
  let originalFetch: typeof global.fetch

  beforeEach(() => {
    originalFetch = global.fetch
    vi.resetModules()
    mockEntitledUser()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        async json() {
          return { status: 'completed', video_url: 'https://example.com/out.mp4' }
        },
      }))
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    global.fetch = originalFetch
  })

  it('returns 401 when unauthenticated', async () => {
    mockUnauthenticatedUser()
    const req = makeRequest('http://localhost/api/animate?request_id=req-123')
    const res = await (await import('@/app/api/animate/route')).GET(req)
    expect(res.status).toBe(401)
    expect(vi.mocked(global.fetch)).not.toHaveBeenCalled()
  }, 30_000)

  it('returns 403 PAYMENT_REQUIRED when authenticated but unentitled', async () => {
    mockUnentitledUser()
    const req = makeRequest('http://localhost/api/animate?request_id=req-123')
    const res = await (await import('@/app/api/animate/route')).GET(req)
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({
      error: 'PAYMENT_REQUIRED',
      entitlement: 'smartvideo_go',
      upgradeRequired: true,
    })
    expect(vi.mocked(global.fetch)).not.toHaveBeenCalled()
  }, 30_000)
})
