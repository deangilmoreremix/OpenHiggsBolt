export const runtime = 'edge';

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    tts: { active: null, backends: [] },
    asr: { active: null, backends: [] },
    llm: { active: null, backends: [] },
  });
}
