'use strict';

/**
 * Netlify-runtime entitlement guard.
 *
 * The Netlify functions in this directory run OUTSIDE the Next.js runtime, so
 * they cannot import `@/access/apiRequireEntitlement`. This module replicates
 * its exact semantics for the Netlify/Deno-style lambda runtime:
 *
 *   1. Verify the Clerk session token (JWT, RS256) against the Clerk JWKS
 *      (issuer resolved from env — see resolveIssuer below).
 *   2. Resolve the user's entitlement from Supabase `user_entitlements`
 *      using the same service-role pattern the functions already use and the
 *      same logic as `resolveSmartVideoAccessForUser` in
 *      src/access/resolveAccess.ts.
 *   3. Allow only when `hasSmartVideoGo` — i.e. entitlements.smartvideo_go OR
 *      entitlements.founders, with an active (or unset) status. Founders keep
 *      passing, exactly like the Next.js guard.
 *
 * Failure shapes (mirroring requireApiEntitlement + entitlementForbiddenResponse):
 *   401 -> { error: 'AUTH_REQUIRED' }
 *   403 -> { error: 'PAYMENT_REQUIRED', upgradeRequired: true }
 *
 * The guard FAILS CLOSED: a missing token, an unverifiable token, or a missing
 * issuer configuration all result in 401, never a bypass.
 */

const crypto = require('node:crypto');

const JWKS_PATH = '/.well-known/jwks.json';
const JWKS_TTL_MS = 10 * 60 * 1000;

// issuer -> { keys: Map<kid, jwk>, fetchedAt }
const jwksCache = new Map();

function base64UrlDecodeToString(input) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return Buffer.from(padded, 'base64').toString('utf8');
}

/**
 * Resolve the Clerk Frontend API issuer used to fetch the JWKS.
 * Order: explicit CLERK_ISSUER_URL / CLERK_JWT_ISSUER env, else derive it from
 * the publishable key (the pk_* suffix decodes to "<frontend-api-domain>$").
 */
function resolveIssuer(env = process.env) {
  const explicit = env.CLERK_ISSUER_URL || env.CLERK_JWT_ISSUER;
  if (explicit && explicit.trim()) {
    return explicit.trim().replace(/\/+$/, '');
  }

  const publishableKey = env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || env.CLERK_PUBLISHABLE_KEY;
  if (publishableKey) {
    const suffix = publishableKey.replace(/^pk_(test|live)_/, '');
    try {
      const decoded = base64UrlDecodeToString(suffix);
      const domain = decoded.split('$')[0];
      if (domain) return `https://${domain}`;
    } catch {
      // fall through to null (fail closed)
    }
  }

  return null;
}

/**
 * Extract the Clerk session token from the lambda event: `Authorization: Bearer
 * <token>` first, then the `__session` cookie.
 */
function extractSessionToken(event) {
  const headers = (event && event.headers) || {};

  const authorization = headers.authorization || headers.Authorization || '';
  if (typeof authorization === 'string' && authorization.startsWith('Bearer ')) {
    const token = authorization.slice(7).trim();
    if (token) return token;
  }

  const cookieHeader = headers.cookie || headers.Cookie || '';
  if (typeof cookieHeader === 'string' && cookieHeader) {
    for (const part of cookieHeader.split(';')) {
      const separator = part.indexOf('=');
      if (separator === -1) continue;
      const name = part.slice(0, separator).trim();
      if (name === '__session') {
        const value = part.slice(separator + 1).trim();
        if (value) return value;
      }
    }
  }

  return null;
}

async function loadJwks(issuer, fetchImpl, force = false) {
  const cached = jwksCache.get(issuer);
  if (!force && cached && Date.now() - cached.fetchedAt < JWKS_TTL_MS) {
    return cached.keys;
  }

  const res = await fetchImpl(`${issuer}${JWKS_PATH}`);
  if (!res || !res.ok) {
    throw new Error(`Clerk JWKS fetch failed (${res ? res.status : 'no response'})`);
  }
  const body = await res.json();
  const keys = new Map();
  for (const jwk of (body && body.keys) || []) {
    if (jwk && jwk.kty === 'RSA' && jwk.kid) {
      keys.set(jwk.kid, jwk);
    }
  }
  jwksCache.set(issuer, { keys, fetchedAt: Date.now() });
  return keys;
}

function jwkToPublicKey(jwk) {
  return crypto.createPublicKey({ key: { kty: 'RSA', n: jwk.n, e: jwk.e }, format: 'jwk' });
}

function decodeJwtPart(part) {
  return JSON.parse(base64UrlDecodeToString(part));
}

/**
 * Verify a Clerk session token against the Clerk JWKS (RS256) and basic
 * temporal claims. Returns { userId } on success, null on any failure.
 */
async function verifyClerkSessionToken(token, options = {}) {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, signatureB64] = parts;

  let header;
  try {
    header = decodeJwtPart(headerB64);
  } catch {
    return null;
  }
  if (!header || header.alg !== 'RS256' || !header.kid) return null;

  const env = options.env || process.env;
  const issuer = options.issuer || resolveIssuer(env);
  if (!issuer) return null; // fail closed on misconfiguration

  const fetchImpl = options.fetchImpl || fetch;

  let jwk;
  try {
    let keys = await loadJwks(issuer, fetchImpl);
    if (!keys.has(header.kid)) {
      // Key may have rotated — refresh once before giving up.
      keys = await loadJwks(issuer, fetchImpl, true);
    }
    jwk = keys.get(header.kid);
  } catch {
    return null;
  }
  if (!jwk) return null;

  let publicKey;
  try {
    publicKey = jwkToPublicKey(jwk);
  } catch {
    return null;
  }

  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(`${headerB64}.${payloadB64}`);
  verifier.end();

  let signatureValid = false;
  try {
    signatureValid = verifier.verify(publicKey, Buffer.from(signatureB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64'));
  } catch {
    return null;
  }
  if (!signatureValid) return null;

  let payload;
  try {
    payload = decodeJwtPart(payloadB64);
  } catch {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === 'number' && payload.exp <= now) return null;
  if (typeof payload.nbf === 'number' && payload.nbf > now + 60) return null;

  const expectedAzp = options.publishableKey || env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || env.CLERK_PUBLISHABLE_KEY;
  if (expectedAzp && payload.azp && payload.azp !== expectedAzp) return null;

  if (!payload.sub || typeof payload.sub !== 'string') return null;
  return { userId: payload.sub, payload };
}

/**
 * Same entitlement logic as hasSmartVideoGo() in src/access/resolveAccess.ts:
 * active (or unset) status AND (smartvideo_go OR founders).
 */
function hasSmartVideoGo(entitlements, status) {
  const isActive = status === 'active' || status === undefined || status === '';
  const ents = entitlements || {};
  return isActive && (ents.smartvideo_go === true || ents.founders === true);
}

/**
 * Replicates resolveSmartVideoAccessForUser() from src/access/resolveAccess.ts
 * against the Supabase user_entitlements table via the service-role client.
 */
async function resolveHasSmartVideoGo(supabase, userId) {
  const { data } = await supabase
    .from('user_entitlements')
    .select('*')
    .eq('clerk_user_id', userId)
    .maybeSingle();

  if (!data) return false;
  return hasSmartVideoGo(data.entitlements || {}, data.status);
}

function unauthorized() {
  return { ok: false, status: 401, body: { error: 'AUTH_REQUIRED' } };
}

/**
 * Guard for Netlify function handlers.
 *
 * @param {object} event   Netlify function event (headers, cookies).
 * @param {object} options { supabase, fetchImpl, env, issuer, publishableKey }
 * @returns {Promise<{ok: true, userId: string} | {ok: false, status: number, body: object}>}
 */
async function requirePaidEntitlement(event, options = {}) {
  const env = options.env || process.env;
  const fetchImpl = options.fetchImpl || fetch;

  const token = extractSessionToken(event);
  if (!token) return unauthorized();

  const verified = await verifyClerkSessionToken(token, {
    issuer: options.issuer || resolveIssuer(env),
    fetchImpl,
    env,
    publishableKey: options.publishableKey || env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || env.CLERK_PUBLISHABLE_KEY,
  });
  if (!verified) return unauthorized();

  const entitled = await resolveHasSmartVideoGo(options.supabase, verified.userId);
  if (!entitled) {
    return { ok: false, status: 403, body: { error: 'PAYMENT_REQUIRED', upgradeRequired: true } };
  }

  return { ok: true, userId: verified.userId };
}

/**
 * Build the Netlify response for a failed requirePaidEntitlement result.
 */
function entitlementErrorResponse(guardResult, corsHeaders = {}) {
  return {
    statusCode: guardResult.status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
    body: JSON.stringify(guardResult.body),
  };
}

module.exports = {
  requirePaidEntitlement,
  entitlementErrorResponse,
  verifyClerkSessionToken,
  resolveIssuer,
  extractSessionToken,
  hasSmartVideoGo,
};
