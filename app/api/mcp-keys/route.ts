import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseServer';
import { createStore, createMcpKey } from '../../../lib/mcpKeys.js';
import { requireApiEntitlement, entitlementForbiddenResponse } from '@/access/apiRequireEntitlement';
import { ENTITLEMENTS } from '@/access/entitlements';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Create / list / revoke SmartVideo GO MCP keys. Clerk session required; the raw key is returned once, on create.
//   POST { action: 'create', label? } | { action: 'list' } | { action: 'revoke', id }
const fail = (status: number, code: string, message: string) => NextResponse.json({ ok: false, error: { code, message } }, { status });

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return fail(401, 'not_signed_in', 'Sign in first');
  let body: any;
  try { body = await request.json(); } catch { return fail(400, 'bad_request', 'Body must be JSON'); }

  const store = createStore(getSupabaseAdmin());
  try {
    if (body?.action === 'list') {
      const keys = (await store.listForUser(userId)).map((k: any) => ({ id: k.id, label: k.label, prefix: k.key_prefix, created_at: k.created_at, last_used_at: k.last_used_at }));
      return NextResponse.json({ ok: true, keys });
    }
    if (body?.action === 'revoke') {
      if (!/^[0-9a-f-]{36}$/i.test(String(body.id || ''))) return fail(400, 'bad_request', 'Invalid id');
      return (await store.revoke(userId, body.id)) ? NextResponse.json({ ok: true }) : fail(404, 'not_found', 'Key not found');
    }
    if (body?.action === 'create') {
      const ent = await requireApiEntitlement(ENTITLEMENTS.SMARTVIDEO_GO);
      if (!ent.allowed) return ent.status === 401 ? fail(401, 'not_signed_in', 'Sign in first') : entitlementForbiddenResponse(ENTITLEMENTS.SMARTVIDEO_GO);
      // The MCP uses the generation key the user already saved (Settings → API key); there must be one.
      const { data } = await getSupabaseAdmin().from('app_users').select('muapi_key').eq('clerk_user_id', userId).maybeSingle();
      if (!data?.muapi_key) return fail(400, 'no_key', 'Save your API key in Settings first, then create an MCP key.');
      const r = await createMcpKey(store, { userId, label: body.label });
      return r.error ? fail(400, r.error, r.message) : NextResponse.json({ ok: true, key: r.key, id: r.id, prefix: r.prefix, label: r.label });
    }
    return fail(400, 'bad_request', 'Unknown action');
  } catch {
    return fail(500, 'server_error', 'Could not complete that request.');
  }
}
