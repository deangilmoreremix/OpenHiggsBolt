/**
 * Behavioral tests for the newly-added API entitlement gates.
 *
 * Every route handler covered here (`requireApiEntitlement`) is imported with
 * its real module graph, but the two seams the gate depends on — the
 * server-only Clerk `auth()` and the Supabase-backed
 * `resolveSmartVideoAccessForUser` — are stubbed at the module boundary (the
 * tests/proxy-routes.vitest.test.ts idiom). Every other dependency of the
 * handler is also stubbed so the module imports cleanly and, on the entitled
 * path, the handler proceeds past the gate to its own (mocked) logic.
 *
 * Assertions per route/factory:
 *   - signed-out            → 401 with body { error: 'UNAUTHENTICATED' }
 *   - authenticated unpaid  → 403 with body { error: 'PAYMENT_REQUIRED' }
 *   - authenticated paid    → passes the gate (response is NOT 401/403)
 *   - non-prod bypass cookie→ passes the gate even for an unpaid caller
 *
 * Plus two contract-style guards:
 *   - personalization/project GET is NOT entitlement-gated (GET only), and
 *   - the read-only preview routes import no entitlement gate at all
 *     (static source assertion). The comprehensive walk of app/api/** lives in
 *     ./api-gates-contract.test.ts.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

const repoRoot = process.cwd()

// Live per-test knobs read lazily by the doMock factories below, so a test can
// flip auth/entitlement state after beforeEach has already registered them.
const h = vi.hoisted(() => ({
  authUserId: null as string | null,
  hasSmartVideoGo: false as boolean,
}))

function req(
  url: string,
  opts: { method?: string; body?: unknown; headers?: Record<string, string> } = {},
): NextRequest {
  const headers: Record<string, string> = { ...(opts.headers || {}) }
  let body: string | undefined
  if (opts.body !== undefined) {
    headers['content-type'] = 'application/json'
    body = JSON.stringify(opts.body)
  }
  return new NextRequest(url, { method: opts.method || 'GET', headers, body })
}

beforeEach(() => {
  vi.resetModules()
  // get_upload_url performs a real fetch to muapi.ai on the entitled path;
  // blackhole it so the suite stays offline. safeApiJson is also stubbed, so
  // the response body is irrelevant — it only needs to resolve.
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({}),
    text: async () => '',
  } as any)

  // ── the two seams the entitlement gate depends on ─────────────────────────
  vi.doMock('@clerk/nextjs/server', () => ({
    auth: vi.fn(async () => ({ userId: h.authUserId })),
  }))
  vi.doMock('@/access/resolveAccess', () => ({
    resolveSmartVideoAccessForUser: vi.fn(async () => ({ hasSmartVideoGo: h.hasSmartVideoGo })),
  }))

  // ── downstream handler deps (stubbed so modules import + run cleanly) ──────
  vi.doMock('@/server/personalizationLog', () => ({
    logPersonalization: vi.fn(),
    createCorrelationId: vi.fn(() => ({})),
    sanitizeForLog: (s: unknown) => s,
  }))
  vi.doMock('@/server/envValidation', () => ({
    validatePersonalizationEnv: vi.fn(() => ({ valid: true, missingRequired: [] })),
    requirePersonalizationEnv: vi.fn(() => ({ valid: true, missingRequired: [] })),
  }))
  vi.doMock('@/lib/rateLimit', () => ({
    resolveRateLimitKey: (u?: string | null, i?: string | null) => u || i || 'anon',
    rateLimit: vi.fn(() => ({ allowed: true, remaining: 9, retryAfterMs: 0 })),
    rateLimit429: vi.fn(() => NextResponse.json({ error: 'rate' }, { status: 429 })),
  }))
  vi.doMock('@/server/businessDiscovery', () => ({
    getNicheMapping: vi.fn(() => ({ label: 'Test' })),
    getSupportedNiches: vi.fn(() => ['restaurants-food']),
    geocodeLocation: vi.fn(async () => ({ latitude: 0, longitude: 0, displayName: 'x' })),
    discoverBusinesses: vi.fn(async () => []),
    deduplicateBusinesses: vi.fn((x: any) => x),
    enrichBusinessRecord: vi.fn((x: any) => x),
    scoreAndSort: vi.fn((x: any) => x),
    createCacheKey: vi.fn(() => 'k'),
    businessDiscoveryCache: { get: vi.fn(() => null), set: vi.fn() },
  }))
  vi.doMock('@/server/businessDiscovery/researchProvider', () => ({
    researchBusiness: vi.fn(async () => ({ reachable: true })),
    enrichClientProfileFromResearch: vi.fn(),
  }))
  vi.doMock('@/server/downloadImage', () => ({
    downloadImageAsDataUrl: vi.fn(async () => 'data:image/png;base64,eA=='),
    BlockedTargetError: class BlockedTargetError extends Error {},
  }))
  vi.doMock('@/lib/networkSafety', () => ({ assertSafeUrlString: vi.fn() }))
  vi.doMock('@/server/discoveryJobs', () => ({
    createDiscoveryJob: vi.fn(async () => ({ id: 'job-1' })),
    getDiscoveryJobForUser: vi.fn(),
  }))
  vi.doMock('@/server/discoveryOrchestrator', () => ({
    runFastDiscovery: vi.fn(async () => ({
      result: {
        providerUsed: 'STATIC_FALLBACK',
        providerAttempted: 'STATIC_FALLBACK',
        candidates: [],
        pagesCrawled: 0,
        rawCandidates: 0,
        duration: 0,
        socialProfiles: [],
        discoveredAssets: [],
        firecrawlUsed: false,
        providerAttempts: ['STATIC_FALLBACK'],
      },
      fastAssets: [],
      usefulAssetCount: 0,
      providerAttempts: ['STATIC_FALLBACK'],
      needsBrowser: false,
    })),
  }))
  vi.doMock('@/src/server/fixtures/discoveryFixtures', () => ({ getFixture: vi.fn(() => null) }))
  vi.doMock('@/lib/supabase', () => ({
    createServerClient: vi.fn(() => ({ rpc: vi.fn(async () => ({ data: null, error: null })) })),
  }))
  vi.doMock('@/lib/uploadProxyTarget', () => ({
    getApiKeyFromRequest: vi.fn(() => 'proxy-key'),
    validateUploadProxyTarget: vi.fn(async () => ({
      ok: true,
      url: 'https://bucket.s3.amazonaws.com/upload',
      pinnedFetch: vi.fn(async () => ({ ok: true, status: 204, headers: new Headers() })),
    })),
  }))
  vi.doMock('app/api/vfx/_helpers', () => ({ resolveMuAPIKey: vi.fn(async () => 'proxy-key') }))
  vi.doMock('@/lib/safeApiResponse', () => ({
    safeApiJson: vi.fn(async () => ({ ok: true })),
    upstreamErrorResponse: vi.fn(() => NextResponse.json({ error: 'upstream' }, { status: 502 })),
  }))
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

// Each entry imports its route lazily (after the beforeEach doMocks) and
// invokes the gated export with a request built from `headers`.
const GATED: Array<{ id: string; call: (headers?: Record<string, string>) => Promise<Response> }> = [
  {
    id: 'POST /api/upload-binary',
    call: async (headers) => {
      const { POST } = await import('@/app/api/upload-binary/route')
      return POST(req('http://localhost/api/upload-binary', { method: 'POST', headers: { 'x-api-key': 'proxy-key', ...headers } }))
    },
  },
  {
    id: 'POST /api/v1/upload-binary',
    call: async (headers) => {
      const { POST } = await import('@/app/api/v1/upload-binary/route')
      return POST(req('http://localhost/api/v1/upload-binary', { method: 'POST', headers: { 'x-api-key': 'proxy-key', ...headers } }))
    },
  },
  {
    id: 'GET /api/v1/get_upload_url',
    call: async (headers) => {
      const { GET } = await import('@/app/api/v1/get_upload_url/route')
      return GET(req('http://localhost/api/v1/get_upload_url', { method: 'GET', headers: { 'x-api-key': 'k', ...headers } }))
    },
  },
  {
    id: 'POST /api/personalization/find-businesses',
    call: async (headers) => {
      const { POST } = await import('@/app/api/personalization/find-businesses/route')
      return POST(req('http://localhost/api/personalization/find-businesses', { method: 'POST', headers, body: { niche: 'restaurants-food', location: 'Austin, TX' } }))
    },
  },
  {
    id: 'POST /api/personalization/research-business',
    call: async (headers) => {
      const { POST } = await import('@/app/api/personalization/research-business/route')
      return POST(req('http://localhost/api/personalization/research-business', { method: 'POST', headers, body: { websiteUrl: 'https://example.com' } }))
    },
  },
  {
    id: 'POST /api/personalization/download-image',
    call: async (headers) => {
      const { POST } = await import('@/app/api/personalization/download-image/route')
      return POST(req('http://localhost/api/personalization/download-image', { method: 'POST', headers, body: { urls: ['https://example.com/x.png'] } }))
    },
  },
  {
    id: 'POST /api/personalization/discover-assets',
    call: async (headers) => {
      const { POST } = await import('@/app/api/personalization/discover-assets/route')
      return POST(req('http://localhost/api/personalization/discover-assets', { method: 'POST', headers, body: { websiteUrl: 'https://example.com' } }))
    },
  },
  {
    id: 'POST /api/personalization/project',
    call: async (headers) => {
      const { POST } = await import('@/app/api/personalization/project/route')
      return POST(req('http://localhost/api/personalization/project', { method: 'POST', headers, body: { project: { source: {} } } }))
    },
  },
  {
    id: 'DELETE /api/personalization/project',
    call: async (headers) => {
      const { DELETE } = await import('@/app/api/personalization/project/route')
      return DELETE(req('http://localhost/api/personalization/project?id=proj-123', { method: 'DELETE', headers }))
    },
  },
]

describe('newly gated route handlers — entitlement gate outcomes', () => {
  for (const route of GATED) {
    describe(route.id, () => {
      it('401 UNAUTHENTICATED when signed out', async () => {
        h.authUserId = null
        h.hasSmartVideoGo = false
        const res = await route.call()
        expect(res.status).toBe(401)
        expect((await res.json()).error).toBe('UNAUTHENTICATED')
      })

      it('403 PAYMENT_REQUIRED when authenticated but unentitled', async () => {
        h.authUserId = 'user_paying_no_entitlement'
        h.hasSmartVideoGo = false
        const res = await route.call()
        expect(res.status).toBe(403)
        const body = await res.json()
        expect(body.error).toBe('PAYMENT_REQUIRED')
        expect(body.upgradeRequired).toBe(true)
      })

      it('passes the gate (not 401/403 PAYMENT_REQUIRED) when entitled', async () => {
        h.authUserId = 'user_paid'
        h.hasSmartVideoGo = true
        const res = await route.call()
        expect(res.status).not.toBe(403)
        expect(res.status).not.toBe(401)
        if (res.status === 403 || res.status === 401) {
          // Defensive: a non-gate 401/403 would need a non-PAYMENT_REQUIRED body.
          expect((await res.json()).error).not.toBe('PAYMENT_REQUIRED')
        }
      })

      it('passes the gate for a non-prod __e2e_auth_bypass=1 cookie even when unentitled', async () => {
        // Proves the bypass skips the gate entirely: an UNPAID caller with the
        // dev cookie is not rejected with PAYMENT_REQUIRED. (NODE_ENV is 'test'
        // in this worker, so isDevBypass() honors the cookie.)
        h.authUserId = 'user_unpaid_bypassed'
        h.hasSmartVideoGo = false
        const res = await route.call({ cookie: '__e2e_auth_bypass=1' })
        expect(res.status).not.toBe(403)
        expect(res.status).not.toBe(401)
        if (res.status === 403) {
          expect((await res.json()).error).not.toBe('PAYMENT_REQUIRED')
        }
      })
    })
  }
})

// ---------------------------------------------------------------------------
// personalization/project GET is NOT entitlement-gated (only POST/DELETE are).
// ---------------------------------------------------------------------------

describe('personalization/project GET is open (no paid gate)', () => {
  it('signed-in unpaid GET is NOT 403 PAYMENT_REQUIRED (it reaches the DB layer)', async () => {
    h.authUserId = 'user_paid_no_entitlement'
    h.hasSmartVideoGo = false
    const { GET } = await import('@/app/api/personalization/project/route')
    const res = await GET(req('http://localhost/api/personalization/project?id=proj-123'))
    expect(res.status).not.toBe(403)
    if (res.status === 403) expect((await res.json()).error).not.toBe('PAYMENT_REQUIRED')
  })

  it('signed-out GET is 401 UNAUTHENTICATED from the route auth check (still no paid gate)', async () => {
    h.authUserId = null
    const { GET } = await import('@/app/api/personalization/project/route')
    const res = await GET(req('http://localhost/api/personalization/project?id=proj-123'))
    // The route's own auth check rejects with 401 — never 403 PAYMENT_REQUIRED.
    expect(res.status).toBe(401)
    expect((await res.json()).error).toBe('UNAUTHENTICATED')
  })
})

// ---------------------------------------------------------------------------
// Read-only preview routes must import no entitlement gate (static assertion;
// the comprehensive app/api walk lives in api-gates-contract.test.ts).
// ---------------------------------------------------------------------------

describe('read-only preview routes import no entitlement gate (static source check)', () => {
  const READ_ONLY_PREVIEW = [
    'app/api/go-ai-viral/seedance/route.ts',
    'app/api/thumbnail/route.js',
    'app/api/version/route.ts',
    'app/api/academy/content/route.ts',
  ]

  for (const rel of READ_ONLY_PREVIEW) {
    it(`${rel} does not import requireApiEntitlement`, () => {
      const source = readFileSync(join(repoRoot, rel), 'utf-8')
      expect(source).not.toMatch(/requireApiEntitlement/)
      expect(source).not.toMatch(/entitlementForbiddenResponse/)
      expect(source).not.toMatch(/@\/access\/apiRequireEntitlement/)
    })
  }
})
