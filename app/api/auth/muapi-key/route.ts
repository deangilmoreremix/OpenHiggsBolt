import { auth as clerkAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin as realGetSupabaseAdmin } from '../../../../src/lib/supabaseServer';
import { encryptMuapiKey, decryptMuapiKey } from '../../../../src/lib/muapiKeyCrypto';

export const runtime = 'nodejs';

// Dependencies are injected so the handlers can be unit-tested without a live
// Clerk or Supabase runtime. In production they default to the real
// implementations; tests pass mocks via buildHandlers({ auth, getSupabaseAdmin }).
export type AuthFn = () => Promise<{ userId: string | null }>;
export type GetSupabaseAdminFn = () => {
  from: (table: string) => any;
};
// Returns true if the caller (identified by key) is allowed to proceed, false
// if they've exceeded the rate limit. Injected so it can be unit-tested.
export type RateLimitFn = (key: string) => boolean;

// Simple in-memory fixed-window rate limiter. Per-user, so one user hammering
// their own key-save endpoint can't affect others. Resets each minute; the
// store is intentionally not shared across serverless instances (best-effort
// abuse protection, not a hard guarantee — pair with a global limiter if needed).
function createInMemoryRateLimiter(maxPerMinute = 10) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return (key: string): boolean => {
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || now >= entry.resetAt) {
      hits.set(key, { count: 1, resetAt: now + 60_000 });
      return true;
    }
    if (entry.count >= maxPerMinute) return false;
    entry.count += 1;
    return true;
  };
}

// Central handler factory. All three HTTP methods share the same auth + db
// resolution, so the behavior stays consistent and is trivially testable.
export function buildHandlers(deps: {
  auth: AuthFn;
  getSupabaseAdmin: GetSupabaseAdminFn;
  rateLimit?: RateLimitFn;
}) {
  const { auth, getSupabaseAdmin } = deps;
  const rateLimit = deps.rateLimit ?? createInMemoryRateLimiter();

  async function resolveUser() {
    const { userId } = await auth();
    return userId;
  }

  return {
    async GET() {
      const userId = await resolveUser();
      if (!userId) return NextResponse.json({ key: null }, { status: 401 });
      try {
        const sb = getSupabaseAdmin();
        const { data } = await sb
          .from('app_users')
          .select('muapi_key')
          .eq('clerk_user_id', userId)
          .maybeSingle();
        const key = data?.muapi_key ? decryptMuapiKey(data.muapi_key) : null;
        return NextResponse.json({ key });
      } catch {
        // Never leak details; treat as "no key" so the UI just prompts for one.
        return NextResponse.json({ key: null });
      }
    },

    async POST(request: Request) {
      const userId = await resolveUser();
      if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

      // Best-effort abuse protection on the key-save endpoint.
      if (!rateLimit(`save:${userId}`)) {
        return NextResponse.json(
          { ok: false, error: 'Too many requests. Please try again in a minute.' },
          { status: 429 }
        );
      }

      const body = await request.json().catch(() => ({}));
      const key = typeof body?.key === 'string' ? body.key.trim() : '';
      if (!key) {
        return NextResponse.json({ ok: false, error: 'Missing key' }, { status: 400 });
      }

      try {
        const sb = getSupabaseAdmin();
        const enc = encryptMuapiKey(key);
        const nowIso = new Date().toISOString();

        // Update the existing row when present; otherwise create a minimal row.
        // Using update-then-insert avoids clobbering the row id (which is
        // referenced by workspace_members) via an onConflict upsert.
        const { data: updated, error: updErr } = await sb
          .from('app_users')
          .update({ muapi_key: enc, updated_at: nowIso, key_updated_at: nowIso })
          .eq('clerk_user_id', userId)
          .select('clerk_user_id');
        if (updErr) throw updErr;

        if (!updated || updated.length === 0) {
          const { error: insErr } = await sb
            .from('app_users')
            .insert({ id: userId, clerk_user_id: userId, muapi_key: enc, key_updated_at: nowIso });
          if (insErr) throw insErr;
        }

        return NextResponse.json({ ok: true });
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Failed to save key';
        return NextResponse.json({ ok: false, error: message }, { status: 500 });
      }
    },

    async DELETE() {
      const userId = await resolveUser();
      if (!userId) return NextResponse.json({ ok: false }, { status: 401 });
      try {
        const sb = getSupabaseAdmin();
        const nowIso = new Date().toISOString();
        await sb
          .from('app_users')
          .update({ muapi_key: null, updated_at: nowIso, key_updated_at: nowIso })
          .eq('clerk_user_id', userId);
        return NextResponse.json({ ok: true });
      } catch {
        return NextResponse.json({ ok: false }, { status: 500 });
      }
    },
  };
}

// Production handlers — use the real Clerk + Supabase implementations.
const handlers = buildHandlers({ auth: clerkAuth, getSupabaseAdmin: realGetSupabaseAdmin });
export const GET = handlers.GET;
export const POST = handlers.POST;
export const DELETE = handlers.DELETE;
