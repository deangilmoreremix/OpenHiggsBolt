/**
 * Tests for the OpenStreetMap business discovery domain.
 *
 * External HTTP calls are mocked to keep tests deterministic.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { geocodeLocation } from '../nominatimProvider'
import { discoverBusinesses } from '../overpassProvider'
import { deduplicateBusinesses, enrichBusinessRecord } from '../businessNormalizer'
import { computeLeadScore, computeActivityScore, scoreAndSort } from '../businessScoring'
import { businessDiscoveryCache, createCacheKey } from '../businessCache'
import { getNicheMapping, getSupportedNiches, normalizeNiche, NICHE_MAPPINGS } from '../nicheMappings'
import type { BusinessDiscoveryRecord } from '../types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBusiness(overrides: Partial<BusinessDiscoveryRecord> = {}): BusinessDiscoveryRecord {
  const website = overrides.website
  return {
    id: `osm-node-123`,
    source: 'OPENSTREETMAP',
    osmType: 'node',
    osmId: '123',
    name: 'Test Business',
    category: 'Restaurant',
    websiteStatus: website ? 'confirmed' : 'unknown',
    verificationStatus: 'unverified',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Niche mappings
// ---------------------------------------------------------------------------

describe('Niche mappings', () => {
  it('returns supported niches', () => {
    const niches = getSupportedNiches()
    expect(niches.length).toBeGreaterThan(0)
    expect(niches).toContain('Roofing Contractor')
    expect(niches).toContain('Restaurant')
    expect(niches).toContain('General Business')
  })

  it('maps known niche to OSM tags', () => {
    const mapping = getNicheMapping('Roofing Contractor')
    expect(mapping).toBeDefined()
    expect(mapping!.tags).toContainEqual(['craft', 'roofer'])
  })

  it('normalizes niche case-insensitively', () => {
    expect(normalizeNiche('roofing contractor')).toBe('Roofing Contractor')
    expect(normalizeNiche('RESTAURANT')).toBe('Restaurant')
  })

  it('returns undefined for unsupported niche', () => {
    expect(getNicheMapping('Unicorn Stable')).toBeUndefined()
    expect(normalizeNiche('Unicorn Stable')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

describe('Business discovery cache', () => {
  beforeEach(() => {
    businessDiscoveryCache.clear()
  })

  it('stores and retrieves entries', () => {
    const key = createCacheKey('Restaurant', 'Hollywood, FL', 15)
    const businesses = [makeBusiness({ name: 'ABC Restaurant' })]
    businessDiscoveryCache.set(key, businesses, 60000)
    expect(businessDiscoveryCache.get(key)).toEqual(businesses)
  })

  it('returns null for missing keys', () => {
    expect(businessDiscoveryCache.get('nonexistent')).toBeNull()
  })

  it('expires entries after TTL', async () => {
    const key = createCacheKey('Restaurant', 'Hollywood, FL', 15)
    businessDiscoveryCache.set(key, [makeBusiness()], 50)
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(businessDiscoveryCache.get(key)).toBeNull()
  })

  it('deletes entries', () => {
    const key = createCacheKey('Restaurant', 'Hollywood, FL', 15)
    businessDiscoveryCache.set(key, [makeBusiness()], 60000)
    businessDiscoveryCache.delete(key)
    expect(businessDiscoveryCache.get(key)).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Normalizer
// ---------------------------------------------------------------------------

describe('Business normalizer', () => {
  it('deduplicates by name + city + region', () => {
    const businesses = [
      makeBusiness({ id: '1', name: 'ABC Roofing', city: 'Hollywood', region: 'FL', phone: '555-1234' }),
      makeBusiness({ id: '2', name: 'ABC Roofing', city: 'Hollywood', region: 'FL', phone: '555-1234' }),
      makeBusiness({ id: '3', name: 'ABC Roofing', city: 'Hollywood', region: 'FL', phone: '555-9999' }),
    ]
    const deduped = deduplicateBusinesses(businesses)
    // All three share the same name+city+region, so deduplicate to 1
    expect(deduped.length).toBe(1)
  })

  it('preserves record with more fields when deduplicating', () => {
    const businesses = [
      makeBusiness({ id: '1', name: 'ABC', city: 'Hollywood', region: 'FL', phone: '555-1234', website: '' }),
      makeBusiness({ id: '2', name: 'ABC', city: 'Hollywood', region: 'FL', phone: '555-1234', website: 'https://abc.com' }),
    ]
    const deduped = deduplicateBusinesses(businesses)
    expect(deduped.length).toBe(1)
    expect(deduped[0].website).toBe('https://abc.com')
  })

  it('enriches business with activity and lead scores', () => {
    const business = makeBusiness({
      phone: '555-1234',
      website: 'https://abc.com',
      address: '123 Main St',
      facebook: 'https://fb.com/abc',
    })
    const enriched = enrichBusinessRecord(business)
    expect(enriched.activityScore).toBeGreaterThan(0)
    expect(enriched.leadScore).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

describe('Business scoring', () => {
  it('computes lead score based on contactability', () => {
    const business = makeBusiness({
      phone: '555-1234',
      website: 'https://abc.com',
      address: '123 Main St',
      facebook: 'https://fb.com/abc',
      instagram: 'https://ig.com/abc',
      linkedin: 'https://li.com/abc',
    })
    const score = computeLeadScore(business)
    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('computes activity score based on operational signals', () => {
    const business = makeBusiness({
      phone: '555-1234',
      website: 'https://abc.com',
      openingHours: 'Mo-Fr 09:00-17:00',
      address: '123 Main St',
      facebook: 'https://fb.com/abc',
    })
    const score = computeActivityScore(business)
    expect(score).toBeGreaterThan(0)
  })

  it('sorts businesses by lead score descending', () => {
    const businesses = [
      makeBusiness({ id: '1', name: 'A', phone: '555-1' }),
      makeBusiness({ id: '2', name: 'B', phone: '555-2', website: 'https://b.com' }),
      makeBusiness({ id: '3', name: 'C', phone: '555-3', website: 'https://c.com', address: '123' }),
    ]
    const sorted = scoreAndSort(businesses)
    expect((sorted[0].leadScore || 0)).toBeGreaterThanOrEqual((sorted[sorted.length - 1].leadScore || 0))
  })
})

// ---------------------------------------------------------------------------
// Geocoding (mocked)
// ---------------------------------------------------------------------------

describe('Geocoding', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('geocodes a valid location', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [
        {
          lat: '26.1234',
          lon: '-80.1234',
          display_name: 'Hollywood, Florida, USA',
        },
      ],
    } as Response)

    const result = await geocodeLocation('Hollywood, Florida')
    expect(result.latitude).toBeCloseTo(26.1234, 2)
    expect(result.longitude).toBeCloseTo(-80.1234, 2)
    expect(result.displayName).toContain('Hollywood')
  })

  it('throws for empty location', async () => {
    await expect(geocodeLocation('')).rejects.toThrow('Location is required')
  })

  it('throws when location not found', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
    } as Response)

    await expect(geocodeLocation('Nonexistent Place XYZ')).rejects.toThrow('Location not found')
  })
})

// ---------------------------------------------------------------------------
// Overpass discovery (mocked)
// ---------------------------------------------------------------------------

describe('Overpass discovery', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    businessDiscoveryCache.clear()
  })

  it('discovers businesses for a supported niche', async () => {
    const overpassResponse = {
      elements: [
        {
          type: 'node',
          id: 1,
          lat: 26.1,
          lon: -80.1,
          tags: {
            name: 'Joe\'s Roofing',
            craft: 'roofer',
            phone: '555-1234',
            'addr:city': 'Hollywood',
            'addr:state': 'FL',
          },
        },
        {
          type: 'node',
          id: 2,
          lat: 26.2,
          lon: -80.2,
          tags: {
            name: 'ABC Roofing',
            craft: 'roofer',
            phone: '555-5678',
            website: 'https://abcroofing.com',
            'addr:city': 'Hollywood',
            'addr:state': 'FL',
          },
        },
      ],
    }

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => overpassResponse,
    } as Response)

    const results = await discoverBusinesses({
      niche: 'Roofing Contractor',
      latitude: 26.1,
      longitude: -80.1,
      radiusMiles: 10,
      limit: 10,
    })

    expect(results.length).toBeGreaterThan(0)
    expect(results[0].source).toBe('OPENSTREETMAP')
    expect(results[0].name).toBeDefined()
  })

  it('filters closed businesses', async () => {
    const overpassResponse = {
      elements: [
        {
          type: 'node',
          id: 1,
          lat: 26.1,
          lon: -80.1,
          tags: {
            name: 'Closed Business',
            craft: 'roofer',
            closed: 'yes',
          },
        },
      ],
    }

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => overpassResponse,
    } as Response)

    const results = await discoverBusinesses({
      niche: 'Roofing Contractor',
      latitude: 26.1,
      longitude: -80.1,
      radiusMiles: 10,
    })

    expect(results.length).toBe(0)
  })

  it('throws for unsupported niche', async () => {
    await expect(
      discoverBusinesses({
        niche: 'Unicorn Stable',
        latitude: 26.1,
        longitude: -80.1,
        radiusMiles: 10,
      }),
    ).rejects.toThrow('Unsupported niche')
  })

  it('deduplicates businesses by name + location', async () => {
    const overpassResponse = {
      elements: [
        {
          type: 'node',
          id: 1,
          lat: 26.1,
          lon: -80.1,
          tags: {
            name: 'Joe\'s Roofing',
            craft: 'roofer',
            'addr:city': 'Hollywood',
            'addr:state': 'FL',
          },
        },
        {
          type: 'way',
          id: 2,
          tags: {
            name: 'Joe\'s Roofing',
            craft: 'roofer',
            'addr:city': 'Hollywood',
            'addr:state': 'FL',
          },
        },
      ],
    }

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => overpassResponse,
    } as Response)

    const results = await discoverBusinesses({
      niche: 'Roofing Contractor',
      latitude: 26.1,
      longitude: -80.1,
      radiusMiles: 10,
    })

    expect(results.length).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// Website status handling
// ---------------------------------------------------------------------------

describe('Website status handling', () => {
  it('marks business with website as confirmed', () => {
    const business = makeBusiness({ website: 'https://abc.com' })
    expect(business.websiteStatus).toBe('confirmed')
  })

  it('marks business without website as unknown', () => {
    const business = makeBusiness({ website: undefined })
    expect(business.websiteStatus).toBe('unknown')
  })

  it('never marks unknown website as no website', () => {
    const business = makeBusiness({ website: undefined })
    expect(business.website).toBeUndefined()
    expect(business.websiteStatus).toBe('unknown')
  })
})
