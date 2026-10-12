import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { createSessionMock, authMock } = vi.hoisted(() => {
  const createSessionMock = vi.fn();
  const authMock = vi.fn();
  return { createSessionMock, authMock };
});

vi.mock('stripe', () => ({
  default: class Stripe {
    checkout = { sessions: { create: createSessionMock } };
    constructor(
      public apiKey: string,
      public options: unknown
    ) {}
  },
}));

vi.mock('@clerk/nextjs/server', () => ({
  auth: authMock,
}));

const ENV_KEYS = [
  'STRIPE_SECRET_KEY',
  'RESELLER_STRIPE_PRICE_DIY',
  'RESELLER_STRIPE_PRICE_TRAINING',
  'RESELLER_STRIPE_PRICE_UPGRADE',
] as const;

let savedEnv: Record<string, string | undefined> = {};

function post(packageId: unknown) {
  const req = new NextRequest('http://localhost/api/reseller/checkout', {
    method: 'POST',
    body: JSON.stringify({ package: packageId }),
  });
  return req;
}

describe('POST /api/reseller/checkout', () => {
  beforeEach(() => {
    savedEnv = {};
    for (const key of ENV_KEYS) savedEnv[key] = process.env[key];
    for (const key of ENV_KEYS) delete process.env[key];
    createSessionMock.mockReset();
    createSessionMock.mockResolvedValue({ id: 'cs_test_1', url: 'https://checkout.stripe.com/c/pay/cs_test_1' });
    authMock.mockReset();
    authMock.mockResolvedValue({ userId: 'user_test_1' });
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      const value = savedEnv[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it('returns the 503 contract when nothing is configured', async () => {
    const { POST } = await import('@/app/api/reseller/checkout/route');
    const res = await POST(post('diy'));

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({
      error: 'RESELLER_STRIPE_NOT_CONFIGURED',
      missing: ['STRIPE_SECRET_KEY', 'RESELLER_STRIPE_PRICE_DIY'],
    });
    expect(createSessionMock).not.toHaveBeenCalled();
  });

  it('returns the 503 contract for the training package when unconfigured', async () => {
    const { POST } = await import('@/app/api/reseller/checkout/route');
    const res = await POST(post('training'));

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({
      error: 'RESELLER_STRIPE_NOT_CONFIGURED',
      missing: ['STRIPE_SECRET_KEY', 'RESELLER_STRIPE_PRICE_TRAINING'],
    });
  });

  it('returns the 503 contract when the secret key exists but the price id is missing', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_1';
    const { POST } = await import('@/app/api/reseller/checkout/route');
    const res = await POST(post('diy'));

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({
      error: 'RESELLER_STRIPE_NOT_CONFIGURED',
      missing: ['RESELLER_STRIPE_PRICE_DIY'],
    });
    expect(createSessionMock).not.toHaveBeenCalled();
  });

  it('creates a checkout session with the configured price and returns its url', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_1';
    process.env.RESELLER_STRIPE_PRICE_DIY = 'price_diy_123';

    const { POST } = await import('@/app/api/reseller/checkout/route');
    const res = await POST(post('diy'));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe('https://checkout.stripe.com/c/pay/cs_test_1');
    expect(body.package).toBe('diy');

    expect(createSessionMock).toHaveBeenCalledTimes(1);
    const args = createSessionMock.mock.calls[0][0];
    expect(args.line_items).toEqual([{ price: 'price_diy_123', quantity: 1 }]);
    expect(args.mode).toBe('payment');
    expect(args.metadata).toMatchObject({
      clerk_user_id: 'user_test_1',
      package_id: 'diy',
      entitlement: 'apps_studio_diy',
    });
  });

  it('uses the training price id for the training package', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_1';
    process.env.RESELLER_STRIPE_PRICE_TRAINING = 'price_training_456';

    const { POST } = await import('@/app/api/reseller/checkout/route');
    const res = await POST(post('training'));

    expect(res.status).toBe(200);
    const args = createSessionMock.mock.calls[0][0];
    expect(args.line_items).toEqual([{ price: 'price_training_456', quantity: 1 }]);
    expect(args.metadata).toMatchObject({
      package_id: 'training',
      entitlement: 'apps_studio_diy,apps_studio_training',
    });
  });

  it('rejects unknown or non-purchasable packages with 400', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_1';
    process.env.RESELLER_STRIPE_PRICE_DIY = 'price_diy_123';
    process.env.RESELLER_STRIPE_PRICE_TRAINING = 'price_training_456';
    process.env.RESELLER_STRIPE_PRICE_UPGRADE = 'price_upgrade_789';

    const { POST } = await import('@/app/api/reseller/checkout/route');

    for (const packageId of [undefined, 'upgrade', 'pro_lifetime', '']) {
      const res = await POST(post(packageId));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toBe('UNKNOWN_PACKAGE');
    }
    expect(createSessionMock).not.toHaveBeenCalled();
  });

  it('still creates a session for signed-out buyers using the existing pattern', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_1';
    process.env.RESELLER_STRIPE_PRICE_TRAINING = 'price_training_456';
    authMock.mockResolvedValue({ userId: null });

    const { POST } = await import('@/app/api/reseller/checkout/route');
    const res = await POST(post('training'));

    expect(res.status).toBe(200);
    const args = createSessionMock.mock.calls[0][0];
    expect(args.metadata.clerk_user_id).toBeUndefined();
    expect(args.metadata.package_id).toBe('training');
  });
});
