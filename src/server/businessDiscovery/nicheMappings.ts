/**
 * Niche-to-OSM tag mappings.
 *
 * Each user-facing niche maps to one or more OSM tag tuples.
 * These tuples are used to build Overpass QL queries.
 *
 * Only supported niches should be exposed to the client.
 */

export interface NicheMapping {
  label: string
  tags: Array<[string, string]>
}

export const NICHE_MAPPINGS: Record<string, NicheMapping> = {
  'Roofing Contractor': {
    label: 'Roofing Contractor',
    tags: [['craft', 'roofer']],
  },
  'Restaurant': {
    label: 'Restaurant',
    tags: [
      ['amenity', 'restaurant'],
      ['amenity', 'cafe'],
      ['amenity', 'fast_food'],
      ['amenity', 'bar'],
      ['shop', 'bakery'],
    ],
  },
  'Real Estate': {
    label: 'Real Estate',
    tags: [
      ['office', 'estate_agent'],
      ['shop', 'real_estate'],
    ],
  },
  'Automotive': {
    label: 'Automotive',
    tags: [
      ['shop', 'car'],
      ['shop', 'car_repair'],
      ['amenity', 'car_wash'],
      ['amenity', 'fuel'],
      ['shop', 'motorcycle'],
    ],
  },
  'Beauty / Salon': {
    label: 'Beauty / Salon',
    tags: [
      ['shop', 'beauty'],
      ['shop', 'hairdresser'],
      ['shop', 'cosmetics'],
      ['amenity', 'spa'],
    ],
  },
  'Fitness / Gym': {
    label: 'Fitness / Gym',
    tags: [
      ['amenity', 'gym'],
      ['amenity', 'fitness_centre'],
    ],
  },
  'Healthcare': {
    label: 'Healthcare',
    tags: [
      ['amenity', 'clinic'],
      ['amenity', 'doctors'],
      ['amenity', 'dentist'],
      ['amenity', 'hospital'],
      ['amenity', 'pharmacy'],
    ],
  },
  'Education': {
    label: 'Education',
    tags: [
      ['amenity', 'school'],
      ['amenity', 'university'],
      ['amenity', 'college'],
      ['office', 'educational_institution'],
    ],
  },
  'Technology / SaaS': {
    label: 'Technology / SaaS',
    tags: [
      ['office', 'company'],
      ['office', 'coworking'],
    ],
  },
  'Finance': {
    label: 'Finance',
    tags: [
      ['amenity', 'bank'],
      ['office', 'financial'],
      ['office', 'insurance'],
    ],
  },
  'Travel / Hotel': {
    label: 'Travel / Hotel',
    tags: [
      ['tourism', 'hotel'],
      ['tourism', 'motel'],
      ['tourism', 'hostel'],
      ['tourism', 'guest_house'],
    ],
  },
  'Legal': {
    label: 'Legal',
    tags: [
      ['office', 'lawyer'],
    ],
  },
  'Construction': {
    label: 'Construction',
    tags: [
      ['craft', 'builder'],
      ['craft', 'plumber'],
      ['craft', 'electrician'],
      ['craft', 'painter'],
      ['craft', 'carpenter'],
      ['craft', 'roofer'],
      ['craft', 'hvac'],
      ['craft', 'metal_construction'],
      ['craft', 'welder'],
      ['craft', 'insulation'],
      ['craft', 'cleaner'],
      ['craft', 'pest_control'],
    ],
  },
  'General Business': {
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
