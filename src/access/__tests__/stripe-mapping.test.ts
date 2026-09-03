import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Stripe SDK to avoid requiring a real API key during tests
vi.mock('stripe', () => {
  return {
    default: class Stripe {
      constructor() {}
      webhooks = {
        constructEvent: vi.fn(),
      };
    },
  };
});

// Mock both possible import paths for supabase server
vi.mock('@/src/lib/supabaseServer', () => ({
  getSupabaseAdmin: vi.fn(),
}));

vi.mock('@/lib/supabaseServer', () => ({
  getSupabaseAdmin: vi.fn(),
}));

vi.mock('@/access/resolveAccess', () => ({
  grantEntitlement: vi.fn(),
}));

import { getStripeProductMap, resolveEntitlementFromSession } from '@/app/api/webhooks/stripe/route';

describe('stripe webhook product mapping', () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_STRIPE_PRODUCT_MAP;
    delete process.env.STRIPE_PRODUCT_MAP;
  });

  it('returns empty map when no env vars are set', () => {
    const map = getStripeProductMap();
    expect(Object.keys(map)).toHaveLength(0);
  });

  it('parses STRIPE_PRODUCT_MAP env var', () => {
    process.env.STRIPE_PRODUCT_MAP = JSON.stringify({
      price_1: 'smartvideo_go',
      price_2: 'founders',
    });

    const map = getStripeProductMap();
    expect(map['price_1']).toBe('smartvideo_go');
    expect(map['price_2']).toBe('founders');
  });

  it('prefers NEXT_PUBLIC_STRIPE_PRODUCT_MAP over STRIPE_PRODUCT_MAP', () => {
    process.env.NEXT_PUBLIC_STRIPE_PRODUCT_MAP = JSON.stringify({
      price_1: 'smartvideo_go',
    });
    process.env.STRIPE_PRODUCT_MAP = JSON.stringify({
      price_1: 'founders',
      price_2: 'founders',
    });

    const map = getStripeProductMap();
    expect(map['price_1']).toBe('smartvideo_go');
    expect(map['price_2']).toBeUndefined();
  });

  it('resolveEntitlementFromSession returns mapped entitlement for known price', () => {
    process.env.NEXT_PUBLIC_STRIPE_PRODUCT_MAP = JSON.stringify({
      price_smartvideo_go: 'smartvideo_go',
    });

    const session = {
      line_items: {
        data: [
          {
            price: {
              id: 'price_smartvideo_go',
            },
          },
        ],
      },
    } as any;

    expect(resolveEntitlementFromSession(session)).toBe('smartvideo_go');
  });

  it('resolveEntitlementFromSession returns empty string for unmapped price', () => {
    process.env.NEXT_PUBLIC_STRIPE_PRODUCT_MAP = JSON.stringify({
      price_smartvideo_go: 'smartvideo_go',
    });

    const session = {
      line_items: {
        data: [
          {
            price: {
              id: 'price_unknown_product',
            },
          },
        ],
      },
    } as any;

    expect(resolveEntitlementFromSession(session)).toBe('');
  });

  it('resolveEntitlementFromSession returns empty string when no line items', () => {
    const session = {
      line_items: { data: [] },
    } as any;

    expect(resolveEntitlementFromSession(session)).toBe('');
  });
});
