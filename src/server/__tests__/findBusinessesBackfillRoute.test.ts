/**
 * Route-level tests for the ≥30 backfill: the route widens the search (radius ladder, then related
 * niches) when the first pass leaves fewer than the target, and reports honest counts. Offline: the
 * providers are mocks, the backfill module itself is real.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/server/personalizationLog', () => ({
  logPersonalization: vi.fn(), createCorrelationId: vi.fn(() => 'cid'), sanitizeForLog: vi.fn((s: unknown) => s),
}))
vi.mock('@/server/envValidation', () => ({ validatePersonalizationEnv: vi.fn() }))
vi.mock('@/lib/rateLimit', () => ({
  resolveRateLimitKey: () => 'k', rateLimit: vi.fn(() => ({ allowed: true, retryAfterMs: 1 })), rateLimit429: vi.fn(),
}))
vi.mock('@/server/businessDiscovery', async () => {
  const nm = await import('@/server/businessDiscovery/nicheMappings')
  const norm = await import('@/server/businessDiscovery/businessNormalizer')
  const own = await import('@/server/businessDiscovery/ownershipClassification')
  return {
    getNicheMapping: nm.getNicheMapping, getSupportedNiches: nm.getSupportedNiches,
    geocodeLocation: vi.fn(), discoverBusinesses: vi.fn(), searchBusinessesViaNominatim: vi.fn(),
    NominatimSearchUnavailable: class extends Error {}, AllOverpassProvidersFailed: class extends Error {},
    deduplicateBusinesses: norm.deduplicateBusinesses,
    scoreAndSort: vi.fn((items: any) => items),
    classifyRecords: own.classifyRecords, excludeNationalChains: own.excludeNationalChains,
    createCacheKey: (n: string, l: string, r: number) => `${n}|${l}|${r}`,
    businessDiscoveryCache: { get: vi.fn(), set: vi.fn() },
  }
})

import { POST } from '@/app/api/personalization/find-businesses/route'
import { geocodeLocation, discoverBusinesses, searchBusinessesViaNominatim } from '@/server/businessDiscovery'

const W = ['Anchor', 'Birch', 'Cedar', 'Delta', 'Ember', 'Falcon', 'Garnet', 'Harbor', 'Ivory', 'Juniper']
const rec = (i: number, name?: string) => ({
  id: `r${i}`, source: 'OPENSTREETMAP', osmType: 'node', osmId: String(5000 + i),
  name: name ?? `${W[i % 10]} ${W[(i * 3 + 1) % 10]} Studio ${i}`, category: 'x', websiteStatus: 'unknown', verificationStatus: 'unverified',
})
const batch = (from: number, n: number) => Array.from({ length: n }, (_, k) => rec(from + k))
const post = (body: object = {}) =>
  POST(new NextRequest('http://localhost/api/personalization/find-businesses', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ niche: 'beauty', location: 'Tampa, FL', radiusMiles: 15, ...body }),
  }))

beforeEach(() => {
  vi.mocked(geocodeLocation).mockReset().mockResolvedValue({ latitude: 27.9, longitude: -82.4, displayName: 'Tampa' } as any)
  vi.mocked(discoverBusinesses).mockReset()
  vi.mocked(searchBusinessesViaNominatim).mockReset().mockResolvedValue([] as any)
})

describe('find-businesses backfill', () => {
  it('widens the radius until 30 independents are found', async () => {
    vi.mocked(discoverBusinesses).mockImplementation(async (o: any) => batch(0, o.radiusMiles === 15 ? 12 : o.radiusMiles === 25 ? 24 : 40) as any)
    const res = await post()
    const body = await res.json()
    expect(body.count).toBe(30)
    expect(body.backfill).toMatchObject({ requested: 30, exhausted: false, stoppedBy: 'target' })
    expect(body.backfill.stagesUsed).toBeGreaterThanOrEqual(1)
    expect(vi.mocked(discoverBusinesses).mock.calls.map((c: any) => c[0].radiusMiles)).toContain(25)
  })

  it('excludes chains from the count and keeps widening', async () => {
    vi.mocked(discoverBusinesses).mockImplementation(async (o: any) =>
      [...batch(0, 8), rec(900, 'Walmart'), rec(901, 'Target'), ...(o.radiusMiles >= 35 ? batch(100, 30) : [])] as any)
    const body = await (await post()).json()
    expect(body.count).toBe(30)
    expect(body.businesses.some((b: any) => b.name === 'Walmart' || b.name === 'Target')).toBe(false)
  })

  it('reports honestly when the area has fewer than 30 (no invented businesses)', async () => {
    vi.mocked(discoverBusinesses).mockResolvedValue(batch(0, 9) as any)
    const body = await (await post()).json()
    expect(body.count).toBe(9)
    expect(body.backfill).toMatchObject({ requested: 30, found: 9, exhausted: true })
    expect(body.backfill.message).toMatch(/Only 9 independent/)
  })

  it('does not widen when the first pass already has 30', async () => {
    vi.mocked(discoverBusinesses).mockResolvedValue(batch(0, 40) as any)
    const body = await (await post()).json()
    expect(body.count).toBe(30)
    expect(body.backfill).toBeUndefined()
    expect(vi.mocked(discoverBusinesses)).toHaveBeenCalledTimes(1)
  })

  it('backfill:false keeps the original single-pass behaviour', async () => {
    vi.mocked(discoverBusinesses).mockResolvedValue(batch(0, 5) as any)
    const body = await (await post({ backfill: false })).json()
    expect(body.count).toBe(5)
    expect(vi.mocked(discoverBusinesses)).toHaveBeenCalledTimes(1)
  })

  it('a failing widened stage does not break the response', async () => {
    let n = 0
    vi.mocked(discoverBusinesses).mockImplementation(async () => { if (n++ > 0) throw new Error('mirror down'); return batch(0, 6) as any })
    const res = await post()
    expect(res.status).toBe(200)
    expect((await res.json()).count).toBe(6)
  })
})
