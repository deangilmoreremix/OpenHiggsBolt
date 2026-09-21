import { NextRequest, NextResponse } from 'next/server'
import type { SeedancePrompt, SeedanceStats } from '@/types/go-ai-viral/seedance'
import { classifyPrompt } from '@/lib/nicheClassifier'

/**
 * Production-safe data source.
 *
 * The canonical dataset is the committed repository file
 * `src/data/seedance_prompts.json`. A legacy `/tmp/seedance_prompts.json`
 * path is no longer used in production. The conversion scripts in
 * `scripts/` may still write there for development imports, but the API
 * reads the committed file directly.
 *
 * Records are normalized to the proven Remix media shape so the client
 * resolver can treat feed and Seedance records uniformly.
 */
const DATA_PATH = process.cwd() + '/src/data/seedance_prompts.json'
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes
const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

interface CachedSeedance {
  records: SeedancePrompt[]
  stats: SeedanceStats
  fetchedAt: number
  degraded?: boolean
}

let cached: CachedSeedance | null = null

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  cinematic: ['cinematic', 'film', 'camera', 'shot', 'scene', 'dolly', 'pan', 'tilt', 'zoom'],
  character: ['character', 'avatar', 'portrait', 'face', 'expression', 'talking', 'lip sync'],
  'product-ads': ['product', 'commercial', 'advert', 'brand', 'unboxing', 'showcase'],
  animation: ['animation', 'animated', 'cartoon', '3d', 'cgi', 'motion graphics'],
  'camera-moves': ['camera move', 'orbit', '360', 'tracking', 'steadycam', 'gimbal'],
  photography: ['photograph', 'photo', 'portrait', 'headshot', 'selfie'],
  'illustration-3d': ['3d render', 'illustration', 'concept art', 'digital art'],
  nature: ['nature', 'landscape', 'forest', 'ocean', 'mountain', 'wildlife'],
  travel: ['travel', 'destination', 'city', 'street', 'landmark', 'tour'],
  architecture: ['architecture', 'building', 'interior', 'exterior', 'structure'],
  'food-drink': ['food', 'drink', 'cuisine', 'restaurant', 'cooking', 'recipe'],
  'poster-design': ['poster', 'typography', 'graphic design', 'title sequence'],
  'ugc': ['ugc', 'user generated', 'vlog', 'tutorial', 'review', 'reaction'],
  'ui-graphic': ['ui', 'ux', 'interface', 'screen', 'app design', 'website'],
  'product-brand': ['brand', 'logo', 'identity', 'style guide'],
}

export function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

export function generateEngagement(slug: string): { likes: number; reposts: number; replies: number } {
  const h = hashString(slug)
  const likes = 50 + (h % 20000)
  const reposts = 5 + ((h >> 1) % 2000)
  const replies = 1 + ((h >> 2) % 500)
  return { likes, reposts, replies }
}
function buildStats(records: SeedancePrompt[]): SeedanceStats {
  const sourceLanguages: Record<string, number> = {}
  let withVideo = 0
  let totalLikes = 0
  let totalReposts = 0
  let totalReplies = 0
  let viralCount = 0
  let withPrompt = 0
  let withDetailHref = 0
  for (const r of records) {
    if (r.outputUrl) withVideo += 1
    if (r.prompt || r.fullPrompt) withPrompt += 1
    if (r.detailHref) withDetailHref += 1
    const eng = r.engagement
    if (eng) {
      totalLikes += eng.likes
      totalReposts += eng.reposts
      totalReplies += eng.replies
      if (eng.likes >= 50) viralCount += 1
    }
    const lang = r.sourceLanguage || 'unknown'
    sourceLanguages[lang] = (sourceLanguages[lang] || 0) + 1
  }
  return {
    total: records.length,
    withVideo,
    withPrompt,
    withDetailHref,
    sourceLanguages,
    totalLikes,
    totalReposts,
    totalReplies,
    viralCount,
  }
}

function detectCategories(prompt: string): string[] {
  const text = prompt.toLowerCase()
  const matches: string[] = []
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) {
      matches.push(category)
    }
  }
  if (matches.length === 0) {
    matches.push('video-prompts')
  }
  return matches
}

function buildThumbnail(outputUrl: string | null): string | null {
  if (!outputUrl) return null
  if (outputUrl.includes('/outputs/')) {
    return outputUrl.replace('/outputs/', '/thumbnails/').replace(/\.mp4$/, '.jpg')
  }
  return null
}

function enrichRecord(raw: SeedancePrompt): SeedancePrompt {
  const categories = detectCategories(raw.prompt || raw.fullPrompt)
  const thumbnail = buildThumbnail(raw.outputUrl)
  const media = normalizeSeedanceMedia(raw)

  const base = {
    ...raw,
    media,
    sourceLanguage: raw.sourceLanguage || 'en',
    detailHref: raw.detailHref
      ? raw.detailHref.startsWith('http')
        ? raw.detailHref
        : `https://go.smartvid.app${raw.detailHref}`
      : null,
    outputUrl: raw.outputUrl,
    categories,
    tags: categories.slice(0, 3),
    recommendedModel: 'seedance',
    sourceModels: ['seedance'],
    language: raw.sourceLanguage || 'en',
    thumbnail,
    engagement: raw.engagement || generateEngagement(raw.slug),
  }

  const niche = classifyPrompt({
    id: raw.slug,
    title: raw.prompt || raw.fullPrompt || '',
    prompt: raw.prompt || raw.fullPrompt || '',
    tags: raw.tags || categories,
    categories: raw.categories || categories,
  } as never)

  return {
    ...base,
    businessNiches: niche.businessNiches,
    primaryNiche: niche.primaryNiche,
    subNiches: niche.subNiches,
  }
}

function normalizeSeedanceMedia(raw: SeedancePrompt): SeedancePrompt['media'] {
  const existing = Array.isArray(raw.media) ? raw.media : []
  const hasNormalizedVideo = existing.some((m) => m.type === 'video' && (m.sourceUrl || '').trim())
  if (hasNormalizedVideo) return existing

  const outputUrl = (raw.outputUrl || '').trim()
  const thumbnail = (raw.thumbnail || '').trim()
  const poster = thumbnail || outputUrl.replace('/outputs/', '/thumbnails/').replace(/\.mp4$/, '.jpg') || ''
  const video: SeedancePrompt['media'][number] = {
    type: 'video',
    role: 'result',
    previewUrl: poster || null,
    sourceUrl: outputUrl || null,
    posterUrl: poster || null,
  }
  const image: SeedancePrompt['media'][number] = {
    type: 'image',
    role: 'preview',
    previewUrl: poster || null,
    sourceUrl: poster || null,
    posterUrl: poster || null,
  }
  return outputUrl ? [image, video] : existing
}

async function loadSeedance(): Promise<CachedSeedance> {
  const now = Date.now()
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return cached
  }

  const { readFile } = await import('node:fs/promises')
  let text: string | null = null

  try {
    text = await readFile(DATA_PATH, 'utf-8')
  } catch {
    const empty: CachedSeedance = {
      records: [],
      stats: { total: 0, withVideo: 0, withPrompt: 0, withDetailHref: 0, sourceLanguages: {}, totalLikes: 0, totalReposts: 0, totalReplies: 0, viralCount: 0 },
      fetchedAt: now,
      degraded: true,
    }
    cached = empty
    return empty
  }

  let rawRecords: SeedancePrompt[]
  try {
    rawRecords = JSON.parse(text) as SeedancePrompt[]
  } catch {
    console.error('[go-ai-viral] seedance data corrupted at ' + DATA_PATH)
    const empty: CachedSeedance = {
      records: [],
      stats: { total: 0, withVideo: 0, withPrompt: 0, withDetailHref: 0, sourceLanguages: {}, totalLikes: 0, totalReposts: 0, totalReplies: 0, viralCount: 0 },
      fetchedAt: now,
      degraded: true,
    }
    cached = empty
    return empty
  }
  const records = rawRecords.map(enrichRecord)

  cached = {
    records,
    stats: buildStats(records),
    fetchedAt: now,
  }
  return cached
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const rawPageSize = parseInt(searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, rawPageSize))
    const search = (searchParams.get('search') || '').trim().toLowerCase()
    const language = (searchParams.get('language') || '').trim().toLowerCase()
    const hasVideo = searchParams.get('hasVideo')
    const hasPrompt = searchParams.get('hasPrompt')

    const { records, stats, degraded } = await loadSeedance()

    if (degraded) {
      return NextResponse.json(
        { error: { code: 'SEEDANCE_DATASET_UNAVAILABLE', message: 'Seedance dataset is currently unavailable. Please try again later.' } },
        { status: 502 }
      )
    }

    let filtered = records
    if (hasVideo === 'true') {
      filtered = filtered.filter((r) => !!r.outputUrl)
    } else if (hasVideo === 'false') {
      filtered = filtered.filter((r) => !r.outputUrl)
    }
    if (hasPrompt === 'true') {
      filtered = filtered.filter((r) => !!(r.prompt || r.fullPrompt))
    }
    if (language) {
      filtered = filtered.filter((r) => (r.sourceLanguage || 'unknown').toLowerCase() === language)
    }
    if (search) {
      filtered = filtered.filter(
        (r) =>
          (r.prompt || '').toLowerCase().includes(search) ||
          (r.fullPrompt || '').toLowerCase().includes(search) ||
          (r.slug || '').toLowerCase().includes(search)
      )
    }

    const total = filtered.length
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const safePage = Math.min(page, totalPages)
    const start = (safePage - 1) * pageSize
    const items = filtered.slice(start, start + pageSize)

    const availableNiches = Array.from(
      new Set(records.flatMap((r) => r.businessNiches || []))
    ).map((id) => ({
      id,
      label: id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      count: records.filter((r) => (r.businessNiches || []).includes(id)).length,
    }))

    const availableSubNiches = Object.fromEntries(
      Array.from(new Set(records.flatMap((r) => r.subNiches || []))).map((id) => [
        id,
        {
          id,
          label: id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          count: records.filter((r) => (r.subNiches || []).includes(id)).length,
        },
      ])
    )

    return NextResponse.json({
      data: items,
      pagination: { page: safePage, pageSize, total, totalPages },
      meta: {
        stats,
        availableLanguages: Array.from(new Set(records.map((r) => r.sourceLanguage || 'unknown'))).sort(),
        availableNiches,
        availableSubNiches,
        fetchedAt: cached?.fetchedAt || Date.now(),
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'unknown error'
    console.error('[go-ai-viral] seedance API error:', msg)
    return NextResponse.json(
      { error: { code: 'SEEDANCE_FETCH_ERROR', message: 'Could not retrieve seedance prompts. Please try again later.' } },
      { status: 502 }
    )
  }
}
