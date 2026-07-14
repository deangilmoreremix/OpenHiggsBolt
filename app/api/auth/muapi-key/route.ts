import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseAdmin } from '../../../../src/lib/supabaseServer';

// Encryption at rest for the user's MuAPI key.
// The key is derived from a server-only secret so the plaintext key is never
// stored in the database. Prefer a dedicated MUAPI_KEY_SECRET; fall back to the
// service role key (always present server-side) so no extra env setup is needed.
export const runtime = 'nodejs';

function getSecretKey(): Buffer {
  const secret =
    process.env.MUAPI_KEY_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error('Missing encryption secret');
  return crypto.scryptSync(secret, 'muapi-key-v1', 32);
}

function encrypt(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getSecretKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${enc.toString('base64')}`;
}

function decrypt(stored: string): string | null {
  try {
    if (!stored) return null;
    // Legacy / plaintext values (no version prefix) are returned as-is so
    // existing rows keep working while new writes are encrypted.
    if (!stored.startsWith('v1:')) return stored;
    const [, ivB64, tagB64, dataB64] = stored.split(':');
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      getSecretKey(),
      Buffer.from(ivB64, 'base64')
    );
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    const dec = Buffer.concat([
      decipher.update(Buffer.from(dataB64, 'base64')),
      decipher.final(),
    ]);
    return dec.toString('utf8');
  } catch {
    return null;
  }
}

// GET — return the current user's stored MuAPI key (decrypted), or null.
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ key: null }, { status: 401 });
  try {
    const sb = getSupabaseAdmin();
    const { data } = await sb
      .from('app_users')
      .select('muapi_key')
      .eq('clerk_user_id', userId)
      .maybeSingle();
    const key = data?.muapi_key ? decrypt(data.muapi_key) : null;
    return NextResponse.json({ key });
  } catch {
    // Never leak details; treat as "no key" so the UI just prompts for one.
    return NextResponse.json({ key: null });
  }
}

// POST — persist the user's MuAPI key (encrypted) against their account.
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const key = typeof body?.key === 'string' ? body.key.trim() : '';
  if (!key) {
    return NextResponse.json({ ok: false, error: 'Missing key' }, { status: 400 });
  }

  try {
    const sb = getSupabaseAdmin();
    const enc = encrypt(key);

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
}

// DELETE — forget the user's stored MuAPI key.
export async function DELETE() {
  const { userId } = await auth();
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
}
