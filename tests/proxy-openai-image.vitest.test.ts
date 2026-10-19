import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

function makeUpstreamResponse(overrides: Record<string, unknown> = {}) {
  return vi.fn(async () => ({
    ok: true,
    status: 200,
    headers: new Headers({ 'content-type': 'application/json' }),
    async json() {
      return {
        data: [{ url: 'https://cdn.openai.com/image.png', revised_prompt: 'revised' }],
        ...overrides,
      }
    },
    async text() {
      return JSON.stringify({
        data: [{ url: 'https://cdn.openai.com/image.png', revised_prompt: 'revised' }],
        ...overrides,
      })
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
        : init?.body && typeof init?.body === 'object' && typeof (init?.body as any).getReader === 'function'
          ? '[ReadableStream]'
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
    getOpenAiKeyForUser: vi.fn(async () => 'sk-test-openai-key'),
  }))

})

afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

// ── POST /api/proxy/openai-image ──────────────────────────────────────────────

describe('POST /api/proxy/openai-image', () => {
  it('routes JSON body to https://api.openai.com/v1/images/generations', async () => {
    const { POST } = await import('@/app/api/proxy/openai-image/route')

    const req = new NextRequest('http://localhost/api/proxy/openai-image', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'a cat', n: 1 }),
    })

    await POST(req)

    const calls = recordedCalls(fetchMock)
    expect(calls).toHaveLength(1)
    expect(calls[0].url).toBe('https://api.openai.com/v1/images/generations')
    expect(calls[0].method).toBe('POST')
  })

  it('routes multipart FormData to https://api.openai.com/v1/images/edits', async () => {
    const { POST } = await import('@/app/api/proxy/openai-image/route')

    const form = new FormData()
    form.append('prompt', 'make it red')
    form.append('image[]', new Blob(['fake-image'], { type: 'image/png' }), 'image.png')

    const req = new NextRequest('http://localhost/api/proxy/openai-image', {
      method: 'POST',
      body: form,
    })

    await POST(req)

    const calls = recordedCalls(fetchMock)
    expect(calls).toHaveLength(1)
    expect(calls[0].url).toBe('https://api.openai.com/v1/images/edits')
    expect(calls[0].method).toBe('POST')
  })

  it('forwards the OpenAI API key via Authorization Bearer header', async () => {
    const { POST } = await import('@/app/api/proxy/openai-image/route')

    const req = new NextRequest('http://localhost/api/proxy/openai-image', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'a cat' }),
    })

    await POST(req)

    const calls = recordedCalls(fetchMock)
    expect(calls).toHaveLength(1)
    expect(calls[0].headers['authorization']).toBe('Bearer sk-test-openai-key')
  })

  it('forwards JSON payload without _endpoint field to upstream', async () => {
    const { POST } = await import('@/app/api/proxy/openai-image/route')

    const req = new NextRequest('http://localhost/api/proxy/openai-image', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'a cat', n: 2, size: '1024x1024' }),
    })

    await POST(req)

    const calls = recordedCalls(fetchMock)
    expect(calls).toHaveLength(1)
    const sentBody = calls[0].body
    expect(sentBody).toBeDefined()
    const parsed = JSON.parse(sentBody as string)
    expect(parsed.prompt).toBe('a cat')
    expect(parsed.n).toBe(2)
    expect(parsed.size).toBe('1024x1024')
    expect(parsed).not.toHaveProperty('_endpoint')
  })

  it('overrides endpoint when _endpoint is supplied in JSON body', async () => {
    const { POST } = await import('@/app/api/proxy/openai-image/route')

    const req = new NextRequest('http://localhost/api/proxy/openai-image', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'test', _endpoint: 'images/generations' }),
    })

    await POST(req)

    const calls = recordedCalls(fetchMock)
    expect(calls).toHaveLength(1)
    expect(calls[0].url).toBe('https://api.openai.com/v1/images/generations')
  })

  it('preserves multipart content-type and forwards FormData body as-is', async () => {
    const { POST } = await import('@/app/api/proxy/openai-image/route')

    const form = new FormData()
    form.append('prompt', 'test prompt')
    form.append('image[]', new Blob(['img'], { type: 'image/png' }), 'photo.png')

    const req = new NextRequest('http://localhost/api/proxy/openai-image', {
      method: 'POST',
      body: form,
    })

    await POST(req)

    const calls = recordedCalls(fetchMock)
    expect(calls).toHaveLength(1)
    expect(calls[0].headers['content-type']).toMatch(/^multipart\/form-data/)
    expect(calls[0].body).toBeDefined()
  })

  it('propagates successful upstream JSON response', async () => {
    const successPayload = {
      data: [
        { url: 'https://cdn.openai.com/img1.png', revised_prompt: 'a cute cat' },
      ],
    }
    vi.restoreAllMocks()
    const successMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      async json() { return successPayload },
      async text() { return JSON.stringify(successPayload) },
    }))
    vi.spyOn(globalThis, 'fetch').mockImplementation(successMock)

    const { POST } = await import('@/app/api/proxy/openai-image/route')

    const req = new NextRequest('http://localhost/api/proxy/openai-image', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'a cat' }),
    })

    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.data).toEqual(successPayload.data)
    expect(json.data[0].revised_prompt).toBe('a cute cat')
  })

  it('propagates upstream 400 error with JSON body', async () => {
    vi.restoreAllMocks()
    const errorMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      headers: new Headers({ 'content-type': 'application/json' }),
      async json() { return { error: { message: 'Invalid request', code: 'invalid_request_error' } } },
      async text() { return JSON.stringify({ error: { message: 'Invalid request', code: 'invalid_request_error' } }) },
    }))
    vi.spyOn(globalThis, 'fetch').mockImplementation(errorMock)

    const { POST } = await import('@/app/api/proxy/openai-image/route')

    const req = new NextRequest('http://localhost/api/proxy/openai-image', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'bad request' }),
    })

    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error.message).toBe('Invalid request')
  })

  it('propagates upstream 401 error response', async () => {
    vi.restoreAllMocks()
    const errorMock = vi.fn(async () => ({
      ok: false,
      status: 401,
      headers: new Headers({ 'content-type': 'application/json' }),
      async json() { return { error: { message: 'Incorrect API key provided', type: 'invalid_request_error' } } },
      async text() { return JSON.stringify({ error: { message: 'Incorrect API key provided', type: 'invalid_request_error' } }) },
    }))
    vi.spyOn(globalThis, 'fetch').mockImplementation(errorMock)

    const { POST } = await import('@/app/api/proxy/openai-image/route')

    const req = new NextRequest('http://localhost/api/proxy/openai-image', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'test' }),
    })

    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json.error.message).toBe('Incorrect API key provided')
  })

  it('propagates upstream 500 error response', async () => {
    vi.restoreAllMocks()
    const errorMock = vi.fn(async () => ({
      ok: false,
      status: 500,
      headers: new Headers({ 'content-type': 'application/json' }),
      async json() { return { error: { message: 'OpenAI server error', type: 'server_error' } } },
      async text() { return JSON.stringify({ error: { message: 'OpenAI server error', type: 'server_error' } }) },
    }))
    vi.spyOn(globalThis, 'fetch').mockImplementation(errorMock)

    const { POST } = await import('@/app/api/proxy/openai-image/route')

    const req = new NextRequest('http://localhost/api/proxy/openai-image', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'test' }),
    })

    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json.error.message).toBe('OpenAI server error')
  })

  it('returns 500 on upstream network failure', async () => {
    vi.restoreAllMocks()
    const failMock = vi.fn(async () => {
      throw new Error('ECONNREFUSED')
    })
    vi.spyOn(globalThis, 'fetch').mockImplementation(failMock)

    const { POST } = await import('@/app/api/proxy/openai-image/route')

    const req = new NextRequest('http://localhost/api/proxy/openai-image', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'test' }),
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

    const { POST } = await import('@/app/api/proxy/openai-image/route')

    const req = new NextRequest('http://localhost/api/proxy/openai-image', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'test' }),
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

    const { POST } = await import('@/app/api/proxy/openai-image/route')

    const req = new NextRequest('http://localhost/api/proxy/openai-image', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'test' }),
    })

    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json.error).toBe('UNAUTHENTICATED')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('does NOT use MuAPI for OpenAI image operations', async () => {
    const { POST } = await import('@/app/api/proxy/openai-image/route')

    const req = new NextRequest('http://localhost/api/proxy/openai-image', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'a cat' }),
    })

    await POST(req)

    const calls = recordedCalls(fetchMock)
    expect(calls).toHaveLength(1)
    const calledUrl = calls[0].url
    expect(calledUrl).not.toContain('muapi.ai')
    expect(calledUrl).not.toContain('/api/v1/')
    expect(calledUrl).toContain('api.openai.com')
  })

  it('does NOT call MuAPI for multipart image edits', async () => {
    const { POST } = await import('@/app/api/proxy/openai-image/route')

    const form = new FormData()
    form.append('prompt', 'edit test')
    form.append('image[]', new Blob(['img'], { type: 'image/png' }), 'edit.png')

    const req = new NextRequest('http://localhost/api/proxy/openai-image', {
      method: 'POST',
      body: form,
    })

    await POST(req)

    const calls = recordedCalls(fetchMock)
    expect(calls).toHaveLength(1)
    const calledUrl = calls[0].url
    expect(calledUrl).not.toContain('muapi.ai')
    expect(calledUrl).not.toContain('/api/v1/')
    expect(calledUrl).toContain('api.openai.com')
  })
})
