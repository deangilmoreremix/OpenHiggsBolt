/**
 * Niche-to-OSM tag mappings.
 *
 * Each user-facing niche maps to one or more OSM tag tuples.
 * These tuples are used to build Overpass QL queries.
 *
 * Mappings are aligned with the SmartVideo niche taxonomy from nicheClassifier.ts.
 * Only supported niches should be exposed to the client.
 */

export interface NicheMapping {
  label: string
  tags: Array<[string, string]>
}

export const NICHE_MAPPINGS: Record<string, NicheMapping> = {
  'ecommerce': {
    label: 'E-Commerce / Retail',
    tags: [
      ['shop', 'yes'],
      ['shop', 'clothes'],
      ['shop', 'fashion'],
      ['shop', 'electronics'],
      ['shop', 'jewelry'],
      ['shop', 'shoes'],
      ['shop', 'supermarket'],
      ['office', 'company'],
    ],
  },
  'real-estate': {
    label: 'Real Estate',
    tags: [
      ['office', 'estate_agent'],
      ['shop', 'real_estate'],
      ['office', 'insurance'],
    ],
  },
  'restaurants-food': {
    label: 'Restaurants / Food',
    tags: [
      ['amenity', 'restaurant'],
      ['amenity', 'cafe'],
      ['amenity', 'fast_food'],
      ['amenity', 'bar'],
      ['shop', 'bakery'],
      ['amenity', 'ice_cream'],
    ],
  },
  'beauty': {
    label: 'Beauty / Salon',
    tags: [
      ['shop', 'beauty'],
      ['shop', 'hairdresser'],
      ['shop', 'cosmetics'],
      ['amenity', 'spa'],
      ['shop', 'perfumery'],
    ],
  },
  'wellness-fitness': {
    label: 'Wellness / Fitness',
    tags: [
      ['amenity', 'gym'],
      ['amenity', 'fitness_centre'],
      ['leisure', 'fitness_centre'],
      ['amenity', 'spa'],
      ['leisure', 'swimming_pool'],
      ['shop', 'nutrition_supplements'],
    ],
  },
  'education': {
    label: 'Education',
    tags: [
      ['amenity', 'school'],
      ['amenity', 'university'],
      ['amenity', 'college'],
      ['amenity', 'language_school'],
      ['office', 'educational_institution'],
      ['amenity', 'library'],
    ],
  },
  'technology': {
    label: 'Technology / SaaS',
    tags: [
      ['office', 'company'],
      ['office', 'coworking'],
      ['shop', 'electronics'],
      ['shop', 'computer'],
      ['amenity', 'internet_cafe'],
    ],
  },
  'finance': {
    label: 'Finance',
    tags: [
      ['amenity', 'bank'],
      ['amenity', 'atm'],
      ['office', 'financial'],
      ['office', 'insurance'],
      ['office', 'accountant'],
    ],
  },
  'entertainment-media': {
    label: 'Entertainment / Media',
    tags: [
      ['amenity', 'cinema'],
      ['leisure', 'bowling_alley'],
      ['leisure', 'amusement_arcade'],
      ['amenity', 'nightclub'],
      ['amenity', 'bar'],
      ['leisure', 'sports_centre'],
    ],
  },
  'automotive': {
    label: 'Automotive',
    tags: [
      ['shop', 'car'],
      ['shop', 'car_repair'],
      ['amenity', 'car_wash'],
      ['amenity', 'fuel'],
      ['shop', 'motorcycle'],
      ['shop', 'tyres'],
    ],
  },
  'travel-hospitality': {
    label: 'Travel / Hospitality',
    tags: [
      ['tourism', 'hotel'],
      ['tourism', 'motel'],
      ['tourism', 'hostel'],
      ['tourism', 'guest_house'],
      ['tourism', 'camp_site'],
      ['tourism', 'caravan_site'],
    ],
  },
  'sports-outdoors': {
    label: 'Sports / Outdoors',
    tags: [
      ['leisure', 'sports_centre'],
      ['leisure', 'fitness_centre'],
      ['leisure', 'swimming_pool'],
      ['leisure', 'pitch'],
      ['leisure', 'track'],
      ['shop', 'sports'],
      ['shop', 'bicycle'],
    ],
  },
  'general-business': {
    label: 'General Business',
    tags: [
      ['office', 'company'],
      ['shop', 'yes'],
      ['amenity', 'cafe'],
      ['amenity', 'restaurant'],
    ],
  },
}

export function getSupportedNiches(): string[] {
  return Object.keys(NICHE_MAPPINGS)
}

export function getNicheMapping(niche: string): NicheMapping | undefined {
  const key = Object.keys(NICHE_MAPPINGS).find(
    (k) => k.toLowerCase() === niche.toLowerCase()
  )
  return key ? NICHE_MAPPINGS[key] : undefined
}

export function normalizeNiche(niche: string): string | null {
  const mapping = getNicheMapping(niche)
  return mapping ? mapping.label : null
}
