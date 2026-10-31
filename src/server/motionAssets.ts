/**
 * The business asset finder, for films: the site's own pictures (people, team, products, services,
 * storefront) found by crawling its pages, labelled, downloaded and ready to be stored next to the
 * screenshots. Remote pictures cannot be drawn by the browser exporter (no CORS), so they are copied.
 */
import { discoverBusinessAssets, downloadImage, type DiscoveredAsset, type DiscoveredAssetCategory } from './discoverAssets'

export interface MotionAsset {
  body: Buffer
  contentType: string
  category: DiscoveredAssetCategory
  alt: string
  source: string
}

/** What a film wants most first: faces, then what the business sells and where it works. */
export const CATEGORY_PRIORITY: readonly DiscoveredAssetCategory[] = ['person', 'team', 'product', 'service', 'completed_work', 'storefront', 'office', 'branded_vehicle', 'brand']

/** Every usable picture, best first (people, then what the business sells…), never the same file twice. `max` / `perCategory` only if a caller wants a limit. Pure. */
export function pickMotionAssets(found: readonly DiscoveredAsset[], max = Infinity, perCategory = Infinity): DiscoveredAsset[] {
  const usable = found.filter((a) => !a.rejected && a.category !== 'irrelevant' && a.category !== 'logo' && !a.isSiteLogo)
  const out: DiscoveredAsset[] = []
  const count = new Map<string, number>()
  const rank = (a: DiscoveredAsset) => {
    const i = CATEGORY_PRIORITY.indexOf(a.category)
    return (i < 0 ? CATEGORY_PRIORITY.length : i) * 1000 - (a.qualityScore ?? a.confidence ?? 0)
  }
  for (const a of [...usable].sort((x, y) => rank(x) - rank(y))) {
    if (out.length >= max) break
    if ((count.get(a.category) ?? 0) >= perCategory) continue
    if (out.some((o) => o.sourceUrl === a.sourceUrl)) continue
    count.set(a.category, (count.get(a.category) ?? 0) + 1)
    out.push(a)
  }
  return out
}

/** Crawl, label, download. Never throws: no pictures is a normal answer. */
export async function findMotionAssets(websiteUrl: string, opts: { budgetMs?: number; max?: number } = {}): Promise<MotionAsset[]> {
  const deadlineAt = Date.now() + (opts.budgetMs ?? 200_000)
  try {
    const found = await discoverBusinessAssets({ websiteUrl, maxPages: 40, maxImages: 200, thorough: true, deadlineAt: deadlineAt - 20_000 })
    const picked = pickMotionAssets(found, opts.max ?? Infinity)
    const downloaded = await Promise.all(
      picked.map(async (a) => {
        const file = await downloadImage(a.sourceUrl, deadlineAt)
        return file ? ({ ...file, category: a.category, alt: (a.altText ?? '').replace(/\s+/g, ' ').trim().slice(0, 120), source: a.sourceUrl } satisfies MotionAsset) : null
      }),
    )
    return downloaded.filter((x): x is MotionAsset => x !== null)
  } catch (error) {
    console.warn('[motion-studio/assets] discovery failed', error instanceof Error ? error.message.split('\n')[0] : error)
    return []
  }
}
