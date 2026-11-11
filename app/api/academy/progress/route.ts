import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseAdmin } from '@/lib/supabaseServer';
import { getAllTracks } from '@/lib/academyLessons';
import { sanitizeCourseProgress } from '@/lib/academyCourseProgress';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET/PUT /api/academy/progress
 *
 * Saves Academy course progress (current lesson/step, steps done, checklist ticks,
 * completed lessons) for a SIGNED-IN learner so it follows them across devices.
 * The Academy itself is public, so there is no entitlement check here: progress
 * is educational only and is never read to decide access. The user id always
 * comes from the session; any id in the request is ignored.
 *
 *   401 UNAUTHENTICATED   no session (the browser keeps progress locally)
 *   503 STORE_UNAVAILABLE table not set up yet (the browser keeps progress locally)
 *   413 PAYLOAD_TOO_LARGE · 400 BAD_JSON
 */

const MAX_BODY_BYTES = 32 * 1024;

/** Every real lesson id (`track/slug`), built from the lesson files, so unknown ids are dropped. */
function lessonIds(): string[] {
  return getAllTracks().flatMap((t) => t.lessons.map((l) => `${t.slug}/${l.slug}`));
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  try {
    const { data, error } = await getSupabaseAdmin().from('academy_progress').select('state').eq('clerk_user_id', userId).maybeSingle();
    if (error) throw error;
    const progress = data ? sanitizeCourseProgress(data.state, lessonIds()) : null;
    // `owner` lets the browser tell whether its saved copy belongs to this account
    return NextResponse.json({ progress, owner: userId }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'STORE_UNAVAILABLE' }, { status: 503 });
  }
}

export async function PUT(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });

  const text = await req.text();
  if (text.length > MAX_BODY_BYTES) return NextResponse.json({ error: 'PAYLOAD_TOO_LARGE' }, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: 'BAD_JSON' }, { status: 400 });
  }
  const ids = lessonIds();
  const progress = sanitizeCourseProgress((body as { progress?: unknown } | null)?.progress, ids);

  try {
    const db = getSupabaseAdmin();
    // never let an older request overwrite newer saved progress (requests can arrive out of order)
    const existing = await db.from('academy_progress').select('state').eq('clerk_user_id', userId).maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data) {
      const stored = sanitizeCourseProgress(existing.data.state, ids);
      if (stored.updatedAt > progress.updatedAt) {
        return NextResponse.json({ ok: true, stale: true, progress: stored }, { headers: { 'Cache-Control': 'no-store' } });
      }
    }
    const { error } = await db
      .from('academy_progress')
      .upsert({ clerk_user_id: userId, state: progress, updated_at: new Date().toISOString() }, { onConflict: 'clerk_user_id' });
    if (error) throw error;
    return NextResponse.json({ ok: true, progress }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'STORE_UNAVAILABLE' }, { status: 503 });
  }
}
