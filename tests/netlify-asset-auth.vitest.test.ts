/**
 * Auth + tenant-isolation tests for netlify/functions/assets.js.
 *
 * Addresses: the Brand Studio asset endpoint ran with
 * SUPABASE_SERVICE_ROLE_KEY (RLS bypassed), had no authentication, and answered
 * `Access-Control-Allow-Origin: *` — so any client could read, mutate and
 * generate-paid assets for any campaign.
 *
 * Hermetic by construction:
 *   - `@supabase/supabase-js` is the real build, but it issues every PostgREST
 *     call through the global `fetch`, which is mocked. No database is touched.
 *     Every outgoing request is recorded, which lets the tests assert both
 *     "Supabase was never contacted" and "the query was scoped to the
 *     authenticated clerk_user_id".
 *   - Clerk verification is real: tokens are signed here with a locally
 *     generated RSA key and the JWKS endpoint is served by the same mocked
 *     `fetch`, so signature / kid / exp / sub checks are genuinely exercised.
 *   - The Supabase Edge Function is reached through the mocked `fetch` too, so
 *     the tests can assert the service-role bearer is never spent anonymously
 *     and that every forwarded call carries the internal service token.
 *   - The `user_entitlements` table is served by the same mocked `fetch` with
 *     PostgREST-faithful single-row semantics, so the purchase entitlement
 *     gate (403 PAYMENT_REQUIRED) is exercised for real, including the
 *     dev-only `__e2e_auth_bypass=1` escape hatch.
 */

import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import nodeCrypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const APP_ORIGIN = 'https://app.test.local';
const OTHER_ORIGIN = 'https://evil.example';
const SUPABASE_URL = 'https://supabase.test.local';
const SERVICE_ROLE = 'test-service-role-key';
const INTERNAL_SECRET = 'internal-service-secret-for-tests';

const USER_A = 'user_aaaa';
const USER_B = 'user_bbbb';
// No `user_entitlements` row: the preview/unpaid case.
const USER_C = 'user_cccc';
// Qualifying flag, non-qualifying lifecycle status.
const USER_D = 'user_dddd';
// Qualifying status, no qualifying entitlement flag.
const USER_E = 'user_eeee';
// Legacy row with no status column populated at all.
const USER_F = 'user_ffff';
const TEST_KID = 'assets-test-signing-key';

const BRAND_A = 'brand-a0000000-0000-4000-8000-000000000000';
const BRAND_B = 'brand-b0000000-0000-4000-8000-000000000000';
const CAMP_A = 'camp-a0000000-0000-4000-8000-000000000000';
const CAMP_B = 'camp-b0000000-0000-4000-8000-000000000000';
const ASSET_A = 'asset-a00000-0000-4000-8000-000000000000';
const ASSET_B = 'asset-b00000-0000-4000-8000-000000000000';
const ASSET_NEW = 'asset-c00000-0000-4000-8000-000000000000';
const CAMP_NEW = 'camp-c0000000-0000-4000-8000-000000000000';
const BRAND_NEW = 'brand-c0000000-0000-4000-8000-000000000000';
const SHOOT_NEW = 'shoot-c000000-0000-4000-8000-000000000000';

type Row = Record<string, any>;
type CapturedFetch = { url: string; method: string; auth: string | null; internalToken: string | null; body: unknown };

const mock = vi.hoisted(() => {
  const rows: Record<string, Row[]> = {};
  const missingOwnerColumn = { value: false };
  const failSelect = { value: false };
  return { rows, missingOwnerColumn, failSelect };
});

// ---------------------------------------------------------------------------
// token helpers (RS256 signed with a locally generated key)
// ---------------------------------------------------------------------------

let privateKey: nodeCrypto.KeyObject;
let publicJwk: Record<string, unknown>;

function b64url(value: string | Buffer): string {
  return Buffer.from(value as any).toString('base64url');
}

function signSessionToken(userId: string, overrides: Record<string, unknown> = {}): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT', kid: TEST_KID };
  const payload = {
    sub: userId,
    sid: 'sess_test',
    azp: APP_ORIGIN,
    iat: now,
    nbf: now,
    exp: now + 60,
    ...overrides,
  };
  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const signature = nodeCrypto.sign('RSA-SHA256', Buffer.from(signingInput), privateKey);
  return `${signingInput}.${signature.toString('base64url')}`;
}

function signWithWrongKey(userId: string): string {
  const other = nodeCrypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT', kid: TEST_KID };
  const payload = { sub: userId, sid: 's', iat: now, nbf: now, exp: now + 60 };
  const input = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const signature = nodeCrypto.sign('RSA-SHA256', Buffer.from(input), other.privateKey);
  return `${input}.${signature.toString('base64url')}`;
}

// ---------------------------------------------------------------------------
// fake network: Clerk JWKS, Supabase PostgREST, Supabase Edge Functions
// ---------------------------------------------------------------------------

const fetchCalls: CapturedFetch[] = [];
const originalFetch = globalThis.fetch;

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'ERROR',
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

function parseFilters(url: URL) {
  const filters: { col: string; op: 'eq' | 'is'; value: any }[] = [];
  for (const [key, value] of url.searchParams.entries()) {
    if (['select', 'order', 'limit', 'offset'].includes(key)) continue;
    if (value === 'is.null') {
      filters.push({ col: key, op: 'is', value: null });
    } else if (value.startsWith('eq.')) {
      filters.push({ col: key, op: 'eq', value: value.slice(3) });
    }
  }
  return filters;
}

function matches(row: Row, filters: { col: string; op: 'eq' | 'is'; value: any }[]) {
  return filters.every((f) =>
    f.op === 'is' ? row[f.col] === null : String(row[f.col]) === String(f.value)
  );
}

function handleRest(url: string, method: string, body: unknown, headers: Headers): Response {
  const parsed = new URL(url);
  const table = parsed.pathname.split('/rest/v1/')[1];
  if (!table) return jsonResponse({ error: 'unknown table' }, 400);

  const filters = parseFilters(parsed);
  const tableRows: Row[] = (mock.rows[table] = mock.rows[table] || []);
  // `.single()` asks PostgREST for a single object instead of a list.
  const objectMode = (headers.get('accept') || '').includes('application/vnd.pgrst.object+json');
  const asObject = (rows: Row[]) => {
    if (rows.length !== 1) {
      // Mirror PostgREST's object-mode 406 (PGRST116) exactly: supabase-js
      // `maybeSingle()` only clears the error when details mention "0 rows".
      const details = rows.length === 0
        ? 'The result contains 0 rows'
        : `Results contain ${rows.length} rows, application/vnd.pgrst.object+json requires 1 row`;
      return jsonResponse(
        { code: 'PGRST116', details, message: 'JSON object requested, multiple (or no) rows returned' },
        406,
      );
    }
    return jsonResponse(rows[0]);
  };

  const touchesOwner =
    filters.some((f) => f.col === 'clerk_user_id') ||
    (body && typeof body === 'object'
      ? Object.prototype.hasOwnProperty.call(body, 'clerk_user_id')
      : false);
  if (mock.missingOwnerColumn.value && touchesOwner) {
    return jsonResponse(
      { code: '42703', message: `column ${table}.clerk_user_id does not exist` },
      400
    );
  }

  if (method === 'GET') {
    if (mock.failSelect.value) {
      return jsonResponse({ code: '57014', message: 'internal postgres detail' }, 500);
    }
    let result = tableRows.filter((row) => matches(row, filters));
    const order = parsed.searchParams.get('order');
    if (order) {
      const [col, dir] = order.split('.');
      const descending = dir === 'desc';
      result = [...result].sort((a, b) =>
        a[col] === b[col] ? 0 : (a[col] > b[col] ? 1 : -1) * (descending ? -1 : 1)
      );
    }
    return objectMode ? asObject(result) : jsonResponse(result);
  }

  if (method === 'PATCH') {
    const patch = (body || {}) as Record<string, unknown>;
    const matched = tableRows.filter((row) => matches(row, filters));
    matched.forEach((row) => Object.assign(row, patch));
    return objectMode ? asObject(matched) : jsonResponse(matched);
  }

  if (method === 'DELETE') {
    mock.rows[table] = tableRows.filter((row) => !matches(row, filters));
    return jsonResponse([]);
  }

  return jsonResponse([]);
}

function installFetchStub() {
  fetchCalls.length = 0;
  const fetchMock = vi.fn(async (input: any, init: any = {}) => {
    const url = typeof input === 'string' ? input : String(input?.url ?? input);
    const method = String(init?.method || 'GET').toUpperCase();
    const headers = new Headers(init?.headers || {});
    let body: unknown = undefined;
    if (typeof init?.body === 'string') {
      try {
        body = JSON.parse(init.body);
      } catch {
        body = init.body;
      }
    }
    fetchCalls.push({
      url,
      method,
      auth: headers.get('authorization'),
      internalToken: headers.get('x-internal-service-token'),
      body,
    });

    if (url.includes('/.well-known/jwks.json')) {
      return jsonResponse({ keys: [{ ...publicJwk, kid: TEST_KID, alg: 'RS256', use: 'sig' }] });
    }

    if (url.includes('/rest/v1/')) {
      return handleRest(url, method, body, headers);
    }

    if (url.includes('/functions/v1/')) {
      const fn = url.split('/functions/v1/')[1];
      if (fn === 'brand-analyze') {
        const created = { id: BRAND_NEW, url: CAMP_B, brand_name: 'New', clerk_user_id: null };
        mock.rows.brand_dna.push(created);
        return jsonResponse(created);
      }
      if (fn === 'campaign-generate') {
        const created = { id: CAMP_NEW, brand_id: BRAND_A, goal: 'awareness', clerk_user_id: null };
        mock.rows.brand_campaigns.push(created);
        return jsonResponse(created);
      }
      if (fn === 'photo-studio') {
        const created = { id: SHOOT_NEW, brand_id: BRAND_A, style: 'studio', clerk_user_id: null };
        mock.rows.brand_photoshoots.push(created);
        return jsonResponse(created);
      }
      if (fn === 'asset-generate') {
        const created = {
          id: ASSET_NEW,
          campaign_id: CAMP_A,
          brand_id: BRAND_A,
          platform: 'instagram_feed',
          clerk_user_id: null,
        };
        mock.rows.brand_assets.push(created);
        return jsonResponse(created);
      }
      return jsonResponse({ error: 'unknown function' }, 500);
    }

    return jsonResponse({ error: 'unexpected url' }, 500);
  });
  globalThis.fetch = fetchMock as unknown as typeof fetch;
}

function restCalls(): CapturedFetch[] {
  return fetchCalls.filter((c) => c.url.includes('/rest/v1/'));
}

function edgeCalls(): CapturedFetch[] {
  return fetchCalls.filter((c) => c.url.includes('/functions/v1/'));
}

async function loadFunction(file: string) {
  const mod: any = await import(
    fileURLToPath(new URL(`../netlify/functions/${file}.js`, import.meta.url))
  );
  return mod.handler || mod.default?.handler;
}

async function loadAssets() {
  const mod: any = await import(
    fileURLToPath(new URL('../netlify/functions/assets.js', import.meta.url))
  );
  return mod.handler || mod.default?.handler;
}

function makeEvent(options: {
  method?: string;
  query?: Record<string, string>;
  body?: unknown;
  rawBody?: string;
  token?: string | null;
  cookieToken?: string;
  bypassCookie?: string;
  origin?: string | null;
} = {}) {
  const { method = 'GET', query = {}, body, rawBody, token, cookieToken, bypassCookie, origin } = options;
  const headers: Record<string, string> = {};
  if (token) headers.authorization = `Bearer ${token}`;
  if (cookieToken) headers.cookie = `__session=${encodeURIComponent(cookieToken)}`;
  // The dev-only e2e escape hatch the Netlify functions honor in parallel to
  // middleware.js. Kept in its own cookie header: the bypass flow has no Clerk
  // session cookie at all. Pass the exact cookie value ('1' to bypass).
  if (bypassCookie !== undefined) headers.cookie = `__e2e_auth_bypass=${bypassCookie}`;
  if (origin !== null) headers.origin = origin === undefined ? APP_ORIGIN : origin;
  return {
    httpMethod: method,
    headers,
    queryStringParameters: Object.keys(query).length ? query : undefined,
    body: rawBody !== undefined ? rawBody : body === undefined ? undefined : JSON.stringify(body),
  } as any;
}

async function call(handler: any, event: any) {
  const res = await handler(event);
  return {
    status: res.statusCode as number,
    body: JSON.parse(res.body || '{}'),
    headers: res.headers as Record<string, string>,
  };
}

function resetRows() {
  mock.rows.brand_assets = [
    { id: ASSET_A, campaign_id: CAMP_A, brand_id: BRAND_A, clerk_user_id: USER_A, headline: 'A' },
    { id: ASSET_B, campaign_id: CAMP_B, brand_id: BRAND_B, clerk_user_id: USER_B, headline: 'B' },
  ];
  mock.rows.brand_campaigns = [
    { id: CAMP_A, brand_id: BRAND_A, goal: 'awareness', clerk_user_id: USER_A },
    { id: CAMP_B, brand_id: BRAND_B, goal: 'conversion', clerk_user_id: USER_B },
  ];
  mock.rows.brand_dna = [
    { id: BRAND_A, url: 'https://a.example', brand_name: 'Brand A', clerk_user_id: USER_A },
    { id: BRAND_B, url: 'https://b.example', brand_name: 'Brand B', clerk_user_id: USER_B },
  ];
  mock.rows.brand_photoshoots = [
    { id: 'shoot-a', brand_id: BRAND_A, style: 'studio', clerk_user_id: USER_A },
    { id: 'shoot-b', brand_id: BRAND_B, style: 'studio', clerk_user_id: USER_B },
  ];
  // Qualifying purchases for the two owners, one per entitlement path the gate
  // accepts. USER_C deliberately has no row (preview → 403 PAYMENT_REQUIRED).
  mock.rows.user_entitlements = [
    { clerk_user_id: USER_A, email: 'a@example.test', status: 'active', entitlements: { smartvideo_go: true } },
    { clerk_user_id: USER_B, email: 'b@example.test', status: 'lifetime', entitlements: { founders: true } },
  ];
}

// ---------------------------------------------------------------------------

beforeAll(() => {
  const pair = nodeCrypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  privateKey = pair.privateKey;
  publicJwk = pair.publicKey.export({ format: 'jwk' }) as Record<string, unknown>;
});

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL;
  process.env.SUPABASE_SERVICE_ROLE_KEY = SERVICE_ROLE;
  process.env.INTERNAL_FUNCTION_SECRET = INTERNAL_SECRET;
  process.env.CLERK_FRONTEND_API = 'https://clerk.test.local';
  process.env.BRAND_STUDIO_ALLOWED_ORIGINS = APP_ORIGIN;
  mock.missingOwnerColumn.value = false;
  mock.failSelect.value = false;
  resetRows();
  installFetchStub();
  vi.resetModules();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

// ===========================================================================
// (a) unauthenticated -> 401
// ===========================================================================

describe('assets.js: unauthenticated requests are rejected with 401', () => {
  it('rejects an anonymous GET by id without touching Supabase', async () => {
    const handler = await loadAssets();
    const res = await call(handler, makeEvent({ query: { id: ASSET_A }, token: null }));
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthorized' });
    expect(restCalls()).toHaveLength(0);
  });

  it('rejects an anonymous GET by campaign_id', async () => {
    const handler = await loadAssets();
    const res = await call(handler, makeEvent({ query: { campaign_id: CAMP_A }, token: null }));
    expect(res.status).toBe(401);
    expect(restCalls()).toHaveLength(0);
  });

  it('rejects an anonymous PATCH', async () => {
    const handler = await loadAssets();
    const res = await call(
      handler,
      makeEvent({ method: 'PATCH', query: { id: ASSET_A }, body: { headline: 'pwned' }, token: null })
    );
    expect(res.status).toBe(401);
    expect(restCalls()).toHaveLength(0);
    expect(mock.rows.brand_assets[0].headline).toBe('A');
  });

  it('rejects an anonymous POST before the service-role bearer is spent', async () => {
    const handler = await loadAssets();
    const res = await call(
      handler,
      makeEvent({ method: 'POST', body: { campaign_id: CAMP_A, platform: 'instagram_feed' }, token: null })
    );
    expect(res.status).toBe(401);
    expect(restCalls()).toHaveLength(0);
    expect(edgeCalls()).toHaveLength(0);
  });

  it('rejects a garbage bearer token', async () => {
    const handler = await loadAssets();
    const res = await call(handler, makeEvent({ query: { id: ASSET_A }, token: 'not-a-jwt' }));
    expect(res.status).toBe(401);
    expect(restCalls()).toHaveLength(0);
  });

  it('rejects an expired session token', async () => {
    const handler = await loadAssets();
    const stale = signSessionToken(USER_A, { exp: Math.floor(Date.now() / 1000) - 3600 });
    const res = await call(handler, makeEvent({ query: { id: ASSET_A }, token: stale }));
    expect(res.status).toBe(401);
    expect(restCalls()).toHaveLength(0);
  });

  it('rejects a token signed with the wrong key', async () => {
    const handler = await loadAssets();
    const res = await call(
      handler,
      makeEvent({ query: { id: ASSET_A }, token: signWithWrongKey(USER_A) })
    );
    expect(res.status).toBe(401);
    expect(restCalls()).toHaveLength(0);
  });

  it('rejects a token with no subject', async () => {
    const handler = await loadAssets();
    const noSubject = signSessionToken('', { sub: undefined });
    const res = await call(handler, makeEvent({ query: { id: ASSET_A }, token: noSubject }));
    expect(res.status).toBe(401);
    expect(restCalls()).toHaveLength(0);
  });

  it('ignores a non-JWT session cookie (for example Clerk’s __client_uat)', async () => {
    const handler = await loadAssets();
    const res = await call(handler, makeEvent({ query: { id: ASSET_A }, token: null, cookieToken: '1700000000' }));
    expect(res.status).toBe(401);
    expect(restCalls()).toHaveLength(0);
  });

  it('rejects an alg=none style token', async () => {
    const handler = await loadAssets();
    const noneToken = 'eyJhbGciOiJub25lIn0.eyJzdWIiOiJ1c2VyX2FhYWEifQ.';
    const res = await call(handler, makeEvent({ query: { id: ASSET_A }, token: noneToken }));
    expect(res.status).toBe(401);
    expect(restCalls()).toHaveLength(0);
  });
});

// ===========================================================================
// (b) cross-user access -> 404, existence never leaks
// ===========================================================================

describe('assets.js: cross-user reads are denied', () => {
  it("returns 404 when user B asks for user A's asset by id", async () => {
    const handler = await loadAssets();
    const res = await call(handler, makeEvent({ query: { id: ASSET_A }, token: signSessionToken(USER_B) }));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Asset not found' });
    // The entitlement lookup now precedes the ownership query; assert the
    // ownership query itself.
    const assetCall = restCalls().find((c) => c.url.includes('/rest/v1/brand_assets'))!;
    expect(assetCall.url).toContain(`clerk_user_id=eq.${USER_B}`);
    expect(assetCall.url).toContain(`id=eq.${ASSET_A}`);
  });

  it("returns 404 when user B asks for the assets of user A's campaign", async () => {
    const handler = await loadAssets();
    const res = await call(
      handler,
      makeEvent({ query: { campaign_id: CAMP_A }, token: signSessionToken(USER_B) })
    );
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Campaign not found' });
    const campaignCall = restCalls().find((c) => c.url.includes('/rest/v1/brand_campaigns'))!;
    expect(campaignCall.url).toContain(`clerk_user_id=eq.${USER_B}`);
  });

  it('never returns another user’s rows in a campaign listing', async () => {
    const handler = await loadAssets();
    mock.rows.brand_assets.push({ id: 'asset-orphan', campaign_id: CAMP_A, clerk_user_id: null });
    const res = await call(handler, makeEvent({ query: { campaign_id: CAMP_B }, token: signSessionToken(USER_B) }));
    expect(res.status).toBe(200);
    expect(res.body.map((a: any) => a.id)).toEqual([ASSET_B]);
    expect(restCalls().every((c) => !c.url.includes(`campaign_id=eq.${CAMP_A}`))).toBe(true);
  });
});

// ===========================================================================
// (c) unauthorized modification -> 404
// ===========================================================================

describe('assets.js: unauthorized mutations are denied', () => {
  it("refuses to PATCH another user's asset and leaves it untouched", async () => {
    const handler = await loadAssets();
    const res = await call(
      handler,
      makeEvent({
        method: 'PATCH',
        query: { id: ASSET_A },
        token: signSessionToken(USER_B),
        body: { headline: 'pwned' },
      })
    );
    expect(res.status).toBe(404);
    expect(restCalls().some((c) => c.method === 'PATCH')).toBe(false);
    expect(mock.rows.brand_assets.find((r) => r.id === ASSET_A)!.headline).toBe('A');
  });

  it('refuses to generate an asset for a campaign the caller does not own', async () => {
    const handler = await loadAssets();
    const res = await call(
      handler,
      makeEvent({
        method: 'POST',
        token: signSessionToken(USER_B),
        body: { campaign_id: CAMP_A, platform: 'instagram_feed' },
      })
    );
    expect(res.status).toBe(404);
    expect(edgeCalls()).toHaveLength(0);
  });

  it('ignores a client-supplied clerk_user_id in a PATCH body', async () => {
    const handler = await loadAssets();
    const res = await call(
      handler,
      makeEvent({
        method: 'PATCH',
        query: { id: ASSET_A },
        token: signSessionToken(USER_A),
        body: { headline: 'Legit', clerk_user_id: USER_B, id: ASSET_B },
      })
    );
    expect(res.status).toBe(200);
    const [patchCall] = restCalls().filter((c) => c.method === 'PATCH');
    expect(JSON.stringify(patchCall.body)).not.toContain('clerk_user_id');
    expect(JSON.stringify(patchCall.body)).not.toContain('"id"');
    expect(mock.rows.brand_assets.find((r) => r.id === ASSET_A)!.clerk_user_id).toBe(USER_A);
  });

  it('rejects an unknown HTTP method with 405', async () => {
    const handler = await loadAssets();
    const res = await call(handler, makeEvent({ method: 'DELETE', token: signSessionToken(USER_A) }));
    expect(res.status).toBe(405);
    expect(restCalls()).toHaveLength(0);
  });

  it('rejects a malformed asset id with 400', async () => {
    const handler = await loadAssets();
    const res = await call(handler, makeEvent({ query: { id: "x' or 1=1 --" }, token: signSessionToken(USER_A) }));
    expect(res.status).toBe(400);
    // Only the entitlement lookup ran; the invalid id never reached a query.
    expect(restCalls()).toHaveLength(1);
    expect(restCalls()[0].url).toContain('/rest/v1/user_entitlements');
  });

  it('rejects a POST body without a campaign_id', async () => {
    const handler = await loadAssets();
    const res = await call(handler, makeEvent({ method: 'POST', token: signSessionToken(USER_A), body: {} }));
    expect(res.status).toBe(400);
    expect(edgeCalls()).toHaveLength(0);
  });

  it('rejects a POST for a campaign the caller does not own without calling the Edge Function', async () => {
    const handler = await loadAssets();
    const res = await call(
      handler,
      makeEvent({
        method: 'POST',
        token: signSessionToken(USER_A),
        body: { campaign_id: CAMP_B, platform: 'instagram_feed' },
      })
    );
    expect(res.status).toBe(404);
    expect(edgeCalls()).toHaveLength(0);
  });

  it('rejects a malformed JSON body with 400', async () => {
    const handler = await loadAssets();
    const res = await call(
      handler,
      makeEvent({
        method: 'PATCH',
        query: { id: ASSET_A },
        token: signSessionToken(USER_A),
        rawBody: '{ not json',
      })
    );
    expect(res.status).toBe(400);
    expect(mock.rows.brand_assets.find((r) => r.id === ASSET_A)!.headline).toBe('A');
  });

  it('rejects an oversized body with 413', async () => {
    const handler = await loadAssets();
    const res = await call(
      handler,
      makeEvent({
        method: 'POST',
        token: signSessionToken(USER_A),
        rawBody: JSON.stringify({
          campaign_id: CAMP_A,
          platform: 'instagram_feed',
          pad: 'x'.repeat(300000),
        }),
      })
    );
    expect(res.status).toBe(413);
    expect(edgeCalls()).toHaveLength(0);
  });

  it('rejects a PATCH body with no updatable fields', async () => {
    const handler = await loadAssets();
    const res = await call(
      handler,
      makeEvent({ method: 'PATCH', query: { id: ASSET_A }, token: signSessionToken(USER_A), body: { nope: 1 } })
    );
    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// (d) legitimate owner operations keep working
// ===========================================================================

describe('assets.js: the legitimate owner keeps working', () => {
  it('returns the asset to its owner', async () => {
    const handler = await loadAssets();
    const res = await call(handler, makeEvent({ query: { id: ASSET_A }, token: signSessionToken(USER_A) }));
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(ASSET_A);
    expect(res.body.headline).toBe('A');
  });

  it('lists the assets of the owner’s campaign, scoped to the owner', async () => {
    const handler = await loadAssets();
    const res = await call(
      handler,
      makeEvent({ query: { campaign_id: CAMP_A }, token: signSessionToken(USER_A) })
    );
    expect(res.status).toBe(200);
    expect(res.body.map((a: any) => a.id)).toEqual([ASSET_A]);
    const listCall = restCalls().find((c) => c.method === 'GET' && c.url.includes(`campaign_id=eq.${CAMP_A}`));
    expect(listCall!.url).toContain(`clerk_user_id=eq.${USER_A}`);
  });

  it('lets the owner update their own asset', async () => {
    const handler = await loadAssets();
    const res = await call(
      handler,
      makeEvent({
        method: 'PATCH',
        query: { id: ASSET_A },
        token: signSessionToken(USER_A),
        body: { headline: 'Updated', body: 'New body', cta: 'Buy', canvas_data: { position: 'top-left' } },
      })
    );
    expect(res.status).toBe(200);
    expect(res.body.headline).toBe('Updated');
    expect(mock.rows.brand_assets.find((r) => r.id === ASSET_A)!.headline).toBe('Updated');
  });

  it('accepts the session cookie as well as the Authorization header', async () => {
    const handler = await loadAssets();
    const res = await call(
      handler,
      makeEvent({ query: { id: ASSET_A }, token: null, cookieToken: signSessionToken(USER_A) })
    );
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(ASSET_A);
  });

  it('generates an asset for the owner, forwards the bearer, and claims the row', async () => {
    const handler = await loadAssets();
    const res = await call(
      handler,
      makeEvent({
        method: 'POST',
        token: signSessionToken(USER_A),
        body: { campaign_id: CAMP_A, platform: 'instagram_feed', concept_index: 0 },
      })
    );
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(ASSET_NEW);

    const forwarded = edgeCalls()[0];
    expect(forwarded.url).toContain('/functions/v1/asset-generate');
    expect(forwarded.method).toBe('POST');
    expect(forwarded.auth).toBe(`Bearer ${SERVICE_ROLE}`);
    expect(forwarded.internalToken).toBe(INTERNAL_SECRET);
    expect(forwarded.body).toEqual({ campaign_id: CAMP_A, platform: 'instagram_feed', concept_index: 0 });

    const claimed = mock.rows.brand_assets.find((r) => r.id === ASSET_NEW);
    expect(claimed!.clerk_user_id).toBe(USER_A);
  });
});

// ===========================================================================
// CORS, response hygiene and fail-closed behaviour
// ===========================================================================

describe('assets.js: CORS and response hygiene', () => {
  it('never sends a wildcard Access-Control-Allow-Origin', async () => {
    const handler = await loadAssets();
    for (const method of ['GET', 'POST', 'PATCH']) {
      const res = await call(
        handler,
        makeEvent({
          method,
          query: { id: ASSET_A },
          token: signSessionToken(USER_A),
          body: { campaign_id: CAMP_A, platform: 'instagram_feed' },
        })
      );
      expect(res.headers['Access-Control-Allow-Origin']).not.toBe('*');
    }
  });

  it('echoes an allowlisted origin and withholds ACAO for any other origin', async () => {
    const handler = await loadAssets();
    const allowed = await call(handler, makeEvent({ query: { id: ASSET_A }, token: signSessionToken(USER_A) }));
    expect(allowed.status).toBe(200);
    expect(allowed.headers['Access-Control-Allow-Origin']).toBe(APP_ORIGIN);

    const denied = await call(
      handler,
      makeEvent({ query: { id: ASSET_A }, token: signSessionToken(USER_A), origin: OTHER_ORIGIN })
    );
    expect(denied.headers['Access-Control-Allow-Origin']).toBeUndefined();
    expect(denied.body.id).toBe(ASSET_A);
  });

  it('omits ACAO for a same-origin request without an Origin header', async () => {
    const handler = await loadAssets();
    const res = await call(
      handler,
      makeEvent({ query: { id: ASSET_A }, token: signSessionToken(USER_A), origin: null })
    );
    expect(res.status).toBe(200);
    expect(res.headers['Access-Control-Allow-Origin']).toBeUndefined();
    expect(res.headers['Cache-Control']).toBe('no-store');
  });

  it('answers an OPTIONS preflight for an allowlisted origin', async () => {
    const handler = await loadAssets();
    const res = await call(handler, makeEvent({ method: 'OPTIONS' }));
    expect(res.status).toBe(204);
    expect(res.headers['Access-Control-Allow-Origin']).toBe(APP_ORIGIN);
    expect(res.headers['Access-Control-Allow-Methods']).toContain('PATCH');
  });

  it('refuses an OPTIONS preflight from an unknown origin', async () => {
    const handler = await loadAssets();
    const res = await call(handler, makeEvent({ method: 'OPTIONS', origin: OTHER_ORIGIN }));
    expect(res.status).toBe(403);
    expect(res.headers['Access-Control-Allow-Origin']).toBeUndefined();
  });

  it('does not leak the service-role key or internal error text', async () => {
    mock.failSelect.value = true;
    const handler = await loadAssets();
    const res = await call(
      handler,
      makeEvent({ query: { campaign_id: CAMP_A }, token: signSessionToken(USER_A) })
    );
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Internal error' });
    expect(JSON.stringify(res.body)).not.toContain(SERVICE_ROLE);
    expect(JSON.stringify(res.body)).not.toContain('internal postgres detail');
  });

  it('fails closed when the schema has no owner column', async () => {
    mock.missingOwnerColumn.value = true;
    const handler = await loadAssets();
    const res = await call(handler, makeEvent({ query: { id: ASSET_A }, token: signSessionToken(USER_A) }));
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ error: 'OWNERSHIP_NOT_CONFIGURED' });
    expect(JSON.stringify(res.body)).not.toContain(USER_A);
  });
});

// ===========================================================================
// sibling Brand Studio functions (the same finding, same port)
// ===========================================================================

describe('brands.js / brand.js / campaigns.js / photo-studio.js: the same auth gate', () => {
  it('brands.js: rejects an anonymous GET with 401 and never touches Supabase', async () => {
    const handler = await loadFunction('brands');
    const res = await call(handler, makeEvent({ token: null }));
    expect(res.status).toBe(401);
    expect(restCalls()).toHaveLength(0);
  });

  it('brands.js: scopes the list query to the authenticated clerk_user_id', async () => {
    const handler = await loadFunction('brands');
    const res = await call(handler, makeEvent({ token: signSessionToken(USER_A) }));
    expect(res.status).toBe(200);
    expect(res.body.map((b: any) => b.id)).toEqual([BRAND_A]);
    const listCall = restCalls().find((c) => c.url.includes('/rest/v1/brand_dna'))!;
    expect(listCall.url).toContain(`clerk_user_id=eq.${USER_A}`);
    expect(res.headers['Access-Control-Allow-Origin']).not.toBe('*');
  });

  it('brands.js: blocks an anonymous brand-analyze POST', async () => {
    const handler = await loadFunction('brands');
    const res = await call(handler, makeEvent({ method: 'POST', body: { url: 'https://x.example' }, token: null }));
    expect(res.status).toBe(401);
    expect(edgeCalls()).toHaveLength(0);
  });

  it('brands.js: forwards an authenticated POST and claims the new row', async () => {
    const handler = await loadFunction('brands');
    const res = await call(
      handler,
      makeEvent({ method: 'POST', token: signSessionToken(USER_A), body: { url: 'https://x.example' } })
    );
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(BRAND_NEW);
    expect(edgeCalls()[0].auth).toBe(`Bearer ${SERVICE_ROLE}`);
    expect(edgeCalls()[0].internalToken).toBe(INTERNAL_SECRET);
    expect(mock.rows.brand_dna.find((r) => r.id === BRAND_NEW)!.clerk_user_id).toBe(USER_A);
  });

  it('brand.js: rejects anonymous GET/PATCH/DELETE with 401', async () => {
    const handler = await loadFunction('brand');
    for (const method of ['GET', 'PATCH', 'DELETE']) {
      const res = await call(
        handler,
        makeEvent({ method, query: { id: BRAND_A }, body: { brand_name: 'pwned' }, token: null })
      );
      expect(res.status).toBe(401);
      expect(restCalls()).toHaveLength(0);
    }
  });

  it("brand.js: returns 404 for another user's brand and 200 for the owner", async () => {
    const handler = await loadFunction('brand');
    const denied = await call(handler, makeEvent({ query: { id: BRAND_A }, token: signSessionToken(USER_B) }));
    expect(denied.status).toBe(404);
    expect(denied.body).toEqual({ error: 'Brand not found' });

    const owned = await call(handler, makeEvent({ query: { id: BRAND_A }, token: signSessionToken(USER_A) }));
    expect(owned.status).toBe(200);
    expect(owned.body.id).toBe(BRAND_A);
  });

  it("brand.js: refuses to PATCH or DELETE another user's brand", async () => {
    const handler = await loadFunction('brand');
    const patched = await call(
      handler,
      makeEvent({ method: 'PATCH', query: { id: BRAND_A }, token: signSessionToken(USER_B), body: { brand_name: 'pwned' } })
    );
    expect(patched.status).toBe(404);
    expect(mock.rows.brand_dna.find((r) => r.id === BRAND_A)!.brand_name).toBe('Brand A');

    const deleted = await call(handler, makeEvent({ method: 'DELETE', query: { id: BRAND_A }, token: signSessionToken(USER_B) }));
    expect(deleted.status).toBe(404);
    expect(mock.rows.brand_dna.some((r) => r.id === BRAND_A)).toBe(true);
  });

  it('campaigns.js: rejects an anonymous GET with 401', async () => {
    const handler = await loadFunction('campaigns');
    const res = await call(handler, makeEvent({ token: null }));
    expect(res.status).toBe(401);
    expect(restCalls()).toHaveLength(0);
  });

  it('campaigns.js: lists only the owner’s campaigns, scoped by clerk_user_id', async () => {
    const handler = await loadFunction('campaigns');
    const res = await call(handler, makeEvent({ token: signSessionToken(USER_B) }));
    expect(res.status).toBe(200);
    expect(res.body.map((c: any) => c.id)).toEqual([CAMP_B]);
    const listCall = restCalls().find((c) => c.url.includes('/rest/v1/brand_campaigns'))!;
    expect(listCall.url).toContain(`clerk_user_id=eq.${USER_B}`);
  });

  it("campaigns.js: returns 404 when user B asks for the campaigns of user A's brand", async () => {
    const handler = await loadFunction('campaigns');
    const res = await call(handler, makeEvent({ query: { brand_id: BRAND_A }, token: signSessionToken(USER_B) }));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Brand not found' });
  });

  it('campaigns.js: refuses to generate a campaign for a brand the caller does not own', async () => {
    const handler = await loadFunction('campaigns');
    const res = await call(
      handler,
      makeEvent({ method: 'POST', token: signSessionToken(USER_B), body: { brand_id: BRAND_A, goal: 'awareness' } })
    );
    expect(res.status).toBe(404);
    expect(edgeCalls()).toHaveLength(0);
  });

  it('campaigns.js: generates a campaign for the owner and claims it', async () => {
    const handler = await loadFunction('campaigns');
    const res = await call(
      handler,
      makeEvent({ method: 'POST', token: signSessionToken(USER_A), body: { brand_id: BRAND_A, goal: 'awareness' } })
    );
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(CAMP_NEW);
    expect(mock.rows.brand_campaigns.find((r) => r.id === CAMP_NEW)!.clerk_user_id).toBe(USER_A);
  });

  it('photo-studio.js: rejects an anonymous GET with 401', async () => {
    const handler = await loadFunction('photo-studio');
    const res = await call(handler, makeEvent({ token: null }));
    expect(res.status).toBe(401);
    expect(restCalls()).toHaveLength(0);
  });

  it('photo-studio.js: lists only the owner’s shoots', async () => {
    const handler = await loadFunction('photo-studio');
    const res = await call(handler, makeEvent({ token: signSessionToken(USER_B) }));
    expect(res.status).toBe(200);
    expect(res.body.map((s: any) => s.id)).toEqual(['shoot-b']);
    const listCall = restCalls().find((c) => c.url.includes('/rest/v1/brand_photoshoots'))!;
    expect(listCall.url).toContain(`clerk_user_id=eq.${USER_B}`);
  });

  it('photo-studio.js: refuses to generate a shoot for a brand the caller does not own', async () => {
    const handler = await loadFunction('photo-studio');
    const res = await call(
      handler,
      makeEvent({
        method: 'POST',
        token: signSessionToken(USER_B),
        body: { brand_id: BRAND_A, category: 'bottle', style: 'studio' },
      })
    );
    expect(res.status).toBe(404);
    expect(edgeCalls()).toHaveLength(0);
  });

  it('photo-studio.js: generates a shoot for the owner and claims it', async () => {
    const handler = await loadFunction('photo-studio');
    const res = await call(
      handler,
      makeEvent({
        method: 'POST',
        token: signSessionToken(USER_A),
        body: { brand_id: BRAND_A, category: 'bottle', style: 'studio' },
      })
    );
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(SHOOT_NEW);
    expect(mock.rows.brand_photoshoots.find((r) => r.id === SHOOT_NEW)!.clerk_user_id).toBe(USER_A);
    expect(edgeCalls()[0].internalToken).toBe(INTERNAL_SECRET);
  });
});

// ===========================================================================
// purchase entitlement gate — the same 403 the Next.js API returns
// ===========================================================================

describe('brand studio functions: purchase entitlement gate', () => {
  it('assets.js: 403 PAYMENT_REQUIRED for an authenticated caller with no entitlement row', async () => {
    const handler = await loadAssets();
    const res = await call(handler, makeEvent({ query: { id: ASSET_A }, token: signSessionToken(USER_C) }));
    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      error: 'PAYMENT_REQUIRED',
      entitlement: 'smartvideo_go',
      upgradeRequired: true,
    });
    // The entitlement lookup is the only query: no row is read or written.
    expect(restCalls().every((c) => c.url.includes('/rest/v1/user_entitlements'))).toBe(true);
    expect(edgeCalls()).toHaveLength(0);
  });

  it('assets.js: 403 for generation without an entitlement row, before the edge call', async () => {
    const handler = await loadAssets();
    const res = await call(
      handler,
      makeEvent({ method: 'POST', token: signSessionToken(USER_C), body: { campaign_id: CAMP_A, platform: 'instagram_feed' } })
    );
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('PAYMENT_REQUIRED');
    expect(edgeCalls()).toHaveLength(0);
  });

  it('assets.js: 403 for a qualifying flag with a non-qualifying status', async () => {
    mock.rows.user_entitlements.push({ clerk_user_id: USER_D, status: 'revoked', entitlements: { smartvideo_go: true } });
    const handler = await loadAssets();
    const res = await call(handler, makeEvent({ query: { id: ASSET_A }, token: signSessionToken(USER_D) }));
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('PAYMENT_REQUIRED');
  });

  it('assets.js: 403 for a qualifying status without a qualifying flag', async () => {
    mock.rows.user_entitlements.push({ clerk_user_id: USER_E, status: 'active', entitlements: { smartvideo_ai: true } });
    const handler = await loadAssets();
    const res = await call(handler, makeEvent({ query: { id: ASSET_A }, token: signSessionToken(USER_E) }));
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('PAYMENT_REQUIRED');
  });

  it('a legacy row with no status still qualifies', async () => {
    // Rows predating the status column are tolerated as 'active' (mirrors
    // src/access/entitlements.ts isQualifyingStatus).
    mock.rows.user_entitlements.push({ clerk_user_id: USER_F, status: undefined, entitlements: { smartvideo_go: true } });
    const handler = await loadFunction('brands');
    const res = await call(handler, makeEvent({ token: signSessionToken(USER_F) }));
    expect(res.status).toBe(200); // the entitlement gate passed; the list is scoped to USER_F
    expect(res.body).toEqual([]);
  });

  it('brands.js / campaigns.js / photo-studio.js: the gate covers reads and mutations alike', async () => {
    const readExpected = [
      { file: 'brands', event: makeEvent({ token: signSessionToken(USER_C) }) },
      { file: 'campaigns', event: makeEvent({ token: signSessionToken(USER_C) }) },
      { file: 'photo-studio', event: makeEvent({ token: signSessionToken(USER_C) }) },
    ];
    for (const { file, event } of readExpected) {
      const handler = await loadFunction(file);
      const res = await call(handler, event);
      expect(res.status, `${file} GET`).toBe(403);
      expect(res.body.error).toBe('PAYMENT_REQUIRED');
      expect(edgeCalls()).toHaveLength(0);
    }

    const mutationExpected = [
      { file: 'brands', event: makeEvent({ method: 'POST', token: signSessionToken(USER_C), body: { url: 'https://x.example' } }) },
      { file: 'campaigns', event: makeEvent({ method: 'POST', token: signSessionToken(USER_C), body: { brand_id: BRAND_A, goal: 'awareness' } }) },
      { file: 'photo-studio', event: makeEvent({ method: 'POST', token: signSessionToken(USER_C), body: { brand_id: BRAND_A, category: 'bottle', style: 'studio' } }) },
    ];
    for (const { file, event } of mutationExpected) {
      const handler = await loadFunction(file);
      const res = await call(handler, event);
      expect(res.status, `${file} POST`).toBe(403);
      expect(res.body.error).toBe('PAYMENT_REQUIRED');
      expect(edgeCalls()).toHaveLength(0);
    }

    const brand = await loadFunction('brand');
    for (const method of ['GET', 'PATCH', 'DELETE']) {
      const res = await call(
        brand,
        makeEvent({ method, query: { id: BRAND_A }, token: signSessionToken(USER_C), body: { brand_name: 'pwned' } })
      );
      expect(res.status, `brand.js ${method}`).toBe(403);
      expect(res.body.error).toBe('PAYMENT_REQUIRED');
    }
  });
});

// ===========================================================================
// dev-only e2e escape hatch — the Netlify twin of middleware.js
// ===========================================================================

describe('brand studio functions: the __e2e_auth_bypass=1 escape hatch', () => {
  it('skips both the Clerk and entitlement gates for an anonymous offline caller', async () => {
    // No Clerk token, no entitlement row — only the bypass cookie the Next.js
    // layer already gates. Vitest runs with NODE_ENV=test, i.e. dev parity.
    const handler = await loadFunction('brands');
    const res = await call(handler, makeEvent({ bypassCookie: '1' }));
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]); // scoped to the synthetic bypass user
    expect(restCalls()[0].url).toContain('/rest/v1/brand_dna');
    expect(restCalls()[0].url).toContain('clerk_user_id=eq.user_e2e_auth_bypass');
    expect(restCalls().some((c) => c.url.includes('/rest/v1/user_entitlements'))).toBe(false);
    expect(restCalls().some((c) => c.url.includes('/.well-known/jwks.json'))).toBe(false);
  });

  it('does not fire for any other cookie value', async () => {
    const handler = await loadAssets();
    // Value '0' is not the escape hatch: the request falls back to the normal
    // Clerk gate and an anonymous caller still gets 401.
    const res = await call(handler, makeEvent({ query: { id: ASSET_A }, bypassCookie: '0', token: null }));
    expect(res.status).toBe(401);
    expect(restCalls()).toHaveLength(0);
  });
});
