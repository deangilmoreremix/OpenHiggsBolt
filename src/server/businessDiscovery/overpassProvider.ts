/**
 * Overpass API provider for OpenStreetMap business discovery.
 *
 * Queries Overpass to find businesses matching specific tags within a
 * geographic bounding box derived from a center point + radius.
 */

import type { BusinessDiscoveryRecord, OverpassQueryOptions } from './types'
import { getNicheMapping, getSupportedNiches } from './nicheMappings'

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://z.overpass-api.de/api/interpreter',
]

const USER_AGENT = 'SmartVideoGO-AI/1.0 (https://go.smartvid.app)'
const REQUEST_TIMEOUT = 30_000
const MAX_RETRIES = 2
const RESULT_LIMIT = 50

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = REQUEST_TIMEOUT): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
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

function buildOverpassQuery(options: OverpassQueryOptions): string {
  const { south, west, north, east, tags, limit = RESULT_LIMIT } = options

  // Group tags by key so we can use a single regex filter per key.
  // Overpass chained filters are AND, but we need OR for alternative values.
  const grouped = new Map<string, string[]>()
  for (const [k, v] of tags) {
    const arr = grouped.get(k) || []
    arr.push(v)
    grouped.set(k, arr)
  }

  const tagFilters = Array.from(grouped.entries())
    .map(([k, values]) => {
      const unique = Array.from(new Set(values))
      if (unique.length === 1) {
        return `["${k}"="${unique[0]}"]`
      }
      const escaped = unique.map((v) => v.replace(/"/g, '\\"'))
      return `["${k}"~"^(${escaped.join('|')})$"]`
    })
    .join('')

  const bbox = `(${south},${west},${north},${east})`

  // Query for nodes, ways, and relations.
  const nodeQuery = `node${tagFilters}${bbox};`
  const wayQuery = `way${tagFilters}${bbox};(._;>;);`
  const relationQuery = `relation${tagFilters}${bbox};`

  return `[out:json][timeout:25];(${nodeQuery}${wayQuery}${relationQuery});out body ${limit};`
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

export async function discoverBusinesses(options: {
  niche: string
  latitude: number
  longitude: number
  radiusMiles: number
  limit?: number
}): Promise<BusinessDiscoveryRecord[]> {
  const { niche, latitude, longitude, radiusMiles, limit = 30 } = options

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

  let lastError: Error | null = null
  let result: OverpassResult | null = null

  for (const endpoint of OVERPASS_ENDPOINTS) {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetchWithTimeout(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': USER_AGENT,
          },
          body: `data=${encodeURIComponent(query)}`,
          signal: AbortSignal.timeout(REQUEST_TIMEOUT),
        })

        if (!response.ok) {
          throw new Error(`Overpass HTTP ${response.status}`)
        }

        result = (await response.json()) as OverpassResult
        lastError = null
        break
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
        // Wait briefly before retrying the same endpoint
        if (attempt < MAX_RETRIES - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500))
        }
      }
    }

    if (result) break
  }

  if (!result || !result.elements) {
    throw new Error(
      lastError
        ? `All Overpass providers failed: ${lastError.message}`
        : 'No results from Overpass'
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
