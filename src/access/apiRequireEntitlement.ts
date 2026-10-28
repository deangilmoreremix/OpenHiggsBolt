import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { resolveSmartVideoAccessForUser } from '@/access/resolveAccess';
import {
  ENTITLEMENTS,
  type AccessState,
  type EntitlementKey,
} from '@/access/entitlements';

export type EntitlementCheckResult =
  | { allowed: true }
  | { allowed: false; status: 401 }
  | { allowed: false; status: 403; entitlement: string };

function checkEntitlementKey(entitlementKey: EntitlementKey | string, access: AccessState | null): boolean {
  if (!access) return false;

  // Super user bypasses every entitlement check.
  if (access.isSuperUser) return true;

  switch (entitlementKey) {
    case ENTITLEMENTS.SMARTVIDEO_GO:
      // Base SmartVideo GO access is granted to every signed-in Clerk user
      // by default; hasSmartVideoGo already reflects this.
      return access.hasSmartVideoGo;
    case ENTITLEMENTS.SMARTVIDEO_VIRAL:
      return access.hasSmartVideoViral;
    case ENTITLEMENTS.SMARTVIDEO_AI:
      return access.entitlements.smartvideo_ai === true;
    case ENTITLEMENTS.FOUNDERS:
      return access.entitlements.founders === true;
    default:
      // Unknown keys fall back to checking the entitlements blob directly.
      return (access.entitlements as Record<string, boolean>)[entitlementKey] === true;
  }
}

export async function requireApiEntitlement(entitlementKey: string): Promise<EntitlementCheckResult> {
  const { userId } = await auth();

  if (!userId) {
    return { allowed: false, status: 401 };
  }

  const access = await resolveSmartVideoAccessForUser(userId);

  if (!checkEntitlementKey(entitlementKey as EntitlementKey, access)) {
    return { allowed: false, status: 403, entitlement: entitlementKey };
  }

  return { allowed: true };
}

export function entitlementForbiddenResponse(entitlement: string) {
  return NextResponse.json(
    {
      error: 'PAYMENT_REQUIRED',
      entitlement,
      upgradeRequired: true,
    },
    { status: 403 }
  );
}
