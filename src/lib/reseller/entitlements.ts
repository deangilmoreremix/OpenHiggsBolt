import { getSupabaseAdmin } from '@/lib/supabaseServer';
import { grantEntitlement } from '@/access/resolveAccess';
import {
  getResellerPackage,
  isResellerEntitlementKey,
  RESELLER_ENTITLEMENTS,
  type ResellerEntitlementKey,
  type ResellerPackageId,
} from './packages';

export interface ResellerEntitlementHolder {
  entitlements?: Record<string, boolean> | null;
  status?: string | null;
}

export interface ResellerUserState extends ResellerEntitlementHolder {
  exists: boolean;
  clerkUserId: string;
  email: string;
  status: string;
  entitlements: Record<string, boolean>;
  resellerEntitlements: ResellerEntitlementKey[];
  hasDiy: boolean;
  hasTraining: boolean;
}

export type UpgradeEligibility =
  | { eligible: true }
  | {
      eligible: false;
      reason: 'ALREADY_TRAINING' | 'UPGRADE_NOT_ELIGIBLE';
      message: string;
    };

export interface ApplyResellerPurchaseInput {
  clerkUserId?: string | null;
  email: string;
  packageId: ResellerPackageId;
  stripeSessionId?: string | null;
  stripeCustomerId?: string | null;
  amountTotal?: number | null;
  currency?: string | null;
}

export interface ApplyResellerPurchaseResult {
  clerkUserId: string | null;
  packageId: ResellerPackageId;
  granted: ResellerEntitlementKey[];
  alreadyGranted: ResellerEntitlementKey[];
  purchaseRecorded: boolean;
  duplicatePurchase: boolean;
  reason?: 'NO_USER';
}

export function isResellerStatusActive(status?: string | null): boolean {
  return status === undefined || status === null || status === '' || status === 'active';
}

export function getResellerEntitlements(
  user: ResellerEntitlementHolder | null | undefined
): ResellerEntitlementKey[] {
  if (!user || !isResellerStatusActive(user.status)) return [];

  const entitlements = user.entitlements || {};
  return (Object.values(RESELLER_ENTITLEMENTS) as ResellerEntitlementKey[]).filter(
    (key) => entitlements[key] === true
  );
}

export function hasResellerEntitlement(
  user: ResellerEntitlementHolder | null | undefined,
  key: string
): boolean {
  if (!isResellerEntitlementKey(key)) return false;
  return getResellerEntitlements(user).includes(key);
}

export function hasDiyEntitlement(user: ResellerEntitlementHolder | null | undefined): boolean {
  return hasResellerEntitlement(user, RESELLER_ENTITLEMENTS.DIY);
}

export function hasTrainingEntitlement(
  user: ResellerEntitlementHolder | null | undefined
): boolean {
  return hasResellerEntitlement(user, RESELLER_ENTITLEMENTS.TRAINING);
}

export function evaluateUpgradeEligibility(
  user: ResellerEntitlementHolder | null | undefined
): UpgradeEligibility {
  if (hasTrainingEntitlement(user)) {
    return {
      eligible: false,
      reason: 'ALREADY_TRAINING',
      message: 'This account already owns Apps + Training.',
    };
  }

  if (!hasDiyEntitlement(user)) {
    return {
      eligible: false,
      reason: 'UPGRADE_NOT_ELIGIBLE',
      message: 'The $400 upgrade requires an active DIY App Builder purchase.',
    };
  }

  return { eligible: true };
}

function toResellerUserState(
  clerkUserId: string,
  row: {
    email?: string | null;
    entitlements?: Record<string, boolean> | null;
    status?: string | null;
  } | null
): ResellerUserState {
  const entitlements = (row?.entitlements || {}) as Record<string, boolean>;
  const state: ResellerUserState = {
    exists: Boolean(row),
    clerkUserId,
    email: row?.email || '',
    status: row?.status || '',
    entitlements,
    resellerEntitlements: [],
    hasDiy: false,
    hasTraining: false,
  };

  state.resellerEntitlements = getResellerEntitlements(state);
  state.hasDiy = state.resellerEntitlements.includes(RESELLER_ENTITLEMENTS.DIY);
  state.hasTraining = state.resellerEntitlements.includes(RESELLER_ENTITLEMENTS.TRAINING);

  return state;
}

export async function getResellerUserState(clerkUserId: string): Promise<ResellerUserState> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('user_entitlements')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle();

  return toResellerUserState(clerkUserId, data || null);
}

export async function findClerkUserIdByEmail(email: string): Promise<string | null> {
  const normalizedEmail = email.toLowerCase().trim();
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('user_entitlements')
    .select('clerk_user_id')
    .eq('email', normalizedEmail)
    .maybeSingle();

  return data?.clerk_user_id || null;
}

export async function applyResellerPurchase(
  input: ApplyResellerPurchaseInput
): Promise<ApplyResellerPurchaseResult> {
  const pkg = getResellerPackage(input.packageId);
  if (!pkg) {
    throw new Error(`Unknown reseller package: ${input.packageId}`);
  }

  const normalizedEmail = input.email.toLowerCase().trim();
  let clerkUserId = input.clerkUserId || null;
  if (!clerkUserId) {
    clerkUserId = await findClerkUserIdByEmail(normalizedEmail);
  }

  const result: ApplyResellerPurchaseResult = {
    clerkUserId: clerkUserId || null,
    packageId: pkg.id,
    granted: [],
    alreadyGranted: [],
    purchaseRecorded: false,
    duplicatePurchase: false,
  };

  if (!clerkUserId) {
    result.reason = 'NO_USER';
    return result;
  }

  const currentState = await getResellerUserState(clerkUserId);
  const held = getResellerEntitlements(currentState);

  for (const key of pkg.grantsEntitlements) {
    if (held.includes(key)) {
      result.alreadyGranted.push(key);
      continue;
    }

    await grantEntitlement(clerkUserId, normalizedEmail, key, 'stripe', {
      stripe_customer_id: input.stripeCustomerId || undefined,
      stripe_subscription_id: undefined,
    });
    result.granted.push(key);
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('reseller_purchases').insert({
    clerk_user_id: clerkUserId,
    email: normalizedEmail,
    package_id: pkg.id,
    entitlement_keys: pkg.grantsEntitlements,
    stripe_session_id: input.stripeSessionId || null,
    stripe_customer_id: input.stripeCustomerId || null,
    amount_total: input.amountTotal ?? null,
    currency: input.currency || pkg.currency,
    status: 'completed',
  });

  if (error) {
    if (error.code === '23505') {
      result.duplicatePurchase = true;
      return result;
    }
    console.error('[reseller] failed to record purchase:', error);
    throw new Error('Failed to record reseller purchase');
  }

  result.purchaseRecorded = true;
  return result;
}
