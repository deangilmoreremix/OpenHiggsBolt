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

// Central handler factory. All three HTTP methods share the same auth + db
// resolution, so the behavior stays consistent and is trivially testable.
export function buildHandlers(deps: { auth: AuthFn; getSupabaseAdmin: GetSupabaseAdminFn }) {
  const { auth, getSupabaseAdmin } = deps;

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

      const body = await request.json().catch(() => ({}));
      const key = typeof body?.key === 'string' ? body.key.trim() : '';
      if (!key) {
        return NextResponse.json({ ok: false, error: 'Missing key' }, { status: 400 });
      }

      try {
        const sb = getSupabaseAdmin();
        const enc = encryptMuapiKey(key);

        // Update the existing row when present; otherwise create a minimal row.
        // Using update-then-insert avoids clobbering the row id (which is
        // referenced by workspace_members) via an onConflict upsert.
        const { data: updated, error: updErr } = await sb
          .from('app_users')
          .update({ muapi_key: enc, updated_at: new Date().toISOString() })
          .eq('clerk_user_id', userId)
          .select('clerk_user_id');
        if (updErr) throw updErr;

        if (!updated || updated.length === 0) {
          const { error: insErr } = await sb
            .from('app_users')
            .insert({ id: userId, clerk_user_id: userId, muapi_key: enc });
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
        await sb
          .from('app_users')
          .update({ muapi_key: null, updated_at: new Date().toISOString() })
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
