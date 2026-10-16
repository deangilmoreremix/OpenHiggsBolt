import { describe, it, expect, vi } from 'vitest'
import crypto from 'node:crypto'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const {
  requirePaidEntitlement,
  entitlementErrorResponse,
  verifyClerkSessionToken,
  resolveIssuer,
  extractSessionToken,
  hasSmartVideoGo,
} = require('../../netlify/functions/shared/entitlementAuth');

const ISSUER = 'https://clerk.go.smartvid.app';
const PUBLISHABLE_KEY = 'pk_test_entitlement-check';

const { publicKey: publicJwk, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'jwk' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
}) as { publicKey: any; privateKey: string };

const JWK = { ...publicJwk, kid: 'test-kid', alg: 'RS256', use: 'sig' };

const altKeyPair = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' },
});

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url');
}

function makeToken(payload: Record<string, unknown>, options: { kid?: string; signWith?: string } = {}): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: options.kid || 'test-kid' }));
  const body = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${header}.${body}`;
  const signature = crypto.sign('RSA-SHA256', Buffer.from(signingInput), options.signWith || privateKey);
  return `${signingInput}.${signature.toString('base64url')}`;
}

function validPayload(overrides: Record<string, unknown> = {}) {
  const now = Math.floor(Date.now() / 1000);
  return {
    azp: PUBLISHABLE_KEY,
    sub: 'user_123',
    iat: now,
    nbf: now - 10,
    exp: now + 60,
    ...overrides,
  };
}

function jwksFetch() {
  return vi.fn(async () => ({
    ok: true,
    status: 200,
    async json() {
      return { keys: [JWK] };
    },
  }));
}

function fakeSupabase(row: Record<string, unknown> | null) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: row, error: null }),
        }),
      }),
    }),
  };
}

describe('resolveIssuer', () => {
  it('prefers explicit CLERK_ISSUER_URL env', () => {
    expect(resolveIssuer({ CLERK_ISSUER_URL: 'https://explicit.example.com/' })).toBe('https://explicit.example.com');
  });

  it('derives the issuer from the publishable key', () => {
    const pk = `pk_test_${Buffer.from('clerk.go.smartvid.app$').toString('base64url')}`;
    expect(resolveIssuer({ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: pk })).toBe(ISSUER);
  });

  it('returns null when unconfigured (guard fails closed)', () => {
    expect(resolveIssuer({})).toBeNull();
  });
});

describe('extractSessionToken', () => {
  it('reads the Authorization bearer token', () => {
    expect(extractSessionToken({ headers: { authorization: 'Bearer tok_123' } })).toBe('tok_123');
  });

  it('reads the __session cookie', () => {
    expect(extractSessionToken({ headers: { cookie: 'other=1; __session=tok_cookie' } })).toBe('tok_cookie');
  });

  it('returns null when no token is present', () => {
    expect(extractSessionToken({ headers: {} })).toBeNull();
    expect(extractSessionToken({})).toBeNull();
  });
});

describe('verifyClerkSessionToken', () => {
  const opts = { issuer: ISSUER, fetchImpl: jwksFetch(), publishableKey: PUBLISHABLE_KEY };

  it('returns the userId for a valid Clerk session token', async () => {
    const token = makeToken(validPayload());
    const result = await verifyClerkSessionToken(token, opts);
    expect(result).not.toBeNull();
    expect(result?.userId).toBe('user_123');
  });

  it('rejects an expired token', async () => {
    const token = makeToken(validPayload({ exp: Math.floor(Date.now() / 1000) - 30 }));
    expect(await verifyClerkSessionToken(token, opts)).toBeNull();
  });

  it('rejects a token signed with an unknown key', async () => {
    const token = makeToken(validPayload(), { signWith: altKeyPair.privateKey as string });
    expect(await verifyClerkSessionToken(token, opts)).toBeNull();
  });

  it('rejects a token whose kid is not in the JWKS', async () => {
    const token = makeToken(validPayload(), { kid: 'unknown-kid' });
    expect(await verifyClerkSessionToken(token, opts)).toBeNull();
  });

  it('rejects a token with the wrong azp (audience)', async () => {
    const token = makeToken(validPayload({ azp: 'pk_live_someone_else' }));
    expect(await verifyClerkSessionToken(token, opts)).toBeNull();
  });

  it('rejects malformed tokens', async () => {
    expect(await verifyClerkSessionToken('not-a-jwt', opts)).toBeNull();
    expect(await verifyClerkSessionToken('', opts)).toBeNull();
    expect(await verifyClerkSessionToken(null as any, opts)).toBeNull();
  });

  it('fails closed when no issuer can be resolved', async () => {
    const token = makeToken(validPayload());
    expect(await verifyClerkSessionToken(token, { fetchImpl: jwksFetch(), env: {} })).toBeNull();
  });
});

describe('hasSmartVideoGo (resolveAccess semantics)', () => {
  it('passes for smartvideo_go', () => {
    expect(hasSmartVideoGo({ smartvideo_go: true }, 'active')).toBe(true);
  });

  it('passes for founders', () => {
    expect(hasSmartVideoGo({ founders: true }, 'active')).toBe(true);
  });

  it('passes when status is unset', () => {
    expect(hasSmartVideoGo({ smartvideo_go: true }, undefined)).toBe(true);
  });

  it('fails for inactive/unpaid users', () => {
    expect(hasSmartVideoGo({ smartvideo_go: false }, 'inactive')).toBe(false);
    expect(hasSmartVideoGo({ smartvideo_go: true }, 'canceled')).toBe(false);
    expect(hasSmartVideoGo({}, 'active')).toBe(false);
  });
});

describe('requirePaidEntitlement (Netlify guard)', () => {
  const baseOptions = () => ({
    issuer: ISSUER,
    fetchImpl: jwksFetch(),
    env: { NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: PUBLISHABLE_KEY },
  });

  it('401 AUTH_REQUIRED when no session token is present', async () => {
    const result = await requirePaidEntitlement({ headers: {} }, { ...baseOptions(), supabase: fakeSupabase(null) });
    expect(result).toEqual({ ok: false, status: 401, body: { error: 'AUTH_REQUIRED' } });
  });

  it('401 AUTH_REQUIRED when the token is invalid', async () => {
    const result = await requirePaidEntitlement(
      { headers: { authorization: 'Bearer not-a-jwt' } },
      { ...baseOptions(), supabase: fakeSupabase(null) }
    );
    expect(result).toEqual({ ok: false, status: 401, body: { error: 'AUTH_REQUIRED' } });
  });

  it('403 PAYMENT_REQUIRED when the user has no entitlement row', async () => {
    const token = makeToken(validPayload());
    const result = await requirePaidEntitlement(
      { headers: { authorization: `Bearer ${token}` } },
      { ...baseOptions(), supabase: fakeSupabase(null) }
    );
    expect(result).toEqual({
      ok: false,
      status: 403,
      body: { error: 'PAYMENT_REQUIRED', upgradeRequired: true },
    });
  });

  it('403 PAYMENT_REQUIRED when the entitlement is inactive', async () => {
    const token = makeToken(validPayload());
    const result = await requirePaidEntitlement(
      { headers: { cookie: `__session=${token}` } },
      {
        ...baseOptions(),
        supabase: fakeSupabase({
          clerk_user_id: 'user_123',
          entitlements: { smartvideo_go: true },
          status: 'inactive',
        }),
      }
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(403);
  });

  it('allows a user with smartvideo_go', async () => {
    const token = makeToken(validPayload());
    const result = await requirePaidEntitlement(
      { headers: { authorization: `Bearer ${token}` } },
      {
        ...baseOptions(),
        supabase: fakeSupabase({
          clerk_user_id: 'user_123',
          entitlements: { smartvideo_go: true },
          status: 'active',
        }),
      }
    );
    expect(result).toEqual({ ok: true, userId: 'user_123' });
  });

  it('allows a founders user', async () => {
    const token = makeToken(validPayload());
    const result = await requirePaidEntitlement(
      { headers: { authorization: `Bearer ${token}` } },
      {
        ...baseOptions(),
        supabase: fakeSupabase({
          clerk_user_id: 'user_123',
          entitlements: { founders: true },
          status: 'active',
        }),
      }
    );
    expect(result).toEqual({ ok: true, userId: 'user_123' });
  });
});

describe('entitlementErrorResponse', () => {
  it('builds a JSON Netlify response with CORS headers', () => {
    const res = entitlementErrorResponse(
      { ok: false, status: 403, body: { error: 'PAYMENT_REQUIRED', upgradeRequired: true } },
      { 'Access-Control-Allow-Origin': '*' }
    );
    expect(res.statusCode).toBe(403);
    expect(res.body).toBe(JSON.stringify({ error: 'PAYMENT_REQUIRED', upgradeRequired: true }));
    expect(res.headers['Content-Type']).toBe('application/json');
    expect(res.headers['Access-Control-Allow-Origin']).toBe('*');
  });
});
