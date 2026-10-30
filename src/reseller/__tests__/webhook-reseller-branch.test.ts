import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { constructEventMock, retrieveSessionMock, grantEntitlementMock, applyResellerPurchaseMock } =
  vi.hoisted(() => ({
    constructEventMock: vi.fn(),
    retrieveSessionMock: vi.fn(),
    grantEntitlementMock: vi.fn(),
    applyResellerPurchaseMock: vi.fn(),
  }));

vi.mock('stripe', () => ({
  default: class Stripe {
    webhooks = { constructEvent: constructEventMock };
    checkout = { sessions: { retrieve: retrieveSessionMock } };
    constructor(
      public apiKey: string,
      public options: unknown
    ) {}
  },
}));

vi.mock('@/src/lib/supabaseServer', () => ({
  getSupabaseAdmin: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
      // The checkout flow writes the idempotency claim and the purchase
      // ledger; the mock only needs to acknowledge those writes.
      insert: async () => ({ data: null, error: null }),
      upsert: async () => ({ data: null, error: null }),
      update: async () => ({ data: null, error: null }),
    }),
  }),
}));

vi.mock('@/lib/supabaseServer', () => ({
  getSupabaseAdmin: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
      insert: async () => ({ data: null, error: null }),
      upsert: async () => ({ data: null, error: null }),
      update: async () => ({ data: null, error: null }),
    }),
  }),
}));

vi.mock('@/access/resolveAccess', () => ({
  grantEntitlement: grantEntitlementMock,
}));

vi.mock('@/lib/reseller/entitlements', () => ({
  applyResellerPurchase: applyResellerPurchaseMock,
}));

const ENV_KEYS = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRODUCT_MAP',
  'NEXT_PUBLIC_STRIPE_PRODUCT_MAP',
  'RESELLER_STRIPE_PRICE_DIY',
  'RESELLER_STRIPE_PRICE_TRAINING',
  'RESELLER_STRIPE_PRICE_UPGRADE',
] as const;

let savedEnv: Record<string, string | undefined> = {};

function makeEvent(options: {
  priceId: string;
  withLineItems?: boolean;
  clerkUserId?: string | null;
  email?: string;
  sessionId?: string;
}) {
  const withLineItems = options.withLineItems ?? true;
  const email = options.email === undefined ? 'buyer@example.com' : options.email;
  return {
    id: 'evt_test_1',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: options.sessionId || 'cs_test_1',
        customer: 'cus_test_1',
        customer_details: email ? { email } : undefined,
        amount_total: 19700,
        currency: 'usd',
        metadata:
          options.clerkUserId === null
            ? {}
            : { clerk_user_id: options.clerkUserId || 'user_test_1' },
        line_items: withLineItems
          ? { data: [{ price: { id: options.priceId } }] }
          : undefined,
      },
    },
  } as any;
}

function makeRequest() {
  return new NextRequest('http://localhost/api/webhooks/stripe', {
    method: 'POST',
    body: JSON.stringify({ id: 'evt_test_1' }),
    headers: { 'stripe-signature': 'sig_test' },
  });
}

describe('stripe webhook reseller branch (additive)', () => {
  beforeEach(() => {
    savedEnv = {};
    for (const key of ENV_KEYS) savedEnv[key] = process.env[key];
    for (const key of ENV_KEYS) delete process.env[key];
    process.env.STRIPE_SECRET_KEY = 'sk_test_1';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_1';
    process.env.RESELLER_STRIPE_PRICE_DIY = 'price_diy_test';
    process.env.RESELLER_STRIPE_PRICE_UPGRADE = 'price_upgrade_test';

    constructEventMock.mockReset();
    retrieveSessionMock.mockReset();
    grantEntitlementMock.mockReset();
    applyResellerPurchaseMock.mockReset();
    applyResellerPurchaseMock.mockResolvedValue({ granted: ['apps_studio_diy'] });
    vi.resetModules();
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      const value = savedEnv[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it('routes a completed reseller DIY checkout to applyResellerPurchase', async () => {
    constructEventMock.mockReturnValue(
      makeEvent({ priceId: 'price_diy_test', email: 'Buyer@Example.com' })
    );

    const { POST } = await import('@/app/api/webhooks/stripe/route');
    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true });
    expect(applyResellerPurchaseMock).toHaveBeenCalledTimes(1);
    expect(applyResellerPurchaseMock).toHaveBeenCalledWith(
      expect.objectContaining({
        clerkUserId: 'user_test_1',
        email: 'buyer@example.com',
        packageId: 'diy',
        stripeSessionId: 'cs_test_1',
        amountTotal: 19700,
        currency: 'usd',
      })
    );
    expect(grantEntitlementMock).not.toHaveBeenCalled();
  });

  it('resolves reseller prices from the retrieved session when line items are absent', async () => {
    constructEventMock.mockReturnValue(
      makeEvent({ priceId: 'price_upgrade_test', withLineItems: false })
    );
    retrieveSessionMock.mockResolvedValue(
      makeEvent({ priceId: 'price_upgrade_test' }).data.object
    );

    const { POST } = await import('@/app/api/webhooks/stripe/route');
    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(retrieveSessionMock).toHaveBeenCalledTimes(1);
    expect(applyResellerPurchaseMock).toHaveBeenCalledWith(
      expect.objectContaining({ packageId: 'upgrade' })
    );
  });

  it('keeps the existing non-reseller product handling intact', async () => {
    process.env.STRIPE_PRODUCT_MAP = JSON.stringify({
      price_smartvideo_go: 'smartvideo_go',
    });
    constructEventMock.mockReturnValue(makeEvent({ priceId: 'price_smartvideo_go' }));

    const { POST } = await import('@/app/api/webhooks/stripe/route');
    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(applyResellerPurchaseMock).not.toHaveBeenCalled();
    expect(grantEntitlementMock).toHaveBeenCalledWith(
      'user_test_1',
      'buyer@example.com',
      'smartvideo_go',
      'stripe',
      expect.objectContaining({ stripe_customer_id: 'cus_test_1' })
    );
  });

  it('ignores unmapped non-reseller prices just like before', async () => {
    constructEventMock.mockReturnValue(makeEvent({ priceId: 'price_unknown_legacy' }));

    const { POST } = await import('@/app/api/webhooks/stripe/route');
    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true });
    expect(applyResellerPurchaseMock).not.toHaveBeenCalled();
    expect(grantEntitlementMock).not.toHaveBeenCalled();
  });

  it('ignores sessions without a customer email', async () => {
    constructEventMock.mockReturnValue(
      makeEvent({ priceId: 'price_diy_test', email: '' })
    );

    const { POST } = await import('@/app/api/webhooks/stripe/route');
    const res = await POST(makeRequest());

    expect(res.status).toBe(400);
    expect(applyResellerPurchaseMock).not.toHaveBeenCalled();
  });
});
