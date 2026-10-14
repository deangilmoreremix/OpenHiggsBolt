import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'

// Integration check: each Netlify function must deny unauthenticated paid
// calls with HTTP 401 BEFORE any paid provider call (the Supabase edge
// functions). The functions' pre-existing Clerk session gate answers first
// with { error: 'Unauthorized' } for a missing or unverifiable token; the
// entitlement guard behind it answers 401 / 403 PAYMENT_REQUIRED only when a
// verifiable session reaches it. The observable contract asserted here is the
// fail-closed 401 with no provider call. The functions build their Supabase
// client lazily, so we point the env at a dummy (never contacted) instance.
const REQUIRED_ENV = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'dummy-service-role-key',
};

/**
 * Watches every outbound provider call (Supabase edge functions, Clerk JWKS)
 * so a test can assert the request was denied before any of them ran. A
 * rejected call must never reach a provider, so the spy rejects loudly.
 */
function spyOnProviderCalls() {
  return vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation(() => Promise.reject(new Error('a denied request must not reach any provider')));
}

let savedEnv: Record<string, string | undefined> = {};

beforeAll(() => {
  savedEnv = { ...process.env };
  Object.assign(process.env, REQUIRED_ENV);
});

afterAll(() => {
  process.env = savedEnv as NodeJS.ProcessEnv;
});

function paidFunctions(): Array<{ name: string; method: string; modulePath: string; event: Record<string, unknown> }> {
  return [
    {
      name: 'campaigns.js',
      method: 'POST',
      modulePath: '../../netlify/functions/campaigns',
      event: { httpMethod: 'POST', body: JSON.stringify({ brand_id: 'b1', goal: 'awareness' }) },
    },
    {
      name: 'assets.js',
      method: 'POST',
      modulePath: '../../netlify/functions/assets',
      event: { httpMethod: 'POST', body: JSON.stringify({ campaign_id: 'c1', platform: 'instagram' }) },
    },
    {
      name: 'photo-studio.js',
      method: 'POST',
      modulePath: '../../netlify/functions/photo-studio',
      event: { httpMethod: 'POST', body: JSON.stringify({ brand_id: 'b1' }) },
    },
    {
      name: 'brands.js',
      method: 'POST',
      modulePath: '../../netlify/functions/brands',
      event: { httpMethod: 'POST', body: JSON.stringify({ url: 'https://example.com' }) },
    },
    {
      name: 'brand.js',
      method: 'PATCH',
      modulePath: '../../netlify/functions/brand',
      event: {
        httpMethod: 'PATCH',
        queryStringParameters: { id: 'brand-1' },
        body: JSON.stringify({ brand_name: 'New' }),
      },
    },
    {
      name: 'brand.js',
      method: 'DELETE',
      modulePath: '../../netlify/functions/brand',
      event: { httpMethod: 'DELETE', queryStringParameters: { id: 'brand-1' } },
    },
  ];
}

describe('Netlify function entitlement guards', () => {
  for (const fn of paidFunctions()) {
    it(`${fn.name} ${fn.method} denies a session-less request with 401 before any provider call`, async () => {
      const fetchSpy = spyOnProviderCalls();
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { handler } = require(fn.modulePath);
        const res = await handler(fn.event);
        // The pre-existing Clerk session gate answers first for a tokenless
        // request; the observable contract is a fail-closed 401 before any
        // paid provider work (the entitlement guard answers with the same
        // status when a verifiable session reaches it).
        expect(res.statusCode).toBe(401);
        expect(JSON.parse(res.body)).toEqual({ error: 'Unauthorized' });
        expect(fetchSpy).not.toHaveBeenCalled();
      } finally {
        fetchSpy.mockRestore();
      }
    });

    it(`${fn.name} ${fn.method} denies an unverifiable session token with 401 before any provider call`, async () => {
      const fetchSpy = spyOnProviderCalls();
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { handler } = require(fn.modulePath);
        const res = await handler({
          ...fn.event,
          headers: { authorization: 'Bearer not-a-real-clerk-token' },
        });
        // The token is not a verifiable Clerk session, so the Clerk session
        // gate fails closed (no JWKS fetch against a configured issuer) and
        // answers 401 before the entitlement guard or any provider is reached.
        expect(res.statusCode).toBe(401);
        expect(JSON.parse(res.body)).toEqual({ error: 'Unauthorized' });
        expect(fetchSpy).not.toHaveBeenCalled();
      } finally {
        fetchSpy.mockRestore();
      }
    });
  }

  it('leaves GET (catalog browse) unguarded on campaigns.js', async () => {
    // Static check: the entitlement guard must appear only in the POST path,
    // never the GET branch, so free users keep browse/preview access. The
    // method dispatch is an ALLOWED_METHODS array + .includes() check with a
    // 405 rejection path, so assert that shape — GET and POST allowed, any
    // other method rejected — and that the guard sits after the GET branch.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require('node:fs');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const path = require('node:path');
    const source = fs.readFileSync(
      path.join(__dirname, '../../netlify/functions/campaigns.js'),
      'utf8'
    ) as string;

    const allowedMethodsMatch = source.match(/const ALLOWED_METHODS = \[([^\]]+)\]/);
    expect(allowedMethodsMatch).not.toBeNull();
    const allowedMethods = (allowedMethodsMatch && allowedMethodsMatch[1] ? allowedMethodsMatch[1] : '')
      .split(',')
      .map((entry) => entry.trim().replace(/^['"]|['"]$/g, ''));
    expect(allowedMethods).toContain('GET');
    expect(allowedMethods).toContain('POST');

    // Every other method is rejected (405) instead of being silently handled.
    expect(source).toContain('ALLOWED_METHODS.includes(method)');
    expect(source).toContain("'Method not allowed'");

    const getIndex = source.indexOf("if (method === 'GET')");
    expect(getIndex).toBeGreaterThan(-1);
    const guardIndex = source.indexOf('requirePaidEntitlement(event');
    expect(guardIndex).toBeGreaterThan(-1);
    expect(guardIndex).toBeGreaterThan(getIndex);
  });
});
