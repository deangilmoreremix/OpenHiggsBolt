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

export type SourceType =
  | 'WEBSITE'
  | 'INSTAGRAM'
  | 'FACEBOOK'
  | 'LINKEDIN'
  | 'TIKTOK'
  | 'YOUTUBE'
  | 'X'
  | 'PINTEREST'
  | 'PUBLIC_SEARCH'
  | 'MANUAL_UPLOAD'
  | 'FIRECRAWL'

export interface SocialProfileSource {
  sourceType: SourceType
  sourcePageUrl: string
  socialProfileUrl: string
}

export interface ImageCandidate {
  url: string
  sourcePage: string
  altText?: string
  ogContext?: string
  sourceType?: SourceType
  socialProfileUrl?: string
  sourcePageType?: string
  linkTarget?: string
}

export interface DiscoveryResult {
  candidates: ImageCandidate[]
  provider: string
  pagesCrawled: number
  rawCandidates: number
  socialProfiles: SocialProfileSource[]
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
