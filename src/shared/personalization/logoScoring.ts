/**
 * Picks the best logo among discovered logo candidates, using only signals that
 * are really on the asset record: its URL/file name, transparency flag, format
 * and the discovery's own scores. Nothing is fetched here and nothing is
 * guessed from pixels. Pure, so the provider and tests share one ranking.
 */
import type { DiscoveredAsset } from './types'

export interface LogoSignals {
  sourceUrl: string
  previewUrl?: string
  hasTransparency?: boolean
  recommended?: boolean
  relevanceScore?: number
  qualityScore?: number
  confidence?: number
}

const POSITIVE_NAME = /(^|[\W_])(logo|brandmark|wordmark|logotype)([\W_]|$)/i
const NEGATIVE_NAME = /(favicon|sprite|icon-?\d|apple-touch|banner|hero|header-bg|background|slide|thumb|avatar|placeholder|loading|pixel|1x1)/i

function pathOf(url: string): string {
  try {
    return new URL(url, 'https://placeholder.invalid').pathname.toLowerCase()
  } catch {
    return url.toLowerCase()
  }
}

/** Higher is better. Comparable only between candidates of the same business. */
export function scoreLogoCandidate(asset: LogoSignals): number {
  const path = pathOf(asset.sourceUrl)
  let score = 0
  if (asset.recommended) score += 30
  score += (asset.relevanceScore ?? 0) + (asset.qualityScore ?? 0) + (asset.confidence ?? 0)
  if (POSITIVE_NAME.test(path)) score += 25
  if (NEGATIVE_NAME.test(path)) score -= 35
  if (asset.hasTransparency) score += 20
  // Vector/PNG/WebP logos are the right formats; a JPEG logo has a solid box around it.
  if (/\.svg($|\?)/.test(path)) score += 15
  else if (/\.(png|webp)($|\?)/.test(path)) score += 6
  else if (/\.jpe?g($|\?)/.test(path)) score -= 8
  return score
}

export function pickBestLogo<T extends DiscoveredAsset>(candidates: readonly T[]): T | null {
  let best: T | null = null
  let bestScore = -Infinity
  for (const candidate of candidates) {
    const score = scoreLogoCandidate(candidate)
    if (score > bestScore) {
      best = candidate
      bestScore = score
    }
  }
  return best
}
