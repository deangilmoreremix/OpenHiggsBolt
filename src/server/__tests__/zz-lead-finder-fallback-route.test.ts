/**
 * Route-level tests for the Lead Finder Overpass → Nominatim search fallback.
 *
 * Fully offline and deterministic. Isolates
 * `app/api/personalization/find-businesses/route.ts` the same way
 * `findBusinessesRoute.test.ts` does: '@/server/businessDiscovery' is mocked at
 * the module boundary (real niche lookups from the dependency-free
 * nicheMappings module), every network-touching export is a controllable mock.
 *
 * These tests pin the fallback contract:
 *  - every Overpass mirror failing → the Nominatim search endpoint is tried
 *  - a fallback success returns real businesses with providerUsed
 *    'NOMINATIM_SEARCH' (so the path is traceable, not silently identical)
 *  - both providers failing → honest 502 with actionable copy and NO
 *    fabricated businesses
 *  - a caller-shaped error (unsupported niche) does NOT silently become a
 *    Nominatim search
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/server/personalizationLog', () => ({
  logPersonalization: vi.fn(),
  createCorrelationId: vi.fn(),
  sanitizeForLog: vi.fn((s: unknown) => s),
}))

vi.mock('@/server/envValidation', () => ({
  validatePersonalizationEnv: vi.fn(),
}))

vi.mock('@/lib/rateLimit', () => ({
  resolveRateLimitKey: (userId?: string | null, clientIp?: string | null) =>
    userId || clientIp || 'anon',
  rateLimit: vi.fn(() => ({ allowed: true, retryAfterMs: 60000 })),
  rateLimit429: vi.fn(() => new Response('rate limited', { status: 429 })),
}))

// vi.mock factories are hoisted, so the marker class must be created inside
// vi.hoisted() for the factory to reference it.
const mocks = vi.hoisted(() => {
  class AllOverpassProvidersFailedError extends Error {}
  return { AllOverpassProvidersFailedError }
})

vi.mock('@/server/businessDiscovery', async () => {
  const nicheMappings = await import('@/server/businessDiscovery/nicheMappings')
  return {
    getNicheMapping: nicheMappings.getNicheMapping,
    getSupportedNiches: nicheMappings.getSupportedNiches,
    geocodeLocation: vi.fn(),
    discoverBusinesses: vi.fn(),
    searchBusinessesViaNominatim: vi.fn(),
    NominatimSearchUnavailable: class NominatimSearchUnavailableMock extends Error {},
    AllOverpassProvidersFailed: mocks.AllOverpassProvidersFailedError,
    deduplicateBusinesses: vi.fn((items: any) => items),
    enrichBusinessRecord: vi.fn((record: any) => record),
    scoreAndSort: vi.fn((items: any) => items),
    createCacheKey: vi.fn(
      (niche: string, location: string, radiusMiles: number) => `${niche}|${location}|${radiusMiles}`,
    ),
    businessDiscoveryCache: { get: vi.fn(), set: vi.fn() },
  }
})

import { POST } from '@/app/api/personalization/find-businesses/route'
import {
  geocodeLocation,
  discoverBusinesses,
  searchBusinessesViaNominatim,
  NominatimSearchUnavailable,
} from '@/server/businessDiscovery'

const NICHE = 'restaurants-food'
const LOCATION = 'Austin, TX'

function fallbackRecord(id: string) {
  return {
    id,
    name: `Fallback Business ${id}`,
    website: `https://business-${id}.example.com`,
    city: 'Austin',
    source: 'OPENSTREETMAP',
  }
}

function post(body: unknown, headers: Record<string, string> = {}) {
  const req = new NextRequest('http://localhost/api/personalization/find-businesses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
  return POST(req)
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(geocodeLocation).mockResolvedValue({
    latitude: 30.2672,
    longitude: -97.7431,
    displayName: 'Austin, Texas, USA',
  } as any)
})

describe('Lead Finder fallback — every Overpass mirror down', () => {
  it('falls back to the Nominatim search endpoint and returns real businesses', async () => {
    vi.mocked(discoverBusinesses).mockRejectedValue(
      new mocks.AllOverpassProvidersFailedError('All Overpass providers failed: Overpass HTTP 502'),
    )
    vi.mocked(searchBusinessesViaNominatim).mockResolvedValue([
      fallbackRecord('a'),
      fallbackRecord('b'),
    ] as any)

    const res = await post({ niche: NICHE, location: LOCATION })
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.count).toBe(2)
    expect(body.businesses).toHaveLength(2)
    expect(body.businesses[0].name).toBe('Fallback Business a')
    // The provider is traceable rather than silently identical to Overpass.
    expect(body.providerUsed).toBe('NOMINATIM_SEARCH')
    expect(body.cached).toBeUndefined()

    expect(searchBusinessesViaNominatim).toHaveBeenCalledTimes(1)
    expect(searchBusinessesViaNominatim).toHaveBeenCalledWith(
      expect.objectContaining({
        niche: NICHE,
        location: LOCATION,
        latitude: 30.2672,
        longitude: -97.7431,
      }),
    )
  })

  it('caches fallback results so a repeat search does not re-hit the provider', async () => {
    const { businessDiscoveryCache } = await import('@/server/businessDiscovery')
    vi.mocked(discoverBusinesses).mockRejectedValue(new mocks.AllOverpassProvidersFailedError('down'))
    vi.mocked(searchBusinessesViaNominatim).mockResolvedValue([fallbackRecord('a')] as any)

    await post({ niche: NICHE, location: LOCATION })

    expect(businessDiscoveryCache.set).toHaveBeenCalledTimes(1)
  })

  it('passes the location string through so the fallback stays geo-scoped', async () => {
    vi.mocked(discoverBusinesses).mockRejectedValue(new mocks.AllOverpassProvidersFailedError('down'))
    vi.mocked(searchBusinessesViaNominatim).mockResolvedValue([fallbackRecord('a')] as any)

    await post({ niche: NICHE, location: LOCATION, radiusMiles: 25 })

    expect(searchBusinessesViaNominatim).toHaveBeenCalledWith(
      expect.objectContaining({ location: LOCATION, radiusMiles: 25 }),
    )
  })
})

describe('Lead Finder fallback — both providers fail', () => {
  it('returns an actionable 502 and never fabricates businesses', async () => {
    vi.mocked(discoverBusinesses).mockRejectedValue(new mocks.AllOverpassProvidersFailedError('down'))
    vi.mocked(searchBusinessesViaNominatim).mockRejectedValue(
      new (NominatimSearchUnavailable as any)('circuit open'),
    )

    const res = await post({ niche: NICHE, location: LOCATION })
    expect(res.status).toBe(502)

    const body = await res.json()
    expect(body.error).toMatch(/temporarily busy/i)
    expect(body.error).toMatch(/enter a business website manually/i)
    // Partial geocode is preserved so the UI keeps the resolved location.
    expect(body.partial.geocode.latitude).toBeCloseTo(30.2672)
    // No businesses are invented.
    expect(body.businesses).toBeUndefined()
  })

  it('returns 502 with actionable copy when the fallback finds nothing', async () => {
    vi.mocked(discoverBusinesses).mockRejectedValue(new mocks.AllOverpassProvidersFailedError('down'))
    vi.mocked(searchBusinessesViaNominatim).mockResolvedValue([] as any)

    const res = await post({ niche: NICHE, location: LOCATION })
    expect(res.status).toBe(502)

    const body = await res.json()
    expect(body.error).toMatch(/temporarily busy/i)
    expect(body.businesses).toBeUndefined()
  })
})

describe('Lead Finder fallback — non-Overpass failures do not fall back', () => {
  it('rejects an unsupported niche before any provider is contacted', async () => {
    vi.mocked(discoverBusinesses).mockRejectedValue(
      new Error('Unsupported niche: "not-a-niche". Supported niches: ecommerce, real-estate'),
    )

    const res = await post({ niche: 'not-a-niche', location: LOCATION })
    // Niche validation happens before discovery, so this is a caller error.
    expect(res.status).toBe(400)

    const body = await res.json()
    expect(body.error).toMatch(/Unsupported niche/i)
    expect(searchBusinessesViaNominatim).not.toHaveBeenCalled()
    expect(discoverBusinesses).not.toHaveBeenCalled()
  })

  it('uses the Overpass path when Overpass succeeds', async () => {
    vi.mocked(discoverBusinesses).mockResolvedValue([
      { id: 'osm-1', name: 'Overpass Business', source: 'OPENSTREETMAP' },
    ] as any)

    const res = await post({ niche: NICHE, location: LOCATION })
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.providerUsed).toBe('OPENSTREETMAP')
    expect(body.businesses[0].name).toBe('Overpass Business')
    // The two providers run CONCURRENTLY (that is what keeps the request
    // inside the platform's function budget), so the Nominatim search IS
    // contacted even when Overpass answers. What matters is that the
    // Overpass result is the one that is returned.
    expect(searchBusinessesViaNominatim).toHaveBeenCalled()
  })
})
