export const ENTITLEMENTS = {
  SMARTVIDEO_GO: 'smartvideo_go',
  SMARTVIDEO_AI: 'smartvideo_ai',
  SMARTVIDEO_VIRAL: 'smartvideo_viral',
  FOUNDERS: 'founders',
} as const;

export type EntitlementKey = typeof ENTITLEMENTS[keyof typeof ENTITLEMENTS];

/** Clerk email that receives full access to every feature (super user). */
export const SUPER_USER_EMAIL = 'deanvideoremix.io@gmail.com';

export function isSuperUserEmail(email: string | null | undefined): boolean {
  return typeof email === 'string' && email.toLowerCase().trim() === SUPER_USER_EMAIL.toLowerCase();
}

export interface UserEntitlements {
  smartvideo_go: boolean;
  smartvideo_ai?: boolean;
  smartvideo_viral?: boolean;
  founders?: boolean;
}

/**
 * Lifecycle status of an entitlement row (user_entitlements.status).
 *
 * - 'preview':  teaser/demo access only; never grants paid functionality.
 * - 'active':   paid and in good standing.
 * - 'lifetime': paid, permanent grant; never expires.
 * - 'pending':  purchase recorded but activation is not confirmed yet
 *               (e.g. an incomplete subscription, or a purchase awaiting
 *               reconciliation).
 * - 'expired':  subscription lapsed / canceled / unpaid.
 * - 'revoked':  refunded, disputed, or administratively removed.
 */
export type EntitlementStatus =
  | 'preview'
  | 'active'
  | 'lifetime'
  | 'pending'
  | 'expired'
  | 'revoked';

/**
 * The only statuses that grant paid functionality. preview / pending /
 * expired / revoked never qualify.
 */
export const QUALIFYING_STATUSES: readonly EntitlementStatus[] = ['active', 'lifetime'];

/**
 * True when a status grants access.
 *
 * Rows created before the status column was populated carry no status at all;
 * undefined / null / '' is tolerated as 'active' so pre-existing buyers keep
 * access. Every other value must be one of QUALIFYING_STATUSES.
 */
export function isQualifyingStatus(status?: string | null): boolean {
  if (status === undefined || status === null || status === '') {
    return true;
  }
  return (QUALIFYING_STATUSES as readonly string[]).includes(status);
}

/**
 * Statuses that take access away from a row. Only an explicit 'revoked'
 * does: production holds paying buyers whose rows read 'inactive', and
 * Stripe/refund paths write 'inactive'/'expired' without meaning removal.
 */
export const ACCESS_REMOVED_STATUSES: readonly string[] = ['revoked'];

/**
 * Base SmartVideo GO access. Access is granted by the owner only: a user
 * needs a user_entitlements row holding smartvideo_go, smartvideo_ai or
 * founders. Signing in alone grants nothing — the sign-up page is public.
 * A row marked 'revoked' never qualifies.
 */
export function hasSmartVideoGo(
  entitlements: Partial<UserEntitlements> | null | undefined,
  status?: string | null
): boolean {
  if (typeof status === 'string' && ACCESS_REMOVED_STATUSES.includes(status)) {
    return false;
  }
  return (
    entitlements?.smartvideo_go === true ||
    entitlements?.smartvideo_ai === true ||
    entitlements?.founders === true
  );
}

/**
 * go-ai-viral requires a paid smartvideo_viral entitlement with a qualifying
 * status. Not granted by default.
 */
export function hasSmartVideoViral(entitlements: UserEntitlements, status?: string): boolean {
  if (!isQualifyingStatus(status)) return false;
  // `go_viral_ai` is a legacy key set by hand on some rows; treat it as the
  // same grant.
  const legacy = (entitlements as unknown as Record<string, unknown>)?.go_viral_ai === true;
  return entitlements.smartvideo_viral === true || entitlements.founders === true || legacy;
}

export interface AccessState {
  clerkUserId: string;
  email: string;
  entitlements: UserEntitlements;
  status: EntitlementStatus | 'inactive';
  source: string;
  hasSmartVideoGo: boolean;
  hasSmartVideoViral: boolean;
  isSuperUser: boolean;
}

export type AccessResult =
  | { state: 'signed_out' }
  | { state: 'authenticated_unpaid'; access: AccessState }
  | { state: 'paid'; access: AccessState };
