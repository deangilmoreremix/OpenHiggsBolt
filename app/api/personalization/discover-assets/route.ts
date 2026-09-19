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

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_REQUESTS = 10
const MAX_WEBSITE_URL_LENGTH = 2048

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(key: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetAt: now + RATE_LIMIT_WINDOW_MS }
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count += 1
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - entry.count, resetAt: entry.resetAt }
}

function sanitizeWebsiteUrl(url: string): string {
  const trimmed = url.trim().slice(0, MAX_WEBSITE_URL_LENGTH)
  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      throw new Error('Invalid protocol')
    }
    if (['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(parsed.hostname)) {
      throw new Error('Private hostname not allowed')
    }
    if (parsed.hostname.startsWith('192.168.') || parsed.hostname.startsWith('10.') || parsed.hostname.startsWith('172.')) {
      throw new Error('Private IP range not allowed')
    }
    return parsed.toString()
  } catch {
    throw new Error('Invalid website URL')
  }
}

function sanitizeErrorMessage(message: string): string {
  const safe = message
    .replace(/sk-[a-zA-Z0-9]{20,}/g, '[REDACTED]')
    .replace(/AIza[a-zA-Z0-9_-]{35}/g, '[REDACTED]')
    .replace(/Bearer\s+[a-zA-Z0-9._-]+/g, 'Bearer [REDACTED]')
  return safe
}

export async function POST(req: NextRequest) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 120_000)

  try {
    const { userId } = await auth()
    const body = await req.json().catch(() => ({}))
    const rawWebsiteUrl = typeof body?.websiteUrl === 'string' ? body.websiteUrl : ''
    const requestedTestMode = typeof body?.testMode === 'boolean' ? body.testMode : false
    const testMode = isTestModeAllowed ? requestedTestMode : false

    if (!rawWebsiteUrl) {
      clearTimeout(timeoutId)
      return NextResponse.json({ error: 'websiteUrl is required' }, { status: 400 })
    }

    let websiteUrl: string
    try {
      websiteUrl = sanitizeWebsiteUrl(rawWebsiteUrl)
    } catch {
      clearTimeout(timeoutId)
      return NextResponse.json({ error: 'Invalid website URL format' }, { status: 400 })
    }

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || undefined
    const rateLimitKey = userId || clientIp || 'anon'
    const rateLimit = checkRateLimit(rateLimitKey)
    if (!rateLimit.allowed) {
      clearTimeout(timeoutId)
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } },
      )
    }

    const cacheKey = `${websiteUrl}:${testMode ? 'test' : 'live'}:${userId || 'anon'}`

    if (!testMode) {
      const cached = discoveryCache.get(cacheKey)
      if (cached && cached.expiresAt > Date.now()) {
        clearTimeout(timeoutId)
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
        firecrawlUsed: false,
        providerAttempts: ['FIXTURE'],
      }
    } else {
      result = await orchestrateDiscovery({
        websiteUrl,
        maxPages: 8,
        maxImages: 60,
        openAiKey: openAiKey || undefined,
        firecrawlApiKey: firecrawlApiKey || undefined,
        enableFirecrawlFallback: process.env.ENABLE_FIRECRAWL_FALLBACK === 'true',
        enableBrowserFallback: process.env.ENABLE_BROWSER_DISCOVERY === 'true',
        minAcceptableAssets: 5,
      })
    }

    if (!testMode) {
      discoveryCache.set(cacheKey, {
        result,
        expiresAt: Date.now() + cacheTtlMs,
      })
    }

    clearTimeout(timeoutId)
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
    clearTimeout(timeoutId)
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timed out' }, { status: 504 })
    }
    const message = err instanceof Error ? err.message : 'Unknown error'
    const status = message.includes('not allowed') || message.includes('Private') || message.includes('Invalid') ? 400 : 500
    return NextResponse.json({ error: sanitizeErrorMessage(message) }, { status })
  }
}
