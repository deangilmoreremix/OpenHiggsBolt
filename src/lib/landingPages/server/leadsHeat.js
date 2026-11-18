/**
 * Landing pages, OpenHiggsBolt side: private form delivery settings, heat samples, the leads list and webhook delivery.
 * Same tables and SQL functions as the other app (migration 20261118100000), reached with the service role after the
 * Clerk user has been checked. Delivery reuses the shared, tested webhook logic (https only, private addresses blocked,
 * signed, retried): leadDelivery/logic.ts.
 */
import dns from 'node:dns/promises';
import { getOwnedPage, getPublishedPage, validPageId, HttpError, listContacts } from './pages.js';
import { CONTACT_ID_RE } from '../ids.js';
import { isForwardableWebhook, isValidEmail, isPrivateAddress, savedWebhooks, deliverWebhook, deriveSigningSecret, MAX_ATTEMPTS } from './leadDelivery/logic.ts';

const bad = (code, message) => new HttpError(400, code, message);
const dbFail = (error, fallback) => { if (error) throw new HttpError(500, 'DB_ERROR', fallback || error.message); };
const LIST_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const SESSION_RE = /^[A-Za-z0-9_-]{8,40}$/;

// ------------------------------------------------------------------ delivery settings (owner only)

export const defaultFormSettings = () => ({
  webhookEnabled: false, webhook: '', webhook2: '', webhook3: '',
  emailEnabled: false, emailAddress: '', emailAddress2: '', emailAddress3: '',
  espProvider: '', espListId: '',
});

const url = (v) => { const s = String(v || '').trim().slice(0, 500); return isForwardableWebhook(s) ? s : ''; };
const email = (v) => { const s = String(v || '').trim().slice(0, 254); return isValidEmail(s) ? s : ''; };

export function sanitizeFormSettings(raw) {
  const r = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const provider = r.espProvider === 'kit' || r.espProvider === 'mailerlite' ? r.espProvider : '';
  const listId = String(r.espListId || '').trim();
  return {
    webhookEnabled: r.webhookEnabled === true, webhook: url(r.webhook), webhook2: url(r.webhook2), webhook3: url(r.webhook3),
    emailEnabled: r.emailEnabled === true, emailAddress: email(r.emailAddress), emailAddress2: email(r.emailAddress2), emailAddress3: email(r.emailAddress3),
    espProvider: provider, espListId: provider && LIST_ID_RE.test(listId) ? listId : '',
  };
}

export async function getFormSettings(db, userId, pageId) {
  await getOwnedPage(db, userId, pageId);
  const { data, error } = await db.from('landing_page_form_settings').select('settings').eq('page_id', pageId).eq('clerk_user_id', userId).maybeSingle();
  dbFail(error, 'Could not load the settings');
  return sanitizeFormSettings(data?.settings);
}

export async function saveFormSettings(db, userId, pageId, settings) {
  await getOwnedPage(db, userId, pageId);
  const clean = sanitizeFormSettings(settings);
  const { error } = await db.from('landing_page_form_settings').upsert({ page_id: pageId, clerk_user_id: userId, settings: clean, updated_at: new Date().toISOString() }, { onConflict: 'page_id' });
  dbFail(error, 'Could not save the settings');
  return clean;
}

// ------------------------------------------------------------------ webhook delivery

/** Refuse hosts that resolve to a private address (rebinding / split-horizon DNS). */
export async function resolvesPublic(u) {
  const host = new URL(u).hostname;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return true; // literal already vetted by isForwardableWebhook
  try {
    const [a, aaaa] = await Promise.all([dns.resolve4(host).catch(() => []), dns.resolve6(host).catch(() => [])]);
    const all = [...a, ...aaaa];
    return all.length > 0 && all.every((ip) => !isPrivateAddress(ip));
  } catch { return false; }
}

const realDeps = () => ({
  fetchFn: (u, init) => fetch(u, init),
  sleepFn: (ms) => new Promise((r) => setTimeout(r, ms)),
  nowFn: () => Date.now(),
  resolvesPublic,
  newId: () => crypto.randomUUID(),
});

const logRows = (ownerId, pageId, deliveries) => deliveries.map((d) => ({
  clerk_user_id: ownerId, delivery_id: d.deliveryId, project_id: pageId, clip_id: 'landing-page', kind: 'lead-form',
  url_host: d.host, ok: d.ok, http_status: d.status, attempts: d.attempts, error: d.error,
}));

/** Send one lead to the owner's saved webhooks (settings read here, never from the request) and log the outcome. */
export async function deliverLead(db, { pageId, contactId, data }, deps = realDeps(), master = process.env.WEBHOOK_SIGNING_SECRET || '') {
  const { data: owner } = await db.from('landing_pages').select('clerk_user_id').eq('id', pageId).eq('published', true).maybeSingle();
  const ownerId = owner?.clerk_user_id;
  if (!ownerId) return [];
  const { data: row } = await db.from('landing_page_form_settings').select('settings').eq('page_id', pageId).maybeSingle();
  const hooks = savedWebhooks(row?.settings ?? null, true);
  if (!hooks.length) return [];
  const body = JSON.stringify({ event: 'landing_page_lead', kind: 'lead-form', pageId, contactId, data, submittedAt: new Date().toISOString() });
  const secret = master ? await deriveSigningSecret(master, ownerId) : '';
  const deliveries = await Promise.all(hooks.map((u) => deliverWebhook({ url: u, body, event: 'landing_page_lead', secret, maxAttempts: MAX_ATTEMPTS }, deps)));
  const { error } = await db.from('webhook_deliveries').insert(logRows(ownerId, pageId, deliveries));
  if (error) console.warn('[landing-pages] delivery log failed:', error.code);
  return deliveries;
}

/** "Test webhook": a signed sample to the saved addresses, so the owner can see the receiver answers. */
export async function testWebhooks(db, userId, pageId, deps = realDeps(), master = process.env.WEBHOOK_SIGNING_SECRET || '') {
  const settings = await getFormSettings(db, userId, pageId);
  const hooks = savedWebhooks(settings, true);
  if (!hooks.length) throw bad('NO_WEBHOOK', 'Switch the webhook on and save a valid https address first');
  const body = JSON.stringify({ event: 'landing_page_lead', kind: 'lead-form', pageId, contactId: null, data: { Email: 'test@example.com', Name: 'Test lead' }, test: true, submittedAt: new Date().toISOString() });
  const secret = master ? await deriveSigningSecret(master, userId) : '';
  return Promise.all(hooks.map((u) => deliverWebhook({ url: u, body, event: 'landing_page_lead', secret, maxAttempts: 1 }, deps)));
}

// ------------------------------------------------------------------ heat samples

/** Public: a few clicks / scroll steps / watched seconds from a published page (validated again in SQL). */
export async function recordHeat(db, pageId, body) {
  if (!validPageId(pageId)) throw bad('BAD_PAGE', 'Bad page id');
  const session = String(body?.session || '');
  if (!SESSION_RE.test(session)) throw bad('BAD_SESSION', 'Bad session');
  const events = Array.isArray(body?.events) ? body.events.slice(0, 40) : [];
  if (!events.length) return;
  const contactId = typeof body?.contactId === 'string' && CONTACT_ID_RE.test(body.contactId) ? body.contactId : null;
  const page = await getPublishedPage(db, pageId);
  if (!page) return;
  const { error } = await db.rpc('record_page_heat', { p_page_id: pageId, p_session: session, p_events: events, p_contact_id: contactId });
  dbFail(error, 'Could not record');
}

const rows = (r) => { dbFail(r.error, 'Could not load the heat maps'); return Array.isArray(r.data) ? r.data : []; };

export async function pageHeat(db, userId, pageId, { days = 30, viewport = 'all' } = {}) {
  await getOwnedPage(db, userId, pageId);
  const d = Math.max(1, Math.min(365, Number(days) || 30));
  const range = { p_from: new Date(Date.now() - d * 86400000).toISOString(), p_to: new Date().toISOString(), p_viewport: ['mobile', 'tablet', 'desktop'].includes(viewport) ? viewport : null };
  const [clicks, scroll, watch, contacts] = await Promise.all([
    db.rpc('page_heat_clicks_for', { p_owner: userId, p_page_id: pageId, ...range }),
    db.rpc('page_heat_scroll_for', { p_owner: userId, p_page_id: pageId, ...range }),
    db.rpc('page_heat_watch_for', { p_owner: userId, p_page_id: pageId, ...range }),
    db.rpc('page_heat_by_contact_for', { p_owner: userId, p_page_id: pageId }),
  ]);
  const n = (v) => Number(v) || 0;
  return {
    clicks: rows(clicks).map((r) => ({ cx: n(r.cx), cy: n(r.cy), clicks: n(r.clicks), sessions: n(r.sessions) })),
    scroll: rows(scroll).map((r) => ({ depth: n(r.depth), sessions: n(r.sessions), totalSessions: n(r.total_sessions) })),
    watch: rows(watch).map((r) => ({ sec: n(r.sec), plays: n(r.plays), sessions: n(r.sessions) })),
    contacts: rows(contacts).map((r) => ({ contactId: r.contact_id, sessions: n(r.sessions), clicks: n(r.clicks), maxScroll: n(r.max_scroll), watchedSeconds: n(r.watched_seconds), lastSeen: r.last_seen || null })),
  };
}

// ------------------------------------------------------------------ leads list

/** The page's leads, newest first, each matched to the personal link it came from. */
export async function pageLeads(db, userId, pageId) {
  await getOwnedPage(db, userId, pageId);
  const [{ data, error }, contacts] = await Promise.all([
    db.from('landing_page_leads').select('id, contact_id, data, created_at').eq('page_id', pageId).order('created_at', { ascending: false }).limit(2000),
    listContacts(db, userId, pageId),
  ]);
  dbFail(error, 'Could not load the leads');
  const byId = new Map(contacts.map((c) => [c.id, c.fields || {}]));
  return (data || []).map((l) => {
    const f = l.contact_id ? byId.get(l.contact_id) : null;
    const who = !l.contact_id ? 'Direct visit' : ([f?.firstname, f?.lastname].filter(Boolean).join(' ') || f?.company || `Link ${String(l.contact_id).slice(0, 6)}`);
    return { id: l.id, contactId: l.contact_id || null, who, createdAt: l.created_at, answers: l.data || {} };
  });
}
