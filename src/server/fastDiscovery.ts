import type { ImageCandidate, DiscoveryResult, SocialProfileSource } from './discoveryProvider'
import { StaticDiscoveryProvider } from './staticDiscovery'
import { sanitizeUrl, classifyImage, heuristicFallback } from './discoverAssets'
import { getBusinessAssetClassificationModel } from './discoveryClassificationConfig'
import { autoPlaceAssets, DEFAULT_AUTO_PLACEMENT_CONFIG } from './autoPlacementEngine'
import { discoverSitemapUrls } from './sitemapDiscovery'
import { discoverWithCrawlee } from './crawleeProvider'
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
  const providerErrors: Record<string, string> = {}
  let result: DiscoveryResult | null = null
  let discoveredAssets: DiscoveredAsset[] = []
  let crawleePagesCrawled = 0
  let sitemapFound = false

  // 1. Static discovery — always attempt first
  providerAttempts.push('SMARTVIDEO_STATIC')
  try {
    const staticProvider = new StaticDiscoveryProvider()
    const staticStart = Date.now()
    result = await staticProvider.discover({
      websiteUrl: baseUrl,
      maxPages,
      maxImages,
      openAiKey,
      openAiModel,
    })
    providerAttempts.push('SMARTVIDEO_STATIC_COMPLETED')
    if (result?.candidates?.length) {
      discoveredAssets = await buildDiscoveredAssetsFromCandidates(result.candidates, maxImages)
    }
  } catch (err) {
    providerAttempts.push('SMARTVIDEO_STATIC_FAILED')
    providerErrors['SMARTVIDEO_STATIC'] = err instanceof Error ? err.message : String(err)
    console.error('[discovery] Static failed:', providerErrors['SMARTVIDEO_STATIC'])
    result = null
  }

  const staticSufficient = hasEnoughUsefulAssets(discoveredAssets)

  // 2. Sitemap discovery — find high-value pages when static is insufficient
  const sitemapCandidates: string[] = []
  if (!staticSufficient) {
    try {
      sitemapCandidates.push(...(await discoverSitemapUrls(baseUrl)))
      sitemapFound = sitemapCandidates.length > 0
    } catch (err) {
      console.error('[discovery] Sitemap discovery failed:', err instanceof Error ? err.message : err)
    }
  }

  // 3. Crawlee CheerioCrawler — free HTTP multi-page discovery when static is insufficient
  // Crawlee runs regardless of sitemap results; sitemap only informs priority pages.
  if (!staticSufficient) {
    providerAttempts.push('CRAWLEE_CHEERIO')
    try {
      const crawleeResult = await discoverWithCrawlee(baseUrl)
      if (crawleeResult.candidates.length > 0) {
        const existingUrls = new Set(result?.candidates?.map((c) => c.url) || [])
        const newCandidates = crawleeResult.candidates.filter((c) => !existingUrls.has(c.url))

        if (result) {
          result = {
            ...result,
            candidates: [...result.candidates, ...newCandidates],
            rawCandidates: (result.rawCandidates || 0) + crawleeResult.rawCandidates,
            pagesCrawled: (result.pagesCrawled || 0) + crawleeResult.pagesCrawled,
            socialProfiles: [...(result.socialProfiles || []), ...(crawleeResult.socialProfiles || [])],
          }
        } else {
          result = {
            candidates: newCandidates,
            provider: 'CRAWLEE_CHEERIO',
            pagesCrawled: crawleeResult.pagesCrawled,
            rawCandidates: crawleeResult.rawCandidates,
            socialProfiles: crawleeResult.socialProfiles,
          }
        }

        const crawleeAssets = await buildDiscoveredAssetsFromCandidates(newCandidates, maxImages)
        discoveredAssets = [...discoveredAssets, ...crawleeAssets]
        crawleePagesCrawled = crawleeResult.pagesCrawled
        providerAttempts.push('CRAWLEE_CHEERIO_COMPLETED')
      } else {
        providerAttempts.push('CRAWLEE_CHEERIO_EMPTY')
      }
    } catch (err) {
      providerAttempts.push('CRAWLEE_CHEERIO_FAILED')
      providerErrors['CRAWLEE_CHEERIO'] = err instanceof Error ? err.message : String(err)
      console.error('[discovery] Crawlee fallback failed:', providerErrors['CRAWLEE_CHEERIO'])
    }
  }

  const usefulAssetCount = discoveredAssets.filter((asset) => isUsefulCategory(asset.category)).length
  const needsBrowser = !hasEnoughUsefulAssets(discoveredAssets)

  const finalResult: OrchestratedDiscoveryResult = {
    providerUsed: result?.provider || providerAttempts[providerAttempts.length - 1] || 'NONE',
    providerAttempted: providerAttempts[providerAttempts.length - 1] || 'NONE',
    candidates: result?.candidates || [],
    pagesCrawled: result?.pagesCrawled || 0,
    rawCandidates: result?.rawCandidates || 0,
    duration: Date.now() - startTime,
    socialProfiles: result?.socialProfiles || [],
    discoveredAssets,
    firecrawlUsed: false,
    providerAttempts,
    firecrawlReason: providerErrors['FIRECRAWL'] || undefined,
    firecrawlSkippedReason: 'FIRECRAWL_DISABLED',
    localUsefulAssetCount: usefulAssetCount,
    firecrawlUsefulAssetCount: 0,
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
