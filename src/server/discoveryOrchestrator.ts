/**
 * Discovery orchestrator that chooses between providers in priority order:
 * 1. Cache
 * 2. Static/HTTP (SmartVideo lightweight crawler)
 * 3. Structured data extraction
 * 4. Sitemap discovery
 * 5. Crawlee CheerioCrawler (free HTTP multi-page)
 * 6. Browser fallback (if enabled and previous layers insufficient)
 * 7. Firecrawl (optional last resort, only if explicitly enabled)
 *
 * Then runs the shared normalize/filter/classify pipeline.
 */

import type { ImageCandidate, DiscoveryResult, SocialProfileSource } from './discoveryProvider'
import { FirecrawlDiscoveryProvider } from './firecrawlDiscovery'
import { StaticDiscoveryProvider } from './staticDiscovery'
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

export interface OrchestratedDiscoveryOptions {
  websiteUrl: string
  maxPages: number
  maxImages: number
  openAiKey?: string
  openAiModel?: string
  firecrawlApiKey?: string
  enableFirecrawlFallback?: boolean
  enableBrowserFallback?: boolean
  minAcceptableAssets?: number
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
  firecrawlUsed: boolean
  providerAttempts: string[]
  firecrawlReason?: string
  firecrawlSkippedReason?: string
  localUsefulAssetCount?: number
  firecrawlUsefulAssetCount?: number
  sitemapFound?: boolean
  crawleePagesCrawled?: number
}

const MIN_ACCEPTABLE_ASSETS = 5
const MIN_ACCEPTABLE_CATEGORIES = 2

function countUsefulAssetsByCategory(assets: DiscoveredAsset[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const asset of assets) {
    if (isUsefulCategory(asset.category)) {
      counts[asset.category] = (counts[asset.category] || 0) + 1
    }
  }
  return counts
}

function hasEnoughUsefulAssets(assets: DiscoveredAsset[]): boolean {
  const usefulCount = assets.filter((asset) => isUsefulCategory(asset.category)).length
  return usefulCount >= FREE_DISCOVERY_MIN_USEFUL
}

function getFirecrawlSkipReason(
  enableFirecrawlFallback: boolean,
  firecrawlApiKey: string | undefined,
  discoveredAssets: DiscoveredAsset[],
): string | undefined {
  if (!enableFirecrawlFallback) return 'FIRECRAWL_DISABLED'
  if (!firecrawlApiKey) return 'NO_FIRECRAWL_API_KEY'

  const counts = countUsefulAssetsByCategory(discoveredAssets)
  const hasLogo = (counts['logo'] || 0) >= 1
  const usefulProductOrService = (counts['product'] || 0) + (counts['service'] || 0) + (counts['completed_work'] || 0)
  const usefulBrandReferences = (counts['storefront'] || 0) + (counts['office'] || 0) + (counts['branded_vehicle'] || 0) + (counts['team'] || 0) + (counts['brand'] || 0)

  if (hasLogo && usefulProductOrService >= 2 && usefulBrandReferences >= 2) {
    return 'USEFUL_RESULTS_ALREADY_FOUND'
  }

  if (!hasLogo && usefulProductOrService >= 2 && usefulBrandReferences >= 2) {
    return 'ONLY_LOGO_MISSING'
  }

  if (hasLogo && usefulProductOrService < 2 && usefulBrandReferences >= 2) {
    return 'PRESENTER_ONLY_MISSING'
  }

  if (hasEnoughUsefulAssets(discoveredAssets)) {
    return 'USEFUL_RESULTS_ALREADY_FOUND'
  }

  return 'FREE_RESULTS_INSUFFICIENT'
}

function getFirecrawlReason(assets: DiscoveredAsset[]): string {
  const counts = countUsefulAssetsByCategory(assets)
  const reasons: string[] = []
  if ((counts['logo'] || 0) === 0) reasons.push('insufficient_logo')
  if (((counts['product'] || 0) + (counts['service'] || 0) + (counts['completed_work'] || 0)) < 2) reasons.push('insufficient_product_assets')
  if (((counts['storefront'] || 0) + (counts['office'] || 0) + (counts['branded_vehicle'] || 0) + (counts['team'] || 0) + (counts['brand'] || 0)) < 2) reasons.push('insufficient_brand_assets')
  return reasons.join(',') || 'insufficient_assets'
}

export async function orchestrateDiscovery(options: OrchestratedDiscoveryOptions): Promise<OrchestratedDiscoveryResult> {
  const {
    websiteUrl,
    maxPages,
    maxImages,
    openAiKey,
    openAiModel,
    firecrawlApiKey,
    enableFirecrawlFallback = false,
    enableBrowserFallback = false,
    minAcceptableAssets = MIN_ACCEPTABLE_ASSETS,
  } = options

  const baseUrl = sanitizeUrl(websiteUrl)
  const startTime = Date.now()
  const providerAttempts: string[] = []
  let providerUsed = 'NONE'
  let result: DiscoveryResult | null = null
  let firecrawlUsed = false
  let firecrawlReason: string | undefined
  let crawleePagesCrawled = 0
  let sitemapFound = false

  // 1. Try static/HTTP first (always)
  providerAttempts.push('SMARTVIDEO_STATIC')
  try {
    const staticProvider = new StaticDiscoveryProvider()
    result = await staticProvider.discover({
      websiteUrl: baseUrl,
      maxPages,
      maxImages,
      openAiKey,
      openAiModel,
    })
    providerUsed = 'SMARTVIDEO_STATIC'
  } catch (err) {
    console.error('[discovery] Static failed:', err instanceof Error ? err.message : err)
    result = null
  }

  // 2. Build initial discovered assets from static result and check usefulness
  let discoveredAssets: DiscoveredAsset[] = []
  let localUsefulAssetCount = 0

  if (result?.candidates?.length) {
    discoveredAssets = await buildDiscoveredAssetsFromCandidates(result.candidates, maxImages, openAiKey, openAiModel)
    localUsefulAssetCount = discoveredAssets.filter((asset) => isUsefulCategory(asset.category)).length
  }

  const staticSufficient = hasEnoughUsefulAssets(discoveredAssets)

  // 3. Sitemap discovery — find high-value pages
  const sitemapCandidates: string[] = []
  if (!staticSufficient) {
    try {
      sitemapCandidates.push(...(await discoverSitemapUrls(baseUrl)))
      sitemapFound = sitemapCandidates.length > 0
    } catch (err) {
      console.error('[discovery] Sitemap discovery failed:', err instanceof Error ? err.message : err)
    }
  }

  // 4. Crawlee CheerioCrawler — free HTTP multi-page discovery
  if (!staticSufficient && sitemapCandidates.length > 0) {
    providerAttempts.push('CRAWLEE_CHEERIO')
    try {
      const { discoverWithCrawlee } = await import('./crawleeProvider')
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

        const crawleeAssets = await buildDiscoveredAssetsFromCandidates(newCandidates, maxImages, openAiKey, openAiModel)
        discoveredAssets = [...discoveredAssets, ...crawleeAssets]
        localUsefulAssetCount = discoveredAssets.filter((asset) => isUsefulCategory(asset.category)).length
        crawleePagesCrawled = crawleeResult.pagesCrawled
        providerUsed = 'CRAWLEE_CHEERIO'
      }
    } catch (err) {
      console.error('[discovery] Crawlee fallback failed:', err instanceof Error ? err.message : err)
    }
  }

  // 5. If still insufficient and browser fallback enabled, try browser
  if (!hasEnoughUsefulAssets(discoveredAssets) && enableBrowserFallback) {
    providerAttempts.push('SMARTVIDEO_BROWSER')
    try {
      const { discoverRenderedAssets } = await import('./browserDiscovery')
      const priorityPages = result?.candidates?.map((c) => c.sourcePage) || [baseUrl]
      const uniquePages = Array.from(new Set(priorityPages)).slice(0, 4)

      const browserResult = await discoverRenderedAssets(baseUrl, uniquePages)
      if (browserResult.candidates.length > 0) {
        const existingUrls = new Set(result?.candidates?.map((c) => c.url) || [])
        const newCandidates = browserResult.candidates.filter((c) => !existingUrls.has(c.url))

        if (result) {
          result = {
            ...result,
            candidates: [...result.candidates, ...newCandidates],
            rawCandidates: (result.rawCandidates || 0) + browserResult.candidates.length,
            pagesCrawled: (result.pagesCrawled || 0) + browserResult.pagesCrawled,
          }
        } else {
          result = {
            candidates: newCandidates,
            provider: 'SMARTVIDEO_BROWSER',
            pagesCrawled: browserResult.pagesCrawled,
            rawCandidates: browserResult.candidates.length,
            socialProfiles: [],
          }
        }

        const browserAssets = await buildDiscoveredAssetsFromCandidates(newCandidates, maxImages, openAiKey, openAiModel)
        discoveredAssets = [...discoveredAssets, ...browserAssets]
        localUsefulAssetCount = discoveredAssets.filter((asset) => isUsefulCategory(asset.category)).length
        providerUsed = 'SMARTVIDEO_BROWSER'
      }
    } catch (err) {
      console.error('[discovery] Browser fallback failed:', err instanceof Error ? err.message : err)
    }
  }

  const firecrawlSkippedReason = getFirecrawlSkipReason(enableFirecrawlFallback, firecrawlApiKey, discoveredAssets)

  // 6. If still insufficient and Firecrawl fallback enabled, try Firecrawl
  const useFirecrawl = enableFirecrawlFallback && firecrawlApiKey && !hasEnoughUsefulAssets(discoveredAssets)

  if (useFirecrawl) {
    firecrawlReason = getFirecrawlReason(discoveredAssets)
    providerAttempts.push('FIRECRAWL')
    try {
      const firecrawl = new FirecrawlDiscoveryProvider(firecrawlApiKey)
      const firecrawlResult = await firecrawl.discover({
        websiteUrl: baseUrl,
        maxPages: Math.min(maxPages, 5),
        maxImages,
      })

      // Merge Firecrawl results
      const existingUrls = new Set(result?.candidates?.map((c) => c.url) || [])
      const newCandidates = firecrawlResult.candidates.filter((c) => !existingUrls.has(c.url))

      if (result) {
        result = {
          ...result,
          candidates: [...result.candidates, ...newCandidates],
          rawCandidates: (result.rawCandidates || 0) + firecrawlResult.rawCandidates,
          pagesCrawled: (result.pagesCrawled || 0) + firecrawlResult.pagesCrawled,
          socialProfiles: [...(result.socialProfiles || []), ...(firecrawlResult.socialProfiles || [])],
        }
      } else {
        result = firecrawlResult
      }

      const firecrawlAssets = await buildDiscoveredAssetsFromCandidates(newCandidates, maxImages, openAiKey, openAiModel)
      discoveredAssets = [...discoveredAssets, ...firecrawlAssets]

      providerUsed = 'FIRECRAWL'
      firecrawlUsed = true
    } catch (err) {
      console.error('[discovery] Firecrawl fallback failed:', err instanceof Error ? err.message : err)
    }
  }

  const duration = Date.now() - startTime
  const finalResult = result || { candidates: [], provider: 'NONE', pagesCrawled: 0, rawCandidates: 0, socialProfiles: [] }

  return {
    providerUsed,
    providerAttempted: providerAttempts[providerAttempts.length - 1] || 'NONE',
    candidates: finalResult.candidates || [],
    pagesCrawled: finalResult.pagesCrawled || 0,
    rawCandidates: finalResult.rawCandidates || 0,
    duration,
    socialProfiles: finalResult.socialProfiles || [],
    discoveredAssets,
    firecrawlUsed,
    providerAttempts,
    firecrawlReason,
    firecrawlSkippedReason,
    localUsefulAssetCount,
    firecrawlUsefulAssetCount: firecrawlUsed
      ? discoveredAssets.filter((asset) => isUsefulCategory(asset.category)).length - localUsefulAssetCount
      : 0,
    sitemapFound,
    crawleePagesCrawled,
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

    // Only keep personalization-relevant assets.
    // Everything else is discarded before user review.
    if (!isUsefulCategory(classification!.category)) {
      continue
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
