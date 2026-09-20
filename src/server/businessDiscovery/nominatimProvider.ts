/**
 * Nominatim geocoding provider for OpenStreetMap.
 *
 * Geocodes location strings into latitude/longitude coordinates.
 * Uses the public Nominatim API with proper rate limiting and user-agent.
 */

import type { GeocodeResult } from './types'

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org'
const USER_AGENT = 'SmartVideoGO-AI/1.0 (https://go.smartvid.app)'
const REQUEST_TIMEOUT = 15_000

interface NominatimResponse {
  lat: string
  lon: string
  display_name: string
  boundingbox?: [string, string, string, string]
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = REQUEST_TIMEOUT): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

export async function geocodeLocation(location: string): Promise<GeocodeResult> {
  const trimmed = location.trim()
  if (!trimmed) {
    throw new Error('Location is required')
  }

  const url = new URL('/search', NOMINATIM_BASE_URL)
  url.searchParams.set('q', trimmed)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '1')
  url.searchParams.set('addressdetails', '1')

  const response = await fetchWithTimeout(url.toString(), {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Nominatim geocoding failed: HTTP ${response.status}`)
  }

  const data: NominatimResponse[] = await response.json()

  if (!data || data.length === 0) {
    throw new Error(`Location not found: "${trimmed}"`)
  }

  const result = data[0]
  const latitude = parseFloat(result.lat)
  const longitude = parseFloat(result.lon)

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    throw new Error('Invalid coordinates returned from geocoding')
  }

  return {
    latitude,
    longitude,
    displayName: result.display_name,
    boundingBox: result.boundingbox?.map(Number) as [number, number, number, number] | undefined,
  }
}
