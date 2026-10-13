/**
 * Entitlement regression tests for the `/api/v1/*` catch-all proxy.
 *
 * Covers the gating that IS merged on this branch (verified against
 * `app/api/v1/[...slug]/route.ts`):
 *   - generation GETs (`/text-to-video`, `/image-generation`,
 *     `/predictions/{id}/result`, …) require the SMARTVIDEO_GO entitlement
 *     even when a client-supplied MuAPI key is present — an anonymous caller
 *     can no longer relay through the proxy with just a key;
 *   - every POST requires the entitlement (minus the dev bypass);
 *   - the gate runs before any upstream fetch and before key resolution;
 *   - an entitled caller still proxies normally (no regression);
 *   - the dev-only `__e2e_auth_bypass` escape hatch still bypasses the gate,
 *     and only for the exact value "1".
 *
 * KNOWN GAP (documented, NOT asserted here): on this branch the GET gate is
 * still scoped to the five generation patterns, so non-generation GETs such
 * as `/api/v1/models` remain an open relay that needs nothing but a
 * client-supplied MuAPI key. PR #49 (`e9c88ac08`) carries the same
 * generation-only scope, so closing that hole needs a change to
 * `app/api/v1/[...slug]/route.ts` itself, which is outside SEC-INT's file
 * ownership. It is reported as STILL MISSING in the integration report.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

vi.mock('@/access/resolveAccess', () => ({
  resolveSmartVideoAccessForUser: vi.fn(),
}))

// The proxy key resolver: mocked so "a key was supplied" is provable without a
// real header, and so a leak would surface as a proxied 200 instead of 401.
vi.mock('@/app/api/v1/lib/auth', () => ({
  getMuApiKeyFromRequest: vi.fn(async () => 'client-supplied-key'),
}))

import { GET, POST } from '@/app/api/v1/[...slug]/route'
import { getMuApiKeyFromRequest } from '@/app/api/v1/lib/auth'
import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { resolveSmartVideoAccessForUser } from '@/access/resolveAccess'

const ENTITLED_ACCESS = {
  clerkUserId: 'user-123',
  email: 'user@example.com',
  entitlements: { smartvideo_go: true },
  status: 'active',
  source: 'manual',
  hasSmartVideoGo: true,
} as any

const UNPAID_ACCESS = {
  clerkUserId: 'user-123',
  email: 'user@example.com',
  entitlements: { smartvideo_go: false },
  status: 'inactive',
  source: 'manual',
  hasSmartVideoGo: false,
} as any

function upstreamResponse() {
  return {
    ok: true,
    status: 200,
    headers: new Headers({ 'content-type': 'application/json' }),
    async json() {
      return { items: [] }
    },
    async text() {
      return JSON.stringify({ items: [] })
    },
  }
}

function getRequest(slug: string[], options: { devBypass?: boolean } = {}) {
  const headers: Record<string, string> = { 'x-api-key': 'client-supplied-key' }
  if (options.devBypass) headers.cookie = '__e2e_auth_bypass=1'
  return new NextRequest(new URL(`http://localhost/api/v1/${slug.join('/')}`), { headers })
}

describe('GET /api/v1/... entitlement gate', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    fetchMock = vi.fn(async () => upstreamResponse())
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // -------------------------------------------------------------------------
  // Generation GETs — the merged gate: anonymous callers are rejected even
  // with a valid client key.
  // -------------------------------------------------------------------------

  it.each([
    [['text-to-video'], '/api/v1/text-to-video'],
    [['image-generation'], '/api/v1/image-generation'],
    [['predictions', 'job-123', 'result'], '/api/v1/predictions/job-123/result'],
  ])('rejects anonymous generation GET %s with 401 despite a valid client key', async (slug) => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as any)
    vi.mocked(resolveSmartVideoAccessForUser).mockResolvedValue(null)
    vi.mocked(getMuApiKeyFromRequest).mockResolvedValue('client-supplied-key')

    const res = await GET(getRequest(slug), { params: { slug } })

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'UNAUTHENTICATED' })
    // Nothing may reach the upstream relay while the caller is unauthorized.
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects an anonymous generation GET when the client key is a bearer token', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: undefined } as any)
    vi.mocked(resolveSmartVideoAccessForUser).mockResolvedValue(null)
    vi.mocked(getMuApiKeyFromRequest).mockResolvedValue('client-supplied-key')

    const req = new NextRequest(new URL('http://localhost/api/v1/text-to-video'), {
      headers: { authorization: 'Bearer client-supplied-key' },
    })
    const res = await GET(req, { params: { slug: ['text-to-video'] } })

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'UNAUTHENTICATED' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  // -------------------------------------------------------------------------
  // Authenticated but unentitled — 403, and still no upstream call
  // -------------------------------------------------------------------------

  it('rejects an authenticated caller without SMARTVIDEO_GO with 403', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any)
    vi.mocked(resolveSmartVideoAccessForUser).mockResolvedValue(UNPAID_ACCESS)
    vi.mocked(getMuApiKeyFromRequest).mockResolvedValue('client-supplied-key')

    const res = await GET(getRequest(['text-to-video']), { params: { slug: ['text-to-video'] } })

    expect(res.status).toBe(403)
    expect(await res.json()).toMatchObject({ upgradeRequired: true, entitlement: 'smartvideo_go' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  // -------------------------------------------------------------------------
  // Entitled callers — no regression
  // -------------------------------------------------------------------------

  it('still proxies generation GETs for an entitled caller', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any)
    vi.mocked(resolveSmartVideoAccessForUser).mockResolvedValue(ENTITLED_ACCESS)
    vi.mocked(getMuApiKeyFromRequest).mockResolvedValue('client-supplied-key')

    const res = await GET(getRequest(['predictions', 'job-123', 'result']), {
      params: { slug: ['predictions', 'job-123', 'result'] },
    })

    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0] as string).toContain('/api/v1/predictions/job-123/result')
    expect(fetchMock.mock.calls[0][1]?.headers).toHaveProperty('x-api-key', 'client-supplied-key')
    expect(await res.json()).toEqual({ items: [] })
  })

  it('returns 401 when the MuAPI key is missing for an entitled caller', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any)
    vi.mocked(resolveSmartVideoAccessForUser).mockResolvedValue(ENTITLED_ACCESS)
    vi.mocked(getMuApiKeyFromRequest).mockRejectedValue(
      new Response('Unauthorized: Missing API key', { status: 401 })
    )

    const res = await GET(getRequest(['text-to-video']), { params: { slug: ['text-to-video'] } })

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized: Missing API key' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  // -------------------------------------------------------------------------
  // Dev escape hatch — must keep working exactly as before
  // -------------------------------------------------------------------------

  it('honors the __e2e_auth_bypass dev escape hatch on generation GETs', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as any)
    vi.mocked(resolveSmartVideoAccessForUser).mockResolvedValue(null)
    vi.mocked(getMuApiKeyFromRequest).mockResolvedValue('client-supplied-key')

    const res = await GET(getRequest(['text-to-video'], { devBypass: true }), {
      params: { slug: ['text-to-video'] },
    })

    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0] as string).toContain('/api/v1/text-to-video')
  })

  it('does not honor the dev bypass cookie value other than "1"', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as any)
    vi.mocked(resolveSmartVideoAccessForUser).mockResolvedValue(null)
    vi.mocked(getMuApiKeyFromRequest).mockResolvedValue('client-supplied-key')

    const req = new NextRequest(new URL('http://localhost/api/v1/text-to-video'), {
      headers: { 'x-api-key': 'client-supplied-key', cookie: '__e2e_auth_bypass=0' },
    })
    const res = await GET(req, { params: { slug: ['text-to-video'] } })

    expect(res.status).toBe(401)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('POST /api/v1/... entitlement gate', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    fetchMock = vi.fn(async () => upstreamResponse())
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('rejects an anonymous POST with 401 despite a valid client key', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as any)
    vi.mocked(resolveSmartVideoAccessForUser).mockResolvedValue(null)
    vi.mocked(getMuApiKeyFromRequest).mockResolvedValue('client-supplied-key')

    const req = new NextRequest(new URL('http://localhost/api/v1/text-to-video'), {
      method: 'POST',
      headers: { 'x-api-key': 'client-supplied-key', 'content-type': 'application/json' },
      body: JSON.stringify({ prompt: 'x' }),
    })
    const res = await POST(req, { params: { slug: ['text-to-video'] } })

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'UNAUTHENTICATED' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('still proxies POSTs for an entitled caller', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any)
    vi.mocked(resolveSmartVideoAccessForUser).mockResolvedValue(ENTITLED_ACCESS)
    vi.mocked(getMuApiKeyFromRequest).mockResolvedValue('client-supplied-key')

    const req = new NextRequest(new URL('http://localhost/api/v1/text-to-video'), {
      method: 'POST',
      headers: { 'x-api-key': 'client-supplied-key', 'content-type': 'application/json' },
      body: JSON.stringify({ prompt: 'x' }),
    })
    const res = await POST(req, { params: { slug: ['text-to-video'] } })

    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0] as string).toContain('/api/v1/text-to-video')
    expect(await res.json()).toEqual({ items: [] })
  })
})
