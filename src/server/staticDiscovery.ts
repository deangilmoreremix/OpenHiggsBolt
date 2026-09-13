/**
 * Static discovery provider that reuses the existing axios + JSDOM crawler.
 *
 * This remains the fallback when Firecrawl is unavailable or returns
 * insufficient results.
 */

import type { ImageCandidate, DiscoveryResult } from './discoveryProvider'
import { discoverBusinessAssets, sanitizeUrl } from './discoverAssets'

export class StaticDiscoveryProvider {
  readonly name = 'STATIC_FALLBACK'

  async discover(options: {
    websiteUrl: string
    maxPages: number
    maxImages: number
    openAiKey?: string
    openAiModel?: string
  }): Promise<DiscoveryResult> {
    const { websiteUrl, maxPages, maxImages, openAiKey, openAiModel } = options
    const baseUrl = sanitizeUrl(websiteUrl)

    const results = await discoverBusinessAssets({
      websiteUrl: baseUrl,
      maxPages,
      maxImages,
      openAiKey,
      openAiModel,
      enableBrowserFallback: false,
    })

    const candidates: ImageCandidate[] = results.map((asset) => ({
      url: asset.sourceUrl,
      sourcePage: asset.sourceUrl,
      altText: undefined,
      ogContext: undefined,
    }))

    return {
      candidates,
      provider: this.name,
      pagesCrawled: Math.min(maxPages, 8),
      rawCandidates: candidates.length,
    }
  }
}
