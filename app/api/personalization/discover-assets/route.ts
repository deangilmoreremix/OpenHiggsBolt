import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import type { ImageCandidate, SocialProfileSource } from '@/server/discoveryProvider'
import type { DiscoveredAsset } from '@/server/discoverAssets'
import { getOpenAiKeyForUser } from '@/src/lib/openaiKeyServer'
import { getFixture } from '@/src/server/fixtures/discoveryFixtures'
import { logPersonalization, createCorrelationId, sanitizeForLog } from '@/server/personalizationLog'
import { validatePersonalizationEnv } from '@/server/envValidation'
import { createDiscoveryJob, getDiscoveryJobForUser } from '@/server/discoveryJobs'
import { runFastDiscovery } from '@/server/discoveryOrchestrator'

export const runtime = 'nodejs'

type RawDiscoveryResult = {
  providerUsed: string
  providerAttempted: string
  candidates: ImageCandidate[]
  pagesCrawled: number
  rawCandidates: number
  duration: number
  socialProfiles: SocialProfileSource[]
  discoveredAssets: DiscoveredAsset[]
  firecrawlUsed: boolean
  providerAttempts: string[]
  firecrawlReason?: string
  firecrawlSkippedReason?: string
  localUsefulAssetCount?: number
  firecrawlUsefulAssetCount?: number
  sitemapFound?: boolean
  crawleePagesCrawled?: number
}

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
  const correlationId = createCorrelationId(req)
  const startTime = Date.now()

  try {
    const envCheck = validatePersonalizationEnv()
    if (!envCheck.valid) {
      clearTimeout(timeoutId)
      logPersonalization({
        route: '/api/personalization/discover-assets',
        stage: 'env-validation',
        httpStatus: 500,
        safeErrorCode: 'ENV_MISSING',
        safeMessage: `Missing required env vars: ${envCheck.missingRequired.join(', ')}`,
        correlationId,
      })
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const { userId } = await auth()
    const body = await req.json().catch(() => ({}))
    const rawWebsiteUrl = typeof body?.websiteUrl === 'string' ? body.websiteUrl : ''
    const requestedTestMode = typeof body?.testMode === 'boolean' ? body.testMode : false
    const testMode = isTestModeAllowed ? requestedTestMode : false

    if (!rawWebsiteUrl) {
      clearTimeout(timeoutId)
      logPersonalization({
        route: '/api/personalization/discover-assets',
        stage: 'validation',
        httpStatus: 400,
        safeErrorCode: 'MISSING_WEBSITE_URL',
        safeMessage: 'websiteUrl is required',
        correlationId,
      })
      return NextResponse.json({ error: 'websiteUrl is required' }, { status: 400 })
    }

    let websiteUrl: string
    try {
      websiteUrl = sanitizeWebsiteUrl(rawWebsiteUrl)
    } catch {
      clearTimeout(timeoutId)
      logPersonalization({
        route: '/api/personalization/discover-assets',
        stage: 'validation',
        httpStatus: 400,
        safeErrorCode: 'INVALID_WEBSITE_URL',
        safeMessage: 'Invalid website URL format',
        correlationId,
      })
      return NextResponse.json({ error: 'Invalid website URL format' }, { status: 400 })
    }

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || undefined
    const rateLimitKey = userId || clientIp || 'anon'
    const rateLimit = checkRateLimit(rateLimitKey)
    if (!rateLimit.allowed) {
      clearTimeout(timeoutId)
      logPersonalization({
        route: '/api/personalization/discover-assets',
        stage: 'rate-limit',
        httpStatus: 429,
        safeErrorCode: 'RATE_LIMIT_EXCEEDED',
        safeMessage: 'Rate limit exceeded. Please try again later.',
        correlationId,
      })
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
        logPersonalization({
          route: '/api/personalization/discover-assets',
          stage: 'cache',
          httpStatus: 200,
          correlationId,
          durationMs: Date.now() - startTime,
        })
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

    let fastResult: RawDiscoveryResult
    try {
      const fast = await runFastDiscovery({
        websiteUrl,
        maxPages: 1,
        maxImages: 20,
        openAiKey: openAiKey || undefined,
      })
      fastResult = {
        ...fast.result,
        discoveredAssets: fast.fastAssets,
      }
    } catch (fastErr) {
      clearTimeout(timeoutId)
      logPersonalization({
        route: '/api/personalization/discover-assets',
        stage: 'fast-discovery',
        httpStatus: 500,
        safeErrorCode: 'FAST_DISCOVERY_FAILED',
        safeMessage: 'Fast discovery failed',
        correlationId,
        durationMs: Date.now() - startTime,
      })
      return NextResponse.json({ error: 'Fast discovery failed' }, { status: 500 })
    }

    const job = await createDiscoveryJob({
      clerkUserId: userId || 'anon',
      websiteUrl,
      fastResult,
      telemetry: {
        providerAttempts: fastResult.providerAttempts,
        providerUsed: fastResult.providerUsed,
        pagesCrawled: fastResult.pagesCrawled,
        rawCandidates: fastResult.rawCandidates,
      },
    })

    const needsBrowser = (fastResult.discoveredAssets.filter((asset) => {
      const category = (asset as any).category
      return ['logo', 'product', 'service', 'completed_work', 'storefront', 'office', 'branded_vehicle', 'team', 'brand'].includes(category)
    }).length < 5) && process.env.ENABLE_BROWSER_DISCOVERY === 'true'
    const browserQueued = needsBrowser

    if (browserQueued) {
      const netlifyFnUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/.netlify/functions/personalization-browser-discovery`
      const priorityPages = [
        websiteUrl,
        ...fastResult.candidates
          .map((candidate: any) => candidate.sourcePage || candidate.url)
          .filter(Boolean),
      ]
      const uniquePriorityPages = Array.from(new Set(priorityPages)).slice(0, 4)

      fetch(netlifyFnUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          websiteUrl,
          priorityPages: uniquePriorityPages,
        }),
      }).catch((dispatchErr) => {
        console.error('[discover-assets] Failed to dispatch browser background job:', dispatchErr)
      })
    }

    clearTimeout(timeoutId)
    logPersonalization({
      route: '/api/personalization/discover-assets',
      stage: 'discovery',
      provider: fastResult.providerUsed,
      httpStatus: browserQueued ? 202 : 200,
      correlationId,
      durationMs: Date.now() - startTime,
    })

    return NextResponse.json(
      {
        ok: true,
        cached: false,
        status: browserQueued ? 'processing' : 'complete',
        providerUsed: fastResult.providerUsed,
        providerAttempted: fastResult.providerAttempted,
        discoveredAssets: fastResult.discoveredAssets,
        candidates: fastResult.candidates,
        count: fastResult.discoveredAssets.length,
        pagesCrawled: fastResult.pagesCrawled,
        rawCandidates: fastResult.rawCandidates,
        duration: fastResult.duration,
        socialProfiles: fastResult.socialProfiles,
        jobId: job.id,
        browserQueued,
      },
      { status: browserQueued ? 202 : 200 },
    )
  } catch (rawErr) {
    clearTimeout(timeoutId)
    const err: Error = rawErr instanceof Error ? rawErr : new Error('Unknown error')
    if (err.name === 'AbortError') {
      logPersonalization({
        route: '/api/personalization/discover-assets',
        stage: 'request',
        httpStatus: 504,
        safeErrorCode: 'TIMEOUT',
        safeMessage: 'Request timed out',
        correlationId,
        durationMs: Date.now() - startTime,
      })
      return NextResponse.json({ error: 'Request timed out' }, { status: 504 })
    }
    const anyErr = rawErr as any
    const nodeCode = anyErr && typeof anyErr.code === 'string' ? anyErr.code : undefined
    const safeCode = nodeCode || 'PERSONALIZATION_RUNTIME_ERROR'
    const message = String(sanitizeForLog(err.message))
    const status = /not allowed|Private|Invalid/i.test(message) ? 400 : 500
    logPersonalization({
      route: '/api/personalization/discover-assets',
      stage: 'unhandled',
      provider: 'ORCHESTRATOR',
      httpStatus: status,
      safeErrorCode: safeCode,
      safeMessage: message,
      correlationId,
      durationMs: Date.now() - startTime,
    })
    return NextResponse.json(
      { error: 'Personalization runtime error', code: safeCode, correlationId },
      { status, headers: { 'x-correlation-id': correlationId } },
    )
  }
}

export async function GET(req: NextRequest) {
  const correlationId = createCorrelationId(req)
  const jobId = req.nextUrl.searchParams.get('jobId')

  if (!jobId) {
    return NextResponse.json({ error: 'jobId is required' }, { status: 400 })
  }

  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const job = await getDiscoveryJobForUser(jobId, userId)
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  const safeTelemetry = job.telemetry_json
    ? (({ ...(job.telemetry_json as Record<string, unknown>), browserErrorMessage: undefined }) as Record<string, unknown>)
    : null

  const response: Record<string, unknown> = {
    id: job.id,
    status: job.status,
    websiteUrl: job.website_url,
    providerAttempts: (safeTelemetry as any)?.providerAttempts || [],
    pagesCrawled: (safeTelemetry as any)?.pagesCrawled ?? 0,
    created_at: job.created_at,
    started_at: job.started_at,
    completed_at: job.completed_at,
  }

  if (job.status === 'complete' || job.status === 'error') {
    response.browserQueued = false
    if (job.error_code) {
      response.errorCode = job.error_code
      response.errorMessage = job.error_message
    }
    if (job.final_result_json) {
      response.result = job.final_result_json
    } else if (job.fast_result_json) {
      response.result = job.fast_result_json
    }
  } else if (job.status === 'running') {
    response.browserQueued = true
  }

  if (safeTelemetry) {
    response.telemetry = safeTelemetry
  }

  return NextResponse.json(response)
}
