import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase'
import { logPersonalization, createCorrelationId } from '@/server/personalizationLog'
import { requirePersonalizationEnv } from '@/server/envValidation'
import { requireApiEntitlement, entitlementForbiddenResponse } from '@/access/apiRequireEntitlement'
import { ENTITLEMENTS } from '@/access/entitlements'

export const runtime = 'nodejs'

const MAX_PAYLOAD_SIZE = 5_000_000
const MAX_STRING_LENGTH = 500_000

function sanitizeValue(value: unknown, maxLength = MAX_STRING_LENGTH): unknown {
  if (typeof value === 'string') {
    return value.length > maxLength ? value.slice(0, maxLength) + '...' : value
  }
  if (Array.isArray(value)) {
    return value.slice(0, 1_000).map((item) => sanitizeValue(item, maxLength))
  }
  if (value && typeof value === 'object') {
    const sanitized: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      sanitized[key] = sanitizeValue(val, maxLength)
    }
    return sanitized
  }
  return value
}

// Playwright offline-test bypass (mirrors middleware.js and
// app/api/v1/[...slug]/route.ts): never honored in production, and only for
// the exact cookie value the dev-login route sets. Clerk itself is skipped by
// middleware in that case, so the entitlement gate must skip it too.
function isDevBypass(req: NextRequest): boolean {
  if (process.env.NODE_ENV === 'production') return false
  return req.cookies.get('__e2e_auth_bypass')?.value === '1'
}

export async function GET(req: NextRequest) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30_000)
  const correlationId = createCorrelationId(req)
  const startTime = Date.now()

  try {
    const envCheck = requirePersonalizationEnv()
    if (!envCheck.valid) {
      clearTimeout(timeoutId)
      logPersonalization({
        route: '/api/personalization/project',
        stage: 'env-validation',
        httpStatus: 500,
        safeErrorCode: 'ENV_MISSING',
        safeMessage: `Missing required env vars: ${envCheck.missingRequired.join(', ')}`,
        correlationId,
      })
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const { userId } = await auth()
    if (!userId) {
      clearTimeout(timeoutId)
      logPersonalization({
        route: '/api/personalization/project',
        stage: 'auth',
        httpStatus: 401,
        safeErrorCode: 'UNAUTHENTICATED',
        safeMessage: 'No authenticated user',
        correlationId,
      })
      return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
    }

    const projectId = req.nextUrl.searchParams.get('id')
    const list = req.nextUrl.searchParams.get('list')

    const supabase = createServerClient()

    if (list === 'true') {
      // The identity is passed as an RPC argument and set as the GUC inside
      // the same transaction, so the RLS predicate and the where-clause agree.
      const { data, error } = await supabase
        .rpc('personalization_saved_projects_list', { p_clerk_user_id: userId })

      clearTimeout(timeoutId)

      if (error) {
        logPersonalization({
          route: '/api/personalization/project',
          stage: 'db-list',
          provider: 'supabase',
          httpStatus: 500,
          safeErrorCode: 'DB_LIST_FAILED',
          safeMessage: error.message,
          correlationId,
          durationMs: Date.now() - startTime,
        })
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      logPersonalization({
        route: '/api/personalization/project',
        stage: 'db-list',
        provider: 'supabase',
        httpStatus: 200,
        correlationId,
        durationMs: Date.now() - startTime,
      })

      return NextResponse.json({ projects: data || [] })
    }

    if (!projectId) {
      clearTimeout(timeoutId)
      logPersonalization({
        route: '/api/personalization/project',
        stage: 'validation',
        httpStatus: 400,
        safeErrorCode: 'MISSING_PROJECT_ID',
        safeMessage: 'Missing project id parameter',
        correlationId,
      })
      return NextResponse.json({ error: 'Missing project id parameter' }, { status: 400 })
    }

    const { data, error } = await supabase
      .rpc('personalization_saved_projects_get', {
        p_id: projectId,
        p_clerk_user_id: userId,
      })

    clearTimeout(timeoutId)

    if (error) {
      logPersonalization({
        route: '/api/personalization/project',
        stage: 'db-fetch',
        provider: 'supabase',
        httpStatus: error.code === 'PGRST116' ? 404 : 500,
        safeErrorCode: error.code === 'PGRST116' ? 'PROJECT_NOT_FOUND' : 'DB_FETCH_FAILED',
        safeMessage: error.message,
        correlationId,
        durationMs: Date.now() - startTime,
      })
      return NextResponse.json(
        { error: error.code === 'PGRST116' ? 'Project not found' : error.message },
        { status: error.code === 'PGRST116' ? 404 : 500 }
      )
    }

    // `returns setof` yields an array; a caller probing someone else's id gets
    // an empty set, which is reported as 404 rather than as a 403 that would
    // confirm the row exists.
    const project = Array.isArray(data) ? data[0] : data
    if (!project) {
      logPersonalization({
        route: '/api/personalization/project',
        stage: 'db-fetch',
        provider: 'supabase',
        httpStatus: 404,
        safeErrorCode: 'PROJECT_NOT_FOUND',
        safeMessage: 'No project for this owner',
        correlationId,
        durationMs: Date.now() - startTime,
      })
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    logPersonalization({
      route: '/api/personalization/project',
      stage: 'db-fetch',
      provider: 'supabase',
      httpStatus: 200,
      correlationId,
      durationMs: Date.now() - startTime,
    })

    return NextResponse.json({ project })
  } catch (err) {
    clearTimeout(timeoutId)
    if (err instanceof Error && err.name === 'AbortError') {
      logPersonalization({
        route: '/api/personalization/project',
        stage: 'request',
        httpStatus: 504,
        safeErrorCode: 'TIMEOUT',
        safeMessage: 'Request timed out',
        correlationId,
        durationMs: Date.now() - startTime,
      })
      return NextResponse.json({ error: 'Request timed out' }, { status: 504 })
    }
    const message = err instanceof Error ? err.message : 'Unknown error'
    logPersonalization({
      route: '/api/personalization/project',
      stage: 'unhandled',
      httpStatus: 500,
      safeErrorCode: 'UNEXPECTED_ERROR',
      safeMessage: message,
      correlationId,
      durationMs: Date.now() - startTime,
    })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!isDevBypass(req)) {
    const entitlementCheck = await requireApiEntitlement(ENTITLEMENTS.SMARTVIDEO_GO)
    if (!entitlementCheck.allowed) {
      if (entitlementCheck.status === 401) {
        return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
      }
      return entitlementForbiddenResponse(ENTITLEMENTS.SMARTVIDEO_GO)
    }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30_000)
  const correlationId = createCorrelationId(req)
  const startTime = Date.now()

  try {
    const envCheck = requirePersonalizationEnv()
    if (!envCheck.valid) {
      clearTimeout(timeoutId)
      logPersonalization({
        route: '/api/personalization/project',
        stage: 'env-validation',
        httpStatus: 500,
        safeErrorCode: 'ENV_MISSING',
        safeMessage: `Missing required env vars: ${envCheck.missingRequired.join(', ')}`,
        correlationId,
      })
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const { userId } = await auth()
    if (!userId) {
      clearTimeout(timeoutId)
      logPersonalization({
        route: '/api/personalization/project',
        stage: 'auth',
        httpStatus: 401,
        safeErrorCode: 'UNAUTHENTICATED',
        safeMessage: 'No authenticated user',
        correlationId,
      })
      return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
    }

    const contentLength = req.headers.get('content-length')
    if (contentLength && Number(contentLength) > MAX_PAYLOAD_SIZE) {
      clearTimeout(timeoutId)
      logPersonalization({
        route: '/api/personalization/project',
        stage: 'validation',
        httpStatus: 413,
        safeErrorCode: 'PAYLOAD_TOO_LARGE',
        safeMessage: 'Payload exceeds maximum size',
        correlationId,
      })
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      clearTimeout(timeoutId)
      logPersonalization({
        route: '/api/personalization/project',
        stage: 'parse-body',
        httpStatus: 400,
        safeErrorCode: 'INVALID_JSON',
        safeMessage: 'Invalid JSON body',
        correlationId,
      })
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const rawProject = typeof (body as { project?: unknown } | null | undefined)?.project === 'object'
      ? ((body as { project: unknown }).project)
      : body

    if (!rawProject || typeof rawProject !== 'object') {
      clearTimeout(timeoutId)
      logPersonalization({
        route: '/api/personalization/project',
        stage: 'validation',
        httpStatus: 400,
        safeErrorCode: 'INVALID_PAYLOAD',
        safeMessage: 'Missing project object',
        correlationId,
      })
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const project = sanitizeValue(rawProject) as Record<string, unknown>
    const projectId = typeof project.id === 'string' ? project.id : undefined

    const source = sanitizeValue(project.source || {}) as Record<string, unknown>
    const client = sanitizeValue(project.client || {}) as Record<string, unknown>
    const assets = sanitizeValue(project.assets || {}) as Record<string, unknown>
    const prompt = sanitizeValue(project.prompt || {}) as Record<string, unknown>
    const generation = sanitizeValue(project.generation || {}) as Record<string, unknown>

    const supabase = createServerClient()

    // Upsert through the SECURITY DEFINER RPC: the identity and the write share
    // one transaction, and ownership of an existing row is re-asserted inside
    // the database rather than trusted from the caller.
    const { data: upserted, error } = await supabase
      .rpc('personalization_saved_projects_upsert', {
        p_id: projectId ?? null,
        p_clerk_user_id: userId,
        p_source: source as never,
        p_client: client as never,
        p_assets: assets as never,
        p_prompt: prompt as never,
        p_generation: generation as never,
        p_output_type: typeof project.outputType === 'string' ? project.outputType : 'prompt',
        p_mode: typeof project.mode === 'string' ? project.mode : null,
        p_status: typeof project.status === 'string' ? project.status : 'idle',
        p_error_message: typeof project.errorMessage === 'string' ? project.errorMessage : null,
      })

    clearTimeout(timeoutId)

    if (error) {
      // 42501 is the function's "not owned by caller" error: report 404 so a
      // caller probing another user's id cannot distinguish it from absent.
      const notOwned = error.code === '42501'
      logPersonalization({
        route: '/api/personalization/project',
        stage: 'db-update',
        provider: 'supabase',
        httpStatus: notOwned ? 404 : 500,
        safeErrorCode: notOwned ? 'PROJECT_NOT_FOUND' : 'DB_UPDATE_FAILED',
        safeMessage: error.message,
        correlationId,
        durationMs: Date.now() - startTime,
      })
      return NextResponse.json(
        { error: notOwned ? 'Project not found' : error.message },
        { status: notOwned ? 404 : 500 }
      )
    }

    logPersonalization({
      route: '/api/personalization/project',
      stage: projectId ? 'db-update' : 'db-insert',
      provider: 'supabase',
      httpStatus: 200,
      correlationId,
      durationMs: Date.now() - startTime,
    })

    return NextResponse.json({ ok: true, project: upserted })
  } catch (err) {
    clearTimeout(timeoutId)
    if (err instanceof Error && err.name === 'AbortError') {
      logPersonalization({
        route: '/api/personalization/project',
        stage: 'request',
        httpStatus: 504,
        safeErrorCode: 'TIMEOUT',
        safeMessage: 'Request timed out',
        correlationId,
        durationMs: Date.now() - startTime,
      })
      return NextResponse.json({ error: 'Request timed out' }, { status: 504 })
    }
    const message = err instanceof Error ? err.message : 'Unknown error'
    logPersonalization({
      route: '/api/personalization/project',
      stage: 'unhandled',
      httpStatus: 500,
      safeErrorCode: 'UNEXPECTED_ERROR',
      safeMessage: message,
      correlationId,
      durationMs: Date.now() - startTime,
    })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  if (!isDevBypass(req)) {
    const entitlementCheck = await requireApiEntitlement(ENTITLEMENTS.SMARTVIDEO_GO)
    if (!entitlementCheck.allowed) {
      if (entitlementCheck.status === 401) {
        return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
      }
      return entitlementForbiddenResponse(ENTITLEMENTS.SMARTVIDEO_GO)
    }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30_000)
  const correlationId = createCorrelationId(req)
  const startTime = Date.now()

  try {
    const envCheck = requirePersonalizationEnv()
    if (!envCheck.valid) {
      clearTimeout(timeoutId)
      logPersonalization({
        route: '/api/personalization/project',
        stage: 'env-validation',
        httpStatus: 500,
        safeErrorCode: 'ENV_MISSING',
        safeMessage: `Missing required env vars: ${envCheck.missingRequired.join(', ')}`,
        correlationId,
      })
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const { userId } = await auth()
    if (!userId) {
      clearTimeout(timeoutId)
      logPersonalization({
        route: '/api/personalization/project',
        stage: 'auth',
        httpStatus: 401,
        safeErrorCode: 'UNAUTHENTICATED',
        safeMessage: 'No authenticated user',
        correlationId,
      })
      return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
    }

    const projectId = req.nextUrl.searchParams.get('id')
    if (!projectId) {
      clearTimeout(timeoutId)
      logPersonalization({
        route: '/api/personalization/project',
        stage: 'validation',
        httpStatus: 400,
        safeErrorCode: 'MISSING_PROJECT_ID',
        safeMessage: 'Missing project id parameter',
        correlationId,
      })
      return NextResponse.json({ error: 'Missing project id parameter' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Ownership is asserted inside the function; a row owned by another user
    // deletes zero rows and reports false, which the route treats as 404.
    const { data: deleted, error } = await supabase
      .rpc('personalization_saved_projects_delete', {
        p_id: projectId,
        p_clerk_user_id: userId,
      })

    clearTimeout(timeoutId)

    if (error) {
      logPersonalization({
        route: '/api/personalization/project',
        stage: 'db-delete',
        provider: 'supabase',
        httpStatus: 500,
        safeErrorCode: 'DB_DELETE_FAILED',
        safeMessage: error.message,
        correlationId,
        durationMs: Date.now() - startTime,
      })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!deleted) {
      logPersonalization({
        route: '/api/personalization/project',
        stage: 'db-delete',
        provider: 'supabase',
        httpStatus: 404,
        safeErrorCode: 'PROJECT_NOT_FOUND',
        safeMessage: 'No project deleted for this owner',
        correlationId,
        durationMs: Date.now() - startTime,
      })
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    logPersonalization({
      route: '/api/personalization/project',
      stage: 'db-delete',
      provider: 'supabase',
      httpStatus: 200,
      correlationId,
      durationMs: Date.now() - startTime,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    clearTimeout(timeoutId)
    if (err instanceof Error && err.name === 'AbortError') {
      logPersonalization({
        route: '/api/personalization/project',
        stage: 'request',
        httpStatus: 504,
        safeErrorCode: 'TIMEOUT',
        safeMessage: 'Request timed out',
        correlationId,
        durationMs: Date.now() - startTime,
      })
      return NextResponse.json({ error: 'Request timed out' }, { status: 504 })
    }
    const message = err instanceof Error ? err.message : 'Unknown error'
    logPersonalization({
      route: '/api/personalization/project',
      stage: 'unhandled',
      httpStatus: 500,
      safeErrorCode: 'UNEXPECTED_ERROR',
      safeMessage: message,
      correlationId,
      durationMs: Date.now() - startTime,
    })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
