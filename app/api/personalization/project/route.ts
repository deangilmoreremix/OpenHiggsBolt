import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase'
import { logPersonalization, createCorrelationId } from '@/server/personalizationLog'
import { requirePersonalizationEnv } from '@/server/envValidation'

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

    await supabase.rpc('set_config', {
      setting: 'app.clerk_user_id',
      value: userId,
      is_local: true,
    })

    if (list === 'true') {
      const { data, error } = await supabase
        .from('personalization_projects')
        .select('id, source, client, output_type, mode, status, created_at, updated_at')
        .order('updated_at', { ascending: false })
        .limit(50)

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
      .from('personalization_projects')
      .select('*')
      .eq('id', projectId)
      .eq('clerk_user_id', userId)
      .single()

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

    logPersonalization({
      route: '/api/personalization/project',
      stage: 'db-fetch',
      provider: 'supabase',
      httpStatus: 200,
      correlationId,
      durationMs: Date.now() - startTime,
    })

    return NextResponse.json({ project: data })
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

    await supabase.rpc('set_config', {
      setting: 'app.clerk_user_id',
      value: userId,
      is_local: true,
    })

    const row = {
      clerk_user_id: userId,
      source,
      client,
      assets,
      prompt,
      output_type: typeof project.outputType === 'string' ? project.outputType : 'prompt',
      mode: typeof project.mode === 'string' ? project.mode : null,
      generation,
      status: typeof project.status === 'string' ? project.status : 'idle',
      error_message: typeof project.errorMessage === 'string' ? project.errorMessage : null,
      updated_at: new Date().toISOString(),
    }

    let data
    if (projectId) {
      const { data: updated, error } = await supabase
        .from('personalization_projects')
        .update(row)
        .eq('id', projectId)
        .eq('clerk_user_id', userId)
        .select('id, created_at, updated_at')
        .single()

      clearTimeout(timeoutId)

      if (error) {
        logPersonalization({
          route: '/api/personalization/project',
          stage: 'db-update',
          provider: 'supabase',
          httpStatus: 500,
          safeErrorCode: 'DB_UPDATE_FAILED',
          safeMessage: error.message,
          correlationId,
          durationMs: Date.now() - startTime,
        })
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      data = updated
    } else {
      const { data: inserted, error } = await supabase
        .from('personalization_projects')
        .insert(row)
        .select('id, created_at, updated_at')
        .single()

      clearTimeout(timeoutId)

      if (error) {
        logPersonalization({
          route: '/api/personalization/project',
          stage: 'db-insert',
          provider: 'supabase',
          httpStatus: 500,
          safeErrorCode: 'DB_INSERT_FAILED',
          safeMessage: error.message,
          correlationId,
          durationMs: Date.now() - startTime,
        })
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      data = inserted
    }

    logPersonalization({
      route: '/api/personalization/project',
      stage: projectId ? 'db-update' : 'db-insert',
      provider: 'supabase',
      httpStatus: 200,
      correlationId,
      durationMs: Date.now() - startTime,
    })

    return NextResponse.json({ ok: true, project: data })
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

    await supabase.rpc('set_config', {
      setting: 'app.clerk_user_id',
      value: userId,
      is_local: true,
    })

    const { error } = await supabase
      .from('personalization_projects')
      .delete()
      .eq('id', projectId)
      .eq('clerk_user_id', userId)

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
