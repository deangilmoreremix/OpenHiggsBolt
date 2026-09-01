import { NextRequest, NextResponse } from 'next/server'
import type { PromptRecord, FeedStats } from '@/types/go-ai-viral/prompt'

/**
 * GO- AI Viral — Prompts API
 *
 * Serves the Visual Prompt Feed (https://github.com/Hanyuyu/visual-prompt-feed)
 * as a paginated, filterable JSON endpoint. The source data is a JSONL file
 * hosted on GitHub raw. This route fetches it server-side, caches it in memory
 * for a short window, parses each line into a typed record, and applies
 * filtering + pagination so the client never has to download the full ~5MB file.
 *
 * Query parameters:
 *   page           1-based page number           (default 1)
 *   pageSize       items per page 1..100           (default 20)
 *   mediaType      "image" | "video" | "all"       (default "all")
 *   category       one of the feed categories      (default none = all)
 *   model          recommendedModel value          (default none = all)
 *   search         free-text search in title/prompt (default none)
 *   sort           "newest" | "oldest"             (default "newest")
 */

const FEED_JSONL = 'https://raw.githubusercontent.com/Hanyuyu/visual-prompt-feed/main/data/prompts.jsonl'
const FEED_STATS = 'https://raw.githubusercontent.com/Hanyuyu/visual-prompt-feed/main/stats.json'

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes
const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100
const FETCH_TIMEOUT_MS = 15_000
const MAX_RETRIES = 2
const BASE_RETRY_DELAY_MS = 500

interface CachedFeed {
  records: PromptRecord[]
  stats: FeedStats
  fetchedAt: number
}

let cached: CachedFeed | null = null

async function fetchWithRetry(url: string, signal?: AbortSignal): Promise<Response> {
  let lastError: Error | null = null
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
      const combinedSignal = signal
        ? AbortSignal.any([signal, controller.signal])
        : controller.signal
      const res = await fetch(url, { 
        next: { revalidate: 300 },
        signal: combinedSignal,
      })
      clearTimeout(timeoutId)
      if (res.ok) return res
      if (res.status >= 400 && res.status < 500) {
        return res
      }
      lastError = new Error(`HTTP ${res.status}`)
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('Network error')
    }
    if (attempt < MAX_RETRIES) {
      const delay = BASE_RETRY_DELAY_MS * 2 ** attempt
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  throw lastError || new Error('Fetch failed after retries')
}

/** Fetch + parse the JSONL feed and stats. Cached in-memory for CACHE_TTL_MS. */
async function loadFeed(): Promise<CachedFeed> {
  const now = Date.now()
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return cached
  }

  // Fetch both in parallel with timeout and retry
  const [jsonlRes, statsRes] = await Promise.all([
    fetchWithRetry(FEED_JSONL),
    fetchWithRetry(FEED_STATS),
  ])

  if (!jsonlRes.ok) {
    throw new Error(`Failed to fetch prompt feed: ${jsonlRes.status}`)
  }
  if (!statsRes.ok) {
    throw new Error(`Failed to fetch feed stats: ${statsRes.status}`)
  }

  const jsonlText = await jsonlRes.text()
  let statsText: FeedStats
  try {
    statsText = (await statsRes.json()) as FeedStats
  } catch {
    throw new Error('FEED_STATS_CORRUPTED')
  }

  const records: PromptRecord[] = []
  for (const line of jsonlText.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    try {
      records.push(JSON.parse(trimmed))
    } catch {
      // skip malformed lines
    }
  }

  cached = { records, stats: statsText, fetchedAt: now }
  return cached
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const rawPageSize = parseInt(searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, rawPageSize))
    const mediaType = searchParams.get('mediaType') || 'all'
    const category = searchParams.get('category') || ''
    const model = searchParams.get('model') || ''
    const search = searchParams.get('search') || ''
    const sort = searchParams.get('sort') || 'newest'

    const { records, stats } = await loadFeed()

    // Apply filters
    let filtered = records
    if (mediaType !== 'all') {
      filtered = filtered.filter((r) => r.mediaType === mediaType)
    }
    if (category) {
      filtered = filtered.filter((r) => Array.isArray(r.categories) && r.categories.includes(category))
    }
    if (model) {
      filtered = filtered.filter((r) => r.recommendedModel === model || (Array.isArray(r.sourceModels) && r.sourceModels.includes(model)))
    }
    if (search) {
      const term = search.toLowerCase()
      filtered = filtered.filter(
        (r) =>
          (r.title || '').toLowerCase().includes(term) ||
          (r.prompt || '').toLowerCase().includes(term) ||
          (r.tags || []).some((t: string) => t.toLowerCase().includes(term))
      )
    }

    // Sort by publishedAt (newest first by default)
    filtered = filtered.slice().sort((a, b) => {
      const ta = new Date(a.source?.publishedAt || a.provenance?.importedAt || '').getTime()
      const tb = new Date(b.source?.publishedAt || b.provenance?.importedAt || '').getTime()
      return sort === 'oldest' ? ta - tb : tb - ta
    })

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
        availableCategories: Array.from(
          new Set(records.flatMap((r) => r.categories || []))
        ).sort(),
        availableModels: Array.from(
          new Set(records.map((r) => r.recommendedModel).filter(Boolean))
        ).sort(),
        fetchedAt: cached!.fetchedAt,
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'unknown error'
    console.error('[go-ai-viral] prompts API error:', msg)
    return NextResponse.json(
      { error: { code: 'FEED_FETCH_ERROR', message: 'Could not retrieve the prompt feed. Please try again later.' } },
      { status: 502 }
    )
  }
}
