import { getSupabaseAdmin } from '@/lib/supabaseServer';
import { decryptMuapiKey } from '@/lib/muapiKeyCrypto';
import { createHandler } from './mcpGateway.js';
import { createStore, resolveMcpKey } from './mcpKeys.js';
import { gatewayStudios } from './mcpStudios';
import { createBridge, createSupabaseBridgeStore } from '../packages/studio-mcp-core/src/bridge.js';
import { createGovernor, createSupabaseGovernorStore } from '../packages/studio-mcp-core/src/governor.js';
import { handleText as zackdText } from './zackdFunction.js';
import { defaultRateLimiter } from './mcpRateLimit.js';

// The one place the SmartVideo GO gateway is assembled from real services; used by /api/mcp-gateway and the hosted /api/mcp endpoint.
async function loadUserKeys(userId: string) {
  const { data } = await getSupabaseAdmin().from('app_users').select('muapi_key, openai_key').eq('clerk_user_id', userId).maybeSingle();
  const muapi = data?.muapi_key ? decryptMuapiKey(data.muapi_key) : null;
  const openai = data?.openai_key ? decryptMuapiKey(data.openai_key) : null;
  return muapi ? { muapi, openai } : null;
}

export function buildGateway({ authorize, limiter = defaultRateLimiter({ admin: getSupabaseAdmin() }) }: { authorize: (principal: { userId: string }) => Promise<boolean>, limiter?: any }) {
  return createHandler({
  resolve: (raw: string) => resolveMcpKey(createStore(getSupabaseAdmin()), loadUserKeys, raw),
  authorize,
  bridge: createBridge({ store: createSupabaseBridgeStore(getSupabaseAdmin()), brandName: 'SmartVideo GO' } as any),
  governor: createGovernor({ store: createSupabaseGovernorStore(getSupabaseAdmin()), caps: { destructive: Number(process.env.MCP_CAP_DESTRUCTIVE) || 50, publish: Number(process.env.MCP_CAP_PUBLISH) || 20 } }),
  studios: {
    ...gatewayStudios(),
    // Zack D text steps use the key owner's saved OpenAI key (the principal carries it).
    zackd: async (body: any, who: any) => (who?.userId && who.userId !== 'byok' ? zackdText(body, { openai: who.keys?.openai }) : { statusCode: 401, body: JSON.stringify({ error: { message: 'This needs a signed-in SmartVideo GO MCP key.' } }) }),
  },
  limiter,
});
}

/** Raw MCP key -> the caller it acts for (null when unknown, revoked, expired or the owner has no saved key). */
export function resolveCaller(raw: string) {
  return resolveMcpKey(createStore(getSupabaseAdmin()), loadUserKeys, raw);
}
