import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs'
import path from 'node:path'

/**
 * `POST /api/demo/discover` — the anonymous, paid-free demo discovery endpoint.
 *
 * The suite mocks the two network boundaries (`researchBusiness` and axios)
 * plus Supabase, and keeps the REAL `assertSafeUrlString` gate, so the SSRF
 * assertions exercise the shipped validator rather than a copy of it.
 *
 * Covered: happy path and the 12-asset cap, literal private / cloud-metadata /
 * non-http / over-length URLs, blocked redirects, share nothing with the
 * personalization tables, the cross-instance quota (429 + Retry-After), the
 * fail-closed 503, cache hits that skip crawling, no paid providers, no
 * wildcard CORS and no full URL in the logs.
 */

// ---------------------------------------------------------------------------
// Controllable boundaries
// ---------------------------------------------------------------------------

type ResearchResult = Record<string, unknown>

let researchBusinessImpl: (url: string) => Promise<ResearchResult> = async (url) => ({
  canonicalUrl: url,
  finalUrl: url,
  reachable: true,
  statusCode: 200,
  contentType: 'text/html; charset=utf-8',
  title: 'Acme Demo Co',
  description: 'We build demo things',
  logoUrl: 'https://cdn.demo.example.com/og-cover.jpg',
  socialLinks: {},
  jsonLd: [],
  openGraph: { image: 'https://cdn.demo.example.com/og-cover.jpg' },
  twitterCard: {},
  contactInfo: { phones: [], emails: [], addresses: [] },
})

let axiosGetImpl: (url: string, config?: unknown) => Promise<{ status: number; data: string }> =
  async () => ({ status: 200, data: '' })

let quotaRpcImpl: (name: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }> =
  async () => ({ data: { allowed: true, remaining: 9, retry_after_ms: 0 }, error: null })

let cacheRpcImpl: (name: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }> =
  async () => ({ data: null, error: null })

let createServerClientImpl: () => unknown = () => {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable')
}

let rpcCalls: Array<{ name: string; args: Record<string, unknown> }> = []
let fromCalls: string[] = []
let researchBusinessCalls: string[] = []
let axiosGetCalls: Array<{ url: string; config?: unknown }> = []
let consoleLines: string[] = []

const LANDING_URL = 'https://demo.example.com/'

const DEMO_RATE_LIMIT_MAX_REQUESTS = 10

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const LANDING_HTML = `<!doctype html>
<html>
  <head>
    <title>Acme Demo Co</title>
    <meta name="description" content="We build demo things">
    <meta property="og:image" content="https://cdn.demo.example.com/og-cover.jpg">
    <meta property="og:image:width" content="1200">
    <meta property="product:price:amount" content="9.99">
    <meta name="twitter:image" content="https://cdn.demo.example.com/twitter-card.png">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">
    <script type="application/ld+json">
      {"@context":"https://schema.org","@type":"Product","name":"Widget",
       "image":["https://cdn.demo.example.com/widget.jpg"],
       "offers":{"@type":"Offer","price":"9.99"}}
    </script>
    <script type="application/ld+json">
      {"@type":"Organization","name":"Acme Demo Co","logo":"https://cdn.demo.example.com/logo.svg"}
    </script>
  </head>
  <body>
    <img src="https://cdn.demo.example.com/photo-1.jpg" width="800" height="600" alt="team">
    <img src="https://cdn.demo.example.com/photo-2.jpg" width="640" height="480">
    <img src="https://cdn.demo.example.com/tiny.png" width="10" height="10">
    <img src="data:image/png;base64,AAAA">
    <img srcset="https://cdn.demo.example.com/photo-3.jpg 2x, https://cdn.demo.example.com/photo-3-small.jpg 1x">
    <img src="https://cdn.demo.example.com/icon-24.png" width="24" height="24">
    <img src="http://169.254.169.254/ssrf.png" width="900" height="700">
  </body>
</html>`

const SITEMAP_XML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>https://demo.example.com/</loc>
    <image:image><image:loc>https://cdn.demo.example.com/sitemap-hero.jpg</image:loc></image:image>
  </url>
  <url><loc>https://demo.example.com/about</loc></url>
  <url><loc>https://demo.example.com/brochure.pdf</loc></url>
</urlset>`

function reachableResearch(url: string): ResearchResult {
  return {
    canonicalUrl: url,
    finalUrl: url,
    reachable: true,
    statusCode: 200,
    contentType: 'text/html; charset=utf-8',
    title: 'Acme Demo Co',
    description: 'We build demo things',
    logoUrl: 'https://cdn.demo.example.com/og-cover.jpg',
    socialLinks: {},
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'Widget',
        image: ['https://cdn.demo.example.com/widget.jpg'],
        offers: { '@type': 'Offer', price: '9.99' },
      },
      {
        '@type': 'Organization',
        name: 'Acme Demo Co',
        logo: 'https://cdn.demo.example.com/logo.svg',
      },
    ],
    openGraph: { image: 'https://cdn.demo.example.com/og-cover.jpg', 'image:width': '1200' },
    twitterCard: {},
    contactInfo: { phones: [], emails: [], addresses: [] },
  }
}

function defaultAxiosGet(url: string) {
  if (url.endsWith('/sitemap.xml')) return Promise.resolve({ status: 200, data: SITEMAP_XML })
  return Promise.resolve({ status: 200, data: LANDING_HTML })
}

function createRequest(websiteUrl: unknown, clientIp = '203.0.113.7') {
  return new NextRequest('http://localhost/api/demo/discover', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': clientIp },
    body: JSON.stringify({ websiteUrl }),
  })
}

async function loadRoute() {
  return import('@/app/api/demo/discover/route')
}

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.resetModules()

  researchBusinessImpl = async (url: string) => reachableResearch(url)
  axiosGetImpl = defaultAxiosGet
  quotaRpcImpl = async () => ({ data: { allowed: true, remaining: 9, retry_after_ms: 0 }, error: null })
  cacheRpcImpl = async () => ({ data: null, error: null })
  createServerClientImpl = () => supabaseClient
  rpcCalls = []
  fromCalls = []
  researchBusinessCalls = []
  axiosGetCalls = []
  consoleLines = []

  for (const level of ['log', 'info', 'warn', 'error'] as const) {
    vi.spyOn(console, level).mockImplementation((...args: unknown[]) => {
      consoleLines.push(args.map((arg) => String(arg)).join(' '))
    })
  }

  vi.doMock('@/server/businessDiscovery/researchProvider', () => ({
    researchBusiness: vi.fn(async (url: string) => {
      researchBusinessCalls.push(url)
      return researchBusinessImpl(url)
    }),
  }))

  vi.doMock('axios', () => ({
    default: {
      get: vi.fn(async (url: string, config?: unknown) => {
        axiosGetCalls.push({ url, config })
        return axiosGetImpl(url, config)
      }),
    },
  }))

  vi.doMock('@/lib/supabase', () => ({
    createServerClient: () => createServerClientImpl(),
    supabase: {},
    mirrorUrlToStorage: vi.fn(),
  }))

  // The real `assertSafeUrlString` gate is kept; only the DNS-resolving half is
  // stubbed so the suite stays hermetic. The stub itself refuses anything the
  // real gate refuses.
  vi.doMock('@/lib/networkSafety', async () => {
    const actual = await vi.importActual<Record<string, unknown>>('@/lib/networkSafety')
    const assertSafeUrlString = actual.assertSafeUrlString as (input: string) => string
    return {
      ...actual,
      checkDestination: async (input: string) => {
        let url: string
        try {
          url = assertSafeUrlString(input)
        } catch {
          return { ok: false, reason: 'blocked_host' }
        }
        const parsed = new URL(url)
        return {
          ok: true,
          url,
          hostname: parsed.hostname.toLowerCase(),
          port: parsed.port || (parsed.protocol === 'https:' ? '443' : '80'),
          protocol: parsed.protocol,
          addresses: ['93.184.216.34'],
        }
      },
    }
  })

  // Faithful re-implementation of the real helper so the 429 shape (status +
  // Retry-After in seconds) is asserted, not mocked away.
  vi.doMock('@/lib/rateLimit', () => ({
    resolveRateLimitKey: (userId?: string | null, clientIp?: string | null) => userId || clientIp || 'anon',
    rateLimit429: (retryAfterMs: number) =>
      new NextResponse(JSON.stringify({ error: 'Rate limit exceeded. Please wait before retrying.' }), {
        status: 429,
        headers: { 'content-type': 'application/json', 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) },
      }),
    rateLimit: () => ({ allowed: true, remaining: 9, retryAfterMs: 0 }),
  }))
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

// `from()` is recorded rather than emulated: the demo route must never touch a
// PostgREST table, personalization or otherwise.
const rpcRouter = async (name: string, args?: Record<string, unknown>) => {
  rpcCalls.push({ name, args: args || {} })
  if (name === 'demo_consume_quota') return quotaRpcImpl(name, args)
  if (name === 'demo_discovery_cache_get' || name === 'demo_discovery_cache_put') {
    return cacheRpcImpl(name, args)
  }
  return { data: null, error: { message: `unexpected rpc ${name}` } }
}

const supabaseClient = {
  rpc: rpcRouter,
  from: (table: string) => {
    fromCalls.push(table)
    return {
      select: () => {
        throw new Error(`demo route must not read table ${table}`)
      },
      insert: () => {
        throw new Error(`demo route must not write table ${table}`)
      },
      update: () => {
        throw new Error(`demo route must not update table ${table}`)
      },
      delete: () => {
        throw new Error(`demo route must not delete table ${table}`)
      },
    }
  },
}

describe('POST /api/demo/discover', () => {
  it('returns the public demo payload with at most 12 assets', async () => {
    const { POST } = await loadRoute()
    const response = await POST(createRequest(LANDING_URL))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.ok).toBe(true)
    expect(payload.cached).toBe(false)
    expect(payload.url).toBe(LANDING_URL)
    expect(payload.title).toBe('Acme Demo Co')
    expect(payload.description).toBe('We build demo things')
    expect(payload.logo).toBe('https://cdn.demo.example.com/logo.svg')

    expect(Array.isArray(payload.assets)).toBe(true)
    expect(payload.assets.length).toBeGreaterThan(0)
    expect(payload.assets.length).toBeLessThanOrEqual(12)

    for (const asset of payload.assets) {
      expect(['logo', 'photo', 'product', 'brand']).toContain(asset.kind)
      expect(['meta', 'og', 'jsonld', 'img', 'sitemap']).toContain(asset.source)
      expect(typeof asset.url).toBe('string')
      expect(asset.url.startsWith('https://')).toBe(true)
      expect(Object.keys(asset).sort()).toEqual(['kind', 'source', 'url'])
    }

    const kinds = new Set(payload.assets.map((asset: { kind: string }) => asset.kind))
    const sources = new Set(payload.assets.map((asset: { source: string }) => asset.source))
    expect([...kinds].sort()).toEqual(['brand', 'logo', 'photo', 'product'])
    expect([...sources].sort()).toEqual(['img', 'jsonld', 'meta', 'og', 'sitemap'])

    const urls = payload.assets.map((asset: { url: string }) => asset.url)
    expect(urls).toContain('https://cdn.demo.example.com/widget.jpg')
    expect(urls).toContain('https://cdn.demo.example.com/photo-1.jpg')
    expect(urls).toContain('https://demo.example.com/apple-touch-icon.png')
    // The metadata address is never returned, even when the page asks for it.
    expect(urls).not.toContain('http://169.254.169.254/ssrf.png')
    // Trackers and spacers are filtered out.
    expect(urls).not.toContain('data:image/png;base64,AAAA')
    expect(urls).not.toContain('https://cdn.demo.example.com/tiny.png')
    expect(urls).not.toContain('https://cdn.demo.example.com/icon-24.png')
  })

  it('crawls only the landing page and its own sitemap.xml (depth 1)', async () => {
    const { DEMO_MAX_CRAWL_DEPTH, DEMO_MAX_ASSETS } = await import('@/server/demoDiscovery')
    const { POST } = await loadRoute()
    const response = await POST(createRequest(LANDING_URL))
    const payload = await response.json()

    // The landing page plus exactly one sitemap document: nothing else is
    // fetched, so no link is ever followed.
    expect(DEMO_MAX_CRAWL_DEPTH).toBe(1)
    expect(axiosGetCalls.length).toBeLessThanOrEqual(1 + DEMO_MAX_CRAWL_DEPTH)
    expect(payload.assets.length).toBeLessThanOrEqual(DEMO_MAX_ASSETS)

    for (const call of axiosGetCalls) {
      const config = call.config as { maxRedirects?: number } | undefined
      expect(config?.maxRedirects).toBe(0)
    }
    expect(axiosGetCalls.map((call) => call.url).sort()).toEqual([
      'https://demo.example.com/',
      'https://demo.example.com/sitemap.xml',
    ])
    expect(response.status).toBe(200)
  })

  it('caps the returned asset list at 12', async () => {
    const many = Array.from({ length: 30 }, (_unused, index) =>
      `<img src="https://cdn.demo.example.com/photo-${index}.jpg" width="900" height="700">`,
    ).join('\n')

    researchBusinessImpl = async (url: string) => ({
      ...reachableResearch(url),
      reachable: true,
    })
    axiosGetImpl = async (url: string) => ({
      status: 200,
      data: url.endsWith('/sitemap.xml') ? '' : `<html><body>${many}</body></html>`,
    })

    const { POST } = await loadRoute()
    const response = await POST(createRequest(LANDING_URL))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.assets).toHaveLength(12)
  })

  it('rejects a literal private IP before any fetch happens', async () => {
    const { POST } = await loadRoute()
    const response = await POST(createRequest('http://127.0.0.1/'))
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error).toMatch(/not allowed/i)
    expect(researchBusinessCalls).toEqual([])
    expect(axiosGetCalls).toEqual([])
    expect(rpcCalls).toEqual([])
  })

  it('rejects the cloud metadata address', async () => {
    const { POST } = await loadRoute()
    const response = await POST(createRequest('http://169.254.169.254/latest/meta-data/'))
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error).toMatch(/not allowed/i)
    expect(researchBusinessCalls).toEqual([])
  })

  it('rejects an alternate decimal spelling of a private address', async () => {
    const { POST } = await loadRoute()
    const response = await POST(createRequest('http://2130706433/'))

    expect(response.status).toBe(400)
    expect(researchBusinessCalls).toEqual([])
  })

  it('rejects a non-http scheme', async () => {
    const { POST } = await loadRoute()
    const response = await POST(createRequest('ftp://demo.example.com/assets'))
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error).toMatch(/not allowed/i)
    expect(researchBusinessCalls).toEqual([])
  })

  it('rejects an over-length URL instead of truncating it', async () => {
    const { POST } = await loadRoute()
    const longUrl = `https://demo.example.com/${'a'.repeat(4000)}`
    const response = await POST(createRequest(longUrl))
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error).toMatch(/not allowed/i)
    expect(researchBusinessCalls).toEqual([])
    expect(axiosGetCalls).toEqual([])
  })

  it('rejects a missing websiteUrl', async () => {
    const { POST } = await loadRoute()
    const response = await POST(createRequest(''))

    expect(response.status).toBe(400)
    expect(researchBusinessCalls).toEqual([])
  })

  it('maps a blocked redirect target to 400 without leaking internals', async () => {
    researchBusinessImpl = async () => {
      throw new Error('Blocked URL: private/unsafe target (redirect to resolved_to_blocked_ip) is not allowed')
    }

    const { POST } = await loadRoute()
    const response = await POST(createRequest(LANDING_URL))
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error).toMatch(/not allowed/i)
    expect(payload.error).not.toMatch(/resolved_to_blocked_ip|169\.254|internal/)
  })

  it('answers 429 with Retry-After once the anonymous quota is spent', async () => {
    quotaRpcImpl = async () => ({ data: { allowed: false, remaining: 0, retry_after_ms: 2500 }, error: null })

    const { POST } = await loadRoute()
    const response = await POST(createRequest(LANDING_URL))
    const payload = await response.json()

    expect(response.status).toBe(429)
    expect(response.headers.get('retry-after')).toBe('3')
    expect(payload.error).toMatch(/rate limit/i)
    // The quota is spent before anything is crawled.
    expect(researchBusinessCalls).toEqual([])
    expect(axiosGetCalls).toEqual([])
  })

  it('consumes one unit of quota per crawl and keys it on the anonymous IP', async () => {
    const { POST } = await loadRoute()
    await POST(createRequest(LANDING_URL, '203.0.113.9'))

    const quotaCall = rpcCalls.find((call) => call.name === 'demo_consume_quota')
    expect(quotaCall).toBeDefined()
    expect(quotaCall?.args).toMatchObject({
      p_key: '203.0.113.9',
      p_max: DEMO_RATE_LIMIT_MAX_REQUESTS,
      p_window_ms: 10 * 60 * 1000,
    })
  })

  it('fails closed with 503 when Supabase is unavailable', async () => {
    createServerClientImpl = () => {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable')
    }

    const { POST } = await loadRoute()
    const response = await POST(createRequest(LANDING_URL))
    const payload = await response.json()

    expect(response.status).toBe(503)
    expect(payload.error).toMatch(/temporarily unavailable/i)
    expect(JSON.stringify(payload)).not.toMatch(/SUPABASE_|Missing SUPABASE|service_role/i)
    // Nothing is crawled when the limiter cannot be consulted.
    expect(researchBusinessCalls).toEqual([])
    expect(axiosGetCalls).toEqual([])
  })

  it('fails closed with 503 when the quota RPC errors', async () => {
    quotaRpcImpl = async () => ({ data: null, error: { message: 'relation demo_discovery_limits does not exist' } })

    const { POST } = await loadRoute()
    const response = await POST(createRequest(LANDING_URL))

    expect(response.status).toBe(503)
    expect(await response.json()).not.toMatchObject({ error: expect.stringMatching(/relation/) })
  })

  it('serves a cache hit without crawling and without spending fresh quota', async () => {
    const cached = {
      url: LANDING_URL,
      title: 'Cached Acme',
      description: 'Cached description',
      logo: 'https://cdn.demo.example.com/logo.svg',
      assets: [{ kind: 'logo', url: 'https://cdn.demo.example.com/logo.svg', source: 'jsonld' }],
    }
    cacheRpcImpl = async (name: string) =>
      name === 'demo_discovery_cache_get' ? { data: cached, error: null } : { data: null, error: null }

    const { POST } = await loadRoute()
    const response = await POST(createRequest(LANDING_URL))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.cached).toBe(true)
    expect(payload.title).toBe('Cached Acme')
    expect(payload.assets).toHaveLength(1)
    expect(researchBusinessCalls).toEqual([])
    expect(axiosGetCalls).toEqual([])
    expect(rpcCalls.some((call) => call.name === 'demo_consume_quota')).toBe(false)
  })

  it('still answers from a cache hit when the quota store is down', async () => {
    const cached = {
      url: LANDING_URL,
      title: 'Cached Acme',
      description: null,
      logo: null,
      assets: [],
    }
    cacheRpcImpl = async (name: string) =>
      name === 'demo_discovery_cache_get' ? { data: cached, error: null } : { data: null, error: null }
    createServerClientImpl = () => ({
      rpc: async (name: string) => {
        if (name === 'demo_discovery_cache_get') return { data: cached, error: null }
        throw new Error('quota store down')
      },
    })

    const { POST } = await loadRoute()
    const response = await POST(createRequest(LANDING_URL))

    expect(response.status).toBe(200)
    expect((await response.json()).cached).toBe(true)
  })

  it('stays available when the cache read fails but the crawl succeeds', async () => {
    cacheRpcImpl = async (name: string) => {
      if (name === 'demo_discovery_cache_get') return { data: null, error: { message: 'cache down' } }
      return { data: { allowed: true, remaining: 9, retry_after_ms: 0 }, error: null }
    }

    const { POST } = await loadRoute()
    const response = await POST(createRequest(LANDING_URL))

    expect(response.status).toBe(200)
    expect((await response.json()).cached).toBe(false)
    expect(researchBusinessCalls).toEqual([LANDING_URL])
  })

  it('re-validates a cached row instead of trusting it', async () => {
    cacheRpcImpl = async (name: string) =>
      name === 'demo_discovery_cache_get'
        ? {
            data: {
              url: LANDING_URL,
              title: 'Cached Acme',
              description: null,
              logo: null,
              assets: [
                { kind: 'logo', url: 'http://10.0.0.5/logo.png', source: 'og' },
                { kind: 'nonsense', url: 'https://cdn.demo.example.com/x.png', source: 'og' },
                { kind: 'logo', url: 'https://cdn.demo.example.com/real.png', source: 'og' },
                { kind: 'photo', url: 'javascript:alert(1)', source: 'img' },
              ],
            },
            error: null,
          }
        : { data: null, error: null }

    const { POST } = await loadRoute()
    const response = await POST(createRequest(LANDING_URL))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.cached).toBe(true)
    expect(payload.title).toBe('Cached Acme')
    expect(payload.assets).toEqual([
      { kind: 'logo', url: 'https://cdn.demo.example.com/real.png', source: 'og' },
    ])
  })

  it('discards a cached row whose own URL is blocked rather than serving it', async () => {
    cacheRpcImpl = async (name: string) =>
      name === 'demo_discovery_cache_get'
        ? {
            data: {
              url: 'http://169.254.169.254/',
              title: 'poisoned',
              description: null,
              logo: null,
              assets: [],
            },
            error: null,
          }
        : { data: null, error: null }

    const { POST } = await loadRoute()
    const response = await POST(createRequest(LANDING_URL))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.cached).toBe(false)
    expect(payload.title).not.toBe('poisoned')
    expect(researchBusinessCalls).toEqual([LANDING_URL])
  })

  it('degrades to an empty asset list for an unreachable site', async () => {
    researchBusinessImpl = async (url: string) => ({
      ...reachableResearch(url),
      reachable: false,
      title: undefined,
      description: undefined,
      logoUrl: undefined,
      jsonLd: [],
      openGraph: {},
    })
    axiosGetImpl = async () => {
      throw new Error('ECONNREFUSED')
    }

    const { POST } = await loadRoute()
    const response = await POST(createRequest(LANDING_URL))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toMatchObject({
      ok: true,
      cached: false,
      url: LANDING_URL,
      title: null,
      description: null,
      logo: null,
      assets: [],
    })
  })

  it('never touches a PostgREST table, and never a personalization_* one', async () => {
    const { POST } = await loadRoute()
    await POST(createRequest(LANDING_URL))

    expect(fromCalls).toEqual([])
    for (const call of rpcCalls) {
      expect(call.name).not.toMatch(/^personalization_/)
      expect(call.name).not.toMatch(/discovery_jobs|saved_projects/)
    }
    expect(JSON.stringify(rpcCalls)).not.toMatch(/personalization_/)

    const payload = await (await POST(createRequest(LANDING_URL))).json()
    expect(payload.jobId).toBeUndefined()
    expect(payload.id).toBeUndefined()
  })

  it('never exposes a wildcard CORS header', async () => {
    const { POST } = await loadRoute()
    const response = await POST(createRequest(LANDING_URL))

    expect(response.headers.get('access-control-allow-origin')).toBeNull()
  })

  it('never logs the raw URL, only a capped prefix', async () => {
    const longUrl = `https://demo.example.com/${'b'.repeat(200)}`
    const { POST } = await loadRoute()
    await POST(createRequest(longUrl))

    expect(consoleLines.length).toBeGreaterThan(0)
    for (const line of consoleLines) {
      expect(line).not.toContain(longUrl)
      expect(line.length).toBeLessThan(600)
    }
  })

  it('logs through the personalization logging contract with a correlation id', async () => {
    const { POST } = await loadRoute()
    const response = await POST(
      new NextRequest('http://localhost/api/demo/discover', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-request-id': 'demo-corr-1',
        },
        body: JSON.stringify({ websiteUrl: LANDING_URL }),
      }),
    )
    await response.json()

    const structured = consoleLines
      .map((line) => JSON.parse(line) as Record<string, unknown>)
      .filter((entry) => entry.route === '/api/demo/discover')

    expect(structured.length).toBeGreaterThan(0)
    for (const entry of structured) {
      expect(entry.correlationId).toBe('demo-corr-1')
      expect(entry.stage).toBeTypeOf('string')
      expect(entry.httpStatus).toBeTypeOf('number')
    }
    expect(structured.some((entry) => entry.httpStatus === 200)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Source-level guards
// ---------------------------------------------------------------------------

describe('demo modules stay paid-free and identity-free', () => {
  const repoRoot = process.cwd()

  const DEMO_MODULES = [
    'app/api/demo/discover/route.ts',
    'src/server/demoDiscovery.ts',
    'src/server/demoRateLimit.ts',
  ]

  /**
   * Reduces a module to its executable code: comments and string contents are
   * dropped, so an assertion about the code cannot be satisfied by a comment
   * (and a URL inside a string cannot be mistaken for a comment).
   */
  const codeOnly = (source: string): string => {
    let out = ''
    let index = 0
    while (index < source.length) {
      const char = source[index]
      const next = source[index + 1]
      if (char === '/' && next === '*') {
        const end = source.indexOf('*/', index + 2)
        index = end === -1 ? source.length : end + 2
        out += ' '
        continue
      }
      if (char === '/' && next === '/') {
        const end = source.indexOf('\n', index + 2)
        index = end === -1 ? source.length : end + 1
        out += '\n'
        continue
      }
      if (char === '"' || char === "'" || char === '`') {
        let cursor = index + 1
        while (cursor < source.length) {
          if (source[cursor] === '\\') {
            cursor += 2
            continue
          }
          if (source[cursor] === char) {
            cursor += 1
            break
          }
          cursor += 1
        }
        out += '""'
        index = cursor
        continue
      }
      out += char
      index += 1
    }
    return out
  }

  const read = (relativePath: string): string =>
    codeOnly(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'))

  it('imports no AI provider, browser crawler or paid discovery path', () => {
    for (const modulePath of DEMO_MODULES) {
      const code = read(modulePath)
      expect(code, `${modulePath} must not reference a paid provider`).not.toMatch(
        /openai|muapi|crawlee|firecrawl|browser/i,
      )
    }
  })

  it('reads no AI or discovery provider key from the environment', () => {
    for (const modulePath of DEMO_MODULES) {
      const code = read(modulePath)
      expect(code).not.toMatch(/OPENAI|MUAPI|FIRECRAWL/i)
    }
  })

  it('writes no discovery job, saved project or identity row', () => {
    for (const modulePath of DEMO_MODULES) {
      const code = read(modulePath)
      expect(code).not.toMatch(/personalization_discovery_jobs|personalization_saved_projects/)
      expect(code).not.toMatch(/\.from\(/)
      expect(code).not.toMatch(/clerk_user_id|set_config|auth\.uid/)
    }
  })

  it('routes every outbound destination through the shared network gate', () => {
    const discovery = read('src/server/demoDiscovery.ts')
    expect(discovery).toMatch(/assertSafeUrlString/)
    expect(discovery).toMatch(/checkDestination/)
    expect(discovery).toMatch(/safeRequestConfig/)
    // The existing non-AI provider does the async DNS + redirect + pinning work.
    expect(discovery).toMatch(/researchBusiness\(/)
    expect(discovery).toMatch(/maxRedirects: 0/)

    const route = read('app/api/demo/discover/route.ts')
    expect(route).toMatch(/assertSafeUrlString/)
    expect(route).toMatch(/runDemoDiscovery\(/)
    expect(route).toMatch(/consumeDemoQuota\(/)
    expect(route).toMatch(/resolveRateLimitKey\(/)
    expect(route).toMatch(/route: ROUTE/)
  })
})
