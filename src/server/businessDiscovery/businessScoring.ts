/**
 * Business scoring utilities for OpenStreetMap business discovery.
 */

import type { BusinessDiscoveryRecord } from './types'

export function computeLeadScore(business: BusinessDiscoveryRecord): number {
  let score = 0

  // Core contactability
  if (business.phone) score += 25
  if (business.email) score += 15
  if (business.website) score += 20

  // Physical presence
  if (business.address) score += 10
  if (business.latitude != null && business.longitude != null) score += 10

  // Social proof
  if (business.facebook) score += 5
  if (business.instagram) score += 5
  if (business.linkedin) score += 5

  // Operational signals
  if (business.openingHours) score += 5
  if (business.operator) score += 3

  // Cap at 100
  return Math.min(score, 100)
}

export function computeActivityScore(business: BusinessDiscoveryRecord): number {
  let score = 0

  if (business.phone) score += 20
  if (business.website) score += 20
  if (business.openingHours) score += 15
  if (business.facebook || business.instagram) score += 15
  if (business.address) score += 10
  if (business.latitude != null && business.longitude != null) score += 10
  if (business.email) score += 10

  return Math.min(score, 100)
}

export function scoreAndSort(businesses: BusinessDiscoveryRecord[]): BusinessDiscoveryRecord[] {
  return businesses
    .map((b) => ({
      ...b,
      leadScore: computeLeadScore(b),
      activityScore: computeActivityScore(b),
    }))
    .sort((a, b) => (b.leadScore || 0) - (a.leadScore || 0))
}
