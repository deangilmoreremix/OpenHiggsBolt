export const runtime = 'edge';

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ valid: true });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const key = typeof body?.key === 'string' ? body.key.trim() : '';
  
  if (key.length < 8) {
    return NextResponse.json({ valid: false, reason: 'Key must be at least 8 characters.' }, { status: 400 });
  }
  
  return NextResponse.json({ valid: true });
}
