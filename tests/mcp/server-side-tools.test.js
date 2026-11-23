// @vitest-environment node
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createHandler, classifyRequest, RAW_ALLOWLIST } from '../../lib/mcpGateway.js';
import { customTools } from '../../mcp/tools.js';
import { humanOnlyViolations } from '../../packages/studio-mcp-core/src/governor.js';
import { EDIT_TOOLS, getEditToolModels } from '../../packages/studio/src/editTools.js';

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn(), currentUser: vi.fn() }));
vi.mock('@/lib/supabase', () => ({ createServerClient: () => ({}) }));
vi.mock('@/lib/supabaseServer', () => ({ getSupabaseAdmin: () => ({}) }));
vi.mock('@/src/lib/supabaseServer', () => ({ getSupabaseAdmin: () => ({}) }));

const { videoPages, social } = await import('../../lib/mcpStudios');
const who = { userId: 'user_owner', keys: { muapi: 'mu_owner_key_0123456789', openai: null } };
const tool = (name) => customTools.find((t) => t.name === name);
afterEach(() => vi.unstubAllGlobals());

describe('video pages studio', () => {
  const api = () => ({
    listPages: vi.fn(async () => [{ id: 'abcdefgh12' }]), getOwnedPage: vi.fn(async () => ({ id: 'abcdefgh12' })), createPage: vi.fn(async () => ({ id: 'newpage123' })),
    updatePage: vi.fn(async (_d, _u, id, patch) => ({ id, ...patch })), deletePage: vi.fn(async () => {}), pageStats: vi.fn(async () => ({ views: 1 })), contactStats: vi.fn(async () => []),
    listContacts: vi.fn(async () => []), addContacts: vi.fn(async (_d, _u, _id, c) => c), removeContact: vi.fn(async () => {}),
  });
  const run = (a, call, w = who) => videoPages({ db: async () => ({}), api: a })(call, w).then((r) => ({ status: r.statusCode, body: JSON.parse(r.body) }));

  it('every call is for the key owner, whatever the request says', async () => {
    const a = api();
    await run(a, { action: 'list', userId: 'someone_else', user_id: 'someone_else' });
    await run(a, { action: 'delete', id: 'abcdefgh12', owner: 'someone_else' });
    expect(a.listPages.mock.calls[0][1]).toBe('user_owner');
    expect(a.deletePage.mock.calls[0][1]).toBe('user_owner');
  });
  it('publish is an update that sets published; create never publishes', async () => {
    const a = api();
    await run(a, { action: 'publish', id: 'abcdefgh12' });
    expect(a.updatePage.mock.calls[0][3]).toEqual({ published: true });
    await run(a, { action: 'create', title: 'T', video_url: 'https://cdn.test/v.mp4' });
    expect(a.createPage.mock.calls[0][2]).toMatchObject({ videoUrl: 'https://cdn.test/v.mp4', source: { via: 'mcp' } });
    expect(a.createPage.mock.calls[0][2].published).toBeUndefined();
  });
  it('caps contacts per call, and the app\'s own errors come back as plain messages', async () => {
    const a = api();
    await run(a, { action: 'add_contacts', id: 'abcdefgh12', contacts: Array.from({ length: 900 }, () => ({ fields: { firstname: 'A' } })) });
    expect(a.addContacts.mock.calls[0][3]).toHaveLength(500);
    a.getOwnedPage.mockRejectedValue(Object.assign(new Error('Page not found'), { status: 404 }));
    expect(await run(a, { action: 'get', id: 'abcdefgh12' })).toMatchObject({ status: 404 });
    a.listPages.mockRejectedValue(new Error('connection string postgres://secret'));
    const hidden = await run(a, { action: 'list' });
    expect(hidden.status).toBe(500);
    expect(JSON.stringify(hidden.body)).not.toMatch(/postgres|secret/);
    expect((await run(a, { action: 'drop' })).status).toBe(400);
  });
});

describe('social studio', () => {
  const run = (call, f) => social({ fetchImpl: f })(call, who).then((r) => ({ status: r.statusCode, body: JSON.parse(r.body) }));
  it('builds the post with the app\'s own payload rules and uses the owner key', async () => {
    const f = vi.fn(async () => new Response(JSON.stringify({ request_id: 'p1' }), { status: 200 }));
    const out = await run({ action: 'publish', platform: 'youtube', account_id: '12', media_url: 'https://cdn.test/v.mp4', media_type: 'video', title: 'Hello', caption: 'Hi there' }, f);
    expect(out.body.request_id).toBe('p1');
    expect(f.mock.calls[0][0]).toBe('https://api.muapi.ai/api/v1/youtube-publish');
    expect(f.mock.calls[0][1].headers['x-api-key']).toBe(who.keys.muapi);
    expect(JSON.parse(f.mock.calls[0][1].body)).toMatchObject({ account_id: 12, media_url: 'https://cdn.test/v.mp4' });
  });
  it('refuses what the app refuses, before anything is sent', async () => {
    const f = vi.fn();
    expect((await run({ action: 'publish', platform: 'youtube', account_id: '12', media_url: 'http://local/v.mp4', title: 'x' }, f)).status).toBe(400);
    expect((await run({ action: 'publish', platform: 'youtube', account_id: '12', media_url: 'https://cdn.test/v.mp4' }, f)).body.error.message).toMatch(/title/i);
    expect((await run({ action: 'publish', platform: 'myspace', account_id: '1', media_url: 'https://cdn.test/v.mp4' }, f)).status).toBe(400);
    expect((await run({ action: 'status', request_id: '../x' }, f)).status).toBe(400);
    expect(f).not.toHaveBeenCalled();
  });
  it('needs a saved key', async () => {
    expect((await social()({ action: 'accounts' }, { userId: 'u', keys: {} })).statusCode).toBe(401);
  });
});

describe('what the gateway counts as risky', () => {
  it('classifies the new studios and routes itself', () => {
    const r = (route, input) => classifyRequest(route, 'POST', input).risk;
    expect(r('/studio/pages', { action: 'publish' })).toBe('publish');
    expect(r('/studio/pages', { action: 'delete' })).toBe('destructive');
    expect(r('/studio/pages', { action: 'list' })).toBe('read');
    expect(r('/studio/social', { action: 'publish' })).toBe('publish');
    expect(r('/studio/social', { action: 'accounts' })).toBe('read');
    expect(r('/studio/social', { action: 'something_new' })).toBe('publish'); // unknown social actions are treated as the riskiest
    expect(r('/studio/assets', { method: 'DELETE' })).toBe('destructive');
    expect(r('/studio/assets', { method: 'GET' })).toBe('read');
    expect(r('/studio/photo-studio', { method: 'POST' })).toBe('write');
    expect(r('/generate', { endpoint: 'youtube-publish' })).toBe('publish');
    expect(r('/raw', { method: 'DELETE', path: '/api/v1/predictions/abc/media' })).toBe('destructive');
  });
  it('the raw allow-list holds exactly the calls the app makes', async () => {
    const h = createHandler({ resolve: async () => ({ id: 'k', userId: 'u', keys: { muapi: 'mu_owner_key_0123456789' } }), env: {} });
    const f = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', f);
    const raw = (method, path, confirm) => h({ httpMethod: 'POST', path: '/api/mcp-gateway/raw', headers: { authorization: `Bearer sv_live_${'a'.repeat(43)}` }, body: JSON.stringify({ method, path, confirm }) }).then((x) => x.statusCode);
    expect(await raw('POST', '/workflow/create')).toBe(200);
    expect(await raw('GET', '/api/v1/history?limit=50&cursor=abc%3D')).toBe(200);
    expect(await raw('DELETE', '/api/v1/predictions/req_1/media')).toBe(409); // destructive: needs confirm
    expect(await raw('DELETE', '/api/v1/predictions/req_1/media', true)).toBe(200);
    for (const [m, p] of [['GET', '/api/v1/history/../admin'], ['DELETE', '/workflow/other'], ['GET', '/api/v1/social/accounts/../x']]) expect(await raw(m, p, true), `${m} ${p}`).toBe(400);
    expect(RAW_ALLOWLIST.filter(([m]) => m === 'DELETE')).toHaveLength(2);
  });
});

describe('tools', () => {
  it('risk labels and no human-only action', () => {
    for (const n of ['video_pages_publish', 'social_publish']) expect(tool(n).risk, n).toBe('publish');
    for (const n of ['video_pages_delete', 'video_pages_remove_contact', 'assets_library_delete', 'history_delete_media', 'workflow_delete']) expect(tool(n).risk, n).toBe('destructive');
    for (const n of ['history_list', 'social_accounts_list', 'edit_tools_list', 'usage_info', 'photo_studio_status']) expect(tool(n).risk, n).toBe('read');
    expect(humanOnlyViolations(customTools.map((t) => t.name))).toEqual([]);
    expect(customTools.some((t) => /connect|disconnect/.test(t.name))).toBe(false);
  });
  it('video_pages_add_contacts sends the shape the app expects', async () => {
    const studio = vi.fn(async () => ({}));
    await tool('video_pages_add_contacts').run({ id: 'abcdefgh12', contacts: [{ firstname: 'Ada' }] }, { studio });
    expect(studio).toHaveBeenCalledWith('pages', { action: 'add_contacts', id: 'abcdefgh12', contacts: [{ fields: { firstname: 'Ada' } }] });
  });
  it('edit_tool_run resolves the tool\'s own model and builds the catalog request', async () => {
    const list = await tool('edit_tools_list').run({}, {});
    expect(list.tools.length).toBe(EDIT_TOOLS.length);
    const withModel = EDIT_TOOLS.find((t) => getEditToolModels(t).some((m) => m.catalog === 't2i'));
    const model = getEditToolModels(withModel).find((m) => m.catalog === 't2i').model.id;
    const client = { submit: vi.fn(async () => ({ request_id: 'r1' })), wait: vi.fn(async () => ({ status: 'completed', outputs: ['https://cdn.test/o.png'] })) };
    const out = await tool('edit_tool_run').run({ tool: withModel.slug, model, inputs: { prompt: 'a cat' } }, client);
    expect(out.status).toBe('completed');
    expect(client.submit.mock.calls[0][1]).toMatchObject({ prompt: 'a cat' });
    await expect(tool('edit_tool_run').run({ tool: 'nope', inputs: {} }, client)).rejects.toThrow(/Unknown edit tool/);
    await expect(tool('edit_tool_run').run({ tool: withModel.slug, model: 'not-a-model', inputs: {} }, client)).rejects.toThrow(/does not use/);
  });
});
