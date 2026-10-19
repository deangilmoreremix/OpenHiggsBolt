/**
 * Validate a landing-page demo personalization session token.
 *
 * Returns the authorized template + actions if the token exists, is
 * not expired, and matches the requesting context. Used by the client
 * before beginning demo actions so the demo scope is enforced
 * server-side -- a fabricated demoMode=true / template param / demo ID
 * cannot grant access on its own.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/src/lib/supabaseServer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = req.nextUrl.searchParams.get('token') || '';
  const templateId = req.nextUrl.searchParams.get('templateId') || '';
  const action = req.nextUrl.searchParams.get('action') || '';

  if (!token) {
    return NextResponse.json({ valid: false, reason: 'token_required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('demo_personalization_sessions')
    .select('id, template_id, actions, expires_at')
    .eq('id', token)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ valid: false, reason: 'not_found' }, { status: 404 });
  }

  const now = new Date();
  const expiresAt = new Date(data.expires_at);
  if (expiresAt <= now) {
    return NextResponse.json({ valid: false, reason: 'expired' }, { status: 410 });
  }

  // Template scope: a token is only valid for its own template.
  if (templateId && data.template_id !== templateId) {
    return NextResponse.json(
      { valid: false, reason: 'template_mismatch' },
      { status: 403 },
    );
  }

  const actions: string[] = Array.isArray(data.actions) ? data.actions : [];
  const actionAllowed = !action || actions.includes(action);

  return NextResponse.json({
    valid: actionAllowed,
    templateId: data.template_id,
    actions,
    expiresAt: data.expires_at,
    ...(action && !actionAllowed ? { reason: 'action_not_authorized' } : {}),
  });
}
