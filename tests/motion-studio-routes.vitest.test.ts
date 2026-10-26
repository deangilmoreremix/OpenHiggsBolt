import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { MOTION_TEMPLATES } from '@/data/motionRecipeCatalog'

/**
 * /api/motion-studio/capture and /api/motion-studio/director with every
 * external dependency mocked: Clerk, the entitlement check, the guarded
 * browser, Supabase storage, the user's OpenAI key and OpenAI itself.
 */

class FakeSsrfError extends Error {}

let userId: string | null = 'user_1'
let entitled = true
const upload = vi.fn()
const capture = vi.fn()
const realFetch = globalThis.fetch

function mockCommon() {
  vi.doMock('@clerk/nextjs/server', () => ({ auth: async () => ({ userId }) }))
  vi.doMock('@/access/apiRequireEntitlement', () => ({
    requireApiEntitlement: async () => (userId ? (entitled ? { allowed: true } : { allowed: false, status: 403 }) : { allowed: false, status: 401 }),
    entitlementForbiddenResponse: () => new Response(JSON.stringify({ error: 'FORBIDDEN' }), { status: 403 }),
  }))
  vi.doMock('@/access/entitlements', () => ({ ENTITLEMENTS: { SMARTVIDEO_GO: 'smartvideo_go' } }))
}

const post = (path: string, body: unknown, cookie?: string) =>
  new NextRequest(new URL(`http://localhost${path}`), {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  })

beforeEach(() => {
  vi.resetModules()
  userId = 'user_1'
  entitled = true
  upload.mockReset().mockResolvedValue({ error: null })
  capture.mockReset().mockResolvedValue({
    url: 'https://acme.test/',
    title: 'Acme',
    page: Buffer.from('page'),
    pageHeight: 1746,
    crops: [Buffer.from('c1'), Buffer.from('c2')],
    images: [Buffer.from('i1')],
    logo: Buffer.from('logo'),
    brand: { background: '#ffffff', text: '#111111', accent: '#ff5500', fontFamily: 'Inter' },
  })
  mockCommon()
  vi.doMock('@/src/server/browserDiscovery', () => ({
    BrowserSsrfError: FakeSsrfError,
    capturePageScreenshots: capture,
    CAPTURE_VIEWPORT: { width: 1920, height: 1080 },
    CAPTURE_DEVICE_SCALE: 2,
  }))
  vi.doMock('@/lib/supabase', () => ({
    createServerClient: () => ({
      storage: {
        from: () => ({
          upload,
          getPublicUrl: (path: string) => ({ data: { publicUrl: `https://storage.test/${path}` } }),
        }),
      },
    }),
  }))
})

afterEach(() => {
  globalThis.fetch = realFetch
})

describe('POST /api/motion-studio/capture', () => {
  it('captures the page and returns stored URLs under the caller prefix', async () => {
    const { POST } = await import('@/app/api/motion-studio/capture/route')
    const res = await POST(post('/api/motion-studio/capture', { url: 'acme.test' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(capture).toHaveBeenCalledWith('https://acme.test')
    expect(body.page.url).toMatch(/^https:\/\/storage\.test\/user_1\/motion-capture\/[^/]+\/page\.jpg$/)
    expect(body.crops).toHaveLength(2)
    expect(body.images).toEqual([expect.stringMatching(/\/image-1\.jpg$/)])
    expect(body.logo).toMatch(/\/logo\.png$/)
    expect(body.page).toMatchObject({ width: 3840, height: 3492 })
    expect(body.brand.accent).toBe('#ff5500')
    expect(body.transient).toBe(false)
    expect(upload).toHaveBeenCalledTimes(5) // page, 2 crops, 1 site image, logo
  })

  it('requires a signed-in user', async () => {
    userId = null
    const { POST } = await import('@/app/api/motion-studio/capture/route')
    const res = await POST(post('/api/motion-studio/capture', { url: 'https://acme.test' }))
    expect(res.status).toBe(401)
    expect(capture).not.toHaveBeenCalled()
  })

  it('requires the SmartVideo GO entitlement', async () => {
    entitled = false
    const { POST } = await import('@/app/api/motion-studio/capture/route')
    const res = await POST(post('/api/motion-studio/capture', { url: 'https://acme.test' }))
    expect(res.status).toBe(403)
    expect(capture).not.toHaveBeenCalled()
  })

  it('refuses addresses the SSRF gate rejects', async () => {
    capture.mockRejectedValueOnce(new FakeSsrfError('private address'))
    const { POST } = await import('@/app/api/motion-studio/capture/route')
    const res = await POST(post('/api/motion-studio/capture', { url: 'http://169.254.169.254/' }))
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('URL_REJECTED')
    expect(upload).not.toHaveBeenCalled()
  })

  it('rejects a missing URL', async () => {
    const { POST } = await import('@/app/api/motion-studio/capture/route')
    const res = await POST(post('/api/motion-studio/capture', {}))
    expect(res.status).toBe(400)
  })
})

describe('POST /api/motion-studio/director', () => {
  const shot = MOTION_TEMPLATES[0]

  function mockOpenAi(output: unknown, status = 200) {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify(status === 200 ? { output_text: JSON.stringify(output) } : { error: { message: 'bad key' } }), { status }),
    )
    globalThis.fetch = fetchMock as unknown as typeof fetch
    return fetchMock
  }

  it('returns a validated storyboard using the user key', async () => {
    vi.doMock('@/src/lib/openaiKeyServer', () => ({ getOpenAiKeyForUser: async () => 'sk-user' }))
    const fetchMock = mockOpenAi({
      title: 'Acme',
      summary: '',
      palette: { background: '#ffffff', text: '#000000', accent: '#ff0000' },
      scenes: [
        { kind: 'title', recipeId: '', durationSec: 3, headline: 'Acme', caption: '', transition: 'cut' },
        { kind: 'shot', recipeId: shot.id, durationSec: 5, headline: 'Fast', caption: '', transition: 'cut' },
        { kind: 'shot', recipeId: 'invented/one/Fake', durationSec: 5, headline: 'x', caption: '', transition: 'cut' },
      ],
    })
    const { POST } = await import('@/app/api/motion-studio/director/route')
    const res = await POST(post('/api/motion-studio/director', { mode: 'plan', prompt: 'Launch film', durationSec: 10 }))
    expect(res.status).toBe(200)
    const { plan } = await res.json()
    expect(plan.scenes.map((s: { recipeId: string }) => s.recipeId)).toEqual(['', shot.id])
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer sk-user')
    const sent = JSON.parse(String(init.body))
    expect(sent.text.format).toMatchObject({ type: 'json_schema', strict: true })
    expect(sent.instructions).toContain(shot.id)
  })

  it('asks for a key when the user has none', async () => {
    vi.doMock('@/src/lib/openaiKeyServer', () => ({ getOpenAiKeyForUser: async () => null }))
    const { POST } = await import('@/app/api/motion-studio/director/route')
    const res = await POST(post('/api/motion-studio/director', { mode: 'plan', prompt: 'x' }))
    expect(res.status).toBe(401)
    expect((await res.json()).error).toBe('OPENAI_KEY_REQUIRED')
  })

  it('validates edit ops against the clips it was sent', async () => {
    vi.doMock('@/src/lib/openaiKeyServer', () => ({ getOpenAiKeyForUser: async () => 'sk-user' }))
    mockOpenAi({
      reply: 'Renamed it.',
      ops: [
        { op: 'set_text', clipId: 'c1', recipeId: '', seconds: 0, text: 'New headline', background: '', accent: '' },
        { op: 'remove', clipId: 'other', recipeId: '', seconds: 0, text: '', background: '', accent: '' },
      ],
    })
    const { POST } = await import('@/app/api/motion-studio/director/route')
    const res = await POST(post('/api/motion-studio/director', { mode: 'edit', instruction: 'rename the opener', clips: [{ id: 'c1', recipe: 'title', seconds: 2 }] }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ reply: 'Renamed it.', ops: [{ op: 'set_text', clipId: 'c1', text: 'New headline' }] })
  })

  it('maps a rejected OpenAI key to 401', async () => {
    vi.doMock('@/src/lib/openaiKeyServer', () => ({ getOpenAiKeyForUser: async () => 'sk-bad' }))
    mockOpenAi({}, 401)
    const { POST } = await import('@/app/api/motion-studio/director/route')
    const res = await POST(post('/api/motion-studio/director', { mode: 'plan', prompt: 'x' }))
    expect(res.status).toBe(401)
    expect((await res.json()).code).toBe('OPENAI_KEY_REJECTED')
  })

  it('requires a signed-in user before calling OpenAI', async () => {
    userId = null
    vi.doMock('@/src/lib/openaiKeyServer', () => ({ getOpenAiKeyForUser: async () => 'sk-user' }))
    const fetchMock = mockOpenAi({})
    const { POST } = await import('@/app/api/motion-studio/director/route')
    const res = await POST(post('/api/motion-studio/director', { mode: 'plan', prompt: 'x' }))
    expect(res.status).toBe(401)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
