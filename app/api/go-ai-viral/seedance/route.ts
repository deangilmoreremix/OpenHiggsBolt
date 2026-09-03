import { NextRequest, NextResponse } from 'next/server'
import type { SeedancePrompt, SeedanceStats } from '@/types/go-ai-viral/seedance'

const DATA_PATH = '/tmp/seedance_prompts.json'
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes
const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

interface CachedSeedance {
  records: SeedancePrompt[]
  stats: SeedanceStats
  fetchedAt: number
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

function buildStats(records: SeedancePrompt[]): SeedanceStats {
  const sourceLanguages: Record<string, number> = {}
  let withVideo = 0
  let withPrompt = 0
  let withDetailHref = 0
  for (const r of records) {
    if (r.outputUrl) withVideo += 1
    if (r.prompt || r.fullPrompt) withPrompt += 1
    if (r.detailHref) withDetailHref += 1
    const lang = r.sourceLanguage || 'unknown'
    sourceLanguages[lang] = (sourceLanguages[lang] || 0) + 1
  }
  return {
    total: records.length,
    withVideo,
    withPrompt,
    withDetailHref,
    sourceLanguages,
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

  return {
    ...raw,
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
  }
}

async function loadSeedance(): Promise<CachedSeedance> {
  const now = Date.now()
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return cached
  }

  const { readFile } = await import('node:fs/promises')
  const text = await readFile(DATA_PATH, 'utf-8')
  let rawRecords: SeedancePrompt[]
  try {
    rawRecords = JSON.parse(text) as SeedancePrompt[]
  } catch {
    throw new Error('SEEDANCE_FILE_CORRUPTED')
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

    const { records, stats } = await loadSeedance()

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

    return NextResponse.json({
      data: items,
      pagination: { page: safePage, pageSize, total, totalPages },
      meta: {
        stats,
        availableLanguages: Array.from(new Set(records.map((r) => r.sourceLanguage || 'unknown'))).sort(),
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
