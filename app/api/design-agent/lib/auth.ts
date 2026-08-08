import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/src/lib/supabaseServer';
import { decryptMuapiKey } from '@/src/lib/muapiKeyCrypto';

export type AuthFn = () => Promise<{ userId: string | null }>;
export type GetSupabaseAdminFn = () => {
  from: (table: string) => any;
};

/**
 * Resolves the MuAPI key from the request.
 *
 * Priority:
 * 1. `Authorization: Bearer <muapi_key>` — direct upstream client usage, no Clerk required
 * 2. Clerk session + encrypted per-user key from Supabase — fallback for app users
 *
 * Returns 401 only if neither auth method is available.
 */
export async function getDesignAgentApiKey(req: NextRequest, deps?: {
  auth?: AuthFn;
  getSupabaseAdmin?: GetSupabaseAdminFn;
}): Promise<string> {
  // 1. Accept Bearer token directly (upstream client / direct MuAPI key usage).
  const authHeader = req.headers.get('authorization') || '';
  const bearerKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  if (bearerKey) {
    return bearerKey;
  }

  // Also accept x-api-key header directly.
  const xApiKey = req.headers.get('x-api-key')?.trim();
  if (xApiKey) {
    return xApiKey;
  }

  // 2. Fall back to Clerk session + encrypted key from Supabase.
  const auth = deps?.auth || (async () => {
    const { auth: clerkAuth } = await import('@clerk/nextjs/server');
    return clerkAuth();
  });
  const getSb = deps?.getSupabaseAdmin || getSupabaseAdmin;

  const { userId } = await auth();
  if (!userId) {
    throw new Response('Unauthorized: Missing API key or session', { status: 401 });
  }

  const supabase = getSb();
  const { data, error } = await supabase
    .from('app_users')
    .select('muapi_key')
    .eq('clerk_user_id', userId)
    .maybeSingle();

  if (error || !data?.muapi_key) {
    throw new Response('MuAPI key not configured. Please add your API key in settings.', { status: 400 });
  }

  const key = decryptMuapiKey(data.muapi_key);
  if (!key) {
    throw new Response('MuAPI key could not be decrypted. Please re-save your key.', { status: 400 });
  }

  return key;
}
