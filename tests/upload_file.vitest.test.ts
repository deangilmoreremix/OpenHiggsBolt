import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

const MUAPI_UPLOAD_URL = 'https://api.muapi.ai/api/v1/upload_file'

function makeFetchMock() {
  return vi.fn(async () => ({
    ok: true,
    status: 200,
    headers: new Headers({ 'content-type': 'application/json' }),
    async json() {
      return { url: 'https://cdn.muapi.ai/test.mp4' }
    },
    async text() {
      return JSON.stringify({ url: 'https://cdn.muapi.ai/test.mp4' })
    },
  }))
}

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.resetModules()
  fetchMock = makeFetchMock()
  vi.spyOn(globalThis, 'fetch').mockImplementation(fetchMock)

  vi.doMock('@/access/apiRequireEntitlement', () => ({
    requireApiEntitlement: vi.fn(async () => ({ allowed: true })),
    entitlementForbiddenResponse: vi.fn(() => new Response(JSON.stringify({ error: 'PAYMENT_REQUIRED' }), { status: 403 })),
  }))

  vi.doMock('@/access/entitlements', () => ({
    ENTITLEMENTS: { SMARTVIDEO_GO: 'smartvideo_go' },
  }))

  vi.doMock('@/lib/uploadProxyTarget', () => ({
    getApiKeyFromRequest: vi.fn(() => 'test-api-key'),
    isBlockedFileType: vi.fn(() => false),
  }))

  vi.doMock('@/lib/safeApiResponse', () => ({
    safeApiJson: vi.fn(async (res: Response) => {
      const text = await res.text()
      if (!text) return {}
      try { return JSON.parse(text) } catch { return { message: text } }
    }),
  }))
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

describe('POST /api/v1/upload_file', () => {
  it('returns 401 when x-api-key is missing', async () => {
    vi.doMock('@/lib/uploadProxyTarget', () => ({
      getApiKeyFromRequest: vi.fn(() => null),
      isBlockedFileType: vi.fn(() => false),
    }))

    const { POST } = await import('@/app/api/v1/upload_file/route')

    const formData = new FormData()
    formData.append('file', new File(['test'], 'test.jpg', { type: 'image/jpeg' }))

    const res = await POST(
      new NextRequest('http://localhost/api/v1/upload_file', {
        method: 'POST',
        body: formData,
      })
    )

    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toMatch(/Unauthorized/i)
  })

  it('returns 403 when entitlement is missing', async () => {
    vi.doMock('@/access/apiRequireEntitlement', () => ({
      requireApiEntitlement: vi.fn(async () => ({ allowed: false, status: 403, entitlement: 'smartvideo_go' })),
      entitlementForbiddenResponse: vi.fn(() => new Response(JSON.stringify({ error: 'PAYMENT_REQUIRED' }), { status: 403 })),
    }))

    const { POST } = await import('@/app/api/v1/upload_file/route')

    const formData = new FormData()
    formData.append('file', new File(['test'], 'test.jpg', { type: 'image/jpeg' }))

    const res = await POST(
      new NextRequest('http://localhost/api/v1/upload_file', {
        method: 'POST',
        body: formData,
      })
    )

    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.error).toMatch(/PAYMENT_REQUIRED/i)
  })

  it('returns 400 for non-multipart content type', async () => {
    const { POST } = await import('@/app/api/v1/upload_file/route')

    const res = await POST(
      new NextRequest('http://localhost/api/v1/upload_file', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ file: 'test' }),
      })
    )

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/multipart/i)
  })

  it('returns 400 for disallowed MIME type', async () => {
    const { POST } = await import('@/app/api/v1/upload_file/route')

    const formData = new FormData()
    formData.append('file', new File(['test'], 'test.exe', { type: 'application/x-msdownload' }))

    const res = await POST(
      new NextRequest('http://localhost/api/v1/upload_file', {
        method: 'POST',
        body: formData,
      })
    )

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/Invalid file type/i)
  })

  it('returns 400 for oversize image file', async () => {
    const { POST } = await import('@/app/api/v1/upload_file/route')

    const largeContent = new Uint8Array(11 * 1024 * 1024)
    const formData = new FormData()
    formData.append('file', new File([largeContent], 'large.jpg', { type: 'image/jpeg' }))

    const res = await POST(
      new NextRequest('http://localhost/api/v1/upload_file', {
        method: 'POST',
        body: formData,
      })
    )

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/File too large/i)
  })

  it('returns 400 for oversize video file', async () => {
    const { POST } = await import('@/app/api/v1/upload_file/route')

    const largeContent = new Uint8Array(51 * 1024 * 1024)
    const formData = new FormData()
    formData.append('file', new File([largeContent], 'large.mp4', { type: 'video/mp4' }))

    const res = await POST(
      new NextRequest('http://localhost/api/v1/upload_file', {
        method: 'POST',
        body: formData,
      })
    )

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/File too large/i)
  })

  it('returns 502 when MuAPI returns no URL', async () => {
    fetchMock.mockImplementationOnce(async () => ({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      async json() {
        return { status: 'ok' }
      },
      async text() {
        return JSON.stringify({ status: 'ok' })
      },
    }))

    const { POST } = await import('@/app/api/v1/upload_file/route')

    const formData = new FormData()
    formData.append('file', new File(['test'], 'test.jpg', { type: 'image/jpeg' }))

    const res = await POST(
      new NextRequest('http://localhost/api/v1/upload_file', {
        method: 'POST',
        body: formData,
      })
    )

    expect(res.status).toBe(502)
    const json = await res.json()
    expect(json.error).toMatch(/No URL returned/i)
  })

  it('uses AbortSignal.timeout when forwarding upload to MuAPI', async () => {
    const { POST } = await import('@/app/api/v1/upload_file/route')

    const formData = new FormData()
    formData.append('file', new File(['test'], 'test.jpg', { type: 'image/jpeg' }))

    const req = new NextRequest('http://localhost/api/v1/upload_file', {
      method: 'POST',
      body: formData,
    })

    await POST(req)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const calledFetch = fetchMock.mock.calls[0]
    expect(calledFetch[0]).toBe(MUAPI_UPLOAD_URL)
    expect(calledFetch[1]).toBeDefined()
    expect(calledFetch[1].signal).toBeInstanceOf(AbortSignal)
  })
})
