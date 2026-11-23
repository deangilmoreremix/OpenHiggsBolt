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
import * as assetsLibrary from '../app/api/assets/library/route';
import * as photoStudio from '../app/api/photo-studio/route';
import * as pagesData from '../src/lib/landingPages/server/pages.js';
import { PLATFORM_SPECS, buildPublishPayload, type PlatformId } from '../src/shared/api/socialPayloads';

/**
 * The studio routes the MCP gateway can run, each as the user an MCP key belongs to.
 *
 * Each entry runs the app's own route handler (so entitlement, validation, ownership and rate limits are the app's) inside
 * `runAs`, which makes the handler's identity lookups see the key's owner (see lib/principal.ts). A request that reaches a
 * handler is built here from scratch: no header, cookie or URL from the MCP caller is copied, so nothing the caller sends
 * can name another user or supply a different upstream key.
 */
type Method = 'GET' | 'POST' | 'DELETE';
type Handler = (req: NextRequest) => Promise<Response> | Response;
type Who = { userId: string; keys?: { muapi?: string | null; openai?: string | null } };
type Call = { route?: string; method?: string; query?: Record<string, unknown>; body?: unknown };
type Out = { statusCode: number; body: string };

const reply = (statusCode: number, body: unknown): Out => ({ statusCode, body: JSON.stringify(body) });

async function invoke(handler: Handler, who: Who, method: Method, path: string, query?: Record<string, unknown>, body?: unknown, extraHeaders: Record<string, string> = {}): Promise<Out> {
  const url = new URL(`https://mcp.invalid${path}`);
  for (const [k, v] of Object.entries(query || {})) if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  const hasBody = method !== 'GET' && method !== 'DELETE' && body !== undefined;
  const req = new NextRequest(url, { method, headers: { 'content-type': 'application/json', ...extraHeaders }, body: hasBody ? JSON.stringify(body) : undefined });
  try {
    const res = await runAs({ userId: who.userId }, () => handler(req));
    return { statusCode: res.status, body: await res.text() };
  } catch (err) {
    console.error('[mcp-studios] handler failed:', (err as Error)?.message || 'error');
    return reply(500, { error: 'Internal server error' });
  }
}

/** A table of { route -> { path, handlers by method } } with the method check done here. */
function table(routes: Record<string, { path: string; mod: Partial<Record<Method, Handler>> }>, headersFor: (who: Who) => Record<string, string> = () => ({})) {
  return async (call: Call, who: Who): Promise<Out> => {
    const name = String(call?.route || '');
    const entry = Object.prototype.hasOwnProperty.call(routes, name) ? routes[name] : undefined;
    if (!entry) return reply(404, { error: 'Unknown route.' });
    const method = String(call?.method || 'GET').toUpperCase() as Method;
    const handler = entry.mod[method];
    if (!handler) return reply(405, { error: 'Method not allowed.' });
    return invoke(handler, who, method, entry.path, call?.query, call?.body, headersFor(who));
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

// The user's asset library (uploads and generated results): the app's own route, owner-scoped by the caller's id.
const assets = table({ library: { path: '/api/assets/library', mod: assetsLibrary as never } });

// Photo Studio: the app's own route; it asks for the user's generation key in a header, which is the key owner's stored key.
const photo = table({ studio: { path: '/api/photo-studio', mod: photoStudio as never } }, (who): Record<string, string> => (who.keys?.muapi ? { 'x-api-key': who.keys.muapi } : {}));

// Video Pages: the app's own owner-scoped data layer (every function takes the owner id and filters on it).
type PageDeps = { db?: () => Promise<any>; api?: typeof pagesData };
export function videoPages(deps: PageDeps = {}) {
  const getDb = deps.db || (async () => (await import('../src/lib/supabase')).createServerClient());
  const api = deps.api || pagesData;
  return async (call: Call & { action?: string; id?: string; contact_id?: string; contacts?: unknown[]; title?: string; video_url?: string; poster_url?: string; duration?: number; config?: unknown }, who: Who): Promise<Out> => {
    const action = String(call?.action || '');
    const id = String(call?.id || '');
    try {
      const db = await getDb();
      switch (action) {
        case 'list': return reply(200, { pages: await api.listPages(db, who.userId) });
        case 'get': return reply(200, { page: await api.getOwnedPage(db, who.userId, id) });
        case 'create': return reply(201, { page: await api.createPage(db, who.userId, { title: call.title, videoUrl: call.video_url, posterUrl: call.poster_url, duration: call.duration, source: { via: 'mcp' }, config: call.config }) });
        case 'update': {
          const patch: Record<string, unknown> = {};
          if (call.title !== undefined) patch.title = call.title;
          if (call.config !== undefined) patch.config = call.config;
          if (call.poster_url !== undefined) patch.posterUrl = call.poster_url;
          return reply(200, { page: await api.updatePage(db, who.userId, id, patch) });
        }
        case 'publish': return reply(200, { page: await api.updatePage(db, who.userId, id, { published: true }) });
        case 'unpublish': return reply(200, { page: await api.updatePage(db, who.userId, id, { published: false }) });
        case 'delete': await api.deletePage(db, who.userId, id); return reply(200, { ok: true });
        case 'stats': return reply(200, { stats: await api.pageStats(db, who.userId, id), contacts: await api.contactStats(db, who.userId, id) });
        case 'contacts': return reply(200, { contacts: await api.listContacts(db, who.userId, id) });
        case 'add_contacts': return reply(200, { contacts: await api.addContacts(db, who.userId, id, (Array.isArray(call.contacts) ? call.contacts : []).slice(0, 500)) });
        case 'remove_contact': await api.removeContact(db, who.userId, id, String(call.contact_id || '')); return reply(200, { ok: true });
        default: return reply(400, { error: { message: `Unknown action "${action.slice(0, 40)}".` } });
      }
    } catch (err) {
      const e = err as { status?: number; message?: string };
      return reply(e?.status && e.status < 500 ? e.status : 500, { error: { message: e?.status && e.status < 500 ? String(e.message).slice(0, 300) : 'Could not do that.' } });
    }
  };
}

// Social publishing: the app's own payload builder (platform limits, public https media, required fields) and the owner's stored generation key.
// Accounts must already be connected by the person in the app; connecting or disconnecting an account is never done through the MCP.
const SOCIAL_API = 'https://api.muapi.ai/api/v1';
export function social(deps: { fetchImpl?: typeof fetch } = {}) {
  const f = deps.fetchImpl || fetch;
  return async (call: Call & { action?: string; platform?: string; account_id?: string | number; media_url?: string; media_type?: string; title?: string; caption?: string; tags?: string; settings?: Record<string, unknown>; request_id?: string }, who: Who): Promise<Out> => {
    const key = who.keys?.muapi;
    if (!key) return reply(401, { error: { message: 'Save your API key in Settings first.' } });
    const send = async (path: string, init?: RequestInit) => {
      const res = await f(`${SOCIAL_API}${path}`, { ...init, headers: { 'x-api-key': key, ...(init?.body ? { 'Content-Type': 'application/json' } : {}) }, signal: AbortSignal.timeout(30_000) });
      const text = await res.text();
      let data: unknown; try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text.slice(0, 200) }; }
      return reply(res.ok ? 200 : res.status >= 500 ? 502 : res.status, res.ok ? data : { error: { message: String((data as { detail?: unknown })?.detail ?? res.statusText).slice(0, 300) } });
    };
    const action = String(call?.action || '');
    if (action === 'accounts') return send('/social/accounts');
    if (action === 'status') {
      if (!/^[A-Za-z0-9._-]{1,100}$/.test(String(call.request_id || ''))) return reply(400, { error: { message: 'A valid request_id is required.' } });
      return send(`/predictions/${call.request_id}/result`);
    }
    if (action === 'publish') {
      const platform = String(call.platform || '') as PlatformId;
      if (!Object.prototype.hasOwnProperty.call(PLATFORM_SPECS, platform)) return reply(400, { error: { message: `Unknown platform. Use one of: ${Object.keys(PLATFORM_SPECS).join(', ')}.` } });
      const built = buildPublishPayload({
        platform, accountId: call.account_id as never, mediaUrl: String(call.media_url || ''), mediaType: (call.media_type === 'image' ? 'image' : 'video'),
        copy: { master: call.caption, caption: call.caption, title: call.title, tags: call.tags } as never, settings: (call.settings || {}) as never,
      });
      if (!built.payload) return reply(400, { error: { message: built.errors.join(' ') } });
      return send(`/${PLATFORM_SPECS[platform].endpoint}`, { method: 'POST', body: JSON.stringify(built.payload) });
    }
    return reply(400, { error: { message: 'Unknown action.' } });
  };
}

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
  pages: videoPages(),
  social: social(),
  assets,
  'photo-studio': photo,
  thumbnail: async (call, who) => invoke(thumbnailGenerate.POST as Handler, who, 'POST', '/api/proxy/thumbnail-generate', undefined, call?.body),
};

/** The gateway entries: they refuse the local-development bring-your-own-key principal, which has no user. */
export function gatewayStudios(map = studios) {
  return Object.fromEntries(Object.entries(map).map(([name, run]) => [name, async (body: Call, who: { userId?: string; keys?: Who['keys'] }) => {
    if (!who?.userId || who.userId === 'byok') return reply(401, { error: { message: 'This needs a signed-in SmartVideo GO MCP key.' } });
    return run(body, { userId: who.userId, keys: (who as { keys?: Who['keys'] }).keys });
  }]));
}
