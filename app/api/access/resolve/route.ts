import { NextRequest, NextResponse } from 'next/server';
import { resolveSmartVideoAccess } from '@/access/resolveAccess';

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await resolveSmartVideoAccess();
    return NextResponse.json(result);
  } catch (err) {
    console.error('[access/resolve] error:', err);
    // Access is unknown (e.g. the database timed out). The browser keeps the
    // user's last confirmed access instead of treating this as "unpaid".
    return NextResponse.json({ error: 'ACCESS_UNKNOWN' }, { status: 503 });
  }
}
