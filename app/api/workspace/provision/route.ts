import { NextResponse } from 'next/server';
import { ensureUserAndWorkspace } from '../../../../src/lib/tenantSync';

export async function POST() {
  try {
    const { user, workspace } = await ensureUserAndWorkspace();
    return NextResponse.json({ ok: true, user, workspace });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
