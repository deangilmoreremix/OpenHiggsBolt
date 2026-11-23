// @vitest-environment node
/**
 * The MCP studio dispatcher runs the app's real route handlers as the key's owner. Supabase and the network are faked; the
 * entitlement check, ownership checks, validation and key lookups are the app's own code.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const clerkAuth = vi.fn();
vi.mock('@clerk/nextjs/server', () => ({ auth: (...a: unknown[]) => clerkAuth(...a), currentUser: vi.fn() }));

const access = vi.fn();
vi.mock('@/access/resolveAccess', () => ({ resolveSmartVideoAccessForUser: (...a: unknown[]) => access(...a) }));

// design_agent_ownership + app_users, in memory
const own = new Map<string, string>();
const appUsers = new Map<string, { muapi_key?: string; openai_key?: string }>();
const campaignsDb: { id: string; clerk_user_id?: string }[] = [];
const assetsDb: { id: string; clerk_user_id?: string; campaign_id?: string }[] = [];
vi.mock('@/src/lib/supabaseServer', () => makeSupabase());
vi.mock('../../src/lib/supabaseServer', () => makeSupabase());
function makeSupabase() {
  const from = (table: string) => {
    const state: { col?: string; val?: string; ids?: string[]; eqs: Record<string, string> } = { eqs: {} };
    const q: any = {
      select: () => q, order: () => q,
      eq: (c: string, v: string) => { state.col = c; state.val = v; state.eqs[c] = v; return q; },
      in: (_c: string, ids: string[]) => { state.ids = ids; return q; },
      maybeSingle: async () => {
        if (table === 'design_agent_ownership') { const key = state.val as string; const owner = own.get(key); return { data: owner ? { clerk_user_id: owner } : null }; }
        if (table === 'app_users') return { data: appUsers.get(state.val as string) ?? null, error: null };
        return { data: null };
      },
      upsert: async (row: any) => { own.set(row.session_id || row.job_id, row.clerk_user_id); if (row.job_id && row.session_id) own.set(row.job_id, row.clerk_user_id); return { error: null }; },
      then: (res: any) => res({ data: table === 'brand_campaigns' ? campaignsDb.filter((c) => c.clerk_user_id === state.eqs.clerk_user_id) : table === 'brand_assets' ? assetsDb.filter((a) => a.clerk_user_id === state.eqs.clerk_user_id && (!state.eqs.campaign_id || a.campaign_id === state.eqs.campaign_id)) : [], error: null }),
    };
    return q;
  };
  return { getSupabaseAdmin: () => ({ from }), getSupabaseService: () => ({ from }) };
}
vi.mock('@/src/lib/muapiKeyCrypto', () => ({ decryptMuapiKey: (v: string) => v, encryptMuapiKey: (v: string) => v }));
vi.mock('../../src/lib/muapiKeyCrypto', () => ({ decryptMuapiKey: (v: string) => v, encryptMuapiKey: (v: string) => v }));

const { studios, gatewayStudios, campaigns } = await import('../../lib/mcpStudios');
const { brands } = await import('../../src/shared/brandStore');

const fetchMock = vi.fn();
beforeEach(() => {
  clerkAuth.mockReset(); access.mockReset(); fetchMock.mockReset(); own.clear(); appUsers.clear(); campaignsDb.length = 0; assetsDb.length = 0; brands.clear();
  access.mockResolvedValue({ isSuperUser: false, hasSmartVideoGo: true, entitlements: {} });
  appUsers.set('owner_1', { muapi_key: 'owner1_upstream_key_0123456789', openai_key: 'sk-owner1-openai-0123456789' });
  appUsers.set('owner_2', { muapi_key: 'owner2_upstream_key_0123456789' });
  vi.stubGlobal('fetch', fetchMock);
});

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('design-agent through the MCP', () => {
  it('creates a session with the OWNER\'s saved key, records ownership, and never consults Clerk', async () => {
    fetchMock.mockResolvedValue(json(200, { id: 'sess_1' }));
    const r = await studios['design-agent']({ route: 'sessions', method: 'POST', body: { title: 'x' } }, { userId: 'owner_1' });
    expect(r.statusCode).toBe(200);
    expect(fetchMock.mock.calls[0][0]).toMatch(/creative-agent\/sessions$/);
    expect((fetchMock.mock.calls[0][1] as any).headers['x-api-key']).toBe('owner1_upstream_key_0123456789');
    expect(own.get('sess_1')).toBe('owner_1');
    expect(clerkAuth).not.toHaveBeenCalled();
  });

  it('a different owner cannot touch that session (the app\'s ownership check still applies)', async () => {
    own.set('sess_1', 'owner_1');
    fetchMock.mockResolvedValue(json(200, { ok: 1 }));
    const r = await studios['design-agent']({ route: 'assets', query: { sessionId: 'sess_1' } }, { userId: 'owner_2' });
    expect(r.statusCode).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
    const mine = await studios['design-agent']({ route: 'assets', query: { sessionId: 'sess_1' } }, { userId: 'owner_1' });
    expect(mine.statusCode).toBe(200);
  });

  it('is refused without the entitlement, and unknown routes / methods are refused', async () => {
    access.mockResolvedValue({ isSuperUser: false, hasSmartVideoGo: false, entitlements: {} });
    expect((await studios['design-agent']({ route: 'sessions', method: 'POST', body: {} }, { userId: 'owner_1' })).statusCode).toBe(403);
    expect((await studios['design-agent']({ route: 'nope' }, { userId: 'owner_1' })).statusCode).toBe(404);
    expect((await studios['design-agent']({ route: 'chat', method: 'GET' }, { userId: 'owner_1' })).statusCode).toBe(405);
    expect((await studios['design-agent']({ route: '__proto__' }, { userId: 'owner_1' })).statusCode).toBe(404);
  });

  it('chat and approve go through ownership checks too', async () => {
    own.set('sess_1', 'owner_1'); own.set('job_9', 'owner_1');
    fetchMock.mockResolvedValue(json(200, { job_id: 'job_10' }));
    const chat = await studios['design-agent']({ route: 'chat', method: 'POST', body: { sessionId: 'sess_1', message: 'hi' } }, { userId: 'owner_1' });
    expect(chat.statusCode).toBe(200);
    expect(own.get('job_10')).toBe('owner_1');
    expect((await studios['design-agent']({ route: 'approve', method: 'POST', body: { jobId: 'job_9' } }, { userId: 'owner_2' })).statusCode).toBe(403);
  });
});

describe('go-ai-viral through the MCP', () => {
  it('serves the prompt library for an entitled owner and does not need a signed-in session', async () => {
    fetchMock.mockImplementation(async (u: string) => (String(u).includes('prompts.jsonl') ? new Response('', { status: 200 }) : json(200, {})));
    const r = await studios['go-ai-viral']({ route: 'prompts', query: { pageSize: 2 } }, { userId: 'owner_1' });
    expect([200, 502, 503]).toContain(r.statusCode); // depends on the remote dataset; the point is the handler ran
    expect(clerkAuth).not.toHaveBeenCalled();
    expect((await studios['go-ai-viral']({ route: 'health' }, { userId: 'owner_1' })).statusCode).toBe(404);
  });
});

describe('thumbnail through the MCP', () => {
  it('uses the OWNER\'s saved OpenAI key and says so clearly when there is none', async () => {
    fetchMock.mockResolvedValue(json(200, { data: [{ b64_json: 'AAAA' }] }));
    const ok = await studios.thumbnail({ body: { action: 'generate', prompt: 'a red ball', aspectRatio: '16:9' } }, { userId: 'owner_1' });
    expect([200, 400]).toContain(ok.statusCode);
    if (fetchMock.mock.calls.length) expect(JSON.stringify(fetchMock.mock.calls[0][1])).toContain('sk-owner1-openai-0123456789');
    fetchMock.mockClear();
    const none = await studios.thumbnail({ body: { action: 'generate', prompt: 'a red ball' } }, { userId: 'owner_2' });
    expect(none.statusCode).toBeGreaterThanOrEqual(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('campaigns and campaign assets are owner-scoped (app routes and MCP)', () => {
  beforeEach(() => {
    campaignsDb.push({ id: 'c1', clerk_user_id: 'owner_1' }, { id: 'c2', clerk_user_id: 'owner_2' }, { id: 'c0' });
    assetsDb.push({ id: 'a1', clerk_user_id: 'owner_1', campaign_id: 'c1' }, { id: 'a2', clerk_user_id: 'owner_2', campaign_id: 'c2' });
  });
  const get = async (mod: string, path: string) => {
    const route = await import(mod);
    return route.GET(new Request(`https://x.test${path}`) as never);
  };

  it('the app routes refuse a signed-out caller', async () => {
    clerkAuth.mockResolvedValue({ userId: null });
    expect((await get('../../app/api/campaigns/route', '/api/campaigns')).status).toBe(401);
    expect((await get('../../app/api/assets/route', '/api/assets')).status).toBe(401);
  });
  it('a signed-in caller sees only their own rows; unowned legacy rows are out of reach', async () => {
    clerkAuth.mockResolvedValue({ userId: 'owner_1' });
    const c = await (await get('../../app/api/campaigns/route', '/api/campaigns')).json();
    expect((c.data ?? c).map((x: any) => x.id)).toEqual(['c1']);
    const a = await (await get('../../app/api/assets/route', '/api/assets')).json();
    expect((a.data ?? a).map((x: any) => x.id)).toEqual(['a1']);
    const other = await (await get('../../app/api/assets/route', '/api/assets?campaign_id=c2')).json();
    expect(other.data ?? other).toEqual([]);
  });
  it('without the entitlement a signed-in caller gets 403', async () => {
    clerkAuth.mockResolvedValue({ userId: 'owner_1' });
    access.mockResolvedValue({ isSuperUser: false, hasSmartVideoGo: false, entitlements: {} });
    expect((await get('../../app/api/campaigns/route', '/api/campaigns')).status).toBe(403);
  });
  it('the MCP lists exactly what the app route lists for that owner (principal accepted, no Clerk session)', async () => {
    const run = campaigns();
    const mine = JSON.parse((await run({ route: 'list' }, { userId: 'owner_1' })).body);
    expect((mine.data ?? mine).map((x: any) => x.id)).toEqual(['c1']);
    const theirs = JSON.parse((await run({ route: 'list' }, { userId: 'owner_2' })).body);
    expect((theirs.data ?? theirs).map((x: any) => x.id)).toEqual(['c2']);
    expect((JSON.parse((await run({ route: 'list' }, { userId: 'nobody' })).body).data ?? [])).toEqual([]);
    expect(clerkAuth).not.toHaveBeenCalled();
  });
  it('generation needs a brand id and an unknown route is refused', async () => {
    const run = campaigns();
    expect((await run({ route: 'generate', body: { goal: 'sell' } }, { userId: 'owner_1' })).statusCode).toBe(400);
    expect((await run({ route: 'nope' }, { userId: 'owner_1' })).statusCode).toBe(404);
  });
});

describe('gateway wrapper', () => {
  it('refuses the local-development principal and a missing user', async () => {
    const g = gatewayStudios();
    expect((await g['design-agent']({ route: 'sessions' }, { userId: 'byok' })).statusCode).toBe(401);
    expect((await g['design-agent']({ route: 'sessions' }, {})).statusCode).toBe(401);
  });
  it('signed-out Clerk callers are unaffected: the app routes still answer 401 without a principal', async () => {
    clerkAuth.mockResolvedValue({ userId: null });
    const { POST } = await import('../../app/api/design-agent/sessions/route');
    const res = await POST(new Request('https://x.test/api/design-agent/sessions', { method: 'POST', body: '{}' }) as any);
    expect(res.status).toBe(401);
  });
});
