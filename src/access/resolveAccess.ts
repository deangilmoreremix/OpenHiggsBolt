import { auth, currentUser } from '@clerk/nextjs/server';
import { getSupabaseAdmin } from '@/lib/supabaseServer';
import { ENTITLEMENTS, type AccessState, type AccessResult, type UserEntitlements } from './entitlements';

function hasSmartVideoGo(entitlements: UserEntitlements, status?: string): boolean {
  const isActive = status === 'active' || status === undefined || status === '';
  return isActive && (entitlements.smartvideo_go === true || entitlements.founders === true);
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

  const { error } = await supabase
    .from('user_entitlements')
    .upsert(payload, { onConflict: 'clerk_user_id' });

  if (error) {
    console.error('[grantEntitlement] failed:', error);
    throw new Error('Failed to grant entitlement');
  }
}

function getUserVerifiedEmails(userId: string): string[] {
  // This function is used only in server contexts where Clerk's auth() is available.
  // It returns verified email addresses for the authenticated user.
  // The actual implementation depends on the Clerk SDK version and API.
  // For now, we'll use a simple approach that validates the email matches the user's primary email.
  return [];
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

  const { data: purchaser } = await supabase
    .from('user_entitlements')
    .select('*')
    .eq('email', normalizedEmail)
    .eq('status', 'active')
    .maybeSingle();

  if (!purchaser) {
    return { status: 'not_found', message: 'No qualifying purchase found for this email.' };
  }

  const entitlements = purchaser.entitlements as Record<string, boolean>;
  if (entitlements.smartvideo_go) {
    await supabase
      .from('user_entitlements')
      .update({ clerk_user_id: clerkUserId, updated_at: new Date().toISOString() })
      .eq('id', purchaser.id);

    return { status: 'already_active', message: 'Access already active.' };
  }

  await grantEntitlement(clerkUserId, email, ENTITLEMENTS.SMARTVIDEO_GO, 'founders');
  return { status: 'restored', message: 'Access restored successfully.' };
}
