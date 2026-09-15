import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { orchestrateDiscovery, buildDiscoveredAssetsFromCandidates } from '@/server/discoveryOrchestrator'
import { getOpenAiKeyForUser } from '@/src/lib/openaiKeyServer'
import { getFixture } from '@/src/server/fixtures/discoveryFixtures'

type RawDiscoveryResult = Awaited<ReturnType<typeof orchestrateDiscovery>>

const discoveryCache = new Map<string, { result: RawDiscoveryResult; expiresAt: number }>()
const CACHE_TTL_MS = (process.env.FIRECRAWL_DISCOVERY_CACHE_TTL_MS || '86400000') as string
const cacheTtlMs = Number.isNaN(Number(CACHE_TTL_MS)) ? 86400000 : Number(CACHE_TTL_MS)
const isTestModeAllowed = process.env.NODE_ENV !== 'production'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    const body = await req.json().catch(() => ({}))
    const websiteUrl = typeof body?.websiteUrl === 'string' ? body.websiteUrl : ''
    const requestedTestMode = typeof body?.testMode === 'boolean' ? body.testMode : false
    const testMode = isTestModeAllowed ? requestedTestMode : false

    if (!websiteUrl) {
      return NextResponse.json({ error: 'websiteUrl is required' }, { status: 400 })
    }

    const cacheKey = `${websiteUrl}:${testMode ? 'test' : 'live'}:${userId || 'anon'}`

    if (!testMode) {
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
    }

    const openAiKey = userId ? await getOpenAiKeyForUser() : null
    const firecrawlApiKey = testMode ? null : (process.env.FIRECRAWL_API_KEY || null)

    const fixture = testMode ? getFixture(websiteUrl) : null

    let result: RawDiscoveryResult
    if (fixture) {
      const discoveredAssets = await buildDiscoveredAssetsFromCandidates(
        fixture.candidates,
        60,
        openAiKey || undefined,
      )
      result = {
        providerUsed: 'FIXTURE',
        providerAttempted: 'FIXTURE',
        candidates: fixture.candidates,
        pagesCrawled: fixture.pagesCrawled,
        rawCandidates: fixture.rawCandidates,
        duration: 0,
        socialProfiles: fixture.socialProfiles,
        discoveredAssets,
      }
    } else {
      result = await orchestrateDiscovery({
        websiteUrl,
        maxPages: 8,
        maxImages: 60,
        openAiKey: openAiKey || undefined,
        firecrawlApiKey: firecrawlApiKey || undefined,
      })
    }

    if (!testMode) {
      discoveryCache.set(cacheKey, {
        result,
        expiresAt: Date.now() + cacheTtlMs,
      })
    }

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
