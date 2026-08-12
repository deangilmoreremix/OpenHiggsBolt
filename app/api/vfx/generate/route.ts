import { NextRequest, NextResponse } from 'next/server'
import { getServerVFXClient } from '@/api/vfx'
import { validateGenerationInput } from '../_validation'
import { rateLimit, rateLimit429 } from '@/lib/rateLimit'

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

    // Accept optional client-provided API key; fall back to server-side key
    const clientKey = req.headers.get('x-api-key')?.trim()
    const apiKey = clientKey || process.env.MUAPI_API_KEY || process.env.MUAPI_KEY || ''
    if (!apiKey) {
      return NextResponse.json({ error: 'MuAPI key is required' }, { status: 400 })
    }

    const limit = rateLimit(apiKey, { windowMs: RATE_LIMIT_WINDOW_MS, max: RATE_LIMIT_MAX })
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
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[VFX generate]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
