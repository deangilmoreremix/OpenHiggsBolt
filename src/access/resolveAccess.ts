import { auth, currentUser } from '@clerk/nextjs/server';
import { getSupabaseAdmin } from '@/lib/supabaseServer';
import { ENTITLEMENTS, isQualifyingStatus, type AccessState, type AccessResult, type EntitlementStatus, type UserEntitlements } from './entitlements';

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

export interface RevokeEntitlementLocator {
  clerkUserId?: string;
  email?: string;
  stripeCustomerId?: string;
}

export interface RevokeEntitlementResult {
  revoked: boolean;
  matched: number;
  reason: string;
}

// Revocation is a status flip, never a delete: the row (and the entitlements the
// user originally bought) is kept for history, while `status: 'inactive'` makes
// hasSmartVideoGo() resolve false for every paid check.
export async function revokeEntitlement(
  locator: RevokeEntitlementLocator,
  options: { reason?: string } = {}
): Promise<RevokeEntitlementResult> {
  const supabase = getSupabaseAdmin();
  const reason = options.reason || 'revoked';

  const matches = new Map<string, { id: string }>();

  const collect = (rows: { id: string }[] | null) => {
    for (const row of rows || []) {
      if (row?.id) matches.set(String(row.id), row);
    }
  };

  if (locator.clerkUserId) {
    const { data } = await supabase
      .from('user_entitlements')
      .select('id')
      .eq('clerk_user_id', locator.clerkUserId);
    collect(data);
  }

  if (locator.email) {
    const { data } = await supabase
      .from('user_entitlements')
      .select('id')
      .eq('email', locator.email.toLowerCase().trim());
    collect(data);
  }

  if (locator.stripeCustomerId) {
    const { data } = await supabase
      .from('user_entitlements')
      .select('id')
      .eq('stripe_customer_id', locator.stripeCustomerId);
    collect(data);
  }

  const ids = Array.from(matches.keys());
  if (ids.length === 0) {
    return { revoked: false, matched: 0, reason };
  }

  const { error } = await supabase
    .from('user_entitlements')
    .update({ status: 'inactive', updated_at: new Date().toISOString() })
    .in('id', ids);

  if (error) {
    console.error('[revokeEntitlement] failed:', error);
    throw new Error('Failed to revoke entitlement');
  }

  return { revoked: true, matched: ids.length, reason };
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

function getUserVerifiedEmails(userId: string): string[] {
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

  const { userId } = await auth();
  if (!userId || userId !== clerkUserId) {
    return { status: 'error', message: 'Unauthorized.' };
  }

  const verifiedEmails = await getVerifiedEmailsForUser(clerkUserId);
  const normalizedVerified = verifiedEmails.map((e) => e.toLowerCase().trim());
  if (!normalizedVerified.includes(normalizedEmail)) {
    return { status: 'error', message: 'You can only restore access for one of your own verified emails.' };
  }

  const { data: ownRow } = await supabase
    .from('user_entitlements')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle();

  if (ownRow && rowQualifies(ownRow)) {
    return { status: 'already_active', message: 'Access already active.' };
  }

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
    await grantEntitlement(clerkUserId, email, ENTITLEMENTS.SMARTVIDEO_GO, 'founders');
    return alreadyGranted
      ? { status: 'already_active', message: 'Access already active.' }
      : { status: 'restored', message: 'Access restored successfully.' };
  }

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
