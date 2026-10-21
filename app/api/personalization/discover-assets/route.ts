import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import type { ImageCandidate, SocialProfileSource } from '@/server/discoveryProvider'
import type { DiscoveredAsset } from '@/server/discoverAssets'
import { logPersonalization, createCorrelationId, sanitizeForLog } from '@/server/personalizationLog'
import { validatePersonalizationEnv } from '@/server/envValidation'
import {
  createDiscoveryJob,
  getDiscoveryJobForUser,
  updateDiscoveryJob,
  type DiscoveryJobRow,
} from '@/server/discoveryJobs'
import { buildDiscoveryJobResponse } from '@/server/discoveryJobResponse'
import { runFastDiscovery } from '@/server/discoveryOrchestrator'
import { assertSafeUrlString } from '@/lib/networkSafety'
import { DISCOVERY_SYNC_BUDGET_MS } from '@/server/discoveryPolicy'

export const dynamic = "force-dynamic";

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

/**
 * Validates the submitted website URL.
 *
 * The gate is the shared one (`src/lib/networkSafety.ts`), which is
 * strictly stronger than the hand-rolled list this route used to carry: it
 * covers every numeric spelling of a private address (decimal, hex, octal,
 * short form), the link-local and CGNAT ranges, the cloud metadata hosts,
 * the IPv6 unique-local and link-local ranges, the IPv4-mapped IPv6 forms and
 * the reserved local suffixes. A schemeless input is read as `https://`
 * rather than rejected, so the URL a business directory hands over ("joes.com")
 * is usable.
 */
function sanitizeWebsiteUrl(url: string): string {
  const trimmed = url.trim()
  // Reject instead of silently truncating: a truncated URL is a DIFFERENT URL
  // than the caller asked for, and must never be the one we fetch.
  if (trimmed.length > MAX_WEBSITE_URL_LENGTH) {
    throw new Error('Website URL exceeds maximum length')
  }
  return assertSafeUrlString(trimmed)
}

function sanitizeErrorMessage(message: string): string {
  const safe = message
    .replace(/sk-[a-zA-Z0-9]{20,}/g, '[REDACTED]')
    .replace(/AIza[a-zA-Z0-9_-]{35}/g, '[REDACTED]')
    .replace(/Bearer\s+[a-zA-Z0-9._-]+/g, 'Bearer [REDACTED]')
  return safe
}

/**
 * The Clerk session token of the current request.
 *
 * The background worker (`personalization-browser-discovery`) verifies the
 * caller server-side, so the dispatch has to carry the session. Clerk names
 * the cookie `__session` on a single-domain instance and `__session_<suffix>`
 * on a multi-domain one, so both spellings are accepted.
 */
function extractClerkSessionToken(req: NextRequest): string | null {
  const authorization = req.headers.get('authorization')
  if (authorization) {
    const match = /^Bearer\s+(.+)$/i.exec(authorization.trim())
    if (match) return match[1].trim()
  }

  for (const cookie of req.cookies.getAll()) {
    if (cookie.name === '__session' || cookie.name.startsWith('__session_')) {
      if (cookie.value) return cookie.value
    }
  }
  return null
}

/**
 * The absolute URL of the background worker.
 *
 * Returns null when the deployment has no public base URL, because a
 * relative URL is not a URL `fetch` can resolve. The old code built
 * `/.netlify/functions/...` in that case, the fetch threw, the error was
 * logged and the job was left in `running` for ever.
 */
function backgroundWorkerUrl(): string | null {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/+$/, '')
  if (!base) return null
  return `${base}/.netlify/functions/personalization-browser-discovery`
}

/**
 * Hands the rest of the discovery to the background worker.
 *
 * Returns true when the worker accepted the job. A false return means the
 * job has to be finished by the caller, because nothing else is going to
 * finish it.
 */
async function dispatchBackgroundJob(
  req: NextRequest,
  jobId: string,
  websiteUrl: string,
  priorityPages: string[],
): Promise<{ dispatched: boolean; reason?: string }> {
  const workerUrl = backgroundWorkerUrl()
  if (!workerUrl) {
    return { dispatched: false, reason: 'NO_BACKGROUND_WORKER_URL' }
  }

  const sessionToken = extractClerkSessionToken(req)
  if (!sessionToken) {
    return { dispatched: false, reason: 'NO_SESSION_TOKEN' }
  }

  try {
    const response = await fetch(workerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({
        jobId,
        websiteUrl,
        priorityPages: priorityPages.slice(0, 4),
      }),
    })

    if (!response.ok) {
      return { dispatched: false, reason: `BACKGROUND_WORKER_${response.status}` }
    }
    return { dispatched: true }
  } catch (err) {
    return {
      dispatched: false,
      reason: `BACKGROUND_WORKER_UNREACHABLE: ${err instanceof Error ? err.message : 'unknown'}`,
    }
  }
}

export async function POST(req: NextRequest) {
  const correlationId = createCorrelationId(req)
  const startTime = Date.now()

  try {
    const envCheck = validatePersonalizationEnv()
    if (!envCheck.valid) {
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
    // S7: anonymous callers used to fall through to `clerkUserId: userId || 'anon'`,
    // which persisted discovery jobs under a single shared anonymous identity.
    // Discovery is an authenticated feature: no session, no job.
    if (!userId) {
      logPersonalization({
        route: '/api/personalization/discover-assets',
        stage: 'auth',
        httpStatus: 401,
        safeErrorCode: 'UNAUTHORIZED',
        safeMessage: 'Missing authenticated session',
        correlationId,
      })
      return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
    }
    const body = await req.json().catch(() => ({}))
    const rawWebsiteUrl = typeof body?.websiteUrl === 'string' ? body.websiteUrl : ''
    const requestedTestMode = typeof body?.testMode === 'boolean' ? body.testMode : false
    const testMode = isTestModeAllowed ? requestedTestMode : false

    if (!rawWebsiteUrl) {
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

    // The job row is created BEFORE the crawl starts. The caller gets a job
    // id it can poll even when the crawl outlives the synchronous budget,
    // and the row is the proof that the job belongs to this caller.
    let job: DiscoveryJobRow
    try {
      job = await createDiscoveryJob({
        clerkUserId: userId,
        websiteUrl,
        telemetry: { startedAt: new Date().toISOString() },
      })
    } catch (err) {
      logPersonalization({
        route: '/api/personalization/discover-assets',
        stage: 'job-create',
        httpStatus: 500,
        safeErrorCode: 'JOB_CREATE_FAILED',
        safeMessage: 'Failed to create discovery job',
        correlationId,
        durationMs: Date.now() - startTime,
      })
      return NextResponse.json({ error: 'Failed to create discovery job' }, { status: 500 })
    }

    if (!testMode) {
      const cached = discoveryCache.get(cacheKey)
      if (cached && cached.expiresAt > Date.now()) {
        // A cache hit still gets a job: the contract is that every accepted
        // discovery request hands the caller a job id it can poll, whatever
        // produced the assets.
        await updateDiscoveryJob(job.id, {
          status: 'complete',
          completedAt: new Date().toISOString(),
          fastResult: cached.result,
          finalResult: cached.result,
          telemetry: {
            providerAttempts: cached.result.providerAttempts,
            providerUsed: cached.result.providerUsed,
            pagesCrawled: cached.result.pagesCrawled,
            rawCandidates: cached.result.rawCandidates,
            cached: true,
          },
        }).catch((persistErr) => {
          console.error('[discover-assets] Failed to persist job state:', persistErr)
        })

        logPersonalization({
          route: '/api/personalization/discover-assets',
          stage: 'cache',
          httpStatus: 202,
          correlationId,
          durationMs: Date.now() - startTime,
        })
        return NextResponse.json(
          {
            ok: true,
            cached: true,
            status: 'complete',
            providerUsed: cached.result.providerUsed,
            providerAttempted: cached.result.providerAttempted,
            discoveredAssets: cached.result.discoveredAssets,
            candidates: cached.result.candidates,
            count: cached.result.discoveredAssets.length,
            pagesCrawled: cached.result.pagesCrawled,
            rawCandidates: cached.result.rawCandidates,
            duration: cached.result.duration,
            socialProfiles: cached.result.socialProfiles,
            jobId: job.id,
            browserQueued: false,
          },
          { status: 202 },
        )
      }
    }

    const startedAt = new Date().toISOString()
    await updateDiscoveryJob(job.id, { status: 'running', startedAt }).catch((persistErr) => {
      console.error('[discover-assets] Failed to persist job state:', persistErr)
    })

    // The synchronous phase is bounded. Everything the crawl does — the page
    // fetches, the sitemap fetches, the image probes — is clamped to the
    // remaining budget, so a slow site can never hold this request open.
    const deadlineAt = Date.now() + DISCOVERY_SYNC_BUDGET_MS

    let fastResult: RawDiscoveryResult | null = null
    let fastError: string | null = null
    // The browser phase is an escalation: it only runs when the free layers
    // could not answer on their own. The default is therefore "no browser",
    // and ENABLE_BROWSER_DISCOVERY=false switches the escalation off
    // entirely so an operator can keep a deployment on the free pipeline.
    let needsBrowser = false
    try {
      const fast = await runFastDiscovery({
        websiteUrl,
        maxPages: 4,
        maxImages: 20,
        deadlineAt,
      })
      needsBrowser = fast.needsBrowser && process.env.ENABLE_BROWSER_DISCOVERY !== 'false'
      fastResult = {
        ...fast.result,
        discoveredAssets: fast.fastAssets,
      }
    } catch (fastErr) {
      fastError = fastErr instanceof Error ? fastErr.message : String(fastErr)
    }

    const discoveredAssets = fastResult?.discoveredAssets || []

    if (fastResult && !needsBrowser) {
      // The free layers answered within the budget: the job is done and the
      // caller gets the assets straight away.
      await updateDiscoveryJob(job.id, {
        status: 'complete',
        completedAt: new Date().toISOString(),
        fastResult,
        finalResult: fastResult,
        telemetry: {
          providerAttempts: fastResult.providerAttempts,
          providerUsed: fastResult.providerUsed,
          pagesCrawled: fastResult.pagesCrawled,
          rawCandidates: fastResult.rawCandidates,
        },
      }).catch((persistErr) => {
        console.error('[discover-assets] Failed to persist job state:', persistErr)
      })

      logPersonalization({
        route: '/api/personalization/discover-assets',
        stage: 'discovery',
        provider: fastResult.providerUsed,
        httpStatus: 202,
        correlationId,
        durationMs: Date.now() - startTime,
      })

      // 202 in every case: a discovery JOB was accepted, and the job id is
      // the handle the caller polls. The body says whether the free layers
      // already answered (`complete`) or whether the browser phase is still
      // running (`processing`).
      return NextResponse.json(
        {
          ok: true,
          cached: false,
          status: 'complete',
          providerUsed: fastResult.providerUsed,
          providerAttempted: fastResult.providerAttempted,
          discoveredAssets,
          candidates: fastResult.candidates,
          count: discoveredAssets.length,
          pagesCrawled: fastResult.pagesCrawled,
          rawCandidates: fastResult.rawCandidates,
          duration: fastResult.duration,
          socialProfiles: fastResult.socialProfiles,
          jobId: job.id,
          browserQueued: false,
        },
        { status: 202 },
      )
    }

    // The free layers did not answer (or did not answer in time). The job
    // continues out of band and the caller polls for it.
    await updateDiscoveryJob(job.id, {
      status: 'running',
      fastResult: fastResult ?? undefined,
      telemetry: {
        providerAttempts: fastResult?.providerAttempts || [],
        providerUsed: fastResult?.providerUsed,
        pagesCrawled: fastResult?.pagesCrawled ?? 0,
        rawCandidates: fastResult?.rawCandidates ?? 0,
        fastError: fastError ?? null,
      },
    }).catch((persistErr) => {
      console.error('[discover-assets] Failed to persist job state:', persistErr)
    })

    const priorityPages = Array.from(
      new Set([
        websiteUrl,
        ...(fastResult?.candidates || []).map((candidate) => candidate.sourcePage).filter(Boolean),
      ]),
    ).slice(0, 4)

    const dispatch = await dispatchBackgroundJob(req, job.id, websiteUrl, priorityPages)

    if (!dispatch.dispatched) {
      // Nothing is going to finish this job. It has to reach a terminal state
      // here, otherwise the caller polls a job that stays `running` for ever
      // and the UI reports a timeout.
      const hasAssets = discoveredAssets.length > 0
      await updateDiscoveryJob(job.id, {
        status: hasAssets ? 'complete' : 'error',
        completedAt: new Date().toISOString(),
        finalResult: fastResult ?? undefined,
        errorCode: hasAssets ? undefined : (dispatch.reason || 'BACKGROUND_DISPATCH_FAILED'),
        errorMessage: hasAssets ? undefined : (dispatch.reason || 'Background discovery could not be started'),
        telemetry: {
          providerAttempts: fastResult?.providerAttempts || [],
          providerUsed: fastResult?.providerUsed,
          pagesCrawled: fastResult?.pagesCrawled ?? 0,
          rawCandidates: fastResult?.rawCandidates ?? 0,
          backgroundDispatchReason: dispatch.reason,
        },
      }).catch((persistErr) => {
        console.error('[discover-assets] Failed to persist job state:', persistErr)
      })

      logPersonalization({
        route: '/api/personalization/discover-assets',
        stage: 'background-dispatch',
        httpStatus: 202,
        safeErrorCode: dispatch.reason,
        safeMessage: 'Background discovery could not be started',
        correlationId,
        durationMs: Date.now() - startTime,
      })

      if (hasAssets) {
        return NextResponse.json(
          {
            ok: true,
            cached: false,
            status: 'complete',
            providerUsed: fastResult?.providerUsed,
            providerAttempted: fastResult?.providerAttempted,
            discoveredAssets,
            candidates: fastResult?.candidates || [],
            count: discoveredAssets.length,
            pagesCrawled: fastResult?.pagesCrawled ?? 0,
            rawCandidates: fastResult?.rawCandidates ?? 0,
            duration: fastResult?.duration ?? 0,
            socialProfiles: fastResult?.socialProfiles || [],
            jobId: job.id,
            browserQueued: false,
          },
          { status: 202 },
        )
      }

      return NextResponse.json(
        {
          ok: true,
          cached: false,
          status: 'error',
          jobId: job.id,
          browserQueued: false,
          error: 'Discovery could not be completed',
          discoveredAssets: [],
          count: 0,
        },
        { status: 202 },
      )
    }

    logPersonalization({
      route: '/api/personalization/discover-assets',
      stage: 'discovery',
      provider: fastResult?.providerUsed,
      httpStatus: 202,
      correlationId,
      durationMs: Date.now() - startTime,
    })

    return NextResponse.json(
      {
        ok: true,
        cached: false,
        status: 'processing',
        providerUsed: fastResult?.providerUsed,
        providerAttempted: fastResult?.providerAttempted,
        discoveredAssets,
        candidates: fastResult?.candidates || [],
        count: discoveredAssets.length,
        pagesCrawled: fastResult?.pagesCrawled ?? 0,
        rawCandidates: fastResult?.rawCandidates ?? 0,
        duration: fastResult?.duration ?? 0,
        socialProfiles: fastResult?.socialProfiles || [],
        jobId: job.id,
        browserQueued: true,
      },
      { status: 202 },
    )
  } catch (rawErr) {
    const err: Error = rawErr instanceof Error ? rawErr : new Error('Unknown error')
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

  // Owner-scoped lookup: a job that belongs to somebody else is not found.
  const job = await getDiscoveryJobForUser(jobId, userId)
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  return NextResponse.json(buildDiscoveryJobResponse(job))
}
