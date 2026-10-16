import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import net from 'node:net'
import { EventEmitter } from 'node:events'
import { createRequire } from 'node:module'

/**
 * Fail-closed contract for the browser-discovery allowlist proxy.
 *
 * The PR review finding this suite guards: `startAllowlistProxy` failing used
 * to log a warning and continue. Playwright's `context.route` is not invoked
 * for redirect targets or service-worker fetches, so the proxy is the only
 * layer that checks every hop — continuing without it reopens SSRF. Two
 * properties are asserted here:
 *
 *   1. A proxy that cannot start aborts the run (both `src/server/`
 *      `browserDiscovery.ts` and the Netlify function), and no browser is ever
 *      launched in that state.
 *   2. `BROWSER_DISCOVERY_ALLOWLIST_PROXY=0` cannot disable the network layer
 *      in production; outside production the escape hatch still exists.
 *
 * Hermetic as always: Playwright is replaced at the module boundary, DNS is
 * mocked (or bypassed with IP literals), and the only sockets opened are to
 * this process's own loopback listeners.
 */

const nodeRequire = createRequire(import.meta.url)
const NETLIFY_FN = '../netlify/functions/personalization-browser-discovery.js'
const NETLIFY_FN_DIR = 'netlify/functions'

// ---------------------------------------------------------------------------
// DNS mock (used by the guard injected into the proxy)
// ---------------------------------------------------------------------------

const dnsMocks = vi.hoisted(() => ({ resolve4: vi.fn(), resolve6: vi.fn() }))
vi.mock('dns', () => {
  const promises = { resolve4: dnsMocks.resolve4, resolve6: dnsMocks.resolve6 }
  return { default: { promises }, promises }
})

const PUBLIC_DNS: Record<string, string[]> = {
  'example.com': ['93.184.216.34'],
  'www.example.com': ['93.184.216.34'],
}

function publicDnsResolver(overrides: Record<string, string[]> = {}) {
  const table = { ...PUBLIC_DNS, ...overrides }
  dnsMocks.resolve4.mockImplementation(async (hostname: string) => {
    const addresses = table[hostname]
    if (!addresses) throw new Error(`ENOTFOUND ${hostname}`)
    return addresses.filter((address) => address.indexOf(':') === -1)
  })
  dnsMocks.resolve6.mockImplementation(async (hostname: string) => {
    const addresses = table[hostname]
    if (!addresses) throw new Error(`ENOTFOUND ${hostname}`)
    const v6 = addresses.filter((address) => address.indexOf(':') !== -1)
    if (v6.length === 0) throw new Error(`ENODATA ${hostname}`)
    return v6
  })
  return vi.fn(async (hostname: string) => {
    const addresses = table[hostname]
    if (!addresses) throw new Error(`ENOTFOUND ${hostname}`)
    return addresses
  })
}

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
  launchCalls: Array<{ headless?: boolean; args?: string[]; executablePath?: string; proxy?: { server: string } }>
  newContextCalls: Array<Record<string, unknown>>
  gotoCalls: Array<{ url: string; options: { timeout?: number; waitUntil?: string } }>
  newPageCalls: number
  routeCalls: number
  routeHandler: ((route: FakeRoute, request: FakeRequest) => Promise<unknown>) | null
  finalUrl: string
  candidates: Array<{ src: string; alt?: string }>
}

function createFakeBrowser(options: { finalUrl?: string; candidates?: Array<{ src: string; alt?: string }> } = {}) {
  const harness: FakeBrowserHarness = {
    launchCalls: [],
    newContextCalls: [],
    gotoCalls: [],
    newPageCalls: 0,
    routeCalls: 0,
    routeHandler: null,
    finalUrl: options.finalUrl ?? '',
    candidates: options.candidates ?? [],
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

function chromiumStub(harness: FakeBrowserHarness) {
  return {
    launch: vi.fn(async (launchOptions: { headless?: boolean; args?: string[]; executablePath?: string; proxy?: { server: string } }) => {
      harness.launchCalls.push(launchOptions)
      return {
        isConnected: () => true,
        newContext: vi.fn(async (contextOptions: Record<string, unknown>) => {
          harness.newContextCalls.push(contextOptions)
          return {
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
          }
        }),
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
  payload?: Record<string, unknown>
}

function fakeSupabaseClient(calls: SupabaseCall[], existingJobId = 'job-1') {
  return {
    from: (table: string) => ({
      select: () => ({
        eq: (_column: string, value: unknown) => ({
          single: async () => ({
            data: value === existingJobId ? { id: 'job-1', website_url: 'https://93.184.216.34/' } : null,
            error: value === existingJobId ? null : { message: 'not found' },
          }),
        }),
      }),
      update: (payload: Record<string, unknown>) => ({
        eq: () => {
          calls.push({ table, action: 'update', payload })
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

  return {
    browser,
    supabaseCalls,
    restored: () => {
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

function authenticatedEvent(body: unknown, token: string | null) {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (token) headers.authorization = `Bearer ${token}`
  return {
    httpMethod: 'POST',
    headers,
    body: JSON.stringify(body),
  }
}

// ---------------------------------------------------------------------------
// node:http failure seam
// ---------------------------------------------------------------------------

/** A `createServer()` whose `listen()` always emits an error, like EADDRINUSE. */
function failingHttpCreateServer() {
  const server: any = new EventEmitter()
  server.listen = (_port: number, _host: string, _cb: () => void) => {
    process.nextTick(() => {
      server.emit('error', new Error('listen EADDRINUSE 127.0.0.1:0'))
    })
  }
  server.close = (cb?: () => void) => {
    cb?.()
  }
  server.closeAllConnections = () => {}
  return server
}

/** Replaces node:http (both spellings) with a factory whose listen fails. */
function mockHttpListenFailure() {
  const factory = async (importOriginal: () => Promise<unknown>) => {
    const actual = (await importOriginal()) as Record<string, any>
    const patchedBase = { ...(actual.default || actual), createServer: failingHttpCreateServer }
    return { ...actual, ...patchedBase, default: patchedBase }
  }
  vi.doMock('node:http', factory)
  vi.doMock('http', factory)
}

// ---------------------------------------------------------------------------
// env helpers
// ---------------------------------------------------------------------------

const originalEnv = { ...process.env }

function forceProduction() {
  process.env.NODE_ENV = 'production'
  delete (process.env as Record<string, string | undefined>).VITEST
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
  vi.doUnmock('node:http')
  vi.doUnmock('http')
  vi.resetModules()
  // Restore the whole environment, so a failure mid-test cannot leak
  // NODE_ENV=production into later suites.
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key]
  }
  Object.assign(process.env, originalEnv)
})

// ===========================================================================
// 1. The production escape hatch
// ===========================================================================

describe('discovery allowlist proxy: the production escape hatch', () => {
  it('src/server/browserDiscovery ignores the toggle in production', async () => {
    const { shouldUseAllowlistProxy } = await import('../src/server/browserDiscovery')

    process.env.NODE_ENV = 'production'
    delete process.env.VITEST
    process.env.BROWSER_DISCOVERY_ALLOWLIST_PROXY = '0'
    expect(shouldUseAllowlistProxy()).toBe(true)

    delete process.env.BROWSER_DISCOVERY_ALLOWLIST_PROXY
    expect(shouldUseAllowlistProxy()).toBe(true)
  })

  it('src/server/browserDiscovery still honours the toggle outside production', async () => {
    const { shouldUseAllowlistProxy } = await import('../src/server/browserDiscovery')

    process.env.NODE_ENV = 'development'
    delete process.env.VITEST
    process.env.BROWSER_DISCOVERY_ALLOWLIST_PROXY = '0'
    expect(shouldUseAllowlistProxy()).toBe(false)

    delete process.env.BROWSER_DISCOVERY_ALLOWLIST_PROXY
    expect(shouldUseAllowlistProxy()).toBe(true)
  })

  it('the Netlify function ignores the toggle in production', async () => {
    const mod = await loadNetlifyFunction()

    process.env.NODE_ENV = 'production'
    delete process.env.VITEST
    process.env.BROWSER_DISCOVERY_ALLOWLIST_PROXY = '0'
    expect(typeof mod.shouldUseAllowlistProxy).toBe('function')
    expect(mod.shouldUseAllowlistProxy()).toBe(true)

    delete process.env.BROWSER_DISCOVERY_ALLOWLIST_PROXY
    expect(mod.shouldUseAllowlistProxy()).toBe(true)
  })

  it('the Netlify function still honours the toggle outside production', async () => {
    const mod = await loadNetlifyFunction()

    process.env.NODE_ENV = 'development'
    delete process.env.VITEST
    process.env.BROWSER_DISCOVERY_ALLOWLIST_PROXY = '0'
    expect(mod.shouldUseAllowlistProxy()).toBe(false)

    delete process.env.BROWSER_DISCOVERY_ALLOWLIST_PROXY
    expect(mod.shouldUseAllowlistProxy()).toBe(true)
  })
})

// ===========================================================================
// 2. A proxy that cannot start aborts the run
// ===========================================================================

describe('browserDiscovery: a proxy that cannot start fails the run', () => {
  async function loadDiscoveryWithFailingListener() {
    const harness = createFakeBrowser({ finalUrl: 'https://example.com/' })
    vi.resetModules()
    vi.doMock('playwright', () => ({ chromium: chromiumStub(harness) }))
    mockHttpListenFailure()
    const mod = await import('../src/server/browserDiscovery')
    const guard = mod.createSsrfGuard({ dnsResolver: publicDnsResolver() })
    return { mod, harness, guard }
  }

  it('rejects the run and never launches a browser', async () => {
    const { mod, harness, guard } = await loadDiscoveryWithFailingListener()
    forceProduction()

    await expect(
      mod.discoverRenderedAssets('https://example.com/', ['https://example.com/'], { guard }),
    ).rejects.toThrow(/EADDRINUSE|allowlist proxy/i)

    // No browser process, no navigation: the failure happened before any of it.
    expect(harness.launchCalls).toEqual([])
    expect(harness.newPageCalls).toBe(0)
    expect(harness.gotoCalls).toEqual([])
  })

  it('fails the run even when the proxy failure message is opaque', async () => {
    const { mod, harness, guard } = await loadDiscoveryWithFailingListener()
    forceProduction()

    await expect(
      mod.discoverRenderedAssets('https://example.com/', ['https://example.com/about'], { guard }),
    ).rejects.toThrow(/EADDRINUSE/i)
    expect(harness.launchCalls).toEqual([])
  })

  it('still runs normally when the listener can be created', async () => {
    const harness = createFakeBrowser({ finalUrl: 'https://example.com/' })
    vi.resetModules()
    vi.doMock('playwright', () => ({ chromium: chromiumStub(harness) }))
    const mod = await import('../src/server/browserDiscovery')
    const guard = mod.createSsrfGuard({ dnsResolver: publicDnsResolver() })

    const result = await mod.discoverRenderedAssets('https://example.com/', ['https://example.com/'], { guard })

    expect(result.fallbackUsed).toBe(true)
    expect(harness.gotoCalls).toHaveLength(1)
  })
})

// ===========================================================================
// 3. In a production config the proxy really is started and pinned
// ===========================================================================

describe('browserDiscovery: the production config starts the allowlist proxy', () => {
  it('launches the browser through the proxy with headless and blocked service workers', async () => {
    const harness = createFakeBrowser({ finalUrl: 'https://example.com/' })
    vi.resetModules()
    vi.doMock('playwright', () => ({ chromium: chromiumStub(harness) }))
    const mod = await import('../src/server/browserDiscovery')
    const guard = mod.createSsrfGuard({ dnsResolver: publicDnsResolver() })
    forceProduction()

    const result = await mod.discoverRenderedAssets('https://example.com/', ['https://example.com/'], { guard })

    expect(result.fallbackUsed).toBe(true)
    expect(harness.launchCalls).toHaveLength(1)

    const launch = harness.launchCalls[0]
    // The security primitives that must never be removed.
    expect(launch.headless).toBe(true)
    // The proxy the launch ran through really was a local listener.
    expect(launch.proxy?.server).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/)

    // `--host-resolver-rules` still binds the validated address.
    expect(Array.isArray(launch.args)).toBe(true)
    expect(launch.args?.some((arg) => arg.includes('--host-resolver-rules=MAP example.com 93.184.216.34'))).toBe(true)

    expect(harness.newContextCalls).toHaveLength(1)
    expect(harness.newContextCalls[0].serviceWorkers).toBe('block')
  })

  it('cannot be talked out of the proxy by the environment toggle', async () => {
    const harness = createFakeBrowser({ finalUrl: 'https://example.com/' })
    vi.resetModules()
    vi.doMock('playwright', () => ({ chromium: chromiumStub(harness) }))
    const mod = await import('../src/server/browserDiscovery')
    const guard = mod.createSsrfGuard({ dnsResolver: publicDnsResolver() })

    forceProduction()
    process.env.BROWSER_DISCOVERY_ALLOWLIST_PROXY = '0'

    await mod.discoverRenderedAssets('https://example.com/', ['https://example.com/'], { guard })

    expect(harness.launchCalls[0].proxy?.server).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/)
  })
})

// ===========================================================================
// 4. The proxy itself refuses unsafe destinations (real sockets, loopback only)
// ===========================================================================

describe('browserDiscovery.startAllowlistProxy: refuses what the gate rejects', () => {
  it('answers 403 for an absolute-form request to a private destination', async () => {
    vi.resetModules()
    const mod = await import('../src/server/browserDiscovery')
    const guard = mod.createSsrfGuard({ dnsResolver: publicDnsResolver() })

    const proxy = await mod.startAllowlistProxy(guard)
    expect(proxy).not.toBeNull()
    if (!proxy) return

    try {
      const port = new URL(proxy.url).port
      const status = await new Promise<number>((resolve, reject) => {
        const req = net.connect(Number(port), '127.0.0.1', () => {
          req.write(
            'GET http://169.254.169.254/latest/meta-data/ HTTP/1.1\r\nHost: 169.254.169.254\r\nConnection: close\r\n\r\n',
          )
        })
        let raw = ''
        req.on('data', (chunk) => {
          raw += chunk.toString()
        })
        req.on('end', () => {
          const match = /^HTTP\/1\.[01] (\d{3})/.exec(raw)
          resolve(match ? Number(match[1]) : 0)
        })
        req.on('error', reject)
      })

      expect(status).toBe(403)
      expect(proxy.rejected()).toBeGreaterThan(0)
    } finally {
      await proxy.close()
    }
  })

  it('refuses a CONNECT tunnel to a host that resolves to a private address', async () => {
    vi.resetModules()
    const mod = await import('../src/server/browserDiscovery')
    const guard = mod.createSsrfGuard({
      dnsResolver: publicDnsResolver({ 'rebind.example.com': ['10.0.0.5'] }),
    })

    const proxy = await mod.startAllowlistProxy(guard)
    expect(proxy).not.toBeNull()
    if (!proxy) return

    try {
      const port = new URL(proxy.url).port
      const status = await new Promise<number>((resolve, reject) => {
        const req = net.connect(Number(port), '127.0.0.1', () => {
          req.write('CONNECT rebind.example.com:443 HTTP/1.1\r\nHost: rebind.example.com:443\r\n\r\n')
        })
        let raw = ''
        req.on('data', (chunk) => {
          raw += chunk.toString()
        })
        req.on('end', () => {
          const match = /^HTTP\/1\.[01] (\d{3})/.exec(raw)
          resolve(match ? Number(match[1]) : 0)
        })
        req.on('error', reject)
      })

      expect(status).toBe(403)
      expect(proxy.rejected()).toBeGreaterThan(0)
    } finally {
      await proxy.close()
    }
  })
})

// ===========================================================================
// 5. The Netlify function: same fail-closed contract
// ===========================================================================

describe('Netlify browser discovery: a proxy that cannot start aborts the run', () => {
  it('marks the job as an error and never launches a browser', async () => {
    const seams = installNetlifySeams()
    const mod = await loadNetlifyFunction()
    mockHttpListenFailure()
    forceProduction()

    try {
      const response = await mod.handler(
        authenticatedEvent({ websiteUrl: 'https://93.184.216.34/', jobId: 'job-1' }, 'session-token-valid'),
      )

      // No browser process, no navigation: the failure came first.
      expect(seams.browser.launchCalls).toEqual([])
      expect(seams.browser.newPageCalls).toBe(0)

      // The job was recorded as failed rather than silently completed.
      const errorUpdate = seams.supabaseCalls.find(
        (call) => call.action === 'update' && (call.payload as { status?: string } | undefined)?.status === 'error',
      )
      expect(errorUpdate).toBeDefined()
      expect(String((errorUpdate?.payload as { error_message?: string }).error_message)).toMatch(/EADDRINUSE/i)

      expect(response.statusCode).toBe(200)
    } finally {
      seams.restored()
    }
  })

  it('runs normally, through the proxy, when the listener can be created', async () => {
    const seams = installNetlifySeams()
    const mod = await loadNetlifyFunction()
    forceProduction()

    try {
      await mod.handler(
        authenticatedEvent({ websiteUrl: 'https://93.184.216.34/', jobId: 'job-1' }, 'session-token-valid'),
      )

      expect(seams.browser.launchCalls).toHaveLength(1)
      const launch = seams.browser.launchCalls[0]
      expect(launch.headless).toBe(true)
      expect(launch.proxy?.server).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/)

      // `serviceWorkers: 'block'` is applied to the context created inside
      // `collectBrowserCandidates` as well.
      expect(seams.browser.newContextCalls.length).toBeGreaterThan(0)
      for (const contextOptions of seams.browser.newContextCalls) {
        expect(contextOptions.serviceWorkers).toBe('block')
      }

      const completeUpdate = seams.supabaseCalls.find(
        (call) => call.action === 'update' && (call.payload as { status?: string } | undefined)?.status === 'complete',
      )
      expect(completeUpdate).toBeDefined()
    } finally {
      seams.restored()
    }
  })

  it('the exported proxy refuses private destinations over a real socket', async () => {
    const seams = installNetlifySeams()
    const mod = await loadNetlifyFunction()
    forceProduction()

    try {
      const guard = mod.createSsrfGuard({ dnsResolver: publicDnsResolver() })
      const proxy = await mod.startAllowlistProxy(guard)
      expect(proxy).not.toBeNull()
      if (!proxy) return

      const port = new URL(proxy.url).port
      const status = await new Promise<number>((resolve, reject) => {
        const req = net.connect(Number(port), '127.0.0.1', () => {
          req.write('CONNECT 169.254.169.254:443 HTTP/1.1\r\nHost: 169.254.169.254:443\r\n\r\n')
        })
        let raw = ''
        req.on('data', (chunk) => {
          raw += chunk.toString()
        })
        req.on('end', () => {
          const match = /^HTTP\/1\.[01] (\d{3})/.exec(raw)
          resolve(match ? Number(match[1]) : 0)
        })
        req.on('error', reject)
      })

      expect(status).toBe(403)
      expect(proxy.rejected()).toBeGreaterThan(0)
      await proxy.close()
    } finally {
      seams.restored()
    }
  })
})
