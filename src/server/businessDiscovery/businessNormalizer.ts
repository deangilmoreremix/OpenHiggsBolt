/**
 * Business normalizer - standardizes OSM data into BusinessDiscoveryRecord.
 */

import type { BusinessDiscoveryRecord } from './types'

export function deduplicateBusinesses(
  businesses: BusinessDiscoveryRecord[],
): BusinessDiscoveryRecord[] {
  const seen = new Map<string, BusinessDiscoveryRecord>()

  for (const business of businesses) {
    // Create deduplication key from normalized name, city, and region
    const normalizedName = business.name.toLowerCase().trim()
    const city = (business.city || '').toLowerCase().trim()
    const region = (business.region || '').toLowerCase().trim()

    const key = `${normalizedName}|${city}|${region}`

    const existing = seen.get(key)
    if (!existing) {
      seen.set(key, business)
      continue
    }

    // If we have a better record (more fields filled), replace
    const existingScore = scoreRecord(existing)
    const newScore = scoreRecord(business)
    if (newScore > existingScore) {
      seen.set(key, business)
    }
  }

  return Array.from(seen.values())
}

function scoreRecord(record: BusinessDiscoveryRecord): number {
  let score = 0
  if (record.name) score += 10
  if (record.address) score += 5
  if (record.phone) score += 5
  if (record.website) score += 5
  if (record.email) score += 3
  if (record.latitude != null && record.longitude != null) score += 5
  if (record.openingHours) score += 2
  if (record.facebook) score += 1
  if (record.instagram) score += 1
  return score
}

export function filterClosedBusinesses(
  businesses: BusinessDiscoveryRecord[],
): BusinessDiscoveryRecord[] {
  return businesses.filter((b) => b.websiteStatus !== 'not_found_after_research')
}

export function enrichBusinessRecord(
  record: BusinessDiscoveryRecord,
): BusinessDiscoveryRecord {
  // Calculate a simple activity score based on available data
  let activityScore = 0
  if (record.phone) activityScore += 20
  if (record.website) activityScore += 20
  if (record.email) activityScore += 10
  if (record.openingHours) activityScore += 15
  if (record.facebook || record.instagram) activityScore += 15
  if (record.address) activityScore += 10
  if (record.latitude != null && record.longitude != null) activityScore += 10

  // Cap at 100
  activityScore = Math.min(activityScore, 100)

  // Calculate lead score
  let leadScore = activityScore
  if (record.website) leadScore += 10
  if (record.phone && record.website) leadScore += 10

  leadScore = Math.min(leadScore, 100)

  return {
    ...record,
    activityScore,
    leadScore,
  }
}
