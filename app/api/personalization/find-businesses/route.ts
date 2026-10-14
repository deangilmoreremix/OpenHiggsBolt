import { NextRequest, NextResponse } from 'next/server'
import { geocodeLocation, discoverBusinesses, deduplicateBusinesses, enrichBusinessRecord, scoreAndSort, createCacheKey, businessDiscoveryCache } from '@/server/businessDiscovery'
import { getNicheMapping, getSupportedNiches } from '@/server/businessDiscovery'
import { logPersonalization, createCorrelationId, sanitizeForLog } from '@/server/personalizationLog'
import { rateLimit, rateLimit429, resolveRateLimitKey } from '@/lib/rateLimit'

export const dynamic = "force-dynamic";

export const runtime = 'nodejs'

const CACHE_TTL_MS = 1000 * 60 * 60 // 1 hour
const MAX_RADIUS_MILES = 50
const DEFAULT_RADIUS_MILES = 15
const MAX_LIMIT = 50
const DEFAULT_LIMIT = 30
const MAX_LOCATION_LENGTH = 200
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 10
// Higher ceiling for the shared 'anon' fallback bucket (see below).
const ANON_RATE_LIMIT_MAX = 100

// Proxy-trust assumption:
// - `x-real-ip` is stamped by the trusted reverse proxy (nginx
//   `proxy_set_header X-Real-IP $remote_addr`, or most load balancers) and is
//   not client-controllable once the proxy overwrites it.
// - `x-forwarded-for` is append-only ($proxy_add_x_forwarded_for): the FIRST
//   hop is whatever the client sent (rotating it mints fresh rate-limit
//   buckets), while the LAST hop is appended by the nearest trusted proxy.
// Therefore prefer x-real-ip, then the LAST x-forwarded-for hop, and give up
// (undefined) when neither exists so resolveRateLimitKey falls back to the
// shared 'anon' bucket — which is rate-limited with a much higher max below.
function clientIpOf(req: NextRequest): string | undefined {
  const realIp = req.headers.get('x-real-ip')?.trim()
  if (realIp) return realIp
  const forwardedFor = req.headers.get('x-forwarded-for')
  if (forwardedFor) {
    const hops = forwardedFor.split(',').map((hop) => hop.trim()).filter(Boolean)
    if (hops.length > 0) return hops[hops.length - 1]
  }
  return undefined
}

// Nominatim/Overpass outages are upstream failures, not caller mistakes: they
// must surface as 502 with a generic message (plus correlationId) instead of
// leaking provider internals or being mislabeled as a bad request.
function isUpstreamProviderError(message: string): boolean {
  return (
    /Nominatim geocoding failed: HTTP/i.test(message) ||
    /Overpass HTTP/i.test(message) ||
    /All Overpass providers failed/i.test(message) ||
    /No results from Overpass/i.test(message) ||
    /fetch failed/i.test(message) ||
    /network/i.test(message) ||
    /timeout/i.test(message) ||
    /abort/i.test(message)
  )
}

function serverErrorResponse(
  error: string,
  correlationId: string,
): NextResponse {
  return NextResponse.json(
    { error, correlationId },
    { status: 502, headers: { 'x-correlation-id': correlationId } },
  )
}

export async function POST(req: NextRequest) {
  const correlationId = createCorrelationId(req)
  const startTime = Date.now()

  // Per-IP rate limit (unauthenticated public-proxy route). The limiter is
  // in-process only (see lib/rateLimit.ts), matching the other personalization
  // routes; it exists to protect the upstream Nominatim/Overpass quota.
  const rateLimitKey = resolveRateLimitKey(undefined, clientIpOf(req))
  // When neither proxy header exists (self-hosted / proxy-less deploys),
  // resolveRateLimitKey falls back to the shared 'anon' bucket, so ALL
  // anonymous callers would share one 10/min bucket and self-DoS each other.
  // Such deployments degrade gracefully with a much higher max for that
  // bucket; IP-keyed callers keep the strict per-IP limit.
  const rateLimitMax = rateLimitKey === 'anon' ? ANON_RATE_LIMIT_MAX : RATE_LIMIT_MAX
  const rateLimitResult = rateLimit(rateLimitKey, { windowMs: RATE_LIMIT_WINDOW_MS, max: rateLimitMax })
  if (!rateLimitResult.allowed) return rateLimit429(rateLimitResult.retryAfterMs)

  try {
    const body = await req.json().catch(() => ({}))
    const niche = typeof body?.niche === 'string' ? body.niche.trim() : ''
    const location = typeof body?.location === 'string' ? body.location.trim() : ''
    const radiusMiles =
      typeof body?.radiusMiles === 'number' && Number.isFinite(body.radiusMiles)
        ? body.radiusMiles
        : DEFAULT_RADIUS_MILES
    const rawLimit =
      typeof body?.limit === 'number' && Number.isFinite(body.limit)
        ? body.limit
        : DEFAULT_LIMIT
    const limit = Math.max(1, Math.min(Math.floor(rawLimit), MAX_LIMIT))

    // Validate input
    if (!niche) {
      logPersonalization({
        route: '/api/personalization/find-businesses',
        stage: 'validation',
        httpStatus: 400,
        safeErrorCode: 'MISSING_NICHE',
        safeMessage: 'niche is required',
        correlationId,
      })
      return NextResponse.json({ error: 'niche is required' }, { status: 400 })
    }
    if (!location) {
      logPersonalization({
        route: '/api/personalization/find-businesses',
        stage: 'validation',
        httpStatus: 400,
        safeErrorCode: 'MISSING_LOCATION',
        safeMessage: 'location is required',
        correlationId,
      })
      return NextResponse.json({ error: 'location is required' }, { status: 400 })
    }
    if (location.length > MAX_LOCATION_LENGTH) {
      logPersonalization({
        route: '/api/personalization/find-businesses',
        stage: 'validation',
        httpStatus: 400,
        safeErrorCode: 'LOCATION_TOO_LONG',
        safeMessage: `location exceeds ${MAX_LOCATION_LENGTH} characters`,
        correlationId,
      })
      return NextResponse.json(
        { error: `location must be at most ${MAX_LOCATION_LENGTH} characters` },
        { status: 400 },
      )
    }

    // Validate niche is supported. The response body stays STATIC — echoing
    // the user-supplied niche back would reflect raw input to the caller, so
    // only the supported list is returned; the raw niche stays in the
    // server-side log for support correlation.
    const mapping = getNicheMapping(niche)
    if (!mapping) {
      logPersonalization({
        route: '/api/personalization/find-businesses',
        stage: 'validation',
        provider: 'OPENSTREETMAP',
        httpStatus: 400,
        safeErrorCode: 'UNSUPPORTED_NICHE',
        safeMessage: `Unsupported niche: "${niche}". Supported: ${getSupportedNiches().join(', ')}`,
        correlationId,
      })
      return NextResponse.json({
        error: `Unsupported niche. Supported niches: ${getSupportedNiches().join(', ')}`,
      }, { status: 400 })
    }

    // Validate and bound radius
    const boundedRadius = Math.max(1, Math.min(radiusMiles, MAX_RADIUS_MILES))

    // Check cache
    const cacheKey = createCacheKey(niche, location, boundedRadius)
    const cached = businessDiscoveryCache.get(cacheKey)
    if (cached) {
      logPersonalization({
        route: '/api/personalization/find-businesses',
        stage: 'cache',
        provider: 'OPENSTREETMAP',
        httpStatus: 200,
        correlationId,
        durationMs: Date.now() - startTime,
      })
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

    // Geocode the location
    let geocodeResult
    try {
      geocodeResult = await geocodeLocation(location)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Geocoding failed'
      if (isUpstreamProviderError(message)) {
        logPersonalization({
          route: '/api/personalization/find-businesses',
          stage: 'geocode',
          provider: 'NOMINATIM',
          httpStatus: 502,
          safeErrorCode: 'GEOCODE_UPSTREAM_FAILED',
          safeMessage: message,
          correlationId,
          durationMs: Date.now() - startTime,
        })
        return serverErrorResponse(
          'Unable to look up the location right now. Please try again shortly.',
          correlationId,
        )
      }
      logPersonalization({
        route: '/api/personalization/find-businesses',
        stage: 'geocode',
        provider: 'NOMINATIM',
        httpStatus: 400,
        safeErrorCode: 'GEOCODE_FAILED',
        safeMessage: message,
        correlationId,
        durationMs: Date.now() - startTime,
      })
      return NextResponse.json({
        error: message,
      }, { status: 400 })
    }

    // Discover businesses
    let rawBusinesses
    try {
      rawBusinesses = await discoverBusinesses({
        niche,
        latitude: geocodeResult.latitude,
        longitude: geocodeResult.longitude,
        radiusMiles: boundedRadius,
        limit: limit * 3, // Get extra for deduplication
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Business discovery failed'
      logPersonalization({
        route: '/api/personalization/find-businesses',
        stage: 'discover',
        provider: 'OPENSTREETMAP',
        httpStatus: 502,
        safeErrorCode: 'DISCOVERY_UPSTREAM_FAILED',
        safeMessage: message,
        correlationId,
        durationMs: Date.now() - startTime,
      })
      return serverErrorResponse(
        'Unable to fetch local businesses right now. Please try again shortly.',
        correlationId,
      )
    }

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

    logPersonalization({
      route: '/api/personalization/find-businesses',
      stage: 'discover',
      provider: 'OPENSTREETMAP',
      httpStatus: 200,
      correlationId,
      durationMs,
    })

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
    // SSRF/networkSafety rejections are caller mistakes (400); everything else
    // here is unexpected and must stay generic (details go to the log only).
    const status = message.includes('not allowed') || message.includes('Private') ? 400 : 500
    logPersonalization({
      route: '/api/personalization/find-businesses',
      stage: 'unhandled',
      provider: 'OPENSTREETMAP',
      httpStatus: status,
      safeErrorCode: status >= 500 ? 'UNEXPECTED_ERROR' : 'VALIDATION_ERROR',
      safeMessage: message,
      correlationId,
      durationMs: Date.now() - startTime,
    })
    if (status >= 500) {
      return NextResponse.json(
        { error: 'Unable to complete the business search. Please try again shortly.', correlationId },
        { status, headers: { 'x-correlation-id': correlationId } },
      )
    }
    return NextResponse.json({ error: message }, { status })
  }
}
