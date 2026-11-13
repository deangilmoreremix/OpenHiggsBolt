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

/**
 * Same ceiling as the database column (CHECK pg_column_size(state) <= 65536). The saved state is the
 * sanitized body, which can only be smaller. The full checked-in course (113 lessons, all steps seen,
 * all boxes ticked, all lessons complete) is about 16 KB in the compact form, and ~41 KB even if no
 * lesson were marked complete (tests/academy-progress-size).
 */
const MAX_BODY_BYTES = 64 * 1024;

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
  if (Buffer.byteLength(text) > MAX_BODY_BYTES) return NextResponse.json({ error: 'PAYLOAD_TOO_LARGE' }, { status: 413 });
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
    // The row's updated_at carries the client's progress clock, so "is this older than what is saved?"
    // is decided by ONE conditional statement in Postgres (atomic), not by read-then-write: two tabs or
    // devices saving at once can never let the older request land last and overwrite newer progress.
    const at = new Date(progress.updatedAt).toISOString();
    const row = { clerk_user_id: userId, state: progress, updated_at: at };
    // 1) create the row if this learner has none (does nothing if it exists)
    const ins = await db.from('academy_progress').upsert(row, { onConflict: 'clerk_user_id', ignoreDuplicates: true }).select('clerk_user_id');
    if (ins.error) throw ins.error;
    if (!ins.data?.length) {
      // 2) update only if what is saved is not newer than this request
      const upd = await db
        .from('academy_progress')
        .update({ state: progress, updated_at: at })
        .eq('clerk_user_id', userId)
        .lte('updated_at', at)
        .select('clerk_user_id');
      if (upd.error) throw upd.error;
      if (!upd.data?.length) {
        const existing = await db.from('academy_progress').select('state').eq('clerk_user_id', userId).maybeSingle();
        if (existing.error) throw existing.error;
        const stored = existing.data ? sanitizeCourseProgress(existing.data.state, ids) : progress;
        return NextResponse.json({ ok: true, stale: true, progress: stored }, { headers: { 'Cache-Control': 'no-store' } });
      }
    }
    return NextResponse.json({ ok: true, progress }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'STORE_UNAVAILABLE' }, { status: 503 });
  }
}
