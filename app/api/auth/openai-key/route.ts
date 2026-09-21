import { auth as clerkAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { encryptMuapiKey, decryptMuapiKey } from '@/src/lib/muapiKeyCrypto';
import { verifyOpenAIKeyServerSide } from '@/src/lib/server/openaiKeyVerification';

export const runtime = 'nodejs';

// Dependencies are injected so the handlers can be unit-tested without a live
// Clerk or Supabase runtime. In production they default to the real
// implementations; tests pass mocks via buildHandlers({ auth, getSupabaseAdmin }).
export type AuthFn = () => Promise<{ userId: string | null }>;
export type GetSupabaseAdminFn = () => {
  from: (table: string) => any;
};

export function buildHandlers(deps: {
  auth: AuthFn;
  getSupabaseAdmin: GetSupabaseAdminFn;
  verifyOpenAIKey?: typeof verifyOpenAIKeyServerSide;
}) {
  const { auth, getSupabaseAdmin, verifyOpenAIKey: verifyOpenAIKeyOverride } = deps;

  async function resolveUser() {
    const { userId } = await auth();
    return userId;
  }

  async function verifyKey(key: string) {
    if (verifyOpenAIKeyOverride) {
      return verifyOpenAIKeyOverride(key);
    }
    return verifyOpenAIKeyServerSide(key);
  }

  return {
    async GET() {
      const userId = await resolveUser();
      if (!userId) {
        return NextResponse.json({ configured: false, masked: null, updatedAt: null }, { status: 401 });
      }

      try {
        const sb = getSupabaseAdmin();
        const { data } = await sb
          .from('app_users')
          .select('openai_key, openai_key_updated_at')
          .eq('clerk_user_id', userId)
          .maybeSingle();

        const stored = data?.openai_key;
        if (!stored) {
          return NextResponse.json({ configured: false, masked: null, updatedAt: null });
        }

        const decrypted = decryptMuapiKey(stored);
        if (!decrypted) {
          return NextResponse.json({ configured: false, masked: null, updatedAt: null });
        }

        // Show the first 8 characters followed by mask characters.
        // Never return the full raw key to the browser.
        const masked = decrypted.length > 8 ? `${decrypted.slice(0, 8)}••••••••••••••` : '••••••••';

        return NextResponse.json({
          configured: true,
          masked,
          updatedAt: data?.openai_key_updated_at || null,
        });
      } catch {
        // Never leak internals; treat as "not configured".
        return NextResponse.json({ configured: false, masked: null, updatedAt: null }, { status: 500 });
      }
    },

    async POST(request: Request) {
      const userId = await resolveUser();
      if (!userId) {
        return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
      }

      let body: { openaiKey?: string } = {};
      try {
        body = await request.json();
      } catch {
        return NextResponse.json({ ok: false, error: 'Invalid request body' }, { status: 400 });
      }

      const openaiKey = typeof body?.openaiKey === 'string' ? body.openaiKey.trim() : '';

      if (!openaiKey) {
        return NextResponse.json(
          { ok: false, error: 'OpenAI key is required.' },
          { status: 400 }
        );
      }

      // Reject keys that are too short or have surrounding whitespace/control chars.
      if (openaiKey.length < 8 || /^[\s\x00-\x1F]|[\s\x00-\x1F]$/.test(openaiKey) || /^["']|["']$/.test(openaiKey)) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Invalid key format. Keys must be at least 8 characters and cannot contain surrounding whitespace, control characters, or quotes.',
          },
          { status: 400 }
        );
      }

      // Server-side verification.
      let verificationResult;
      try {
        verificationResult = await verifyKey(openaiKey);
      } catch {
        // If the verification helper itself throws, treat as temporarily unavailable.
        verificationResult = {
          isValid: true,
          status: 'temporarily_unverified' as const,
          warning: 'Your OpenAI key was saved, but OpenAI verification is temporarily unavailable.',
          error: null,
        };
      }

      // Definitive 401 from OpenAI → reject the save.
      if (!verificationResult.isValid) {
        return NextResponse.json(
          { ok: false, error: verificationResult.error || 'OpenAI did not recognize this API key.' },
          { status: 400 }
        );
      }

      // Encrypt and persist.
      try {
        const sb = getSupabaseAdmin();
        const enc = encryptMuapiKey(openaiKey);
        const nowIso = new Date().toISOString();

        const { data: updated, error: updErr } = await sb
          .from('app_users')
          .update({
            openai_key: enc,
            openai_key_updated_at: nowIso,
            updated_at: nowIso,
          })
          .eq('clerk_user_id', userId)
          .select('clerk_user_id');

        if (updErr) throw updErr;

        if (!updated || updated.length === 0) {
          const { error: insErr } = await sb
            .from('app_users')
            .insert({
              id: userId,
              clerk_user_id: userId,
              openai_key: enc,
              openai_key_updated_at: nowIso,
              updated_at: nowIso,
            });
          if (insErr) throw insErr;
        }

        return NextResponse.json({
          ok: true,
          configured: true,
          verification: verificationResult.status,
          warning: verificationResult.warning,
        });
      } catch {
        return NextResponse.json(
          { ok: false, error: 'We couldn\'t securely save your OpenAI key. Please try again.' },
          { status: 500 }
        );
      }
    },

    async DELETE() {
      const userId = await resolveUser();
      if (!userId) {
        return NextResponse.json({ ok: false }, { status: 401 });
      }

      try {
        const sb = getSupabaseAdmin();
        const nowIso = new Date().toISOString();
        const { error: delErr } = await sb
          .from('app_users')
          .update({
            openai_key: null,
            openai_key_updated_at: null,
            updated_at: nowIso,
          })
          .eq('clerk_user_id', userId);

        if (delErr) throw delErr;

        return NextResponse.json({ ok: true, configured: false });
      } catch {
        return NextResponse.json(
          { ok: false, error: 'We couldn\'t remove your OpenAI key. Please try again.' },
          { status: 500 }
        );
      }
    },
  };
}

// Production handlers — use the real Clerk + Supabase implementations.
import { getSupabaseAdmin as realGetSupabaseAdmin } from '@/src/lib/supabaseServer';
const handlers = buildHandlers({ auth: clerkAuth, getSupabaseAdmin: realGetSupabaseAdmin });
export const GET = handlers.GET;
export const POST = handlers.POST;
export const DELETE = handlers.DELETE;
