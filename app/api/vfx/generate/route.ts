import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getServerVFXClient, MUAPI_KEY_MISSING_ERROR } from '@/api/vfx'
import { validateGenerationInput } from '../_validation'
import { validateMuAPIKey, isMuapiKeyMissingError } from '../_helpers'
import { rateLimit, rateLimit429, resolveRateLimitKey } from '@/lib/rateLimit'

export const dynamic = "force-dynamic";

// Per-key rate limit: 10 requests / 60s, keyed by the resolved MuAPI apiKey.
// Tune via rateLimit(apiKey, { windowMs, max }).
const RATE_LIMIT_MAX = 10
const RATE_LIMIT_WINDOW_MS = 60_000

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validationErrors = validateGenerationInput(body)

    if (validationErrors.length > 0) {
      return NextResponse.json({ error: validationErrors.join('; ') }, { status: 400 })
    }

    const {
      prompt,
      image_url,
      effect,
      aspect_ratio = '16:9',
      resolution = '480p',
      quality = 'medium',
      duration = 5,
    } = body

    // BYOK: the caller's OWN MuAPI key only — request header first, then the
    // Clerk session's stored key. There is no server fallback, so a missing
    // key is a 400 naming Settings, never an operator-billed generation.
    const apiKey = await validateMuAPIKey(req)

    // Rate limit by authenticated identity, never by client-supplied key
    // material (a caller could otherwise rotate keys to evade the limit).
    const { userId } = await auth()
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      undefined
    const limit = rateLimit(resolveRateLimitKey(userId, clientIp), {
      windowMs: RATE_LIMIT_WINDOW_MS,
      max: RATE_LIMIT_MAX,
    })
    if (!limit.allowed) {
      return rateLimit429(limit.retryAfterMs)
    }

    const client = getServerVFXClient(apiKey)

    const result = await client.generateVFX({
      prompt,
      image_url,
      effect,
      aspect_ratio,
      resolution,
      quality,
      duration: Number(duration),
    })

    return NextResponse.json({
      request_id: result.request_id,
      status: result.status,
      message: result.message,
    })
  } catch (err: unknown) {
    // Missing user key is user-actionable (400), not an internal failure.
    if (isMuapiKeyMissingError(err)) {
      return NextResponse.json({ error: MUAPI_KEY_MISSING_ERROR }, { status: 400 })
    }
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[VFX generate]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
