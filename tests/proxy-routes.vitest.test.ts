import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Mock transitive deps ──────────────────────────────────────────────────────
// These reliably intercept imports and unblock the route handlers.

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(async () => ({ userId: 'test-user' })),
}))

vi.mock('@/src/lib/supabaseServer', () => ({
  getSupabaseAdmin: vi.fn(() => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: { muapi_key: 'encrypted-key', smartvideo_go: true }, error: null }),
        }),
      }),
      upsert: () => ({ error: null }),
    }),
  })),
}))

vi.mock('@/src/lib/muapiKeyCrypto', () => ({
  decryptMuapiKey: vi.fn(() => 'decrypted-key'),
}))

vi.mock('@/app/api/design-agent/lib/ownership', () => ({
  requireOwnership: vi.fn(async () => ({ userId: 'test-user' })),
  recordOwnership: vi.fn(async () => {}),
  getOwnerId: vi.fn(async () => 'test-user'),
}))

// Entitlement: mock resolveAccess so the real requireApiEntitlement passes.
// (vi.mock on @/access/apiRequireEntitlement itself is unreliable in vitest
//  when the route also imports ownership.ts in the same graph.)
vi.mock('@/access/resolveAccess', () => ({
  resolveSmartVideoAccessForUser: vi.fn(async () => ({ hasSmartVideoGo: true, state: 'active' })),
}))

vi.mock('@/access/entitlements', () => ({
  ENTITLEMENTS: { SMARTVIDEO_GO: 'smartvideo_go' },
}))

vi.mock('@/lib/safeApiResponse', () => ({
  safeApiJson: vi.fn(async (res: Response) => {
    const text = await res.text()
    if (!text) return {}
    try { return JSON.parse(text) } catch { return { message: text } }
  }),
}))

vi.mock('@/apps/storyboard/models', () => ({
  isValidStoryboardModel: vi.fn(() => true),
  DEFAULT_STORYBOARD_MODEL_ID: 'default-model',
}))

// ── Helpers ──────────────────────────────────────────────────────────────────

const MUAPI_BASE = 'https://api.muapi.ai'

const V1_KEY = 'direct-v1-key'
const DA_KEY = 'da-sessions-key'

function makeFetch() {
  return vi.fn(async () => ({
    ok: true,
    status: 200,
    headers: new Headers({ 'content-type': 'application/json' }),
    async json() {
      return { items: [] }
    },
    async text() {
      return JSON.stringify({ items: [] })
    },
  }))
}

function recordedCalls(fetchMock: ReturnType<typeof vi.fn>) {
  const calls = Array.from(fetchMock.mock.calls)
  return calls.map((args) => {
    const input = args[0] as RequestInfo | URL
    const init = args[1] as RequestInit | undefined
    const url = typeof input === 'string' ? input : input.toString()
    const headers: Record<string, string> = {}
    if (init?.headers) {
      const h = init.headers as Record<string, string> | Headers
      if (typeof h.entries === 'function') {
        for (const [k, v] of h.entries()) headers[k.toLowerCase()] = v
      } else {
        for (const k of Object.keys(h)) headers[k.toLowerCase()] = h[k]
      }
    }
    return {
      url,
      method: init?.method,
      headers,
      body: init?.body instanceof FormData
        ? '[FormData]'
        : typeof init?.body === 'string'
          ? init.body
          : undefined,
    }
  })
}

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  fetchMock = makeFetch()
  vi.spyOn(globalThis, 'fetch').mockImplementation(fetchMock)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

// ── v1 catch-all proxy route ─────────────────────────────────────────────────
//
// main's v1 route:
//   - checks entitlement for generation paths
//   - reads API key from Authorization: Bearer or x-api-key header
//   - proxies to https://api.muapi.ai/api/v1/{path}
//   - uses safeApiJson(res) (calls res.text() then JSON.parse)
//
// We send the key as Authorization: Bearer to bypass the header branch and
// keep the assertion deterministic (the key is forwarded as x-api-key).

describe('GET /api/v1/... (v1 catch-all proxy)', () => {
  it('proxies GET /api/v1/get_upload_url to MuAPI', async () => {
    const { GET } = await import('@/app/api/v1/[...slug]/route')

    const res = await GET(
      new NextRequest(new URL('http://localhost/api/v1/get_upload_url'), {
        headers: { authorization: `Bearer ${V1_KEY}` },
      }),
      { params: { slug: ['get_upload_url'] } }
    )

    const json = await res.json()

    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0] as string).toContain('/api/v1/get_upload_url')
    expect(fetchMock.mock.calls[0][1]?.headers).toHaveProperty('x-api-key', V1_KEY)
    expect(json).toEqual({ items: [] })
  })

  it('proxies GET /api/v1/creative-agent/sessions to MuAPI', async () => {
    const { GET } = await import('@/app/api/v1/[...slug]/route')

    const res = await GET(
      new NextRequest(new URL('http://localhost/api/v1/creative-agent/sessions'), {
        headers: { authorization: `Bearer ${V1_KEY}` },
      }),
      { params: { slug: ['creative-agent', 'sessions'] } }
    )

    const json = await res.json()

    expect(res.status).toBe(200)
    const calledUrl = fetchMock.mock.calls[0][0] as string
    expect(calledUrl).toContain('/api/v1/creative-agent/sessions')
    expect(fetchMock.mock.calls[0][1]?.headers).toHaveProperty('x-api-key', V1_KEY)
    expect(json).toEqual({ items: [] })
  })

  it('forwards query parameters to upstream', async () => {
    const { GET } = await import('@/app/api/v1/[...slug]/route')

    await GET(
      new NextRequest(new URL('http://localhost/api/v1/some-endpoint?foo=bar&baz=1'), {
        headers: { authorization: `Bearer ${V1_KEY}` },
      }),
      { params: { slug: ['some-endpoint'] } }
    )

    const calls = recordedCalls(fetchMock)
    expect(calls).toHaveLength(1)
    expect(calls[0].url).toContain('foo=bar')
    expect(calls[0].url).toContain('baz=1')
  })

  it('returns 500 on upstream network failure', async () => {
    vi.restoreAllMocks()
    const failMock = vi.fn(async () => {
      throw new Error('ECONNREFUSED')
    })
    vi.spyOn(globalThis, 'fetch').mockImplementation(failMock)

    const { GET } = await import('@/app/api/v1/[...slug]/route')

    const res = await GET(
      new NextRequest(new URL('http://localhost/api/v1/get_upload_url'), {
        headers: { authorization: `Bearer ${V1_KEY}` },
      }),
      { params: { slug: ['get_upload_url'] } }
    )

    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json).toHaveProperty('error')
  })
})

// ── POST /api/v1/... (v1 catch-all proxy) ────────────────────────────────────
//
// Verifies the production fix: JSON bodies must be stringified before being
// passed to fetch(), otherwise the runtime throws a TypeError.

describe('POST /api/v1/... (v1 catch-all proxy)', () => {
  it('stringifies JSON body and forwards content-type', async () => {
    const { POST } = await import('@/app/api/v1/[...slug]/route')

    const res = await POST(
      new NextRequest(new URL('http://localhost/api/v1/gpt-image-2'), {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${V1_KEY}`,
        },
        body: JSON.stringify({ prompt: 'a cat' }),
      }),
      { params: { slug: ['gpt-image-2'] } }
    )

    expect(res.status).toBe(200)
    const calls = recordedCalls(fetchMock)
    expect(calls).toHaveLength(1)
    expect(calls[0].method).toBe('POST')
    expect(calls[0].headers['content-type']).toBe('application/json')
    expect(calls[0].body).toBe(JSON.stringify({ prompt: 'a cat' }))
  })
})

// ── design-agent sessions route ──────────────────────────────────────────────
//
// main's sessions route:
//   - calls requireApiEntitlement (mocked via resolveAccess)
//   - calls getDesignAgentApiKey (reads Authorization: Bearer or x-api-key)
//   - proxies to /api/v1/creative-agent/sessions
//   - uses safeApiJson

describe('GET /api/design-agent/sessions', () => {
  it('proxies to MuAPI and returns sessions list', async () => {
    const { GET } = await import('@/app/api/design-agent/sessions/route')

    const res = await GET(
      new NextRequest(new URL('http://localhost/api/design-agent/sessions'), {
        headers: { authorization: `Bearer ${DA_KEY}` },
      })
    )

    const json = await res.json()

    expect(res.status).toBe(200)
    const allCalls = Array.from(fetchMock.mock.calls)
    expect(allCalls.length).toBeGreaterThanOrEqual(1)
    expect(allCalls[0][0]).toBe(
      `${MUAPI_BASE}/api/v1/creative-agent/sessions`
    )
    const init = allCalls[0][1] as Record<string, unknown> | undefined
    expect(init).toBeDefined()
    expect((init as Record<string, unknown>).headers).toHaveProperty('x-api-key', DA_KEY)
    expect(json).toEqual({ items: [] })
  })
})

// ── design-agent skills route ────────────────────────────────────────────────

describe('GET /api/design-agent/skills', () => {
  const DA_KEY = 'da-skills-key'

  it('proxies to MuAPI agent-skills endpoint', async () => {
    const { GET } = await import('@/app/api/design-agent/skills/route')

    const res = await GET(
      new NextRequest(new URL('http://localhost/api/design-agent/skills'), {
        headers: { authorization: `Bearer ${DA_KEY}` },
      })
    )

    const json = await res.json()

    expect(res.status).toBe(200)
    const calls = recordedCalls(fetchMock)
    expect(calls).toHaveLength(1)
    expect(calls[0].url).toBe(`${MUAPI_BASE}/api/v1/creative-agent/agent-skills`)
    expect(calls[0].headers['x-api-key']).toBe(DA_KEY)
    expect(json).toEqual({ items: [] })
  })
})

// ── design-agent jobs route ──────────────────────────────────────────────────

describe('GET /api/design-agent/jobs', () => {
  const DA_KEY = 'da-jobs-key'

  it('uses sessionId to fetch jobs for a session', async () => {
    const { GET } = await import('@/app/api/design-agent/jobs/route')

    const res = await GET(
      new NextRequest(new URL('http://localhost/api/design-agent/jobs?sessionId=test'), {
        headers: { authorization: `Bearer ${DA_KEY}` },
      })
    )

    const json = await res.json()

    expect(res.status).toBe(200)
    const calls = recordedCalls(fetchMock)
    expect(calls).toHaveLength(1)
    expect(calls[0].url).toBe(
      `${MUAPI_BASE}/api/v1/creative-agent/sessions/test/jobs`
    )
    expect(calls[0].headers['x-api-key']).toBe(DA_KEY)
    expect(json).toEqual({ items: [] })
  })

  it('returns 400 when neither jobId nor sessionId is provided', async () => {
    const { GET } = await import('@/app/api/design-agent/jobs/route')

    const res = await GET(
      new NextRequest(new URL('http://localhost/api/design-agent/jobs'), {
        headers: { authorization: `Bearer ${DA_KEY}` },
      })
    )

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json).toHaveProperty('error')
    expect(json.error).toMatch(/jobId or sessionId required/i)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

// ── storyboard proxy route ───────────────────────────────────────────────────
//
// NOTE: main's storyboard GET handler only accepts /api/storyboard/result?id=...
// (generic proxy for arbitrary paths was removed in a later commit).
// Tests cover the actual current behavior.

describe('GET /api/storyboard/result (storyboard status poll)', () => {
  it('returns 400 when id query param is missing', async () => {
    const { GET } = await import('@/app/api/storyboard/[[...path]]/route')

    const res = await GET(
      new NextRequest(new URL('http://localhost/api/storyboard/result'), {
        headers: { 'x-api-key': 'sb-key' },
      }),
      { params: Promise.resolve({ path: ['result'] }) }
    )

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json).toHaveProperty('error')
    expect(json.error).toMatch(/id is required/i)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns 400 when x-api-key header is missing', async () => {
    const { GET } = await import('@/app/api/storyboard/[[...path]]/route')

    const res = await GET(
      new NextRequest(new URL('http://localhost/api/storyboard/result?id=abc123')),
      { params: Promise.resolve({ path: ['result'] }) }
    )

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/MuAPI key is required/i)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('proxies GET /api/storyboard/result?id=... to MuAPI predictions endpoint', async () => {
    // Mock uses `outputs` array (the field the route's URL extraction checks)
    const predictionResponse = {
      status: 'completed',
      outputs: ['https://cdn.muapi.ai/video.mp4'],
    }
    vi.restoreAllMocks()
    const storyboardFetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      async json() { return predictionResponse },
      async text() { return JSON.stringify(predictionResponse) },
    }))
    vi.spyOn(globalThis, 'fetch').mockImplementation(storyboardFetchMock)

    const { GET } = await import('@/app/api/storyboard/[[...path]]/route')

    const res = await GET(
      new NextRequest(new URL('http://localhost/api/storyboard/result?id=job-123'), {
        headers: { 'x-api-key': 'sb-key' },
      }),
      { params: Promise.resolve({ path: ['result'] }) }
    )

    const json = await res.json()

    expect(res.status).toBe(200)
    expect(storyboardFetchMock).toHaveBeenCalledTimes(1)
    const calledUrl = storyboardFetchMock.mock.calls[0][0] as string
    expect(calledUrl).toContain('/api/v1/predictions/job-123/result')
    expect(json).toHaveProperty('request_id', 'job-123')
    expect(json).toHaveProperty('status', 'completed')
    expect(json).toHaveProperty('url', 'https://cdn.muapi.ai/video.mp4')
  })

  it('returns 404 for unknown storyboard paths', async () => {
    const { GET } = await import('@/app/api/storyboard/[[...path]]/route')

    const res = await GET(
      new NextRequest(new URL('http://localhost/api/storyboard/episodes'), {
        headers: { 'x-api-key': 'sb-key' },
      }),
      { params: Promise.resolve({ path: ['episodes'] }) }
    )

    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toMatch(/Unknown storyboard endpoint/i)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
