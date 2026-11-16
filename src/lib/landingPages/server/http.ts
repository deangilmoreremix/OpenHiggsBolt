import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { rateLimit, rateLimit429, resolveRateLimitKey } from '@/lib/rateLimit'
import { HttpError } from './pages.js'

/** Shared plumbing for the landing page routes. */
export async function signedInUser(): Promise<string | null> {
  const { userId } = await auth()
  return userId || null
}

export const unauthenticated = () => NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })

export async function serviceDb() {
  const { createServerClient } = await import('@/lib/supabase')
  return createServerClient()
}

export function clientIpOf(req: NextRequest): string | undefined {
  // First x-forwarded-for entry (client behind Netlify). A direct caller can forge it, so the limit is
  // defence in depth; unkeyed callers share one bucket (same idiom as the demo routes).
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0].trim()
    if (first) return first
  }
  return req.headers.get('x-real-ip')?.trim() || undefined
}

export function limited(key: string, opts: { windowMs: number; max: number }) {
  const r = rateLimit(key, opts)
  return r.allowed ? null : rateLimit429(r.retryAfterMs)
}

export const publicKey = (prefix: string, req: NextRequest) => `${prefix}:${resolveRateLimitKey(null, clientIpOf(req))}`

export async function readJson(req: NextRequest, maxBytes = 300_000): Promise<Record<string, unknown> | null> {
  try {
    const text = await req.text()
    if (text.length > maxBytes) return null
    const body = JSON.parse(text)
    return body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : null
  } catch {
    return null
  }
}

export function errorResponse(err: unknown) {
  if (err instanceof HttpError) return NextResponse.json({ error: err.message, code: err.code }, { status: err.status })
  console.error('[landing-pages]', err instanceof Error ? err.message : 'unknown error')
  return NextResponse.json({ error: 'Something went wrong', code: 'SERVER_ERROR' }, { status: 500 })
}
