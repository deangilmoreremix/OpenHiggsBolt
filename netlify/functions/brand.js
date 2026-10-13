/**
 * Brand Studio single-brand API.
 *
 * SECURITY CONTRACT: this function runs with SUPABASE_SERVICE_ROLE_KEY (RLS
 * bypassed), so every request is gated on a Clerk session token verified
 * against Clerk's JWKS (401 otherwise) and every read/update/delete carries an
 * explicit owner predicate. CORS is locked to an explicit origin allowlist,
 * never `*`. Error bodies never echo internal messages or credentials.
 */

const crypto = require('node:crypto');
const { createClient } = require('@supabase/supabase-js');
const { requirePaidEntitlement, entitlementErrorResponse } = require('./shared/entitlementAuth');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl || '', serviceRole || '');

const JWKS_TTL_MS = 10 * 60 * 1000;
const CLOCK_SKEW_SECONDS = 30;
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
// Only the short-lived session JWT is accepted. `__client_uat` is not a JWT
// and `__clerk_db_jwt` is long-lived, so neither may authenticate a mutation.
const SESSION_COOKIES = ['__session'];
const ASSET_TABLE = 'brand_assets';
const CAMPAIGN_TABLE = 'brand_campaigns';
const BRAND_TABLE = 'brand_dna';
const ALLOWED_METHODS = ['GET', 'PATCH', 'DELETE'];

function toStringArray(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter((x) => typeof x === 'string');
  if (typeof v === 'string') return v.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}

function isValidId(value) {
  return typeof value === 'string' && ID_PATTERN.test(value);
}

function parseJsonBody(event) {
  const raw = event.body;
  if (raw === undefined || raw === null || raw === '') return {};
  if (typeof raw !== 'string') throw new SyntaxError('Body must be a JSON string');
  return JSON.parse(raw);
}

// ---------------------------------------------------------------------------
// Clerk session verification
//
// Inlined so the function bundle is self-contained. `auth()` from
// `@clerk/nextjs/server` cannot be used here: it depends on the Next.js
// request scope, which does not exist inside a Netlify Lambda.
// ---------------------------------------------------------------------------

const subtle = crypto.subtle || crypto.webcrypto.subtle;

let jwksCache = { url: '', keys: [], fetchedAt: 0 };

function b64urlToBuffer(value) {
  const normalized = String(value).replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, 'base64');
}

function b64urlToJson(value) {
  return JSON.parse(b64urlToBuffer(value).toString('utf8'));
}

// Netlify lowercases header names, but be defensive.
function getHeader(event, name) {
  const headers = (event && event.headers) || {};
  const target = name.toLowerCase();
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === target) return headers[key];
  }
  return undefined;
}

function getCookie(event, name) {
  const raw = getHeader(event, 'cookie');
  if (!raw || typeof raw !== 'string') return undefined;
  for (const part of raw.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) {
      return decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return undefined;
}

function sessionTokenFromEvent(event) {
  const authHeader = getHeader(event, 'authorization');
  if (typeof authHeader === 'string') {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match) return match[1].trim();
  }
  for (const cookieName of SESSION_COOKIES) {
    const value = getCookie(event, cookieName);
    if (value) return value;
  }
  return null;
}

// ---------------------------------------------------------------------------
// CORS — locked to an explicit allowlist, never `*`, for private operations
// ---------------------------------------------------------------------------

function normalizeOrigin(value) {
  return String(value || '').trim().replace(/\/+$/, '');
}

function allowedOrigins() {
  const explicit = String(process.env.BRAND_STUDIO_ALLOWED_ORIGINS || '')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);
  const inferred = [
    'BRAND_STUDIO_ORIGIN',
    'URL',
    'DEPLOY_PRIME_URL',
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_SITE_URL',
  ]
    .map((name) => process.env[name])
    .filter(Boolean)
    .map(normalizeOrigin)
    .filter(Boolean);
  return new Set([...explicit, ...inferred]);
}

function corsHeadersFor(event) {
  const origin = normalizeOrigin(getHeader(event, 'origin'));
  if (!origin || !allowedOrigins().has(origin)) {
    // Omit ACAO entirely: a browser caller that is not on the allowlist gets
    // its response blocked rather than being invited to read it.
    return {};
  }
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    Vary: 'Origin',
  };
}

function jsonResponse(statusCode, payload, cors) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...cors,
    },
    body: JSON.stringify(payload),
  };
}

// ---------------------------------------------------------------------------
// Clerk JWKS
// ---------------------------------------------------------------------------

function clerkFrontendApiHost() {
  const direct =
    process.env.CLERK_FRONTEND_API ||
    process.env.NEXT_PUBLIC_CLERK_FRONTEND_API ||
    process.env.__CLERK_FRONTEND_API;
  if (direct) {
    return String(direct).replace(/^https?:\/\//, '').replace(/\/+$/, '');
  }
  // Fall back to decoding the publishable key: pk_(live|test)_<base64url host>$
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
  const match = publishableKey.match(/^pk_(?:live|test)_(.+)$/);
  if (!match) return '';
  let decoded;
  try {
    decoded = b64urlToBuffer(match[1]).toString('utf8');
  } catch {
    return '';
  }
  return decoded.replace(/\$$/, '').trim().replace(/\/+$/, '');
}

function jwksUrl() {
  const host = clerkFrontendApiHost();
  if (!host) return '';
  return `https://${host}/.well-known/jwks.json`;
}

async function getJwks() {
  const url = jwksUrl();
  if (!url) {
    throw new Error('Clerk is not configured (no CLERK_FRONTEND_API / NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)');
  }
  const now = Date.now();
  if (jwksCache.url === url && jwksCache.keys.length > 0 && now - jwksCache.fetchedAt < JWKS_TTL_MS) {
    return jwksCache.keys;
  }
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(`Clerk JWKS fetch failed (${res.status})`);
  }
  const body = await res.json();
  const keys = Array.isArray(body && body.keys) ? body.keys : [];
  jwksCache = { url, keys, fetchedAt: now };
  return keys;
}

async function importVerificationKey(jwk) {
  return subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
}

/**
 * Verify a Clerk session token (JWS, RS256) and return the Clerk user id.
 * Returns null for anything that is not a valid, unexpired session token —
 * unknown `kid`, bad signature, wrong algorithm, expired, or no `sub`.
 */
async function verifyClerkSessionToken(token) {
  if (typeof token !== 'string' || !token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  let header;
  let payload;
  try {
    header = b64urlToJson(parts[0]);
    payload = b64urlToJson(parts[1]);
  } catch {
    return null;
  }
  if (!header || typeof header !== 'object') return null;
  if (!payload || typeof payload !== 'object') return null;
  if (header.alg !== 'RS256') return null;

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== 'number' || payload.exp + CLOCK_SKEW_SECONDS <= now) return null;
  if (typeof payload.nbf === 'number' && payload.nbf - CLOCK_SKEW_SECONDS > now) return null;
  if (!payload.sub || typeof payload.sub !== 'string') return null;

  const keys = await getJwks();
  if (keys.length === 0) return null;

  const candidates = header.kid
    ? keys.filter((key) => key && key.kid === header.kid)
    : keys.filter((key) => !key || !key.kid);
  if (candidates.length === 0) return null;

  const signingInput = Buffer.from(`${parts[0]}.${parts[1]}`, 'utf8');
  const signature = b64urlToBuffer(parts[2]);

  for (const jwk of candidates) {
    try {
      const key = await importVerificationKey(jwk);
      const valid = await subtle.verify('RSASSA-PKCS1-v1_5', key, signature, signingInput);
      if (valid) {
        return { userId: payload.sub, payload };
      }
    } catch {
      // Try the next candidate key.
    }
  }
  return null;
}

async function resolveBrandStudioUser(event) {
  const token = sessionTokenFromEvent(event);
  if (!token) return { userId: null, reason: 'missing_token' };
  try {
    const verified = await verifyClerkSessionToken(token);
    if (!verified) return { userId: null, reason: 'invalid_token' };
    return { userId: verified.userId, reason: null };
  } catch (err) {
    console.error('[brand-studio auth] session verification failed:', err && err.message);
    return { userId: null, reason: 'verification_error' };
  }
}

/** Gate a handler on Clerk auth. Fail-closed: any failure is a 401. */
async function requireBrandStudioUser(event) {
  const { userId } = await resolveBrandStudioUser(event);
  if (!userId) return { response: jsonResponse(401, { error: 'Unauthorized' }, corsHeadersFor(event)) };
  return { userId };
}

// ---------------------------------------------------------------------------
// Ownership helpers for the service-role client
// ---------------------------------------------------------------------------

/**
 * PostgREST reports a filter on a missing column with 42703 / PGRST204. That
 * is the "the owner column has not been migrated in yet" case, which must be
 * distinguished from an operational failure so it can fail closed.
 */
function isOwnershipSchemaError(error) {
  if (!error) return false;
  if (String(error.code || '') === '42703') return true;
  if (String(error.code || '') === 'PGRST204') return true;
  const message = String(error.message || error.details || '');
  return /does not exist/i.test(message) && /clerk_user_id/i.test(message);
}

async function getOwnedRow(table, id, userId) {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .eq('clerk_user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

async function callerOwnsCampaign(userId, campaignId) {
  const { data, error } = await supabase
    .from(CAMPAIGN_TABLE)
    .select('id')
    .eq('id', campaignId)
    .eq('clerk_user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

/**
 * Claim a freshly created, still-unowned row for the authenticated caller.
 * `is('clerk_user_id', null)` makes the claim fail-safe: a row that already
 * has an owner can never be re-claimed.
 */
async function claimUnownedRowForUser(table, id, userId) {
  if (!id) return null;
  const { data, error } = await supabase
    .from(table)
    .update({ clerk_user_id: userId })
    .eq('id', id)
    .is('clerk_user_id', null)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

module.exports = { handler: async (event) => {
  const cors = corsHeadersFor(event);

  if (event.httpMethod === 'OPTIONS') {
    if (!cors['Access-Control-Allow-Origin']) {
      return jsonResponse(403, { error: 'Origin not allowed' }, cors);
    }
    return {
      statusCode: 204,
      headers: {
        ...cors,
        'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '600',
      },
      body: '',
    };
  }

  // Gate on Clerk before touching Supabase.
  const session = await requireBrandStudioUser(event);
  if (session.response) return session.response;
  const userId = session.userId;

  try {
    const method = event.httpMethod;

    if (!ALLOWED_METHODS.includes(method)) {
      return {
        statusCode: 405,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          Allow: ALLOWED_METHODS.concat('OPTIONS').join(', '),
          ...cors,
        },
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }

    const id = event.queryStringParameters?.id;
    if (!id) return jsonResponse(400, { error: 'id is required' }, cors);
    if (!isValidId(id)) return jsonResponse(400, { error: 'Invalid brand id' }, cors);

    // The service-role key bypasses RLS, so the owner filter must be explicit.
    // 404 (not 403) for a non-owned row so existence never leaks.
    if (method === 'GET') {
      const brand = await getOwnedRow(BRAND_TABLE, id, userId);
      if (!brand) return jsonResponse(404, { error: 'Brand not found' }, cors);
      return jsonResponse(200, brand, cors);
    }

    if (!(await getOwnedRow(BRAND_TABLE, id, userId))) {
      return jsonResponse(404, { error: 'Brand not found' }, cors);
    }

    if (method === 'DELETE') {
      // Entitlement guard (mirrors requireApiEntitlement): 401 AUTH_REQUIRED /
      // 403 PAYMENT_REQUIRED before any DB write.
      const guard = await requirePaidEntitlement(event, { supabase });
      if (!guard.ok) return entitlementErrorResponse(guard, cors);

      const { error } = await supabase
        .from(BRAND_TABLE)
        .delete()
        .eq('id', id)
        .eq('clerk_user_id', userId);
      if (error) throw error;
      return jsonResponse(200, { ok: true }, cors);
    }

    const patch = parseJsonBody(event);
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
      return jsonResponse(400, { error: 'Invalid request body' }, cors);
    }
    const allowedFields = [
      'brand_name', 'industry', 'tagline', 'value_proposition',
      'tone_of_voice', 'brand_personality', 'target_audience',
      'key_messages', 'primary_colors', 'secondary_colors',
      'fonts', 'logo_url', 'screenshot_url', 'imagery_style',
      'layout_style', 'raw_json',
    ];
    const whitelisted = {};
    for (const key of allowedFields) {
      if (patch[key] !== undefined) whitelisted[key] = patch[key];
    }

    // Entitlement guard (mirrors requireApiEntitlement): 401 AUTH_REQUIRED /
    // 403 PAYMENT_REQUIRED before any DB write.
    const patchGuard = await requirePaidEntitlement(event, { supabase });
    if (!patchGuard.ok) return entitlementErrorResponse(patchGuard, cors);
    if (whitelisted.tone_of_voice !== undefined) whitelisted.tone_of_voice = toStringArray(whitelisted.tone_of_voice).join(', ');
    if (whitelisted.brand_personality !== undefined) whitelisted.brand_personality = toStringArray(whitelisted.brand_personality).join(', ');
    if (whitelisted.key_messages !== undefined) whitelisted.key_messages = toStringArray(whitelisted.key_messages).join(', ');
    if (whitelisted.primary_colors !== undefined) whitelisted.primary_colors = toStringArray(whitelisted.primary_colors).join(', ');
    if (whitelisted.secondary_colors !== undefined) whitelisted.secondary_colors = toStringArray(whitelisted.secondary_colors).join(', ');
    if (whitelisted.fonts !== undefined) whitelisted.fonts = toStringArray(whitelisted.fonts).join(', ');
    if (Object.keys(whitelisted).length === 0) {
      return jsonResponse(400, { error: 'No updatable fields supplied' }, cors);
    }
    whitelisted.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from(BRAND_TABLE)
      .update(whitelisted)
      .eq('id', id)
      .eq('clerk_user_id', userId)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) return jsonResponse(404, { error: 'Brand not found' }, cors);
    return jsonResponse(200, data, cors);

  } catch (err) {
    if (isOwnershipSchemaError(err)) {
      // Fail closed: without an owner column we cannot prove ownership, and
      // serving unscoped service-role rows would be the original bug.
      console.error('brand ownership column missing:', err && err.message);
      return jsonResponse(503, { error: 'OWNERSHIP_NOT_CONFIGURED' }, cors);
    }
    if (err instanceof SyntaxError) {
      return jsonResponse(400, { error: 'Invalid JSON body' }, cors);
    }
    if (err && err.statusCode === 413) {
      return jsonResponse(413, { error: 'Payload too large' }, cors);
    }
    console.error('brand request failed:', err && err.message);
    return jsonResponse(500, { error: 'Internal error' }, cors);
  }
}};
