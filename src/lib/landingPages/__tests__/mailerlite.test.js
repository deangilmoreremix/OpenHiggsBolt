import { describe, it, expect, vi } from 'vitest';
import { subscriberBody, pushContacts, checkKey, listGroups, validGroupId, ProviderError, MAX_CONTACTS } from '../server/mailerlite.js';
import { maskKey, plausibleKey, getSavedKey, saveKey, deleteKey } from '../server/syncSettings.js';

const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), { status, headers });

describe('MailerLite sync (server)', () => {
  it('builds a subscriber body with the personal link in a custom field', () => {
    expect(subscriberBody({ email: ' a@x.io ', firstname: 'Ann', lastname: 'Lee', company: 'Acme', link: 'https://app.io/p/abc?c=1' }, { linkKey: 'video_page_url', groupId: '42' }))
      .toEqual({ email: 'a@x.io', fields: { name: 'Ann', last_name: 'Lee', company: 'Acme', video_page_url: 'https://app.io/p/abc?c=1' }, groups: ['42'] });
    expect(subscriberBody({ email: 'a@x.io', link: 'javascript:alert(1)' }, { linkKey: 'k' }).fields).toEqual({});
  });
  it('validates group ids', () => {
    expect(validGroupId('123')).toBe(true); expect(validGroupId(null)).toBe(true); expect(validGroupId('')).toBe(true);
    expect(validGroupId('12;drop')).toBe(false);
  });
  it('talks only to the MailerLite API host with the bearer key', async () => {
    const fetchImpl = vi.fn(async () => json({ data: [{ id: 7, name: 'Leads' }] }));
    expect(await listGroups({ key: 'ML', fetchImpl })).toEqual([{ id: '7', name: 'Leads' }]);
    await checkKey({ key: 'ML', fetchImpl });
    for (const [url, init] of fetchImpl.mock.calls) { expect(url.startsWith('https://connect.mailerlite.com/api/')).toBe(true); expect(init.headers.Authorization).toBe('Bearer ML'); }
  });
  it('creates the link field once, upserts valid contacts and reports bad emails', async () => {
    const calls = [];
    const fetchImpl = vi.fn(async (url, init) => {
      calls.push([url.replace('https://connect.mailerlite.com/api', ''), init.method, init.body && JSON.parse(init.body)]);
      if (url.includes('/fields?')) return json({ data: [] });
      if (url.endsWith('/fields')) return json({ data: { key: 'video_page_url' } });
      return json({ data: { id: 1 } });
    });
    const out = await pushContacts({ key: 'ML', fetchImpl }, [{ email: 'a@x.io', link: 'https://app.io/p/x?c=1' }, { email: 'bad' }, { email: 'b@x.io', link: 'https://app.io/p/x?c=2' }], '9');
    expect(out).toMatchObject({ pushed: 2, rateLimited: false, field: 'video_page_url' });
    expect(out.failed).toEqual([{ index: 1, reason: 'invalid email' }]);
    expect(calls.filter(([u, m]) => u === '/fields' && m === 'POST')).toHaveLength(1);
    expect(calls.filter(([u]) => u === '/subscribers').every(([, , b]) => b.groups[0] === '9')).toBe(true);
  });
  it('stops on a rate limit and says what was not sent', async () => {
    const fetchImpl = vi.fn(async (url) => (url.includes('/subscribers') ? json({ message: 'slow down' }, 429, { 'retry-after': '30' }) : json({ data: [] })));
    const rows = Array.from({ length: 10 }, (_, i) => ({ email: `u${i}@x.io` }));
    const out = await pushContacts({ key: 'ML', fetchImpl }, rows, null);
    expect(out.rateLimited).toBe(true); expect(out.retryAfter).toBe(30);
    expect(out.failed.length + out.pushed).toBe(10);
  });
  it('a rejected key is surfaced as 401/403 so the route can ask for a new one', async () => {
    const err = await pushContacts({ key: 'bad', fetchImpl: async () => json({ message: 'Unauthenticated' }, 401) }, [{ email: 'a@x.io' }], null).catch((e) => e);
    expect(err).toBeInstanceOf(ProviderError); expect(err.status).toBe(401);
  });
  it('the batch size matches the route', () => { expect(MAX_CONTACTS).toBe(200); });
});

describe('MailerLite key storage', () => {
  const store = () => { const rows = {}; return { rows, from: () => ({ select: () => ({ eq: (k, id) => ({ maybeSingle: async () => ({ data: rows[id] || null }) }) }), upsert: async (r) => { rows[r.clerk_user_id] = r; return { error: null }; }, delete: () => ({ eq: async (k, id) => { delete rows[id]; return { error: null }; } }) }) }; };
  it('stores the key encrypted, never plain, per user', async () => {
    const db = store(); const enc = (s) => `enc(${s})`; const dec = (s) => s.slice(4, -1);
    await saveKey(db, 'user_a', 'secret-token-abcdefghijkl', enc);
    expect(JSON.stringify(db.rows)).not.toContain('"secret-token-abcdefghijkl"');
    expect(await getSavedKey(db, 'user_a', dec)).toBe('secret-token-abcdefghijkl');
    expect(await getSavedKey(db, 'user_b', dec)).toBeNull();
    await deleteKey(db, 'user_a'); expect(await getSavedKey(db, 'user_a', dec)).toBeNull();
  });
  it('masks keys and rejects implausible ones', () => {
    expect(maskKey('abcdefghijklmnopqrstuvwxyz')).toBe('••••••••wxyz'); expect(maskKey(null)).toBe('');
    expect(plausibleKey('short')).toBe(false); expect(plausibleKey('has space inside the token string here')).toBe(false); expect(plausibleKey('a'.repeat(40))).toBe(true);
  });
});
