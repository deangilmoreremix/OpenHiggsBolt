/**
 * Browser client for the landing page routes (app/api/landing-pages). The signed-in owner calls use the
 * Clerk session cookie; the viewer calls (events, lead form) need no sign-in.
 */
const BASE = '/api/landing-pages';

async function call(path, { method = 'GET', body, keepalive = false } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: 'same-origin',
    keepalive,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = res.status === 401 ? 'Sign in to manage landing pages' : (data?.error || `Request failed (${res.status})`);
    throw Object.assign(new Error(msg), { status: res.status, code: data?.code });
  }
  return data;
}

// owner
export const listPages = async () => (await call('')).pages;
export const createPage = async (input) => (await call('', { method: 'POST', body: input })).page;
export const getPage = async (id) => (await call(`/${encodeURIComponent(id)}`)).page;
export const updatePage = async (id, patch) => (await call(`/${encodeURIComponent(id)}`, { method: 'PATCH', body: patch })).page;
export const setPagePublished = (id, published) => updatePage(id, { published });
export const deletePage = (id) => call(`/${encodeURIComponent(id)}`, { method: 'DELETE' });
export const fetchPageStats = async (id) => (await call(`/${encodeURIComponent(id)}/stats`)).stats;

// viewers
/** @param {string} pageId @param {{ kind: string, contactId?: string | null }} event */
export async function recordPageEvent(pageId, { kind, contactId = null }) {
  try {
    await call(`/${encodeURIComponent(pageId)}/events`, { method: 'POST', body: { kind, contactId }, keepalive: true });
  } catch {
    // tracking never breaks the page
  }
}
/** @param {{ pageId: string, contactId?: string | null, data: Record<string, string> }} lead */
/** @param {{ pageId: string, contactId?: string | null, data: Record<string, string>, kind?: string }} lead */
export const submitPageLead = ({ pageId, contactId = null, data, kind = 'lead-form' }) => call(`/${encodeURIComponent(pageId)}/lead`, { method: 'POST', body: { contactId, data, kind } });

// contacts (owner)
export const listContacts = async (pageId) => (await call(`/${encodeURIComponent(pageId)}/contacts`)).contacts;
export const addContacts = async (pageId, contacts) => (await call(`/${encodeURIComponent(pageId)}/contacts`, { method: 'POST', body: { contacts } })).contacts;
export const removeContact = (pageId, contactId) => call(`/${encodeURIComponent(pageId)}/contacts?contactId=${encodeURIComponent(contactId)}`, { method: 'DELETE' });
export const fetchContactStats = async (pageId) => (await call(`/${encodeURIComponent(pageId)}/contacts/stats`)).stats;

// MailerLite sync (owner; the key lives on the server)
const SYNC = '/api/landing-pages/sync';
async function sync(method, body) {
  const res = await fetch(SYNC, { method, credentials: 'same-origin', headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data?.error || `Request failed (${res.status})`), { status: res.status, code: data?.code });
  return data;
}
export const syncStatus = () => sync('GET');
export const syncConnect = (apiKey) => sync('PUT', { apiKey });
export const syncDisconnect = () => sync('DELETE');
export const syncGroups = async () => (await sync('POST', { action: 'groups' })).groups;
export const syncPush = (pageId, groupId, offset = 0) => sync('POST', { action: 'push', pageId, groupId: groupId || null, offset });

// leads, delivery settings and heat maps
export const listPageLeads = async (id) => (await call(`/${encodeURIComponent(id)}/leads`)).leads;
export const getFormSettings = async (id) => (await call(`/${encodeURIComponent(id)}/form-settings`)).settings;
export const saveFormSettings = async (id, settings) => (await call(`/${encodeURIComponent(id)}/form-settings`, { method: 'PUT', body: { settings } })).settings;
export const testFormWebhooks = async (id) => (await call(`/${encodeURIComponent(id)}/form-settings/test`, { method: 'POST', body: {} })).results;
export const fetchPageHeat = async (id, { days = 30, viewport = 'all' } = {}) => (await call(`/${encodeURIComponent(id)}/heat?days=${days}&viewport=${encodeURIComponent(viewport)}`)).heat;

/**
 * Best-effort heat samples from the public page; a failed send is dropped.
 * @param {string} pageId @param {{ session: string, events: any[], contactId?: string | null }} sample
 */
export async function recordPageHeat(pageId, { session, events, contactId = null }) {
  try {
    await call(`/${encodeURIComponent(pageId)}/heat`, { method: 'POST', body: { session, events, contactId }, keepalive: true });
  } catch {
    // tracking never breaks the page
  }
}
