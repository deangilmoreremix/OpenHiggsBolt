/**
 * Centralized Personalization asset discovery policy.
 *
 * This is the single source of truth for:
 * - allowed asset categories
 * - asset role mapping
 * - prohibited auto-placement
 * - crawl limits
 * - result limits
 */

import type { DiscoveredAssetCategory } from '../shared/personalization/types'

export const USEFUL_CATEGORIES: DiscoveredAssetCategory[] = [
  'person',
  'logo',
  'product',
  'service',
  'completed_work',
  'storefront',
  'office',
  'branded_vehicle',
  'team',
  'brand',
]

export const ASSET_ROLE_MAP: Record<DiscoveredAssetCategory, string> = {
  person: 'presenter_identity',
  logo: 'logo',
  product: 'product_reference',
  service: 'product_reference',
  completed_work: 'product_reference',
  storefront: 'brand_reference',
  office: 'brand_reference',
  branded_vehicle: 'brand_reference',
  team: 'brand_reference',
  brand: 'brand_reference',
  irrelevant: 'irrelevant',
}

export const PROHIBITED_AUTO_PLACEMENT = [
  'first_frame',
  'last_frame',
  'cta_graphic',
  'audio_reference',
  'saved_reference',
] as const

export const PERSONALIZATION_ASSET_ROLES = [
  'presenter_identity',
  'logo',
  'product_reference',
  'brand_reference',
] as const

export const MAX_REVIEW_ASSETS = 25
export const MAX_RAW_CANDIDATES = 75
export const MAX_PAGES = 8
export const MAX_DEPTH = 1
export const MAX_FIRE_CRAWL_PAGES = 5

export const RESULTS_LIMITS = {
  logo: 3,
  presenter: 5,
  products: 10,
  brandReferences: 8,
} as const

export const FREE_DISCOVERY_MIN_USEFUL = 4

export function isUsefulCategory(category: DiscoveredAssetCategory | undefined): boolean {
  if (!category) return false
  return USEFUL_CATEGORIES.includes(category)
}
