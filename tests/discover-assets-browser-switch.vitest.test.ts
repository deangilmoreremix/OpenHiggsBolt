import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

/**
 * The browser phase of asset discovery is an ESCALATION: it only runs when
 * the free layers (static HTML, sitemap, Crawlee) could not answer on their
 * own. `ENABLE_BROWSER_DISCOVERY=false` switches that escalation off so a
 * deployment can be kept on the free pipeline.
 *
 * These tests pin the switch, because losing it is silent: the route still
 * works, it just quietly starts paying for a browser on every site that
 * needs one.
 */
describe('discover-assets — the browser escalation switch', () => {
  let runFastDiscoveryMock: any
  let createDiscoveryJobMock: any
  let updateDiscoveryJobMock: any
  let fetchMock: any
  let originalFlag: string | undefined
  let originalSiteUrl: string | undefined

  beforeEach(() => {
    originalFlag = process.env.ENABLE_BROWSER_DISCOVERY
    originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL
    vi.resetModules()

    // The background worker is only dispatched when the escalation is on, so
    // its URL is what makes the two paths distinguishable.
    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.test'

    runFastDiscoveryMock = vi.fn()
    createDiscoveryJobMock = vi.fn(async () => ({ id: 'job-1' }))
    updateDiscoveryJobMock = vi.fn(async () => ({}))

    vi.doMock('@clerk/nextjs/server', () => ({ auth: vi.fn(async () => ({ userId: 'user-123' })) }))
    vi.doMock('@/server/fastDiscovery', () => ({ runFastDiscovery: runFastDiscoveryMock }))
    vi.doMock('@/server/discoveryJobs', () => ({
      createDiscoveryJob: createDiscoveryJobMock,
      getDiscoveryJobForUser: vi.fn(async () => null),
      updateDiscoveryJob: updateDiscoveryJobMock,
    }))
    vi.doMock('@/server/personalizationLog', () => ({
      logPersonalization: vi.fn(),
      createCorrelationId: vi.fn(() => 'cid-test'),
      sanitizeForLog: vi.fn((v: unknown) => v),
    }))
    vi.doMock('@/server/envValidation', () => ({
      validatePersonalizationEnv: vi.fn(() => ({ valid: true })),
    }))

    fetchMock = vi.fn(async () => ({ ok: true, status: 200 } as any))
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    if (originalFlag === undefined) delete process.env.ENABLE_BROWSER_DISCOVERY
    else process.env.ENABLE_BROWSER_DISCOVERY = originalFlag
    if (originalSiteUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL
    else process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl
    vi.unstubAllGlobals()
    vi.doUnmock('@clerk/nextjs/server')
    vi.doUnmock('@/server/fastDiscovery')
    vi.doUnmock('@/server/discoveryJobs')
    vi.doUnmock('@/server/personalizationLog')
    vi.doUnmock('@/server/envValidation')
  })

  async function post() {
    const { POST } = await import('@/app/api/personalization/discover-assets/route')
    const req = new NextRequest('http://localhost/api/personalization/discover-assets', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer session-token' },
      body: JSON.stringify({ websiteUrl: 'https://example.com' }),
    })
    return POST(req)
  }

  function freeLayersWereNotEnough() {
    runFastDiscoveryMock.mockResolvedValue({
      result: {
        providerUsed: 'STATIC_FALLBACK',
        providerAttempts: ['STATIC'],
        providerAttempted: 'SMARTVIDEO_STATIC',
        pagesCrawled: 1,
        rawCandidates: 0,
        socialProfiles: [],
        candidates: [],
      },
      fastAssets: [],
      usefulAssetCount: 0,
      providerAttempts: ['SMARTVIDEO_STATIC'],
      needsBrowser: true,
    })
  }

  it('escalates to the browser phase when the free layers were not enough', async () => {
    delete process.env.ENABLE_BROWSER_DISCOVERY
    freeLayersWereNotEnough()

    const res = await post()
    const body = await res.json()
    expect(body.status).toBe('processing')
    expect(body.browserQueued).toBe(true)
    // The worker was actually asked to do the browser work.
    expect(fetchMock).toHaveBeenCalled()
    expect(String((fetchMock.mock.calls[0] as any[])[0])).toContain(
      'personalization-browser-discovery',
    )
  })

  it('does NOT escalate to the browser phase when ENABLE_BROWSER_DISCOVERY=false', async () => {
    process.env.ENABLE_BROWSER_DISCOVERY = 'false'
    freeLayersWereNotEnough()

    const res = await post()
    const body = await res.json()
    expect(body.browserQueued).toBe(false)
    expect(body.status).not.toBe('processing')
    // The worker was never called: the escalation is switched off.
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('derives the worker URL from the request origin when NEXT_PUBLIC_SITE_URL is unset', async () => {
    // The browser-discovery worker is a function on the SAME site, so the
    // request's own origin is the right base. Relying on the env var alone
    // meant the escalation silently could not run on a deployment that does
    // not set it.
    delete process.env.NEXT_PUBLIC_SITE_URL
    freeLayersWereNotEnough()

    const res = await post()
    const body = await res.json()
    expect(body.browserQueued).toBe(true)
    expect(fetchMock).toHaveBeenCalled()
    const workerUrl = String((fetchMock.mock.calls[0] as any[])[0])
    expect(workerUrl).toContain('personalization-browser-discovery')
    expect(workerUrl).toMatch(/^https?:\/\//)
  })

  it('prefers an explicitly configured site URL over the request origin', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://configured.example'
    freeLayersWereNotEnough()

    await post()
    const workerUrl = String((fetchMock.mock.calls[0] as any[])[0])
    expect(workerUrl.startsWith('https://configured.example/')).toBe(true)
  })

  it('completes from the free layers when they were enough', async () => {
    delete process.env.ENABLE_BROWSER_DISCOVERY
    runFastDiscoveryMock.mockResolvedValue({
      result: {
        providerUsed: 'STATIC_FALLBACK',
        providerAttempts: ['STATIC'],
        providerAttempted: 'SMARTVIDEO_STATIC',
        pagesCrawled: 1,
        rawCandidates: 1,
        socialProfiles: [],
        candidates: [],
      },
      fastAssets: [{ id: 'a1', sourceUrl: 'https://example.com/logo.png', category: 'logo' }],
      usefulAssetCount: 1,
      providerAttempts: ['SMARTVIDEO_STATIC'],
      needsBrowser: false,
    })

    const res = await post()
    const body = await res.json()
    expect(body.status).toBe('complete')
    expect(body.browserQueued).toBe(false)
    expect(body.count).toBe(1)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
