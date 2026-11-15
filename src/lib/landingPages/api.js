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
export const submitPageLead = ({ pageId, contactId = null, data }) => call(`/${encodeURIComponent(pageId)}/lead`, { method: 'POST', body: { contactId, data } });
