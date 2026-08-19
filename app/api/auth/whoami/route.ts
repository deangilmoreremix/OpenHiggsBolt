import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import {
  getCurrentWorkspace,
  ensureUserAndWorkspace,
} from '../../../../src/lib/tenantSync';
import { apiError } from '@/lib/apiError';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ userId: null, workspace: null });
    }

    // Provision the Clerk user (and their workspace) on-the-fly. The
    // `user.created` Clerk webhook is the intended sync path, but if that
    // webhook fails verification (e.g. a misconfigured signing secret) the
    // `app_users` row is never created. `getCurrentWorkspace()` then returns
    // `{ userId, workspace: null }`, so the app shows the user as "signed in"
    // but with no workspace — features break and it looks like they are "signed
    // in when they are not". Provisioning here makes the studio robust
    // regardless of webhook health.
    let workspace = null;
    try {
      const result = await ensureUserAndWorkspace();
      workspace = result.workspace;
    } catch {
      // If provisioning fails (DB/network), fall back to a read-only lookup so
      // we still report the authenticated user instead of locking them out.
      workspace = await getCurrentWorkspace();
    }

    return NextResponse.json({ userId, workspace });
  } catch {
    return apiError('unauthenticated', 'Authentication required', 401);
  }
}
