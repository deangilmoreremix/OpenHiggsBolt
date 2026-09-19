import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { downloadImageAsDataUrl } from '@/server/downloadImage'

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_REQUESTS = 30
const MAX_URLS_PER_REQUEST = 20
const MAX_URL_LENGTH = 2048

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

function sanitizeUrl(url: string): string {
  const trimmed = url.trim().slice(0, MAX_URL_LENGTH)
  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      throw new Error('Invalid protocol')
    }
    return parsed.toString()
  } catch {
    throw new Error('Invalid URL')
  }
}

export async function POST(req: NextRequest) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30_000)

  try {
    const { userId } = await auth()
    if (!userId) {
      clearTimeout(timeoutId)
      return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
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

    let body: unknown
    try {
      body = await req.json()
    } catch {
      clearTimeout(timeoutId)
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const urls = Array.isArray((body as { urls?: unknown } | null)?.urls)
      ? ((body as { urls: string[] }).urls)
      : []
    if (urls.length === 0) {
      clearTimeout(timeoutId)
      return NextResponse.json({ error: 'urls array is required' }, { status: 400 })
    }

    if (urls.length > MAX_URLS_PER_REQUEST) {
      clearTimeout(timeoutId)
      return NextResponse.json({ error: `Maximum ${MAX_URLS_PER_REQUEST} URLs allowed per request` }, { status: 400 })
    }

    const sanitizedUrls: string[] = []
    for (const url of urls) {
      if (typeof url !== 'string') {
        clearTimeout(timeoutId)
        return NextResponse.json({ error: 'All URLs must be strings' }, { status: 400 })
      }
      try {
        sanitizedUrls.push(sanitizeUrl(url))
      } catch {
        clearTimeout(timeoutId)
        return NextResponse.json({ error: `Invalid URL: ${url.slice(0, 100)}` }, { status: 400 })
      }
    }

    const results = await Promise.all(
      sanitizedUrls.map(async (url) => {
        try {
          const dataUrl = await downloadImageAsDataUrl(url, 5 * 1024 * 1024)
          return { url, dataUrl, ok: true }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Download failed'
          return { url, error: message, ok: false }
        }
      }),
    )

    clearTimeout(timeoutId)
    return NextResponse.json({ ok: true, results }, {
      headers: {
        'X-RateLimit-Remaining': String(rateLimit.remaining),
        'X-RateLimit-Reset': String(rateLimit.resetAt),
      },
    })
  } catch (err) {
    clearTimeout(timeoutId)
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timed out' }, { status: 504 })
    }
    const message = err instanceof Error ? err.message : 'Unknown error'
    const safeMessage = message.replace(/sk-[a-zA-Z0-9]{20,}/g, '[REDACTED]')
    return NextResponse.json({ error: safeMessage }, { status: 500 })
  }
}
