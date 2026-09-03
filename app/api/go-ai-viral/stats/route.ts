import { NextResponse } from 'next/server'
import type { FeedStats } from '@/types/go-ai-viral/prompt'
import { safeApiJson } from '@/lib/safeApiResponse'

/**
 * GO- AI Viral — Stats API
 *
 * Returns the aggregate stats for the visual-prompt-feed dataset.
 * Data is cached server-side for 5 minutes to avoid hammering GitHub raw.
 */

const FEED_STATS = 'https://raw.githubusercontent.com/Hanyuyu/visual-prompt-feed/main/stats.json'

let cachedStats: { data: FeedStats; fetchedAt: number } | null = null
const CACHE_TTL_MS = 5 * 60 * 1000

export async function GET() {
  const now = Date.now()
  if (cachedStats && now - cachedStats.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json({ data: cachedStats.data })
  }

  try {
    const res = await fetch(FEED_STATS, { next: { revalidate: 300 } })
    if (!res.ok) {
      throw new Error(`Failed to fetch stats: ${res.status}`)
    }
    const json: FeedStats = await safeApiJson(res)
    cachedStats = { data: json, fetchedAt: now }
    return NextResponse.json({ data: json })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'unknown error'
    console.error('[go-ai-viral] stats API error:', msg)
    // Return stale cache if available, otherwise a degraded response
    if (cachedStats) {
      return NextResponse.json({ data: cachedStats.data })
    }
    return NextResponse.json(
      { error: { code: 'STATS_FETCH_ERROR', message: 'Could not retrieve feed statistics.' } },
      { status: 502 }
    )
  }
}
