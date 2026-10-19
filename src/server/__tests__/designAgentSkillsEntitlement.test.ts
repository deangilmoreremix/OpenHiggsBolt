/**
 * Regression tests for GET /api/design-agent/skills.
 *
 * This route is now a pure BYOK proxy — it validates the API key from the
 * request but no longer checks Clerk auth or the SMARTVIDEO_GO entitlement.
 * Anyone with a valid client-supplied key may read the upstream catalog.
 *
 * Covered:
 * - an anonymous caller with a valid client key is proxied (no 401);
 * - an authenticated caller without SMARTVIDEO_GO is still proxied (gate removed);
 * - an entitled caller still proxies to the upstream agent-skills endpoint
 *   with the same success shape as before (no regression).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

vi.mock('@/app/api/design-agent/lib/auth', () => ({
  getDesignAgentApiKey: vi.fn(async () => 'client-supplied-key'),
}))

import { GET } from '@/app/api/design-agent/skills/route'
import { getDesignAgentApiKey } from '@/app/api/design-agent/lib/auth'
import { NextRequest } from 'next/server'

describe('GET /api/design-agent/skills BYOK proxy', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      async json() {
        return [{ name: 'logo-design', inputs: ['brief'] }]
      },
      async text() {
        return JSON.stringify([{ name: 'logo-design', inputs: ['brief'] }])
      },
    }))
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('proxies an anonymous caller that supplies a valid MuAPI key', async () => {
    vi.mocked(getDesignAgentApiKey).mockResolvedValue('client-supplied-key')

    const req = new NextRequest(new URL('http://localhost/api/design-agent/skills'), {
      headers: { 'x-api-key': '5c0dc3a2146315592368336e8ee102087853022254158331a48cd0cd8528cec9' },
    })
    const res = await GET(req)

    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('proxies an anonymous caller that supplies a bearer token', async () => {
    vi.mocked(getDesignAgentApiKey).mockResolvedValue('client-supplied-key')

    const req = new NextRequest(new URL('http://localhost/api/design-agent/skills'), {
      headers: { authorization: 'Bearer 5c0dc3a2146315592368336e8ee102087853022254158331a48cd0cd8528cec9' },
    })
    const res = await GET(req)

    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('proxies an authenticated caller without SMARTVIDEO_GO', async () => {
    vi.mocked(getDesignAgentApiKey).mockResolvedValue('client-supplied-key')

    const req = new NextRequest(new URL('http://localhost/api/design-agent/skills'), {
      headers: { 'x-api-key': 'client-supplied-key' },
    })
    const res = await GET(req)

    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('still proxies to the upstream agent-skills endpoint for an entitled caller', async () => {
    vi.mocked(getDesignAgentApiKey).mockResolvedValue('client-supplied-key')

    const req = new NextRequest(new URL('http://localhost/api/design-agent/skills'), {
      headers: { 'x-api-key': 'client-supplied-key' },
    })
    const res = await GET(req)

    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.muapi.ai/api/v1/creative-agent/agent-skills')
    expect(fetchMock.mock.calls[0][1]?.headers).toHaveProperty('x-api-key', 'client-supplied-key')
    expect(await res.json()).toEqual([{ name: 'logo-design', inputs: ['brief'] }])
  })
})
