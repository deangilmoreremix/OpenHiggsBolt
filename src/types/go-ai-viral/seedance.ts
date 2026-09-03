/**
 * Type definitions for Seedance video prompt data.
 *
 * These mirror the extracted dataset prepared for the GO- AI Viral video prompts
 * tab. The source file is `/tmp/seedance_prompts.json`, with 2,517 records
 * and 2,005 records containing `outputUrl` video links.
 */

export interface SeedancePrompt {
  slug: string
  prompt: string
  fullPrompt: string
  sourceLanguage: string | null
  detailHref: string | null
  outputUrl: string | null
  categories?: string[]
  tags?: string[]
  recommendedModel?: string
  sourceModels?: string[]
  language?: string | null
  thumbnail?: string | null
  author?: string | null
  publishedAt?: string | null
  engagement?: {
    likes: number
    reposts: number
    replies: number
  }
  /** Business-niche classification added server-side by the seedance API route. */
  businessNiches?: string[]
  /** Single strongest niche used for deterministic grouping. */
  primaryNiche?: string
  /** Optional sub-niches within the primary niche for granular filtering. */
  subNiches?: string[]
}

export interface SeedanceStats {
  total: number
  withVideo: number
  withPrompt: number
  withDetailHref: number
  sourceLanguages: Record<string, number>
}
