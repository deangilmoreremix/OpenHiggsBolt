/**
 * Smartvid Downloader gate — host glue for the vendored upstream Smartvid Downloader web app (apps/smartvid).
 *
 * Upstream Smartvid Downloader is single-tenant with no login (it can browse server folders and change its download
 * directory), so every request to /smartvid/* must come from a signed-in, allow-listed user.
 * Allowlist: SMARTVID_ALLOWED_USERS="user_123,admin@example.com" (Clerk user id or email).
 * Unset = everyone in NODE_ENV=development, nobody otherwise. All allowed users share one queue/library.
 */
const HOP = new Set(['connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailer', 'transfer-encoding', 'upgrade', 'host', 'content-length']);

export const isAllowed = (user, env = process.env) => {
  const list = (env.SMARTVID_ALLOWED_USERS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (!list.length) return (env.NODE_ENV || 'development') === 'development';
  return [user?.id, ...(user?.emails || [])].filter(Boolean).some((v) => list.includes(String(v).toLowerCase()));
};

/** Upstream's built JS/CSS/icons are public code; everything else (rpc, events, files, images, pages) is gated. */
export const isPublicAsset = (method, pathname) =>
  method === 'GET' && (/^\/smartvid\/assets\/[\w.\-]+$/.test(pathname) || /^\/smartvid\/(favicon\.ico|app-icon\.png|web-shim\.js)$/.test(pathname));

/** Stream a request to the Smartvid Downloader web server (pages + /rpc + /events SSE + /files + /images). */
export async function proxyToSmartvid(request, target = process.env.SMARTVID_WEB_URL || 'http://127.0.0.1:3300') {
  const url = new URL(request.url);
  const headers = new Headers();
  for (const [k, v] of request.headers) if (!HOP.has(k.toLowerCase()) && !['cookie', 'authorization', 'x-smartvid-gate'].includes(k.toLowerCase())) headers.set(k, v);
  // Shared secret: the web edition answers only requests that carry it (SMARTVID_GATE_TOKEN, the same value on both sides).
  if (process.env.SMARTVID_GATE_TOKEN) headers.set('x-smartvid-gate', process.env.SMARTVID_GATE_TOKEN);
  const hasBody = !['GET', 'HEAD'].includes(request.method);
  try {
    // Next.js strips trailing slashes while upstream redirects /smartvid -> /smartvid/; serve the root directly to avoid a loop.
    const pathname = url.pathname === '/smartvid' ? '/smartvid/' : url.pathname;
    const res = await fetch(new URL(`${pathname}${url.search}`, target), { method: request.method, headers, body: hasBody ? request.body : undefined, duplex: hasBody ? 'half' : undefined, redirect: 'manual', signal: request.signal });
    const out = new Headers();
    for (const [k, v] of res.headers) if (!HOP.has(k.toLowerCase()) && k.toLowerCase() !== 'content-encoding') out.set(k, v);
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers: out });
  } catch {
    return new Response('Smartvid Downloader service is not running.', { status: 502, headers: { 'content-type': 'text/plain' } });
  }
}

export async function handleSmartvid(request, { user, target } = {}) {
  const { pathname } = new URL(request.url);
  if (!isPublicAsset(request.method, pathname)) {
    if (!user?.id) return new Response('Sign in to use Smartvid Downloader.', { status: 401, headers: { 'content-type': 'text/plain' } });
    if (!isAllowed(user)) return new Response('Smartvid Downloader is not enabled for your account. Ask an admin to add you to SMARTVID_ALLOWED_USERS.', { status: 403, headers: { 'content-type': 'text/plain' } });
  }
  return proxyToSmartvid(request, target);
}
