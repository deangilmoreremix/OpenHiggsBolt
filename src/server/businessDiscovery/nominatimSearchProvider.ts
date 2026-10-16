/**
 * Nominatim search provider — free business-LIST fallback that does NOT depend
 * on Overpass.
 *
 * Why this exists
 * ---------------
 * Lead Finder's primary business-list source is the Overpass API. All three
 * public Overpass mirrors returned HTTP 502 for an extended period, which made
 * the whole free Lead Finder unusable even though the Nominatim geocoder (a
 * separate OSM query path) stayed healthy.
 *
 * Nominatim's `/search` endpoint returns named POIs — with `extratags=1` it
 * carries the same contact/branding fields the Overpass path extracts
 * (website, phone, email, opening_hours, social links, address parts). Querying
 * it is therefore a legitimate, free, permitted fallback that keeps working when
 * every Overpass mirror is down.
 *
 * Design constraints (Lead Finder free path)
 * ------------------------------------------
 *  - No paid APIs, no customer API keys, no AI credits.
 *  - Nominatim's usage policy allows at most ~1 request/second, so every request
 *    is serialized through a module-level throttle (`MIN_REQUEST_INTERVAL_MS`)
 *    and the number of Nominatim calls per business search is capped
 *    (`MAX_QUERIES_PER_SEARCH`) to bound both latency and public quota use.
 *  - A per-endpoint circuit breaker opens for COOLDOWN_MS after
 *    FAILS_BEFORE_COOLDOWN consecutive failures so a degradation of this
 *    provider short-circuits instead of adding latency to every search.
 *  - SSRF / private-address protections are inherited from the URL builder
 *    (we only ever build absolute https URLs to the fixed Nominatim host) and
 *    from `assertUrlSafe` on the business website when the record is later
 *    researched — no raw user-supplied URL is fetched here.
 *  - Results are NEVER fabricated: a record is only emitted when Nominatim
 *    returns a real named POI. When nothing is found the provider returns an
 *    empty array and the route reports an honest empty result.
 *  - Nominatim only indexes OSM data, so coverage is sparser than Overpass. The
 *    route tries Overpass first and only uses this as a fallback; the provider
 *    documents its own sparseness rather than inflating counts.
 */

import type { BusinessDiscoveryRecord } from './types'
import { getNicheMapping, getSupportedNiches } from './nicheMappings'

const NOMINATIM_SEARCH_BASE_URL = 'https://nominatim.openstreetmap.org'
const USER_AGENT = 'SmartVideoGO-AI/1.0 (https://go.smartvid.app)'

/** Per-request timeout for a single Nominatim search call. */
const PER_REQUEST_TIMEOUT_MS = 12_000

/**
 * Nominatim's public instance is limited to ~1 request/second. Every call is
 * serialized through this interval so a burst of searches cannot exceed it.
 */
const MIN_REQUEST_INTERVAL_MS = 1_100

/** Cap on Nominatim calls issued for a single business search. */
const MAX_QUERIES_PER_SEARCH = 3

/** Results requested per Nominatim call. */
const RESULT_LIMIT_PER_QUERY = 20

/** Per-endpoint circuit breaker thresholds for this provider. */
const FAILS_BEFORE_COOLDOWN = 2
const COOLDOWN_MS = 60_000

/** OSM lifecycle tags that mark a POI as not operational. */
const CLOSED_LIFECYCLE_TAGS = [
  'abandoned', 'disused', 'demolished', 'razed', 'removed',
  'closed', 'vacant', 'proposed', 'planned', 'construction',
]

const NAME_TAGS = ['name', 'name:en']
const PHONE_TAGS = ['phone', 'contact:phone', 'contact:mobile', 'mobile']
const EMAIL_TAGS = ['email', 'contact:email']
const WEBSITE_TAGS = ['website', 'contact:website', 'url', 'contact:url']

/**
 * OSM tag value -> natural-language search keyword.
 *
 * Nominatim's free-form query understands everyday words well ("hotel",
 * "bakery", "salon") but poorly understands OSM tag vocabulary ("estate_agent",
 * "fast_food"). This alias table converts the niche's tag values into the words
 * a customer would actually search for. Aliases are deliberately conservative:
 * each entry is the plain-language name of exactly the mapped OSM value.
 */
const TAG_VALUE_ALIASES: Record<string, string> = {
  // ecommerce / retail
  clothes: 'clothing store',
  fashion: 'fashion store',
  electronics: 'electronics store',
  jewelry: 'jewelry store',
  shoes: 'shoe store',
  supermarket: 'supermarket',
  department_store: 'department store',
  convenience: 'convenience store',
  furniture: 'furniture store',
  // real estate / finance
  estate_agent: 'real estate',
  real_estate: 'real estate',
  insurance: 'insurance agency',
  bank: 'bank',
  accountant: 'accounting firm',
  lawyer: 'law firm',
  // food
  restaurant: 'restaurant',
  cafe: 'coffee shop',
  fast_food: 'fast food',
  bar: 'bar',
  bakery: 'bakery',
  ice_cream: 'ice cream shop',
  // beauty
  beauty: 'beauty salon',
  hairdresser: 'hair salon',
  cosmetics: 'cosmetics shop',
  perfumery: 'perfume shop',
  spa: 'spa',
  // wellness / fitness
  fitness_centre: 'gym',
  fitness_station: 'gym',
  sports_centre: 'sports center',
  dentist: 'dentist',
  doctors: 'doctor clinic',
  physiotherapist: 'physiotherapy clinic',
  veterinary: 'veterinary clinic',
  pharmacy: 'pharmacy',
  optician: 'optometrist',
  // services
  car_repair: 'auto repair',
  plumber: 'plumbing company',
  electrician: 'electrician',
  hvac: 'hvac contractor',
  roofing_contractor: 'roofing company',
  painter: 'painting company',
  landscaper: 'landscaping company',
  // hospitality / travel
  hotel: 'hotel',
  guest_house: 'guest house',
  travel_agency: 'travel agency',
  // creative / media
  photographer: 'photography studio',
  advertising_agency: 'advertising agency',
  it_consultant: 'it consulting firm',
  // home services
  funeral_directors: 'funeral home',
  laundry: 'laundry service',
  beauty_supply: 'beauty supply store',
  // trades
  carpenter: 'carpentry company',
  glaziery: 'glass company',
  locksmith: 'locksmith',
}

interface NominatimSearchResult {
  place_id?: number
  osm_type?: 'node' | 'way' | 'relation'
  osm_id?: number
  lat?: string
  lon?: string
  name?: string
  display_name?: string
  type?: string
  class?: string
  extratags?: Record<string, string>
  address?: Record<string, string>
}

// ── Circuit breaker (provider-scoped, module-internal) ───────────────────────

interface ProviderCircuit {
  consecutiveFailures: number
  openUntil: number
}

const circuitState: ProviderCircuit = { consecutiveFailures: 0, openUntil: 0 }

function isOpen(): boolean {
  if (circuitState.openUntil === 0) return false
  if (Date.now() >= circuitState.openUntil) {
    // Half-open: reset and allow a probe.
    circuitState.openUntil = 0
    circuitState.consecutiveFailures = 0
    return false
  }
  return true
}

function recordSuccess(): void {
  circuitState.consecutiveFailures = 0
  circuitState.openUntil = 0
}

function recordFailure(): void {
  circuitState.consecutiveFailures += 1
  if (circuitState.consecutiveFailures >= FAILS_BEFORE_COOLDOWN) {
    circuitState.openUntil = Date.now() + COOLDOWN_MS
  }
}

/**
 * Test-only helper. Resets the provider circuit breaker and the request
 * throttle so a fresh test starts from a clean state. Not part of the public
 * API surface.
 */
export function __resetNominatimSearchCircuitForTests(): void {
  circuitState.consecutiveFailures = 0
  circuitState.openUntil = 0
  lastRequestStartedAt = 0
}

/**
 * Test-only helper. Returns a snapshot of the provider circuit state.
 * Not part of the public API surface.
 */
export function __nominatimSearchCircuitStateForTests(): {
  consecutiveFailures: number
  openUntil: number
} {
  return { ...circuitState }
}

/**
 * Serializes Nominatim calls so the public instance's ~1 req/s policy is
 * respected even under concurrent searches. Module-level on purpose: the
 * throttle must be shared by every caller in the process.
 */
let requestChain: Promise<unknown> = Promise.resolve()
let lastRequestStartedAt = 0

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function enqueue<T>(work: () => Promise<T>): Promise<T> {
  const run = requestChain.then(async () => {
    const wait = MIN_REQUEST_INTERVAL_MS - (Date.now() - lastRequestStartedAt)
    if (wait > 0) await sleep(wait)
    lastRequestStartedAt = Date.now()
    return work()
  })
  // Keep the chain alive regardless of this request's outcome.
  requestChain = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), PER_REQUEST_TIMEOUT_MS)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Marker error thrown when this provider cannot produce results. Carries a
 * public-safe message so the route can surface actionable copy without leaking
 * provider internals.
 */
export class NominatimSearchUnavailable extends Error {
  readonly userMessage =
    'Local business search is temporarily busy. Please try again in a moment or enter a business website manually to continue.'
  constructor(message: string) {
    super(message)
    this.name = 'NominatimSearchUnavailable'
  }
}

function isClosed(tags: Record<string, string> | undefined): boolean {
  if (!tags) return false
  for (const tag of CLOSED_LIFECYCLE_TAGS) {
    const value = tags[tag]
    if (value === 'yes' || value === '1' || value === 'true') return true
  }
  return false
}

function extractFirst(tags: Record<string, string> | undefined, keys: string[]): string | undefined {
  if (!tags) return undefined
  for (const key of keys) {
    const value = tags[key]
    if (value && value.trim()) return value.trim()
  }
  return undefined
}

/** Normalizes an OSM tag value into a natural-language keyword. */
function normalizeTagValue(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .trim()
    .toLowerCase()
}

/**
 * Derives the ordered, de-duplicated list of search keywords for a niche.
 *
 * Primary source: the niche's own OSM tag values pushed through
 * `TAG_VALUE_ALIASES` (falling back to the normalized tag value when no alias
 * exists). This keeps the fallback aligned with exactly the businesses the
 * Overpass query would have matched, rather than inventing categories.
 */
export function buildNicheSearchTerms(niche: string): string[] {
  const mapping = getNicheMapping(niche)
  if (!mapping) return []

  const terms: string[] = []
  const seen = new Set<string>()

  for (const [, value] of mapping.tags) {
    const normalized = normalizeTagValue(value)
    if (!normalized) continue
    const keyword = TAG_VALUE_ALIASES[value] || TAG_VALUE_ALIASES[normalized.replace(/ /g, '_')] || normalized
    if (!keyword || seen.has(keyword)) continue
    seen.add(keyword)
    terms.push(keyword)
  }

  // Last resort: a word from the human label so a niche with unusual tags still
  // yields something searchable.
  if (terms.length === 0 && mapping.label) {
    const fallback = mapping.label.split('/')[0].trim().toLowerCase()
    if (fallback && !seen.has(fallback)) terms.push(fallback)
  }

  return terms
}

function normalizeResult(
  result: NominatimSearchResult,
  category: string,
  index: number,
): BusinessDiscoveryRecord | null {
  const tags = result.extratags || {}
  if (isClosed(tags)) return null

  const name = extractFirst(tags, NAME_TAGS) || (result.name && result.name.trim()) || undefined
  // Never fabricate a business: a POI without a usable name is not a lead.
  if (!name) return null

  const phone = extractFirst(tags, PHONE_TAGS)
  const email = extractFirst(tags, EMAIL_TAGS)
  const rawWebsite = extractFirst(tags, WEBSITE_TAGS)

  let website: string | undefined
  if (rawWebsite) {
    website = rawWebsite
    if (!/^https?:\/\//i.test(website)) website = `https://${website}`
  }

  const address = result.address || {}
  const street = address.road || address.pedestrian || address.footway
  const houseNumber = address.house_number
  const city = address.city || address.town || address.village || address.suburb || address.municipality
  const region = address.state || address.province || address.county
  const postalCode = address.postcode
  const country = address.country

  const addressParts: string[] = []
  if (houseNumber && street) addressParts.push(`${houseNumber} ${street}`)
  else if (street) addressParts.push(street)
  const addressString = addressParts.length > 0 ? addressParts.join(', ') : undefined

  const social: Record<string, string> = {}
  for (const [key, url] of Object.entries(tags)) {
    if (!url || typeof url !== 'string') continue
    if (!/^(facebook|instagram|whatsapp|youtube|linkedin)(:.*)?$/.test(key)) continue
    const socialKey = key.split(':')[0]
    if (!social[socialKey]) {
      social[socialKey] = /^https?:\/\//i.test(url) ? url : `https://${url}`
    }
  }

  const latitude = result.lat != null ? parseFloat(result.lat) : undefined
  const longitude = result.lon != null ? parseFloat(result.lon) : undefined

  const osmType = result.osm_type
  const osmId = result.osm_id != null ? String(result.osm_id) : undefined

  return {
    id: osmType && osmId ? `osm-${osmType}-${osmId}` : `nominatim-search-${osmId || result.place_id || index}`,
    // Nominatim serves the same OpenStreetMap dataset as Overpass, so the
    // provenance stays OPENSTREETMAP; the route reports which provider produced
    // the result so the fallback is traceable in logs/UI.
    source: 'OPENSTREETMAP',
    osmType,
    osmId,
    name,
    category,
    address: addressString,
    city,
    region,
    postalCode,
    country,
    latitude: Number.isNaN(latitude as number) ? undefined : latitude,
    longitude: Number.isNaN(longitude as number) ? undefined : longitude,
    phone,
    email,
    website,
    facebook: social.facebook,
    instagram: social.instagram,
    whatsapp: social.whatsapp,
    youtube: social.youtube,
    linkedin: social.linkedin,
    openingHours: tags.opening_hours,
    operator: tags.operator,
    websiteStatus: rawWebsite ? 'confirmed' : 'unknown',
    verificationStatus: 'unverified',
    rawSource: { ...tags, _nominatimType: result.type, _nominatimClass: result.class },
  }
}

/** Great-circle distance in miles between two coordinates. */
function distanceMiles(
  lat1: number, lon1: number, lat2: number, lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const earthRadiusMiles = 3958.8
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * earthRadiusMiles * Math.asin(Math.min(1, Math.sqrt(a)))
}

export interface NominatimSearchOptions {
  niche: string
  latitude: number
  longitude: number
  radiusMiles: number
  location: string
  limit?: number
  /**
   * Test-only override for the Nominatim base URL (e.g. a loopback server).
   * Not part of the public API surface — callers should not rely on it.
   */
  __baseUrl?: string
}

/**
 * Searches Nominatim for named businesses matching a niche near a location.
 *
 * Returns an empty array when Nominatim has nothing (honest empty result — no
 * fabrication). Throws `NominatimSearchUnavailable` only when the provider
 * itself could not be reached or returned a non-OK response, so the route can
 * distinguish "nothing found" from "provider down".
 */
export async function searchBusinessesViaNominatim(
  options: NominatimSearchOptions,
): Promise<BusinessDiscoveryRecord[]> {
  const { niche, latitude, longitude, radiusMiles, location, limit = 30, __baseUrl } = options

  const mapping = getNicheMapping(niche)
  if (!mapping) {
    throw new Error(`Unsupported niche: "${niche}". Supported niches: ${getSupportedNiches().join(', ')}`)
  }

  const terms = buildNicheSearchTerms(niche)
  if (terms.length === 0) return []

  const baseUrl = __baseUrl || NOMINATIM_SEARCH_BASE_URL
  const trimmedLocation = location.trim()

  const records: BusinessDiscoveryRecord[] = []
  const seen = new Set<string>()
  let queriesIssued = 0
  let providerError: Error | null = null

  for (const term of terms) {
    if (records.length >= limit) break
    if (queriesIssued >= MAX_QUERIES_PER_SEARCH) break
    if (isOpen()) {
      providerError = providerError || new NominatimSearchUnavailable('Nominatim search circuit is open')
      continue
    }

    // Two phrasings: Nominatim's recall differs substantially between
    // "<term>, <location>" (good for generic nouns) and "<term> in <location>".
    const phrasings = trimmedLocation
      ? [`${term}, ${trimmedLocation}`, `${term} in ${trimmedLocation}`]
      : [term]

    let gotResultsForTerm = false

    for (const query of phrasings) {
      if (records.length >= limit) break
      if (queriesIssued >= MAX_QUERIES_PER_SEARCH) break
      if (isOpen()) continue

      queriesIssued += 1
      try {
        const url = new URL('/search', baseUrl)
        url.searchParams.set('q', query)
        url.searchParams.set('format', 'jsonv2')
        url.searchParams.set('limit', String(RESULT_LIMIT_PER_QUERY))
        url.searchParams.set('addressdetails', '1')
        // extratags carries website/phone/email/opening_hours/social links.
        url.searchParams.set('extratags', '1')

        const response = await enqueue(() =>
          fetchWithTimeout(url.toString(), {
            headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
          }),
        )

        if (!response.ok) {
          throw new Error(`Nominatim search HTTP ${response.status}`)
        }

        const data: NominatimSearchResult[] = await response.json()
        recordSuccess()

        for (const result of Array.isArray(data) ? data : []) {
          const record = normalizeResult(result, mapping.label, records.length + 1)
          if (!record) continue

          const key = `${record.name.toLowerCase()}|${(record.city || '').toLowerCase()}`
          if (seen.has(key)) continue

          // Keep the search geographically honest. Nominatim scopes by the
          // location phrase but returns globally important matches, so filter
          // by real distance when the POI has coordinates. POIs without
          // coordinates cannot be distance-checked and are kept (Nominatim
          // already scoped them by the location phrase).
          if (
            record.latitude != null &&
            record.longitude != null &&
            Number.isFinite(latitude) &&
            Number.isFinite(longitude)
          ) {
            const within = distanceMiles(latitude, longitude, record.latitude, record.longitude)
            // Slack because the location phrase resolves to a metro area while
            // the customer's radius may target a single neighborhood.
            if (within > Math.max(radiusMiles * 2, 10)) continue
          }

          seen.add(key)
          records.push(record)
          if (records.length >= limit) break
        }

        if (records.length > 0) gotResultsForTerm = true
      } catch (err) {
        recordFailure()
        providerError = err instanceof Error ? err : new Error(String(err))
      }
    }

    // Second phrasing only helps when the first found nothing; when we already
    // have results for this term, move on to the next keyword to spend the
    // query budget on coverage instead of precision.
    if (gotResultsForTerm) continue
  }

  if (records.length === 0 && providerError) {
    throw providerError instanceof NominatimSearchUnavailable
      ? providerError
      : new NominatimSearchUnavailable(`Nominatim search failed: ${providerError.message}`)
  }

  return records
}
