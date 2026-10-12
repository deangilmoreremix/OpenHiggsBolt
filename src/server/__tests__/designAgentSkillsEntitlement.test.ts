/**
 * Negative auth tests for GET /api/design-agent/skills (finding M1).
 *
 * Proves:
 * - An anonymous caller receives 401 even when a valid MuAPI key is supplied —
 *   previously any client-held MuAPI key was enough to read the upstream
 *   creative-agent catalog and probe key validity.
 * - An authenticated caller without SMARTVIDEO_GO receives 403.
 * - An entitled caller still proxies to the upstream agent-skills endpoint
 *   with the same success shape as before.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

vi.mock('@/access/resolveAccess', () => ({
  resolveSmartVideoAccessForUser: vi.fn(),
}))

// Keeping the real key resolver here: the route must stay keyless for an
// anonymous caller, which is what closes the leak.
import { GET } from '@/app/api/design-agent/skills/route'
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

describe('GET /api/design-agent/skills entitlement gate (M1)', () => {
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

  it('returns 401 for an anonymous caller that supplies a valid MuAPI key', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as any)
    vi.mocked(resolveSmartVideoAccessForUser).mockResolvedValue(null)

    const req = new NextRequest(new URL('http://localhost/api/design-agent/skills'), {
      headers: { 'x-api-key': '5c0dc3a2146315592368336e8ee102087853022254158331a48cd0cd8528cec9' },
    })
    const res = await GET(req)

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'UNAUTHENTICATED' })
    // The upstream catalog must not be reachable while unauthenticated.
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns 401 for an anonymous caller that supplies a bearer token', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as any)
    vi.mocked(resolveSmartVideoAccessForUser).mockResolvedValue(null)

    const req = new NextRequest(new URL('http://localhost/api/design-agent/skills'), {
      headers: { authorization: 'Bearer 5c0dc3a2146315592368336e8ee102087853022254158331a48cd0cd8528cec9' },
    })
    const res = await GET(req)

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'UNAUTHENTICATED' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns 403 for an authenticated caller without SMARTVIDEO_GO', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any)
    vi.mocked(resolveSmartVideoAccessForUser).mockResolvedValue(UNPAID_ACCESS)

    const req = new NextRequest(new URL('http://localhost/api/design-agent/skills'), {
      headers: { 'x-api-key': 'client-supplied-key' },
    })
    const res = await GET(req)

    expect(res.status).toBe(403)
    expect(await res.json()).toMatchObject({ upgradeRequired: true, entitlement: 'smartvideo_go' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('still proxies to the upstream agent-skills endpoint for an entitled caller', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any)
    vi.mocked(resolveSmartVideoAccessForUser).mockResolvedValue(ENTITLED_ACCESS)

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
