/**
 * Stripe buyer -> Clerk account.
 *
 * When someone pays in Stripe the webhook needs to know which Clerk account
 * the purchase belongs to. If the buyer already has an account (matched by
 * email) the grant goes straight to it. If not, the purchase is recorded on
 * an email placeholder row (adopted automatically when they sign in) and
 * Clerk emails them an invitation to create their account.
 *
 * Invitations also work when Clerk sign-ups are set to "Restricted", so the
 * app can be invite-only: only people who paid, or whom the owner added,
 * can create an account.
 */
import { createClerkClient } from '@clerk/backend';

export interface ClerkLike {
  users: {
    getUserList(params: { emailAddress: string[]; limit?: number }): Promise<
      { data: Array<{ id: string }> } | Array<{ id: string }>
    >;
  };
  invitations: {
    createInvitation(params: {
      emailAddress: string;
      redirectUrl?: string;
      publicMetadata?: Record<string, unknown>;
      notify?: boolean;
      ignoreExisting?: boolean;
    }): Promise<{ id: string }>;
  };
}

let _client: ClerkLike | null = null;

export function getClerkBackend(): ClerkLike | null {
  if (_client) return _client;
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return null;
  _client = createClerkClient({ secretKey }) as unknown as ClerkLike;
  return _client;
}

/** Test hook. */
export function setClerkBackendForTests(client: ClerkLike | null): void {
  _client = client;
}

/** Clerk user id for this email, or null when the buyer has no account yet. */
export async function findClerkUserIdByEmail(
  email: string,
  client: ClerkLike | null = getClerkBackend()
): Promise<string | null> {
  if (!client || !email) return null;
  const result = await client.users.getUserList({ emailAddress: [email], limit: 1 });
  const users = Array.isArray(result) ? result : result?.data || [];
  return users[0]?.id || null;
}

function appUrl(): string {
  const fromEnv = (process.env.NEXT_PUBLIC_APP_URL || '').trim().replace(/\/+$/, '');
  return fromEnv || 'https://go.smartvid.app';
}

/**
 * Emails the buyer a Clerk invitation to create their account. Safe to call
 * more than once: an existing pending invitation is reused, not duplicated.
 * Returns false (never throws) when Clerk is not configured or refuses, so a
 * recorded purchase is never lost because the email failed.
 */
export async function inviteBuyer(
  email: string,
  entitlementKeys: string[],
  client: ClerkLike | null = getClerkBackend()
): Promise<boolean> {
  if (!client || !email) return false;
  try {
    await client.invitations.createInvitation({
      emailAddress: email,
      redirectUrl: `${appUrl()}/sign-up`,
      publicMetadata: { purchased: entitlementKeys },
      notify: true,
      ignoreExisting: true,
    });
    return true;
  } catch (err: any) {
    console.error('[buyerOnboarding] invitation failed:', err?.errors?.[0]?.message || err?.message || err);
    return false;
  }
}
