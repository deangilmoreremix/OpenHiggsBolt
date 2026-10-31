import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { NextRequest } from 'next/server'

/**
 * The background capture: the route hands the capture to the Netlify background function and the client polls
 * a job record; the worker writes that record; the function checks its caller. Supabase storage is an in-memory
 * map, the guarded browser is a mock.
 */
class FakeSsrfError extends Error {}

// The asset finder crawls the real site: tests stay offline.
vi.mock('../src/server/motionAssets', () => ({ findMotionAssets: vi.fn(async () => []) }))

let userId: string | null = 'user_1'
const files = new Map<string, string | Buffer>()
const capture = vi.fn()
const guardCheck = vi.fn()
const realFetch = globalThis.fetch
const savedEnv = { NETLIFY: process.env.NETLIFY, INTERNAL_FUNCTION_SECRET: process.env.INTERNAL_FUNCTION_SECRET }

const storage = {
  upload: vi.fn(async (path: string, body: string | Buffer) => {
    files.set(path, body)
    return { error: null }
  }),
  getPublicUrl: (path: string) => ({ data: { publicUrl: `https://storage.test/${path}` } }),
  download: async (path: string) => {
    const body = files.get(path)
    return body === undefined ? { data: null, error: { message: 'not found' } } : { data: { text: async () => String(body) }, error: null }
  },
}

function mockCommon() {
  vi.doMock('@clerk/nextjs/server', () => ({ auth: async () => ({ userId }) }))
  vi.doMock('@/access/apiRequireEntitlement', () => ({ requireApiEntitlement: async () => ({ allowed: true }), entitlementForbiddenResponse: () => new Response('{}', { status: 403 }) }))
  vi.doMock('@/access/entitlements', () => ({ ENTITLEMENTS: { SMARTVIDEO_GO: 'smartvideo_go' } }))
  vi.doMock('@/lib/supabase', () => ({ createServerClient: () => ({ storage: { from: () => storage } }) }))
  vi.doMock('@/src/server/browserDiscovery', () => ({
    BrowserSsrfError: FakeSsrfError,
    capturePageScreenshots: capture,
    createSsrfGuard: () => ({ validateNavigationTarget: guardCheck }),
    captureHasWords: (c: { title?: string; content?: { headline?: string } }) => Boolean(c.title || c.content?.headline),
    CAPTURE_VIEWPORT: { width: 1920, height: 1080 },
    CAPTURE_DEVICE_SCALE: 2,
  }))
}

const req = (method: string, path: string, body?: unknown) =>
  new NextRequest(new URL(`http://localhost${path}`), { method, headers: { 'content-type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) })

const fullCapture = {
  url: 'https://acme.test/', title: 'Acme', page: Buffer.from('page'), pageHeight: 1746, crops: [Buffer.from('c1')], images: [], logo: Buffer.from('logo'),
  content: { headline: 'Ship faster', description: '', headings: [], ctas: [], nav: [] }, brand: { background: '#fff', text: '#111', accent: null, fontFamily: null },
}

beforeEach(() => {
  vi.resetModules()
  userId = 'user_1'
  files.clear()
  storage.upload.mockClear()
  capture.mockReset().mockResolvedValue(fullCapture)
  guardCheck.mockReset().mockResolvedValue({ hostname: 'acme.test' })
  process.env.NETLIFY = 'true'
  process.env.INTERNAL_FUNCTION_SECRET = 's3cret'
  mockCommon()
})

afterEach(() => {
  globalThis.fetch = realFetch
  for (const [k, v] of Object.entries(savedEnv)) {
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  }
})

describe('POST /api/motion-studio/capture on the host', () => {
  it('starts the background function and answers with a job id at once', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 202 }))
    globalThis.fetch = fetchMock as unknown as typeof fetch
    const { POST } = await import('@/app/api/motion-studio/capture/route')
    const res = await POST(req('POST', '/api/motion-studio/capture', { url: 'acme.test' }))
    expect(res.status).toBe(202)
    const { jobId, state } = await res.json()
    expect(state).toBe('running')
    const [worker, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(worker).toBe('http://localhost/.netlify/functions/motion-studio-capture-background')
    expect((init.headers as Record<string, string>)['x-internal-service-token']).toBe('s3cret')
    expect(JSON.parse(String(init.body))).toEqual({ jobId, userId: 'user_1', url: 'https://acme.test' })
    expect(capture).not.toHaveBeenCalled()
    expect(JSON.parse(String(files.get(`user_1/motion-capture-jobs/${jobId}.json`)))).toMatchObject({ state: 'running' })
  })

  it('starts it in production even when the host does not set NETLIFY', async () => {
    delete process.env.NETLIFY
    vi.stubEnv('NODE_ENV', 'production')
    globalThis.fetch = vi.fn(async () => new Response(null, { status: 202 })) as unknown as typeof fetch
    const { POST } = await import('@/app/api/motion-studio/capture/route')
    const res = await POST(req('POST', '/api/motion-studio/capture', { url: 'acme.test' }))
    vi.unstubAllEnvs()
    expect(res.status).toBe(202)
  })

  it('captures inside the request when the background function cannot be started', async () => {
    globalThis.fetch = vi.fn(async () => new Response(null, { status: 500 })) as unknown as typeof fetch
    const { POST } = await import('@/app/api/motion-studio/capture/route')
    const res = await POST(req('POST', '/api/motion-studio/capture', { url: 'acme.test' }))
    expect(res.status).toBe(200)
    expect(capture).toHaveBeenCalled()
  })

  it('refuses an address the guard rejects before starting anything', async () => {
    guardCheck.mockRejectedValue(new FakeSsrfError('private'))
    const fetchMock = vi.fn()
    globalThis.fetch = fetchMock as unknown as typeof fetch
    const { POST } = await import('@/app/api/motion-studio/capture/route')
    const res = await POST(req('POST', '/api/motion-studio/capture', { url: 'http://10.0.0.1' }))
    expect(res.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('captures inside the request when no internal secret is configured', async () => {
    delete process.env.INTERNAL_FUNCTION_SECRET
    vi.resetModules()
    mockCommon()
    const { POST } = await import('@/app/api/motion-studio/capture/route')
    const res = await POST(req('POST', '/api/motion-studio/capture', { url: 'acme.test' }))
    expect(res.status).toBe(200)
  })
})

describe('GET /api/motion-studio/capture/status', () => {
  const jobId = '11111111-2222-4333-8444-555555555555'
  const record = { state: 'done', finishedAt: 'now', capture: { title: 'Acme' } }

  it('returns the job of the user it was started for, and nobody else', async () => {
    files.set(`user_1/motion-capture-jobs/${jobId}.json`, JSON.stringify(record))
    const { GET } = await import('@/app/api/motion-studio/capture/status/route')
    const mine = await GET(req('GET', `/api/motion-studio/capture/status?jobId=${jobId}`))
    expect(mine.status).toBe(200)
    expect(await mine.json()).toMatchObject({ state: 'done', capture: { title: 'Acme' } })
    userId = 'user_2'
    expect((await GET(req('GET', `/api/motion-studio/capture/status?jobId=${jobId}`))).status).toBe(404)
  })

  it('reports a job stuck on running (its worker died) as an error', async () => {
    const old = new Date(Date.now() - 10 * 60_000).toISOString()
    files.set(`user_1/motion-capture-jobs/${jobId}.json`, JSON.stringify({ state: 'running', startedAt: old }))
    const { GET } = await import('@/app/api/motion-studio/capture/status/route')
    expect(await (await GET(req('GET', `/api/motion-studio/capture/status?jobId=${jobId}`))).json()).toMatchObject({ state: 'error', code: 'CAPTURE_STOPPED' })
    files.set(`user_1/motion-capture-jobs/${jobId}.json`, JSON.stringify({ state: 'running', startedAt: new Date().toISOString() }))
    expect(await (await GET(req('GET', `/api/motion-studio/capture/status?jobId=${jobId}`))).json()).toMatchObject({ state: 'running' })
  })

  it('answers 404 for an unknown or malformed job id', async () => {
    const { GET } = await import('@/app/api/motion-studio/capture/status/route')
    expect((await GET(req('GET', `/api/motion-studio/capture/status?jobId=${jobId}`))).status).toBe(404)
    expect((await GET(req('GET', '/api/motion-studio/capture/status?jobId=../../etc'))).status).toBe(404)
  })
})

describe('the background worker', () => {
  const job = { jobId: '11111111-2222-4333-8444-555555555555', userId: 'user_1', url: 'https://acme.test' }
  const recordOf = () => JSON.parse(String(files.get(`user_1/motion-capture-jobs/${job.jobId}.json`)))

  it('captures with the long budget, stores the images and writes a done record', async () => {
    const { runMotionCapture } = await import('@/src/server/motionCaptureWorker')
    await runMotionCapture(job, storage)
    expect(capture).toHaveBeenCalledWith('https://acme.test', expect.objectContaining({ hardMs: 300_000, budgetMs: 240_000, deep: true }))
    const done = recordOf()
    expect(done.state).toBe('done')
    expect(done.capture.page.url).toMatch(/^https:\/\/storage\.test\/user_1\/motion-capture\/.+\/page\.jpg$/)
    expect(done.capture.partial).toBe(false)
  })

  it('writes an error record when nothing could be read, or the capture throws, or the address is refused', async () => {
    const { runMotionCapture } = await import('@/src/server/motionCaptureWorker')
    capture.mockResolvedValueOnce({ ...fullCapture, page: null, title: '', content: { headline: '', description: '', headings: [], ctas: [], nav: [] } })
    await runMotionCapture(job, storage)
    expect(recordOf()).toMatchObject({ state: 'error', code: 'CAPTURE_FAILED' })
    // Fails twice (the fast failure is retried once): the record says why, without the address, and how far it got.
    capture.mockRejectedValueOnce(new Error('boom')).mockRejectedValueOnce(Object.assign(new Error('navigation to https://acme.test/x failed\nstack'), { timing: { loaded: 9606 } }))
    await runMotionCapture(job, storage)
    expect(recordOf()).toMatchObject({ state: 'error', code: 'CAPTURE_FAILED', error: 'The page could not be captured: navigation to the address failed', timing: { loaded: 9606 } })
    capture.mockRejectedValueOnce(new FakeSsrfError('private'))
    await runMotionCapture(job, storage)
    expect(recordOf()).toMatchObject({ state: 'error', code: 'URL_REJECTED' })
  })

  it('tries a capture that fails fast once more, within the same budget', async () => {
    const { runMotionCapture } = await import('@/src/server/motionCaptureWorker')
    capture.mockRejectedValueOnce(new Error('browser failed to launch'))
    await runMotionCapture(job, storage)
    expect(capture).toHaveBeenCalledTimes(2)
    expect(capture.mock.calls[1][1].hardMs).toBeLessThanOrEqual(300_000)
    expect(recordOf().state).toBe('done')
  })

  it('writes one timed-out record when the capture hangs, and a late result does not overwrite it', async () => {
    const { runMotionCapture } = await import('@/src/server/motionCaptureWorker')
    let finishLate: (v: unknown) => void = () => undefined
    capture.mockReturnValueOnce(new Promise((resolve) => { finishLate = resolve }))
    await runMotionCapture(job, storage, { watchdogMs: 20 })
    expect(recordOf()).toMatchObject({ state: 'error', code: 'TIMEOUT' })
    finishLate(fullCapture)
    await new Promise((r) => setTimeout(r, 20))
    expect(recordOf()).toMatchObject({ state: 'error', code: 'TIMEOUT' })
  })

  it('the watchdog waits for a final record still being saved: kept when it lands, replaced when it fails', async () => {
    const { runMotionCapture } = await import('@/src/server/motionCaptureWorker')
    const slowDone = (outcome: 'ok' | 'fail') =>
      storage.upload.mockImplementation(async (path: string, body: string | Buffer) => {
        if (String(body).includes('"state":"done"')) {
          await new Promise((r) => setTimeout(r, 40))
          if (outcome === 'fail') return { error: { message: 'storage down' } }
        }
        files.set(path, body)
        return { error: null }
      })
    slowDone('ok')
    await runMotionCapture(job, storage, { watchdogMs: 10 })
    expect(recordOf().state).toBe('done')
    files.clear()
    slowDone('fail')
    await runMotionCapture(job, storage, { watchdogMs: 10 })
    expect(recordOf()).toMatchObject({ state: 'error', code: 'TIMEOUT' })
    storage.upload.mockImplementation(async (path: string, body: string | Buffer) => {
      files.set(path, body)
      return { error: null }
    })
  })

  it('accepts only well-formed jobs', async () => {
    const { parseJobRequest } = await import('@/src/server/motionCaptureWorker')
    expect(parseJobRequest(job)).toEqual(job)
    expect(parseJobRequest({ ...job, jobId: 'x' })).toBeNull()
    expect(parseJobRequest({ ...job, url: 'file:///etc/passwd' })).toBeNull()
    expect(parseJobRequest({ ...job, userId: '' })).toBeNull()
    expect(parseJobRequest(null)).toBeNull()
  })
})

describe('the Netlify function', () => {
  const load = () => {
    // The function loads the compiled worker, as on the host (`prebuild` builds it).
    execFileSync('node', ['scripts/build-motion-capture.mjs'], { stdio: 'ignore' })
    process.env.INTERNAL_FUNCTION_SECRET = 's3cret'
    const fresh = createRequire(import.meta.url)
    const path = fresh.resolve('../netlify/functions/motion-studio-capture-background.js')
    delete fresh.cache[path]
    return fresh(path).handler as (event: { headers?: Record<string, string>; body?: string }) => Promise<{ statusCode: number }>
  }

  it('rejects a caller without the internal token, and a malformed job', async () => {
    const handler = load()
    expect((await handler({ headers: {}, body: '{}' })).statusCode).toBe(401)
    expect((await handler({ headers: { 'x-internal-service-token': 'wrong' }, body: '{}' })).statusCode).toBe(401)
    expect((await handler({ headers: { 'x-internal-service-token': 's3cret' }, body: '{"jobId":"x"}' })).statusCode).toBe(400)
    expect((await handler({ headers: { 'x-internal-service-token': 's3cret' }, body: 'not json' })).statusCode).toBe(400)
  })
})
