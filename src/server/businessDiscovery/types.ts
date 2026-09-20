/**
 * Shared types for the OpenStreetMap business discovery domain.
 */

export type OsmElementType = 'node' | 'way' | 'relation'

export type WebsiteStatus =
  | 'confirmed'
  | 'unknown'
  | 'not_found_after_research'

export type VerificationStatus =
  | 'unverified'
  | 'researching'
  | 'verified'

export interface BusinessDiscoveryRecord {
  id: string
  source: 'OPENSTREETMAP'
  osmType?: OsmElementType
  osmId?: string

  name: string
  category: string

  address?: string
  city?: string
  region?: string
  postalCode?: string
  country?: string

  latitude?: number
  longitude?: number

  phone?: string
  email?: string

  website?: string

  facebook?: string
  instagram?: string
  whatsapp?: string
  youtube?: string
  linkedin?: string

  openingHours?: string
  operator?: string

  activityScore?: number
  leadScore?: number

  websiteStatus: WebsiteStatus
  verificationStatus: VerificationStatus

  rawSource?: Record<string, unknown>
}

export interface GeocodeResult {
  latitude: number
  longitude: number
  displayName: string
  boundingBox?: [number, number, number, number]
}

export interface BusinessSearchRequest {
  niche: string
  location: string
  radiusMiles: number
  limit?: number
}

export interface BusinessSearchResponse {
  ok: boolean
  query: {
    niche: string
    location: string
    radiusMiles: number
  }
  count: number
  businesses: BusinessDiscoveryRecord[]
  providerUsed: string
  durationMs: number
  cached?: boolean
}

export interface OverpassQueryOptions {
  south: number
  west: number
  north: number
  east: number
  tags: Array<[string, string]>
  limit?: number
}
