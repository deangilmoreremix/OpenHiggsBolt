import { describe, it, expect, beforeAll, afterAll } from 'vitest'

// Integration check: each Netlify function must reject unauthenticated paid
// calls with 401 { error: 'AUTH_REQUIRED' } BEFORE touching Supabase edge
// functions. The functions build their Supabase client at import time, so we
// point the env at a dummy (never contacted) instance.
const REQUIRED_ENV = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'dummy-service-role-key',
};

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
    it(`${fn.name} ${fn.method} returns 401 AUTH_REQUIRED without a session`, async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { handler } = require(fn.modulePath);
      const res = await handler(fn.event);
      expect(res.statusCode).toBe(401);
      expect(JSON.parse(res.body)).toEqual({ error: 'AUTH_REQUIRED' });
    });

    it(`${fn.name} ${fn.method} returns 401 AUTH_REQUIRED for an unverifiable token`, async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { handler } = require(fn.modulePath);
      const res = await handler({
        ...fn.event,
        headers: { authorization: 'Bearer not-a-real-clerk-token' },
      });
      // No Clerk issuer is configured in the test env, so verification fails
      // closed (no JWKS fetch) and the guard answers 401.
      expect(res.statusCode).toBe(401);
      expect(JSON.parse(res.body)).toEqual({ error: 'AUTH_REQUIRED' });
    });
  }

  it('leaves GET (catalog browse) unguarded on campaigns.js', async () => {
    // Static check: the entitlement guard must appear only inside the POST
    // branch, never the GET branch, so free users keep browse/preview access.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require('node:fs');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const path = require('node:path');
    const source = fs.readFileSync(
      path.join(__dirname, '../../netlify/functions/campaigns.js'),
      'utf8'
    ) as string;

    const postIndex = source.indexOf("if (event.httpMethod === 'POST')");
    const getIndex = source.indexOf("if (event.httpMethod === 'GET')");
    const guardIndex = source.indexOf('requirePaidEntitlement(event');

    expect(postIndex).toBeGreaterThan(-1);
    expect(getIndex).toBeGreaterThan(-1);
    expect(guardIndex).toBeGreaterThan(postIndex);
    expect(guardIndex).toBeGreaterThan(getIndex);
  });
});
