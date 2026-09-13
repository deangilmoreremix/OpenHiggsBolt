/**
 * Business asset discovery provider abstraction.
 *
 * Each provider is responsible for:
 * - validating the URL against the security model
 * - discovering image candidates from a business website
 * - returning normalized ImageCandidate results
 *
 * Shared validation, dedupe, and classification live in the orchestrator.
 */

export interface ImageCandidate {
  url: string
  sourcePage: string
  altText?: string
  ogContext?: string
}

export interface DiscoveryResult {
  candidates: ImageCandidate[]
  provider: string
  pagesCrawled: number
  rawCandidates: number
}

export interface BusinessAssetDiscoveryProvider {
  name: string
  discover(options: {
    websiteUrl: string
    maxPages: number
    maxImages: number
    openAiKey?: string
    openAiModel?: string
  }): Promise<DiscoveryResult>
}
