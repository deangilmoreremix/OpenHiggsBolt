import { auth, currentUser } from '@clerk/nextjs/server';
import { getSupabaseAdmin } from '@/lib/supabaseServer';
import {
  ENTITLEMENTS,
  isQualifyingStatus,
  type AccessState,
  type AccessResult,
  type EntitlementStatus,
  type UserEntitlements,
} from './entitlements';

/**
 * Prefix for `user_entitlements.clerk_user_id` values that are NOT real Clerk
 * ids. A verified Stripe purchase that cannot be matched to a Clerk account
 * (no `metadata.clerk_user_id` and no existing row for the buyer's email) is
 * recorded as `email:<normalizedEmail>` so the purchase is never dropped and
 * `restoreAccessByEmail` can later adopt the row.
 *
 * Clerk user ids always start with `user_`, so a row keyed `email:...` can
 * never be resolved by a real signed-in user: access lookups match on
 * `clerk_user_id = <clerk user id>`, and this placeholder only ever matches
 * its own email during email-based reconciliation/revocation.
 */
export const EMAIL_ONLY_CLERK_ID_PREFIX = 'email:';

export function emailOnlyClerkId(email: string): string {
  return `${EMAIL_ONLY_CLERK_ID_PREFIX}${email.toLowerCase().trim()}`;
}

export function isEmailOnlyClerkId(clerkUserId: string | null | undefined): boolean {
  return typeof clerkUserId === 'string' && clerkUserId.startsWith(EMAIL_ONLY_CLERK_ID_PREFIX);
}

function hasSmartVideoGo(entitlements: UserEntitlements, status?: string): boolean {
  if (!isQualifyingStatus(status)) {
    return false;
  }
  return entitlements.smartvideo_go === true || entitlements.founders === true;
}

async function getVerifiedEmailsForUser(userId: string): Promise<string[]> {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser || clerkUser.id !== userId) {
      return [];
    }
    return (clerkUser.emailAddresses || [])
      .map((entry) => entry?.emailAddress)
      .filter((email): email is string => Boolean(email && email.trim()));
  } catch {
    return [];
  }
}

export async function resolveSmartVideoAccess(): Promise<AccessResult> {
  const { userId } = await auth();

  if (!userId) {
    return { state: 'signed_out' };
  }

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('user_entitlements')
    .select('*')
    .eq('clerk_user_id', userId)
    .maybeSingle();

  if (!data) {
    return {
      state: 'authenticated_unpaid',
      access: {
        clerkUserId: userId,
        email: '',
        entitlements: { smartvideo_go: false },
        status: 'inactive',
        source: 'manual',
        hasSmartVideoGo: false,
      },
    };
  }

  const entitlements = (data.entitlements || {}) as UserEntitlements;
  const hasAccess = hasSmartVideoGo(entitlements, data.status);

  return {
    state: hasAccess ? 'paid' : 'authenticated_unpaid',
    access: {
      clerkUserId: userId,
      email: data.email || '',
      entitlements,
      status: data.status || 'inactive',
      source: data.source || 'manual',
      hasSmartVideoGo: hasAccess,
    },
  };
}

export async function resolveSmartVideoAccessForUser(clerkUserId: string): Promise<AccessState | null> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('user_entitlements')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle();

  if (!data) {
    return {
      clerkUserId,
      email: '',
      entitlements: { smartvideo_go: false },
      status: 'inactive',
      source: 'manual',
      hasSmartVideoGo: false,
    };
  }

  const entitlements = (data.entitlements || {}) as UserEntitlements;
  return {
    clerkUserId,
    email: data.email || '',
    entitlements,
    status: data.status || 'inactive',
    source: data.source || 'manual',
    hasSmartVideoGo: hasSmartVideoGo(entitlements, data.status),
  };
}

export async function grantEntitlement(
  clerkUserId: string,
  email: string,
  entitlementKey: string,
  source: string = 'manual',
  metadata?: Record<string, any>
): Promise<void> {
  const supabase = getSupabaseAdmin();

  const normalizedEmail = email.toLowerCase().trim();

  const { data: existing } = await supabase
    .from('user_entitlements')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle();

  const currentEntitlements = (existing?.entitlements || {}) as Record<string, boolean>;
  currentEntitlements[entitlementKey] = true;

  const payload: any = {
    clerk_user_id: clerkUserId,
    email: normalizedEmail,
    entitlements: currentEntitlements,
    status: 'active',
    source,
    updated_at: new Date().toISOString(),
  };

  if (metadata?.stripe_customer_id) payload.stripe_customer_id = metadata.stripe_customer_id;
  if (metadata?.stripe_subscription_id) payload.stripe_subscription_id = metadata.stripe_subscription_id;

  if (existing) {
    const { error } = await supabase
      .from('user_entitlements')
      .upsert(payload, { onConflict: 'clerk_user_id' });

    if (error) {
      console.error('[grantEntitlement] failed:', error);
      throw new Error('Failed to grant entitlement');
    }
    return;
  }

  // No row keyed by this clerk id. If the buyer previously purchased without a
  // Clerk account, the email-keyed placeholder row (`email:<email>`) already
  // exists: adopt it instead of inserting a second row for the same email.
  const { data: emailRow } = await supabase
    .from('user_entitlements')
    .select('*')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (emailRow && isEmailOnlyClerkId(emailRow.clerk_user_id)) {
    const merged = (emailRow.entitlements || {}) as Record<string, boolean>;
    merged[entitlementKey] = true;

    const adoptPayload: any = {
      clerk_user_id: clerkUserId,
      email: normalizedEmail,
      entitlements: merged,
      status: 'active',
      source,
      updated_at: new Date().toISOString(),
    };
    if (payload.stripe_customer_id) adoptPayload.stripe_customer_id = payload.stripe_customer_id;
    if (payload.stripe_subscription_id) adoptPayload.stripe_subscription_id = payload.stripe_subscription_id;

    const { error } = await supabase
      .from('user_entitlements')
      .update(adoptPayload)
      .eq('id', emailRow.id);

    if (error) {
      console.error('[grantEntitlement] adopt failed:', error);
      throw new Error('Failed to grant entitlement');
    }
    return;
  }

  const { error } = await supabase
    .from('user_entitlements')
    .upsert(payload, { onConflict: 'clerk_user_id' });

  if (error) {
    console.error('[grantEntitlement] failed:', error);
    throw new Error('Failed to grant entitlement');
  }
}

/**
 * Records a verified purchase for a buyer that has no Clerk account match.
 *
 * Writes (or merges into) the `email:<normalizedEmail>` placeholder row so the
 * purchase is durable and `restoreAccessByEmail` can adopt it once the buyer
 * signs in with the verified email. The placeholder key can never satisfy
 * access for a real Clerk user — see EMAIL_ONLY_CLERK_ID_PREFIX.
 */
export async function recordEmailOnlyPurchase(
  email: string,
  entitlementKey: string,
  metadata?: Record<string, any>
): Promise<void> {
  await grantEntitlement(
    emailOnlyClerkId(email),
    email,
    entitlementKey,
    metadata?.source || 'stripe',
    metadata
  );
}

/** Sets the lifecycle status of an entitlement row (idempotent). */
export async function setEntitlementStatus(
  clerkUserId: string,
  status: EntitlementStatus
): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from('user_entitlements')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('clerk_user_id', clerkUserId);

  if (error) {
    console.error('[setEntitlementStatus] failed:', error);
    throw new Error('Failed to update entitlement status');
  }
}

/** Revokes an entitlement row (refund, dispute, administrative removal). */
export async function revokeEntitlement(clerkUserId: string, reason?: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  const payload: any = {
    status: 'revoked',
    updated_at: new Date().toISOString(),
  };
  if (reason) payload.revoked_reason = reason;

  const { error } = await supabase
    .from('user_entitlements')
    .update(payload)
    .eq('clerk_user_id', clerkUserId);

  if (error) {
    console.error('[revokeEntitlement] failed:', error);
    throw new Error('Failed to revoke entitlement');
  }
}

function getUserVerifiedEmails(userId: string): string[] {
  // This function is used only in server contexts where Clerk's auth() is available.
  // It returns verified email addresses for the authenticated user.
  // The actual implementation depends on the Clerk SDK version and API.
  // For now, we'll use a simple approach that validates the email matches the user's primary email.
  return [];
}

function rowQualifies(row: any): boolean {
  const entitlements = (row?.entitlements || {}) as Record<string, boolean>;
  return (
    isQualifyingStatus(row?.status) &&
    (entitlements.smartvideo_go === true || entitlements.founders === true)
  );
}

export async function restoreAccessByEmail(clerkUserId: string, email: string): Promise<{
  status: 'restored' | 'not_found' | 'already_active' | 'error';
  message?: string;
}> {
  const supabase = getSupabaseAdmin();
  const normalizedEmail = email.toLowerCase().trim();

  // Get the authenticated user's verified emails from Clerk
  const { userId } = await auth();
  if (!userId || userId !== clerkUserId) {
    return { status: 'error', message: 'Unauthorized.' };
  }

  const verifiedEmails = await getVerifiedEmailsForUser(clerkUserId);
  const normalizedVerified = verifiedEmails.map((e) => e.toLowerCase().trim());
  if (!normalizedVerified.includes(normalizedEmail)) {
    return { status: 'error', message: 'You can only restore access for one of your own verified emails.' };
  }

  // The caller already owns a qualifying row: keep it, never clobber it and
  // never insert a second row for the same email.
  const { data: ownRow } = await supabase
    .from('user_entitlements')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle();

  if (ownRow && rowQualifies(ownRow)) {
    return { status: 'already_active', message: 'Access already active.' };
  }

  // Find the purchase recorded for this email. A purchase may have been made
  // before the buyer had a Clerk account, in which case the row is keyed
  // `email:<normalizedEmail>` (an email-only placeholder), not a real Clerk id.
  const { data: purchaser, error: purchaserError } = await supabase
    .from('user_entitlements')
    .select('*')
    .eq('email', normalizedEmail)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (purchaserError) {
    console.error('[restoreAccessByEmail] lookup failed:', purchaserError);
    return { status: 'error', message: 'Failed to look up purchase.' };
  }

  if (!purchaser) {
    return { status: 'not_found', message: 'No qualifying purchase found for this email.' };
  }

  const alreadyGranted =
    ((purchaser.entitlements || {}) as Record<string, boolean>).smartvideo_go === true ||
    ((purchaser.entitlements || {}) as Record<string, boolean>).founders === true;

  if (ownRow) {
    // The caller owns a row that does not qualify (e.g. revoked or expired).
    // Merge the purchase into the caller's own row instead of moving a
    // different row (clerk_user_id is unique), then re-activate it.
    await grantEntitlement(clerkUserId, email, ENTITLEMENTS.SMARTVIDEO_GO, 'founders');
    return alreadyGranted
      ? { status: 'already_active', message: 'Access already active.' }
      : { status: 'restored', message: 'Access restored successfully.' };
  }

  // No row owned by the caller: adopt the matching row by claiming it with the
  // caller's real Clerk id. Never inserts a second row for the same email.
  const { error: adoptError } = await supabase
    .from('user_entitlements')
    .update({ clerk_user_id: clerkUserId, updated_at: new Date().toISOString() })
    .eq('id', purchaser.id);

  if (adoptError) {
    console.error('[restoreAccessByEmail] adopt failed:', adoptError);
    return { status: 'error', message: 'Failed to restore access.' };
  }

  if (alreadyGranted) {
    return { status: 'already_active', message: 'Access already active.' };
  }

  await grantEntitlement(clerkUserId, email, ENTITLEMENTS.SMARTVIDEO_GO, 'founders');
  return { status: 'restored', message: 'Access restored successfully.' };
}
