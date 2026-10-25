/**
 * End-to-end behaviour of the discovery worker's job lifecycle.
 *
 * Each case drives the real handler and asserts what it writes to the job row,
 * because the caller only ever sees the job row (through the status route):
 *
 *   - an anonymous job dispatched by the route (server-to-server, so the
 *     request carries the route's egress IP) is driven, not refused;
 *   - the worker refuses everything until INTERNAL_FUNCTION_SECRET is set,
 *     and every call must carry it;
 *   - free-layer assets survive browser success, browser failure, and a
 *     disabled browser phase;
 *   - an unexpected failure never leaves the handler throwing.
 *
 * Playwright is substituted through `require.cache` (as in
 * browser-discovery-ssrf.vitest.test.ts); everything else through the
 * handler's injectable dependencies.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createRequire } from 'node:module'

const nodeRequire = createRequire(import.meta.url)
const NETLIFY_FN = '../netlify/functions/personalization-browser-discovery.js'
const NETLIFY_FN_DIR = 'netlify/functions'

const FAST_ASSETS = [
  { id: 'a1', category: 'logo', previewUrl: 'https://example.com/logo.png', sourceUrl: 'https://example.com/logo.png' },
  { id: 'a2', category: 'hero', previewUrl: 'https://example.com/hero.jpg', sourceUrl: 'https://example.com/hero.jpg' },
]

interface Harness {
  job: Record<string, unknown>
  updates: Array<Record<string, unknown>>
  launches: number
  launchError: Error | null
  failUpdateNo: number
}

function fakeChromium(h: Harness) {
  return {
    launch: async () => {
      h.launches++
      if (h.launchError) throw h.launchError
      const page = {
        goto: async () => {},
        url: () => String(h.job.website_url),
        evaluate: async (script: unknown) => {
          const source = typeof script === 'string' ? script : ''
          if (source.includes('scrollHeight')) return 200
          if (source.includes('return win.__discoveryCandidates')) {
            return [{ src: 'https://example.com/browser-only.jpg', alt: 'Browser only' }]
          }
          return undefined
        },
        waitForTimeout: async () => {},
        close: async () => {},
      }
      return {
        isConnected: () => true,
        newContext: async () => ({ route: async () => {}, newPage: async () => page, close: async () => {} }),
        close: async () => {},
      }
    },
  }
}

function fakeSupabase(h: Harness) {
  let updateNo = 0
  return {
    from: () => ({
      select: () => ({
        eq: (_column: string, value: unknown) => ({
          single: async () => (value === h.job.id ? { data: { ...h.job }, error: null } : { data: null, error: { message: 'not found' } }),
        }),
      }),
      update: (payload: Record<string, unknown>) => ({
        eq: async () => {
          updateNo++
          if (h.failUpdateNo === updateNo) throw new Error('transient database failure')
          h.updates.push(payload)
          Object.assign(h.job, payload)
          return { data: null, error: null }
        },
      }),
    }),
  }
}

function fastDiscovery(needsBrowser: boolean) {
  return () => ({
    runFastDiscovery: async () => ({
      fastAssets: FAST_ASSETS,
      needsBrowser,
      result: { providerUsed: 'SMARTVIDEO_STATIC', providerAttempts: ['SMARTVIDEO_STATIC'], pagesCrawled: 2, rawCandidates: 2, duration: 500, candidates: [], socialProfiles: [] },
    }),
  })
}

const SECRET = 'internal-secret'

/** A dispatch that carries the internal secret unless the test overrides it. */
function event(headers: Record<string, string>) {
  return {
    httpMethod: 'POST',
    headers: { 'content-type': 'application/json', 'x-internal-service-token': SECRET, ...headers },
    body: JSON.stringify({ jobId: 'job-1' }),
  }
}

describe('discovery worker: job lifecycle', () => {
  let h: Harness
  let restorePlaywright: () => void
  const savedSecret = process.env.INTERNAL_FUNCTION_SECRET

  beforeEach(() => {
    h = {
      job: { id: 'job-1', clerk_user_id: 'user_abc', website_url: 'https://example.com/', status: 'running' },
      updates: [],
      launches: 0,
      launchError: null,
      failUpdateNo: 0,
    }
    const resolved = nodeRequire.resolve('playwright-core', { paths: [NETLIFY_FN_DIR] })
    const original = nodeRequire.cache[resolved]
    nodeRequire.cache[resolved] = { id: resolved, filename: resolved, loaded: true, children: [], paths: [], exports: { chromium: fakeChromium(h) } } as unknown as NodeJS.Module
    restorePlaywright = () => {
      if (original === undefined) delete nodeRequire.cache[resolved]
      else nodeRequire.cache[resolved] = original
    }
  })

  afterEach(() => {
    restorePlaywright()
    if (savedSecret === undefined) delete process.env.INTERNAL_FUNCTION_SECRET
    else process.env.INTERNAL_FUNCTION_SECRET = savedSecret
  })

  /** `secret: null` deploys the worker with INTERNAL_FUNCTION_SECRET unset. */
  async function handlerWith(overrides: Record<string, unknown> = {}, secret: string | null = SECRET) {
    if (secret === null) delete process.env.INTERNAL_FUNCTION_SECRET
    else process.env.INTERNAL_FUNCTION_SECRET = secret
    vi.resetModules()
    const mod = await import(NETLIFY_FN)
    return mod.createBrowserDiscoveryHandler({
      getSupabase: () => fakeSupabase(h),
      verifySessionToken: async (token: string | null) => (token === 'valid' ? { userId: 'user_abc' } : { userId: null }),
      createSsrfGuard: () => mod.createSsrfGuard({ dnsResolver: async () => ['93.184.216.34'] }),
      loadFastDiscovery: fastDiscovery(false),
      isBrowserDiscoveryEnabled: () => true,
      ...overrides,
    })
  }

  describe('dispatch authentication', () => {
    it('refuses every call while INTERNAL_FUNCTION_SECRET is unset', async () => {
      const handler = await handlerWith({}, null)

      const response = await handler(event({ authorization: 'Bearer valid' }))

      expect(response.statusCode).toBe(503)
      expect(JSON.parse(response.body).code).toBe('INTERNAL_SECRET_NOT_CONFIGURED')
      expect(h.launches).toBe(0)
      expect(h.updates).toEqual([])
    })

    it('rejects a call that does not carry the secret', async () => {
      const handler = await handlerWith()

      const response = await handler(event({ authorization: 'Bearer valid', 'x-internal-service-token': 'wrong' }))

      expect(response.statusCode).toBe(401)
      expect(h.updates).toEqual([])
    })
  })

  describe('anonymous ownership', () => {
    it('drives an anonymous job the route dispatched from its own egress IP', async () => {
      h.job.clerk_user_id = 'anon-203.0.113.7'
      const handler = await handlerWith()

      const response = await handler(event({ 'x-forwarded-for': '18.116.204.94', 'x-discovery-job-owner': 'anon-203.0.113.7' }))

      expect(response.statusCode).toBe(200)
      expect(h.job.status).toBe('complete')
    })

    it("refuses an anonymous job when the caller's identity does not match its owner", async () => {
      h.job.clerk_user_id = 'anon-203.0.113.7'
      const handler = await handlerWith()

      const response = await handler(event({ 'x-forwarded-for': '198.51.100.9' }))

      expect(response.statusCode).toBe(403)
      expect(h.job.status).toBe('running')
    })

    it("never lets a forwarded owner claim a signed-in user's job", async () => {
      const handler = await handlerWith()

      const response = await handler(event({ 'x-discovery-job-owner': 'user_abc' }))

      expect(response.statusCode).toBe(403)
    })

    it('matches a direct IPv6 caller against its own job', async () => {
      h.job.clerk_user_id = 'anon-2600:1700:1ec0:ee0::97f'
      const handler = await handlerWith()

      const response = await handler(event({ 'x-forwarded-for': '2600:1700:1ec0:ee0::97f' }))

      expect(response.statusCode).toBe(200)
      expect(h.job.status).toBe('complete')
    })
  })

  describe('free-layer results', () => {
    it('merges free-layer and browser assets when the browser phase succeeds', async () => {
      const handler = await handlerWith({ loadFastDiscovery: fastDiscovery(true) })

      await handler(event({ authorization: 'Bearer valid' }))

      expect(h.launches).toBe(1)
      expect(h.job.status).toBe('complete')
      const assets = (h.job.final_result_json as { discoveredAssets: unknown[] }).discoveredAssets
      expect(assets.length).toBeGreaterThan(FAST_ASSETS.length)
    })

    it('keeps the free-layer assets when the browser fails to launch', async () => {
      h.launchError = Object.assign(new Error('Failed to launch chromium'), { code: 'BROWSER_LAUNCH_FAILED' })
      const handler = await handlerWith({ loadFastDiscovery: fastDiscovery(true) })

      await handler(event({ authorization: 'Bearer valid' }))

      expect(h.job.status).toBe('complete')
      const result = h.job.final_result_json as { discoveredAssets: unknown[]; browserError: string }
      expect(result.discoveredAssets).toHaveLength(FAST_ASSETS.length)
      expect(result.browserError).toBe('Failed to launch chromium')
    })

    it('never launches the browser while escalation is disabled', async () => {
      const handler = await handlerWith({ loadFastDiscovery: fastDiscovery(true), isBrowserDiscoveryEnabled: () => false })

      const response = await handler(event({ authorization: 'Bearer valid' }))

      expect(response.statusCode).toBe(200)
      expect(h.launches).toBe(0)
      expect(h.job.status).toBe('complete')
      expect((h.job.final_result_json as { discoveredAssets: unknown[] }).discoveredAssets).toHaveLength(FAST_ASSETS.length)
    })

    it('completes with no assets when the free layers cannot load and the browser is off', async () => {
      const handler = await handlerWith({
        loadFastDiscovery: () => { throw new Error("Cannot find module '../lib/fast-discovery.cjs'") },
        isBrowserDiscoveryEnabled: () => false,
      })

      await handler(event({ authorization: 'Bearer valid' }))

      expect(h.launches).toBe(0)
      expect(h.job.status).toBe('complete')
      expect((h.job.final_result_json as { discoveredAssets: unknown[] }).discoveredAssets).toEqual([])
    })
  })

  it('gives the free layers a deadline well inside the 75s stale-job watchdog', async () => {
    let received: { deadlineAt?: number } | undefined
    const handler = await handlerWith({
      loadFastDiscovery: () => ({
        runFastDiscovery: async (opts: { deadlineAt?: number }) => {
          received = opts
          return { fastAssets: FAST_ASSETS, needsBrowser: false, result: { providerAttempts: [], candidates: [], socialProfiles: [] } }
        },
      }),
    })
    const before = Date.now()

    await handler(event({ authorization: 'Bearer valid' }))

    expect(received?.deadlineAt).toBeTypeOf('number')
    expect(received!.deadlineAt! - before).toBeLessThanOrEqual(30_000)
    expect(received!.deadlineAt! - before).toBeGreaterThan(0)
  })

  it('answers instead of throwing when an unexpected failure hits the outer handler', async () => {
    h.failUpdateNo = 1
    const handler = await handlerWith()

    const response = await handler(event({ authorization: 'Bearer valid' }))

    expect(response.statusCode).toBe(500)
    expect(h.job.status).toBe('error')
  })
})
