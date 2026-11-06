/**
 * app/api/proxy/thumbnail-generate/route.ts — the Social Publish modal's
 * Thumbnail step (used by every studio) calls this route. It must reach
 * OpenAI itself instead of the edge functions that were never shipped.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn(async () => ({ userId: 'user_1' })) }))
vi.mock('@/access/apiRequireEntitlement', () => ({
  requireApiEntitlement: vi.fn(async () => ({ allowed: true })),
  entitlementForbiddenResponse: vi.fn(),
}))
vi.mock('@/src/lib/openaiKeyServer', () => ({ getOpenAiKeyForUser: vi.fn(async () => 'sk-test') }))
vi.mock('@/src/lib/networkSafety', () => ({
  checkDestination: vi.fn(async () => ({ ok: false, reason: 'blocked' })),
  createPinnedFetch: vi.fn(),
}))

import { POST } from '../app/api/proxy/thumbnail-generate/route'

const PNG_DATA_URL = `data:image/png;base64,${Buffer.from('fake-png').toString('base64')}`

function request(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/proxy/thumbnail-generate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  fetchMock.mockImplementation(async () =>
    new Response(JSON.stringify({ data: [{ b64_json: 'QUJD' }, { b64_json: 'REVG' }] }), { status: 200 }),
  )
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('thumbnail-generate route', () => {
  it('generates from text with OpenAI images/generations at the requested ratio', async () => {
    const res = await POST(request({ action: 'generate', prompt: 'Bold product shot', model: 'gpt-image-2', aspect_ratio: '16:9', n: 2 }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.urls).toEqual(['data:image/png;base64,QUJD', 'data:image/png;base64,REVG'])

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.openai.com/v1/images/generations')
    expect(init.headers.Authorization).toBe('Bearer sk-test')
    const sent = JSON.parse(init.body)
    expect(sent).toMatchObject({ model: 'gpt-image-2', n: 2, size: '1536x1024' })
    expect(sent.prompt).toContain('Bold product shot')
  })

  it('uses images/edits with the studio output when reference images are sent', async () => {
    const res = await POST(request({ action: 'generate', prompt: 'Thumbnail', model: 'dall-e-3', aspect_ratio: '9:16', reference_urls: [PNG_DATA_URL] }))
    expect(res.status).toBe(200)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.openai.com/v1/images/edits')
    const form = init.body as FormData
    // dall-e-3 cannot edit, so the route switches to the default gpt-image model.
    expect(form.get('model')).toBe('gpt-image-2')
    expect(form.get('size')).toBe('1024x1536')
    expect(form.getAll('image[]')).toHaveLength(1)
  })

  it('refines the selected thumbnail through images/edits', async () => {
    const res = await POST(request({ action: 'refine', prompt: 'More contrast', image_url: PNG_DATA_URL }))
    expect(res.status).toBe(200)
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.openai.com/v1/images/edits')
  })

  it('rejects reference URLs that fail the network safety check', async () => {
    const res = await POST(request({ action: 'generate', prompt: 'x', reference_urls: ['https://169.254.169.254/latest'] }))
    expect(res.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('tells the user to add a key when none is stored', async () => {
    const { getOpenAiKeyForUser } = await import('@/src/lib/openaiKeyServer')
    vi.mocked(getOpenAiKeyForUser).mockResolvedValueOnce(null)
    const res = await POST(request({ action: 'generate', prompt: 'x' }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/OpenAI API key/)
  })
})
