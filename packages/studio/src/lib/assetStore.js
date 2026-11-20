// Client for the shared per-user asset library (/api/assets/library), used by every studio that takes
// images, video or audio. Everything here is best-effort: a signed-out user, a missing storage bucket or
// a network error never blocks an upload or a generation, the library just stays empty.

const LIBRARY_URL = '/api/assets/library';
const MAX_SAVE_BYTES = 100 * 1024 * 1024;
const EVENT = 'studio-asset-library-changed';

const VIDEO_EXT = /\.(mp4|mov|webm|m4v)(\?|#|$)/i;
const AUDIO_EXT = /\.(mp3|wav|m4a|aac|ogg|flac)(\?|#|$)/i;
const IMAGE_EXT = /\.(png|jpe?g|webp|gif|avif)(\?|#|$)/i;

/** 'image' | 'video' | 'audio' from a File's MIME type, or from a URL's extension; null when unknown. */
export function assetKindOf(source) {
  if (!source) return null;
  if (typeof source === 'object' && typeof source.type === 'string') {
    const m = /^(image|video|audio)\//.exec(source.type);
    if (m) return m[1];
  }
  const url = typeof source === 'string' ? source : source.name || '';
  if (VIDEO_EXT.test(url)) return 'video';
  if (AUDIO_EXT.test(url)) return 'audio';
  if (IMAGE_EXT.test(url)) return 'image';
  return null;
}

const canUseNetwork = () => typeof window !== 'undefined' && typeof fetch === 'function' && window.location?.protocol?.startsWith('http');

function announce() {
  try {
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // no window (SSR): nothing to tell
  }
}

/** Call `fn` whenever any studio saves or deletes a library asset. Returns the unsubscribe function. */
export function onLibraryChanged(fn) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(EVENT, fn);
  return () => window.removeEventListener(EVENT, fn);
}

/** The signed-in user's assets, newest first. `kind` narrows to image, video or audio. Never throws. */
export async function listAssets({ kind, limit = 60 } = {}) {
  if (!canUseNetwork()) return [];
  try {
    const qs = new URLSearchParams({ limit: String(limit), ...(kind ? { kind } : {}) });
    const res = await fetch(`${LIBRARY_URL}?${qs}`, { credentials: 'same-origin' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.assets) ? data.assets : [];
  } catch {
    return [];
  }
}

/** Remove an asset from the library (the file itself is left in storage). Returns true on success. */
export async function deleteAsset(id) {
  if (!canUseNetwork() || !id) return false;
  try {
    const res = await fetch(`${LIBRARY_URL}?id=${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'same-origin' });
    if (res.ok) announce();
    return res.ok;
  } catch {
    return false;
  }
}

async function register({ url, kind, name, source, storagePath }) {
  const res = await fetch(LIBRARY_URL, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url, kind, name, source, storagePath }),
  });
  if (!res.ok) return null;
  announce();
  return (await res.json())?.asset ?? null;
}

/**
 * Keep a copy of a file the user just uploaded. MuAPI's upload address expires after about an hour, so the
 * original goes to the user's own storage and that lasting address is what the library lists. Null when the
 * user is signed out, the file is too big, or storage is not available.
 */
export async function saveUploadedFile(file) {
  const kind = assetKindOf(file);
  if (!canUseNetwork() || !file || !kind || !(file.size > 0) || file.size > MAX_SAVE_BYTES) return null;
  try {
    const res = await fetch(`${LIBRARY_URL}/upload`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: file.name, type: file.type, size: file.size }),
    });
    if (!res.ok) return null;
    const { uploadUrl, url, storagePath } = await res.json();
    if (!uploadUrl || !url) return null;
    const put = await fetch(uploadUrl, { method: 'PUT', headers: { 'content-type': file.type }, body: file });
    if (!put.ok) return null;
    return await register({ url, kind, name: file.name, source: 'upload', storagePath });
  } catch {
    return null;
  }
}

/** Add a generated result (an image, video or audio URL) to the library. Null when it can't be saved. */
export async function saveResultUrl(url, name = '') {
  const kind = assetKindOf(url);
  if (!canUseNetwork() || typeof url !== 'string' || !/^https:\/\//.test(url) || !kind) return null;
  try {
    return await register({ url, kind, name, source: 'result' });
  } catch {
    return null;
  }
}
