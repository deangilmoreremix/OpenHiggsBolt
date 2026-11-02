import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

let _serviceClient: SupabaseClient | null = null;

/**
 * Upper bound for any single Supabase HTTP call made from a server route.
 *
 * Netlify kills a request after ~30s and answers with an HTML 504 page, which
 * the browser then fails to parse ("Unexpected token '<' ... is not valid
 * JSON"). Aborting the database call well before that lets each route's own
 * catch block answer with JSON instead.
 */
export const SUPABASE_FETCH_TIMEOUT_MS = 15_000;

export function fetchWithTimeout(timeoutMs: number = SUPABASE_FETCH_TIMEOUT_MS): typeof fetch {
  return (input, init = {}) => {
    const timeout = AbortSignal.timeout(timeoutMs);
    const signal = init.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
    return fetch(input, { ...init, signal });
  };
}

function getServiceClient(): SupabaseClient {
  if (_serviceClient) return _serviceClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  _serviceClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: fetchWithTimeout() },
  });
  return _serviceClient;
}

export async function getSupabaseAsUser(): Promise<SupabaseClient> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Not authenticated');
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Missing Supabase URL or anon key');
  }
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: fetchWithTimeout() },
  });
  await client.rpc('set_config', {
    setting: 'app.clerk_user_id',
    value: userId,
    is_local: true,
  });
  return client;
}

export function getSupabaseAdmin(): SupabaseClient {
  return getServiceClient();
}

export { getServiceClient as getSupabaseService };
