/**
 * Discovery orchestrator that chooses between Firecrawl and static providers,
 * then runs the shared normalize/filter/classify pipeline.
 */

import type { ImageCandidate, DiscoveryResult } from './discoveryProvider'
import { FirecrawlDiscoveryProvider } from './firecrawlDiscovery'
import { StaticDiscoveryProvider } from './staticDiscovery'
import { sanitizeUrl } from './discoverAssets'

export interface OrchestratedDiscoveryOptions {
  websiteUrl: string
  maxPages: number
  maxImages: number
  maxImageBytes: number
  openAiKey?: string
  openAiModel?: string
  firecrawlApiKey?: string
}

export interface OrchestratedDiscoveryResult {
  providerUsed: string
  providerAttempted: string
  candidates: ImageCandidate[]
  pagesCrawled: number
  rawCandidates: number
  duration: number
}

export async function orchestrateDiscovery(options: OrchestratedDiscoveryOptions): Promise<OrchestratedDiscoveryResult> {
  const {
    websiteUrl,
    maxPages,
    maxImages,
    openAiKey,
    openAiModel,
    firecrawlApiKey,
  } = options

  const baseUrl = sanitizeUrl(websiteUrl)
  const startTime = Date.now()
  const providerAttempted = firecrawlApiKey ? 'FIRECRAWL' : 'STATIC_FALLBACK'
  let providerUsed = providerAttempted
  let result: DiscoveryResult | null = null

  if (firecrawlApiKey) {
    try {
      const firecrawl = new FirecrawlDiscoveryProvider(firecrawlApiKey)
      result = await firecrawl.discover({
        websiteUrl: baseUrl,
        maxPages,
        maxImages,
      })
    } catch (err) {
      console.error('[discovery] Firecrawl failed:', err instanceof Error ? err.message : err)
      providerUsed = 'STATIC_FALLBACK'
    }
  }

  if (!result || result.candidates.length === 0) {
    const staticProvider = new StaticDiscoveryProvider()
    result = await staticProvider.discover({
      websiteUrl: baseUrl,
      maxPages,
      maxImages,
      openAiKey,
      openAiModel,
    })
  }

  const duration = Date.now() - startTime

  return {
    providerUsed,
    providerAttempted,
    candidates: result?.candidates || [],
    pagesCrawled: result?.pagesCrawled || 0,
    rawCandidates: result?.rawCandidates || 0,
    duration,
  }
}
