import { brand, endpointFixes } from '../../../mcp/brand.js';
import { customTools } from '../../../mcp/tools.js';
import catalogEntries from '../../../mcp/catalog.json';
import { createHttpHandler } from '../../../lib/mcpHttp.js';
import { buildGateway, resolveCaller } from '../../../lib/mcpGatewayFactory';
import { defaultRateLimiter } from '../../../lib/mcpRateLimit.js';
import { getSupabaseAdmin } from '@/lib/supabaseServer';
import { resolveSmartVideoAccessForUser } from '@/access/resolveAccess';

// Hosted SmartVideo GO MCP: `claude mcp add --transport http https://<site>/api/mcp --header "Authorization: Bearer sv_live_…"`.
// Stateless; auth is an MCP key (see app/api/mcp-keys). POST only.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// requireApiEntitlement-equivalent for the key's owner
// Same rule the app's proxy routes apply (requireApiEntitlement(SMARTVIDEO_GO)), evaluated for the key's owner. Fails closed.
async function authorize(principal: { userId: string }) {
  if (principal.userId === 'byok') return true;
  const access = await resolveSmartVideoAccessForUser(principal.userId);
  return !!access && (access.isSuperUser || access.hasSmartVideoGo);
}

let handler: ((req: Request) => Promise<Response>) | null = null;
const get = () => (handler ||= createHttpHandler({
  brand, customTools, catalogEntries: catalogEntries as any[], endpointFixes,
  gateway: buildGateway({ authorize, limiter: null }), // the limit is counted once per MCP request below
  resolveCaller,
  limiter: defaultRateLimiter({ admin: getSupabaseAdmin() }),
}));

export const POST = (req: Request) => get()(req);
export const GET = (req: Request) => get()(req);
export const OPTIONS = (req: Request) => get()(req);
