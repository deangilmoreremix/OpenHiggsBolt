import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

function makeUpstreamResponse(overrides: Record<string, unknown> = {}) {
  return vi.fn(async () => ({
    ok: true,
    status: 200,
    headers: new Headers({ 'content-type': 'application/json' }),
    async json() {
      return { text: 'enhanced result', model: 'gpt-4o', ...overrides }
    },
    async text() {
      return JSON.stringify({ text: 'enhanced result', model: 'gpt-4o', ...overrides })
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
  vi.resetModules()
  fetchMock = makeUpstreamResponse()
  vi.spyOn(globalThis, 'fetch').mockImplementation(fetchMock)

  vi.doMock('@clerk/nextjs/server', () => ({
    auth: vi.fn(async () => ({ userId: 'test-user' })),
  }))

  vi.doMock('@/src/lib/openaiKeyServer', () => ({
    getOpenAiKeyForUser: vi.fn(async () => 'test-openai-key'),
  }))

  vi.doMock('@/access/apiRequireEntitlement', () => ({
    requireApiEntitlement: vi.fn(async () => ({ allowed: true })),
    entitlementForbiddenResponse: vi.fn(() => new Response(JSON.stringify({ error: 'FORBIDDEN' }), { status: 403 })),
  }))

  vi.doMock('@/access/entitlements', () => ({
    ENTITLEMENTS: { SMARTVIDEO_GO: 'smartvideo_go' },
  }))
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

// ── POST /api/proxy/openai-enhance ────────────────────────────────────────────

describe('POST /api/proxy/openai-enhance', () => {
  it('routes to Supabase Edge Function when NEXT_PUBLIC_SUPABASE_URL is set', async () => {
    const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const originalSupabaseUrl2 = process.env.SUPABASE_URL
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co'
    process.env.SUPABASE_URL = undefined

    try {
      const { POST } = await import('@/app/api/proxy/openai-enhance/route')

      const req = new NextRequest('http://localhost/api/proxy/openai-enhance', {
        method: 'POST',
        body: JSON.stringify({ prompt: 'make it better', model: 'gpt-4o-mini' }),
      })

      const res = await POST(req)
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.text).toBe('enhanced result')
      expect(fetchMock).toHaveBeenCalledTimes(1)
      const calledUrl = fetchMock.mock.calls[0][0] as string
      expect(calledUrl).toBe('https://project.supabase.co/functions/v1/enhance-prompt')
    } finally {
      if (originalSupabaseUrl === undefined) {
        delete process.env.NEXT_PUBLIC_SUPABASE_URL
      } else {
        process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl
      }
      if (originalSupabaseUrl2 === undefined) {
        delete process.env.SUPABASE_URL
      } else {
        process.env.SUPABASE_URL = originalSupabaseUrl2
      }
    }
  })

  it('falls back to Netlify function when no Supabase URL is configured', async () => {
    const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const originalSupabaseUrl2 = process.env.SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.SUPABASE_URL

    try {
      const { POST } = await import('@/app/api/proxy/openai-enhance/route')

      const req = new NextRequest('http://localhost/api/proxy/openai-enhance', {
        method: 'POST',
        body: JSON.stringify({ prompt: 'make it better' }),
      })

      const res = await POST(req)

      expect(res.status).toBe(200)
      expect(fetchMock).toHaveBeenCalledTimes(1)
      const calledUrl = fetchMock.mock.calls[0][0] as string
      expect(calledUrl).toBe('/.netlify/functions/enhance-prompt')
    } finally {
      if (originalSupabaseUrl === undefined) {
        delete process.env.NEXT_PUBLIC_SUPABASE_URL
      } else {
        process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl
      }
      if (originalSupabaseUrl2 === undefined) {
        delete process.env.SUPABASE_URL
      } else {
        process.env.SUPABASE_URL = originalSupabaseUrl2
      }
    }
  })

  it('forwards the OpenAI API key via x-openai-key header', async () => {
    const { POST } = await import('@/app/api/proxy/openai-enhance/route')

    const req = new NextRequest('http://localhost/api/proxy/openai-enhance', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'make it better' }),
    })

    await POST(req)

    const calls = recordedCalls(fetchMock)
    expect(calls).toHaveLength(1)
    expect(calls[0].headers['x-openai-key']).toBe('test-openai-key')
  })

  it('forwards the request payload with the resolved model', async () => {
    const { POST } = await import('@/app/api/proxy/openai-enhance/route')

    const req = new NextRequest('http://localhost/api/proxy/openai-enhance', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'make it better', mode: 'enhance', model: 'gpt-4o-mini' }),
    })

    await POST(req)

    const calls = recordedCalls(fetchMock)
    expect(calls).toHaveLength(1)
    expect(calls[0].body).toBeDefined()
    const sentBody = JSON.parse(calls[0].body as string)
    expect(sentBody.prompt).toBe('make it better')
    expect(sentBody.mode).toBe('enhance')
    expect(sentBody.model).toBe('gpt-4o-mini')
  })

  it('forwards the client-provided model verbatim and does NOT override it from server env', async () => {
    // The openai-enhance proxy is a thin passthrough: it JSON-forwards the
    // request body verbatim to the Supabase Edge function / Netlify function.
    // It does not resolve or override the model. SMARTVIDEO_PERSONALIZATION_MODEL
    // is not consumed by this route (it is an upstream enhance-prompt concern),
    // so the client-selected model must survive unchanged even when the env var
    // is set.
    const originalModel = process.env.SMARTVIDEO_PERSONALIZATION_MODEL
    process.env.SMARTVIDEO_PERSONALIZATION_MODEL = 'gpt-4-turbo'

    try {
      const { POST } = await import('@/app/api/proxy/openai-enhance/route')

      const req = new NextRequest('http://localhost/api/proxy/openai-enhance', {
        method: 'POST',
        body: JSON.stringify({ prompt: 'make it better', model: 'gpt-4o-mini' }),
      })

      await POST(req)

      const calls = recordedCalls(fetchMock)
      expect(calls).toHaveLength(1)
      const sentBody = JSON.parse(calls[0].body as string)
      expect(sentBody.model).toBe('gpt-4o-mini')
    } finally {
      if (originalModel === undefined) {
        delete process.env.SMARTVIDEO_PERSONALIZATION_MODEL
      } else {
        process.env.SMARTVIDEO_PERSONALIZATION_MODEL = originalModel
      }
    }
  })

  it('propagates a successful upstream response', async () => {
    vi.restoreAllMocks()
    const successMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      async json() { return { text: 'enhanced result', model: 'gpt-4o' } },
      async text() { return JSON.stringify({ text: 'enhanced result', model: 'gpt-4o' }) },
    }))
    vi.spyOn(globalThis, 'fetch').mockImplementation(successMock)

    const { POST } = await import('@/app/api/proxy/openai-enhance/route')

    const req = new NextRequest('http://localhost/api/proxy/openai-enhance', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'make it better' }),
    })

    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.text).toBe('enhanced result')
    expect(json.model).toBe('gpt-4o')
  })

  it('propagates upstream 500 error response', async () => {
    vi.restoreAllMocks()
    const errorMock = vi.fn(async () => ({
      ok: false,
      status: 500,
      headers: new Headers({ 'content-type': 'application/json' }),
      async json() { return { error: 'upstream failed' } },
      async text() { return JSON.stringify({ error: 'upstream failed' }) },
    }))
    vi.spyOn(globalThis, 'fetch').mockImplementation(errorMock)

    const { POST } = await import('@/app/api/proxy/openai-enhance/route')

    const req = new NextRequest('http://localhost/api/proxy/openai-enhance', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'make it better' }),
    })

    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json.error).toBe('upstream failed')
  })

  it('returns 500 on upstream network failure', async () => {
    vi.restoreAllMocks()
    const failMock = vi.fn(async () => {
      throw new Error('ECONNREFUSED')
    })
    vi.spyOn(globalThis, 'fetch').mockImplementation(failMock)

    const { POST } = await import('@/app/api/proxy/openai-enhance/route')

    const req = new NextRequest('http://localhost/api/proxy/openai-enhance', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'make it better' }),
    })

    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json).toHaveProperty('error')
    expect(json.error).toBe('ECONNREFUSED')
  })

  it('returns 401 when user is unauthenticated', async () => {
    vi.doMock('@clerk/nextjs/server', () => ({
      auth: vi.fn(async () => ({ userId: null })),
    }))

    const { POST } = await import('@/app/api/proxy/openai-enhance/route')

    const req = new NextRequest('http://localhost/api/proxy/openai-enhance', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'make it better' }),
    })

    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json.error).toBe('UNAUTHENTICATED')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns 401 when OpenAI API key is missing for the user', async () => {
    vi.doMock('@/src/lib/openaiKeyServer', () => ({
      getOpenAiKeyForUser: vi.fn(async () => null),
    }))

    const { POST } = await import('@/app/api/proxy/openai-enhance/route')

    const req = new NextRequest('http://localhost/api/proxy/openai-enhance', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'make it better' }),
    })

    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json.error).toBe('UNAUTHENTICATED')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns 403 when SMARTVIDEO_GO entitlement is missing', async () => {
    vi.doMock('@/access/apiRequireEntitlement', () => ({
      requireApiEntitlement: vi.fn(async () => ({ allowed: false, status: 403 as const, entitlement: 'smartvideo_go' })),
      entitlementForbiddenResponse: vi.fn(() => new Response(JSON.stringify({ error: 'PAYMENT_REQUIRED' }), { status: 403 })),
    }))

    const { POST } = await import('@/app/api/proxy/openai-enhance/route')

    const req = new NextRequest('http://localhost/api/proxy/openai-enhance', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'make it better' }),
    })

    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(403)
    expect(json.error).toBe('PAYMENT_REQUIRED')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('does NOT use MuAPI for text enhancement', async () => {
    const { POST } = await import('@/app/api/proxy/openai-enhance/route')

    const req = new NextRequest('http://localhost/api/proxy/openai-enhance', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'make it better' }),
    })

    await POST(req)

    const calls = recordedCalls(fetchMock)
    expect(calls).toHaveLength(1)
    const calledUrl = calls[0].url
    expect(calledUrl).not.toContain('muapi.ai')
    expect(calledUrl).not.toContain('/api/v1/')
  })
})
