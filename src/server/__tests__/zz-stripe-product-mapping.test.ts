/**
 * Regression tests for the Stripe price -> entitlement mapping.
 *
 * The mapping is the single source of truth for what a purchase grants: the
 * webhook maps `price id -> entitlement key` from
 * STRIPE_PRODUCT_MAP / NEXT_PUBLIC_STRIPE_PRODUCT_MAP, and the checkout route
 * reads the same map to stamp `metadata.entitlement` onto the session. These
 * tests pin that the two sides agree, that only real entitlement keys are
 * accepted, and that display values (`plan`) never become entitlements.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Stripe SDK so the module can be imported without a real key.
vi.mock('stripe', () => ({
  default: class Stripe {
    constructor(_key?: string, _opts?: unknown) {}
    webhooks = { constructEvent: vi.fn() };
    checkout = { sessions: { retrieve: vi.fn() } };
    charges = { retrieve: vi.fn() };
  },
}));

vi.mock('@/src/lib/supabaseServer', () => ({ getSupabaseAdmin: vi.fn() }));
vi.mock('@/lib/supabaseServer', () => ({ getSupabaseAdmin: vi.fn() }));
vi.mock('@/access/resolveAccess', () => ({ grantEntitlement: vi.fn() }));
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(async () => ({ userId: null })),
  currentUser: vi.fn(async () => null),
}));

const PRICE_LIFETIME = 'price_smartvideo_go_lifetime';
const PRICE_FOUNDERS = 'price_smartvideo_go_founders';

function setMap(value: string | null) {
  delete process.env.NEXT_PUBLIC_STRIPE_PRODUCT_MAP;
  delete process.env.STRIPE_PRODUCT_MAP;
  if (value !== null) process.env.STRIPE_PRODUCT_MAP = value;
}

async function loadWebhookRoute() {
  vi.resetModules();
  return import('@/app/api/webhooks/stripe/route');
}

async function loadCheckoutRoute() {
  vi.resetModules();
  return import('@/app/api/stripe/checkout/route');
}

describe('zz-stripe: price -> entitlement mapping', () => {
  beforeEach(() => {
    setMap(null);
  });

  describe('getStripeProductMap', () => {
    it('returns an empty map when no env var is configured', async () => {
      const { getStripeProductMap } = await loadWebhookRoute();
      expect(Object.keys(getStripeProductMap())).toHaveLength(0);
    });

    it('parses the STRIPE_PRODUCT_MAP JSON', async () => {
      setMap(JSON.stringify({ [PRICE_LIFETIME]: 'smartvideo_go', [PRICE_FOUNDERS]: 'founders' }));
      const { getStripeProductMap } = await loadWebhookRoute();

      const map = getStripeProductMap();
      expect(map[PRICE_LIFETIME]).toBe('smartvideo_go');
      expect(map[PRICE_FOUNDERS]).toBe('founders');
    });

    it('prefers NEXT_PUBLIC_STRIPE_PRODUCT_MAP over STRIPE_PRODUCT_MAP', async () => {
      setMap(JSON.stringify({ [PRICE_LIFETIME]: 'founders' }));
      process.env.NEXT_PUBLIC_STRIPE_PRODUCT_MAP = JSON.stringify({ [PRICE_LIFETIME]: 'smartvideo_go' });

      const { getStripeProductMap } = await loadWebhookRoute();
      const map = getStripeProductMap();

      expect(map[PRICE_LIFETIME]).toBe('smartvideo_go');
      expect(Object.keys(map)).toHaveLength(1);
    });

    it('degrades to an empty map on malformed JSON instead of throwing', async () => {
      setMap('{not valid json');
      const { getStripeProductMap } = await loadWebhookRoute();
      expect(getStripeProductMap()).toEqual({});
    });
  });

  describe('resolveEntitlementFromSession', () => {
    it('maps a configured price id to its entitlement key', async () => {
      setMap(JSON.stringify({ [PRICE_LIFETIME]: 'smartvideo_go' }));
      const { resolveEntitlementFromSession } = await loadWebhookRoute();

      const session = {
        line_items: { data: [{ price: { id: PRICE_LIFETIME } }] },
      } as any;

      expect(resolveEntitlementFromSession(session)).toBe('smartvideo_go');
    });

    it('returns an empty string for a price that is not in the map', async () => {
      setMap(JSON.stringify({ [PRICE_LIFETIME]: 'smartvideo_go' }));
      const { resolveEntitlementFromSession } = await loadWebhookRoute();

      const session = { line_items: { data: [{ price: { id: 'price_unmapped' } }] } } as any;
      expect(resolveEntitlementFromSession(session)).toBe('');
    });

    it('returns an empty string when the session carries no line items', async () => {
      const { resolveEntitlementFromSession } = await loadWebhookRoute();
      expect(resolveEntitlementFromSession({ line_items: { data: [] } } as any)).toBe('');
      expect(resolveEntitlementFromSession({} as any)).toBe('');
    });

    it('resolves from the first line item of a multi-item session', async () => {
      setMap(JSON.stringify({ [PRICE_LIFETIME]: 'smartvideo_go', [PRICE_FOUNDERS]: 'founders' }));
      const { resolveEntitlementFromSession } = await loadWebhookRoute();

      const session = {
        line_items: {
          data: [
            { price: { id: PRICE_LIFETIME } },
            { price: { id: PRICE_FOUNDERS } },
          ],
        },
      } as any;

      expect(resolveEntitlementFromSession(session)).toBe('smartvideo_go');
    });
  });

  describe('resolveEntitlementFromMetadata', () => {
    it('accepts a metadata value that is a real entitlement key', async () => {
      const { resolveEntitlementFromMetadata } = await loadWebhookRoute();
      expect(
        resolveEntitlementFromMetadata({ metadata: { entitlement: 'founders' } } as any)
      ).toBe('founders');
    });

    it('rejects `plan` values, which are display data and never entitlements', async () => {
      const { resolveEntitlementFromMetadata } = await loadWebhookRoute();
      expect(
        resolveEntitlementFromMetadata({ metadata: { plan: 'pro_lifetime' } } as any)
      ).toBe('');
    });

    it('rejects an unknown entitlement key', async () => {
      const { resolveEntitlementFromMetadata } = await loadWebhookRoute();
      expect(
        resolveEntitlementFromMetadata({ metadata: { entitlement: 'mega_enterprise' } } as any)
      ).toBe('');
    });

    it('tolerates a session with no metadata at all', async () => {
      const { resolveEntitlementFromMetadata } = await loadWebhookRoute();
      expect(resolveEntitlementFromMetadata({} as any)).toBe('');
    });
  });

  describe('checkout route and webhook agree on the same mapping', () => {
    const mockStripe = vi.hoisted(() => ({ createSession: vi.fn() }));

    beforeEach(() => {
      mockStripe.createSession.mockReset();
      mockStripe.createSession.mockResolvedValue({ id: 'cs_test_1', url: 'https://checkout.stripe.com/c/pay/cs_test_1' });
    });

    it('stamps the mapped entitlement on the session the webhook later resolves', async () => {
      // Both route modules must be loaded against the same Stripe mock, so the
      // mock is (re)installed for this describe block before importing.
      vi.doMock('stripe', () => ({
        default: class Stripe {
          constructor(_key?: string, _opts?: unknown) {}
          checkout = { sessions: { create: mockStripe.createSession } };
        },
      }));

      const mapJson = JSON.stringify({ [PRICE_LIFETIME]: 'smartvideo_go' });
      setMap(mapJson);

      process.env.STRIPE_SECRET_KEY = 'sk_test_123';
      process.env.STRIPE_PRICE_LIFETIME = PRICE_LIFETIME;
      delete process.env.NEXT_PUBLIC_APP_URL;

      const checkout = await loadCheckoutRoute();
      const res = await checkout.POST(
        new Request('http://localhost/api/stripe/checkout', { method: 'POST', body: '{}' }) as any
      );

      expect(res.status).toBe(200);
      const params = mockStripe.createSession.mock.calls[0][0];

      // What the checkout route puts on the session...
      expect(params.mode).toBe('payment');
      expect(params.line_items).toEqual([{ price: PRICE_LIFETIME, quantity: 1 }]);
      expect(params.metadata.entitlement).toBe('smartvideo_go');
      expect(params.metadata.plan).toBe('pro_lifetime');

      // ...is exactly what the webhook resolves back from the same map.
      const webhook = await loadWebhookRoute();
      process.env.STRIPE_PRODUCT_MAP = mapJson;
      expect(
        webhook.resolveEntitlementFromSession({
          line_items: { data: [{ price: { id: params.line_items[0].price } }] },
        } as any)
      ).toBe(params.metadata.entitlement);
    });

    it('the checkout route omits clerk_user_id when the buyer is signed out', async () => {
      vi.doMock('stripe', () => ({
        default: class Stripe {
          constructor(_key?: string, _opts?: unknown) {}
          checkout = { sessions: { create: mockStripe.createSession } };
        },
      }));
      vi.doMock('@clerk/nextjs/server', () => ({
        auth: vi.fn(async () => { throw new Error('no clerk context'); }),
        currentUser: vi.fn(async () => null),
      }));

      setMap(JSON.stringify({ [PRICE_LIFETIME]: 'smartvideo_go' }));
      process.env.STRIPE_SECRET_KEY = 'sk_test_123';
      process.env.STRIPE_PRICE_LIFETIME = PRICE_LIFETIME;

      const checkout = await loadCheckoutRoute();
      const res = await checkout.POST(
        new Request('http://localhost/api/stripe/checkout', { method: 'POST', body: '{}' }) as any
      );

      expect(res.status).toBe(200);
      const params = mockStripe.createSession.mock.calls[0][0];
      expect(params.metadata.clerk_user_id).toBeUndefined();
      expect(params.metadata.entitlement).toBe('smartvideo_go');
    });
  });
});
