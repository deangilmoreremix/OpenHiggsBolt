import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { resolveSmartVideoAccessForUser } from '@/access/resolveAccess';
import { ENTITLEMENTS } from '@/access/entitlements';

export type EntitlementCheckResult =
  | { allowed: true }
  | { allowed: false; status: 401 }
  | { allowed: false; status: 403; entitlement: string };

export async function requireApiEntitlement(entitlementKey: string): Promise<EntitlementCheckResult> {
  const { userId } = await auth();

  if (!userId) {
    return { allowed: false, status: 401 };
  }

  const access = await resolveSmartVideoAccessForUser(userId);

  if (!access || !access.hasSmartVideoGo) {
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
