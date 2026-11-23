import { NextRequest } from 'next/server';
import { buildGateway } from '../../../../lib/mcpGatewayFactory';
import { resolveSmartVideoAccessForUser } from '@/access/resolveAccess';

// Branded gateway for the SmartVideo GO MCP server (mcp/index.js). Auth is an MCP key (see app/api/mcp-keys); the
// generation key used upstream is the user's own, already encrypted in app_users.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// requireApiEntitlement-equivalent for the key's owner (see lib/mcpGatewayFactory.ts)
// Same rule the app's proxy routes apply (requireApiEntitlement(SMARTVIDEO_GO)), evaluated for the key's owner. Fails closed.
async function authorize(principal: { userId: string }) {
  if (principal.userId === 'byok') return true;
  const access = await resolveSmartVideoAccessForUser(principal.userId);
  return !!access && (access.isSuperUser || access.hasSmartVideoGo);
}

const handler = buildGateway({ authorize });

async function run(req: NextRequest) {
  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => { headers[k] = v; });
  const body = req.method === 'POST' ? await req.text() : undefined;
  const u = new URL(req.url);
  const out = await handler({ httpMethod: req.method, path: u.pathname + u.search, headers, body });
  return new Response(out.body, { status: out.statusCode, headers: out.headers });
}

export const GET = run;
export const POST = run;
