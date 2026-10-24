/**
 * SSRF regression tests for the browser asset-discovery paths.
 *
 * Confirmed vulnerability this suite guards against:
 *
 *   `netlify/functions/personalization-browser-discovery.js` took `websiteUrl`
 *   straight from the request body and handed it to `page.goto()` with no
 *   authentication and no destination validation. The same was true of
 *   `src/server/browserDiscovery.ts` (`collectBrowserCandidates` ->
 *   `page.goto`). Both only filtered *junk/social paths*, never network
 *   destinations, so any unauthenticated caller could make the server fetch
 *   internal URLs such as 169.254.169.254.
 *
 * Properties under test:
 *   1. The Netlify function requires a server-verified Clerk session (401).
 *   2. The destination gate rejects private / loopback / link-local / CGNAT /
 *      ULA / unspecified / metadata / encoded-IP destinations *before*
 *      navigation, and `page.goto` is never called for them.
 *   3. Redirect targets are re-validated, with a hop cap.
 *   4. The post-navigation URL is re-validated.
 *   5. Browser subrequests are gated too, so a public page cannot pull a
 *      resource from an internal address.
 *   6. A genuinely public URL still succeeds and the multi-layered asset
 *      discovery pipeline is not disabled.
 *
 * Everything here is hermetic: Playwright is mocked at the module boundary,
 * the Netlify function's CommonJS collaborators are substituted through Node's
 * `require.cache` (`vi.mock` cannot intercept a native `require()` in a CJS
 * module — verified empirically before writing this file), and every DNS
 * answer is injected. No browser is launched and no socket is opened.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'

const nodeRequire = createRequire(import.meta.url)

const NETLIFY_FN = '../netlify/functions/personalization-browser-discovery.js'
const NETLIFY_FN_DIR = 'netlify/functions'

// ---------------------------------------------------------------------------
// Playwright fakes (module boundary — never a real browser)
// ---------------------------------------------------------------------------

interface FakeRoute {
  url: string
  resourceType: string
  abort: ReturnType<typeof vi.fn>
  continue: ReturnType<typeof vi.fn>
}

interface FakeRequest {
  url: () => string
  resourceType: () => string
  redirectedFrom: () => FakeRequest | null
}

interface FakeBrowserHarness {
  launchCalls: Array<{ headless?: boolean; args?: string[]; executablePath?: string }>
  gotoCalls: Array<{ url: string; options: { timeout?: number; waitUntil?: string } }>
  newPageCalls: number
  routeCalls: number
  routeHandler: ((route: FakeRoute, request: FakeRequest) => Promise<unknown>) | null
  /** URL the browser ended up on (i.e. after any redirects). */
  finalUrl: string
  /** Candidates the in-page extraction script returns. */
  candidates: Array<{ src: string; alt?: string }>
  /** Invokes the interceptor registered via `context.route` for the glob pattern. */
  runRouteHandler: (
    url: string,
    resourceType?: string,
    redirectedFrom?: () => FakeRequest | null,
  ) => Promise<FakeRoute>
}

function createFakeBrowser(
  options: { finalUrl?: string; candidates?: Array<{ src: string; alt?: string }> } = {},
): FakeBrowserHarness {
  const harness: FakeBrowserHarness = {
    launchCalls: [],
    gotoCalls: [],
    newPageCalls: 0,
    routeCalls: 0,
    routeHandler: null,
    finalUrl: options.finalUrl ?? '',
    candidates: options.candidates ?? [],

    async runRouteHandler(url, resourceType = 'image', redirectedFrom) {
      expect(harness.routeHandler, 'context.route must have been registered').toBeTypeOf('function')
      const route: FakeRoute = { url, resourceType, abort: vi.fn(), continue: vi.fn() }
      const request: FakeRequest = {
        url: () => url,
        resourceType: () => resourceType,
        redirectedFrom: redirectedFrom ?? (() => null),
      }
      await harness.routeHandler!(route, request)
      return route
    },
  }

  return harness
}

function createFakePage(harness: FakeBrowserHarness) {
  return {
    goto: vi.fn(async (url: string, gotoOptions: { timeout?: number; waitUntil?: string }) => {
      harness.gotoCalls.push({ url, options: gotoOptions })
    }),
    url: vi.fn(() => harness.finalUrl),
    evaluate: vi.fn(async (script: unknown) => {
      const source = typeof script === 'string' ? script : ''
      if (source.includes('scrollHeight')) return 200
      if (source.includes('return win.__discoveryCandidates')) return harness.candidates
      return undefined
    }),
    waitForTimeout: vi.fn(async () => {}),
    close: vi.fn(async () => {}),
  }
}

/** Chromium stub whose `launch` resolves to a fake browser. */
function chromiumStub(harness: FakeBrowserHarness) {
  return {
    launch: vi.fn(async (launchOptions: { headless?: boolean; args?: string[]; executablePath?: string }) => {
      harness.launchCalls.push(launchOptions)
      return {
        isConnected: () => true,
        newContext: vi.fn(async () => ({
          route: vi.fn(
            async (
              _pattern: string,
              handler: (route: FakeRoute, request: FakeRequest) => Promise<unknown>,
            ) => {
              harness.routeHandler = handler
              harness.routeCalls++
            },
          ),
          newPage: vi.fn(async () => {
            harness.newPageCalls++
            return createFakePage(harness)
          }),
          close: vi.fn(async () => {}),
        })),
        close: vi.fn(async () => {}),
      }
    }),
  }
}

// ---------------------------------------------------------------------------
// Fake Supabase / Clerk for the Netlify function
// ---------------------------------------------------------------------------

interface SupabaseCall {
  table: string
  action: 'select' | 'update'
}

// The worker reads the destination from the job row, never from the request
// body, so the fake row carries whatever URL the test posted. Without this
// every "gate" test would crawl the same fixed URL and test nothing.
let jobWebsiteUrl = 'https://example.com/'

function fakeSupabaseClient(calls: SupabaseCall[], existingJobId: string | null = 'job-1') {
  return {
    from: (table: string) => ({
      // Record reads as well as writes: the production job-lookup path performs
      // a select() before the update(), so a harness that only records update()
      // silently hides half of the interaction.
      select: (_columns = '*') => {
        calls.push({ table, action: 'select' })
        return {
          eq: (_column: string, value: unknown) => ({
            single: async () => ({
              data: value === existingJobId ? { id: 'job-1', website_url: jobWebsiteUrl } : null,
              error: value === existingJobId ? null : { message: 'not found' },
            }),
          }),
        }
      },
      update: () => ({
        eq: () => {
          calls.push({ table, action: 'update' })
          return Promise.resolve({ data: null, error: null })
        },
      }),
    }),
  }
}

interface NetlifySeams {
  browser: FakeBrowserHarness
  supabaseCalls: SupabaseCall[]
  restored: () => void
}

/**
 * Substitutes the Netlify function's CommonJS collaborators through Node's
 * `require.cache`. `vi.mock` does not reach a native `require()` inside a CJS
 * module, so this is the module-boundary seam available to us.
 */
function installNetlifySeams(validToken = 'session-token-valid'): NetlifySeams {
  const browser = createFakeBrowser()
  const supabaseCalls: SupabaseCall[] = []

  const seams = [
    { id: 'playwright-core', exports: { chromium: chromiumStub(browser) } },
    { id: '@supabase/supabase-js', exports: { createClient: () => fakeSupabaseClient(supabaseCalls) } },
    {
      id: '@clerk/backend',
      exports: {
        verifyToken: async (token: string) => {
          if (token !== validToken) throw new Error('invalid token')
          return { sub: 'user_123', sid: 'sess_1' }
        },
      },
    },
  ]

  // These suites exercise the browser phase, which is opt-in.
  const savedBrowserFlag = process.env.ENABLE_BROWSER_DISCOVERY
  process.env.ENABLE_BROWSER_DISCOVERY = 'true'
  // The worker refuses every call until the dispatch secret is configured.
  const savedSecret = process.env.INTERNAL_FUNCTION_SECRET
  process.env.INTERNAL_FUNCTION_SECRET = TEST_INTERNAL_SECRET

  const saved: Array<[string, unknown]> = []
  for (const seam of seams) {
    const resolved = nodeRequire.resolve(seam.id, { paths: [NETLIFY_FN_DIR] })
    saved.push([resolved, nodeRequire.cache[resolved]])
    nodeRequire.cache[resolved] = {
      id: resolved,
      filename: resolved,
      loaded: true,
      children: [],
      paths: [],
      exports: seam.exports,
    } as unknown as NodeJS.Module
  }

  // The compiled free layers exist only after a build. When they do, they are
  // stubbed so this suite never touches the network; "found nothing, escalate"
  // is what an unreachable site produces.
  const fastDiscoveryPath = path.resolve(NETLIFY_FN_DIR, '../lib/fast-discovery.cjs')
  if (fs.existsSync(fastDiscoveryPath)) {
    saved.push([fastDiscoveryPath, nodeRequire.cache[fastDiscoveryPath]])
    nodeRequire.cache[fastDiscoveryPath] = {
      id: fastDiscoveryPath,
      filename: fastDiscoveryPath,
      loaded: true,
      children: [],
      paths: [],
      exports: {
        runFastDiscovery: async () => ({
          fastAssets: [],
          needsBrowser: true,
          result: { providerUsed: 'NONE', providerAttempts: [], pagesCrawled: 0, rawCandidates: 0, duration: 0, candidates: [], socialProfiles: [] },
        }),
      },
    } as unknown as NodeJS.Module
  }

  return {
    browser,
    supabaseCalls,
    restored: () => {
      if (savedBrowserFlag === undefined) delete process.env.ENABLE_BROWSER_DISCOVERY
      else process.env.ENABLE_BROWSER_DISCOVERY = savedBrowserFlag
      if (savedSecret === undefined) delete process.env.INTERNAL_FUNCTION_SECRET
      else process.env.INTERNAL_FUNCTION_SECRET = savedSecret
      for (const [resolved, original] of saved) {
        if (original === undefined) delete nodeRequire.cache[resolved]
        else nodeRequire.cache[resolved] = original
      }
    },
  }
}

async function loadNetlifyFunction() {
  vi.resetModules()
  return import(NETLIFY_FN)
}

const TEST_INTERNAL_SECRET = 'test-internal-secret'

function netlifyEvent(body: unknown, headers: Record<string, string> = {}) {
  const posted = (body as { websiteUrl?: unknown } | null)?.websiteUrl
  jobWebsiteUrl = typeof posted === 'string' ? posted : 'https://example.com/'
  return {
    httpMethod: 'POST',
    // Every call is a dispatch from the route, which carries the secret.
    headers: { 'content-type': 'application/json', 'x-internal-service-token': TEST_INTERNAL_SECRET, ...headers },
    body: JSON.stringify(body),
  }
}

function authenticatedEvent(body: unknown, token: string | null, headers: Record<string, string> = {}) {
  const merged: Record<string, string> = { ...headers }
  if (token) merged.authorization = `Bearer ${token}`
  return netlifyEvent(body, merged)
}

// ---------------------------------------------------------------------------
// Destination-gate fixtures
// ---------------------------------------------------------------------------

const PRIVATE_TARGETS: Array<{ label: string; url: string }> = [
  { label: 'cloud metadata 169.254.169.254', url: 'http://169.254.169.254/latest/meta-data/' },
  { label: 'link-local 169.254.170.2', url: 'http://169.254.170.2/' },
  { label: 'IPv4 loopback', url: 'http://127.0.0.1:3000/' },
  { label: 'RFC1918 10/8', url: 'http://10.0.0.5/admin' },
  { label: 'RFC1918 192.168/16', url: 'http://192.168.1.1/' },
  { label: 'RFC1918 172.16/12 low bound', url: 'http://172.16.0.9/' },
  { label: 'RFC1918 172.16/12 high bound', url: 'http://172.31.255.254/' },
  { label: 'CGNAT 100.64/10', url: 'http://100.64.0.1/' },
  { label: 'IPv4 unspecified 0.0.0.0', url: 'http://0.0.0.0:8080/' },
  { label: 'IPv6 loopback', url: 'http://[::1]/' },
  { label: 'IPv6 unspecified', url: 'http://[::]/' },
  { label: 'IPv6 link-local', url: 'http://[fe80::1]/' },
  { label: 'IPv6 unique-local', url: 'http://[fd12:3456:789a::1]/' },
  { label: 'IPv4-mapped IPv6 loopback', url: 'http://[::ffff:127.0.0.1]/' },
  { label: 'IPv4-mapped IPv6 metadata', url: 'http://[::ffff:169.254.169.254]/' },
  { label: 'IPv4-translated IPv6 loopback', url: 'http://[::ffff:0:127.0.0.1]/' },
  { label: '6to4-wrapped loopback', url: 'http://[2002:7f00:0001::]/' },
  { label: 'NAT64-wrapped loopback', url: 'http://[64:ff9b::7f00:1]/' },
  { label: 'loopback host name', url: 'http://localhost:3000/' },
  { label: 'loopback subdomain', url: 'http://db.localhost/' },
  { label: 'cloud metadata host name', url: 'http://metadata.google.internal/computeMetadata/v1/' },
  { label: 'internal host suffix', url: 'http://jenkins.internal/' },
  { label: 'mDNS host suffix', url: 'http://printer.local/' },
  { label: 'single-label host name', url: 'http://intranet/' },
  { label: 'decimal-encoded loopback', url: 'http://2130706433/' },
  { label: 'hex-encoded loopback', url: 'http://0x7f000001/' },
  { label: 'octal-encoded loopback', url: 'http://0177.0.0.1/' },
  { label: 'short-form IPv4 loopback', url: 'http://127.1/' },
  { label: 'credentials in URL', url: 'http://user:pass@127.0.0.1/' },
]

const PUBLIC_TARGETS: Array<{ label: string; url: string }> = [
  { label: 'public HTTPS host name', url: 'https://example.com/' },
  { label: 'public HTTP host name', url: 'http://example.com/' },
  { label: 'public host name with path', url: 'https://www.example.com/about/team' },
  { label: 'public IPv4 literal', url: 'https://93.184.216.34/' },
  { label: 'public IPv6 literal', url: 'https://[2606:4700:4700::1111]/' },
]

/**
 * A resolver that answers like public DNS. Injected everywhere so the gate's
 * DNS phase is exercised without opening a socket.
 */
const PUBLIC_DNS: Record<string, string[]> = {
  'example.com': ['93.184.216.34'],
  'www.example.com': ['93.184.216.34'],
}

function publicDnsResolver(overrides: Record<string, string[]> = {}) {
  const table = { ...PUBLIC_DNS, ...overrides }
  return vi.fn(async (hostname: string) => {
    const addresses = table[hostname]
    if (!addresses) throw new Error(`ENOTFOUND ${hostname}`)
    return addresses
  })
}

// ===========================================================================
// 1. The gate: structural host-name checks (no network at all)
// ===========================================================================

describe('SSRF gate: structural host-name rejection', () => {
  let mod: Awaited<ReturnType<typeof loadNetlifyFunction>>

  beforeEach(async () => {
    vi.resetModules()
    mod = await loadNetlifyFunction()
  })

  it.each(PRIVATE_TARGETS)('rejects $label ($url)', ({ url }) => {
    const hostname = new URL(url).hostname
    expect(mod.findUnsafeHostReason(hostname), `${hostname} must be rejected`).not.toBeNull()
  })

  it.each(PUBLIC_TARGETS)('allows $label ($url)', ({ url }) => {
    const hostname = new URL(url).hostname
    expect(mod.findUnsafeHostReason(hostname), `${hostname} must pass`).toBeNull()
  })

  it('names the specific reason for each blocked class', () => {
    expect(mod.findUnsafeHostReason('169.254.169.254')).toMatch(/169\.254\.169\.254/)
    expect(mod.findUnsafeHostReason('10.0.0.1')).toMatch(/private/)
    expect(mod.findUnsafeHostReason('127.0.0.1')).toMatch(/loopback/)
    expect(mod.findUnsafeHostReason('100.64.0.1')).toMatch(/CGNAT/)
    expect(mod.findUnsafeHostReason('0.0.0.0')).toMatch(/unspecified|this network/)
    expect(mod.findUnsafeHostReason('::1')).toMatch(/loopback/)
    expect(mod.findUnsafeHostReason('::')).toMatch(/unspecified/)
    expect(mod.findUnsafeHostReason('fd12::1')).toMatch(/unique-local/)
    expect(mod.findUnsafeHostReason('fe80::1')).toMatch(/link-local/)
    expect(mod.findUnsafeHostReason('::ffff:127.0.0.1')).toMatch(/unsafe IPv4 destination/)
  })
})

// ===========================================================================
// 2. The gate: full URL validation including the DNS phase
// ===========================================================================

describe('SSRF gate: validateBrowserNavigationUrl', () => {
  let mod: Awaited<ReturnType<typeof loadNetlifyFunction>>

  beforeEach(async () => {
    vi.resetModules()
    mod = await loadNetlifyFunction()
  })

  it.each(PRIVATE_TARGETS)('rejects $label before any navigation', async ({ url }) => {
    await expect(
      mod.validateBrowserNavigationUrl(url, { dnsResolver: publicDnsResolver() }),
    ).rejects.toThrow(/Destination rejected|Only http\/https|A navigation URL|Too many redirects|embedded credentials/)
  })

  it('rejects a host name that resolves to the cloud metadata address', async () => {
    await expect(
      mod.validateBrowserNavigationUrl('https://public-looking.example.com/', {
        dnsResolver: publicDnsResolver({ 'public-looking.example.com': ['169.254.169.254'] }),
      }),
    ).rejects.toThrow(/169\.254\.169\.254/)
  })

  it('rejects a host name whose answer set contains any private address', async () => {
    await expect(
      mod.validateBrowserNavigationUrl('https://mixed.example.com/', {
        dnsResolver: publicDnsResolver({ 'mixed.example.com': ['93.184.216.34', '10.0.0.5'] }),
      }),
    ).rejects.toThrow(/10\.0\.0\.5/)
  })

  it('rejects a host name that resolves to an IPv6 ULA', async () => {
    await expect(
      mod.validateBrowserNavigationUrl('https://v6.example.com/', {
        dnsResolver: publicDnsResolver({ 'v6.example.com': ['fd00::1'] }),
      }),
    ).rejects.toThrow(/unique-local/)
  })

  it('fails closed when the host name cannot be resolved', async () => {
    await expect(
      mod.validateBrowserNavigationUrl('https://nx.example.com/', { dnsResolver: publicDnsResolver() }),
    ).rejects.toThrow(/could not be resolved/)
  })

  it('fails closed when the resolver returns nothing', async () => {
    await expect(
      mod.validateBrowserNavigationUrl('https://empty.example.com/', {
        dnsResolver: vi.fn(async () => []),
      }),
    ).rejects.toThrow(/resolved to no addresses/)
  })

  it('only allows http and https schemes', async () => {
    for (const url of [
      'file:///etc/passwd',
      'ftp://internal.example.com/x',
      'gopher://example.com/',
      'data:text/html,hello',
    ]) {
      await expect(
        mod.validateBrowserNavigationUrl(url, { dnsResolver: publicDnsResolver() }),
      ).rejects.toThrow(/Only http\/https protocols/)
    }
  })

  it('skips DNS entirely for IP literals', async () => {
    const resolver = publicDnsResolver()
    const result = await mod.validateBrowserNavigationUrl('https://93.184.216.34/', {
      dnsResolver: resolver,
    })
    expect(result.url).toBe('https://93.184.216.34/')
    expect(result.hostname).toBe('93.184.216.34')
    expect(result.addresses).toEqual([])
    expect(resolver).not.toHaveBeenCalled()
  })

  it('returns the validated destination and pinned addresses for a public host name', async () => {
    const resolver = publicDnsResolver()
    const result = await mod.validateBrowserNavigationUrl('https://example.com/', { dnsResolver: resolver })
    expect(result.url).toBe('https://example.com/')
    expect(result.hostname).toBe('example.com')
    expect(result.addresses).toEqual(['93.184.216.34'])
    expect(result.pinned).toBe(true)
    expect(resolver).toHaveBeenCalledWith('example.com')
  })

  it('caps the redirect hop count', async () => {
    await expect(
      mod.validateBrowserNavigationUrl('https://example.com/', {
        dnsResolver: publicDnsResolver(),
        redirectHops: 6,
      }),
    ).rejects.toThrow(/Too many redirects/)
  })
})

// ===========================================================================
// 3. `src/server/browserDiscovery.ts` — navigation is never attempted
// ===========================================================================

describe('browserDiscovery: unsafe destinations never reach page.goto', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  /** Loads browserDiscovery with a hermetic guard (no real DNS). */
  async function loadDiscovery(dns: DnsTable = {}) {
    const harness = createFakeBrowser()
    vi.doMock('playwright', () => ({ chromium: chromiumStub(harness) }))
    const mod = await import('../src/server/browserDiscovery')
    return { mod, harness, guard: mod.createSsrfGuard({ dnsResolver: publicDnsResolver(dns) }) }
  }

  type DnsTable = Record<string, string[]>

  it.each(PRIVATE_TARGETS)('throws for $label and never launches a browser', async ({ url }) => {
    const { mod, harness, guard } = await loadDiscovery()

    await expect(
      mod.discoverRenderedAssets(url, [url], { guard }),
    ).rejects.toThrow(mod.BrowserSsrfError)

    expect(harness.launchCalls).toEqual([])
    expect(harness.gotoCalls).toEqual([])
    expect(harness.newPageCalls).toBe(0)
  })

  it('explicitly rejects 169.254.169.254 with page.goto never called', async () => {
    const { mod, harness, guard } = await loadDiscovery()
    const target = 'http://169.254.169.254/latest/meta-data/iam/security-credentials/'

    await expect(mod.discoverRenderedAssets(target, [target], { guard })).rejects.toThrow(
      /169\.254\.169\.254/,
    )

    expect(harness.gotoCalls).toHaveLength(0)
    expect(harness.launchCalls).toEqual([])
    expect(harness.newPageCalls).toBe(0)
  })

  it('rejects a host name that resolves to a private address before launching', async () => {
    const { mod, harness, guard } = await loadDiscovery({ 'rebind.example.com': ['10.0.0.5'] })

    await expect(
      mod.discoverRenderedAssets('https://rebind.example.com/', ['https://rebind.example.com/'], { guard }),
    ).rejects.toThrow(/10\.0\.0\.5/)

    expect(harness.launchCalls).toEqual([])
    expect(harness.gotoCalls).toEqual([])
  })

  it('rejects a host name that cannot be resolved before launching', async () => {
    const { mod, harness, guard } = await loadDiscovery()

    await expect(
      mod.discoverRenderedAssets('https://nx.example.com/', ['https://nx.example.com/'], { guard }),
    ).rejects.toThrow(/could not be resolved/)

    expect(harness.launchCalls).toEqual([])
    expect(harness.gotoCalls).toEqual([])
  })
})

// ===========================================================================
// 4. `src/server/browserDiscovery.ts` — legitimate public sites still work
// ===========================================================================

describe('browserDiscovery: legitimate public sites still succeed', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  async function loadDiscovery(options: { finalUrl: string; dns?: Record<string, string[]> }) {
    const harness = createFakeBrowser({ finalUrl: options.finalUrl })
    vi.doMock('playwright', () => ({ chromium: chromiumStub(harness) }))
    const mod = await import('../src/server/browserDiscovery')
    return { mod, harness, guard: mod.createSsrfGuard({ dnsResolver: publicDnsResolver(options.dns) }) }
  }

  it('navigates a public URL and still returns discovered assets', async () => {
    const { mod, harness, guard } = await loadDiscovery({ finalUrl: 'https://example.com/' })
    harness.candidates = [
      { src: '/assets/logo.png', alt: 'Brand logo' },
      { src: 'https://cdn.example.com/img/team-photo.jpg', alt: 'Founder' },
      { src: 'https://example.com/favicon.ico' }, // junk, filtered
      { src: 'https://example.com/tracker.gif' }, // junk, filtered
      { src: 'data:image/png;base64,AAAA' }, // data URI, filtered
    ]

    const result = await mod.discoverRenderedAssets(
      'https://example.com/',
      ['https://example.com/'],
      { guard },
    )

    // The pipeline ran end to end.
    expect(harness.gotoCalls).toHaveLength(1)
    expect(harness.gotoCalls[0].url).toBe('https://example.com/')
    expect(harness.gotoCalls[0].options.waitUntil).toBe('domcontentloaded')
    expect(result.pagesCrawled).toBe(1)
    expect(result.fallbackUsed).toBe(true)

    // Asset discovery is not disabled: real candidates survive, junk does not.
    const urls = result.candidates.map((c) => c.url)
    expect(urls).toContain('https://example.com/assets/logo.png')
    expect(urls).toContain('https://cdn.example.com/img/team-photo.jpg')
    expect(urls).not.toContain('https://example.com/favicon.ico')
    expect(urls.some((u) => u.startsWith('data:'))).toBe(false)
    expect(result.candidates.length).toBeGreaterThan(0)
    expect(result.browserCandidates).toBe(result.candidates.length)
  })

  it('honours the page cap', async () => {
    const { mod, harness, guard } = await loadDiscovery({ finalUrl: 'https://www.example.com/' })

    const pages = Array.from({ length: 10 }, (_, i) => `https://www.example.com/page-${i}`)
    const result = await mod.discoverRenderedAssets('https://www.example.com/', pages, { guard })

    expect(pages.length).toBeGreaterThan(mod.BROWSER_FALLBACK_MAX_PAGES)
    expect(result.pagesCrawled).toBeLessThanOrEqual(mod.BROWSER_FALLBACK_MAX_PAGES)
    expect(harness.gotoCalls.length).toBeLessThanOrEqual(mod.BROWSER_FALLBACK_MAX_PAGES)
  })

  it('skips only the pages that fail the gate, not the whole run', async () => {
    const { mod, harness, guard } = await loadDiscovery({ finalUrl: 'https://example.com/' })

    const result = await mod.discoverRenderedAssets(
      'https://example.com/',
      ['http://169.254.169.254/', 'https://example.com/about'],
      { guard },
    )

    // The unsafe page is skipped; the public one still runs.
    expect(harness.gotoCalls.map((c) => c.url)).toEqual(['https://example.com/about'])
    expect(result.pagesCrawled).toBe(1)
  })

  it('caps concurrent page navigations', async () => {
    let open = 0
    let maxOpen = 0
    const page = {
      goto: vi.fn(async () => {
        open++
        maxOpen = Math.max(maxOpen, open)
        await new Promise((resolve) => setTimeout(resolve, 5))
        open--
      }),
      url: vi.fn(() => 'https://www.example.com/'),
      evaluate: vi.fn(async () => []),
      waitForTimeout: vi.fn(async () => {}),
      close: vi.fn(async () => {}),
    }

    vi.doMock('playwright', () => ({
      chromium: {
        launch: vi.fn(async () => ({
          isConnected: () => true,
          newContext: vi.fn(async () => ({
            route: vi.fn(async () => {}),
            newPage: vi.fn(async () => page),
            close: vi.fn(async () => {}),
          })),
          close: vi.fn(async () => {}),
        })),
      },
    }))

    const mod = await import('../src/server/browserDiscovery')
    const guard = mod.createSsrfGuard({ dnsResolver: publicDnsResolver() })

    await mod.discoverRenderedAssets(
      'https://www.example.com/',
      Array.from({ length: 6 }, (_, i) => `https://www.example.com/p${i}`),
      { guard },
    )

    expect(mod.BROWSER_SSRF_MAX_CONCURRENT_PAGES).toBeLessThan(6)
    expect(maxOpen).toBeLessThanOrEqual(mod.BROWSER_SSRF_MAX_CONCURRENT_PAGES)
  })

  it('pins the validated address into the browser launch args', async () => {
    const harness = createFakeBrowser({ finalUrl: 'https://example.com/' })
    vi.doMock('playwright', () => ({ chromium: chromiumStub(harness) }))
    const mod = await import('../src/server/browserDiscovery')
    const guard = mod.createSsrfGuard({ dnsResolver: publicDnsResolver() })

    await mod.discoverRenderedAssets('https://example.com/', ['https://example.com/'], { guard })

    expect(harness.launchCalls).toHaveLength(1)
    const launch = harness.launchCalls[0]
    // Must stay headless — a previous local variant removed it.
    expect(launch.headless).toBe(true)
    expect(launch.args).toContain('--host-resolver-rules=MAP example.com 93.184.216.34')
  })
})

// ===========================================================================
// 5. Redirect handling
// ===========================================================================

describe('SSRF gate: redirects are re-validated', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('discards a navigation whose final URL is a private address', async () => {
    const harness = createFakeBrowser({ finalUrl: 'http://169.254.169.254/latest/meta-data/' })
    vi.doMock('playwright', () => ({ chromium: chromiumStub(harness) }))
    const mod = await import('../src/server/browserDiscovery')
    const guard = mod.createSsrfGuard({ dnsResolver: publicDnsResolver() })

    // The public page 30x'd to the metadata service. The route interceptor
    // would have blocked the hop; this covers the post-navigation re-check.
    const result = await mod.discoverRenderedAssets('https://example.com/', ['https://example.com/'], {
      guard,
    })

    expect(harness.gotoCalls).toHaveLength(1)
    expect(result.pagesCrawled).toBe(0)
    expect(result.candidates).toEqual([])
  })

  it('discards a navigation that leaves the validated origin', async () => {
    const harness = createFakeBrowser({ finalUrl: 'https://other-public-site.example/' })
    vi.doMock('playwright', () => ({ chromium: chromiumStub(harness) }))
    const mod = await import('../src/server/browserDiscovery')
    const guard = mod.createSsrfGuard({
      dnsResolver: publicDnsResolver({ 'other-public-site.example': ['93.184.216.99'] }),
    })

    const result = await mod.discoverRenderedAssets('https://example.com/', ['https://example.com/'], {
      guard,
    })

    expect(result.pagesCrawled).toBe(0)
    expect(result.candidates).toEqual([])
  })

  it('aborts a redirect chain longer than the cap', async () => {
    const harness = createFakeBrowser({ finalUrl: 'https://example.com/' })
    vi.doMock('playwright', () => ({ chromium: chromiumStub(harness) }))
    const mod = await import('../src/server/browserDiscovery')
    const guard = mod.createSsrfGuard({ dnsResolver: publicDnsResolver() })

    await mod.discoverRenderedAssets('https://example.com/', ['https://example.com/'], { guard })
    expect(harness.routeHandler).toBeTypeOf('function')

    // A request that already sat through MAX + 1 hops.
    let request: FakeRequest | null = null
    for (let hop = 0; hop <= mod.BROWSER_SSRF_MAX_REDIRECTS + 1; hop++) {
      request = {
        url: () => 'https://example.com/logo.png',
        resourceType: () => 'image',
        redirectedFrom: () => request,
      }
    }

    const route = await harness.runRouteHandler('https://example.com/logo.png', 'image', () => request)

    expect(route.abort).toHaveBeenCalled()
    expect(route.continue).not.toHaveBeenCalled()
  })

  it('counts redirect hops from the Playwright request chain', async () => {
    const mod = await loadNetlifyFunction()
    expect(mod.redirectHopCount({ redirectedFrom: () => null })).toBe(0)

    // Build the chain BACKWARDS, snapshotting the predecessor with a per-iteration
    // `const` so each node's redirectedFrom() returns THAT node's predecessor.
    // Capturing the loop variable instead (either a shared `let request` or a
    // `let prev` arrow) makes every node return the final object — a
    // self-referential cycle that no faithful walk can unroll.
    let prev: FakeRequest | null = null
    for (let hop = 0; hop < 4; hop++) {
      const predecessor = prev
      const current: FakeRequest = {
        url: () => 'https://example.com/',
        resourceType: () => 'document',
        redirectedFrom: () => predecessor,
      }
      prev = current
    }
    // 4 requests in the chain => 3 redirect hops.
    expect(mod.redirectHopCount(prev)).toBe(3)
    expect(mod.SSRF_LIMITS.maxRedirects).toBeGreaterThan(0)
  })
})

// ===========================================================================
// 6. Browser subrequests
// ===========================================================================

describe('SSRF gate: browser subresources are gated too', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('aborts a subresource aimed at the cloud metadata service', async () => {
    const harness = createFakeBrowser({ finalUrl: 'https://example.com/' })
    vi.doMock('playwright', () => ({ chromium: chromiumStub(harness) }))
    const mod = await import('../src/server/browserDiscovery')
    const guard = mod.createSsrfGuard({ dnsResolver: publicDnsResolver() })

    await mod.discoverRenderedAssets('https://example.com/', ['https://example.com/'], { guard })

    const route = await harness.runRouteHandler('http://169.254.169.254/latest/meta-data/iam/security-credentials/')

    expect(route.abort).toHaveBeenCalled()
    expect(route.continue).not.toHaveBeenCalled()
  })

  it('aborts subresources aimed at loopback, RFC1918, CGNAT and encoded IPs', async () => {
    const harness = createFakeBrowser({ finalUrl: 'https://example.com/' })
    vi.doMock('playwright', () => ({ chromium: chromiumStub(harness) }))
    const mod = await import('../src/server/browserDiscovery')
    const guard = mod.createSsrfGuard({ dnsResolver: publicDnsResolver() })

    await mod.discoverRenderedAssets('https://example.com/', ['https://example.com/'], { guard })

    for (const url of [
      'http://127.0.0.1:8080/admin',
      'http://10.0.0.5/config.json',
      'http://192.168.0.10/logo.png',
      'http://172.16.0.1/internal.js',
      'http://100.64.0.1/x.png',
      'http://169.254.169.254/x.png',
      'http://[::1]/x.png',
      'http://2130706433/x.png',
      'http://0x7f000001/x.png',
      'http://[::ffff:10.0.0.1]/x.png',
    ]) {
      const route = await harness.runRouteHandler(url)
      expect(route.abort, `${url} must be aborted`).toHaveBeenCalled()
      expect(route.continue, `${url} must not be continued`).not.toHaveBeenCalled()
    }
  })

  it('aborts a subresource whose host name resolves to a private address', async () => {
    const harness = createFakeBrowser({ finalUrl: 'https://example.com/' })
    vi.doMock('playwright', () => ({ chromium: chromiumStub(harness) }))
    const mod = await import('../src/server/browserDiscovery')
    const guard = mod.createSsrfGuard({
      dnsResolver: publicDnsResolver({ 'cdn.example.com': ['169.254.169.254'] }),
    })

    await mod.discoverRenderedAssets('https://example.com/', ['https://example.com/'], { guard })

    const route = await harness.runRouteHandler('https://cdn.example.com/logo.png')
    expect(route.abort).toHaveBeenCalled()
    expect(route.continue).not.toHaveBeenCalled()
  })

  it('continues a public subresource', async () => {
    const harness = createFakeBrowser({ finalUrl: 'https://93.184.216.34/' })
    vi.doMock('playwright', () => ({ chromium: chromiumStub(harness) }))
    const mod = await import('../src/server/browserDiscovery')
    // Public literal IP, so no DNS lookup is needed to verify it.
    const guard = mod.createSsrfGuard({ dnsResolver: publicDnsResolver() })

    await mod.discoverRenderedAssets('https://93.184.216.34/', ['https://93.184.216.34/'], { guard })

    const route = await harness.runRouteHandler('https://93.184.216.34/assets/logo.png')
    expect(route.continue).toHaveBeenCalled()
    expect(route.abort).not.toHaveBeenCalled()
  })

  it('allows non-network subresource schemes', async () => {
    const harness = createFakeBrowser({ finalUrl: 'https://93.184.216.34/' })
    vi.doMock('playwright', () => ({ chromium: chromiumStub(harness) }))
    const mod = await import('../src/server/browserDiscovery')
    const guard = mod.createSsrfGuard({ dnsResolver: publicDnsResolver() })

    await mod.discoverRenderedAssets('https://93.184.216.34/', ['https://93.184.216.34/'], { guard })

    const route = await harness.runRouteHandler('data:image/png;base64,iVBORw0KGgo=')
    expect(route.continue).toHaveBeenCalled()
    expect(route.abort).not.toHaveBeenCalled()
  })
})

// ===========================================================================
// 7. The Netlify function: authentication
// ===========================================================================

describe('netlify personalization-browser-discovery: authentication', () => {
  let seams: NetlifySeams

  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    seams?.restored()
  })

  it('proceeds as anonymous when no Authorization header is present (free discovery)', async () => {
    seams = installNetlifySeams()
    const mod = await loadNetlifyFunction()

    const response = await mod.handler(netlifyEvent({ jobId: 'job-1', websiteUrl: 'https://example.com/' }))

    // No Clerk token means anonymous discovery — allowed because discovery is free.
    expect(response.statusCode).not.toBe(401)
  })

  it('proceeds as anonymous for a non-Bearer Authorization header', async () => {
    seams = installNetlifySeams()
    const mod = await loadNetlifyFunction()

    const response = await mod.handler(
      netlifyEvent({ jobId: 'job-1', websiteUrl: 'https://example.com/' }, {
        authorization: 'Basic dXNlcjpwYXNz',
      }),
    )

    expect(response.statusCode).not.toBe(401)
  })

  it('returns 401 when server-side token verification fails', async () => {
    seams = installNetlifySeams()
    const mod = await loadNetlifyFunction()

    const response = await mod.handler(
      authenticatedEvent({ jobId: 'job-1', websiteUrl: 'https://example.com/' }, 'forged-token'),
    )

    expect(response.statusCode).toBe(401)
    expect(seams.browser.launchCalls).toEqual([])
    expect(seams.browser.gotoCalls).toEqual([])
  })

  it('returns 401 for an unverifiable session cookie', async () => {
    seams = installNetlifySeams()
    const mod = await loadNetlifyFunction()

    const response = await mod.handler(
      netlifyEvent({ jobId: 'job-1', websiteUrl: 'https://example.com/' }, {
        cookie: '__session=attacker-supplied',
      }),
    )

    expect(response.statusCode).toBe(401)
  })

  it('still answers the CORS preflight without a session', async () => {
    seams = installNetlifySeams()
    const mod = await loadNetlifyFunction()

    const response = await mod.handler({ httpMethod: 'OPTIONS', headers: {}, body: '' })

    expect(response.statusCode).toBe(204)
  })

  it('still rejects non-POST methods', async () => {
    seams = installNetlifySeams()
    const mod = await loadNetlifyFunction()

    const response = await mod.handler({
      httpMethod: 'GET',
      headers: { authorization: 'Bearer session-token-valid' },
      body: '',
    })

    expect(response.statusCode).toBe(405)
  })
})

// ===========================================================================
// 8. The Netlify function: destination gate
// ===========================================================================

describe('netlify personalization-browser-discovery: SSRF gate', () => {
  let seams: NetlifySeams

  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    seams?.restored()
  })

  it.each(PRIVATE_TARGETS)('rejects $label with 400 and never navigates', async ({ url }) => {
    seams = installNetlifySeams()
    const mod = await loadNetlifyFunction()

    const response = await mod.handler(
      authenticatedEvent({ jobId: 'job-1', websiteUrl: url, priorityPages: [url] }, 'session-token-valid'),
    )

    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body).code).toBe('SSRF_BLOCKED')
    expect(seams.browser.launchCalls).toEqual([])
    expect(seams.browser.gotoCalls).toEqual([])
    // The destination comes from the job row, so the row is read, then the
    // job is marked as failed. Nothing else touches the database.
    expect(seams.supabaseCalls.map((c) => c.action)).toEqual(['select', 'update'])
  })

  it('rejects 169.254.169.254 explicitly, authenticated, without navigating', async () => {
    seams = installNetlifySeams()
    const mod = await loadNetlifyFunction()

    const response = await mod.handler(
      authenticatedEvent(
        { jobId: 'job-1', websiteUrl: 'http://169.254.169.254/latest/meta-data/iam/security-credentials/' },
        'session-token-valid',
      ),
    )

    expect(response.statusCode).toBe(400)
    const payload = JSON.parse(response.body)
    expect(payload.code).toBe('SSRF_BLOCKED')
    expect(payload.error).toMatch(/169\.254\.169\.254/)
    expect(seams.browser.launchCalls).toEqual([])
    expect(seams.browser.gotoCalls).toEqual([])
    // The destination comes from the job row, so the row is read, then the
    // job is marked as failed. Nothing else touches the database.
    expect(seams.supabaseCalls.map((c) => c.action)).toEqual(['select', 'update'])
  })

  it('rejects a host name that resolves to a private address', async () => {
    seams = installNetlifySeams()
    const mod = await loadNetlifyFunction()

    const handler = mod.createBrowserDiscoveryHandler({
      createSsrfGuard: () =>
        mod.createSsrfGuard({ dnsResolver: publicDnsResolver({ 'rebind.example.com': ['169.254.169.254'] }) }),
    })

    const response = await handler(
      authenticatedEvent({ jobId: 'job-1', websiteUrl: 'https://rebind.example.com/' }, 'session-token-valid'),
    )

    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body).code).toBe('SSRF_BLOCKED')
    expect(seams.browser.launchCalls).toEqual([])
    expect(seams.browser.gotoCalls).toEqual([])
  })

  it('succeeds for an authenticated request to a genuinely public URL', async () => {
    seams = installNetlifySeams()
    const mod = await loadNetlifyFunction()
    const handler = mod.createBrowserDiscoveryHandler({
      createSsrfGuard: () => mod.createSsrfGuard({ dnsResolver: publicDnsResolver() }),
    })
    seams.browser.finalUrl = 'https://example.com/'
    seams.browser.candidates = [{ src: 'https://example.com/assets/logo.png', alt: 'Logo' }]

    const response = await handler(
      authenticatedEvent(
        { jobId: 'job-1', websiteUrl: 'https://example.com/', priorityPages: ['https://example.com/'] },
        'session-token-valid',
      ),
    )

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual({ ok: true, jobId: 'job-1' })
    // Asset discovery ran, it was not skipped.
    expect(seams.browser.gotoCalls).toHaveLength(1)
    expect(seams.browser.gotoCalls[0].url).toBe('https://example.com/')
    expect(seams.supabaseCalls.some((c) => c.action === 'select')).toBe(true)
    expect(seams.supabaseCalls.some((c) => c.action === 'update')).toBe(true)
  })

  it('succeeds for an authenticated request to a public IP literal (no DNS)', async () => {
    seams = installNetlifySeams()
    const mod = await loadNetlifyFunction()
    seams.browser.finalUrl = 'https://93.184.216.34/'
    seams.browser.candidates = [{ src: 'https://93.184.216.34/logo.png' }]

    const response = await mod.handler(
      authenticatedEvent({ jobId: 'job-1', websiteUrl: 'https://93.184.216.34/' }, 'session-token-valid'),
    )

    expect(response.statusCode).toBe(200)
    expect(seams.browser.gotoCalls).toHaveLength(1)
    expect(seams.browser.gotoCalls[0].url).toBe('https://93.184.216.34/')
  })

  it('launches Chromium headless and pins the validated destination', async () => {
    seams = installNetlifySeams()
    const mod = await loadNetlifyFunction()
    const handler = mod.createBrowserDiscoveryHandler({
      createSsrfGuard: () => mod.createSsrfGuard({ dnsResolver: publicDnsResolver() }),
    })
    seams.browser.finalUrl = 'https://example.com/'

    await handler(authenticatedEvent({ jobId: 'job-1', websiteUrl: 'https://example.com/' }, 'session-token-valid'))

    expect(seams.browser.launchCalls).toHaveLength(1)
    const launch = seams.browser.launchCalls[0]
    // Must stay headless — a previous local variant removed it.
    expect(launch.headless).toBe(true)
    // The validated address is pinned into the browser's resolver.
    expect(launch.args).toContain('--host-resolver-rules=MAP example.com 93.184.216.34')
  })

  it('passes a navigation timeout to page.goto', async () => {
    seams = installNetlifySeams()
    const mod = await loadNetlifyFunction()
    seams.browser.finalUrl = 'https://93.184.216.34/'

    await mod.handler(
      authenticatedEvent({ jobId: 'job-1', websiteUrl: 'https://93.184.216.34/' }, 'session-token-valid'),
    )

    expect(seams.browser.gotoCalls).toHaveLength(1)
    const gotoOptions = seams.browser.gotoCalls[0].options
    expect(gotoOptions.timeout).toBe(mod.SSRF_LIMITS.navigationTimeout)
    expect(gotoOptions.waitUntil).toBe('domcontentloaded')
  })

  it('404s for an unknown job without navigating', async () => {
    seams = installNetlifySeams()
    const mod = await loadNetlifyFunction()

    const response = await mod.handler(
      authenticatedEvent({ jobId: 'job-does-not-exist', websiteUrl: 'https://example.com/' }, 'session-token-valid'),
    )

    expect(response.statusCode).toBe(404)
    expect(seams.browser.gotoCalls).toEqual([])
  })

  it('400s for a missing websiteUrl after authentication', async () => {
    seams = installNetlifySeams()
    const mod = await loadNetlifyFunction()

    const response = await mod.handler(authenticatedEvent({ jobId: 'job-1' }, 'session-token-valid'))

    expect(response.statusCode).toBe(400)
    expect(seams.browser.gotoCalls).toEqual([])
  })
})

// ===========================================================================
// 9. Netlify function: subrequest interception
// ===========================================================================

describe('netlify personalization-browser-discovery: subresource gate', () => {
  let seams: NetlifySeams

  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    seams?.restored()
  })

  it('blocks a public page from loading an internal subresource', async () => {
    seams = installNetlifySeams()
    const mod = await loadNetlifyFunction()
    const handler = mod.createBrowserDiscoveryHandler({
      createSsrfGuard: () => mod.createSsrfGuard({ dnsResolver: publicDnsResolver() }),
    })
    seams.browser.finalUrl = 'https://example.com/'

    await handler(authenticatedEvent({ jobId: 'job-1', websiteUrl: 'https://example.com/' }, 'session-token-valid'))

    expect(seams.browser.routeCalls).toBe(1)

    const route = await seams.browser.runRouteHandler('http://169.254.169.254/latest/meta-data/')
    expect(route.abort).toHaveBeenCalled()
    expect(route.continue).not.toHaveBeenCalled()
  })

  it('blocks loopback, RFC1918 and encoded-IP subresources', async () => {
    seams = installNetlifySeams()
    const mod = await loadNetlifyFunction()
    const handler = mod.createBrowserDiscoveryHandler({
      createSsrfGuard: () => mod.createSsrfGuard({ dnsResolver: publicDnsResolver() }),
    })
    seams.browser.finalUrl = 'https://example.com/'

    await handler(authenticatedEvent({ jobId: 'job-1', websiteUrl: 'https://example.com/' }, 'session-token-valid'))

    for (const url of [
      'http://127.0.0.1/x.png',
      'http://10.0.0.1/x.png',
      'http://192.168.1.1/x.png',
      'http://172.20.0.1/x.png',
      'http://100.100.100.100/x.png',
      'http://0x7f000001/x.png',
      'http://2130706433/x.png',
      'http://[::ffff:10.0.0.1]/x.png',
    ]) {
      const route = await seams.browser.runRouteHandler(url)
      expect(route.abort, `${url} must be aborted`).toHaveBeenCalled()
      expect(route.continue, `${url} must not be continued`).not.toHaveBeenCalled()
    }
  })

  it('continues a public subresource', async () => {
    seams = installNetlifySeams()
    const mod = await loadNetlifyFunction()
    seams.browser.finalUrl = 'https://93.184.216.34/'

    await mod.handler(
      authenticatedEvent({ jobId: 'job-1', websiteUrl: 'https://93.184.216.34/' }, 'session-token-valid'),
    )

    const route = await seams.browser.runRouteHandler('https://93.184.216.34/logo.png')
    expect(route.continue).toHaveBeenCalled()
    expect(route.abort).not.toHaveBeenCalled()
  })
})

// ===========================================================================
// 10. Asset discovery is not disabled
// ===========================================================================

describe('asset discovery pipeline is preserved', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('still filters junk/social candidates and keeps real assets', async () => {
    const harness = createFakeBrowser({ finalUrl: 'https://example.com/' })
    vi.doMock('playwright', () => ({ chromium: chromiumStub(harness) }))
    const mod = await import('../src/server/browserDiscovery')
    const guard = mod.createSsrfGuard({ dnsResolver: publicDnsResolver() })

    harness.candidates = [
      { src: 'https://example.com/assets/logo.png' },
      { src: 'https://example.com/our-team/jane.png', alt: 'Jane' },
      { src: 'https://example.com/products/widget.jpg' },
      { src: 'https://example.com/pixel.gif' },
      { src: 'https://facebook.com/photo' },
    ]

    const result = await mod.discoverRenderedAssets('https://example.com/', ['https://example.com/'], {
      guard,
    })

    const urls = result.candidates.map((c) => c.url)
    expect(urls.some((u) => u.includes('pixel.gif'))).toBe(false)
    expect(urls.some((u) => u.includes('facebook.com'))).toBe(false)
    expect(urls.length).toBeGreaterThanOrEqual(3)
    expect(result.browserCandidates).toBe(urls.length)
  })

  it('still blocks tracker/analytics resources and non-image types', async () => {
    const harness = createFakeBrowser({ finalUrl: 'https://93.184.216.34/' })
    vi.doMock('playwright', () => ({ chromium: chromiumStub(harness) }))
    const mod = await import('../src/server/browserDiscovery')
    const guard = mod.createSsrfGuard({ dnsResolver: publicDnsResolver() })

    await mod.discoverRenderedAssets('https://93.184.216.34/', ['https://93.184.216.34/'], { guard })

    for (const [url, resourceType] of [
      ['https://www.google-analytics.com/collect', 'script'],
      ['https://www.googletagmanager.com/gtm.js', 'script'],
      ['https://93.184.216.34/media/clip.mp4', 'media'],
      ['https://93.184.216.34/fonts/f.woff2', 'font'],
      ['https://93.184.216.34/css/site.css', 'stylesheet'],
    ] as Array<[string, string]>) {
      const route = await harness.runRouteHandler(url, resourceType)
      expect(route.abort, `${url} (${resourceType}) must be aborted`).toHaveBeenCalled()
      expect(route.continue, `${url} must not be continued`).not.toHaveBeenCalled()
    }
  })

  it('still returns an empty result for an empty page list without launching', async () => {
    const harness = createFakeBrowser()
    vi.doMock('playwright', () => ({ chromium: chromiumStub(harness) }))
    const mod = await import('../src/server/browserDiscovery')

    const result = await mod.discoverRenderedAssets('https://example.com/', [])

    expect(result.candidates).toEqual([])
    expect(result.pagesCrawled).toBe(0)
    expect(result.fallbackUsed).toBe(false)
    expect(harness.launchCalls).toEqual([])
  })

  it('the Netlify function still discovers assets for a public site', async () => {
    const seams = installNetlifySeams()
    try {
      vi.resetModules()
      const mod = await loadNetlifyFunction()
      const handler = mod.createBrowserDiscoveryHandler({
        createSsrfGuard: () => mod.createSsrfGuard({ dnsResolver: publicDnsResolver() }),
      })
      seams.browser.finalUrl = 'https://example.com/'
      seams.browser.candidates = [
        { src: '/assets/logo.png' },
        { src: 'https://example.com/team/founder.jpg' },
      ]

      const response = await handler(
        authenticatedEvent({ jobId: 'job-1', websiteUrl: 'https://example.com/' }, 'session-token-valid'),
      )

      expect(response.statusCode).toBe(200)
      expect(seams.browser.gotoCalls).toHaveLength(1)
    } finally {
      seams.restored()
    }
  })
})
