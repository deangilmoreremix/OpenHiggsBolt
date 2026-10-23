import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

let authUserId: string | null = 'user-123'
let mockJobRow: Record<string, unknown> | null = {
  id: 'job-abc',
  clerk_user_id: 'user-123',
  website_url: 'https://example.com',
  status: 'complete',
  fast_result_json: null,
  browser_result_json: null,
  final_result_json: { assets: [] },
  telemetry_json: { providerAttempts: ['STATIC'], pagesCrawled: 1 },
  error_code: null,
  error_message: null,
  created_at: '2026-01-01T00:00:00Z',
  started_at: '2026-01-01T00:00:01Z',
  completed_at: '2026-01-01T00:00:02Z',
  expires_at: '2027-01-01T00:00:00Z',
}

beforeEach(() => {
  vi.resetModules()
  authUserId = 'user-123'
  mockJobRow = {
    id: 'job-abc',
    clerk_user_id: 'user-123',
    website_url: 'https://example.com',
    status: 'complete',
    fast_result_json: null,
    browser_result_json: null,
    final_result_json: { assets: [] },
    telemetry_json: { providerAttempts: ['STATIC'], pagesCrawled: 1 },
    error_code: null,
    error_message: null,
    created_at: '2026-01-01T00:00:00Z',
    started_at: '2026-01-01T00:00:01Z',
    completed_at: '2026-01-01T00:00:02Z',
    expires_at: '2027-01-01T00:00:00Z',
  }

  vi.doMock('@clerk/nextjs/server', () => ({
    auth: vi.fn(async () => ({ userId: authUserId })),
  }))
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

function createStatusRequest(jobId = 'job-abc'): NextRequest {
  const url = new URL(
    `http://localhost/api/personalization/discover-assets/status?jobId=${jobId}`,
    'http://localhost',
  )
  return new NextRequest(url.toString(), {
    method: 'GET',
  })
}

// ---------------------------------------------------------------------------
// Auth classification: this route requires a valid authenticated session.
// Ownership is enforced via the `clerk_user_id` filter in getDiscoveryJobForUser.
// ---------------------------------------------------------------------------

describe('GET /api/personalization/discover-assets/status', () => {
  it('allows anonymous polling when no session is present (free discovery)', async () => {
    authUserId = null
    const { GET } = await import('@/app/api/personalization/discover-assets/status/route')

    const response = await GET(createStatusRequest())
    // No 401: discovery is free, anonymous callers can poll their own jobs.
    // The job is IP-scoped, so an anonymous caller without a matching job
    // gets 404, not 401.
    expect(response.status).not.toBe(401)
  })

  it('returns 404 when job belongs to another user', async () => {
    // Simulate a different user making the request: the DB row is for user-123,
    // but the caller is user-999. getDiscoveryJobForUser scopes by clerk_user_id,
    // so it must return null.
    authUserId = 'user-999'
    mockJobRow = {
      ...mockJobRow,
      clerk_user_id: 'user-123',
    }

    vi.doMock('@/server/discoveryJobs', () => ({
      getDiscoveryJobForUser: vi.fn(async () => null),
    }))

    const { GET } = await import('@/app/api/personalization/discover-assets/status/route')

    const response = await GET(createStatusRequest('job-abc'))
    expect(response.status).toBe(404)
    const data = await response.json()
    expect(data.error).toBe('Job not found')
  })

  it('returns 404 when job does not exist at all', async () => {
    authUserId = 'user-123'
    vi.doMock('@/server/discoveryJobs', () => ({
      getDiscoveryJobForUser: vi.fn(async () => null),
    }))

    const { GET } = await import('@/app/api/personalization/discover-assets/status/route')

    const response = await GET(createStatusRequest('missing-job'))
    expect(response.status).toBe(404)
    const data = await response.json()
    expect(data.error).toBe('Job not found')
  })

  it('returns 400 when jobId is missing', async () => {
    const url = new URL('http://localhost/api/personalization/discover-assets/status', 'http://localhost')
    const { GET } = await import('@/app/api/personalization/discover-assets/status/route')

    const response = await GET(new NextRequest(url.toString(), { method: 'GET' }))
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('jobId is required')
  })

  it('returns job data for the valid owner', async () => {
    authUserId = 'user-123'
    mockJobRow = {
      id: 'job-abc',
      clerk_user_id: 'user-123',
      website_url: 'https://example.com',
      status: 'complete',
      fast_result_json: null,
      browser_result_json: null,
      final_result_json: { discoveredAssets: [{ id: 'a1', url: 'https://example.com/logo.png' }] },
      telemetry_json: { providerAttempts: ['STATIC'], pagesCrawled: 1 },
      error_code: null,
      error_message: null,
      created_at: '2026-01-01T00:00:00Z',
      started_at: '2026-01-01T00:00:01Z',
      completed_at: '2026-01-01T00:00:02Z',
      expires_at: '2027-01-01T00:00:00Z',
    }

    vi.doMock('@/server/discoveryJobs', () => ({
      getDiscoveryJobForUser: vi.fn(async () => mockJobRow),
    }))

    const { GET } = await import('@/app/api/personalization/discover-assets/status/route')

    const response = await GET(createStatusRequest('job-abc'))
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.id).toBe('job-abc')
    expect(data.status).toBe('complete')
    expect(data.websiteUrl).toBe('https://example.com')
    expect(data.pagesCrawled).toBe(1)
    expect(data.providerAttempts).toEqual(['STATIC'])
    expect(data.result).toEqual({ discoveredAssets: [{ id: 'a1', url: 'https://example.com/logo.png' }] })
  })

  it('returns running job with browserQueued=true for valid owner', async () => {
    authUserId = 'user-123'
    const runningJob = {
      ...mockJobRow,
      id: 'job-running',
      clerk_user_id: 'user-123',
      status: 'running',
      started_at: new Date().toISOString(),
      completed_at: null,
    }

    vi.doMock('@/server/discoveryJobs', () => ({
      getDiscoveryJobForUser: vi.fn(async () => runningJob),
      updateDiscoveryJob: vi.fn(async () => ({})),
    }))

    const { GET } = await import('@/app/api/personalization/discover-assets/status/route')

    const response = await GET(createStatusRequest('job-running'))
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.status).toBe('running')
    expect(data.browserQueued).toBe(true)
  })

  it('returns error details for failed jobs owned by the caller', async () => {
    authUserId = 'user-123'
    const erroredJob = {
      ...mockJobRow,
      id: 'job-err',
      clerk_user_id: 'user-123',
      status: 'error',
      error_code: 'PROVIDER_FAILED',
      error_message: 'Static provider returned no candidates',
      final_result_json: null,
    }

    vi.doMock('@/server/discoveryJobs', () => ({
      getDiscoveryJobForUser: vi.fn(async () => erroredJob),
    }))

    const { GET } = await import('@/app/api/personalization/discover-assets/status/route')

    const response = await GET(createStatusRequest('job-err'))
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.status).toBe('error')
    expect(data.browserQueued).toBe(false)
    expect(data.errorCode).toBe('PROVIDER_FAILED')
    expect(data.errorMessage).toBe('Static provider returned no candidates')
  })

  it('never calls getDiscoveryJobById', async () => {
    // This verifies the unauthenticated fallback path has been removed.
    authUserId = 'user-123'
    const getDiscoveryJobById = vi.fn(async () => null)

    vi.doMock('@/server/discoveryJobs', () => ({
      getDiscoveryJobForUser: vi.fn(async () => mockJobRow),
      getDiscoveryJobById,
    }))

    const { GET } = await import('@/app/api/personalization/discover-assets/status/route')

    await GET(createStatusRequest('job-abc'))
    expect(getDiscoveryJobById).not.toHaveBeenCalled()
  })
})
