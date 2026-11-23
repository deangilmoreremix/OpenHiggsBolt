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

import { BridgeError } from '../packages/studio-mcp-core/src/bridge.js';

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
const MAX_BODY_CHARS = 1_000_000; // JSON requests are prompts and URLs; files go through /upload by URL

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
 * What kind of thing a request does. Decided here from the route and the body, never from anything the caller says about itself.
 * Unknown studio actions default to 'write'; add an entry when a studio gains something that deletes or publishes.
 */
export function classifyRequest(route, method, input = {}) {
  if (route === '/balance' || route.startsWith('/result/') || route === '/estimate' || route.startsWith('/bridge/sessions') || route.startsWith('/bridge/result')) return { risk: 'read', label: route.split('/')[1] };
  if (route === '/generate' || route === '/upload') return { risk: 'write', label: route.slice(1) };
  const studio = /^\/studio\/([a-z0-9-]{1,40})$/.exec(route)?.[1];
  if (studio === 'design-agent') {
    const r = String(input?.route || '');
    return { risk: String(input?.method || 'GET').toUpperCase() === 'GET' ? 'read' : 'write', label: `design-agent ${r}` };
  }
  if (studio === 'go-ai-viral') return { risk: 'read', label: 'go-ai-viral' };
  if (route === '/raw') {
    const m = String(input?.method || 'GET').toUpperCase();
    return { risk: m === 'DELETE' ? 'destructive' : m === 'GET' ? 'read' : 'write', label: `raw ${m}` };
  }
  if (studio) return { risk: 'write', label: studio };
  // A tab tool's risk is the one the TAB registered for it (looked up by the handler before this is used); nothing in the body can lower it.
  if (route === '/bridge/call') return { risk: 'write', label: `bridge ${String(input?.tool || '').slice(0, 40)}` };
  return { risk: 'write', label: route.slice(1, 40) };
}

/**
 * deps.resolve(rawKey) -> principal { userId, keys: { muapi, openai } } | null   (MCP key lookup; supplied by the route)
 * deps.authorize(principal) -> boolean                                          (plan/entitlement check; fail closed)
 * deps.studios: { name: (body, principal) => { statusCode, body } }
 *
 * @param {{ resolve?: (raw: string) => Promise<any>, authorize?: (principal: any) => Promise<boolean>, studios?: Record<string, (body: any, principal: any) => Promise<{ statusCode?: number, body?: string }>>, env?: Record<string, string | undefined>, bridge?: any, governor?: { check: (a: any) => Promise<any>, record: (a: any) => Promise<void> } | null }} [deps]
 */
export function createHandler({ resolve, authorize = async (_principal) => true, studios = {}, env = process.env, governor = null, bridge = null } = {}) {
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

  const route = String(event.path || '').split('?')[0].replace(/^.*\/(?:api\/mcp-gateway|mcp-gateway)/, '').replace(/\/+$/, '') || '/';
  const method = event.httpMethod;
  let input = {};
  if (method === 'POST') {
    if (String(event.body || '').length > MAX_BODY_CHARS) return fail(413, 'Request body is too large.');
    try { input = event.body ? JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString() : event.body) : {}; }
    catch { return fail(400, 'Request body must be JSON.'); }
  }

  // Safeguards: confirm for destructive/publish, a daily cap, and an audit row for every call.
  const cls = classifyRequest(route, method, input);
  if (route === '/bridge/call' && bridge) {
    try { cls.risk = (await bridge.toolRisk(who.userId, input?.session, input?.tool)) || 'write'; } catch { cls.risk = 'write'; }
  }
  if (governor) {
    const gate = await governor.check({ keyId: who.id, risk: cls.risk, confirm: input?.confirm === true, label: cls.label });
    if (!gate.ok) return json(gate.status, { error: { message: gate.message, code: gate.code } });
  } else if ((cls.risk === 'destructive' || cls.risk === 'publish') && input?.confirm !== true) {
    return json(409, { error: { message: `This would ${cls.risk === 'publish' ? 'publish or send' : 'delete or overwrite'} something. Nothing was done. Call again with confirm: true.`, code: 'confirm_required' } });
  }
  const started = Date.now();
  const run = async () => {
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
      let verb = 'GET';
      // Some deployments only accept POST for status; fall back once.
      if (res.status === 404 || res.status === 405) { ({ res, data } = await upstream(path, { method: 'POST', body: {}, key })); verb = 'POST'; }
      if (!res.ok && !data?.detail?.status) return upstreamError(res, data);
      const out = json(200, data?.detail?.status ? { status: data.detail.status, error: data.detail.error } : data);
      out.headers['X-Poll-Method'] = res.ok ? verb : `${verb} (failed)`; // lets the smoke run settle which verb the upstream status route accepts
      return out;
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

    if (route.startsWith('/bridge/')) {
      if (!bridge) return fail(503, 'Tab control is not configured on this server.');
      if (who.userId === 'byok') return fail(401, 'This needs a signed-in SmartVideo GO MCP key.');
      try {
        if (route === '/bridge/sessions' && method === 'GET') return json(200, { sessions: await bridge.sessions(who.userId) });
        if (route === '/bridge/call' && method === 'POST') {
          const asked = Number(input.wait_ms);
          const waitMs = Math.min(Math.max(Number.isFinite(asked) ? asked : 20_000, 0), 25_000); // 0 means "do not wait"
          const out = await bridge.call(who.userId, { session: input.session, tool: input.tool, args: input.args, waitMs });
          return json(200, JSON.parse(brandText(JSON.stringify(out))));
        }
        const res = /^\/bridge\/result\/([A-Za-z0-9-]{8,64})$/.exec(route);
        if (res && method === 'GET') {
          const q = new URL(String(event.path || '/'), 'https://x.invalid').searchParams.get('wait') ?? event.queryStringParameters?.wait;
          const wait = Math.min(Math.max(Number(q) || 0, 0), 25_000);
          return json(200, JSON.parse(brandText(JSON.stringify(await bridge.waitFor(who.userId, res[1], wait)))));
        }
      } catch (err) {
        if (err instanceof BridgeError) return json(err.status, { error: { message: brandText(err.message), code: err.code } });
        throw err;
      }
      return fail(404, 'Unknown route.');
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
  const out = await run();
  if (governor) await governor.record({ keyId: who.id, userId: who.userId, tool: cls.label, risk: cls.risk, ok: (out?.statusCode || 200) < 400, ms: Date.now() - started });
  return out;
  };
}

