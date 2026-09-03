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

export interface AccessState {
  clerkUserId: string;
  email: string;
  entitlements: UserEntitlements;
  status: 'active' | 'inactive';
  source: string;
  hasSmartVideoGo: boolean;
}

export type AccessResult =
  | { state: 'signed_out' }
  | { state: 'authenticated_unpaid'; access: AccessState }
  | { state: 'paid'; access: AccessState };
