import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '../../../../src/lib/tenantSync';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ userId: null, workspace: null });
    }
    const workspace = await getCurrentWorkspace();
    return NextResponse.json({ userId, workspace });
  } catch {
    return NextResponse.json({ userId: null, workspace: null });
  }
}
