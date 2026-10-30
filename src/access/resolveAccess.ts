import { auth, currentUser } from '@clerk/nextjs/server';
import { getSupabaseAdmin } from '@/lib/supabaseServer';
import {
  ENTITLEMENTS,
  hasSmartVideoGo,
  hasSmartVideoViral,
  isSuperUserEmail,
  isQualifyingStatus,
  type AccessState,
  type AccessResult,
  type EntitlementStatus,
  type UserEntitlements,
} from './entitlements';

export const EMAIL_ONLY_CLERK_ID_PREFIX = 'email:';

export function emailOnlyClerkId(email: string): string {
  return `${EMAIL_ONLY_CLERK_ID_PREFIX}${email.toLowerCase().trim()}`;
}

export function isEmailOnlyClerkId(clerkUserId: string | null | undefined): boolean {
  return typeof clerkUserId === 'string' && clerkUserId.startsWith(EMAIL_ONLY_CLERK_ID_PREFIX);
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

/**
 * When a buyer paid without a Clerk account, the webhook records the purchase
 * under an `email:<email>` placeholder row (see recordEmailOnlyPurchase).
 * That placeholder can never satisfy hasSmartVideoGo for a real Clerk user,
 * because isEmailOnlyClerkId() never matches a genuine Clerk userId.
 *
 * This helper adopts the placeholder: it repoints clerk_user_id to the real
 * Clerk userId so the purchase becomes visible to resolveSmartVideoAccess.
 * It is safe to call repeatedly — subsequent calls find no placeholder and
 * return null.
 */
async function adoptEmailOnlyPlaceholder(userId: string): Promise<{ clerk_user_id: string; email: string; entitlements: any; status: string; source: string } | null> {
  const verifiedEmails = await getVerifiedEmailsForUser(userId);
  const supabase = getSupabaseAdmin();

  for (const email of verifiedEmails) {
    const normalizedEmail = email.toLowerCase().trim();
    const { data: emailRow } = await supabase
      .from('user_entitlements')
      .select('*')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (!emailRow || !isEmailOnlyClerkId(emailRow.clerk_user_id)) {
      continue;
    }

    const merged = (emailRow.entitlements || {}) as Record<string, boolean>;
    const { error } = await supabase
      .from('user_entitlements')
      .update({
        clerk_user_id: userId,
        email: normalizedEmail,
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', emailRow.id);

    if (error) {
      console.error('[adoptEmailOnlyPlaceholder] failed:', error);
      continue;
    }

    return {
      clerk_user_id: userId,
      email: normalizedEmail,
      entitlements: merged,
      status: 'active',
      source: emailRow.source || 'stripe',
    };
  }

  return null;
}

export async function resolveSmartVideoAccess(): Promise<AccessResult> {
  const { userId } = await auth();

  if (!userId) {
    return { state: 'signed_out' };
  }

  const supabase = getSupabaseAdmin();
  let { data } = await supabase
    .from('user_entitlements')
    .select('*')
    .eq('clerk_user_id', userId)
    .maybeSingle();

  // Super user bypass: deanvideoremix.io@gmail.com gets full access to
  // everything (SmartVideo GO + go-ai-viral + reseller).
  const verifiedEmails = await getVerifiedEmailsForUser(userId);
  const isSuperUser = verifiedEmails.some((email) => isSuperUserEmail(email));

  // Auto-adopt an email-only placeholder row if one exists for this user's
  // verified email. Paid buyers who purchased before signing into Clerk are
  // otherwise misclassified as unpaid/demo users.
  if (!data) {
    const adopted = await adoptEmailOnlyPlaceholder(userId);
    if (adopted) {
      data = adopted as any;
    }
  }

  const entitlements = (data?.entitlements || {}) as UserEntitlements;
  const status = data?.status || 'inactive';
  const email = data?.email || '';

  // Every signed-in Clerk user gets base SmartVideo GO access by default.
  // A purchased row only needs to confirm it; it is never required.
  const baseAccess = isSuperUser || hasSmartVideoGo(entitlements, status);

  // go-ai-viral requires a paid smartvideo_viral entitlement (or super user).
  const viralAccess = isSuperUser || hasSmartVideoViral(entitlements, status);

  const hasAccess = baseAccess;

  return {
    state: hasAccess ? 'paid' : 'authenticated_unpaid',
    access: {
      clerkUserId: userId,
      email,
      entitlements,
      status,
      source: data?.source || 'manual',
      hasSmartVideoGo: baseAccess,
      hasSmartVideoViral: viralAccess,
      isSuperUser,
    },
  };
}

export async function resolveSmartVideoAccessForUser(clerkUserId: string): Promise<AccessState | null> {
  const supabase = getSupabaseAdmin();
  let { data } = await supabase
    .from('user_entitlements')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle();

  // Super user bypass via Clerk-verified email.
  const verifiedEmails = await getVerifiedEmailsForUser(clerkUserId);
  const isSuperUser = verifiedEmails.some((email) => isSuperUserEmail(email));

  // Auto-adopt an email-only placeholder row if one exists for this user's
  // verified email.
  if (!data) {
    const adopted = await adoptEmailOnlyPlaceholder(clerkUserId);
    if (adopted) {
      data = adopted as any;
    }
  }

  const entitlements = (data?.entitlements || {}) as UserEntitlements;
  const status = data?.status || 'inactive';
  const email = data?.email || '';

  // Every signed-in Clerk user gets base SmartVideo GO access by default.
  const baseAccess = isSuperUser || hasSmartVideoGo(entitlements, status);
  const viralAccess = isSuperUser || hasSmartVideoViral(entitlements, status);

  return {
    clerkUserId,
    email,
    entitlements,
    status,
    source: data?.source || 'manual',
    hasSmartVideoGo: baseAccess,
    hasSmartVideoViral: viralAccess,
    isSuperUser,
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
  /**
   * When set, only rows granted by THIS subscription are revoked. A
   * subscription event must not revoke an independent lifetime purchase or a
   * different subscription that happens to share the customer or user.
   */
  stripeSubscriptionId?: string;
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

  // Narrow every lookup to the subscription's own rows when one is given.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the query builder type is not exported
  const scoped = (query: any) =>
    locator.stripeSubscriptionId
      ? query.eq('stripe_subscription_id', locator.stripeSubscriptionId)
      : query;

  const collect = (rows: { id: string }[] | null) => {
    for (const row of rows || []) {
      if (row?.id) matches.set(String(row.id), row);
    }
  };

  if (locator.clerkUserId) {
    const { data } = await scoped(
      supabase
        .from('user_entitlements')
        .select('id')
        .eq('clerk_user_id', locator.clerkUserId)
    );
    collect(data);
  }

  if (locator.email) {
    const { data } = await scoped(
      supabase
        .from('user_entitlements')
        .select('id')
        .eq('email', locator.email.toLowerCase().trim())
    );
    collect(data);
  }

  if (locator.stripeCustomerId) {
    const { data } = await scoped(
      supabase
        .from('user_entitlements')
        .select('id')
        .eq('stripe_customer_id', locator.stripeCustomerId)
    );
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

  // Never downgrade a row that already holds a permanent grant
  // (smartvideo_go or founders). Subscription refunds and
  // non-active subscription events would otherwise flip status to
  // 'expired'/'revoked' on every Stripe event, revoking access
  // for paid users on a recurring basis.
  const { data: current } = await supabase
    .from('user_entitlements')
    .select('entitlements')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle();
  const ents = current?.entitlements as Record<string, boolean> | undefined;
  const isPermanent = ents?.smartvideo_go === true || ents?.founders === true;
  const qualifying = status === 'active' || status === 'lifetime';
  if (isPermanent && !qualifying) return;

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
