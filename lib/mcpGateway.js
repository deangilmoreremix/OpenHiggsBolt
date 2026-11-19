// lib/mcpGateway.js
// Branded gateway for the SmartVideo GO MCP server (mcp/index.js). Routes (app/api/mcp-gateway/[[...path]]/route.ts):
//   POST /api/mcp-gateway/generate        { endpoint, payload }  -> { request_id | outputs }
//   GET  /api/mcp-gateway/result/{id}                            -> { status, outputs, error }
//   POST /api/mcp-gateway/estimate        { endpoint, payload }  -> { cost }
//   POST /api/mcp-gateway/upload          { source_url }         -> { url }
//   GET  /api/mcp-gateway/balance                                -> { balance }
//   POST /api/mcp-gateway/studio/{name}   { ...body }            -> the studio function's own response
// Auth: `Authorization: Bearer sv_live_…` (a SmartVideo GO MCP key, see mcp-keys.js). The key resolves to a signed-in user and
// to that user's own stored upstream keys; studio routes run the app's own function handlers in-process as that user.
// There is no platform-key fallback. Local development may set MCP_ALLOW_BYOK=1 to pass an upstream key directly as the
// bearer token. The generation backend is never named in a response.

const UPSTREAM = 'https://api.muapi.ai/api/v1';

const API_ROOT = 'https://api.muapi.ai';

// Workflow and agent calls the app makes against the generation backend's root (not /api/v1). Only these shapes pass.
// [method, path pattern]. Path params are restricted to safe characters.
const ID = '[A-Za-z0-9_-]{1,80}';
export const RAW_ALLOWLIST = [
  ['GET', /^\/workflow\/(get-template-workflows|get-workflow-defs|get-published-workflows)$/],
  ['GET', new RegExp(`^/workflow/${ID}/api-inputs$`)],
  ['POST', new RegExp(`^/workflow/${ID}/api-execute$`)],
  ['GET', new RegExp(`^/workflow/run/${ID}/api-outputs$`)],
  ['GET', /^\/agents\/(templates\/agents|user\/agents|featured\/agents|user\/conversations)$/],
  ['GET', new RegExp(`^/agents/by-slug/${ID}$`)],
  ['GET', new RegExp(`^/agents/by-slug/${ID}/${ID}$`)],
  ['POST', new RegExp(`^/agents/by-slug/${ID}/chat$`)],
];
const rawAllowed = (method, path) => typeof path === 'string' && !path.includes('..') && RAW_ALLOWLIST.some(([m, re]) => m === method && re.test(path));

const BRAND = 'SmartVideo GO';
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

const json = (statusCode, body) => ({ statusCode, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(body) });
const fail = (statusCode, message) => json(statusCode, { error: { message } });
const brandText = (s) => String(s ?? '').replace(/mu-?api(?:\.ai|app)?/gi, BRAND);

const header = (h = {}, name) => Object.entries(h).find(([k]) => k.toLowerCase() === name)?.[1];
function bearerToken(headers) {
  const m = /^Bearer\s+(\S+)$/i.exec(String(header(headers, 'authorization') || ''));
  return m ? m[1] : null;
}

// Endpoint names are model slugs: letters, digits, dot, dash, underscore, slash. No traversal, scheme or host.
const SAFE_ENDPOINT = /^\/?[A-Za-z0-9][A-Za-z0-9._\-/]{0,120}$/;
const validEndpoint = (e) => typeof e === 'string' && SAFE_ENDPOINT.test(e) && !e.includes('..') && !e.includes('//');

const PRIVATE_HOST = /^(localhost|.*\.local|.*\.internal|0\.0\.0\.0|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?|\[?f[cd][0-9a-f]{2}:)/i;
function validSourceUrl(raw) {
  try {
    const u = new URL(raw);
    return u.protocol === 'https:' && !u.username && !u.password && !PRIVATE_HOST.test(u.hostname) && u.hostname.includes('.');
  } catch { return false; }
}

async function upstream(path, { method = 'GET', body, key, form } = {}) {
  const res = await fetch(`${UPSTREAM}${path}`, {
    method,
    headers: { 'x-api-key': key, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: form || (body ? JSON.stringify(body) : undefined),
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text.slice(0, 200) }; }
  return { res, data };
}

function upstreamError(res, data) {
  if (res.status === 401 || res.status === 403) return fail(401, 'Your SmartVideo GO API key was rejected, or the account is out of credit. Check it in SmartVideo GO → Settings → API keys.');
  const detail = data?.detail?.error || data?.detail || data?.error?.message || data?.error || data?.message || res.statusText;
  return fail(res.status >= 500 ? 502 : res.status, brandText(typeof detail === 'string' ? detail : JSON.stringify(detail)));
}

/**
 * deps.resolve(rawKey) -> principal { userId, keys: { muapi, openai } } | null   (MCP key lookup; supplied by the route)
 * deps.authorize(principal) -> boolean                                          (plan/entitlement check; fail closed)
 * deps.studios: { name: (body, principal) => { statusCode, body } }
 */
export function createHandler({ resolve, authorize = async () => true, studios = {}, env = process.env } = {}) {
  return async function gateway(event) {
  const token = bearerToken(event.headers);
  let who = null;
  try {
    if (token) {
      if (resolve && /^sv_live_/.test(token)) who = await resolve(token);
      else if (env.MCP_ALLOW_BYOK === '1' && /^[A-Za-z0-9._-]{16,200}$/.test(token)) who = { id: null, userId: 'byok', keys: { muapi: token, openai: null } };
    }
    if (who && !(await authorize(who))) return fail(403, 'Your plan does not include MCP access. Upgrade in SmartVideo GO to use it.');
  } catch (err) {
    console.error('[mcp-gateway] auth failed:', err?.message || 'error');
    return fail(503, `${BRAND} MCP access is temporarily unavailable.`);
  }
  if (!who) return fail(401, 'Missing, invalid or revoked SmartVideo GO MCP key. Create one in the app and send it as "Authorization: Bearer <key>".');
  const key = who.keys.muapi;

  const route = String(event.path || '').replace(/^.*\/(?:api\/mcp-gateway|mcp-gateway)/, '').replace(/\/+$/, '') || '/';
  const method = event.httpMethod;
  let input = {};
  if (method === 'POST') {
    try { input = event.body ? JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString() : event.body) : {}; }
    catch { return fail(400, 'Request body must be JSON.'); }
  }

  try {
    if (route === '/generate' && method === 'POST') {
      if (!validEndpoint(input.endpoint)) return fail(400, 'Invalid endpoint.');
      const { res, data } = await upstream(`/${input.endpoint.replace(/^\//, '')}`, { method: 'POST', body: input.payload || {}, key });
      if (!res.ok) return upstreamError(res, data);
      return json(200, data);
    }

    if (route === '/estimate' && method === 'POST') {
      if (!validEndpoint(input.endpoint)) return fail(400, 'Invalid endpoint.');
      const { res, data } = await upstream(`/models/${input.endpoint.replace(/^\//, '')}/estimate-cost`, { method: 'POST', body: input.payload || {}, key });
      if (!res.ok) return upstreamError(res, data);
      return json(200, data);
    }

    const resultMatch = /^\/result\/([A-Za-z0-9._-]{1,100})$/.exec(route);
    if (resultMatch && method === 'GET') {
      const path = `/predictions/${resultMatch[1]}/result`;
      let { res, data } = await upstream(path, { key });
      // Some deployments only accept POST for status; fall back once.
      if (res.status === 404 || res.status === 405) ({ res, data } = await upstream(path, { method: 'POST', body: {}, key }));
      if (!res.ok && !data?.detail?.status) return upstreamError(res, data);
      return json(200, data?.detail?.status ? { status: data.detail.status, error: data.detail.error } : data);
    }

    if (route === '/balance' && method === 'GET') {
      const { res, data } = await upstream('/account/balance', { key });
      if (!res.ok) return upstreamError(res, data);
      return json(200, data);
    }

    if (route === '/upload' && method === 'POST') {
      // Multipart bodies exceed function limits; re-hosting a public https URL is the supported path.
      if (!validSourceUrl(input.source_url)) return fail(400, 'Provide "source_url": a public https URL. (Direct uploads are not supported through this gateway.)');
      const src = await fetch(input.source_url, { redirect: 'error' });
      if (!src.ok) return fail(400, `Could not fetch source_url (${src.status}).`);
      const len = Number(src.headers.get('content-length') || 0);
      if (len > MAX_UPLOAD_BYTES) return fail(413, 'File is too large (25 MB max).');
      const buf = Buffer.from(await src.arrayBuffer());
      if (buf.length > MAX_UPLOAD_BYTES) return fail(413, 'File is too large (25 MB max).');
      const form = new FormData();
      form.append('file', new Blob([buf], { type: src.headers.get('content-type') || 'application/octet-stream' }), new URL(input.source_url).pathname.split('/').pop() || 'file');
      const { res, data } = await upstream('/upload_file', { method: 'POST', form, key });
      if (!res.ok) return upstreamError(res, data);
      return json(200, { url: data.url || data.file_url || data.data?.url });
    }

    if (route === '/raw' && method === 'POST') {
      const m = String(input.method || 'GET').toUpperCase();
      if (!rawAllowed(m, input.path)) return fail(400, 'That request is not available through MCP.');
      const res = await fetch(`${API_ROOT}${input.path}`, { method: m, headers: { 'x-api-key': key, ...(m === 'POST' ? { 'Content-Type': 'application/json' } : {}) }, body: m === 'POST' ? JSON.stringify(input.body || {}) : undefined });
      const text = await res.text();
      let data; try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text.slice(0, 200) }; }
      if (!res.ok) return upstreamError(res, data);
      return json(200, data);
    }

    const studioMatch = /^\/studio\/([a-z0-9-]{1,40})$/.exec(route);
    if (studioMatch && method === 'POST') {
      const run = Object.hasOwn(studios, studioMatch[1]) ? studios[studioMatch[1]] : null;
      if (!run) return fail(404, 'Unknown studio.');
      const out = await run(input, who);
      // The studios' own messages may name the generation provider; scrub the body before it leaves.
      return { statusCode: out.statusCode || 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: brandText(out.body ?? '{}') };
    }

    return fail(404, 'Unknown route.');
  } catch (err) {
    return fail(502, `${BRAND} gateway error: ${brandText(err?.message)}`);
  }
  };
}

