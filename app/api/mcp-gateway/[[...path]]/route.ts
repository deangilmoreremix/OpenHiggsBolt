import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseServer';
import { decryptMuapiKey } from '@/lib/muapiKeyCrypto';
import { resolveSmartVideoAccessForUser } from '@/access/resolveAccess';
// @ts-expect-error plain JS modules
import { createHandler } from '../../../../lib/mcpGateway.js';
// @ts-expect-error plain JS modules
import { createStore, resolveMcpKey } from '../../../../lib/mcpKeys.js';

// Branded gateway for the SmartVideo GO MCP server (mcp/index.js). Auth is an MCP key (see app/api/mcp-keys); the
// generation key used upstream is the user's own, already encrypted in app_users.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function loadUserKeys(userId: string) {
  const { data } = await getSupabaseAdmin().from('app_users').select('muapi_key, openai_key').eq('clerk_user_id', userId).maybeSingle();
  const muapi = data?.muapi_key ? decryptMuapiKey(data.muapi_key) : null;
  const openai = data?.openai_key ? decryptMuapiKey(data.openai_key) : null;
  return muapi ? { muapi, openai } : null;
}

// Same rule the app's proxy routes apply (requireApiEntitlement(SMARTVIDEO_GO)), evaluated for the key's owner. Fails closed.
async function authorize(principal: { userId: string }) {
  if (principal.userId === 'byok') return true;
  const access = await resolveSmartVideoAccessForUser(principal.userId);
  return !!access && (access.isSuperUser || access.hasSmartVideoGo);
}

const handler = createHandler({
  resolve: (raw: string) => resolveMcpKey(createStore(getSupabaseAdmin()), loadUserKeys, raw),
  authorize,
});

async function run(req: NextRequest) {
  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => { headers[k] = v; });
  const body = req.method === 'POST' ? await req.text() : undefined;
  const out = await handler({ httpMethod: req.method, path: new URL(req.url).pathname, headers, body });
  return new Response(out.body, { status: out.statusCode, headers: out.headers });
}

export const GET = run;
export const POST = run;
