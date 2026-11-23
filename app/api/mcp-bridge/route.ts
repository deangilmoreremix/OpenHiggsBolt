import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseServer';
import { createBridge, createSupabaseBridgeStore } from '../../../packages/studio-mcp-core/src/bridge.js';
import { createTabEndpoint } from '../../../lib/mcpBridgeEndpoint.js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// The tab half of the MCP live-tab bridge. Clerk session required: only the signed-in owner's own tab can register, poll or answer,
// and a command is only ever handed to a session of the same user.
//   POST { action: 'register', sessionId?, label, studio, tools } | { action: 'poll', sessionId } | { action: 'respond', sessionId, commandId, status, result?, error? } | { action: 'close', sessionId }
export async function POST(request: Request) {
  const { userId } = await auth();
  const noStore = { 'Cache-Control': 'no-store' };
  if (!userId) return NextResponse.json({ ok: false, error: { code: 'not_signed_in', message: 'Sign in first' } }, { status: 401, headers: noStore });
  const raw = await request.text();
  if (raw.length > 1_500_000) return NextResponse.json({ ok: false, error: { code: 'too_large', message: 'Request too large' } }, { status: 413, headers: noStore });
  let body: any;
  try { body = JSON.parse(raw || '{}'); } catch { return NextResponse.json({ ok: false, error: { code: 'bad_request', message: 'Body must be JSON' } }, { status: 400, headers: noStore }); }
  const endpoint = createTabEndpoint({ bridge: createBridge({ store: createSupabaseBridgeStore(getSupabaseAdmin()), brandName: 'SmartVideo GO' } as any) });
  const out = await endpoint(userId, body);
  return NextResponse.json(out.body, { status: out.status, headers: noStore });
}
