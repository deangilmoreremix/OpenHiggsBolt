import { describe, it, expect, vi } from 'vitest';
import { sanitizeFormSettings, getFormSettings, saveFormSettings, recordHeat, pageHeat, pageLeads, deliverLead, testWebhooks, defaultFormSettings } from '../server/leadsHeat.js';

/** A tiny fake of the Supabase service client: tables are arrays, rpc is recorded. */
function fakeDb({ pages = [], settings = [], leads = [], contacts = [], rpc = {} } = {}) {
  const calls = { rpc: [], inserts: [], upserts: [] };
  const table = (name) => {
    const src = { landing_pages: pages, landing_page_form_settings: settings, landing_page_leads: leads, landing_page_contacts: contacts, webhook_deliveries: [] }[name] || [];
    let rows = [...src]; const filters = [];
    const api = {
      select: () => api,
      eq: (k, v) => { rows = rows.filter((r) => r[k] === v); filters.push([k, v]); return api; },
      order: () => api, limit: () => api,
      maybeSingle: async () => ({ data: rows[0] || null, error: null }),
      then: (res) => res({ data: rows, error: null }),
      insert: async (r) => { calls.inserts.push([name, r]); return { error: null }; },
      upsert: async (r) => { calls.upserts.push([name, r]); return { error: null }; },
    };
    return api;
  };
  return { calls, from: table, rpc: async (n, a) => { calls.rpc.push([n, a]); return { data: rpc[n] ?? [], error: null }; } };
}
const page = (extra = {}) => ({ id: 'page1234', clerk_user_id: 'userA', published: true, title: 'T', video_url: 'https://x/a.mp4', poster_url: null, duration: null, source: {}, config: {}, view_count: 0, created_at: 't', updated_at: 't', ...extra });

describe('form delivery settings', () => {
  it('keeps only https webhooks, real e-mail addresses and known list providers', () => {
    const s = sanitizeFormSettings({ webhookEnabled: true, webhook: 'https://hooks.example.com/a', webhook2: 'http://insecure.example.com', webhook3: 'https://localhost/x', emailAddress: 'me@example.com', emailAddress2: 'nope', espProvider: 'kit', espListId: 'tag_1', extra: 1 });
    expect(s).toMatchObject({ webhookEnabled: true, webhook: 'https://hooks.example.com/a', webhook2: '', webhook3: '', emailAddress: 'me@example.com', emailAddress2: '', espProvider: 'kit', espListId: 'tag_1' });
    expect(s).not.toHaveProperty('extra');
    expect(sanitizeFormSettings(null)).toEqual(defaultFormSettings());
  });
  it('reads and saves only for the page owner', async () => {
    const db = fakeDb({ pages: [page()], settings: [{ page_id: 'page1234', clerk_user_id: 'userA', settings: { webhookEnabled: true, webhook: 'https://ok.example.com/h' } }] });
    expect((await getFormSettings(db, 'userA', 'page1234')).webhook).toBe('https://ok.example.com/h');
    await expect(getFormSettings(db, 'userB', 'page1234')).rejects.toMatchObject({ status: 404 });
    await expect(saveFormSettings(db, 'userB', 'page1234', {})).rejects.toMatchObject({ status: 404 });
    const saved = await saveFormSettings(db, 'userA', 'page1234', { webhook: 'https://ok.example.com/h', evil: 1 });
    expect(saved).not.toHaveProperty('evil');
    expect(db.calls.upserts[0][1]).toMatchObject({ page_id: 'page1234', clerk_user_id: 'userA' });
  });
});

describe('heat samples and reads', () => {
  it('only passes valid, bounded batches for published pages to the database', async () => {
    const db = fakeDb({ pages: [page()] });
    await recordHeat(db, 'page1234', { session: 'abcdefgh12', events: Array.from({ length: 60 }, () => ({ t: 'click', x: 1, y: 2 })), contactId: 'contact01' });
    expect(db.calls.rpc[0][0]).toBe('record_page_heat');
    expect(db.calls.rpc[0][1].p_events).toHaveLength(40); expect(db.calls.rpc[0][1].p_contact_id).toBe('contact01');
    await expect(recordHeat(db, 'page1234', { session: 'x', events: [{ t: 'click' }] })).rejects.toMatchObject({ code: 'BAD_SESSION' });
    await expect(recordHeat(db, 'bad id', { session: 'abcdefgh12', events: [{}] })).rejects.toMatchObject({ code: 'BAD_PAGE' });
    const n = db.calls.rpc.length; await recordHeat(db, 'page1234', { session: 'abcdefgh12', events: [] }); expect(db.calls.rpc.length).toBe(n);
    const draft = fakeDb({ pages: [page({ published: false })] }); await recordHeat(draft, 'page1234', { session: 'abcdefgh12', events: [{ t: 'click', x: 1, y: 2 }] }); expect(draft.calls.rpc).toHaveLength(0);
  });
  it('reads heat through the owner-only functions with the signed-in owner', async () => {
    const db = fakeDb({ pages: [page()], rpc: {
      page_heat_clicks_for: [{ cx: 20, cy: 12, clicks: '4', sessions: '4' }], page_heat_scroll_for: [{ depth: 30, sessions: 4, total_sessions: 4 }],
      page_heat_watch_for: [{ sec: 5, plays: 3, sessions: 3 }], page_heat_by_contact_for: [{ contact_id: 'c1', sessions: 2, clicks: 3, max_scroll: 60, watched_seconds: 41, last_seen: 't' }],
    } });
    const h = await pageHeat(db, 'userA', 'page1234', { days: 7, viewport: 'mobile' });
    expect(h.clicks).toEqual([{ cx: 20, cy: 12, clicks: 4, sessions: 4 }]);
    expect(h.scroll[0]).toEqual({ depth: 30, sessions: 4, totalSessions: 4 });
    expect(h.contacts[0]).toMatchObject({ contactId: 'c1', maxScroll: 60, watchedSeconds: 41 });
    expect(db.calls.rpc.every(([, a]) => a.p_owner === 'userA' && a.p_page_id === 'page1234')).toBe(true);
    expect(db.calls.rpc[0][1].p_viewport).toBe('mobile');
    await expect(pageHeat(db, 'userB', 'page1234')).rejects.toMatchObject({ status: 404 });
  });
  it('lists leads with the contact they came from', async () => {
    const db = fakeDb({ pages: [page()], leads: [{ id: 1, page_id: 'page1234', contact_id: 'c1', data: { email: 'd@x.co' }, created_at: 't' }, { id: 2, page_id: 'page1234', contact_id: null, data: { email: 'z@x.co' }, created_at: 't2' }],
      contacts: [{ id: 'c1', page_id: 'page1234', clerk_user_id: 'userA', fields: { firstname: 'Dana', lastname: 'W' } }] });
    const rows = await pageLeads(db, 'userA', 'page1234');
    expect(rows.map((r) => r.who)).toEqual(['Dana W', 'Direct visit']);
    await expect(pageLeads(db, 'userB', 'page1234')).rejects.toMatchObject({ status: 404 });
  });
});

describe('webhook delivery', () => {
  const deps = (over = {}) => ({ fetchFn: vi.fn(async () => ({ ok: true, status: 200, body: null })), sleepFn: async () => {}, nowFn: () => 1_700_000_000_000, resolvesPublic: async () => true, newId: () => 'del-1', ...over });
  it('sends each lead to the saved webhooks only, signed, and logs the delivery', async () => {
    const db = fakeDb({ pages: [page()], settings: [{ page_id: 'page1234', settings: { webhookEnabled: true, webhook: 'https://hooks.example.com/a', webhook2: 'http://insecure.example.com' } }] });
    const d = deps();
    const out = await deliverLead(db, { pageId: 'page1234', contactId: 'c1', data: { email: 'd@x.co' } }, d, 'master-secret');
    expect(out).toHaveLength(1); expect(out[0].ok).toBe(true);
    const [url, init] = d.fetchFn.mock.calls[0]; expect(url).toBe('https://hooks.example.com/a');
    expect(JSON.parse(init.body)).toMatchObject({ event: 'landing_page_lead', pageId: 'page1234', contactId: 'c1', data: { email: 'd@x.co' } });
    expect(init.headers['X-Remix-Signature']).toBeTruthy();
    expect(db.calls.inserts.find(([t]) => t === 'webhook_deliveries')[1][0]).toMatchObject({ clerk_user_id: 'userA', project_id: 'page1234', url_host: 'hooks.example.com', ok: true });
  });
  it('sends nothing when no webhook is on, for drafts, or when the address resolves privately', async () => {
    const off = fakeDb({ pages: [page()], settings: [{ page_id: 'page1234', settings: { webhookEnabled: false, webhook: 'https://hooks.example.com/a' } }] });
    const d1 = deps(); expect(await deliverLead(off, { pageId: 'page1234', contactId: null, data: { a: 'b' } }, d1)).toEqual([]); expect(d1.fetchFn).not.toHaveBeenCalled();
    const draft = fakeDb({ pages: [page({ published: false })], settings: [{ page_id: 'page1234', settings: { webhookEnabled: true, webhook: 'https://hooks.example.com/a' } }] });
    const d2 = deps(); expect(await deliverLead(draft, { pageId: 'page1234', contactId: null, data: { a: 'b' } }, d2)).toEqual([]); expect(d2.fetchFn).not.toHaveBeenCalled();
    const on = fakeDb({ pages: [page()], settings: [{ page_id: 'page1234', settings: { webhookEnabled: true, webhook: 'https://rebind.example.com/a' } }] });
    const d3 = deps({ resolvesPublic: async () => false });
    const out = await deliverLead(on, { pageId: 'page1234', contactId: null, data: { a: 'b' } }, d3); expect(out[0]).toMatchObject({ ok: false, error: 'blocked address' }); expect(d3.fetchFn).not.toHaveBeenCalled();
  });
  it('the test button needs a saved, valid webhook and belongs to the owner', async () => {
    const none = fakeDb({ pages: [page()], settings: [] });
    await expect(testWebhooks(none, 'userA', 'page1234', deps())).rejects.toMatchObject({ code: 'NO_WEBHOOK' });
    const db = fakeDb({ pages: [page()], settings: [{ page_id: 'page1234', clerk_user_id: 'userA', settings: { webhookEnabled: true, webhook: 'https://hooks.example.com/a' } }] });
    const d = deps(); const res = await testWebhooks(db, 'userA', 'page1234', d); expect(res[0].ok).toBe(true);
    expect(JSON.parse(d.fetchFn.mock.calls[0][1].body).test).toBe(true);
    await expect(testWebhooks(db, 'userB', 'page1234', deps())).rejects.toMatchObject({ status: 404 });
  });
});
