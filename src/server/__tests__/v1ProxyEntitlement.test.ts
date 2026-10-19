/**
 * Regression tests for the `/api/v1/*` catch-all proxy.
 *
 * This route is now a pure BYOK (bring-your-own-key) proxy — it validates the
 * MuAPI key from the request but no longer checks Clerk auth or the
 * SMARTVIDEO_GO entitlement. Anyone with a valid client-supplied key may
 * relay through the proxy.
 *
 * Covered:
 * - an anonymous caller with a valid client key is proxied (no 401);
 * - a bearer-token client key is accepted;
 * - an authenticated caller without SMARTVIDEO_GO is still proxied (gate removed);
 * - a caller without any valid MuAPI key still gets 401;
 * - the proxy forwards upstream responses unchanged (no regression).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

vi.mock('@/app/api/v1/lib/auth', () => ({
  getMuApiKeyFromRequest: vi.fn(async () => 'client-supplied-key'),
}))

import { GET, POST } from '@/app/api/v1/[...slug]/route'
import { getMuApiKeyFromRequest } from '@/app/api/v1/lib/auth'
import { NextRequest } from 'next/server'

function upstreamResponse(overrides: Record<string, unknown> = {}) {
  return {
    ok: true,
    status: 200,
    headers: new Headers({ 'content-type': 'application/json' }),
    async json() {
      return { items: [], ...overrides }
    },
    async text() {
      return JSON.stringify({ items: [], ...overrides })
    },
  }
}

function getRequest(slug: string[], options: { devBypass?: boolean } = {}) {
  const headers: Record<string, string> = { 'x-api-key': 'client-supplied-key' }
  if (options.devBypass) headers.cookie = '__e2e_auth_bypass=1'
  return new NextRequest(new URL(`http://localhost/api/v1/${slug.join('/')}`), { headers })
}

describe('GET /api/v1/... BYOK proxy', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    fetchMock = vi.fn(async () => upstreamResponse())
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it.each([
    [['text-to-video'], '/api/v1/text-to-video'],
    [['image-generation'], '/api/v1/image-generation'],
    [['predictions', 'job-123', 'result'], '/api/v1/predictions/job-123/result'],
  ])('proxies anonymous generation GET %s with a valid client key', async (slug) => {
    vi.mocked(getMuApiKeyFromRequest).mockResolvedValue('client-supplied-key')

    const res = await GET(getRequest(slug), { params: { slug } })

    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('proxies anonymous generation GET when the client key is a bearer token', async () => {
    vi.mocked(getMuApiKeyFromRequest).mockResolvedValue('client-supplied-key')

    const req = new NextRequest(new URL('http://localhost/api/v1/text-to-video'), {
      headers: { authorization: 'Bearer client-supplied-key' },
    })
    const res = await GET(req, { params: { slug: ['text-to-video'] } })

    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('proxies for an authenticated caller without SMARTVIDEO_GO', async () => {
    vi.mocked(getMuApiKeyFromRequest).mockResolvedValue('client-supplied-key')

    const res = await GET(getRequest(['text-to-video']), { params: { slug: ['text-to-video'] } })

    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('returns 401 when the MuAPI key is missing', async () => {
    vi.mocked(getMuApiKeyFromRequest).mockRejectedValue(
      new Response('Unauthorized: Missing API key', { status: 401 })
    )

    const res = await GET(getRequest(['text-to-video']), { params: { slug: ['text-to-video'] } })

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized: Missing API key' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('still proxies generation GETs for an entitled caller (no regression)', async () => {
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
})

describe('POST /api/v1/... BYOK proxy', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    fetchMock = vi.fn(async () => upstreamResponse())
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('proxies anonymous POST with a valid client key', async () => {
    vi.mocked(getMuApiKeyFromRequest).mockResolvedValue('client-supplied-key')

    const req = new NextRequest(new URL('http://localhost/api/v1/text-to-video'), {
      method: 'POST',
      headers: { 'x-api-key': 'client-supplied-key', 'content-type': 'application/json' },
      body: JSON.stringify({ prompt: 'x' }),
    })
    const res = await POST(req, { params: { slug: ['text-to-video'] } })

    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('still proxies POSTs for an entitled caller (no regression)', async () => {
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

  it('returns 401 when the MuAPI key is missing', async () => {
    vi.mocked(getMuApiKeyFromRequest).mockRejectedValue(
      new Response('Unauthorized: Missing API key', { status: 401 })
    )

    const req = new NextRequest(new URL('http://localhost/api/v1/text-to-video'), {
      method: 'POST',
      headers: { 'x-api-key': 'client-supplied-key', 'content-type': 'application/json' },
      body: JSON.stringify({ prompt: 'x' }),
    })
    const res = await POST(req, { params: { slug: ['text-to-video'] } })

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized: Missing API key' })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
