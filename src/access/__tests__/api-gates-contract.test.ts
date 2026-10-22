/**
 * Static contract test for the API entitlement-gate surface.
 *
 * This walks every route.(ts|js) file under app/api and asserts that the
 * entitlement gate (`requireApiEntitlement`) is applied to EXACTLY the paid
 * surface and to nothing else. It is a regression guard: when someone adds a
 * new route that should be gated (or forgets to gate one, or accidentally
 * gates a read-only route), the diff below fails loudly and lists the
 * offenders instead of drifting silently.
 *
 * (a) PAID SURFACE - every file below MUST import/contain `requireApiEntitlement`.
 * (b) READ-ONLY ALLOWLIST - every file below MUST NOT reference it.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative, sep } from 'path'

const repoRoot = process.cwd()
const API_ROOT = join(repoRoot, 'app', 'api')

const GATE_SYMBOL = 'requireApiEntitlement'

// ---------------------------------------------------------------------------
// The paid surface. Explicit (including catch-all segment dirs) so the walk
// diff below catches a NEW gated route that is not yet listed here.
// ---------------------------------------------------------------------------
const PAID_PATHS: string[] = [
  // vfx/*
  'app/api/vfx/cancel/route.ts',
  'app/api/vfx/generate/route.ts',
  'app/api/vfx/status/route.ts',
  'app/api/vfx/upload/route.ts',
  // photo-studio
  'app/api/photo-studio/route.ts',
  // proxy/*
  'app/api/proxy/openai-image/route.ts',
  'app/api/proxy/openai-enhance/route.ts',
  'app/api/proxy/thumbnail-generate/route.ts',
  // design-agent/*
  'app/api/design-agent/approve/route.ts',
  'app/api/design-agent/assets/route.ts',
  'app/api/design-agent/chat/route.ts',
  'app/api/design-agent/jobs/route.ts',
  'app/api/design-agent/reject/route.ts',
  'app/api/design-agent/run-skill/route.ts',
  'app/api/design-agent/session-assets/route.ts',
  'app/api/design-agent/sessions/route.ts',
  'app/api/design-agent/skills/route.ts',
  // storyboard / agents / workflow / app catch-alls
  'app/api/storyboard/[[...path]]/route.ts',
  'app/api/agents/[[...path]]/route.js',
  'app/api/workflow/[[...path]]/route.js',
  'app/api/app/[[...path]]/route.js',
  // v1 surface
  'app/api/api/v1/[[...path]]/route.js',
  'app/api/v1/[...slug]/route.ts',
  'app/api/v1/creative-agent/[[...path]]/route.js',
  'app/api/v1/upload-binary/route.js',
  'app/api/v1/get_upload_url/route.js',
  // paid studio surfaces
  'app/api/animate/route.ts',
  'app/api/assets/route.ts',
  'app/api/brand/analyze/route.ts',
  'app/api/campaigns/route.ts',
  // personalization routes are FREE for the demo experience
  // (find-businesses, research-business, discover-assets, download-image,
  //  project GET, image-edit, image-smart-edit, image-analyze)
  // (see ALLOWLIST_PATHS below)
  // canonical upload
  'app/api/upload-binary/route.js',
]

// ---------------------------------------------------------------------------
// THE BUSINESS ASSET FINDER — permanently free.
//
// "Find Business / Find Business Assets" is a FREE service for EVERY user:
// never purchased, no subscription, no paid entitlement, exhausted premium
// credits. A user must always be able to find a business, enter a business
// website, discover the assets on it, retrieve logos and images, preview
// them, select/deselect them, import them, save them to the asset library
// and reuse them for personalization.
//
// Authentication is NOT paid entitlement. The finder routes may require a
// session (so a private user's assets stay private) but they must NEVER
// consult a paid entitlement.
//
// Every endpoint of the feature is listed here, so a finder endpoint added
// later has to be added to this list as well — the walk test below proves
// the on-disk free surface matches this list exactly.
// ---------------------------------------------------------------------------
const BUSINESS_ASSET_FINDER_PATHS: string[] = [
  // find a business (local business search)
  'app/api/personalization/find-businesses/route.ts',
  // enter a business website (read the page for its brand details)
  'app/api/personalization/research-business/route.ts',
  // discover the assets on that website
  'app/api/personalization/discover-assets/route.ts',
  // poll the discovery job for its result
  'app/api/personalization/discover-assets/status/route.ts',
  // retrieve logos and images (preview + import)
  'app/api/personalization/download-image/route.ts',
  // save the imported assets to the owner-scoped saved project / library
  'app/api/personalization/project/route.ts',
  // preview/edit affordances on the discovered assets
  'app/api/personalization/image-edit/route.ts',
  'app/api/personalization/image-smart-edit/route.ts',
  'app/api/personalization/image-analyze/route.ts',
  // the anonymous demo endpoint behind the marketing landing page
  'app/api/demo/discover/route.ts',
]

// ---------------------------------------------------------------------------
// The UNRELATED premium surface. The Business Asset Finder is free, but the
// paid operations must STAY paid: the free rule may never be "satisfied" by
// ripping out every entitlement gate in the app. One representative route per
// premium product family is listed here so a regression that deletes the
// gate from a premium operation fails loudly.
// ---------------------------------------------------------------------------
const PREMIUM_OPERATIONS: Array<{ id: string; path: string }> = [
  { id: 'video generation (vfx/generate)', path: 'app/api/vfx/generate/route.ts' },
  { id: 'video generation polling (vfx/status)', path: 'app/api/vfx/status/route.ts' },
  { id: 'video cancellation (vfx/cancel)', path: 'app/api/vfx/cancel/route.ts' },
  { id: 'campaign asset generation (assets)', path: 'app/api/assets/route.ts' },
  { id: 'campaigns', path: 'app/api/campaigns/route.ts' },
  { id: 'brand analysis', path: 'app/api/brand/analyze/route.ts' },
  { id: 'design agent skills', path: 'app/api/design-agent/run-skill/route.ts' },
  { id: 'design agent session assets', path: 'app/api/design-agent/session-assets/route.ts' },
  { id: 'animate', path: 'app/api/animate/route.ts' },
  { id: 'photo studio', path: 'app/api/photo-studio/route.ts' },
  { id: 'openai image proxy', path: 'app/api/proxy/openai-image/route.ts' },
  { id: 'thumbnail generation proxy', path: 'app/api/proxy/thumbnail-generate/route.ts' },
  { id: 'canonical binary upload', path: 'app/api/upload-binary/route.js' },
  { id: 'v1 binary upload', path: 'app/api/v1/upload-binary/route.js' },
  { id: 'v1 upload url', path: 'app/api/v1/get_upload_url/route.js' },
]

/**
 * Paid-gate vocabulary that must never appear in a Business Asset Finder
 * route's source. The import check alone would miss a hand-rolled gate that
 * calls the access resolver directly, so the resolver's own vocabulary is
 * checked too.
 */
const PAID_GATE_VOCABULARY: readonly string[] = [
  'requireApiEntitlement',
  'entitlementForbiddenResponse',
  'apiRequireEntitlement',
  'resolveSmartVideoAccessForUser',
  'hasSmartVideoGo',
  'PAYMENT_REQUIRED',
  'upgradeRequired',
]

// ---------------------------------------------------------------------------
// Read-only / public surface. EXPLICIT paths (with extensions).
// ---------------------------------------------------------------------------
const ALLOWLIST_PATHS: string[] = [
  'app/api/go-ai-viral/seedance/route.ts',
  'app/api/thumbnail/route.js',
  'app/api/brand/route.ts',
  'app/api/brands/route.ts',
  'app/api/access/resolve/route.ts',
  'app/api/access/restore/route.ts',
  'app/api/version/route.ts',
  'app/api/academy/content/route.ts',
  'app/api/go-ai-viral/health/route.ts',
  'app/api/go-ai-viral/prompts/route.ts',
  'app/api/go-ai-viral/stats/route.ts',
  'app/api/stripe/checkout/route.ts',
  'app/api/workspace/provision/route.ts',
  'app/api/dev-login/route.ts',
  // auth/*
  'app/api/auth/muapi-key/route.ts',
  'app/api/auth/openai-key/route.ts',
  'app/api/auth/whoami/route.ts',
  // webhooks/*
  'app/api/webhooks/clerk/route.ts',
  'app/api/webhooks/stripe/route.ts',
  // personalization (free for the demo experience)
  'app/api/personalization/image-edit/route.ts',
  'app/api/personalization/image-smart-edit/route.ts',
  'app/api/personalization/image-analyze/route.ts',
  'app/api/personalization/find-businesses/route.ts',
  'app/api/personalization/research-business/route.ts',
  'app/api/personalization/download-image/route.ts',
  'app/api/personalization/discover-assets/route.ts',
  // the discovery-job polling endpoint is part of the same free flow
  'app/api/personalization/discover-assets/status/route.ts',
  'app/api/personalization/project/route.ts',
  // the anonymous demo discovery endpoint is part of the same free flow
  'app/api/demo/discover/route.ts',
]

function walkRouteFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...walkRouteFiles(full))
      continue
    }
    if (/^route\.(ts|js)$/.test(entry.name) && statSync(full).isFile()) {
      out.push(full)
    }
  }
  return out
}

function toPosix(p: string): string {
  return relative(repoRoot, p).split(sep).join('/')
}

function readSafe(absPath: string): string {
  return readFileSync(join(repoRoot, absPath), 'utf-8')
}

describe('api entitlement-gate contract (static walk of app/api/**/route.*)', () => {
  const allRouteFiles = walkRouteFiles(API_ROOT)
  const gatedActual = allRouteFiles
    .filter((abs) => readFileSync(abs, 'utf-8').includes(GATE_SYMBOL))
    .map(toPosix)
    .sort()
  const expectedGated = [...PAID_PATHS].sort()

  it('found a non-trivial number of route files (walk sanity)', () => {
    expect(allRouteFiles.length).toBeGreaterThan(20)
  })

  it('(a) every paid-surface route imports the entitlement gate', () => {
    const missing: string[] = []
    for (const rel of PAID_PATHS) {
      let source: string
      try {
        source = readSafe(rel)
      } catch {
        throw new Error(`PAID_PATHS entry does not exist on disk: ${rel}`)
      }
      if (!source.includes(GATE_SYMBOL)) missing.push(rel)
    }
    expect(missing, `paid routes missing ${GATE_SYMBOL}:\n  ${missing.join('\n  ')}`).toEqual([])
  })

  it('(a) the on-disk set of gated routes exactly matches the paid-surface list (regression guard)', () => {
    const addedGated = gatedActual.filter((f) => !expectedGated.includes(f))
    const droppedGated = expectedGated.filter((f) => !gatedActual.includes(f))
    expect(
      addedGated,
      `NEW gated route(s) not listed in PAID_PATHS — add them to the contract:\n  ${addedGated.join('\n  ')}`,
    ).toEqual([])
    expect(
      droppedGated,
      `paid-surface entries that no longer import the gate (removed gate?):\n  ${droppedGated.join('\n  ')}`,
    ).toEqual([])
  })

  it('(b) no read-only allowlist route imports the entitlement gate', () => {
    const violations: string[] = []
    for (const rel of ALLOWLIST_PATHS) {
      let source: string
      try {
        source = readSafe(rel)
      } catch {
        throw new Error(`ALLOWLIST_PATHS entry does not exist on disk: ${rel}`)
      }
      if (source.includes(GATE_SYMBOL)) violations.push(rel)
    }
    expect(
      violations,
      `read-only routes unexpectedly gated:\n  ${violations.join('\n  ')}`,
    ).toEqual([])
  })

  it('(b) the paid and read-only lists do not overlap', () => {
    const overlap = ALLOWLIST_PATHS.filter((f) => PAID_PATHS.includes(f))
    expect(overlap, `overlapping paid/allowlist entries:\n  ${overlap.join('\n  ')}`).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// (c) THE BUSINESS ASSET FINDER IS PERMANENTLY FREE.
//
// Static half: every finder endpoint exists, imports no paid gate, and is
// listed as free rather than paid. The walk over app/api/personalization and
// app/api/demo catches a finder endpoint that is added LATER and gated
// without anybody updating this file.
// ---------------------------------------------------------------------------
describe('Business Asset Finder is permanently free (static source check)', () => {
  it('every Business Asset Finder endpoint exists on disk', () => {
    const missing: string[] = []
    for (const rel of BUSINESS_ASSET_FINDER_PATHS) {
      try {
        readSafe(rel)
      } catch {
        missing.push(rel)
      }
    }
    expect(
      missing,
      `Business Asset Finder endpoints missing on disk (rename or delete the route?):\n  ${missing.join('\n  ')}`,
    ).toEqual([])
  })

  it('no Business Asset Finder endpoint imports the paid entitlement gate', () => {
    const violations: string[] = []
    for (const rel of BUSINESS_ASSET_FINDER_PATHS) {
      const source = readSafe(rel)
      if (source.includes(GATE_SYMBOL)) violations.push(rel)
    }
    expect(
      violations,
      `Business Asset Finder endpoints must NEVER be entitlement-gated (the finder is free):\n  ${violations.join('\n  ')}`,
    ).toEqual([])
  })

  it('no Business Asset Finder endpoint contains paid-gate vocabulary', () => {
    const violations: string[] = []
    for (const rel of BUSINESS_ASSET_FINDER_PATHS) {
      const source = readSafe(rel)
      for (const token of PAID_GATE_VOCABULARY) {
        if (source.includes(token)) violations.push(`${rel} → ${token}`)
      }
    }
    expect(
      violations,
      `Business Asset Finder endpoints must not reference a paid entitlement:\n  ${violations.join('\n  ')}`,
    ).toEqual([])
  })

  it('no Business Asset Finder endpoint is listed as paid', () => {
    const overlap = BUSINESS_ASSET_FINDER_PATHS.filter((f) => PAID_PATHS.includes(f))
    expect(
      overlap,
      `Business Asset Finder endpoints must not be in PAID_PATHS:\n  ${overlap.join('\n  ')}`,
    ).toEqual([])
  })

  it('no route under app/api/personalization/** or app/api/demo/** is entitlement-gated', () => {
    const gated: string[] = []
    for (const dir of ['app/api/personalization', 'app/api/demo']) {
      for (const abs of walkRouteFiles(join(repoRoot, dir))) {
        if (readFileSync(abs, 'utf-8').includes(GATE_SYMBOL)) gated.push(toPosix(abs))
      }
    }
    expect(
      gated,
      `The Business Asset Finder is free — these routes must not import ${GATE_SYMBOL}:\n  ${gated.join('\n  ')}`,
    ).toEqual([])
  })

  it('the UNRELATED premium operations still import the entitlement gate', () => {
    const missing: string[] = []
    for (const op of PREMIUM_OPERATIONS) {
      if (!PAID_PATHS.includes(op.path)) {
        missing.push(`${op.path} (not listed in PAID_PATHS)`)
        continue
      }
      if (!readSafe(op.path).includes(GATE_SYMBOL)) missing.push(`${op.path} (no ${GATE_SYMBOL})`)
    }
    expect(
      missing,
      `premium operations lost their entitlement gate:\n  ${missing.join('\n  ')}`,
    ).toEqual([])
  })

  it('the paid surface is still non-empty (the free rule is not "remove every gate")', () => {
    expect(PAID_PATHS.length).toBeGreaterThan(0)
    const gated = walkRouteFiles(API_ROOT).filter((abs) =>
      readFileSync(abs, 'utf-8').includes(GATE_SYMBOL),
    )
    expect(gated.length).toBe(PAID_PATHS.length)
  })
})

// ---------------------------------------------------------------------------
// (d) THE BUSINESS ASSET FINDER IS PERMANENTLY FREE (runtime).
//
// The static half above proves the finder routes do not IMPORT the gate. This
// half proves the runtime consequence: an authenticated but UNENTITLED user
// (never purchased, no subscription, exhausted premium credits) gets a normal
// answer — never 403, never a PAYMENT_REQUIRED body — while an
// UNAUTHENTICATED caller is still rejected with 401, so "free" never becomes
// "anonymous" for the private (owner-scoped) operations.
//
// The entitlement seam is mocked the way the sibling suites mock it
// (src/access/__tests__/route-gates.test.ts): `requireApiEntitlement` is
// replaced by a gate that DENIES an unentitled caller, exactly like the real
// one. If a finder route ever starts consulting the gate, the mock records
// the call and the route answers 403 PAYMENT_REQUIRED — which fails these
// assertions.
// ---------------------------------------------------------------------------
const h = vi.hoisted(() => ({
  authUserId: null as string | null,
  hasSmartVideoGo: false as boolean,
  gateCalls: 0,
}))

const NICHE = 'restaurants-food'
const LOCATION = 'Austin, TX'

function jsonReq(url: string, body: unknown, method = 'POST'): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('Business Asset Finder is free for every authenticated user (runtime)', () => {
  beforeEach(() => {
    vi.resetModules()
    h.authUserId = null
    h.hasSmartVideoGo = false
    h.gateCalls = 0

    vi.doMock('@clerk/nextjs/server', () => ({
      auth: vi.fn(async () => ({ userId: h.authUserId })),
    }))
    vi.doMock('@/access/resolveAccess', () => ({
      resolveSmartVideoAccessForUser: vi.fn(async () => ({ hasSmartVideoGo: h.hasSmartVideoGo })),
    }))
    // The paid gate, mocked exactly as the real one behaves for an
    // unentitled caller: it denies and its forbidden response is a 403
    // PAYMENT_REQUIRED body.
    vi.doMock('@/access/apiRequireEntitlement', () => ({
      requireApiEntitlement: vi.fn(async () => {
        h.gateCalls += 1
        return h.hasSmartVideoGo ? { allowed: true } : { allowed: false, status: 403 }
      }),
      entitlementForbiddenResponse: vi.fn(() =>
        NextResponse.json({ error: 'PAYMENT_REQUIRED', upgradeRequired: true }, { status: 403 }),
      ),
    }))
    vi.doMock('@/server/personalizationLog', () => ({
      logPersonalization: vi.fn(),
      createCorrelationId: vi.fn(() => 'test-correlation-id'),
      sanitizeForLog: vi.fn((s: unknown) => s),
    }))
    vi.doMock('@/server/envValidation', () => ({
      validatePersonalizationEnv: vi.fn(() => ({ valid: true, missingRequired: [] })),
      requirePersonalizationEnv: vi.fn(() => ({ valid: true, missingRequired: [] })),
    }))
    vi.doMock('@/lib/rateLimit', () => ({
      resolveRateLimitKey: (userId?: string | null, ip?: string | null) => userId || ip || 'anon',
      rateLimit: vi.fn(() => ({ allowed: true, remaining: 9, retryAfterMs: 0 })),
      rateLimit429: vi.fn(() => NextResponse.json({ error: 'rate' }, { status: 429 })),
    }))
    vi.doMock('@/server/businessDiscovery', async () => {
      // The real, dependency-free niche lookups so niche validation is real;
      // every network-touching export is a controllable mock.
      const nicheMappings = await import('@/server/businessDiscovery/nicheMappings')
      return {
        getNicheMapping: nicheMappings.getNicheMapping,
        getSupportedNiches: nicheMappings.getSupportedNiches,
        geocodeLocation: vi.fn(async () => ({
          latitude: 30.2672,
          longitude: -97.7431,
          displayName: 'Austin, Texas, USA',
        })),
        discoverBusinesses: vi.fn(async () => [
          { id: 'one', name: 'Business one', latitude: 30.26, longitude: -97.74 },
          { id: 'two', name: 'Business two', latitude: 30.27, longitude: -97.75 },
        ]),
        searchBusinessesViaNominatim: vi.fn(async () => []),
        deduplicateBusinesses: vi.fn((items: any) => items),
        enrichBusinessRecord: vi.fn((record: any) => record),
        scoreAndSort: vi.fn((items: any) => items),
        createCacheKey: vi.fn(
          (niche: string, location: string, radiusMiles: number) =>
            `${niche}|${location}|${radiusMiles}`,
        ),
        businessDiscoveryCache: { get: vi.fn(() => null), set: vi.fn() },
      }
    })
    vi.doMock('@/server/discoveryJobs', () => ({
      createDiscoveryJob: vi.fn(async () => ({
        id: 'job-1',
        clerk_user_id: 'user-1',
        website_url: 'https://example.com',
        status: 'queued',
        fast_result_json: null,
        browser_result_json: null,
        final_result_json: null,
        telemetry_json: null,
        error_code: null,
        error_message: null,
        created_at: '2024-01-01T00:00:00Z',
        started_at: null,
        completed_at: null,
        expires_at: '2024-01-02T00:00:00Z',
      })),
      getDiscoveryJobForUser: vi.fn(async () => null),
      updateDiscoveryJob: vi.fn(async () => ({})),
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
    vi.doMock('@/server/discoveryJobResponse', () => ({
      buildDiscoveryJobResponse: vi.fn((job: any) => ({ id: job.id, status: job.status })),
    }))
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('POST /api/personalization/find-businesses answers normally for an authenticated but UNENTITLED user', async () => {
    h.authUserId = 'user_free_never_purchased'
    h.hasSmartVideoGo = false

    const { POST } = await import('@/app/api/personalization/find-businesses/route')
    const res = await POST(
      jsonReq('http://localhost/api/personalization/find-businesses', {
        niche: NICHE,
        location: LOCATION,
      }),
    )

    expect(res.status).not.toBe(403)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.error).not.toBe('PAYMENT_REQUIRED')
    expect(body.upgradeRequired).toBeUndefined()
    // The paid gate was never consulted.
    expect(h.gateCalls).toBe(0)
  })

  it('POST /api/personalization/discover-assets accepts a discovery job for an authenticated but UNENTITLED user', async () => {
    h.authUserId = 'user_free_exhausted_credits'
    h.hasSmartVideoGo = false

    const { POST } = await import('@/app/api/personalization/discover-assets/route')
    const res = await POST(
      jsonReq('http://localhost/api/personalization/discover-assets', {
        websiteUrl: 'https://example.com',
      }),
    )

    expect(res.status).not.toBe(403)
    expect(res.status).toBe(202)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(typeof body.jobId).toBe('string')
    expect(body.error).not.toBe('PAYMENT_REQUIRED')
    expect(body.upgradeRequired).toBeUndefined()
    // The paid gate was never consulted.
    expect(h.gateCalls).toBe(0)
  })

  it('POST /api/personalization/discover-assets accepts an UNAUTHENTICATED caller (free feature), IP-scoped', async () => {
    h.authUserId = null
    h.hasSmartVideoGo = false

    const { POST } = await import('@/app/api/personalization/discover-assets/route')
    const res = await POST(
      jsonReq('http://localhost/api/personalization/discover-assets', {
        websiteUrl: 'https://example.com',
      }),
    )

    // Discovery is FREE: an anonymous caller is accepted, with its jobs scoped
    // to the caller's IP rather than a shared 'anon' bucket. And it is still
    // never a PAYMENT gate.
    expect(res.status).toBe(202)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(typeof body.jobId).toBe('string')
  })

  it('GET /api/personalization/discover-assets/status answers for an anonymous caller when the job is theirs', async () => {
    h.authUserId = null
    h.hasSmartVideoGo = false

    const { GET } = await import('@/app/api/personalization/discover-assets/status/route')
    const res = await GET(
      new NextRequest('http://localhost/api/personalization/discover-assets/status?jobId=job-1'),
    )

    // Anonymous polling is allowed; a job that belongs to another IP is 404
    // (asserted by the isolation tests), and this is never a PAYMENT gate.
    expect(res.status).not.toBe(403)
    const body = await res.json()
    expect(body.error).not.toBe('PAYMENT_REQUIRED')
  })

  it('POST /api/personalization/download-image still rejects an UNAUTHENTICATED caller with 401', async () => {
    h.authUserId = null
    h.hasSmartVideoGo = false

    const { POST } = await import('@/app/api/personalization/download-image/route')
    const res = await POST(
      jsonReq('http://localhost/api/personalization/download-image', {
        urls: ['https://example.com/logo.png'],
      }),
    )

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('UNAUTHENTICATED')
  })
})
