/**
 * Discovery orchestrator that chooses between Firecrawl and static providers,
 * then runs the shared normalize/filter/classify pipeline.
 */

import type { ImageCandidate, DiscoveryResult, SocialProfileSource } from './discoveryProvider'
import { FirecrawlDiscoveryProvider } from './firecrawlDiscovery'
import { StaticDiscoveryProvider } from './staticDiscovery'
import { sanitizeUrl, classifyImage, heuristicFallback } from './discoverAssets'
import { getBusinessAssetClassificationModel } from './discoveryClassificationConfig'
import { autoPlaceAssets, DEFAULT_AUTO_PLACEMENT_CONFIG } from './autoPlacementEngine'
import type { DiscoveredAsset, DiscoveredAssetCategory } from '../shared/personalization/types'

export interface OrchestratedDiscoveryOptions {
  websiteUrl: string
  maxPages: number
  maxImages: number
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
  socialProfiles: SocialProfileSource[]
  discoveredAssets: DiscoveredAsset[]
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
  const discoveredAssets = await buildDiscoveredAssetsFromCandidates(result?.candidates || [], maxImages, openAiKey, openAiModel)

  return {
    providerUsed,
    providerAttempted,
    candidates: result?.candidates || [],
    pagesCrawled: result?.pagesCrawled || 0,
    rawCandidates: result?.rawCandidates || 0,
    duration,
    socialProfiles: result?.socialProfiles || [],
    discoveredAssets,
  }
}

export async function buildDiscoveredAssetsFromCandidates(
  candidates: ImageCandidate[],
  maxImages: number,
  openAiKey?: string,
  openAiModel?: string,
): Promise<DiscoveredAsset[]> {
  const model = openAiModel || getBusinessAssetClassificationModel()
  const discoveredAssets: DiscoveredAsset[] = []
  const seenUrls = new Set<string>()

  for (const candidate of candidates) {
    if (discoveredAssets.length >= maxImages) break
    if (seenUrls.has(candidate.url)) continue
    seenUrls.add(candidate.url)

    let classification: { category: DiscoveredAssetCategory; confidence: number; recommended: boolean } | null = null
    try {
      const classificationResult = await classifyImage(candidate.url, openAiKey, model)
      classification = classificationResult
    } catch {
      classification = null
    }

    if (!classification) {
      classification = heuristicFallback(candidate.url)
    }

    discoveredAssets.push({
      id: `disc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      sourceUrl: candidate.url,
      previewUrl: candidate.url,
      sourceType: candidate.sourceType || 'WEBSITE',
      socialProfileUrl: candidate.socialProfileUrl,
      category: classification!.category,
      confidence: classification!.confidence,
      qualityScore: classification!.confidence,
      relevanceScore: classification!.confidence,
      selected: classification!.recommended,
      recommended: classification!.recommended,
      rejected: false,
      assignedSection: null,
      autoAssigned: false,
    })
  }

  return autoPlaceAssets(discoveredAssets, DEFAULT_AUTO_PLACEMENT_CONFIG)
}
