export const ENTITLEMENTS = {
  SMARTVIDEO_GO: 'smartvideo_go',
  SMARTVIDEO_AI: 'smartvideo_ai',
  FOUNDERS: 'founders',
} as const;

export type EntitlementKey = typeof ENTITLEMENTS[keyof typeof ENTITLEMENTS];

export interface UserEntitlements {
  smartvideo_go: boolean;
  smartvideo_ai?: boolean;
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

export interface AccessState {
  clerkUserId: string;
  email: string;
  entitlements: UserEntitlements;
  status: EntitlementStatus | 'inactive';
  source: string;
  hasSmartVideoGo: boolean;
}

export type AccessResult =
  | { state: 'signed_out' }
  | { state: 'authenticated_unpaid'; access: AccessState }
  | { state: 'paid'; access: AccessState };
