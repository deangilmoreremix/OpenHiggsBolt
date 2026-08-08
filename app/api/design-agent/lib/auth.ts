import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/src/lib/supabaseServer';
import { decryptMuapiKey } from '@/src/lib/muapiKeyCrypto';

export type AuthFn = () => Promise<{ userId: string | null }>;
export type GetSupabaseAdminFn = () => {
  from: (table: string) => any;
};

/**
 * Resolves the authenticated user and returns their decrypted MuAPI key.
 * Returns 401 if not authenticated, 400 if no key is configured.
 */
export async function getDesignAgentApiKey(deps?: {
  auth?: AuthFn;
  getSupabaseAdmin?: GetSupabaseAdminFn;
}): Promise<string> {
  const auth = deps?.auth || (async () => {
    // Lazy import to avoid client-bundle/server-only issues in tests/build.
    const { auth: clerkAuth } = await import('@clerk/nextjs/server');
    return clerkAuth();
  });
  const getSb = deps?.getSupabaseAdmin || getSupabaseAdmin;

  const { userId } = await auth();
  if (!userId) {
    throw new Response('Unauthorized', { status: 401 });
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
