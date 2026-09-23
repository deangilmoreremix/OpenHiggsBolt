export const runtime = 'edge';

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    cpu: 0,
    ram: 0,
    total_ram: 32,
    vram: 0,
    gpu_active: false,
  });
}
