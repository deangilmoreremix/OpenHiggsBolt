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

const BYOK_KEY = 'byok-muapi-key'

describe('GET /api/v1/get_upload_url', () => {
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
          return { url: 'https://bucket.s3.amazonaws.com/upload', fields: {} }
        },
        async text() {
          return JSON.stringify({ url: 'https://bucket.s3.amazonaws.com/upload', fields: {} })
        },
      }))
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    global.fetch = originalFetch
  })

  it('returns 401 UNAUTHENTICATED when there is no Clerk session', async () => {
    mockUnauthenticatedUser()
    const res = await (await import('@/app/api/v1/get_upload_url/route')).GET(
      makeRequest('http://localhost/api/v1/get_upload_url', { headers: { 'x-api-key': BYOK_KEY } })
    )
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'UNAUTHENTICATED' })
    expect(vi.mocked(global.fetch)).not.toHaveBeenCalled()
  }, 30_000)

  it('returns 403 PAYMENT_REQUIRED when authenticated but unentitled', async () => {
    mockUnentitledUser()
    const res = await (await import('@/app/api/v1/get_upload_url/route')).GET(
      makeRequest('http://localhost/api/v1/get_upload_url', { headers: { 'x-api-key': BYOK_KEY } })
    )
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({
      error: 'PAYMENT_REQUIRED',
      entitlement: 'smartvideo_go',
      upgradeRequired: true,
    })
    expect(vi.mocked(global.fetch)).not.toHaveBeenCalled()
  }, 30_000)

  it('still enforces the BYOK key check after the guard', async () => {
    const res = await (await import('@/app/api/v1/get_upload_url/route')).GET(
      makeRequest('http://localhost/api/v1/get_upload_url')
    )
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized: Missing API key' })
    expect(vi.mocked(global.fetch)).not.toHaveBeenCalled()
  }, 30_000)

  it('proxies to MuAPI when entitled and a BYOK key is present', async () => {
    const res = await (await import('@/app/api/v1/get_upload_url/route')).GET(
      makeRequest('http://localhost/api/v1/get_upload_url', {
        headers: { authorization: `Bearer ${BYOK_KEY}` },
      })
    )
    expect(res.status).toBe(200)
    expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(1)
    const calledUrl = vi.mocked(global.fetch).mock.calls[0][0] as string
    expect(calledUrl).toContain('https://api.muapi.ai/app/get_file_upload_url')
  }, 30_000)
})

describe.each([
  ['/api/upload-binary', '@/app/api/upload-binary/route'],
  ['/api/v1/upload-binary', '@/app/api/v1/upload-binary/route'],
])('POST %s', (path, modulePath) => {
  beforeEach(() => {
    vi.resetModules()
    mockEntitledUser()
  })

  it('returns 401 UNAUTHENTICATED when there is no Clerk session', async () => {
    mockUnauthenticatedUser()
    const form = new FormData()
    form.append('key', 'file.png')
    form.append('x-proxy-target-url', 'https://bucket.s3.amazonaws.com/upload')
    const res = await (await import(modulePath)).POST(
      makeRequest(`http://localhost${path}`, {
        method: 'POST',
        headers: { authorization: `Bearer ${BYOK_KEY}` },
        body: form,
      })
    )
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'UNAUTHENTICATED' })
  }, 30_000)

  it('returns 403 PAYMENT_REQUIRED when authenticated but unentitled', async () => {
    mockUnentitledUser()
    const form = new FormData()
    form.append('key', 'file.png')
    form.append('x-proxy-target-url', 'https://bucket.s3.amazonaws.com/upload')
    const res = await (await import(modulePath)).POST(
      makeRequest(`http://localhost${path}`, {
        method: 'POST',
        headers: { authorization: `Bearer ${BYOK_KEY}` },
        body: form,
      })
    )
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({
      error: 'PAYMENT_REQUIRED',
      entitlement: 'smartvideo_go',
      upgradeRequired: true,
    })
  }, 30_000)

  it('still enforces the BYOK key check after the guard', async () => {
    const form = new FormData()
    form.append('key', 'file.png')
    const res = await (await import(modulePath)).POST(
      makeRequest(`http://localhost${path}`, { method: 'POST', body: form })
    )
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized: Missing API key' })
  }, 30_000)

  it('passes the guard and the BYOK check, then fails on the missing proxy target', async () => {
    const form = new FormData()
    form.append('file', new File(['test'], 'file.png', { type: 'image/png' }))
    const res = await (await import(modulePath)).POST(
      makeRequest(`http://localhost${path}`, {
        method: 'POST',
        headers: { 'x-api-key': BYOK_KEY },
        body: form,
      })
    )
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Missing proxy target URL' })
  }, 30_000)
})
