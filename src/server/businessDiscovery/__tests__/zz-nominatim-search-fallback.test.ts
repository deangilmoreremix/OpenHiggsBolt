/**
 * Unit tests for the Nominatim business-LIST fallback provider.
 *
 * Fully offline and deterministic: `globalThis.fetch` is stubbed with a
 * loopback-style URL injected through the `__baseUrl` test-only option, so no
 * network call ever leaves the process.
 *
 * These tests pin the behaviours that make the fallback safe for the free
 * Lead Finder path:
 *  - no fabrication (a POI without a name is never a lead)
 *  - honest empty results when the provider has nothing
 *  - Nominatim's ~1 req/s policy is respected and the query budget is capped
 *  - a degraded provider short-circuits via the circuit breaker
 *  - geographic filtering keeps results near the requested location
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  buildNicheSearchTerms,
  searchBusinessesViaNominatim,
  NominatimSearchUnavailable,
  __resetNominatimSearchCircuitForTests,
  __nominatimSearchCircuitStateForTests,
} from '../nominatimSearchProvider'

const BASE = 'http://127.0.0.1:9' // never actually contacted; fetch is stubbed

interface StubOptions {
  results?: unknown[]
  status?: number
  /** Fail the first N calls, succeed afterwards. */
  failFirst?: number
}

function stubFetch(opts: StubOptions = {}) {
  const { results = [], status = 200, failFirst = 0 } = opts
  const calls: string[] = []
  let attempt = 0

  const fn = vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : String(input)
    calls.push(url)
    attempt += 1
    if (attempt <= failFirst) {
      throw new Error('simulated network failure')
    }
    if (status !== 200) {
      return new Response('upstream error', { status })
    }
    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  })

  vi.stubGlobal('fetch', fn)
  return { calls, fn }
}

function poi(overrides: Record<string, unknown> = {}) {
  return {
    place_id: 1,
    osm_type: 'node',
    osm_id: 12345,
    lat: '30.2672',
    lon: '-97.7431',
    name: 'Test Business',
    display_name: 'Test Business, Austin, Texas, USA',
    type: 'restaurant',
    class: 'amenity',
    extratags: {
      website: 'https://testbusiness.example.com',
      phone: '+1-512-555-0100',
      email: 'hello@testbusiness.example.com',
      opening_hours: 'Mo-Fr 09:00-17:00',
    },
    address: {
      road: 'Main Street',
      house_number: '100',
      city: 'Austin',
      state: 'Texas',
      postcode: '78701',
      country: 'United States',
    },
    ...overrides,
  }
}

beforeEach(() => {
  __resetNominatimSearchCircuitForTests()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('buildNicheSearchTerms', () => {
  it('maps OSM tag values to natural-language search keywords', () => {
    const terms = buildNicheSearchTerms('restaurants-food')
    expect(terms).toContain('restaurant')
    expect(terms).toContain('coffee shop') // amenity=cafe alias
    expect(terms).toContain('fast food') // amenity=fast_food alias
    expect(terms).not.toContain('ice_cream') // never emits raw OSM vocabulary
  })

  it('resolves service-style tag values into customer-facing words', () => {
    const terms = buildNicheSearchTerms('real-estate')
    expect(terms).toContain('real estate') // office=estate_agent
    expect(terms).toContain('insurance agency') // office=insurance
  })

  it('de-duplicates terms and returns an empty list for an unsupported niche', () => {
    const terms = buildNicheSearchTerms('restaurants-food')
    expect(new Set(terms).size).toBe(terms.length)
    expect(buildNicheSearchTerms('not-a-niche')).toEqual([])
  })
})

describe('searchBusinessesViaNominatim — normalization', () => {
  it('normalizes a Nominatim POI into a full business record', async () => {
    stubFetch({ results: [poi()] })

    const records = await searchBusinessesViaNominatim({
      niche: 'restaurants-food',
      latitude: 30.2672,
      longitude: -97.7431,
      radiusMiles: 15,
      location: 'Austin, TX',
      __baseUrl: BASE,
    })

    expect(records).toHaveLength(1)
    const record = records[0]
    expect(record.name).toBe('Test Business')
    expect(record.website).toBe('https://testbusiness.example.com')
    expect(record.phone).toBe('+1-512-555-0100')
    expect(record.email).toBe('hello@testbusiness.example.com')
    expect(record.city).toBe('Austin')
    expect(record.region).toBe('Texas')
    expect(record.postalCode).toBe('78701')
    expect(record.country).toBe('United States')
    expect(record.address).toBe('100 Main Street')
    expect(record.websiteStatus).toBe('confirmed')
    expect(record.source).toBe('OPENSTREETMAP')
    expect(record.osmId).toBe('12345')
  })

  it('prefixes a scheme-less website with https://', async () => {
    stubFetch({
      results: [poi({ extratags: { website: 'testbusiness.example.com' } })],
    })

    const records = await searchBusinessesViaNominatim({
      niche: 'restaurants-food',
      latitude: 30.2672,
      longitude: -97.7431,
      radiusMiles: 15,
      location: 'Austin, TX',
      __baseUrl: BASE,
    })

    expect(records[0].website).toBe('https://testbusiness.example.com')
    expect(records[0].websiteStatus).toBe('confirmed')
  })

  it('records an unknown website status when no website tag exists', async () => {
    stubFetch({ results: [poi({ extratags: {} })] })

    const records = await searchBusinessesViaNominatim({
      niche: 'restaurants-food',
      latitude: 30.2672,
      longitude: -97.7431,
      radiusMiles: 15,
      location: 'Austin, TX',
      __baseUrl: BASE,
    })

    expect(records[0].website).toBeUndefined()
    expect(records[0].websiteStatus).toBe('unknown')
  })
})

describe('searchBusinessesViaNominatim — no fabrication', () => {
  it('never emits a record for a POI without a name', async () => {
    stubFetch({ results: [poi({ name: undefined }), poi({ name: '   ' })] })

    const records = await searchBusinessesViaNominatim({
      niche: 'restaurants-food',
      latitude: 30.2672,
      longitude: -97.7431,
      radiusMiles: 15,
      location: 'Austin, TX',
      __baseUrl: BASE,
    })

    expect(records).toEqual([])
  })

  it('returns an honest empty result when the provider has nothing', async () => {
    stubFetch({ results: [] })

    const records = await searchBusinessesViaNominatim({
      niche: 'restaurants-food',
      latitude: 30.2672,
      longitude: -97.7431,
      radiusMiles: 15,
      location: 'Austin, TX',
      __baseUrl: BASE,
    })

    expect(records).toEqual([])
  })

  it('drops POIs carrying OSM closed-lifecycle tags', async () => {
    stubFetch({
      results: [poi({ extratags: { ...poi().extratags, disused: 'yes' } })],
    })

    const records = await searchBusinessesViaNominatim({
      niche: 'restaurants-food',
      latitude: 30.2672,
      longitude: -97.7431,
      radiusMiles: 15,
      location: 'Austin, TX',
      __baseUrl: BASE,
    })

    expect(records).toEqual([])
  })
})

describe('searchBusinessesViaNominatim — geographic scope', () => {
  it('drops POIs far outside the requested radius', async () => {
    // ~93 miles from the Austin centre used below.
    stubFetch({ results: [poi({ lat: '31.6', lon: '-97.7' })] })

    const records = await searchBusinessesViaNominatim({
      niche: 'restaurants-food',
      latitude: 30.2672,
      longitude: -97.7431,
      radiusMiles: 5,
      location: 'Austin, TX',
      __baseUrl: BASE,
    })

    expect(records).toEqual([])
  })

  it('keeps POIs inside the requested radius', async () => {
    stubFetch({ results: [poi()] }) // ~0 miles from the centre

    const records = await searchBusinessesViaNominatim({
      niche: 'restaurants-food',
      latitude: 30.2672,
      longitude: -97.7431,
      radiusMiles: 5,
      location: 'Austin, TX',
      __baseUrl: BASE,
    })

    expect(records).toHaveLength(1)
  })

  it('keeps coordinate-less POIs that Nominatim already scoped by location phrase', async () => {
    stubFetch({ results: [poi({ lat: undefined, lon: undefined })] })

    const records = await searchBusinessesViaNominatim({
      niche: 'restaurants-food',
      latitude: 30.2672,
      longitude: -97.7431,
      radiusMiles: 5,
      location: 'Austin, TX',
      __baseUrl: BASE,
    })

    expect(records).toHaveLength(1)
    expect(records[0].latitude).toBeUndefined()
  })
})

describe('searchBusinessesViaNominatim — request budget and throttling', () => {
  it('respects the capped number of Nominatim calls per search', async () => {
    const { calls } = stubFetch({ results: [poi()] })

    await searchBusinessesViaNominatim({
      niche: 'restaurants-food',
      latitude: 30.2672,
      longitude: -97.7431,
      radiusMiles: 15,
      location: 'Austin, TX',
      limit: 100,
      __baseUrl: BASE,
    })

    // 'restaurants-food' has 7 tag tuples, so without a cap this would issue
    // many calls. The cap keeps the public quota bounded.
    expect(calls.length).toBeLessThanOrEqual(3)
    expect(calls.length).toBeGreaterThan(0)
  })

  it('serializes requests so the ~1 req/s policy is honoured', async () => {
    const timestamps: number[] = []
    const fn = vi.fn(async (input: RequestInfo | URL) => {
      timestamps.push(Date.now())
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })
    vi.stubGlobal('fetch', fn)

    const opts = {
      niche: 'restaurants-food',
      latitude: 30.2672,
      longitude: -97.7431,
      radiusMiles: 15,
      location: 'Austin, TX',
      __baseUrl: BASE,
    }
    // Two concurrent searches must not both hit the provider at once.
    await Promise.all([
      searchBusinessesViaNominatim(opts),
      searchBusinessesViaNominatim(opts),
    ])

    expect(timestamps.length).toBeGreaterThan(1)
    for (let i = 1; i < timestamps.length; i += 1) {
      expect(timestamps[i] - timestamps[i - 1]).toBeGreaterThanOrEqual(1000)
    }
  })
})

describe('searchBusinessesViaNominatim — circuit breaker', () => {
  it('opens after consecutive failures and short-circuits later calls', async () => {
    const { calls } = stubFetch({ failFirst: 99 })

    const opts = {
      niche: 'restaurants-food',
      latitude: 30.2672,
      longitude: -97.7431,
      radiusMiles: 15,
      location: 'Austin, TX',
      __baseUrl: BASE,
    }

    // First search exhausts the budget and throws.
    await expect(searchBusinessesViaNominatim(opts)).rejects.toThrow(NominatimSearchUnavailable)
    const callsAfterFirst = calls.length
    expect(__nominatimSearchCircuitStateForTests().consecutiveFailures).toBeGreaterThanOrEqual(2)

    // Second search must short-circuit without issuing any request.
    await expect(searchBusinessesViaNominatim(opts)).rejects.toThrow(NominatimSearchUnavailable)
    expect(calls.length).toBe(callsAfterFirst)
  })

  it('resets the failure counter after a successful call', async () => {
    stubFetch({ results: [poi()] })

    await searchBusinessesViaNominatim({
      niche: 'restaurants-food',
      latitude: 30.2672,
      longitude: -97.7431,
      radiusMiles: 15,
      location: 'Austin, TX',
      __baseUrl: BASE,
    })

    expect(__nominatimSearchCircuitStateForTests()).toEqual({
      consecutiveFailures: 0,
      openUntil: 0,
    })
  })

  it('throws NominatimSearchUnavailable (not a raw error) when the provider is down', async () => {
    stubFetch({ status: 503 })

    await expect(
      searchBusinessesViaNominatim({
        niche: 'restaurants-food',
        latitude: 30.2672,
        longitude: -97.7431,
        radiusMiles: 15,
        location: 'Austin, TX',
        __baseUrl: BASE,
      }),
    ).rejects.toThrow(NominatimSearchUnavailable)
  })

  it('carries a public-safe message with no provider internals', async () => {
    stubFetch({ status: 503 })

    const error = await searchBusinessesViaNominatim({
      niche: 'restaurants-food',
      latitude: 30.2672,
      longitude: -97.7431,
      radiusMiles: 15,
      location: 'Austin, TX',
      __baseUrl: BASE,
    }).catch((err) => err)

    expect(error.userMessage).toContain('temporarily busy')
    expect(error.userMessage).not.toMatch(/nominatim|overpass|http|503/i)
  })
})

describe('searchBusinessesViaNominatim — input validation', () => {
  it('rejects an unsupported niche rather than searching blindly', async () => {
    const { calls } = stubFetch({ results: [] })

    await expect(
      searchBusinessesViaNominatim({
        niche: 'not-a-niche',
        latitude: 30.2672,
        longitude: -97.7431,
        radiusMiles: 15,
        location: 'Austin, TX',
        __baseUrl: BASE,
      }),
    ).rejects.toThrow(/Unsupported niche/)

    expect(calls).toHaveLength(0)
  })

  it('requests extratags so contact and branding fields are returned', async () => {
    const { calls } = stubFetch({ results: [poi()] })

    await searchBusinessesViaNominatim({
      niche: 'restaurants-food',
      latitude: 30.2672,
      longitude: -97.7431,
      radiusMiles: 15,
      location: 'Austin, TX',
      __baseUrl: BASE,
    })

    expect(calls.length).toBeGreaterThan(0)
    for (const url of calls) {
      expect(url).toContain('extratags=1')
      expect(url).toContain('addressdetails=1')
      expect(url).toContain('format=jsonv2')
    }
  })
})
