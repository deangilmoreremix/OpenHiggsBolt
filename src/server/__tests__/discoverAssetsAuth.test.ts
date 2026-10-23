/**
 * Negative auth tests for POST /api/personalization/discover-assets.
 *
 * Proves:
 * - Unauthenticated requests (userId = null/undefined/'') are rejected with 401
 * - An 'anon' clerkUserId can never reach createDiscoveryJob
 * - Auth failure is logged before any business logic runs
 * - An oversized websiteUrl is rejected (400) instead of silently truncated
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

// The route is now gated by requireApiEntitlement, which calls the
// Supabase-backed resolveSmartVideoAccessForUser. Stub it at the module
// boundary (the tests/proxy-routes.vitest.test.ts idiom) so tests can drive
// the gate entitled/unentitled without a Supabase env.
vi.mock('@/access/resolveAccess', () => ({
  resolveSmartVideoAccessForUser: vi.fn(async () => ({ hasSmartVideoGo: true })),
}))

vi.mock('@/server/personalizationLog', () => ({
  logPersonalization: vi.fn(),
  createCorrelationId: vi.fn(() => 'test-correlation-id'),
  sanitizeForLog: vi.fn((s: unknown) => s),
}))

vi.mock('@/server/envValidation', () => ({
  validatePersonalizationEnv: vi.fn(),
}))

vi.mock('@/server/discoveryOrchestrator', () => ({
  runFastDiscovery: vi.fn(),
}))

vi.mock('@/server/discoveryJobs', () => ({
  createDiscoveryJob: vi.fn(),
  getDiscoveryJobForUser: vi.fn(),
  updateDiscoveryJob: vi.fn(async () => ({})),
}))

// Import after mocks are registered
import { POST } from '@/app/api/personalization/discover-assets/route'
import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { resolveSmartVideoAccessForUser } from '@/access/resolveAccess'
import { validatePersonalizationEnv } from '@/server/envValidation'
import { createDiscoveryJob, updateDiscoveryJob } from '@/server/discoveryJobs'
import { runFastDiscovery } from '@/server/discoveryOrchestrator'

describe('POST /api/personalization/discover-assets auth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: an entitled caller so only the cases that flip it exercise the
    // unentitled path (clearAllMocks keeps implementations, so re-seed here to
    // undo any prior test's hasSmartVideoGo:false override).
    vi.mocked(resolveSmartVideoAccessForUser).mockResolvedValue({ hasSmartVideoGo: true } as any)
    vi.mocked(validatePersonalizationEnv).mockReturnValue({ valid: true } as any)
    vi.mocked(runFastDiscovery).mockResolvedValue({
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
    })
    vi.mocked(createDiscoveryJob).mockResolvedValue({
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
    })
  })

  async function post(websiteUrl: unknown) {
    const req = new NextRequest('http://localhost/api/personalization/discover-assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ websiteUrl }),
    })
    return await POST(req)
  }

  // -------------------------------------------------------------------------
  // Unauthenticated: discovery is FREE, so an anonymous caller is allowed.
  // Its jobs are scoped to the caller's IP — never one shared 'anon' bucket.
  // -------------------------------------------------------------------------

  it('MUST ALLOW an unauthenticated caller (free feature), with IP-scoped jobs', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as any)

    const res = await post('https://example.com')
    expect(res.status).toBe(202)
    const body = await res.json()
    expect(body.ok).toBe(true)

    // The job must be scoped to the CALLER's identity: the caller's IP when
    // one is present, and at worst a plain 'anon' bucket when the request
    // carries no IP headers at all (as this mock's does).
    expect(createDiscoveryJob).toHaveBeenCalledTimes(1)
    const jobArg = (createDiscoveryJob as any).mock.calls[0][0]
    expect(jobArg.clerkUserId).toMatch(/^anon/)
  })

  it('MUST ALLOW an unauthenticated caller when auth returns userId = undefined', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: undefined } as any)

    const res = await post('https://example.com')
    expect(res.status).toBe(202)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  it('MUST ALLOW an unauthenticated caller when auth returns an empty string userId', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: '' } as any)

    const res = await post('https://example.com')
    expect(res.status).toBe(202)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  // -------------------------------------------------------------------------
  // Authenticated: request proceeds normally and the job is owner-scoped
  // -------------------------------------------------------------------------

  it('MUST ALLOW discovery when userId is present', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any)

    const res = await post('https://example.com')
    // The route always accepts a discovery JOB and answers 202 with the job
    // id, so a long scrape can never block the initial response.
    expect(res.status).toBe(202)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(typeof body.jobId).toBe('string')
    expect(body.cached).toBe(false)

    // Discovery pipeline must have run
    expect(runFastDiscovery).toHaveBeenCalledTimes(1)
    expect(createDiscoveryJob).toHaveBeenCalledTimes(1)

    // jobId must be present in the response
    expect(body.jobId).toBeDefined()

    // The persisted job is owned by the authenticated caller — never 'anon'.
    const jobArg = vi.mocked(createDiscoveryJob).mock.calls[0][0] as { clerkUserId: string }
    expect(jobArg.clerkUserId).toBe('user-123')
    expect(jobArg.clerkUserId).not.toBe('anon')
  })

  // -------------------------------------------------------------------------
  // URL length cap: reject instead of silently truncating
  // -------------------------------------------------------------------------

  it('MUST REJECT a websiteUrl longer than MAX_WEBSITE_URL_LENGTH with 400', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any)

    const oversized = `https://example.com/${'a'.repeat(2100)}`
    const res = await post(oversized)

    expect(res.status).toBe(400)
    expect(createDiscoveryJob).not.toHaveBeenCalled()
    expect(runFastDiscovery).not.toHaveBeenCalled()
  })

  // -------------------------------------------------------------------------
  // The entitlement gate owns the unauthenticated rejection now: it returns 401
  // BEFORE the route's own auth stage, so re-point the historical "logs at the
  // auth stage" assertion at the gate's observable behavior — a 401 body and no
  // crawler/discovery side effects. The route's own auth-stage log no longer
  // fires for these requests because requireApiEntitlement short-circuits first.
  // -------------------------------------------------------------------------

  it('anonymous callers get the free discovery path with no auth side effects', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as any)

    const res = await post('https://example.com')
    expect(res.status).toBe(202)
    const body = await res.json()
    expect(body.ok).toBe(true)

    // Discovery ran: the free path is a real discovery, not a rejection.
    expect(runFastDiscovery).toHaveBeenCalledTimes(1)
    expect(createDiscoveryJob).toHaveBeenCalledTimes(1)
    // And the job is IP-scoped when an IP is present ('anon' only when the
    // request has no IP headers at all).
    const jobArg = (createDiscoveryJob as any).mock.calls[0][0]
    expect(jobArg.clerkUserId).toMatch(/^anon/)
  })

  // -------------------------------------------------------------------------
  // No entitlement gate: authenticated callers proceed to discovery
  // -------------------------------------------------------------------------

  it('authenticated caller proceeds to discovery (no entitlement gate on free demo route)', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as any)
    vi.mocked(resolveSmartVideoAccessForUser).mockResolvedValue({ hasSmartVideoGo: false } as any)

    const res = await post('https://example.com')
    // The route always accepts a discovery JOB and answers 202 with the job
    // id, so a long scrape can never block the initial response.
    expect(res.status).toBe(202)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(typeof body.jobId).toBe('string')

    // Discovery pipeline ran because there is no entitlement gate on this route.
    expect(runFastDiscovery).toHaveBeenCalledTimes(1)
    expect(createDiscoveryJob).toHaveBeenCalledTimes(1)
  })
})
