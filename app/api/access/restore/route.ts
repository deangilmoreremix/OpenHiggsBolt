import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { restoreAccessByEmail } from '@/access/resolveAccess';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
    }

    const body = await req.json();
    const email = typeof body?.email === 'string' ? body.email.trim() : '';

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const result = await restoreAccessByEmail(userId, email);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { status: 'error', message: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
