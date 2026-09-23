export const runtime = 'edge';

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    available: false,
    prompted: true,
    opted_in: false,
  });
}
