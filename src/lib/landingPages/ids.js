/**
 * Ids, link builders and event names shared by the browser and the server routes.
 */
const SLUG_ALPHABET = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const PAGE_ID_RE = /^[A-Za-z0-9_-]{8,32}$/;
export const CONTACT_ID_RE = /^[A-Za-z0-9_-]{6,40}$/;
export const PAGE_EVENT_KINDS = Object.freeze(['view', 'play', 'progress_25', 'progress_50', 'progress_75', 'complete', 'cta_click', 'lead', 'like']);

export function makeSlug(length = 10, rand = (n) => globalThis.crypto.getRandomValues(new Uint8Array(n))) {
  const bytes = rand(length);
  return Array.from(bytes, (b) => SLUG_ALPHABET[b % SLUG_ALPHABET.length]).join('');
}
export const makeContactId = () => makeSlug(12);

export const pageUrl = (id, origin = globalThis.location?.origin || '') => `${origin}/p/${encodeURIComponent(id)}`;
export const personalUrl = (id, contactId, origin) => `${pageUrl(id, origin)}?c=${encodeURIComponent(contactId)}`;

export function embedCode(id, origin) {
  const src = `${pageUrl(id, origin)}?embed=1`;
  return `<iframe src="${src}" width="960" height="540" style="border:0;max-width:100%;aspect-ratio:16/9;height:auto" allow="autoplay; fullscreen" allowfullscreen title="Video"></iframe>`;
}
