/**
 * Landing pages: server-side data layer. Every function takes a Supabase service-role client (`db`)
 * and, for owner calls, the Clerk user id, and scopes every query to that owner. Public calls only
 * ever see PUBLISHED pages. Nothing here trusts browser input: configs go through sanitizeConfig,
 * ids through regexes, URLs through the https-only checks.
 */
import { sanitizeConfig, safeImageUrl, PUBLIC_TOKEN_KEYS } from '../templates.js';
import { PAGE_ID_RE, CONTACT_ID_RE, PAGE_EVENT_KINDS, makeSlug, makeContactId } from '../ids.js';
import { CONTACT_FIELDS, MAX_CONTACTS_PER_IMPORT } from '../csv.js';

export const OWNER_COLUMNS = 'id, title, video_url, poster_url, duration, source, config, published, view_count, created_at, updated_at';
export const PUBLIC_COLUMNS = 'id, title, video_url, poster_url, duration, config, updated_at';

export class HttpError extends Error {
  constructor(status, code, message) { super(message || code); this.status = status; this.code = code; }
}
const bad = (code, message) => new HttpError(400, code, message);
const notFound = () => new HttpError(404, 'NOT_FOUND', 'Page not found');
const dbFail = (error, fallback) => { if (error) throw new HttpError(500, 'DB_ERROR', fallback || error.message); };

const isHttps = (v) => typeof v === 'string' && v.length <= 2048 && /^https:\/\//i.test(v);

export function validPageId(id) { return typeof id === 'string' && PAGE_ID_RE.test(id); }

// ------------------------------------------------------------------ owner

export async function listPages(db, userId) {
  const { data, error } = await db.from('landing_pages').select(OWNER_COLUMNS).eq('clerk_user_id', userId).order('updated_at', { ascending: false }).limit(200);
  dbFail(error, 'Could not load your pages');
  return data || [];
}

export async function getOwnedPage(db, userId, id) {
  if (!validPageId(id)) throw notFound();
  const { data, error } = await db.from('landing_pages').select(OWNER_COLUMNS).eq('id', id).eq('clerk_user_id', userId).maybeSingle();
  dbFail(error);
  if (!data) throw notFound();
  return data;
}

export async function createPage(db, userId, input = {}) {
  if (!isHttps(input.videoUrl)) throw bad('BAD_VIDEO_URL', 'The video needs a permanent https link before it can be published');
  const duration = Number(input.duration);
  const row = {
    id: makeSlug(10),
    clerk_user_id: userId,
    title: String(input.title || 'Untitled page').slice(0, 200),
    video_url: input.videoUrl,
    poster_url: safeImageUrl(input.posterUrl) || null,
    duration: Number.isFinite(duration) && duration >= 0 ? duration : null,
    source: input.source && typeof input.source === 'object' && !Array.isArray(input.source) ? input.source : {},
    config: sanitizeConfig(input.config),
    published: false,
  };
  const { data, error } = await db.from('landing_pages').insert(row).select(OWNER_COLUMNS).single();
  dbFail(error, 'Could not create the page');
  return data;
}

export async function updatePage(db, userId, id, patch = {}) {
  await getOwnedPage(db, userId, id);
  const row = {};
  if ('title' in patch) row.title = String(patch.title || 'Untitled page').slice(0, 200);
  if ('config' in patch) row.config = sanitizeConfig(patch.config);
  if ('posterUrl' in patch) row.poster_url = safeImageUrl(patch.posterUrl) || null;
  if ('published' in patch) row.published = !!patch.published;
  if (!Object.keys(row).length) throw bad('NOTHING_TO_UPDATE', 'Nothing to update');
  const { data, error } = await db.from('landing_pages').update(row).eq('id', id).eq('clerk_user_id', userId).select(OWNER_COLUMNS).single();
  dbFail(error, 'Could not save the page');
  return data;
}

export async function deletePage(db, userId, id) {
  await getOwnedPage(db, userId, id);
  const { error } = await db.from('landing_pages').delete().eq('id', id).eq('clerk_user_id', userId);
  dbFail(error, 'Could not delete the page');
}

// ------------------------------------------------------------------ public

/** A published page for the public route. Never returns the owner id. */
export async function getPublishedPage(db, id) {
  if (!validPageId(id)) return null;
  const { data, error } = await db.from('landing_pages').select(PUBLIC_COLUMNS).eq('id', id).eq('published', true).maybeSingle();
  if (error) return null;
  return data || null;
}

/** Only the whitelisted personalisation fields of one contact (never email), for a published page. */
export async function getContactTokens(db, pageId, contactId) {
  if (!validPageId(pageId) || typeof contactId !== 'string' || !CONTACT_ID_RE.test(contactId)) return {};
  const page = await getPublishedPage(db, pageId);
  if (!page) return {};
  const { data } = await db.from('landing_page_contacts').select('fields').eq('id', contactId).eq('page_id', pageId).maybeSingle();
  const fields = data?.fields && typeof data.fields === 'object' ? data.fields : {};
  const out = {};
  for (const k of PUBLIC_TOKEN_KEYS) if (typeof fields[k] === 'string' && fields[k]) out[k] = fields[k].slice(0, 200);
  return out;
}

export async function recordEvent(db, pageId, kind, contactId) {
  if (!validPageId(pageId)) throw bad('BAD_PAGE', 'Bad page id');
  if (!PAGE_EVENT_KINDS.includes(kind)) throw bad('BAD_KIND', 'Unknown event');
  const contact = typeof contactId === 'string' && CONTACT_ID_RE.test(contactId) ? contactId : null;
  const { error } = await db.rpc('landing_page_record_event', { p_page_id: pageId, p_kind: kind, p_contact_id: contact });
  dbFail(error, 'Could not record the event');
}

const FIELD_KEY = /^[a-z0-9_]{1,40}$/;
/** Lead-form submission for a published page. */
export async function submitLead(db, pageId, contactId, data) {
  if (!validPageId(pageId)) throw bad('BAD_PAGE', 'Bad page id');
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw bad('BAD_DATA', 'Send the form fields');
  const clean = {};
  for (const [k, v] of Object.entries(data)) {
    if (!FIELD_KEY.test(k) || typeof v !== 'string') continue;
    const s = v.trim().slice(0, 1000);
    if (s) clean[k] = s;
    if (Object.keys(clean).length >= 12) break;
  }
  if (!Object.keys(clean).length) throw bad('EMPTY', 'Fill in the form');
  if (clean.email && !/^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(clean.email)) throw bad('BAD_EMAIL', 'Enter a valid email');
  const page = await getPublishedPage(db, pageId);
  if (!page) throw notFound();
  const contact = typeof contactId === 'string' && CONTACT_ID_RE.test(contactId) ? contactId : null;
  const { error } = await db.from('landing_page_leads').insert({ page_id: pageId, contact_id: contact, data: clean });
  dbFail(error, 'Could not save your details');
  await recordEvent(db, pageId, 'lead', contact).catch(() => {});
  return { contactId: contact, data: clean };
}

// ------------------------------------------------------------------ stats

export async function pageStats(db, userId, id) {
  await getOwnedPage(db, userId, id);
  const { data, error } = await db.rpc('landing_page_stats', { p_page_id: id });
  dbFail(error, 'Could not load the stats');
  const row = Array.isArray(data) ? data[0] : data;
  const n = (v) => Number(v) || 0;
  return { views: n(row?.views), plays: n(row?.plays), completes: n(row?.completes), ctaClicks: n(row?.cta_clicks), leads: n(row?.leads), uniqueContacts: n(row?.unique_contacts), likes: n(row?.likes) };
}

// ------------------------------------------------------------------ contacts (personal links)

const CONTACT_COLUMNS = 'id, page_id, fields, external, created_at';
const cleanFields = (raw) => {
  const out = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const k of CONTACT_FIELDS) {
    const v = typeof raw[k] === 'string' ? raw[k].trim().slice(0, 200) : '';
    if (v) out[k] = v;
  }
  if (out.companylogo && !/^https:\/\/\S+$/i.test(out.companylogo)) delete out.companylogo;
  return out;
};

export async function listContacts(db, userId, pageId) {
  await getOwnedPage(db, userId, pageId);
  const { data, error } = await db.from('landing_page_contacts').select(CONTACT_COLUMNS).eq('page_id', pageId).eq('clerk_user_id', userId).order('created_at', { ascending: false }).limit(5000);
  dbFail(error, 'Could not load the contacts');
  return data || [];
}

/** Adds up to MAX_CONTACTS_PER_IMPORT contacts to a page the caller owns; returns the stored rows with their ids. */
export async function addContacts(db, userId, pageId, contacts) {
  await getOwnedPage(db, userId, pageId);
  if (!Array.isArray(contacts) || !contacts.length) throw bad('NO_CONTACTS', 'Add at least one contact');
  if (contacts.length > MAX_CONTACTS_PER_IMPORT) throw bad('TOO_MANY', `Import at most ${MAX_CONTACTS_PER_IMPORT} contacts at a time`);
  const rows = contacts
    .map((c) => cleanFields(c?.fields))
    .filter((f) => Object.keys(f).length)
    .map((fields) => ({ id: makeContactId(), page_id: pageId, clerk_user_id: userId, fields }));
  if (!rows.length) throw bad('NO_CONTACTS', 'None of the contacts had usable fields');
  const stored = [];
  for (let i = 0; i < rows.length; i += 200) {
    const { data, error } = await db.from('landing_page_contacts').insert(rows.slice(i, i + 200)).select(CONTACT_COLUMNS);
    dbFail(error, 'Could not save the contacts');
    stored.push(...(data || []));
  }
  return stored;
}

export async function removeContact(db, userId, pageId, contactId) {
  await getOwnedPage(db, userId, pageId);
  if (typeof contactId !== 'string' || !CONTACT_ID_RE.test(contactId)) throw bad('BAD_CONTACT', 'Bad contact id');
  const { error } = await db.from('landing_page_contacts').delete().eq('id', contactId).eq('page_id', pageId).eq('clerk_user_id', userId);
  dbFail(error, 'Could not remove the contact');
}

/** Per-contact activity for a page the caller owns. */
export async function contactStats(db, userId, pageId) {
  await getOwnedPage(db, userId, pageId);
  const { data, error } = await db.rpc('landing_page_events_by_contact', { p_page_id: pageId });
  dbFail(error, 'Could not load the activity');
  const n = (v) => Number(v) || 0;
  return (data || []).map((r) => ({ contactId: r.contact_id, views: n(r.views), plays: n(r.plays), maxProgress: n(r.max_progress), completes: n(r.completes), ctaClicks: n(r.cta_clicks), leads: n(r.leads), lastSeen: r.last_seen || null }));
}
