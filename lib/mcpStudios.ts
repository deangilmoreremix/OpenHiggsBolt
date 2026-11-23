import { NextRequest } from 'next/server';
import { runAs } from './principal';
import { getSupabaseAdmin } from '../src/lib/supabaseServer';
import { getBrandsForUser } from '../src/shared/brandStore';

import * as designSessions from '../app/api/design-agent/sessions/route';
import * as designChat from '../app/api/design-agent/chat/route';
import * as designJobs from '../app/api/design-agent/jobs/route';
import * as designAssets from '../app/api/design-agent/assets/route';
import * as designApprove from '../app/api/design-agent/approve/route';
import * as designReject from '../app/api/design-agent/reject/route';
import * as designRunSkill from '../app/api/design-agent/run-skill/route';
import * as thumbnailGenerate from '../app/api/proxy/thumbnail-generate/route';
import * as viralPrompts from '../app/api/go-ai-viral/prompts/route';
import * as viralSeedance from '../app/api/go-ai-viral/seedance/route';
import * as viralStats from '../app/api/go-ai-viral/stats/route';
import * as brandAnalyze from '../app/api/brand/analyze/route';
import * as brandsRoute from '../app/api/brands/route';
import * as campaignsRoute from '../app/api/campaigns/route';

/**
 * The studio routes the MCP gateway can run, each as the user an MCP key belongs to.
 *
 * Each entry runs the app's own route handler (so entitlement, validation, ownership and rate limits are the app's) inside
 * `runAs`, which makes the handler's identity lookups see the key's owner (see lib/principal.ts). A request that reaches a
 * handler is built here from scratch: no header, cookie or URL from the MCP caller is copied, so nothing the caller sends
 * can name another user or supply a different upstream key.
 */
type Method = 'GET' | 'POST';
type Handler = (req: NextRequest) => Promise<Response> | Response;
type Who = { userId: string };
type Call = { route?: string; method?: string; query?: Record<string, unknown>; body?: unknown };
type Out = { statusCode: number; body: string };

const reply = (statusCode: number, body: unknown): Out => ({ statusCode, body: JSON.stringify(body) });

async function invoke(handler: Handler, who: Who, method: Method, path: string, query?: Record<string, unknown>, body?: unknown): Promise<Out> {
  const url = new URL(`https://mcp.invalid${path}`);
  for (const [k, v] of Object.entries(query || {})) if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  const hasBody = method !== 'GET' && body !== undefined;
  const req = new NextRequest(url, { method, headers: { 'content-type': 'application/json' }, body: hasBody ? JSON.stringify(body) : undefined });
  try {
    const res = await runAs({ userId: who.userId }, () => handler(req));
    return { statusCode: res.status, body: await res.text() };
  } catch (err) {
    console.error('[mcp-studios] handler failed:', (err as Error)?.message || 'error');
    return reply(500, { error: 'Internal server error' });
  }
}

/** A table of { route -> { path, handlers by method } } with the method check done here. */
function table(routes: Record<string, { path: string; mod: Partial<Record<Method, Handler>> }>) {
  return async (call: Call, who: Who): Promise<Out> => {
    const name = String(call?.route || '');
    const entry = Object.prototype.hasOwnProperty.call(routes, name) ? routes[name] : undefined;
    if (!entry) return reply(404, { error: 'Unknown route.' });
    const method = String(call?.method || 'GET').toUpperCase() as Method;
    const handler = entry.mod[method];
    if (!handler) return reply(405, { error: 'Method not allowed.' });
    return invoke(handler, who, method, entry.path, call?.query, call?.body);
  };
}

const designAgent = table({
  sessions: { path: '/api/design-agent/sessions', mod: designSessions as never },
  chat: { path: '/api/design-agent/chat', mod: designChat as never },
  jobs: { path: '/api/design-agent/jobs', mod: designJobs as never },
  assets: { path: '/api/design-agent/assets', mod: designAssets as never },
  approve: { path: '/api/design-agent/approve', mod: designApprove as never },
  reject: { path: '/api/design-agent/reject', mod: designReject as never },
  'run-skill': { path: '/api/design-agent/run-skill', mod: designRunSkill as never },
});

const goAiViral = table({
  prompts: { path: '/api/go-ai-viral/prompts', mod: viralPrompts as never },
  seedance: { path: '/api/go-ai-viral/seedance', mod: viralSeedance as never },
  stats: { path: '/api/go-ai-viral/stats', mod: viralStats as never },
});

const brandRoutes = table({
  analyze: { path: '/api/brand/analyze', mod: brandAnalyze as never },
  brands: { path: '/api/brands', mod: brandsRoute as never },
});

export type CampaignDeps = { listBrandIds?: (userId: string) => string[]; campaignsFor?: (brandIds: string[]) => Promise<{ data: unknown[] | null; error: { message: string } | null }> };

/**
 * Campaigns. The app's GET /api/campaigns has no sign-in check and returns every user's campaigns; the MCP never calls it.
 * Listing is limited to campaigns of brands the caller owns, and generating needs a brand the caller owns.
 */
export function campaigns(deps: CampaignDeps = {}) {
  const listBrandIds = deps.listBrandIds || ((u: string) => getBrandsForUser(u).map((b) => b.id));
  const campaignsFor = deps.campaignsFor || ((ids: string[]) => getSupabaseAdmin().from('brand_campaigns').select('*').in('brand_id', ids).order('created_at', { ascending: false }) as never);
  return async (call: Call, who: Who): Promise<Out> => {
    const owned = listBrandIds(who.userId);
    if (String(call?.route) === 'list') {
      const wanted = typeof call?.query?.brand_id === 'string' ? [call.query.brand_id as string] : owned;
      const ids = wanted.filter((id) => owned.includes(id));
      if (!ids.length) return reply(200, { data: [] });
      const { data, error } = await campaignsFor(ids);
      return error ? reply(500, { error: 'Could not load campaigns.' }) : reply(200, { data: data || [] });
    }
    if (String(call?.route) === 'generate') {
      const b = (call?.body || {}) as { brand_id?: unknown };
      if (typeof b.brand_id !== 'string' || !owned.includes(b.brand_id)) return reply(403, { error: 'That brand does not belong to you.' });
      return invoke(campaignsRoute.POST as Handler, who, 'POST', '/api/campaigns', undefined, call.body);
    }
    return reply(404, { error: 'Unknown route.' });
  };
}

export const studios: Record<string, (call: Call, who: Who) => Promise<Out>> = {
  'design-agent': designAgent,
  'go-ai-viral': goAiViral,
  brand: brandRoutes,
  campaigns: campaigns(),
  thumbnail: async (call, who) => invoke(thumbnailGenerate.POST as Handler, who, 'POST', '/api/proxy/thumbnail-generate', undefined, call?.body),
};

/** The gateway entries: they refuse the local-development bring-your-own-key principal, which has no user. */
export function gatewayStudios(map = studios) {
  return Object.fromEntries(Object.entries(map).map(([name, run]) => [name, async (body: Call, who: { userId?: string }) => {
    if (!who?.userId || who.userId === 'byok') return reply(401, { error: { message: 'This needs a signed-in SmartVideo GO MCP key.' } });
    return run(body, { userId: who.userId });
  }]));
}
