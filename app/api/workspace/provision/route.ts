import { NextResponse } from 'next/server';
import { ensureUserAndWorkspace } from '../../../../src/lib/tenantSync';
import { apiError } from '@/lib/apiError';

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const { user, workspace } = await ensureUserAndWorkspace();
    return NextResponse.json({ ok: true, user, workspace });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return apiError('provision_failed', message, 500);
  }
}
