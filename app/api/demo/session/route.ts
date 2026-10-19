/**
 * Landing-page demo personalization session.
 *
 * Issues a narrowly scoped, short-lived session token that authorizes
 * exactly the demo template + actions listed on it. It is NOT an
 * entitlement and never grants access to paid studios or normal paid
 * rendering. Created server-side with the service role; the client
 * only ever receives an opaque session id to present back to the
 * validate/personalize routes.
 *
 * Rate limited by IP to protect public demo traffic.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/src/lib/supabaseServer';

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 5; // sessions per IP per hour

// In-memory rate limiter (per server instance). Sufficient for public
// demo traffic; a shared store can be substituted at scale.
const rateLimitState = new Map<string, { count: number; resetAt: number }>();

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

function rateLimited(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const state = rateLimitState.get(ip);
  if (!state || now > state.resetAt) {
    rateLimitState.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }
  if (state.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }
  state.count += 1;
  return { allowed: true, remaining: RATE_LIMIT_MAX - state.count };
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = clientIp(req);
  const limit = rateLimited(ip);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'demo_rate_limited', message: 'Too many demo sessions. Please try again later.' },
      { status: 429 },
    );
  }

  let body: { templateId?: string; actions?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const templateId = typeof body?.templateId === 'string' && body.templateId
    ? body.templateId.trim()
    : '';
  if (!templateId) {
    return NextResponse.json({ error: 'template_id_required' }, { status: 400 });
  }

  const rawActions = Array.isArray(body?.actions) ? body.actions : [];
  const actions = rawActions.filter(
    (a): a is string => typeof a === 'string' && a.length > 0 && a.length <= 40,
  ).slice(0, 10);
  // Canonical demo actions only; nothing here unlocks paid studios.
  const allowedActions = new Set([
    'lead-finder', 'business-search', 'import', 'customize', 'preview', 'render',
  ]);
  const scopedActions = [...new Set(actions.filter((a) => allowedActions.has(a)))];
  if (scopedActions.length === 0) {
    scopedActions.push('lead-finder', 'business-search', 'import', 'customize', 'preview');
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('demo_personalization_sessions')
    .insert({
      template_id: templateId,
      actions: scopedActions,
      ip_hash: ip,
    })
    .select('id, expires_at')
    .single();

  if (error || !data) {
    console.error('[demo session] insert failed:', error);
    return NextResponse.json({ error: 'session_create_failed' }, { status: 500 });
  }

  return NextResponse.json({
    token: data.id,
    expiresAt: data.expires_at,
    actions: scopedActions,
    rateLimitRemaining: limit.remaining,
  });
}
