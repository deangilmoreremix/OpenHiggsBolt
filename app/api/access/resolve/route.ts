import { NextRequest, NextResponse } from 'next/server';
import { resolveSmartVideoAccess } from '@/access/resolveAccess';

export async function GET() {
  try {
    const result = await resolveSmartVideoAccess();
    return NextResponse.json(result);
  } catch (err) {
    console.error('[access/resolve] error:', err);
    return NextResponse.json(
      { state: 'authenticated_unpaid', access: null },
      { status: 500 }
    );
  }
}
