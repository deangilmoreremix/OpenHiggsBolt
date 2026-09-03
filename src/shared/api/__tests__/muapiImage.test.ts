import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  MuAPIImageClient,
  getImageClient,
  DEFAULT_IMAGE_MODEL,
  type MuAPIImageStatusResponse,
} from '../muapiImage'

// ── Helpers ──────────────────────────────────────────────────────────────────

const BASE = 'https://api.muapi.ai'
const FLUX_ENDPOINT = `${BASE}/api/v1/flux-dev-image`

/** A minimal stand-in for a browser File/Blob that satisfies the runtime checks
 * (the source only reads `.type` and `.size`). Cast through unknown to keep the
 * linter happy without using an explicit `any`. */
function makeFile(type: string, size: number) {
  return { type, size, name: 'x', slice: () => new Blob() } as unknown as File
}

/** Build a fetch mock that records calls and returns scripted responses. */
function makeFetch() {
  const fetchMock = vi.fn(async () => {
    return {
      ok: true,
      status: 200,
      async json() {
        return { request_id: 'req-123' } as MuAPIImageStatusResponse
      },
      async text() {
        return ''
      },
    }
  })
  return fetchMock
}

/** Derive the recorded {url, method, headers, body} tuples from a vi mock.
 * vi records every call regardless of which implementation (once/always) ran. */
function recordedCalls(fetchMock: ReturnType<typeof vi.fn>) {
  return fetchMock.mock.calls.map((args) => {
    const input = args[0] as RequestInfo | URL
    const init = args[1] as RequestInit | undefined
    const url = typeof input === 'string' ? input : input.toString()
    const headers: Record<string, string> = {}
    if (init?.headers) {
      const h = init.headers as Record<string, string>
      for (const k of Object.keys(h)) headers[k.toLowerCase()] = h[k]
    }
    return { url, method: init?.method, headers, body: init?.body as string | undefined }
  })
}

function completedResponse(url: string): Response {
  const data: MuAPIImageStatusResponse = { status: 'completed', url }
  return {
    ok: true,
    status: 200,
    async json() {
      return data
    },
    async text() {
      return JSON.stringify(data)
    },
  } as Response
}

/** A submit (POST) response that returns only a request_id (no inline image). */
function submitResponse(requestId: string): Response {
  const data: MuAPIImageStatusResponse = { request_id: requestId }
  return {
    ok: true,
    status: 200,
    async json() {
      return data
    },
    async text() {
      return ''
    },
  } as Response
}

/** A poll (GET) response reporting a terminal `failed` status. */
function failedResponse(error: string): Response {
  const data: MuAPIImageStatusResponse = { status: 'failed', error }
  return {
    ok: true,
    status: 200,
    async json() {
      return data
    },
    async text() {
      return JSON.stringify(data)
    },
  } as Response
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('MuAPIImageClient — construction & factory', () => {
  it('exposes the default image model', () => {
    expect(DEFAULT_IMAGE_MODEL).toBe('flux-dev')
  })

  it('throws when constructed with an empty apiKey', () => {
    expect(() => new MuAPIImageClient({ apiKey: '' })).toThrow(/MuAPI key is required/)
  })

  it('getImageClient() throws when called with no/empty key', () => {
    expect(() => getImageClient('')).toThrow(/MuAPI key is required/)
    expect(() => getImageClient()).toThrow(/MuAPI key is required/)
  })

  it('constructs successfully with a key', () => {
    const c = new MuAPIImageClient({ apiKey: '  test-key  ' })
    expect(c).toBeInstanceOf(MuAPIImageClient)
  })
})

describe('MuAPIImageClient.generate — submit + poll happy path', () => {
  let originalFetch: typeof fetch

  beforeEach(() => {
    originalFetch = global.fetch
  })
  afterEach(() => {
    global.fetch = originalFetch
  })

  it('POSTs to the flux-dev endpoint with x-api-key and the prompt', async () => {
    const fetchMock = makeFetch()
    global.fetch = fetchMock as unknown as typeof fetch

    const client = new MuAPIImageClient({ apiKey: 'k', pollIntervalMs: 1, maxPollAttempts: 3 })
    // First call (POST submit) returns request_id; subsequent calls (GET poll) return completed.
    fetchMock.mockImplementationOnce(async () => ({
      ok: true,
      status: 200,
      async json() {
        return { request_id: 'req-abc' } as MuAPIImageStatusResponse
      },
      async text() {
        return ''
      },
    }))
    fetchMock.mockImplementationOnce(async () => completedResponse('https://cdn.example.com/a.png'))

    const res = await client.generate({ prompt: 'a cat', model: 'flux-dev' })

    expect(res).toHaveLength(1)
    expect(res[0].url).toBe('https://cdn.example.com/a.png')

    const calls = recordedCalls(fetchMock)
    const submit = calls.find((c) => c.method === 'POST')
    expect(submit?.url).toBe(FLUX_ENDPOINT)
    expect(submit?.headers['x-api-key']).toBe('k')
    const body = JSON.parse(submit?.body ?? '{}')
    expect(body.prompt).toBe('a cat')
    expect(body.aspect_ratio).toBeUndefined()

    const poll = calls.find((c) => c.url.includes('/predictions/'))
    expect(poll?.url).toBe(`${BASE}/api/v1/predictions/req-abc/result`)
    expect(poll?.method).toBe('GET')
    expect(poll?.headers['x-api-key']).toBe('k')
  })

  it('sends aspect_ratio for seedream-5.0', async () => {
    const fetchMock = makeFetch()
    global.fetch = fetchMock as unknown as typeof fetch

    fetchMock.mockImplementationOnce(async () => ({
      ok: true,
      status: 200,
      async json() {
        return { request_id: 'r1' } as MuAPIImageStatusResponse
      },
      async text() {
        return ''
      },
    }))
    fetchMock.mockImplementationOnce(async () => completedResponse('https://x/y.png'))

    const client = new MuAPIImageClient({
      apiKey: 'k',
      pollIntervalMs: 1,
      maxPollAttempts: 3,
    })
    await client.generate({
      prompt: 'neon city',
      model: 'seedream-5.0',
      aspectRatio: '16:9',
      quality: 'high',
    })

    const calls = recordedCalls(fetchMock)
    const submit = calls.find((c) => c.method === 'POST')
    expect(submit?.url).toBe(`${BASE}/api/v1/seedream-5.0`)
    const body = JSON.parse(submit?.body ?? '{}')
    expect(body.prompt).toBe('neon city')
    expect(body.aspect_ratio).toBe('16:9')
    // seedream family sends its (mapped) quality enum.
    expect(body.quality).toBe('high')
  })

  it('sends image_url + strength for image-to-image generation', async () => {
    const fetchMock = makeFetch()
    global.fetch = fetchMock as unknown as typeof fetch

    fetchMock.mockImplementationOnce(async () => ({
      ok: true,
      status: 200,
      async json() {
        return { request_id: 'r2' } as MuAPIImageStatusResponse
      },
      async text() {
        return ''
      },
    }))
    fetchMock.mockImplementationOnce(async () => completedResponse('https://x/z.png'))

    const client = new MuAPIImageClient({ apiKey: 'k', pollIntervalMs: 1, maxPollAttempts: 3 })
    await client.generate({
      prompt: 'variation',
      model: 'flux-dev',
      imageUrl: 'https://src.example.com/in.png',
      strength: 0.4,
    })

    const calls = recordedCalls(fetchMock)
    const body = JSON.parse(calls.find((c) => c.method === 'POST')?.body ?? '{}')
    expect(body.image_url).toBe('https://src.example.com/in.png')
    expect(body.strength).toBe(0.4)
  })
})

describe('MuAPIImageClient.generate — result extraction shapes', () => {
  let originalFetch: typeof fetch
  beforeEach(() => {
    originalFetch = global.fetch
  })
  afterEach(() => {
    global.fetch = originalFetch
  })

  const runWithPoll = async (pollData: MuAPIImageStatusResponse) => {
    const fetchMock = vi.fn()
    fetchMock.mockImplementationOnce(async () => ({
      ok: true,
      status: 200,
      async json() {
        return { request_id: 'r' } as MuAPIImageStatusResponse
      },
      async text() {
        return ''
      },
    }))
    fetchMock.mockImplementationOnce(async () => ({
      ok: true,
      status: 200,
      async json() {
        return pollData
      },
      async text() {
        return JSON.stringify(pollData)
      },
    }))
    global.fetch = fetchMock as unknown as typeof fetch
    const client = new MuAPIImageClient({ apiKey: 'k', pollIntervalMs: 1, maxPollAttempts: 3 })
    return client.generate({ prompt: 'p' })
  }

  it('extracts a top-level url', async () => {
    const res = await runWithPoll({ status: 'completed', url: 'https://a/1.png' })
    expect(res[0].url).toBe('https://a/1.png')
  })

  it('extracts a nested data.url', async () => {
    const res = await runWithPoll({ status: 'completed', data: { url: 'https://a/2.png' } })
    expect(res[0].url).toBe('https://a/2.png')
  })

  it('extracts from an outputs string array', async () => {
    const res = await runWithPoll({ status: 'completed', outputs: ['https://a/3.png'] })
    expect(res[0].url).toBe('https://a/3.png')
  })

  it('extracts from a nested data.outputs', async () => {
    const res = await runWithPoll({
      status: 'completed',
      data: { outputs: ['https://a/4.png'] },
    })
    expect(res[0].url).toBe('https://a/4.png')
  })

  it('extracts from an output.url object', async () => {
    const res = await runWithPoll({ status: 'completed', output: { url: 'https://a/5.png' } })
    expect(res[0].url).toBe('https://a/5.png')
  })

  it('generates n images by looping the request', async () => {
    const fetchMock = vi.fn()
    fetchMock.mockImplementationOnce(async () => ({
      ok: true,
      status: 200,
      async json() {
        return { request_id: 'r' } as MuAPIImageStatusResponse
      },
      async text() {
        return ''
      },
    }))
    fetchMock.mockImplementation(async () => completedResponse('https://a/n.png'))
    global.fetch = fetchMock as unknown as typeof fetch

    const client = new MuAPIImageClient({ apiKey: 'k', pollIntervalMs: 1, maxPollAttempts: 3 })
    const res = await client.generate({ prompt: 'p', n: 3 })

    expect(res).toHaveLength(3)
    expect(res.every((r) => r.url === 'https://a/n.png')).toBe(true)
    // 3 submits (POST) + 3 polls (GET) = 6 fetch calls.
    expect(fetchMock.mock.calls.filter((c) => c[1]?.method === 'POST')).toHaveLength(3)
  })
})

describe('MuAPIImageClient.generate — error paths', () => {
  let originalFetch: typeof fetch
  beforeEach(() => {
    originalFetch = global.fetch
  })
  afterEach(() => {
    global.fetch = originalFetch
  })

  const failStatus = (status: number, text = '') => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status,
      async json() {
        return {}
      },
      async text() {
        return text
      },
    }))
    global.fetch = fetchMock as unknown as typeof fetch
    return fetchMock
  }

  it('throws "Invalid MuAPI key" on HTTP 401', async () => {
    failStatus(401)
    const client = new MuAPIImageClient({ apiKey: 'k', pollIntervalMs: 1, maxPollAttempts: 3 })
    await expect(client.generate({ prompt: 'p' })).rejects.toThrow(/Invalid MuAPI key/)
  })

  it('throws "Invalid MuAPI key" on HTTP 403', async () => {
    failStatus(403)
    const client = new MuAPIImageClient({ apiKey: 'k', pollIntervalMs: 1, maxPollAttempts: 3 })
    await expect(client.generate({ prompt: 'p' })).rejects.toThrow(/Invalid MuAPI key/)
  })

  it('throws "Rate limit" on HTTP 429', async () => {
    failStatus(429)
    const client = new MuAPIImageClient({ apiKey: 'k', pollIntervalMs: 1, maxPollAttempts: 3 })
    await expect(client.generate({ prompt: 'p' })).rejects.toThrow(/Rate limit/)
  })

  it('throws the upstream error message when the poll reports failed', async () => {
    const fetchMock = vi.fn()
    fetchMock.mockImplementationOnce(async () => ({
      ok: true,
      status: 200,
      async json() {
        return { request_id: 'r' } as MuAPIImageStatusResponse
      },
      async text() {
        return ''
      },
    }))
    fetchMock.mockImplementationOnce(async () => ({
      ok: true,
      status: 200,
      async json() {
        return { status: 'failed', error: 'model exploded' } as MuAPIImageStatusResponse
      },
      async text() {
        return ''
      },
    }))
    global.fetch = fetchMock as unknown as typeof fetch
    const client = new MuAPIImageClient({ apiKey: 'k', pollIntervalMs: 1, maxPollAttempts: 3 })
    await expect(client.generate({ prompt: 'p' })).rejects.toThrow(/model exploded/)
  })

  it('throws "timed out" when polling never completes', async () => {
    const fetchMock = vi.fn()
    fetchMock.mockImplementationOnce(async () => ({
      ok: true,
      status: 200,
      async json() {
        return { request_id: 'r' } as MuAPIImageStatusResponse
      },
      async text() {
        return ''
      },
    }))
    fetchMock.mockImplementation(async () => ({
      ok: true,
      status: 200,
      async json() {
        return { status: 'queued' } as MuAPIImageStatusResponse
      },
      async text() {
        return ''
      },
    }))
    global.fetch = fetchMock as unknown as typeof fetch
    const client = new MuAPIImageClient({ apiKey: 'k', pollIntervalMs: 1, maxPollAttempts: 2 })
    await expect(client.generate({ prompt: 'p' })).rejects.toThrow(/timed out/)
  })
})

describe('MuAPIImageClient.uploadImage', () => {
  let originalXHR: typeof XMLHttpRequest
  let created: MockXHR[]

  // Minimal XHR mock mirroring the surface the source uses. Each construction is
  // recorded so tests can assert on the headers/URL the source set.
  class MockXHR {
    url = ''
    method = ''
    headers: Record<string, string> = {}
    status = 200
    responseText = '{"url":"https://uploaded.example.com/img.png"}'
    upload: { onprogress?: (e: { lengthComputable: boolean; loaded: number; total: number }) => void } = {}
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    onabort: (() => void) | null = null
    constructor() {
      created.push(this)
    }
    open(method: string, url: string) {
      this.method = method
      this.url = url
    }
    setRequestHeader(k: string, v: string) {
      this.headers[k.toLowerCase()] = v
    }
    send() {
      if (this.onload) this.onload()
    }
  }

  beforeEach(() => {
    originalXHR = global.XMLHttpRequest
    created = []
    global.XMLHttpRequest = MockXHR as unknown as typeof XMLHttpRequest
  })
  afterEach(() => {
    global.XMLHttpRequest = originalXHR
  })

  it('uploads a valid PNG and returns the hosted url with x-api-key header', async () => {
    const client = new MuAPIImageClient({ apiKey: 'up-key' })
    const url = await client.uploadImage(makeFile('image/png', 1024))
    expect(url).toMatch(/^https?:\/\//)

    const inst = created[0]
    expect(inst.headers['x-api-key']).toBe('up-key')
    expect(inst.url).toBe(`${BASE}/api/v1/upload_file`)
    expect(inst.method).toBe('POST')
  })

  it('rejects disallowed file types', async () => {
    const client = new MuAPIImageClient({ apiKey: 'k' })
    await expect(client.uploadImage(makeFile('application/pdf', 10))).rejects.toThrow(/Invalid file type/)
  })

  it('rejects files larger than 10MB', async () => {
    const client = new MuAPIImageClient({ apiKey: 'k' })
    await expect(
      client.uploadImage(makeFile('image/png', 11 * 1024 * 1024)),
    ).rejects.toThrow(/File too large/)
  })

  it('rejects with "Invalid MuAPI key" on HTTP 401', async () => {
    class FailingXHR extends MockXHR {
      override send() {
        this.status = 401
        this.responseText = '{"detail":"bad key"}'
        if (this.onload) this.onload()
      }
    }
    global.XMLHttpRequest = FailingXHR as unknown as typeof XMLHttpRequest
    const client = new MuAPIImageClient({ apiKey: 'k' })
    await expect(client.uploadImage(makeFile('image/png', 10))).rejects.toThrow(/Invalid MuAPI key/)
  })
})

// ── New behavior after hardening (concurrent n, partial/all-fail, backoff,
//    json guard, concurrent cancel, proxy base) ────────────────────────────────

describe('MuAPIImageClient.generate — concurrent n + partial/all-fail', () => {
  let originalFetch: typeof fetch
  beforeEach(() => {
    originalFetch = global.fetch
  })
  afterEach(() => {
    global.fetch = originalFetch
  })

  it('runs n:3 concurrently and resolves 3 distinct URLs', async () => {
    const fetchMock = vi.fn()
    fetchMock.mockImplementationOnce(() => submitResponse('req-1'))
    fetchMock.mockImplementationOnce(() => submitResponse('req-2'))
    fetchMock.mockImplementationOnce(() => submitResponse('req-3'))
    fetchMock.mockImplementationOnce(() => completedResponse('https://cdn/1.png'))
    fetchMock.mockImplementationOnce(() => completedResponse('https://cdn/2.png'))
    fetchMock.mockImplementation(() => completedResponse('https://cdn/3.png'))
    global.fetch = fetchMock as unknown as typeof fetch

    const client = new MuAPIImageClient({ apiKey: 'k', pollIntervalMs: 5, maxPollAttempts: 20 })
    const res = await client.generate({ prompt: 'p', n: 3 })

    expect(res).toHaveLength(3)
    expect(new Set(res.map((r) => r.url)).size).toBe(3)

    const calls = recordedCalls(fetchMock)
    // All 3 submits (POSTs to flux-dev) are issued before any poll begins.
    const posts = calls.filter((c) => c.method === 'POST')
    expect(posts).toHaveLength(3)
    expect(posts.every((c) => c.url === FLUX_ENDPOINT)).toBe(true)
    const firstPollIdx = calls.findIndex((c) => c.url.includes('/predictions/'))
    expect(firstPollIdx).toBeGreaterThanOrEqual(3)
  })

  it('resolves a partial result (length 1) when one of n:2 polls fails', async () => {
    const fetchMock = vi.fn()
    fetchMock.mockImplementationOnce(() => submitResponse('req-a'))
    fetchMock.mockImplementationOnce(() => submitResponse('req-b'))
    fetchMock.mockImplementationOnce(() => completedResponse('https://cdn/ok.png'))
    fetchMock.mockImplementation(() => failedResponse('boom'))
    global.fetch = fetchMock as unknown as typeof fetch

    const client = new MuAPIImageClient({ apiKey: 'k', pollIntervalMs: 5, maxPollAttempts: 10 })
    const res = await client.generate({ prompt: 'p', n: 2 })

    expect(res).toHaveLength(1)
    expect(res[0].url).toBe('https://cdn/ok.png')
  })

  it('throws when all n:2 generations fail', async () => {
    const fetchMock = vi.fn()
    fetchMock.mockImplementationOnce(() => submitResponse('req-a'))
    fetchMock.mockImplementationOnce(() => submitResponse('req-b'))
    fetchMock.mockImplementationOnce(() => failedResponse('err-a'))
    fetchMock.mockImplementation(() => failedResponse('err-b'))
    global.fetch = fetchMock as unknown as typeof fetch

    const client = new MuAPIImageClient({ apiKey: 'k', pollIntervalMs: 5, maxPollAttempts: 10 })
    await expect(client.generate({ prompt: 'p', n: 2 })).rejects.toThrow(/err-a/)
  })
})

describe('MuAPIImageClient.generate — poll resilience & guards', () => {
  let originalFetch: typeof fetch
  beforeEach(() => {
    originalFetch = global.fetch
  })
  afterEach(() => {
    global.fetch = originalFetch
  })

  it('retries a transient 5xx and still succeeds', async () => {
    const fetchMock = vi.fn()
    fetchMock.mockImplementationOnce(() => submitResponse('req-x'))
    fetchMock.mockImplementationOnce(async () => ({
      ok: false,
      status: 500,
      async json() {
        return {}
      },
      async text() {
        return 'server error'
      },
    }))
    fetchMock.mockImplementation(() => completedResponse('https://cdn/backoff.png'))
    global.fetch = fetchMock as unknown as typeof fetch

    const client = new MuAPIImageClient({ apiKey: 'k', pollIntervalMs: 5, maxPollAttempts: 20 })
    const res = await client.generate({ prompt: 'p' })

    expect(res).toHaveLength(1)
    expect(res[0].url).toBe('https://cdn/backoff.png')
    // At least one failed (500) attempt followed by a successful poll.
    const polls = fetchMock.mock.calls.filter((c) => c[1]?.method === 'GET')
    expect(polls.length).toBeGreaterThanOrEqual(2)
  })

  it('rejects with "Invalid response from MuAPI" on a non-JSON poll body', async () => {
    const fetchMock = vi.fn()
    fetchMock.mockImplementationOnce(() => submitResponse('req-j'))
    fetchMock.mockImplementationOnce(async () => ({
      ok: true,
      status: 200,
      async json() {
        throw new SyntaxError('Unexpected token < in JSON at position 0')
      },
      async text() {
        return '<html>not json</html>'
      },
    }))
    global.fetch = fetchMock as unknown as typeof fetch

    const client = new MuAPIImageClient({ apiKey: 'k', pollIntervalMs: 5, maxPollAttempts: 5 })
    await expect(client.generate({ prompt: 'p' })).rejects.toThrow(/Invalid response from MuAPI/)
  })
})

describe('MuAPIImageClient — concurrent cancel', () => {
  it('aborts all in-flight controllers and rejects without hanging', async () => {
    const originalFetch = global.fetch
    const abortSpy = vi.spyOn(AbortController.prototype, 'abort')

    // Capture every AbortController the client creates so we can observe abort.
    const controllers: AbortController[] = []
    const RealAbortController = globalThis.AbortController
    const ctorSpy = vi
      .spyOn(globalThis, 'AbortController')
      .mockImplementation(() => {
        const c = new RealAbortController()
        controllers.push(c)
        return c
      })

    // The submit POST holds until any in-flight controller is aborted, then
    // rejects with an AbortError — exactly what cancel() triggers.
    const fetchMock = vi.fn(async () => {
      await new Promise<void>((resolve) => {
        if (controllers.some((c) => c.signal.aborted)) return resolve()
        const check = setInterval(() => {
          if (controllers.some((c) => c.signal.aborted)) {
            clearInterval(check)
            resolve()
          }
        }, 1)
        // Safety valve so the test can never hang.
        setTimeout(() => {
          clearInterval(check)
          resolve()
        }, 3000)
      })
      throw new DOMException('The operation was aborted', 'AbortError')
    })
    global.fetch = fetchMock as unknown as typeof fetch

    const client = new MuAPIImageClient({ apiKey: 'k', pollIntervalMs: 5, maxPollAttempts: 10 })
    const p = client.generate({ prompt: 'p', n: 2 })
    // Let generate() create + register its controllers before cancelling.
    await new Promise((r) => setTimeout(r, 0))
    client.cancel()

    await expect(p).rejects.toThrow(/cancelled/i)
    expect(abortSpy).toHaveBeenCalledTimes(2)

    ctorSpy.mockRestore()
    abortSpy.mockRestore()
    global.fetch = originalFetch
  })
})

describe('MuAPIImageClient — proxy baseUrl override', () => {
  let originalFetch: typeof fetch
  beforeEach(() => {
    originalFetch = global.fetch
  })
  afterEach(() => {
    global.fetch = originalFetch
  })

  // `this.baseUrl = options.baseUrl ?? MUAPI_BASE` and `MUAPI_BASE` is honored
  // when SET (even to ''), so an EMPTY baseUrl yields a RELATIVE `/api/v1/...`
  // path that routes through the app's existing `/api/v1/*` proxy (middleware.js).
  // A non-empty baseUrl is honored verbatim (custom proxy / direct host).
  it('an empty baseUrl yields a relative /api/v1 path (app proxy)', async () => {
    const fetchMock = vi.fn()
    fetchMock.mockImplementationOnce(() => submitResponse('req-proxy'))
    fetchMock.mockImplementation(() => completedResponse('https://cdn/p.png'))
    global.fetch = fetchMock as unknown as typeof fetch

    const client = new MuAPIImageClient({ apiKey: 'k', baseUrl: '', pollIntervalMs: 5, maxPollAttempts: 10 })
    const res = await client.generate({ prompt: 'p' })

    expect(res[0].url).toBe('https://cdn/p.png')
    const calls = recordedCalls(fetchMock)
    const submit = calls.find((c) => c.method === 'POST')
    expect(submit?.url).toBe('/api/v1/flux-dev-image')
    expect(submit?.headers['x-api-key']).toBe('k')
  })

  it('a custom (proxy) baseUrl is honored verbatim', async () => {
    const PROXY = 'https://proxy.example.com'
    const fetchMock = vi.fn()
    fetchMock.mockImplementationOnce(() => submitResponse('req-proxy'))
    fetchMock.mockImplementation(() => completedResponse('https://cdn/p.png'))
    global.fetch = fetchMock as unknown as typeof fetch

    const client = new MuAPIImageClient({ apiKey: 'k', baseUrl: PROXY, pollIntervalMs: 5, maxPollAttempts: 10 })
    const res = await client.generate({ prompt: 'p' })

    expect(res[0].url).toBe('https://cdn/p.png')
    const calls = recordedCalls(fetchMock)
    const submit = calls.find((c) => c.method === 'POST')
    expect(submit?.url).toBe(`${PROXY}/api/v1/flux-dev-image`)
    expect(submit?.headers['x-api-key']).toBe('k')
  })
})
