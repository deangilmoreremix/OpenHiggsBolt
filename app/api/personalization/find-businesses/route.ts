import { NextRequest, NextResponse } from 'next/server'
import { geocodeLocation, discoverBusinesses, deduplicateBusinesses, enrichBusinessRecord, scoreAndSort, createCacheKey, businessDiscoveryCache } from '@/server/businessDiscovery'
import { getNicheMapping, getSupportedNiches } from '@/server/businessDiscovery'

const CACHE_TTL_MS = 1000 * 60 * 60 // 1 hour
const MAX_RADIUS_MILES = 50
const MAX_LIMIT = 50
const DEFAULT_LIMIT = 30

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const niche = typeof body?.niche === 'string' ? body.niche.trim() : ''
    const location = typeof body?.location === 'string' ? body.location.trim() : ''
    const radiusMiles = typeof body?.radiusMiles === 'number' ? body.radiusMiles : 15
    const limit = typeof body?.limit === 'number' ? Math.min(body.limit, MAX_LIMIT) : DEFAULT_LIMIT

    // Validate input
    if (!niche) {
      return NextResponse.json({ error: 'niche is required' }, { status: 400 })
    }
    if (!location) {
      return NextResponse.json({ error: 'location is required' }, { status: 400 })
    }

    // Validate niche is supported
    const mapping = getNicheMapping(niche)
    if (!mapping) {
      return NextResponse.json({
        error: `Unsupported niche: "${niche}". Supported: ${getSupportedNiches().join(', ')}`,
      }, { status: 400 })
    }

    // Validate and bound radius
    const boundedRadius = Math.max(1, Math.min(radiusMiles, MAX_RADIUS_MILES))

    // Check cache
    const cacheKey = createCacheKey(niche, location, boundedRadius)
    const cached = businessDiscoveryCache.get(cacheKey)
    if (cached) {
      return NextResponse.json({
        ok: true,
        query: { niche: mapping.label, location, radiusMiles: boundedRadius },
        count: cached.length,
        businesses: cached,
        providerUsed: 'OPENSTREETMAP',
        durationMs: 0,
        cached: true,
      })
    }

    const startTime = Date.now()

    // Geocode the location
    let geocodeResult
    try {
      geocodeResult = await geocodeLocation(location)
    } catch (err) {
      return NextResponse.json({
        error: err instanceof Error ? err.message : 'Geocoding failed',
      }, { status: 400 })
    }

    // Discover businesses
    const rawBusinesses = await discoverBusinesses({
      niche: mapping.label,
      latitude: geocodeResult.latitude,
      longitude: geocodeResult.longitude,
      radiusMiles: boundedRadius,
      limit: limit * 3, // Get extra for deduplication
    })

    // Deduplicate
    const deduplicated = deduplicateBusinesses(rawBusinesses)

    // Score and sort
    const scored = scoreAndSort(deduplicated)

    // Enrich
    const enriched = scored.map(enrichBusinessRecord)

    // Limit results
    const limited = enriched.slice(0, limit)

    const durationMs = Date.now() - startTime

    // Cache results
    businessDiscoveryCache.set(cacheKey, limited, CACHE_TTL_MS)

    return NextResponse.json({
      ok: true,
      query: { niche: mapping.label, location, radiusMiles: boundedRadius },
      count: limited.length,
      businesses: limited,
      providerUsed: 'OPENSTREETMAP',
      durationMs,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    const status = message.includes('not allowed') || message.includes('Private') ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
