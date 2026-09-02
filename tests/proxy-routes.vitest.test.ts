import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('../app/api/v1/lib/auth', () => ({
  getMuApiKeyFromRequest: vi.fn(async () => 'test-v1-key'),
}))

vi.mock('../app/api/design-agent/lib/auth', () => ({
  getDesignAgentApiKey: vi.fn(async () => 'test-da-key'),
}))

vi.mock('@/apps/storyboard/models', () => ({
  isValidStoryboardModel: vi.fn(() => true),
  DEFAULT_STORYBOARD_MODEL_ID: 'default-model',
}))

const MUAPI_BASE = 'https://api.muapi.ai'

function makeFetch() {
  return vi.fn(async () => ({
    ok: true,
    status: 200,
    headers: new Headers({ 'content-type': 'application/json' }),
    async json() {
      return { items: [], total: 0 }
    },
    async text() {
      return '{}'
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
})

// ── Helpers ──────────────────────────────────────────────────────────────────

function nextReq(url: string, init?: RequestInit) {
  return new NextRequest(new URL(url), init)
}

// ── v1 catch-all proxy route ─────────────────────────────────────────────────

describe('GET /api/v1/... (v1 catch-all proxy)', () => {
  it('proxies GET /api/v1/get_upload_url to MuAPI', async () => {
    const { GET } = await import('../app/api/v1/[...slug]/route')

    const res = await GET(
      nextReq('http://localhost/api/v1/get_upload_url', {
        headers: { 'x-api-key': 'direct-v1-key' },
      }),
      { params: { slug: ['get_upload_url'] } }
    )

    const json = await res.json()

    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toContain('/api/v1/get_upload_url')
    expect(fetchMock.mock.calls[0][1]?.headers).toHaveProperty('x-api-key', 'test-v1-key')
    expect(json).toHaveProperty('items')
  })

  it('proxies GET /api/v1/creative-agent/sessions to MuAPI', async () => {
    const { GET } = await import('../app/api/v1/[...slug]/route')

    const res = await GET(
      nextReq('http://localhost/api/v1/creative-agent/sessions', {
        headers: { 'x-api-key': 'direct-v1-key' },
      }),
      { params: { slug: ['creative-agent', 'sessions'] } }
    )

    const json = await res.json()

    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const calledUrl = fetchMock.mock.calls[0][0] as string
    expect(calledUrl).toContain('/api/v1/creative-agent/sessions')
    expect(fetchMock.mock.calls[0][1]?.headers).toHaveProperty('x-api-key', 'test-v1-key')
    expect(json).toHaveProperty('items')
  })

  it('forwards query parameters to upstream', async () => {
    const { GET } = await import('../app/api/v1/[...slug]/route')

    await GET(
      nextReq('http://localhost/api/v1/some-endpoint?foo=bar&baz=1', {
        headers: { 'x-api-key': 'key' },
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

    const { GET } = await import('../app/api/v1/[...slug]/route')

    const res = await GET(
      nextReq('http://localhost/api/v1/get_upload_url', {
        headers: { 'x-api-key': 'key' },
      }),
      { params: { slug: ['get_upload_url'] } }
    )

    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json).toHaveProperty('error')
  })
})

// ── design-agent sessions route ──────────────────────────────────────────────

describe('GET /api/design-agent/sessions', () => {
  it('proxies to MuAPI and returns sessions list', async () => {
    const { GET } = await import('../app/api/design-agent/sessions/route')

    const res = await GET(
      nextReq('http://localhost/api/design-agent/sessions', {
        headers: { 'x-api-key': 'da-key' },
      })
    )

    const json = await res.json()

    expect(res.status).toBe(200)
    const allCalls = Array.from(fetchMock.mock.calls)
    expect(allCalls.length).toBeGreaterThanOrEqual(1)
    expect(allCalls[0][0]).toBe(`${MUAPI_BASE}/api/v1/creative-agent/sessions`)
    const init = allCalls[0][1] as Record<string, unknown> | undefined
    expect(init).toBeDefined()
    expect((init as Record<string, unknown>).headers).toHaveProperty('x-api-key', 'test-da-key')
    expect(json).toHaveProperty('items')
  })
})

// ── design-agent skills route ────────────────────────────────────────────────

describe('GET /api/design-agent/skills', () => {
  it('proxies to MuAPI agent-skills endpoint', async () => {
    const { GET } = await import('../app/api/design-agent/skills/route')

    const res = await GET(
      nextReq('http://localhost/api/design-agent/skills', {
        headers: { 'x-api-key': 'da-key' },
      })
    )

    const json = await res.json()

    const calls = recordedCalls(fetchMock)
    expect(calls).toHaveLength(1)
    expect(calls[0].url).toBe(`${MUAPI_BASE}/api/v1/creative-agent/agent-skills`)
    expect(calls[0].headers['x-api-key']).toBe('test-da-key')
    expect(json).toHaveProperty('items')
  })
})

// ── design-agent jobs route ──────────────────────────────────────────────────

describe('GET /api/design-agent/jobs', () => {
  it('uses sessionId to fetch jobs for a session', async () => {
    const { GET } = await import('../app/api/design-agent/jobs/route')

    const res = await GET(
      nextReq('http://localhost/api/design-agent/jobs?sessionId=test', {
        headers: { 'x-api-key': 'da-key' },
      })
    )

    const json = await res.json()

    const calls = recordedCalls(fetchMock)
    expect(calls).toHaveLength(1)
    expect(calls[0].url).toBe(
      `${MUAPI_BASE}/api/v1/creative-agent/sessions/test/jobs`
    )
    expect(calls[0].headers['x-api-key']).toBe('test-da-key')
    expect(json).toHaveProperty('items')
  })

  it('returns 400 when neither jobId nor sessionId is provided', async () => {
    const { GET } = await import('../app/api/design-agent/jobs/route')

    const res = await GET(
      nextReq('http://localhost/api/design-agent/jobs', {
        headers: { 'x-api-key': 'da-key' },
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

describe('GET /api/storyboard/... (storyboard proxy)', () => {
  it('proxies root GET /api/storyboard/ with no path', async () => {
    const { GET } = await import('../app/api/storyboard/[[...path]]/route')

    const res = await GET(
      nextReq('http://localhost/api/storyboard/', {
        headers: { 'x-api-key': 'sb-key' },
      }),
      { params: Promise.resolve({ path: [] }) }
    )

    const json = await res.json()

    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe(`${MUAPI_BASE}/api/storyboard/`)
    expect(fetchMock.mock.calls[0][1]?.method).toBe('GET')
    expect(json).toHaveProperty('items')
  })

  it('proxies GET with a sub-path to the correct upstream URL', async () => {
    const { GET } = await import('../app/api/storyboard/[[...path]]/route')

    const res = await GET(
      nextReq('http://localhost/api/storyboard/episodes/42/shots', {
        headers: { 'x-api-key': 'sb-key' },
      }),
      { params: Promise.resolve({ path: ['episodes', '42', 'shots'] }) }
    )

    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe(
      `${MUAPI_BASE}/api/storyboard/episodes/42/shots`
    )
    expect(fetchMock.mock.calls[0][1]?.method).toBe('GET')
  })

  it('forwards x-api-key header to upstream', async () => {
    const { GET } = await import('../app/api/storyboard/[[...path]]/route')

    await GET(
      nextReq('http://localhost/api/storyboard/', {
        headers: { 'x-api-key': 'my-storyboard-key' },
      }),
      { params: Promise.resolve({ path: [] }) }
    )

    const calls = recordedCalls(fetchMock)
    expect(calls).toHaveLength(1)
    expect(calls[0].headers['x-api-key']).toBe('my-storyboard-key')
  })

  it('does not forward host/connection/cookie headers', async () => {
    const { GET } = await import('../app/api/storyboard/[[...path]]/route')

    await GET(
      nextReq('http://localhost/api/storyboard/episodes', {
        headers: {
          'x-api-key': 'sb-key',
          host: 'localhost:3000',
          connection: 'keep-alive',
          cookie: 'session=abc',
        },
      }),
      { params: Promise.resolve({ path: ['episodes'] }) }
    )

    const calls = recordedCalls(fetchMock)
    expect(calls).toHaveLength(1)
    const forwardedHeaders = calls[0].headers
    expect(forwardedHeaders).not.toHaveProperty('host')
    expect(forwardedHeaders).not.toHaveProperty('connection')
    expect(forwardedHeaders).not.toHaveProperty('cookie')
  })
})
