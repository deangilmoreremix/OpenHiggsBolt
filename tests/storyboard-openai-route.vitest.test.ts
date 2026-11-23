/**
 * app/api/storyboard/openai/route.ts: storyboard panels from OpenAI image models with the user's own key.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

let userId: string | null = 'user_1'
let openAiKey: string | null = 'sk-test'
vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn(async () => ({ userId })) }))
vi.mock('@/access/apiRequireEntitlement', () => ({
  requireApiEntitlement: vi.fn(async () => ({ allowed: true })),
  entitlementForbiddenResponse: vi.fn(),
}))
vi.mock('@/src/lib/openaiKeyServer', () => ({ getOpenAiKeyForUser: vi.fn(async () => openAiKey) }))
vi.mock('@/src/lib/networkSafety', () => ({
  checkDestination: vi.fn(async () => ({ ok: false, reason: 'blocked' })),
  createPinnedFetch: vi.fn(),
}))

import { GET, POST } from '../app/api/storyboard/openai/route'

const PNG_DATA_URL = `data:image/png;base64,${Buffer.from('fake-png').toString('base64')}`
const request = (body: Record<string, unknown>) =>
  new NextRequest('http://localhost/api/storyboard/openai', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

const fetchMock = vi.fn()
beforeEach(() => {
  userId = 'user_1'
  openAiKey = 'sk-test'
  delete process.env.STORYBOARD_OPENAI_MODELS
  delete process.env.STORYBOARD_OPENAI_MODEL
  fetchMock.mockReset()
  fetchMock.mockImplementation(async () => new Response(JSON.stringify({ data: [{ b64_json: 'QUJD' }, { b64_json: 'REVG' }] }), { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

describe('storyboard openai route', () => {
  it('rejects signed-out callers and a missing OpenAI key', async () => {
    userId = null
    expect((await POST(request({ prompt: 'x' }))).status).toBe(401)
    expect((await GET()).status).toBe(401)
    userId = 'user_1'
    openAiKey = null
    const res = await POST(request({ prompt: 'x' }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/OpenAI API key/)
  })

  it('generates one panel from text with the default Flare model', async () => {
    const res = await POST(request({ prompt: 'Wide shot of a lighthouse', aspect_ratio: '9:16', quality: 'high' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.urls).toEqual(['data:image/png;base64,QUJD'])
    expect(data.model).toBe('gpt-image-2.5-flare')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.openai.com/v1/images/generations')
    expect(JSON.parse(init.body)).toMatchObject({ model: 'gpt-image-2.5-flare', n: 1, size: '1024x1536', quality: 'high' })
  })

  it('uses images/edits with the panel and references, the edited panel first', async () => {
    const res = await POST(request({ prompt: 'Make it night', model: 'gpt-image-2.5-sunburst', image_url: PNG_DATA_URL, reference_urls: [PNG_DATA_URL, `data:image/png;base64,${Buffer.from('other').toString('base64')}`] }))
    expect(res.status).toBe(200)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.openai.com/v1/images/edits')
    const form = init.body as FormData
    expect(form.get('model')).toBe('gpt-image-2.5-sunburst')
    expect(form.getAll('image[]')).toHaveLength(2) // the duplicate data url is sent once
  })

  it('refuses a model that is not on the list', async () => {
    const res = await POST(request({ prompt: 'x', model: 'dall-e-2' }))
    expect(res.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('accepts extra models from STORYBOARD_OPENAI_MODELS and can default to one', async () => {
    process.env.STORYBOARD_OPENAI_MODELS = 'gpt-image-2.6-flare:Flare 2.6 (fast)'
    process.env.STORYBOARD_OPENAI_MODEL = 'gpt-image-2.6-flare'
    const list = await (await GET()).json()
    expect(list.models[0]).toEqual({ id: 'gpt-image-2.6-flare', label: 'Flare 2.6 (fast)' })
    expect(list.default).toBe('gpt-image-2.6-flare')
    const res = await POST(request({ prompt: 'x' }))
    expect(res.status).toBe(200)
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).model).toBe('gpt-image-2.6-flare')
  })

  it('maps a rejected key and upstream failures to clear errors', async () => {
    fetchMock.mockImplementationOnce(async () => new Response(JSON.stringify({ error: { message: 'bad key' } }), { status: 401 }))
    const res = await POST(request({ prompt: 'x' }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/rejected/)
  })

  it('requires a prompt', async () => {
    expect((await POST(request({ prompt: '   ' }))).status).toBe(400)
  })
})
