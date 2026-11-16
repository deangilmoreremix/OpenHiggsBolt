/**
 * Push a page's contacts (with their personal link) to the customer's OWN MailerLite account.
 * Requests go only to the fixed MailerLite API host. Endpoints and fields verified against
 * developers.mailerlite.com (subscribers upsert, fields, groups). Kit is NOT implemented: its API docs
 * could not be verified, and provider code is not shipped unverified.
 */
export const API = 'https://connect.mailerlite.com/api';
export const LINK_FIELD_NAME = 'video page url';
export const MAX_CONTACTS = 200;
const EMAIL = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]{2,}$/;
const GROUP_ID = /^\d{1,24}$/;
const CONCURRENCY = 3;

export class ProviderError extends Error {
  constructor(status, message, retryAfter) { super(message); this.status = status; this.retryAfter = retryAfter; }
}

async function ml(path, { key, method = 'GET', body, fetchImpl = fetch }) {
  const res = await fetchImpl(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${key}`, Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(8000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ProviderError(res.status, data?.message || `MailerLite error (HTTP ${res.status})`, Number(res.headers?.get?.('retry-after')) || undefined);
  return data;
}

export async function checkKey(ctx) { await ml('/groups?limit=1', ctx); }

export async function listGroups(ctx) {
  const res = await ml('/groups?limit=100&sort=name', ctx);
  return (res.data || []).map((g) => ({ id: String(g.id), name: clean(g.name, 120) }));
}

/** Find the "video page url" field, creating it once. Returns its key. */
async function ensureLinkField(ctx) {
  const list = await ml('/fields?limit=200', ctx);
  const existing = (list.data || []).find((f) => String(f.name).toLowerCase() === LINK_FIELD_NAME);
  if (existing?.key) return existing.key;
  const created = await ml('/fields', { ...ctx, method: 'POST', body: { name: LINK_FIELD_NAME, type: 'text' } });
  return created?.data?.key || null;
}

const clean = (v, n = 200) => String(v ?? '').trim().slice(0, n);

/** Subscriber upsert body for one contact. */
export function subscriberBody(contact, { linkKey, groupId }) {
  const fields = {};
  if (clean(contact.firstname)) fields.name = clean(contact.firstname);
  if (clean(contact.lastname)) fields.last_name = clean(contact.lastname);
  if (clean(contact.company)) fields.company = clean(contact.company);
  if (linkKey && /^https:\/\//i.test(String(contact.link || ''))) fields[linkKey] = clean(contact.link, 2048);
  const body = { email: clean(contact.email, 320), fields };
  if (groupId) body.groups = [groupId];
  return body;
}

export function validGroupId(groupId) { return groupId == null || groupId === '' || GROUP_ID.test(String(groupId)); }

/** Push up to MAX_CONTACTS contacts. Returns { pushed, failed:[{index,reason}], rateLimited, retryAfter, field }. */
export async function pushContacts(ctx, contacts, groupId) {
  const failed = [];
  const valid = [];
  contacts.forEach((c, index) => {
    if (!c || !EMAIL.test(clean(c.email, 320))) failed.push({ index, reason: 'invalid email' });
    else valid.push({ index, contact: c });
  });
  const linkKey = valid.some(({ contact }) => contact.link) ? await ensureLinkField(ctx) : null;
  let pushed = 0; let rateLimited = false; let retryAfter; let cursor = 0;
  const worker = async () => {
    while (cursor < valid.length && !rateLimited) {
      const { index, contact } = valid[cursor++];
      try {
        await ml('/subscribers', { ...ctx, method: 'POST', body: subscriberBody(contact, { linkKey, groupId: groupId ? String(groupId) : null }) });
        pushed += 1;
      } catch (err) {
        if (err.status === 429) { rateLimited = true; retryAfter = err.retryAfter; failed.push({ index, reason: 'rate limited' }); }
        else if (err.status === 401 || err.status === 403) throw err;
        else failed.push({ index, reason: err.message || 'rejected' });
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, valid.length) }, worker));
  if (rateLimited) valid.slice(cursor).forEach(({ index }) => failed.push({ index, reason: 'not sent (rate limited)' }));
  return { pushed, failed, rateLimited, retryAfter: retryAfter ?? null, field: linkKey };
}
