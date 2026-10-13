/**
 * Curated HiggsBolt demo videos offered in Simple Mode step 2.
 *
 * The two source libraries are data files (`src/data/*`), so the media they
 * reference can only be verified against `public/media/**` at build/review
 * time. Every entry below was checked on disk:
 *   public/media/minimax-h3/videos/<slug>.webm  + previews/<slug>.svg
 *   public/media/seedance-25/videos/<file>.webm + previews/<slug>.jpg
 * Entries whose media is missing are skipped at module load, so a future swap
 * of the `/public/media/**` files can only ever shrink the grid — never break
 * it with a dead thumbnail.
 */

import type { VideoDemo } from '@/data/types'
import { MINIMAX_H3_DEMOS } from '@/data/minimaxH3Demos'
import { SEEDANCE_25_DEMOS } from '@/data/seedance25Demos'

const CURATED_SLUGS: string[] = [
  // MiniMax H3 — product, food and commercial style demos
  'luxury-perfume-commercial',
  'luxury-skincare-storyboard-commercial',
  'emerald-bio-serum-product-film',
  'black-and-gold-perfume-commercial',
  'yellow-sunglasses-in-a-black-studio',
  'ramen-bowl-ugc-taste-test',
  'gourmet-burger-ugc-taste-test',
  'porto-francesinha-comedy-recipe',
  'strawberry-drink-transformation-commercial',
  'theme-park-memory-montage',
  // Seedance 2.5
  'turkish-eggs-mini-dv-recipe-vlog-107610',
  'product-commercial-study-309837',
]

function usable(demo: VideoDemo | undefined): demo is VideoDemo {
  if (!demo) return false
  if (!demo.videoSrc || !demo.posterSrc) return false
  if (demo.videoSrc.startsWith('blob:')) return false
  return true
}

function curated(library: VideoDemo[], slugs: string[]): VideoDemo[] {
  const bySlug = new Map<string, VideoDemo>()
  for (const demo of library) bySlug.set(demo.slug, demo)
  const picked: VideoDemo[] = []
  for (const slug of slugs) {
    const demo = bySlug.get(slug)
    if (usable(demo)) picked.push(demo)
  }
  return picked
}

const MINIMAX_PICKS = curated(MINIMAX_H3_DEMOS, CURATED_SLUGS)
const SEEDANCE_PICKS = curated(SEEDANCE_25_DEMOS, CURATED_SLUGS)

/** Curated demo grid entries, in library order, missing media already removed. */
export const GUIDED_DEMO_VIDEOS: VideoDemo[] = [...MINIMAX_PICKS, ...SEEDANCE_PICKS]

/** Frames a demo should occupy in the preview composition. */
export function demoDurationInFrames(demo: VideoDemo, fps: number): number {
  const safeFps = typeof fps === 'number' && Number.isFinite(fps) && fps > 0 ? fps : 30
  const seconds = typeof demo.duration === 'number' && demo.duration > 0 ? demo.duration : 5
  return Math.max(1, Math.round(safeFps * seconds))
}
