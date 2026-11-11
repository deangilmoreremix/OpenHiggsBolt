export const ENTITLEMENTS = {
  SMARTVIDEO_GO: 'smartvideo_go',
  SMARTVIDEO_AI: 'smartvideo_ai',
  SMARTVIDEO_VIRAL: 'smartvideo_viral',
  /** Key the GO-Viral purchase is recorded under in user_entitlements. */
  GO_VIRAL_AI: 'go_viral_ai',
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
  go_viral_ai?: boolean;
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
 * Base SmartVideo GO access: every app except the two paid ones (GO-Viral
 * studio and the reseller apps). Every signed-in Clerk user has it — no
 * purchase and no particular entitlement status is required, so there is no
 * preview mode for these apps.
 */
export function hasSmartVideoGo(_entitlements?: UserEntitlements, _status?: string): boolean {
  return true;
}

/**
 * GO-Viral studio is one of the two gated apps. It needs a paid GO-Viral
 * entitlement with a qualifying status. Purchases are recorded as
 * `go_viral_ai`; `smartvideo_viral` and `founders` also grant it.
 */
export function hasSmartVideoViral(entitlements: UserEntitlements, status?: string): boolean {
  if (!isQualifyingStatus(status)) return false;
  return (
    entitlements.go_viral_ai === true ||
    entitlements.smartvideo_viral === true ||
    entitlements.founders === true
  );
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
