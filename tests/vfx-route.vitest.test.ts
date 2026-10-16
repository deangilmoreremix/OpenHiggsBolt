/**
 * VFX cancel/status route race guard — BYOK edition.
 *
 * The property under test (unchanged from the original tests/vfx-route.test.js):
 * when a job completes between the cancel call and the next poll, the status
 * route must report `cancelled` and discard the billable result instead of
 * surfacing it to the client.
 *
 * What changed with BYOK: the routes no longer read a server-side
 * `process.env.MUAPI_API_KEY` fallback. Every request therefore carries the
 * caller's OWN key in the `x-api-key` header (Settings -> localStorage ->
 * header), and the forbidden server env key is asserted to stay unused.
 *
 * Converted from tests/vfx-route.test.js (node:test) to vitest so it runs in CI.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

const ENV_MUAPI_SENTINEL = 'sk-SENTINEL-server-muapi-key-DO-NOT-USE'
const USER_HEADER_KEY = 'user-owned-muapi-key-AAAA'

const COMPLETED_JOB = {
  status: 'completed',
  outputs: ['https://muapi.ai/video.mp4'],
  video_url: 'https://muapi.ai/video.mp4',
}

const h = vi.hoisted(() => ({
  userId: null as string | null,
  rowsByUser: {} as Record<string, { muapi_key?: string } | null>,
}))

let fetchMock: ReturnType<typeof vi.fn>

function makeUpstreamResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    headers: new Headers({ 'content-type': 'application/json' }),
    async json() {
      return body
    },
    async text() {
      return JSON.stringify(body)
    },
  }
}

function statusRequest(id: string, extraHeaders: Record<string, string> = {}) {
  return new NextRequest(`http://localhost/api/vfx/status?id=${id}`, {
    headers: { ...extraHeaders },
  })
}

function cancelRequest(requestId: string, extraHeaders: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/vfx/cancel', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...extraHeaders },
    body: JSON.stringify({ request_id: requestId }),
  })
}

function muapiUpstreamKeys() {
  return fetchMock.mock.calls
    .map((call) => String(call[0]))
    .filter((url) => url.includes('muapi'))
    .map((_url, index) => {
      const init = (fetchMock.mock.calls[index][1] ?? {}) as { headers?: Record<string, string> }
      return init.headers?.['x-api-key']
    })
}

beforeEach(() => {
  vi.resetModules()
  h.userId = null
  h.rowsByUser = {}

  // The forbidden server-side key is present in EVERY test. Any code path that
  // uses it is a BYOK violation.
  process.env.MUAPI_API_KEY = ENV_MUAPI_SENTINEL
  process.env.MUAPI_KEY = ENV_MUAPI_SENTINEL

  vi.doMock('@clerk/nextjs/server', () => ({
    auth: async () => ({ userId: h.userId }),
  }))

  vi.doMock('@/src/lib/supabaseServer', () => ({
    getSupabaseAdmin: () => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: h.rowsByUser[h.userId ?? ''] ?? null,
              error: null,
            }),
          }),
        }),
      }),
    }),
    getSupabaseAsUser: async () => {
      throw new Error('not used in vfx-route tests')
    },
    getSupabaseService: () => {
      throw new Error('not used in vfx-route tests')
    },
  }))

  vi.doMock('@/access/apiRequireEntitlement', () => ({
    requireApiEntitlement: vi.fn(async () => ({ allowed: true })),
    entitlementForbiddenResponse: vi.fn(
      () => new Response(JSON.stringify({ error: 'PAYMENT_REQUIRED' }), { status: 403 })
    ),
  }))

  vi.doMock('@/lib/rateLimit', () => ({
    rateLimit: () => ({ allowed: true, retryAfterMs: 60_000 }),
    rateLimit429: () => new Response(JSON.stringify({ error: 'Too many requests' }), { status: 429 }),
    resolveRateLimitKey: (userId?: string | null) => userId || 'anon',
  }))

  // Simulate the job having COMPLETED on MuAPI's side for ANY fetch. The cancel
  // route also probes fetch (best-effort probe) — this covers it.
  fetchMock = vi.fn(async () => makeUpstreamResponse(COMPLETED_JOB))
  vi.spyOn(globalThis, 'fetch').mockImplementation(fetchMock as never)
})

afterEach(() => {
  vi.restoreAllMocks()
  delete process.env.MUAPI_API_KEY
  delete process.env.MUAPI_KEY
})

describe('VFX cancel/status route race guard', () => {
  it('pre-cancel poll surfaces the completed MuAPI result', async () => {
    const { GET } = await import('../app/api/vfx/status/route')

    const res = await GET(statusRequest('JOB-2', { 'x-api-key': USER_HEADER_KEY }))
    const json = await res.json()

    expect(json.status).toBe('completed')
    expect(json.video_url).toBe('https://muapi.ai/video.mp4')
    expect(muapiUpstreamKeys()).toEqual([USER_HEADER_KEY])
    expect(muapiUpstreamKeys()).not.toContain(ENV_MUAPI_SENTINEL)
  })

  it('cancel then poll returns cancelled and discards the completed result', async () => {
    const { POST: cancelPOST } = await import('../app/api/vfx/cancel/route')

    await cancelPOST(cancelRequest('JOB-1', { 'x-api-key': USER_HEADER_KEY }))

    const { GET } = await import('../app/api/vfx/status/route')
    const res = await GET(statusRequest('JOB-1', { 'x-api-key': USER_HEADER_KEY }))
    const json = await res.json()

    expect(json.status).toBe('cancelled')
    expect(json.video_url).toBeUndefined()
    // The completed upstream job is never reported or billed to the client.
    expect(muapiUpstreamKeys()).not.toContain(ENV_MUAPI_SENTINEL)
  })
})

describe('VFX cancel/status routes never fall back to a server env key', () => {
  it('status returns the Settings-directed 400 with no user key and never polls upstream', async () => {
    const { GET } = await import('../app/api/vfx/status/route')

    const res = await GET(statusRequest('JOB-3'))

    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/MuAPI API key in Settings/i)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('cancel still succeeds locally but probes upstream with the user key only', async () => {
    h.userId = 'user-1'
    h.rowsByUser = { 'user-1': { muapi_key: USER_HEADER_KEY } }

    const { POST } = await import('../app/api/vfx/cancel/route')
    const res = await POST(cancelRequest('JOB-4'))

    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ cancelled: true, status: 'cancelled' })
    expect(muapiUpstreamKeys()).toEqual([USER_HEADER_KEY])
    expect(muapiUpstreamKeys()).not.toContain(ENV_MUAPI_SENTINEL)
  })

  it('a signed-in user with no stored key cannot cancel-probe with the env key', async () => {
    h.userId = 'user-2'
    h.rowsByUser = {}

    const { POST } = await import('../app/api/vfx/cancel/route')
    const res = await POST(cancelRequest('JOB-5'))

    expect(res.status).toBe(200)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
