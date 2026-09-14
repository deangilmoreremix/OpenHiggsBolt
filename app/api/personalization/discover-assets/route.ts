import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { orchestrateDiscovery } from '@/server/discoveryOrchestrator'
import { getOpenAiKeyForUser } from '@/src/lib/openaiKeyServer'

type DiscoveryCacheEntry = {
  result: Awaited<ReturnType<typeof orchestrateDiscovery>>
  expiresAt: number
}

const discoveryCache = new Map<string, DiscoveryCacheEntry>()
const CACHE_TTL_MS = 5 * 60 * 1000

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    const body = await req.json().catch(() => ({}))
    const websiteUrl = typeof body?.websiteUrl === 'string' ? body.websiteUrl : ''
    const testMode = typeof body?.testMode === 'boolean' ? body.testMode : false

    if (!websiteUrl) {
      return NextResponse.json({ error: 'websiteUrl is required' }, { status: 400 })
    }

    const cacheKey = `${websiteUrl}:${testMode ? 'test' : 'live'}:${userId || 'anon'}`
    const cached = discoveryCache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json({
        ok: true,
        cached: true,
        providerUsed: cached.result.providerUsed,
        providerAttempted: cached.result.providerAttempted,
        discoveredAssets: cached.result.discoveredAssets,
        candidates: cached.result.candidates,
        count: cached.result.discoveredAssets.length,
        pagesCrawled: cached.result.pagesCrawled,
        rawCandidates: cached.result.rawCandidates,
        duration: cached.result.duration,
        socialProfiles: cached.result.socialProfiles,
      })
    }

    const openAiKey = userId ? await getOpenAiKeyForUser() : null
    const firecrawlApiKey = testMode ? null : (process.env.FIRECRAWL_API_KEY || null)

    const result = await orchestrateDiscovery({
      websiteUrl,
      maxPages: 8,
      maxImages: 60,
      openAiKey: openAiKey || undefined,
      firecrawlApiKey: firecrawlApiKey || undefined,
    })

    discoveryCache.set(cacheKey, {
      result,
      expiresAt: Date.now() + CACHE_TTL_MS,
    })

    return NextResponse.json({
      ok: true,
      cached: false,
      providerUsed: result.providerUsed,
      providerAttempted: result.providerAttempted,
      discoveredAssets: result.discoveredAssets,
      candidates: result.candidates,
      count: result.discoveredAssets.length,
      pagesCrawled: result.pagesCrawled,
      rawCandidates: result.rawCandidates,
      duration: result.duration,
      socialProfiles: result.socialProfiles,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    const status = message.includes('not allowed') || message.includes('Private') ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
