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

  it('offers Images 2.6 (sunburst and flare) and sends the chosen model', async () => {
    for (const model of ['gpt-image-2.6-sunburst', 'gpt-image-2.6-flare']) {
      fetchMock.mockClear()
      const res = await POST(request({ action: 'generate', prompt: 'Bold', model }))
      expect(res.status).toBe(200)
      expect(JSON.parse(fetchMock.mock.calls[0][1].body).model).toBe(model)
      expect((await res.json()).model).toBe(model)
    }
  })

  it('falls back to GPT Image 2 when the 2.6 model is not available to the key, and says so', async () => {
    fetchMock.mockReset()
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { message: 'The model `gpt-image-2.6-sunburst` does not exist or you do not have access to it.' } }), { status: 404 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [{ b64_json: 'QUJD' }] }), { status: 200 }))
    const res = await POST(request({ action: 'generate', prompt: 'Bold', model: 'gpt-image-2.6-sunburst' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.model).toBe('gpt-image-2')
    expect(data.fallback_from).toBe('gpt-image-2.6-sunburst')
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).model).toBe('gpt-image-2')
  })

  it('does not hide other errors behind the fallback', async () => {
    fetchMock.mockReset()
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: { message: 'Rate limit reached' } }), { status: 429 }))
    const res = await POST(request({ action: 'generate', prompt: 'Bold', model: 'gpt-image-2.6-flare' }))
    expect(res.status).toBe(429)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('passes an inpainting mask to images/edits on refine', async () => {
    const MASK = `data:image/png;base64,${Buffer.from('mask').toString('base64')}`
    const res = await POST(request({ action: 'refine', prompt: 'Replace the sky', image_url: PNG_DATA_URL, mask_url: MASK }))
    expect(res.status).toBe(200)
    const form = fetchMock.mock.calls[0][1].body as FormData
    expect(form.get('mask')).toBeTruthy()
    expect(form.getAll('image[]')).toHaveLength(1)
  })

  it('rejects a mask that is not a PNG', async () => {
    const res = await POST(request({ action: 'refine', prompt: 'x', image_url: PNG_DATA_URL, mask_url: 'data:image/jpeg;base64,QUJD' }))
    expect(res.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('passes quality xhigh, a custom size and complexity (Images 2.6 only) to OpenAI', async () => {
    const res = await POST(request({ action: 'generate', prompt: 'Bold', model: 'gpt-image-2.6-sunburst', quality: 'xhigh', complexity: 'medium', size: '1536x864', background: 'opaque', output_format: 'webp', output_compression: 80 }))
    expect(res.status).toBe(200)
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body).toMatchObject({ model: 'gpt-image-2.6-sunburst', quality: 'xhigh', complexity: 'medium', size: '1536x864', background: 'opaque', output_format: 'webp', output_compression: 80 })
  })

  it('does not send complexity to models that do not have it', async () => {
    const res = await POST(request({ action: 'generate', prompt: 'Bold', model: 'gpt-image-2', complexity: 'high' }))
    expect(res.status).toBe(200)
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).complexity).toBeUndefined()
  })

  it('rejects bad size, complexity and compression values before calling OpenAI', async () => {
    for (const extra of [{ size: '1000x1000' }, { size: '3840x640' }, { complexity: 'extreme' }, { output_compression: 50 }, { background: 'transparent', output_format: 'jpeg' }]) {
      fetchMock.mockClear()
      const res = await POST(request({ action: 'generate', prompt: 'x', ...extra }))
      expect(res.status, JSON.stringify(extra)).toBe(400)
      expect(fetchMock).not.toHaveBeenCalled()
    }
  })

  it('uses the custom size for edits too', async () => {
    const res = await POST(request({ action: 'refine', prompt: 'x', image_url: PNG_DATA_URL, size: '1536x864' }))
    expect(res.status).toBe(200)
    expect((fetchMock.mock.calls[0][1].body as FormData).get('size')).toBe('1536x864')
  })
})
