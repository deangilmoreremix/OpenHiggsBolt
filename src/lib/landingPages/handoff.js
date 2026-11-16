/**
 * "Create landing page" from anywhere: queue the video, then open the Video Pages studio, which starts
 * its new-page flow with that video selected. Uses sessionStorage so the studio picks it up once.
 */
const KEY = 'video_pages_queued_video';
export const VIDEO_PAGES_PATH = '/studio/video-pages';
const VIDEO_EXT = /\.(mp4|mov|webm|m4v)(\?|#|$)/i;
const IMAGE_EXT = /\.(png|jpe?g|webp|gif|avif)(\?|#|$)/i;

/** Normalize an asset row / generation-like record into { url, posterUrl, title, source }, or null when it isn't an https video. */
export function normalizeVideo(item, { allowImage = false } = {}) {
  if (!item || typeof item.url !== 'string' || !/^https:\/\//i.test(item.url) || item.url.length > 2048) return null;
  const kind = item.kind || item.type;
  // With allowImage a picture (e.g. a personalized image) can fill the video slot of a page: it is shown as a still.
  const isImage = allowImage && (kind === 'image' || (kind === 'video' && IMAGE_EXT.test(item.url.split(/[?#]/)[0])) || (!kind && IMAGE_EXT.test(item.url.split(/[?#]/)[0])));
  if (!isImage && (kind ? kind !== 'video' : !VIDEO_EXT.test(item.url))) return null;
  const title = String(item.name || item.prompt || '').replace(/\s+/g, ' ').trim().slice(0, 120);
  const poster = typeof item.thumbnail_url === 'string' && /^https:\/\//i.test(item.thumbnail_url) && item.thumbnail_url !== item.url ? item.thumbnail_url : null;
  return { url: item.url, posterUrl: isImage ? null : poster, title: title || (isImage ? 'My picture' : 'My video'), source: { studio: String(item.studio || '').slice(0, 40), kind: isImage ? 'image' : 'video' } };
}

export function queueVideoForPage(item, { storage = globalThis.sessionStorage } = {}) {
  const v = normalizeVideo(item);
  if (!v) return false;
  try { storage.setItem(KEY, JSON.stringify(v)); return true; } catch { return false; }
}

/** Returns the queued video once, then clears it. */
export function takeQueuedVideo({ storage = globalThis.sessionStorage } = {}) {
  try {
    const raw = storage.getItem(KEY);
    storage.removeItem(KEY);
    const v = raw ? JSON.parse(raw) : null;
    return v && normalizeVideo({ ...v, kind: 'video' }) ? v : null;
  } catch {
    return null;
  }
}

/** Queue + open the studio. Returns false (and does nothing) for anything that isn't an https video. */
export function openVideoPageFor(item, { storage, navigate = (path) => { globalThis.location.assign(path); } } = {}) {
  if (!queueVideoForPage(item, storage ? { storage } : undefined)) return false;
  navigate(VIDEO_PAGES_PATH);
  return true;
}
