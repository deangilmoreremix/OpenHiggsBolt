import type { ImageCandidate, DiscoveryResult, SocialProfileSource } from './discoveryProvider'
// Static discovery is too slow for Netlify sync path; use sitemap + background browser instead.
// import { StaticDiscoveryProvider } from './staticDiscovery'
import { sanitizeUrl, classifyImage, heuristicFallback } from './discoverAssets'
import { getBusinessAssetClassificationModel } from './discoveryClassificationConfig'
import { autoPlaceAssets, DEFAULT_AUTO_PLACEMENT_CONFIG } from './autoPlacementEngine'
import { discoverSitemapUrls } from './sitemapDiscovery'
import type { DiscoveredAsset, DiscoveredAssetCategory } from '../shared/personalization/types'
import {
  USEFUL_CATEGORIES,
  isUsefulCategory,
  FREE_DISCOVERY_MIN_USEFUL,
} from './discoveryPolicy'

export interface OrchestratedDiscoveryResult {
  providerUsed: string
  providerAttempted: string
  candidates: ImageCandidate[]
  pagesCrawled: number
  rawCandidates: number
  duration: number
  socialProfiles: SocialProfileSource[]
  discoveredAssets: DiscoveredAsset[]
  firecrawlUsed: boolean
  providerAttempts: string[]
  firecrawlReason?: string
  firecrawlSkippedReason?: string
  localUsefulAssetCount?: number
  firecrawlUsefulAssetCount?: number
  sitemapFound?: boolean
  crawleePagesCrawled?: number
}

export interface FastDiscoveryResult {
  result: OrchestratedDiscoveryResult
  fastAssets: DiscoveredAsset[]
  usefulAssetCount: number
  providerAttempts: string[]
  needsBrowser: boolean
}

function hasEnoughUsefulAssets(assets: DiscoveredAsset[]): boolean {
  const usefulCount = assets.filter((asset) => isUsefulCategory(asset.category)).length
  return usefulCount >= FREE_DISCOVERY_MIN_USEFUL
}

export async function runFastDiscovery(options: {
  websiteUrl: string
  maxPages: number
  maxImages: number
  openAiKey?: string
  openAiModel?: string
}): Promise<FastDiscoveryResult> {
  const { websiteUrl, maxPages, maxImages, openAiKey, openAiModel } = options
  const baseUrl = sanitizeUrl(websiteUrl)
  const startTime = Date.now()
  const providerAttempts: string[] = []
  let result: DiscoveryResult | null = null
  let discoveredAssets: DiscoveredAsset[] = []
  let crawleePagesCrawled = 0
  let sitemapFound = false

  providerAttempts.push('SMARTVIDEO_STATIC')
  // Static discovery is bypassed here because it is too slow for the
  // Netlify synchronous path. The background function handles the expensive
  // browser enrichment instead.

  if ((result as any) && (result as any).candidates.length) {
    discoveredAssets = await buildDiscoveredAssetsFromCandidates((result as any).candidates, maxImages)
  }

  const staticSufficient = hasEnoughUsefulAssets(discoveredAssets)

  const sitemapCandidates: string[] = []
  if (!staticSufficient) {
    try {
      sitemapCandidates.push(...(await discoverSitemapUrls(baseUrl)))
      sitemapFound = sitemapCandidates.length > 0
    } catch (err) {
      console.error('[discovery] Sitemap discovery failed:', err instanceof Error ? err.message : err)
    }
  }

  const usefulAssetCount = discoveredAssets.filter((asset) => isUsefulCategory(asset.category)).length
  const needsBrowser = !hasEnoughUsefulAssets(discoveredAssets)

  const finalResult: OrchestratedDiscoveryResult = {
    // @ts-ignore
    providerUsed: result?.provider || providerAttempts[providerAttempts.length - 1] || 'NONE',
    providerAttempted: providerAttempts[providerAttempts.length - 1] || 'NONE',
    // @ts-ignore
    candidates: result?.candidates || [],
    // @ts-ignore
    pagesCrawled: result?.pagesCrawled || 0,
    // @ts-ignore
    rawCandidates: result?.rawCandidates || 0,
    duration: Date.now() - startTime,
    // @ts-ignore
    socialProfiles: result?.socialProfiles || [],
    discoveredAssets,
    firecrawlUsed: false,
    providerAttempts,
    sitemapFound,
    crawleePagesCrawled,
  }

  return {
    result: finalResult,
    fastAssets: discoveredAssets,
    usefulAssetCount,
    providerAttempts,
    needsBrowser,
  }
}

export async function buildDiscoveredAssetsFromCandidates(
  candidates: ImageCandidate[],
  maxImages: number,
): Promise<DiscoveredAsset[]> {
  const discoveredAssets: DiscoveredAsset[] = []
  const seenUrls = new Set<string>()

  for (const candidate of candidates.slice(0, maxImages)) {
    if (discoveredAssets.length >= maxImages) break

    const normalizedUrl = candidate.url.trim()
    if (!normalizedUrl || seenUrls.has(normalizedUrl)) continue
    seenUrls.add(normalizedUrl)

    let classification: { category: DiscoveredAssetCategory; confidence: number; recommended: boolean } | null = null
    try {
      classification = heuristicFallback(normalizedUrl)
    } catch {
      classification = null
    }

    if (!classification) {
      classification = heuristicFallback(normalizedUrl)
    }

    if (!classification.recommended && !isUsefulCategory(classification.category)) {
      continue
    }

    discoveredAssets.push({
      id: `disc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      sourceUrl: normalizedUrl,
      previewUrl: normalizedUrl,
      sourceType: candidate.sourceType || 'WEBSITE',
      socialProfileUrl: candidate.socialProfileUrl,
      category: classification.category,
      confidence: classification.confidence,
      qualityScore: classification.confidence,
      relevanceScore: classification.confidence,
      selected: classification.recommended,
      recommended: classification.recommended,
      rejected: false,
      assignedSection: null,
      autoAssigned: false,
    })
  }

  return autoPlaceAssets(discoveredAssets, DEFAULT_AUTO_PLACEMENT_CONFIG)
}
