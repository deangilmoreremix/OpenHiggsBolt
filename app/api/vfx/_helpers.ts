import { getSupabaseAdmin } from '@/src/lib/supabaseServer';
import { decryptMuapiKey } from '@/src/lib/muapiKeyCrypto';
import { MUAPI_KEY_MISSING_ERROR } from '@/api/vfx';

/**
 * User-facing message returned by every MuAPI surface when the caller has no
 * MuAPI key of their own. Re-exported from the shared client layer so routes
 * and the client all speak with one voice.
 */
export const MUAPI_KEY_MISSING_MESSAGE = MUAPI_KEY_MISSING_ERROR;

export type MuapiKeyAuthFn = () => Promise<{ userId: string | null }>;
export type GetSupabaseAdminFn = () => {
  from: (table: string) => any;
};

export type MuapiKeyDeps = {
  auth?: MuapiKeyAuthFn;
  getSupabaseAdmin?: GetSupabaseAdminFn;
};

/**
 * Resolves the caller's OWN MuAPI key. Sources, in order:
 *
 *   1. `x-api-key` request header — the authenticated user's own key, as sent
 *      by the app client (Settings -> localStorage -> header).
 *   2. The Clerk session's OWN key from the encrypted per-user store
 *      (`app_users.muapi_key`), scoped to the session's `clerk_user_id`.
 *
 * It NEVER reads a server-side MuAPI env key: the server has no MuAPI key of
 * its own, so an upstream call can only ever bill the requesting user. A
 * client-supplied user id is never consulted, so cross-user key access is
 * impossible. Returns '' when the caller has no key (unauthenticated, no key
 * stored, or the store is unavailable).
 */
export async function resolveMuAPIKey(
  req?: { headers: Headers },
  deps?: MuapiKeyDeps
): Promise<string> {
  const headerKey = req?.headers.get('x-api-key')?.trim();
  if (headerKey) return headerKey;

  const authFn: MuapiKeyAuthFn =
    deps?.auth ??
    (async () => {
      const { auth: clerkAuth } = await import('@clerk/nextjs/server');
      return clerkAuth();
    });
  const getSb = deps?.getSupabaseAdmin ?? getSupabaseAdmin;

  const { userId } = await authFn();
  if (!userId) return '';

  try {
    const supabase = getSb();
    const { data } = await supabase
      .from('app_users')
      .select('muapi_key')
      .eq('clerk_user_id', userId)
      .maybeSingle();

    if (!data?.muapi_key) return '';
    return decryptMuapiKey(data.muapi_key) ?? '';
  } catch {
    // A misconfigured/unavailable store is a user-actionable "no key", never
    // an operator-billed fallback and never a 500.
    return '';
  }
}

/**
 * Thrown when the authenticated caller has no MuAPI key of their own. Carries
 * the Settings-directed message so routes can answer 400 (user action
 * required) instead of 500.
 */
export class MuapiKeyMissingError extends Error {
  readonly status = 400;
  constructor() {
    super(MUAPI_KEY_MISSING_MESSAGE);
    this.name = 'MuapiKeyMissingError';
  }
}

export function isMuapiKeyMissingError(err: unknown): err is MuapiKeyMissingError {
  return err instanceof MuapiKeyMissingError;
}

/**
 * Like {@link resolveMuAPIKey}, but throws {@link MuapiKeyMissingError} when
 * the caller has no key of their own.
 */
export async function validateMuAPIKey(
  req?: { headers: Headers },
  deps?: MuapiKeyDeps
): Promise<string> {
  const key = await resolveMuAPIKey(req, deps);
  if (!key) throw new MuapiKeyMissingError();
  return key;
}
