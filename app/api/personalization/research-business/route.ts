import { NextRequest, NextResponse } from 'next/server'
import { logPersonalization, createCorrelationId, sanitizeForLog } from '@/server/personalizationLog'
import { validatePersonalizationEnv } from '@/server/envValidation'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const correlationId = createCorrelationId(req)
  const startTime = Date.now()

  try {
    const envCheck = validatePersonalizationEnv()
    if (!envCheck.valid) {
      logPersonalization({
        route: '/api/personalization/research-business',
        stage: 'env-validation',
        httpStatus: 500,
        safeErrorCode: 'ENV_MISSING',
        safeMessage: `Missing required env vars: ${envCheck.missingRequired.join(', ')}`,
        correlationId,
      })
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const body = await req.json().catch(() => ({}))
    const websiteUrl = typeof body?.websiteUrl === 'string' ? body.websiteUrl.trim() : ''

    if (!websiteUrl) {
      logPersonalization({
        route: '/api/personalization/research-business',
        stage: 'validation',
        httpStatus: 400,
        safeErrorCode: 'MISSING_WEBSITE_URL',
        safeMessage: 'websiteUrl is required',
        correlationId,
      })
      return NextResponse.json({ error: 'websiteUrl is required' }, { status: 400 })
    }

    const { researchBusiness } = await import('@/server/businessDiscovery/researchProvider')
    const result = await researchBusiness(websiteUrl)

    logPersonalization({
      route: '/api/personalization/research-business',
      stage: 'research',
      provider: result.reachable ? 'STATIC_HTTP' : 'STATIC_HTTP_FAILED',
      httpStatus: 200,
      correlationId,
      durationMs: Date.now() - startTime,
    })

    return NextResponse.json({
      ok: true,
      research: result,
    })
  } catch (rawErr) {
    const err: Error = rawErr instanceof Error ? rawErr : new Error('Unknown error')
    const anyErr = rawErr as any
    const nodeCode = anyErr && typeof anyErr.code === 'string' ? anyErr.code : undefined
    const safeCode = nodeCode || 'PERSONALIZATION_RUNTIME_ERROR'
    const message = String(sanitizeForLog(err.message))
    const status = /not allowed|Private|Invalid/i.test(message) ? 400 : 500
    logPersonalization({
      route: '/api/personalization/research-business',
      stage: 'unhandled',
      provider: 'STATIC_HTTP',
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
