import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

let authUserId: string | null = 'user-123'
let entitlementAllowed = true
let openAiKey: string | null = 'sk-test'
let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.resetModules()

  authUserId = 'user-123'
  entitlementAllowed = true
  openAiKey = 'sk-test'

  vi.doMock('@clerk/nextjs/server', () => ({
    auth: vi.fn(async () => ({ userId: authUserId })),
  }))

  vi.doMock('@/access/apiRequireEntitlement', () => ({
    requireApiEntitlement: vi.fn(async () => ({
      allowed: entitlementAllowed,
      status: entitlementAllowed ? 200 : 403,
    })),
    entitlementForbiddenResponse: vi.fn(() => new Response(JSON.stringify({ error: 'FORBIDDEN' }), {
      status: 403,
      headers: { 'content-type': 'application/json' },
    })),
  }))

  vi.doMock('@/access/entitlements', () => ({
    ENTITLEMENTS: { SMARTVIDEO_GO: 'smartvideo_go' },
  }))

  vi.doMock('@/src/lib/openaiKeyServer', () => ({
    getOpenAiKeyForUser: vi.fn(async () => openAiKey),
  }))

  vi.doMock('@/lib/rateLimit', () => ({
    rateLimit: vi.fn(() => ({ allowed: true, remaining: 11, retryAfterMs: 0 })),
    rateLimit429: vi.fn(() => new Response(JSON.stringify({ error: 'rate limited' }), {
      status: 429,
      headers: { 'content-type': 'application/json' },
    })),
  }))

  fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
    expect(init?.method).toBe('POST')
    expect(init?.headers).toEqual({ Authorization: 'Bearer sk-test' })
    expect(init?.body).toBeInstanceOf(FormData)

    const form = init?.body as FormData
    expect(form.get('operation')).toBeNull()
    expect(form.get('model')).toBe('gpt-image-2.5-sunburst')
    expect(form.get('n')).toBe('1')
    expect(form.get('input_fidelity')).toBe('high')
    expect(form.get('image[]')).toBeInstanceOf(File)

    return {
      ok: true,
      status: 200,
      async json() {
        return { data: [{ b64_json: 'ZmFrZQ==' }] }
      },
    } as Response
  })

  vi.spyOn(globalThis, 'fetch').mockImplementation(fetchMock)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

function createRequest(overrides: Record<string, string> = {}) {
  const form = new FormData()
  form.append('operation', overrides.operation || 'remove_background')
  form.append('prompt', overrides.prompt || 'Remove the background and preserve the subject.')
  form.append('model', overrides.model || 'gpt-image-2.5-sunburst')
  form.append('quality', overrides.quality || 'high')
  form.append('size', overrides.size || '1024x1024')
  form.append('output_format', overrides.output_format || 'png')
  form.append('background', overrides.background || 'transparent')
  form.append('input_fidelity', overrides.input_fidelity || 'high')
  form.append('image', new File([new Uint8Array([1, 2, 3])], 'source.png', { type: 'image/png' }))

  return new NextRequest('http://localhost/api/personalization/image-edit', {
    method: 'POST',
    body: form,
  })
}

describe('POST /api/personalization/image-edit', () => {
  it('requires an authenticated SmartVideo GO user', async () => {
    authUserId = null
    const { POST } = await import('@/app/api/personalization/image-edit/route')

    const response = await POST(createRequest())

    expect(response.status).toBe(401)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects operations outside the SmartVideo GO registry', async () => {
    const { POST } = await import('@/app/api/personalization/image-edit/route')

    const response = await POST(createRequest({ operation: 'not-a-real-operation' }))

    expect(response.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects unapproved image models', async () => {
    const { POST } = await import('@/app/api/personalization/image-edit/route')

    const response = await POST(createRequest({ model: 'gpt-image-1' }))

    expect(response.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects transparent JPEG requests', async () => {
    const { POST } = await import('@/app/api/personalization/image-edit/route')

    const response = await POST(createRequest({ output_format: 'jpeg', background: 'transparent' }))

    expect(response.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('forwards a validated edit to OpenAI and returns the image result', async () => {
    const { POST } = await import('@/app/api/personalization/image-edit/route')

    const response = await POST(createRequest())
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(payload.data?.[0]?.b64_json).toBe('ZmFrZQ==')
    expect(payload.smartvideo).toEqual({
      operation: 'remove_background',
      model: 'gpt-image-2.5-sunburst',
      rateLimitRemaining: 11,
    })
  })
})
