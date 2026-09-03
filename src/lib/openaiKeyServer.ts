import { auth } from '@clerk/nextjs/server';
import { getSupabaseAdmin } from '@/src/lib/supabaseServer';
import { decryptMuapiKey } from '@/src/lib/muapiKeyCrypto';

/**
 * Loads the authenticated user's OpenAI key from the server-side store.
 *
 * Returns the decrypted key, or null when the user is unauthenticated,
 * does not have a key configured, or the stored value cannot be decrypted.
 */
export async function getOpenAiKeyForUser(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;

  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('app_users')
      .select('openai_key')
      .eq('clerk_user_id', userId)
      .maybeSingle();

    const stored = data?.openai_key;
    if (!stored) return null;

    return decryptMuapiKey(stored);
  } catch {
    return null;
  }
}
