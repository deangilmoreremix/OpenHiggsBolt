import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { rateLimit, rateLimit429 } from '@/lib/rateLimit'
import { getOpenAiKeyForUser } from '@/src/lib/openaiKeyServer'
import { rewriteWithOpenAi, RewriteError } from '@/src/lib/landingPages/server/rewriteLlm.js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MESSAGES: Record<string, string> = {
  OPENAI_KEY_INVALID: 'Your OpenAI key was rejected. Check it in Settings → API keys.',
  OPENAI_QUOTA: 'Your OpenAI account has no credit left.',
  OPENAI_RATE: 'OpenAI is rate limiting you. Wait a moment and try again.',
  OPENAI_ERROR: 'The AI service returned an error.',
  BAD_OUTPUT: 'The AI returned an unreadable answer. Try again.',
  TIMEOUT: 'The AI took too long.',
  UNREACHABLE: 'The AI service is unreachable.',
  BAD_INPUT: 'Send a list of texts to rewrite.',
}

/**
 * POST /api/landing-pages/rewrite { input: { items: [{id, role, text}], instruction?, context? } } → { ok, items }
 *   401 UNAUTHENTICATED · 409 OPENAI_KEY_REQUIRED / OPENAI_KEY_INVALID · 429 · 400
 * Runs on the customer's own OpenAI key, read server-side (never sent to the browser). Only texts are sent.
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
  const apiKey = await getOpenAiKeyForUser()
  if (!apiKey) return NextResponse.json({ error: 'OPENAI_KEY_REQUIRED', code: 'OPENAI_KEY_REQUIRED' }, { status: 409 })
  const minute = rateLimit(`lp-rewrite:min:${userId}`, { windowMs: 60_000, max: 12 })
  if (!minute.allowed) return rateLimit429(minute.retryAfterMs)
  const day = rateLimit(`lp-rewrite:day:${userId}`, { windowMs: 86_400_000, max: 300 })
  if (!day.allowed) return rateLimit429(day.retryAfterMs)

  let body: { input?: unknown }
  try {
    const text = await req.text()
    if (text.length > 120_000) return NextResponse.json({ error: MESSAGES.BAD_INPUT, code: 'BAD_INPUT' }, { status: 400 })
    body = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: MESSAGES.BAD_INPUT, code: 'BAD_INPUT' }, { status: 400 })
  }
  try {
    const items = await rewriteWithOpenAi(apiKey, body?.input)
    return NextResponse.json({ ok: true, items })
  } catch (err) {
    if (err instanceof RewriteError) return NextResponse.json({ error: MESSAGES[err.code] || 'The AI rewrite failed.', code: err.code }, { status: err.status })
    return NextResponse.json({ error: 'The AI rewrite failed.', code: 'SERVER_ERROR' }, { status: 500 })
  }
}
