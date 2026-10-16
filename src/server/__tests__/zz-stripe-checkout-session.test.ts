/**
 * Regression tests for the Stripe checkout session creation route.
 *
 * Offline: the Stripe SDK is mocked, so every parameter the route sends to
 * Stripe can be asserted exactly, and the failure modes (no secret key, no
 * configured price, no session url) are covered without a network call.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockStripe = vi.hoisted(() => ({ createSession: vi.fn() }));

vi.mock('stripe', () => ({
  default: class Stripe {
    constructor(_key?: string, _opts?: unknown) {}
    checkout = { sessions: { create: mockStripe.createSession } };
  },
}));

const TRIAL_PRODUCT_MAP = '{"price_smartvideo_go_lifetime":"smartvideo_go"}';

function setEnv(overrides: { secret?: string; price?: string; appUrl?: string | null } = {}) {
  delete process.env.NEXT_PUBLIC_STRIPE_PRODUCT_MAP;
  process.env.STRIPE_PRODUCT_MAP = TRIAL_PRODUCT_MAP;
  process.env.STRIPE_SECRET_KEY = overrides.secret ?? 'sk_test_123';
  process.env.STRIPE_PRICE_LIFETIME = overrides.price ?? 'price_smartvideo_go_lifetime';
  if (overrides.appUrl === null) delete process.env.NEXT_PUBLIC_APP_URL;
  else process.env.NEXT_PUBLIC_APP_URL = overrides.appUrl ?? 'https://go.smartvid.app';
}

async function loadRoute() {
  vi.resetModules();
  return import('@/app/api/stripe/checkout/route');
}

function request(origin?: string) {
  return new Request('http://localhost/api/stripe/checkout', {
    method: 'POST',
    headers: origin ? { origin } : {},
    body: JSON.stringify({ plan: 'pro_lifetime' }),
  });
}

describe('zz-stripe: checkout session creation', () => {
  beforeEach(() => {
    mockStripe.createSession.mockReset();
    mockStripe.createSession.mockResolvedValue({
      id: 'cs_test_created',
      url: 'https://checkout.stripe.com/c/pay/cs_test_created',
    });
    setEnv();
  });

  it('creates a one-time-payment session for the configured lifetime price', async () => {
    const route = await loadRoute();
    const res = await route.POST(request() as any);

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      url: 'https://checkout.stripe.com/c/pay/cs_test_created',
      sessionId: 'cs_test_created',
    });

    const params = mockStripe.createSession.mock.calls[0][0];
    expect(params.mode).toBe('payment');
    expect(params.payment_method_types).toEqual(['card']);
    expect(params.line_items).toEqual([{ price: 'price_smartvideo_go_lifetime', quantity: 1 }]);
  });

  it('returns the hosted checkout url the browser is redirected to', async () => {
    const route = await loadRoute();
    const res = await route.POST(request() as any);
    const body = await res.json();

    expect(body.url).toBe('https://checkout.stripe.com/c/pay/cs_test_created');
    expect(body.url).not.toContain('sk_test_');
  });

  it('derives success and cancel urls from NEXT_PUBLIC_APP_URL', async () => {
    const route = await loadRoute();
    await route.POST(request() as any);

    const params = mockStripe.createSession.mock.calls[0][0];
    expect(params.success_url).toBe(
      'https://go.smartvid.app/?purchase=success&session_id={CHECKOUT_SESSION_ID}#pricing'
    );
    expect(params.cancel_url).toBe('https://go.smartvid.app/#pricing');
  });

  it('strips a trailing slash from the configured app url', async () => {
    setEnv({ appUrl: 'https://go.smartvid.app/' });
    const route = await loadRoute();
    await route.POST(request() as any);

    const params = mockStripe.createSession.mock.calls[0][0];
    expect(params.cancel_url).toBe('https://go.smartvid.app/#pricing');
  });

  it('falls back to the request origin when no app url is configured', async () => {
    setEnv({ appUrl: null });
    const route = await loadRoute();
    await route.POST(request('https://deploy-preview.example.netlify.app') as any);

    const params = mockStripe.createSession.mock.calls[0][0];
    expect(params.success_url).toContain('https://deploy-preview.example.netlify.app/?purchase=success');
    expect(params.cancel_url).toBe('https://deploy-preview.example.netlify.app/#pricing');
  });

  it('allows promotion codes and carries clerk identity + entitlement metadata', async () => {
    vi.doMock('@clerk/nextjs/server', () => ({
      auth: vi.fn(async () => ({ userId: 'user_checkout_1' })),
      currentUser: vi.fn(async () => null),
    }));

    const route = await loadRoute();
    await route.POST(request() as any);

    const params = mockStripe.createSession.mock.calls[0][0];
    expect(params.allow_promotion_codes).toBe(true);
    expect(params.metadata).toEqual({
      clerk_user_id: 'user_checkout_1',
      entitlement: 'smartvideo_go',
      plan: 'pro_lifetime',
    });
  });

  it('does not leak a clerk_user_id into metadata when the buyer is signed out', async () => {
    vi.doMock('@clerk/nextjs/server', () => ({
      auth: vi.fn(async () => { throw new Error('outside clerk context'); }),
      currentUser: vi.fn(async () => null),
    }));

    const route = await loadRoute();
    await route.POST(request() as any);

    const params = mockStripe.createSession.mock.calls[0][0];
    expect(params.metadata.clerk_user_id).toBeUndefined();
    expect(params.metadata.entitlement).toBe('smartvideo_go');
  });

  it('returns 500 without calling Stripe when the secret key is missing', async () => {
    setEnv({ secret: '' });
    const route = await loadRoute();

    const res = await route.POST(request() as any);

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Payments are not configured. Please contact support.' });
    expect(mockStripe.createSession).not.toHaveBeenCalled();
  });

  it('returns 500 without calling Stripe when no lifetime price is configured', async () => {
    setEnv({ price: '' });
    const route = await loadRoute();

    const res = await route.POST(request() as any);

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'The Pro plan is temporarily unavailable. Please try again later.' });
    expect(mockStripe.createSession).not.toHaveBeenCalled();
  });

  it('returns 500 when Stripe returns a session without a url', async () => {
    mockStripe.createSession.mockResolvedValue({ id: 'cs_test_no_url', url: null });
    const route = await loadRoute();

    const res = await route.POST(request() as any);

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Failed to create checkout session.' });
  });

  it('returns 500 and never echoes the Stripe error when session creation fails', async () => {
    mockStripe.createSession.mockRejectedValue(new Error('Invalid API key provided: sk_test_secret_value'));
    const route = await loadRoute();

    const res = await route.POST(request() as any);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: 'Failed to start checkout. Please try again.' });
    expect(JSON.stringify(body)).not.toContain('sk_test_');
  });

  it('falls back to smartvideo_go when the map has no entry for the configured price', async () => {
    setEnv({ price: 'price_unmapped' });
    const route = await loadRoute();

    await route.POST(request() as any);

    const params = mockStripe.createSession.mock.calls[0][0];
    expect(params.metadata.entitlement).toBe('smartvideo_go');
  });
});
