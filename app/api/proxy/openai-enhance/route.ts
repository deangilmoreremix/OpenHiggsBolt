import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOpenAiKeyForUser } from '@/src/lib/openaiKeyServer';

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const ENHANCE_FUNCTION = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/enhance-prompt` : '/.netlify/functions/enhance-prompt';

async function resolveUserAndKey(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return { userId: null, key: null, status: 401 as const };

  const key = await getOpenAiKeyForUser();
  if (!key) {
    return { userId: null, key: null, status: 401 as const };
  }

  return { userId, key, status: 200 as const };
}

export async function POST(req: NextRequest) {
  const { userId, key, status } = await resolveUserAndKey(req);
  if (!userId) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status });
  }

  try {
    const body = await req.json();
    const upstream = await fetch(ENHANCE_FUNCTION, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-openai-key': key,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60000),
    });

    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
