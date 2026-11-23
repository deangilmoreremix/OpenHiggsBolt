export const DURATION_RANGE = { min: 3, max: 12, default: 5 } as const
export const RESOLUTIONS = ['480p', '720p', '1080p'] as const

/** Default motion prompt per source type (Open-Pomelli's DEFAULT_PROMPTS). */
export const SOURCE_PROMPTS = {
  asset: 'Subtle hero motion: slow camera push-in toward the focal subject, gentle parallax on background elements, ambient light shifts. Brand-consistent mood. Preserve typography and composition.',
  photoshoot: 'Slow rotational camera move around the product, soft light play across the surface, premium reveal feel. Preserve product geometry, color and shadows.',
  image: 'Cinematic motion that suits the image. Subtle camera move, gentle ambient motion in environmental elements. Preserve subject geometry.',
} as const
export type SourceType = keyof typeof SOURCE_PROMPTS
