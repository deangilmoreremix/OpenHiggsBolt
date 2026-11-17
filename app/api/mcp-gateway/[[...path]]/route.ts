import { NextRequest } from 'next/server';
// Branded gateway for the SmartVideo GO MCP server (mcp/index.js). BYOK: the caller's key is used per request only.
// @ts-expect-error plain JS module
import { handler } from '../../../../lib/mcpGateway.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function run(req: NextRequest) {
  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => { headers[k] = v; });
  const body = req.method === 'POST' ? await req.text() : undefined;
  const out = await handler({ httpMethod: req.method, path: new URL(req.url).pathname, headers, body });
  return new Response(out.body, { status: out.statusCode, headers: out.headers });
}

export const GET = run;
export const POST = run;
