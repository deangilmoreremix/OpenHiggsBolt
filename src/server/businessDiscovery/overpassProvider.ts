/**
 * Overpass API provider for OpenStreetMap business discovery.
 *
 * Queries Overpass to find businesses matching specific tags within a
 * geographic bounding box derived from a center point + radius.
 *
 * Resilience (Lead Finder free path, Phase 3):
 *  - Per-request timeout is bounded (PER_REQUEST_TIMEOUT_MS) so a single slow
 *    mirror cannot dominate the user-visible latency.
 *  - The whole stage is bounded by STAGE_DEADLINE_MS, so the provider can
 *    never outrun the request budget the public route works with.
 *  - The mirrors are RACED, not chained. The stage costs the SLOWEST mirror
 *    instead of the SUM of all of them: the previous implementation walked
 *    the mirror list one after another, so three slow mirrors cost
 *    3 × PER_REQUEST_TIMEOUT_MS × MAX_RETRIES (up to ~90s) before any result
 *    could exist — that is what produced the platform's HTML 504.
 *  - Retries use exponential backoff with jitter.
 *  - A per-mirror circuit breaker opens a mirror for COOLDOWN_MS after
 *    FAILURE_THRESHOLD consecutive failures and short-circuits subsequent
 *    calls to that mirror until the cooldown expires, so one bad mirror
 *    cannot block the route indefinitely.
 *  - When every mirror is unavailable, throws an `AllOverpassProvidersFailed`
 *    error carrying a public-safe message; the public route translates it
 *    to a clear "service temporarily busy — try again or enter a business
 *    website manually" 502 (no provider internals leak).
 */

import type { BusinessDiscoveryRecord, OverpassQueryOptions } from './types'
import { getNicheMapping, getSupportedNiches } from './nicheMappings'
import { createStageDeadline, withDeadline, type StageDeadline } from './deadline'

const DEFAULT_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://z.overpass-api.de/api/interpreter',
]

const USER_AGENT = 'SmartVideoGO-AI/1.0 (https://go.smartvid.app)'
// Per-mirror request timeout. Bounded so a single stuck mirror cannot
// dominate (was 30s × 3 mirrors × 2 retries = up to ~180s).
const PER_REQUEST_TIMEOUT_MS = 6_000
/**
 * Hard budget for the whole Overpass stage, retries included.
 *
 * The mirrors race, so the stage normally costs one mirror's latency. This
 * budget is the backstop for the case where EVERY mirror is slow: it caps
 * the stage at 9s instead of letting the per-mirror timeouts and retries
 * stack up.
 */
const STAGE_DEADLINE_MS = 9_000
const MAX_RETRIES = 2
const RESULT_LIMIT = 50
// Exponential backoff base (ms). attempt N waits base * 2^N + jitter.
const BACKOFF_BASE_MS = 400
// Per-mirror circuit breaker thresholds.
const FAILURE_THRESHOLD = 3
const COOLDOWN_MS = 60_000

/**
 * Fetches with a bounded timeout. `externalSignal` cancels the request when
 * the stage is over (for example when a racing mirror already won).
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = PER_REQUEST_TIMEOUT_MS,
  externalSignal?: AbortSignal,
): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  const onExternalAbort = () => controller.abort()
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort()
    else externalSignal.addEventListener('abort', onExternalAbort)
  }
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
    externalSignal?.removeEventListener('abort', onExternalAbort)
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ── Circuit breaker (per mirror, module-scoped) ──────────────────────────────
// State is module-internal so it survives across calls within a single Node
// process (mirroring the upstream Overpass mirror outages we saw). Tests
// reset it via `__resetOverpassCircuitBreakerForTests`.

interface MirrorCircuit {
  consecutiveFailures: number
  openUntil: number // epoch ms; while Date.now < openUntil the mirror is skipped
}

const circuitByEndpoint: Map<string, MirrorCircuit> = new Map()

function recordSuccess(endpoint: string): void {
  const c = circuitByEndpoint.get(endpoint)
  if (!c) return
  c.consecutiveFailures = 0
  c.openUntil = 0
}

function recordFailure(endpoint: string): void {
  const c = circuitByEndpoint.get(endpoint) || { consecutiveFailures: 0, openUntil: 0 }
  c.consecutiveFailures += 1
  if (c.consecutiveFailures >= FAILURE_THRESHOLD) {
    c.openUntil = Date.now() + COOLDOWN_MS
  }
  circuitByEndpoint.set(endpoint, c)
}

function isOpen(endpoint: string): boolean {
  const c = circuitByEndpoint.get(endpoint)
  if (!c) return false
  if (c.openUntil === 0) return false
  if (Date.now() >= c.openUntil) {
    // Cooldown expired: half-open — reset and allow one probe.
    c.openUntil = 0
    c.consecutiveFailures = 0
    return false
  }
  return true
}

/**
 * Marker error for "every Overpass mirror failed". The public route reads
 * `.userMessage` (a static, provider-internals-free copy) and translates it
 * to a 502. Carrying the marker on the error class lets the route stay
 * generic for unrelated throws without false positives.
 */
export class AllOverpassProvidersFailed extends Error {
  readonly userMessage =
    'Local business search is temporarily busy. Please try again in a moment or enter a business website manually to continue.'
  constructor(message: string) {
    super(message)
    this.name = 'AllOverpassProvidersFailed'
  }
}

/**
 * Test-only helper. Resets the per-mirror circuit breaker state so a fresh
 * test starts with all mirrors available. Not part of the public API.
 */
export function __resetOverpassCircuitBreakerForTests(): void {
  circuitByEndpoint.clear()
}

/**
 * Test-only helper. Returns a shallow snapshot of the per-mirror circuit
 * state (failures + openUntil epoch). Not part of the public API.
 */
export function __overpassCircuitStateForTests(): Record<string, { consecutiveFailures: number; openUntil: number }> {
  const out: Record<string, { consecutiveFailures: number; openUntil: number }> = {}
  for (const [endpoint, c] of circuitByEndpoint.entries()) {
    out[endpoint] = { consecutiveFailures: c.consecutiveFailures, openUntil: c.openUntil }
  }
  return out
}

/**
 * Test-only helper. Exposes the stage budgets so tests can assert that the
 * provider's worst case fits inside the route's request budget.
 */
export function __overpassBudgetForTests(): {
  perRequestTimeoutMs: number
  stageDeadlineMs: number
  maxRetries: number
} {
  return {
    perRequestTimeoutMs: PER_REQUEST_TIMEOUT_MS,
    stageDeadlineMs: STAGE_DEADLINE_MS,
    maxRetries: MAX_RETRIES,
  }
}

// OSM tags that indicate a business is closed or not operational.
const CLOSED_LIFEcycle_TAGS = [
  'abandoned',
  'disused',
  'demolished',
  'razed',
  'removed',
  'closed',
  'vacant',
  'proposed',
  'planned',
  'construction',
]

// Tags to extract from OSM elements.
const NAME_TAGS = ['name', 'name:en']
const PHONE_TAGS = ['phone', 'contact:phone', 'contact:mobile', 'mobile']
const EMAIL_TAGS = ['email', 'contact:email']
const WEBSITE_TAGS = ['website', 'contact:website', 'url', 'contact:url']
const ADDRESS_TAGS: Record<string, string> = {
  addr: 'address',
  'addr:street': 'street',
  'addr:city': 'city',
  'addr:state': 'region',
  'addr:postcode': 'postalCode',
  'addr:country': 'country',
}
const SOCIAL_TAGS: Record<string, string> = {
  facebook: 'facebook',
  instagram: 'instagram',
  whatsapp: 'whatsapp',
  youtube: 'youtube',
  linkedin: 'linkedin',
  'contact:linkedin': 'linkedin',
  'contact:youtube': 'youtube',
  'contact:instagram': 'instagram',
}

interface OverpassElement {
  type: 'node' | 'way' | 'relation'
  id: number
  tags?: Record<string, string>
  lat?: number
  lon?: number
}

interface OverpassResult {
  elements: OverpassElement[]
}

/**
 * Build the Overpass QL query for a niche's tag tuples.
 *
 * Each tuple becomes its OWN selector and the selectors are OR'd by the
 * surrounding union block. Overpass ANDs filters inside a single selector, so
 * the tuples must never be merged into one filter list.
 *
 * The previous implementation grouped the tuples by key and joined them into a
 * single filter chain, which produced e.g.
 *
 *   node["office"~"^(estate_agent|insurance)$"]["shop"="real_estate"](bbox)
 *
 * — an element carrying BOTH an office and a shop tag. No real business does
 * that, so every niche that spans more than one tag key (real-estate,
 * restaurants-food, ecommerce, beauty, wellness-fitness, …) returned zero
 * results and Lead Finder searches came back empty. See the regression test in
 * `src/server/businessDiscovery/__tests__/overpassQuery.test.ts`.
 */
export function buildOverpassQuery(options: OverpassQueryOptions): string {
  const { south, west, north, east, tags, limit = RESULT_LIMIT } = options

  const bbox = `(${south},${west},${north},${east})`

  // Dedupe: a niche may list the same tuple twice (e.g. `spa` in both beauty
  // and wellness), and repeating a selector only duplicates rows.
  const selectors = Array.from(
    new Set(tags.map(([key, value]) => `["${key}"="${value.replace(/"/g, '\\"')}"]`)),
  )

  if (selectors.length === 0) {
    return `[out:json][timeout:25];();out body ${limit};`
  }

  const parts: string[] = []
  for (const selector of selectors) {
    parts.push(`node${selector}${bbox};`)
    parts.push(`way${selector}${bbox};`)
    parts.push(`relation${selector}${bbox};`)
  }

  // The trailing `(._;>;)` expands each way/relation into its member nodes so
  // the normalizer sees real coordinates instead of only a way id.
  return `[out:json][timeout:25];(${parts.join('')}(._;>;););out body ${limit};`
}

function isClosed(tags: Record<string, string> | undefined): boolean {
  if (!tags) return false

  for (const tag of CLOSED_LIFEcycle_TAGS) {
    const value = tags[tag]
    if (value === 'yes' || value === '1' || value === 'true') {
      return true
    }
  }

  // Check for lifecycle prefixes
  for (const key of Object.keys(tags)) {
    for (const closedTag of CLOSED_LIFEcycle_TAGS) {
      if (key.startsWith(`${closedTag}:`) && (tags[key] === 'yes' || tags[key] === '1')) {
        return true
      }
    }
  }

  return false
}

function extractFirst(tags: Record<string, string> | undefined, keys: string[]): string | undefined {
  if (!tags) return undefined
  for (const key of keys) {
    const value = tags[key]
    if (value && value.trim()) {
      return value.trim()
    }
  }
  return undefined
}

function normalizeElement(element: OverpassElement, category: string): BusinessDiscoveryRecord {
  const tags = element.tags || {}

  const name = extractFirst(tags, NAME_TAGS)
  const phone = extractFirst(tags, PHONE_TAGS)
  const email = extractFirst(tags, EMAIL_TAGS)

  let website: string | undefined
  const rawWebsite = extractFirst(tags, WEBSITE_TAGS)
  if (rawWebsite) {
    website = rawWebsite
    if (!/^https?:\/\//i.test(website)) {
      website = `https://${website}`
    }
  }

  const addressParts: string[] = []
  let city: string | undefined
  let region: string | undefined
  let postalCode: string | undefined
  let country: string | undefined

  for (const [osmKey, displayKey] of Object.entries(ADDRESS_TAGS)) {
    const value = tags[osmKey]
    if (value && value.trim()) {
      if (displayKey === 'address') {
        addressParts.push(value.trim())
      } else if (displayKey === 'city') {
        city = value.trim()
      } else if (displayKey === 'region') {
        region = value.trim()
      } else if (displayKey === 'postalCode') {
        postalCode = value.trim()
      } else if (displayKey === 'country') {
        country = value.trim()
      }
    }
  }

  const address = addressParts.join(', ') || undefined

  const social: Record<string, string> = {}
  for (const [osmKey, socialKey] of Object.entries(SOCIAL_TAGS)) {
    const value = tags[osmKey]
    if (value && value.trim()) {
      let url = value.trim()
      if (!/^https?:\/\//i.test(url)) {
        url = `https://${url}`
      }
      social[socialKey] = url
    }
  }

  const websiteStatus: 'confirmed' | 'unknown' | 'not_found_after_research' =
    rawWebsite ? 'confirmed' : 'unknown'

  const osmType = element.type as 'node' | 'way' | 'relation'
  const osmId = String(element.id)

  return {
    id: `osm-${osmType}-${osmId}`,
    source: 'OPENSTREETMAP',
    osmType,
    osmId,
    name: name || 'Unnamed Business',
    category,
    address,
    city,
    region,
    postalCode,
    country,
    latitude: element.lat,
    longitude: element.lon,
    phone,
    email,
    website,
    facebook: social.facebook,
    instagram: social.instagram,
    whatsapp: social.whatsapp,
    youtube: social.youtube,
    linkedin: social.linkedin,
    openingHours: tags['opening_hours'],
    operator: tags['operator'],
    websiteStatus,
    verificationStatus: 'unverified',
    rawSource: tags,
  }
}

function buildBoundingBox(
  latitude: number,
  longitude: number,
  radiusMiles: number,
): { south: number; west: number; north: number; east: number } {
  // Approximate conversion: 1 degree latitude ≈ 69 miles
  // 1 degree longitude ≈ 69 * cos(latitude) miles
  const earthRadiusMiles = 3958.8
  const radiusRad = radiusMiles / earthRadiusMiles

  const latRad = (latitude * Math.PI) / 180
  const north = latitude + (radiusRad * 180) / Math.PI
  const south = latitude - (radiusRad * 180) / Math.PI
  const east = longitude + (radiusRad * 180) / (Math.PI * Math.cos(latRad))
  const west = longitude - (radiusRad * 180) / (Math.PI * Math.cos(latRad))

  return { south, west, north, east }
}

export interface DiscoverBusinessesOptions {
  niche: string
  latitude: number
  longitude: number
  radiusMiles: number
  limit?: number
  /**
   * Test/operator override. Allows injecting a custom list of Overpass
   * mirrors (e.g. a loopback URL in tests). Defaults to the public mirrors.
   * Not part of the public API surface — callers should not rely on it.
   */
  __endpoints?: string[]
}

/**
 * Runs one mirror's request loop (with retries) and resolves with its
 * Overpass payload, or rejects with the last error it saw.
 *
 * A mirror that is cancelled because ANOTHER mirror already won the race
 * must NOT be recorded as a failure: it did not misbehave, it simply lost.
 * `raceSignal` distinguishes the two cases.
 */
async function attemptMirror(
  endpoint: string,
  query: string,
  raceSignal: AbortSignal,
  deadline: StageDeadline,
): Promise<OverpassResult> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (deadline.expired()) break

    const budgetLeft = deadline.remaining()
    if (budgetLeft <= 0) break

    try {
      const response = await fetchWithTimeout(
        endpoint,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': USER_AGENT,
          },
          body: `data=${encodeURIComponent(query)}`,
        },
        Math.min(PER_REQUEST_TIMEOUT_MS, budgetLeft),
        raceSignal,
      )

      if (!response.ok) {
        throw new Error(`Overpass HTTP ${response.status}`)
      }

      const result = (await response.json()) as OverpassResult
      recordSuccess(endpoint)
      return result
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))

      // The race was decided elsewhere (or the stage budget is spent): this
      // mirror did not fail, it was cancelled. Do not poison the circuit
      // breaker with a loss.
      if (raceSignal.aborted || deadline.expired()) throw lastError

      recordFailure(endpoint)

      // Exponential backoff with jitter between retries on the SAME mirror,
      // never sleeping past the stage budget.
      if (attempt < MAX_RETRIES - 1) {
        const backoff = BACKOFF_BASE_MS * Math.pow(2, attempt) + Math.floor(Math.random() * 100)
        const sleepMs = Math.min(backoff, deadline.remaining())
        if (sleepMs > 0) await sleep(sleepMs)
      }
    }
  }

  throw lastError ?? new Error(`Overpass mirror failed: ${endpoint}`)
}

/**
 * Turns the rejection of `Promise.any` into an error that names what actually
 * went wrong.
 *
 * `Promise.any` rejects with an `AggregateError` whose message is the useless
 * "All promises were rejected". The individual mirror errors ("Overpass HTTP
 * 502", "fetch failed", …) are what the route and the logs need, so they are
 * flattened back into the message.
 */
function describeMirrorFailures(err: unknown): Error {
  if (err instanceof AggregateError && err.errors.length > 0) {
    const messages = err.errors
      .map((e) => (e instanceof Error ? e.message : String(e)))
      .filter(Boolean)
    if (messages.length > 0) return new Error(messages.join('; '))
  }
  return err instanceof Error ? err : new Error(String(err))
}

export async function discoverBusinesses(options: DiscoverBusinessesOptions): Promise<BusinessDiscoveryRecord[]> {
  const { niche, latitude, longitude, radiusMiles, limit = 30, __endpoints } = options

  const mapping = getNicheMapping(niche)
  if (!mapping) {
    throw new Error(`Unsupported niche: "${niche}". Supported niches: ${getSupportedNiches().join(', ')}`)
  }

  const bbox = buildBoundingBox(latitude, longitude, radiusMiles)
  const query = buildOverpassQuery({
    south: bbox.south,
    west: bbox.west,
    north: bbox.north,
    east: bbox.east,
    tags: mapping.tags,
    limit: Math.min(limit * 3, RESULT_LIMIT),
  })

  const allEndpoints = __endpoints ?? DEFAULT_ENDPOINTS
  // Mirrors whose circuit breaker is open are skipped entirely.
  const endpoints = allEndpoints.filter((endpoint) => !isOpen(endpoint))

  if (endpoints.length === 0) {
    // Every mirror is in cooldown — fail fast instead of waiting on a stage
    // that cannot produce anything.
    throw new AllOverpassProvidersFailed(
      'All Overpass providers failed: every mirror is temporarily disabled',
    )
  }

  const deadline = createStageDeadline('overpass', STAGE_DEADLINE_MS)
  // Aborted as soon as one mirror wins, so the losing mirrors stop burning
  // upstream capacity and sockets.
  const raceController = new AbortController()

  const attempts = endpoints.map((endpoint) =>
    attemptMirror(endpoint, query, raceController.signal, deadline).then((result) => {
      raceController.abort()
      return result
    }),
  )

  let result: OverpassResult | null = null
  let lastError: Error | null = null

  try {
    // `Promise.any` resolves with the FIRST mirror that succeeds — the stage
    // costs the slowest successful mirror, never the sum of all of them.
    result = await withDeadline(Promise.any(attempts), deadline)
  } catch (err) {
    lastError = describeMirrorFailures(err)
  } finally {
    raceController.abort()
  }

  if (!result || !result.elements) {
    throw new AllOverpassProvidersFailed(
      lastError
        ? `All Overpass providers failed: ${lastError.message}`
        : 'All Overpass providers failed',
    )
  }

  // Filter closed businesses and normalize
  const records: BusinessDiscoveryRecord[] = []
  const seen = new Set<string>()

  for (const element of result.elements) {
    if (isClosed(element.tags)) continue

    const record = normalizeElement(element, mapping.label)

    // Deduplicate by normalized name + approximate location
    const dedupeKey = `${record.name.toLowerCase()}-${record.city || ''}-${record.region || ''}`.trim()
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)

    records.push(record)

    if (records.length >= limit) break
  }

  return records
}