// Platform specs for campaign assets. Copy caps, tone and image hints match Open-Pomelli's platforms.ts.

export type StudioPlatform = {
  id: string
  label: string
  aspect: string
  width: number
  height: number
  copy: { headlineMaxWords: number; bodyMaxWords: number; ctaMaxWords: number; tone: string; imageHint: string }
}

export const STUDIO_PLATFORMS: StudioPlatform[] = [
  { id: 'instagram-feed', label: 'Instagram — Feed (1:1)', aspect: '1:1', width: 1080, height: 1080,
    copy: { headlineMaxWords: 8, bodyMaxWords: 25, ctaMaxWords: 3, tone: 'casual, scroll-stopping, lower-case', imageHint: 'Bold focal subject, mobile-thumb readable, generous safe area for text, social-feed scroll-stopping.' } },
  { id: 'instagram-story', label: 'Instagram — Story (9:16)', aspect: '9:16', width: 1080, height: 1920,
    copy: { headlineMaxWords: 6, bodyMaxWords: 0, ctaMaxWords: 3, tone: 'punchy, single-line hook', imageHint: 'Vertical composition, primary subject upper-third, bottom 20% reserved for app UI, vivid lighting.' } },
  { id: 'linkedin', label: 'LinkedIn — Feed (1:1)', aspect: '1:1', width: 1200, height: 1200,
    copy: { headlineMaxWords: 10, bodyMaxWords: 35, ctaMaxWords: 3, tone: 'professional, declarative, no hashtags in copy', imageHint: 'Editorial, polished, subtle gradient or clean photography, professional palette emphasis.' } },
  { id: 'facebook', label: 'Facebook — Feed Ad (1:1)', aspect: '1:1', width: 1200, height: 1200,
    copy: { headlineMaxWords: 7, bodyMaxWords: 25, ctaMaxWords: 3, tone: 'benefit-led, conversational, direct', imageHint: 'Single clear value prop visual, high-contrast subject, minimal text-in-image (Meta ad guideline).' } },
  { id: 'twitter', label: 'X / Twitter — Post (16:9)', aspect: '16:9', width: 1200, height: 675,
    copy: { headlineMaxWords: 6, bodyMaxWords: 30, ctaMaxWords: 3, tone: 'sharp, opinionated, one-liner energy', imageHint: 'Wide cinematic crop, single focal element, readable on mobile timeline at small size.' } },
  { id: 'web-banner', label: 'Web — Hero Banner (16:9)', aspect: '16:9', width: 1920, height: 1080,
    copy: { headlineMaxWords: 6, bodyMaxWords: 20, ctaMaxWords: 3, tone: 'confident, brand-led, marketing-site voice', imageHint: 'Cinematic hero composition, breathing room for overlaid headline, palette-led background.' } },
  { id: 'email', label: 'Email — Header (16:9)', aspect: '16:9', width: 1200, height: 675,
    copy: { headlineMaxWords: 7, bodyMaxWords: 20, ctaMaxWords: 3, tone: 'warm, direct, like a subject line', imageHint: 'Clean horizontal banner, subject framed left or right with negative space for headline overlay.' } },
  { id: 'youtube', label: 'YouTube — Thumbnail (16:9)', aspect: '16:9', width: 1280, height: 720,
    copy: { headlineMaxWords: 5, bodyMaxWords: 0, ctaMaxWords: 0, tone: 'ultra-bold curiosity hook, all-caps energy', imageHint: 'High-contrast face or single object, oversized bold text overlay (3-5 words), saturated palette, click-worthy.' } },
]

const ALIASES: Record<string, string> = { banner: 'web-banner', web_banner: 'web-banner', 'youtube-thumb': 'youtube', youtube_thumb: 'youtube', 'email-banner': 'email', x: 'twitter' }
const family = (id: string) => id.split('-')[0]
const norm = (v: unknown) => String(v || '').trim().toLowerCase().replace(/_/g, '-')

export function findPlatform(id: string): StudioPlatform {
  return STUDIO_PLATFORMS.find((p) => p.id === id) ?? STUDIO_PLATFORMS[0]
}

/** True when a concept's `recommended_platforms` names this platform (by id, family or alias). */
export function isRecommendedPlatform(platform: StudioPlatform, recommended: string[] | undefined): boolean {
  const wanted = new Set((recommended || []).map((r) => ALIASES[norm(r)] || ALIASES[String(r).trim().toLowerCase()] || norm(r)))
  return wanted.has(platform.id) || wanted.has(family(platform.id))
}
