/**
 * Business discovery domain index.
 *
 * Exports the public API for OpenStreetMap-based local business discovery.
 */

export {
  geocodeLocation,
} from './nominatimProvider'

export {
  discoverBusinesses,
} from './overpassProvider'

export {
  deduplicateBusinesses,
  filterClosedBusinesses,
  enrichBusinessRecord,
} from './businessNormalizer'

export {
  computeLeadScore,
  computeActivityScore,
  scoreAndSort,
} from './businessScoring'

export {
  businessDiscoveryCache,
  createCacheKey,
  type CacheEntry,
} from './businessCache'

export {
  researchBusiness,
  enrichClientProfileFromResearch,
} from './researchProvider'

export {
  NICHE_MAPPINGS,
  getSupportedNiches,
  getNicheMapping,
  normalizeNiche,
  type NicheMapping,
} from './nicheMappings'

export type {
  BusinessDiscoveryRecord,
  GeocodeResult,
  BusinessSearchRequest,
  BusinessSearchResponse,
  OverpassQueryOptions,
  OsmElementType,
  WebsiteStatus,
  VerificationStatus,
} from './types'
