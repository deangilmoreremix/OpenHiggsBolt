export const runtime = 'edge';

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    models_ready: true,
    missing: [],
    hf_cache_dir: '/deterministic/models',
    disk_free_gb: 100,
    min_free_gb: 1,
    enough_disk: true,
  });
}
