import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseAdmin } from '@/lib/supabaseServer';
import { canAccessTraining, listResellerAppIds, resolveResellerEntitlements } from '@/lib/resellerAccess';
import { LESSON_IDS } from '@/content/resellerAcademy';
import { sanitizeProgress } from '@/lib/resellerAcademyProgress';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET/PUT /api/reseller/academy/progress
 *
 * Saves educational progress for a signed-in learner who already passes the
 * EXISTING training gate (`canAccessTraining`, unchanged). This route only
 * calls the existing access helpers; it never writes entitlements, never
 * reads progress to decide access, and ignores any user id in the request.
 *
 *   401 UNAUTHENTICATED   no Clerk session
 *   403 NOT_ENTITLED      existing training gate says no
 *   503 STORE_UNAVAILABLE table/service not configured (client keeps local progress)
 */

const MAX_BODY_BYTES = 16 * 1024;

async function gate() {
  const { userId } = await auth();
  if (!userId) return { error: NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 }) } as const;
  let entitled = false;
  try {
    entitled = canAccessTraining(await resolveResellerEntitlements(userId));
  } catch {
    return { error: NextResponse.json({ error: 'ACCESS_PENDING' }, { status: 503 }) } as const;
  }
  if (!entitled) return { error: NextResponse.json({ error: 'NOT_ENTITLED' }, { status: 403 }) } as const;
  return { userId } as const;
}

export async function GET() {
  const g = await gate();
  if ('error' in g) return g.error;
  try {
    const { data, error } = await getSupabaseAdmin()
      .from('reseller_academy_progress')
      .select('state')
      .eq('clerk_user_id', g.userId)
      .maybeSingle();
    if (error) throw error;
    const progress = data ? sanitizeProgress(data.state, LESSON_IDS, listResellerAppIds()) : null;
    // `owner` lets the browser tell whether its saved copy belongs to this account
    return NextResponse.json({ progress, owner: g.userId }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'STORE_UNAVAILABLE' }, { status: 503 });
  }
}

export async function PUT(req: NextRequest) {
  const g = await gate();
  if ('error' in g) return g.error;

  const text = await req.text();
  if (text.length > MAX_BODY_BYTES) return NextResponse.json({ error: 'PAYLOAD_TOO_LARGE' }, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: 'BAD_JSON' }, { status: 400 });
  }
  const progress = sanitizeProgress((body as { progress?: unknown } | null)?.progress, LESSON_IDS, listResellerAppIds());

  try {
    // never let an older request overwrite newer saved progress (requests can arrive out of order)
    const existing = await getSupabaseAdmin().from('reseller_academy_progress').select('state').eq('clerk_user_id', g.userId).maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data) {
      const stored = sanitizeProgress(existing.data.state, LESSON_IDS, listResellerAppIds());
      if (stored.updatedAt > progress.updatedAt) {
        return NextResponse.json({ ok: true, stale: true, progress: stored }, { headers: { 'Cache-Control': 'no-store' } });
      }
    }
    const { error } = await getSupabaseAdmin()
      .from('reseller_academy_progress')
      .upsert(
        {
          clerk_user_id: g.userId,
          state: progress,
          selected_app_id: progress.selectedAppId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'clerk_user_id' },
      );
    if (error) throw error;
    return NextResponse.json({ ok: true, progress }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'STORE_UNAVAILABLE' }, { status: 503 });
  }
}
