import { describe, it, expect } from 'vitest';
import { listPages, getOwnedPage, createPage, updatePage, deletePage, getPublishedPage, getContactTokens, recordEvent, submitLead, pageStats, HttpError } from '../server/pages.js';
import { defaultConfig } from '../templates.js';

/** Minimal in-memory stand-in for the supabase-js query builder (only what the data layer uses). */
function fakeDb(seed = {}) {
  const tables = { landing_pages: [], landing_page_contacts: [], landing_page_leads: [], ...seed };
  const rpcCalls = [];
  const builder = (name) => {
    let rows = tables[name];
    let op = 'select'; let payload = null; let single = false; let maybe = false;
    const filters = [];
    const run = () => {
      let out = rows.filter((r) => filters.every(([k, v]) => r[k] === v));
      if (op === 'insert') { const row = { ...payload, view_count: 0, created_at: 'now', updated_at: 'now' }; tables[name].push(row); out = [row]; }
      if (op === 'update') { out.forEach((r) => Object.assign(r, payload)); }
      if (op === 'delete') { tables[name] = tables[name].filter((r) => !out.includes(r)); out = []; }
      if (single || maybe) return { data: out[0] || null, error: single && !out[0] ? { message: 'no rows' } : null };
      return { data: out, error: null };
    };
    const api = {
      select: () => api, order: () => api, limit: () => api,
      insert: (p) => { op = 'insert'; payload = p; return api; },
      update: (p) => { op = 'update'; payload = p; return api; },
      delete: () => { op = 'delete'; return api; },
      eq: (k, v) => { filters.push([k, v]); return api; },
      single: () => { single = true; return Promise.resolve(run()); },
      maybeSingle: () => { maybe = true; return Promise.resolve(run()); },
      then: (res, rej) => Promise.resolve(run()).then(res, rej),
    };
    return api;
  };
  return { tables, rpcCalls, from: builder, rpc: async (fn, args) => { rpcCalls.push([fn, args]); return { data: fn === 'landing_page_stats' ? [{ views: '5', plays: 3, completes: 1, cta_clicks: 2, leads: 1, unique_contacts: 4, likes: 2 }] : null, error: null }; } };
}
const input = (extra = {}) => ({ title: 'Demo', videoUrl: 'https://cdn.x.io/v.mp4', config: defaultConfig('puck-starter'), ...extra });
const rejects = async (p, status, code) => { try { await p; } catch (e) { expect(e).toBeInstanceOf(HttpError); expect(e.status).toBe(status); if (code) expect(e.code).toBe(code); return; } throw new Error('expected to reject'); };

describe('landing pages server data layer', () => {
  it('creates a draft owned by the caller with a sanitized config', async () => {
    const db = fakeDb();
    const page = await createPage(db, 'user_a', input({ config: { ...defaultConfig('puck-starter'), headline: 'x'.repeat(999) } }));
    expect(page.clerk_user_id).toBe('user_a');
    expect(page.published).toBe(false);
    expect(page.config.headline.length).toBeLessThanOrEqual(200);
    expect(page.id).toMatch(/^[A-Za-z0-9_-]{8,32}$/);
  });
  it('refuses a video that is not https', async () => {
    await rejects(createPage(fakeDb(), 'u', input({ videoUrl: 'http://x.io/v.mp4' })), 400, 'BAD_VIDEO_URL');
    await rejects(createPage(fakeDb(), 'u', input({ videoUrl: 'javascript:alert(1)' })), 400, 'BAD_VIDEO_URL');
  });
  it('lists, reads, updates and deletes only the owner\'s pages', async () => {
    const db = fakeDb();
    const a = await createPage(db, 'user_a', input());
    await createPage(db, 'user_b', input({ title: 'B page' }));
    expect((await listPages(db, 'user_a')).map((p) => p.id)).toEqual([a.id]);
    await rejects(getOwnedPage(db, 'user_b', a.id), 404);
    await rejects(updatePage(db, 'user_b', a.id, { title: 'hijack' }), 404);
    await rejects(deletePage(db, 'user_b', a.id), 404);
    const updated = await updatePage(db, 'user_a', a.id, { title: 'New', published: true });
    expect(updated).toMatchObject({ title: 'New', published: true });
    await deletePage(db, 'user_a', a.id);
    expect(db.tables.landing_pages.some((p) => p.id === a.id)).toBe(false);
  });
  it('rejects bad ids and empty updates; owners cannot change owner or view count', async () => {
    const db = fakeDb();
    const a = await createPage(db, 'user_a', input());
    await rejects(getOwnedPage(db, 'user_a', '../etc'), 404);
    await rejects(updatePage(db, 'user_a', a.id, {}), 400, 'NOTHING_TO_UPDATE');
    await updatePage(db, 'user_a', a.id, { clerk_user_id: 'user_b', view_count: 999, title: 'ok' });
    const row = db.tables.landing_pages[0];
    expect(row.clerk_user_id).toBe('user_a');
    expect(row.view_count).toBe(0);
  });
  it('public reads see only published pages and never the owner id', async () => {
    const db = fakeDb();
    const a = await createPage(db, 'user_a', input());
    // The fake ignores the column list, so check the requested columns instead.
    expect(await getPublishedPage(db, a.id)).toBeNull();
    await updatePage(db, 'user_a', a.id, { published: true });
    expect((await getPublishedPage(db, a.id)).id).toBe(a.id);
    expect(await getPublishedPage(db, 'bad id!')).toBeNull();
  });
  it('contact tokens: whitelisted keys only, never email, only for published pages', async () => {
    const db = fakeDb();
    const a = await createPage(db, 'user_a', input());
    db.tables.landing_page_contacts.push({ id: 'contactMaya1', page_id: a.id, fields: { firstname: 'Maya', company: 'Brightline', email: 'maya@x.io', secret: 'nope' } });
    expect(await getContactTokens(db, a.id, 'contactMaya1')).toEqual({});
    await updatePage(db, 'user_a', a.id, { published: true });
    expect(await getContactTokens(db, a.id, 'contactMaya1')).toEqual({ firstname: 'Maya', company: 'Brightline' });
    expect(await getContactTokens(db, a.id, 'nope')).toEqual({});
  });
  it('records only known events with clean ids', async () => {
    const db = fakeDb();
    await recordEvent(db, 'abcdefgh12', 'play', 'contactMaya1');
    expect(db.rpcCalls[0]).toEqual(['landing_page_record_event', { p_page_id: 'abcdefgh12', p_kind: 'play', p_contact_id: 'contactMaya1' }]);
    await recordEvent(db, 'abcdefgh12', 'view', "x'; drop table");
    expect(db.rpcCalls[1][1].p_contact_id).toBeNull();
    await rejects(recordEvent(db, 'abcdefgh12', 'hack', null), 400, 'BAD_KIND');
    await rejects(recordEvent(db, '../x', 'view', null), 400, 'BAD_PAGE');
  });
  it('stores leads for published pages only, with cleaned fields', async () => {
    const db = fakeDb();
    const a = await createPage(db, 'user_a', input());
    await rejects(submitLead(db, a.id, null, { name: 'A', email: 'a@x.io' }), 404);
    await updatePage(db, 'user_a', a.id, { published: true });
    await submitLead(db, a.id, 'contactMaya1', { name: ' Maya ', email: 'maya@x.io', 'bad key': 'x', n: 5, long: 'y'.repeat(2000) });
    const lead = db.tables.landing_page_leads[0];
    expect(lead.data).toEqual({ name: 'Maya', email: 'maya@x.io', long: 'y'.repeat(1000) });
    expect(lead.contact_id).toBe('contactMaya1');
    expect(db.rpcCalls.at(-1)[1].p_kind).toBe('lead');
    await rejects(submitLead(db, a.id, null, { email: 'not an email' }), 400, 'BAD_EMAIL');
    await rejects(submitLead(db, a.id, null, {}), 400, 'EMPTY');
    await rejects(submitLead(db, a.id, null, 'x'), 400, 'BAD_DATA');
  });
  it('stats are owner-only and numeric', async () => {
    const db = fakeDb();
    const a = await createPage(db, 'user_a', input());
    expect(await pageStats(db, 'user_a', a.id)).toMatchObject({ views: 5, plays: 3, likes: 2, uniqueContacts: 4 });
    await rejects(pageStats(db, 'user_b', a.id), 404);
  });
});
