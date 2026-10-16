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

describe('POST /api/campaigns', () => {
  beforeEach(() => {
    vi.resetModules()
    mockEntitledUser()
  })

  it('returns 400 without brand_id or goal', async () => {
    const req = makeRequest('http://localhost/api/campaigns', { method: 'POST', body: JSON.stringify({}) })
    const res = await (await import('@/app/api/campaigns/route')).POST(req)
    expect(res.status).toBe(400)
  }, 30_000)

  it('returns 401 when unauthenticated', async () => {
    mockUnauthenticatedUser()
    const req = makeRequest('http://localhost/api/campaigns', {
      method: 'POST',
      body: JSON.stringify({ brand_id: 'b1', goal: 'awareness' }),
    })
    const res = await (await import('@/app/api/campaigns/route')).POST(req)
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'UNAUTHENTICATED' })
  }, 30_000)

  it('returns 403 PAYMENT_REQUIRED when authenticated but unentitled', async () => {
    mockUnentitledUser()
    const req = makeRequest('http://localhost/api/campaigns', {
      method: 'POST',
      body: JSON.stringify({ brand_id: 'b1', goal: 'awareness' }),
    })
    const res = await (await import('@/app/api/campaigns/route')).POST(req)
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({
      error: 'PAYMENT_REQUIRED',
      entitlement: 'smartvideo_go',
      upgradeRequired: true,
    })
  }, 30_000)
})
