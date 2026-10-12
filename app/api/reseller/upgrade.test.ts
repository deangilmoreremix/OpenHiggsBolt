import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { createSessionMock, authMock, store } = vi.hoisted(() => {
  type FakeUser = {
    clerk_user_id: string;
    email: string;
    entitlements: Record<string, boolean>;
    status: string;
  };

  const createSessionMock = vi.fn();
  const authMock = vi.fn();
  const store = { users: new Map<string, FakeUser>() };

  return { createSessionMock, authMock, store };
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

vi.mock('@/access/resolveAccess', () => ({
  grantEntitlement: vi.fn(),
}));

vi.mock('@/lib/supabaseServer', () => ({
  getSupabaseAdmin: () => ({
    from(table: string) {
      if (table !== 'user_entitlements') {
        throw new Error(`unexpected table: ${table}`);
      }
      return {
        select: () => ({
          eq: (column: string, value: string) => ({
            maybeSingle: async () => {
              if (column !== 'clerk_user_id') return { data: null, error: null };
              return { data: store.users.get(value) || null, error: null };
            },
          }),
        }),
      };
    },
  }),
}));

const ENV_KEYS = [
  'STRIPE_SECRET_KEY',
  'RESELLER_STRIPE_PRICE_DIY',
  'RESELLER_STRIPE_PRICE_TRAINING',
  'RESELLER_STRIPE_PRICE_UPGRADE',
] as const;

let savedEnv: Record<string, string | undefined> = {};

function setUpgradeRequest() {
  return new NextRequest('http://localhost/api/reseller/upgrade', {
    method: 'POST',
    body: '{}',
  });
}

function setUser(
  clerkUserId: string,
  entitlements: Record<string, boolean>,
  status = 'active'
) {
  store.users.set(clerkUserId, {
    clerk_user_id: clerkUserId,
    email: `${clerkUserId}@example.com`,
    entitlements,
    status,
  });
}

describe('POST /api/reseller/upgrade', () => {
  beforeEach(() => {
    savedEnv = {};
    for (const key of ENV_KEYS) savedEnv[key] = process.env[key];
    for (const key of ENV_KEYS) delete process.env[key];
    store.users.clear();
    createSessionMock.mockReset();
    createSessionMock.mockResolvedValue({
      id: 'cs_test_upgrade',
      url: 'https://checkout.stripe.com/c/pay/cs_test_upgrade',
    });
    authMock.mockReset();
    authMock.mockResolvedValue({ userId: 'user_diy' });
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      const value = savedEnv[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it('returns 401 for signed-out visitors', async () => {
    authMock.mockResolvedValue({ userId: null });
    const { POST } = await import('@/app/api/reseller/upgrade/route');
    const res = await POST(setUpgradeRequest());

    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('UNAUTHENTICATED');
    expect(createSessionMock).not.toHaveBeenCalled();
  });

  it('returns 409 ALREADY_TRAINING for an account that already owns training', async () => {
    setUser('user_diy', { apps_studio_diy: true, apps_studio_training: true });
    const { POST } = await import('@/app/api/reseller/upgrade/route');
    const res = await POST(setUpgradeRequest());

    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe('ALREADY_TRAINING');
    expect(createSessionMock).not.toHaveBeenCalled();
  });

  it('returns 402 UPGRADE_NOT_ELIGIBLE for an account without a DIY purchase', async () => {
    const { POST } = await import('@/app/api/reseller/upgrade/route');
    const res = await POST(setUpgradeRequest());

    expect(res.status).toBe(402);
    expect((await res.json()).error).toBe('UPGRADE_NOT_ELIGIBLE');
    expect(createSessionMock).not.toHaveBeenCalled();
  });

  it('returns 402 UPGRADE_NOT_ELIGIBLE when the DIY entitlement is not active', async () => {
    setUser('user_diy', { apps_studio_diy: true }, 'refunded');
    const { POST } = await import('@/app/api/reseller/upgrade/route');
    const res = await POST(setUpgradeRequest());

    expect(res.status).toBe(402);
    expect((await res.json()).error).toBe('UPGRADE_NOT_ELIGIBLE');
  });

  it('returns the 503 contract for an eligible DIY owner when Stripe is not configured', async () => {
    setUser('user_diy', { apps_studio_diy: true });
    const { POST } = await import('@/app/api/reseller/upgrade/route');
    const res = await POST(setUpgradeRequest());

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({
      error: 'RESELLER_STRIPE_NOT_CONFIGURED',
      missing: ['STRIPE_SECRET_KEY', 'RESELLER_STRIPE_PRICE_UPGRADE'],
    });
    expect(createSessionMock).not.toHaveBeenCalled();
  });

  it('creates the $400 upgrade session for an eligible DIY owner', async () => {
    setUser('user_diy', { apps_studio_diy: true });
    process.env.STRIPE_SECRET_KEY = 'sk_test_1';
    process.env.RESELLER_STRIPE_PRICE_UPGRADE = 'price_upgrade_789';

    const { POST } = await import('@/app/api/reseller/upgrade/route');
    const res = await POST(setUpgradeRequest());

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe('https://checkout.stripe.com/c/pay/cs_test_upgrade');
    expect(body.package).toBe('upgrade');

    const args = createSessionMock.mock.calls[0][0];
    expect(args.line_items).toEqual([{ price: 'price_upgrade_789', quantity: 1 }]);
    expect(args.mode).toBe('payment');
    expect(args.metadata).toMatchObject({
      clerk_user_id: 'user_diy',
      package_id: 'upgrade',
      entitlement: 'apps_studio_training',
      upgrade_from: 'apps_studio_diy',
    });
  });

  it('prevents a second upgrade once training has been granted', async () => {
    setUser('user_diy', { apps_studio_diy: true });
    process.env.STRIPE_SECRET_KEY = 'sk_test_1';
    process.env.RESELLER_STRIPE_PRICE_UPGRADE = 'price_upgrade_789';

    const { POST } = await import('@/app/api/reseller/upgrade/route');

    const first = await POST(setUpgradeRequest());
    expect(first.status).toBe(200);
    expect(createSessionMock).toHaveBeenCalledTimes(1);

    setUser('user_diy', { apps_studio_diy: true, apps_studio_training: true });

    const second = await POST(setUpgradeRequest());
    expect(second.status).toBe(409);
    expect((await second.json()).error).toBe('ALREADY_TRAINING');
    expect(createSessionMock).toHaveBeenCalledTimes(1);
  });
});
