/**
 * Business scoring utilities for OpenStreetMap business discovery (Phase 3).
 *
 * Three independent signals:
 *  1. contactability — how reachable the business is (ex-computeLeadScore).
 *  2. activity       — how active/present the business is online.
 *  3. videoOpportunity — how strong the video-marketing opportunity is.
 *
 * The final `leadScore` is a weighted composite of the three, adjusted by the
 * ownership verdict, so a highly contactable big-box chain can never outrank
 * a reachable independent business just because it has more phone numbers.
 */

import type { BusinessDiscoveryRecord, OwnershipType } from './types'
import { classifyOwnership } from './ownershipClassification'

export function computeContactabilityScore(business: BusinessDiscoveryRecord): number {
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

// Backwards-compatible alias: computeLeadScore was renamed to
// computeContactabilityScore (same weights, contactability-only).
export const computeLeadScore = computeContactabilityScore

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

export interface VideoOpportunityResearch {
  /** Verified video presence, or 'unknown' when it could not be verified. */
  hasPromoVideo?: boolean | 'unknown'
  signals?: string[]
  reachable?: boolean
}

export interface VideoOpportunityOptions {
  research?: VideoOpportunityResearch
}

// Category suitability keywords for video marketing. A record's `category` is
// the niche label (e.g. "Restaurants / Food", "Auto Detailing").
const HIGH_SUITABILITY_KEYWORDS = [
  'restaurant', 'food', 'cafe', 'bar', 'bakery', 'ice cream',
  'beauty', 'salon', 'hair', 'cosmetic', 'perfumery', 'spa',
  'automotive', 'car', 'detailing', 'fuel', 'tyre',
  'wellness', 'fitness', 'gym', 'swimming',
  'travel', 'hotel', 'motel', 'hospitality', 'hostel', 'guest house', 'camp',
]
const MEDIUM_SUITABILITY_KEYWORDS = [
  'real estate', 'estate agent',
  'entertainment', 'media', 'cinema', 'nightclub', 'arcade', 'bowling',
  'healthcare', 'medical', 'health', 'clinic', 'doctor', 'dental', 'dentist', 'pharmacy',
]

function industrySuitability(category: string): { base: number; tier: string } {
  const normalized = (category || '').toLowerCase()
  if (HIGH_SUITABILITY_KEYWORDS.some((k) => normalized.includes(k))) {
    return { base: 30, tier: 'high' }
  }
  if (MEDIUM_SUITABILITY_KEYWORDS.some((k) => normalized.includes(k))) {
    return { base: 20, tier: 'medium' }
  }
  return { base: 15, tier: 'other' }
}

/**
 * Derive the research input for a record from its own videoMarketing evidence
 * (populated by researchProvider). `no_video_on_scanned_pages` is explicitly
 * NOT a claim that the business has no videos, so it maps to 'unknown'.
 */
function deriveResearchFromRecord(
  record: BusinessDiscoveryRecord,
): VideoOpportunityResearch {
  const vm = record.videoMarketing
  if (vm?.state === 'video_found') {
    return { hasPromoVideo: true, signals: vm.evidence, reachable: true }
  }
  return { hasPromoVideo: 'unknown' }
}

/**
 * Video-marketing opportunity score (0-100), deterministic and evidence-based.
 * A business with NO verifiable promo video has MORE opportunity (+25); one
 * that already markets with video is penalized (-20). Every contribution is
 * explained in the returned signals.
 */
export function computeVideoOpportunityScore(
  record: BusinessDiscoveryRecord,
  opts?: VideoOpportunityOptions,
): { score: number; signals: string[] } {
  const signals: string[] = []
  let score = 0

  const { base, tier } = industrySuitability(record.category)
  score += base
  signals.push(`industry suitability (${tier}): +${base}`)

  const research = opts?.research ?? deriveResearchFromRecord(record)
  if (research.hasPromoVideo === true) {
    score -= 20
    signals.push('already markets with a promo video: -20')
  } else if (research.hasPromoVideo === false) {
    score += 25
    signals.push('no promo video found: +25 opportunity')
  } else {
    signals.push('video_presence: unknown')
  }

  if (research.signals && research.signals.length > 0) {
    signals.push(...research.signals.map((s) => `research: ${s}`))
  }

  if (record.website) {
    score += 12
    signals.push('website present: +12')
  }
  if (record.facebook) {
    score += 8
    signals.push('facebook presence: +8')
  }
  if (record.instagram) {
    score += 8
    signals.push('instagram presence: +8')
  }
  if (record.youtube) {
    score += 5
    signals.push('youtube channel found: +5 (already producing video — collab angle)')
  }
  if (record.website && (!record.phone || !record.openingHours)) {
    score += 5
    signals.push('thin web presence (website but missing phone or hours): +5')
  }

  return { score: Math.max(0, Math.min(100, Math.round(score))), signals }
}

const OWNERSHIP_MULTIPLIER: Record<OwnershipType, number> = {
  independent: 1.15,
  local_multi_location: 1.0,
  franchise_chain: 0.9,
  unknown: 0.95,
  national_bigbox: 0.5,
}

export interface ScoreAndSortOptions {
  research?: VideoOpportunityResearch
}

/**
 * Compute all three scores and the composite leadScore:
 * round(contactability * 0.35 + activity * 0.2 + videoOpportunity * 0.45)
 * adjusted by the ownership multiplier, capped at 100. Sorts by leadScore desc.
 *
 * Ownership is read from the record when already classified (the route does
 * this batch-wide so multi-location evidence is visible), otherwise it is
 * classified per record here.
 */
export function scoreAndSort(
  businesses: BusinessDiscoveryRecord[],
  opts?: ScoreAndSortOptions,
): BusinessDiscoveryRecord[] {
  const allNamesInBatch = businesses.map((b) => b.name)
  return businesses
    .map((b) => {
      const ownership: OwnershipType =
        b.ownership ??
        classifyOwnership({
          name: b.name,
          operator: b.operator,
          brand: b.brand,
          allNamesInBatch,
        }).ownership

      const contactability = computeContactabilityScore(b)
      const activity = computeActivityScore(b)
      const research = opts?.research ?? deriveResearchFromRecord(b)
      const { score: videoOpportunity, signals } = computeVideoOpportunityScore(b, { research })

      const multiplier = OWNERSHIP_MULTIPLIER[ownership] ?? 0.95
      const composite = (contactability * 0.35 + activity * 0.2 + videoOpportunity * 0.45) * multiplier
      const leadScore = Math.max(0, Math.min(100, Math.round(composite)))

      const rationale = [...signals, `ownership ${ownership}: composite x${multiplier}`]

      return {
        ...b,
        ownership,
        contactabilityScore: contactability,
        activityScore: activity,
        videoOpportunityScore: videoOpportunity,
        videoOpportunity: {
          hasPromoVideo: research.hasPromoVideo ?? 'unknown',
          signals,
        },
        leadScore,
        scoreBreakdown: {
          contactability,
          activity,
          videoOpportunity,
          ownership,
          rationale,
        },
      }
    })
    .sort((a, b) => (b.leadScore || 0) - (a.leadScore || 0))
}
