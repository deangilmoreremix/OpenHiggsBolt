import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { toPlayablePreviewMediaUrl } from '@/src/shared/personalization/preview/remoteMedia'

const CDN_URL =
  'https://cdn.seedance2prompt.com/seedance/examples/outputs/youmind-1770955773476-jr7xi0.mp4'

async function callRoute(target: string | null, init?: RequestInit) {
  const { GET } = await import('@/app/api/media/remote/route')
  const qs = target === null ? '' : `?url=${encodeURIComponent(target)}`
  return GET(new NextRequest(`http://localhost/api/media/remote${qs}`, init))
}

describe('toPlayablePreviewMediaUrl', () => {
  it('rewrites allow-listed CDN videos to the same-origin proxy', () => {
    expect(toPlayablePreviewMediaUrl(CDN_URL)).toBe(
      `/api/media/remote?url=${encodeURIComponent(CDN_URL)}`,
    )
  })

  it('leaves same-origin, blob and unknown-host URLs untouched', () => {
    expect(toPlayablePreviewMediaUrl('/media/personalization-templates/a.mp4')).toBe(
      '/media/personalization-templates/a.mp4',
    )
    expect(toPlayablePreviewMediaUrl('blob:http://localhost/abc')).toBe('blob:http://localhost/abc')
    expect(toPlayablePreviewMediaUrl('https://example.com/a.mp4')).toBe('https://example.com/a.mp4')
    expect(toPlayablePreviewMediaUrl(null)).toBeNull()
  })
})

describe('GET /api/media/remote', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.resetModules()
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('rejects missing and non-allow-listed URLs without fetching', async () => {
    expect((await callRoute(null)).status).toBe(400)
    expect((await callRoute('https://evil.example.com/a.mp4')).status).toBe(400)
    expect((await callRoute('http://169.254.169.254/latest')).status).toBe(400)
    // Allow-listed host over plaintext http is refused too.
    expect((await callRoute(CDN_URL.replace('https://', 'http://'))).status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('streams the upstream video and forwards Range for seeking', async () => {
    fetchMock.mockResolvedValue(
      new Response('abc', {
        status: 206,
        headers: {
          'content-type': 'video/mp4',
          'content-length': '3',
          'content-range': 'bytes 0-2/5217566',
          'accept-ranges': 'bytes',
        },
      }),
    )
    const res = await callRoute(CDN_URL, { headers: { range: 'bytes=0-2' } })
    expect(res.status).toBe(206)
    expect(res.headers.get('content-type')).toBe('video/mp4')
    expect(res.headers.get('content-range')).toBe('bytes 0-2/5217566')
    expect(await res.text()).toBe('abc')
    const init = fetchMock.mock.calls[0][1] as RequestInit
    expect((init.headers as Record<string, string>).Range).toBe('bytes=0-2')
    expect(init.redirect).toBe('manual')
  })

  it('refuses redirects that leave the allow-listed hosts', async () => {
    fetchMock.mockResolvedValue(
      new Response(null, { status: 302, headers: { location: 'https://evil.example.com/x' } }),
    )
    const res = await callRoute(CDN_URL)
    expect(res.status).toBe(502)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('refuses non-media upstream responses', async () => {
    fetchMock.mockResolvedValue(
      new Response('<html>', { status: 200, headers: { 'content-type': 'text/html' } }),
    )
    expect((await callRoute(CDN_URL)).status).toBe(415)
  })

  it('maps upstream 404 to 404', async () => {
    fetchMock.mockResolvedValue(new Response('nope', { status: 404 }))
    expect((await callRoute(CDN_URL)).status).toBe(404)
  })
})
