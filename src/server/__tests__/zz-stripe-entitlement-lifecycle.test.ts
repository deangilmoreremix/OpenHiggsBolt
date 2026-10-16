/**
 * Entitlement-lifecycle and preservation-invariant tests.
 *
 * Covers the resolver side of the money path (what `requireApiEntitlement`
 * consults on every paid route) and the invariant the audit most cares about:
 * a refund silently revokes only the purchaser it belongs to, while an existing
 * lifetime / founders purchase keeps full access.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabaseServer', () => ({
  getSupabaseAdmin: () => fakeSupabase,
}));

vi.mock('@/src/lib/supabaseServer', () => ({
  getSupabaseAdmin: () => fakeSupabase,
}));

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(async () => ({ userId: null })),
  currentUser: vi.fn(async () => null),
}));

type Row = Record<string, any>;

const db: { user_entitlements: Row[] } = { user_entitlements: [] };

function matchesFilters(row: Row, filters: { column: string; value: any; isIn?: boolean }[]): boolean {
  return filters.every((filter) =>
    filter.isIn ? filter.value.includes(row[filter.column]) : row[filter.column] === filter.value
  );
}

const fakeSupabase = {
  from(table: string) {
    const op: { kind: string; payload?: any; filters: { column: string; value: any; isIn?: boolean }[] } = {
      kind: 'select',
      filters: [],
    };
    const builder: any = {};

    const execute = () => {
      const rows = db[table] || [];
      switch (op.kind) {
        case 'select':
          return { data: rows.filter((row) => matchesFilters(row, op.filters)), error: null };
        case 'update': {
          const matched = rows.filter((row) => matchesFilters(row, op.filters));
          const updated = matched.map((row) => ({ ...row, ...op.payload }));
          db[table] = rows.map((row) => updated.find((entry) => entry.id === row.id) || row);
          return { data: updated, error: null };
        }
        case 'upsert': {
          const payload = op.payload;
          const index = rows.findIndex((row) => row.clerk_user_id === payload.clerk_user_id);
          if (index >= 0) rows[index] = { ...rows[index], ...payload };
          else rows.push({ id: `ent_${rows.length + 1}`, ...payload });
          return { data: payload, error: null };
        }
        default:
          return { data: null, error: null };
      }
    };

    builder.select = () => {
      op.kind = 'select';
      return builder;
    };
    builder.update = (payload: any) => {
      op.kind = 'update';
      op.payload = payload;
      return builder;
    };
    builder.upsert = (payload: any) => {
      op.kind = 'upsert';
      op.payload = payload;
      return builder;
    };
    builder.delete = () => {
      op.kind = 'delete';
      return builder;
    };
    builder.eq = (column: string, value: any) => {
      op.filters.push({ column, value });
      return builder;
    };
    builder.in = (column: string, value: any[]) => {
      op.filters.push({ column, value, isIn: true });
      return builder;
    };
    builder.maybeSingle = async () => {
      const { data, error } = execute();
      return { data: Array.isArray(data) ? (data[0] ?? null) : (data ?? null), error };
    };
    builder.then = (resolve: any, reject: any) => Promise.resolve(execute()).then(resolve, reject);

    return builder;
  },
};

async function loadModule() {
  vi.resetModules();
  return import('@/access/resolveAccess');
}

function seedRow(overrides: Row = {}) {
  const row: Row = {
    id: 'ent_1',
    clerk_user_id: 'user_entitled',
    email: 'buyer@example.com',
    entitlements: { smartvideo_go: true },
    status: 'active',
    source: 'stripe',
    stripe_customer_id: 'cus_1',
    stripe_subscription_id: null,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
  db.user_entitlements.push(row);
  return row;
}

describe('zz-stripe: entitlement resolution and preservation', () => {
  beforeEach(() => {
    db.user_entitlements = [];
  });

  it('an active grant makes the paid-feature resolver allow access', async () => {
    seedRow();
    const { resolveSmartVideoAccessForUser } = await loadModule();

    const access = await resolveSmartVideoAccessForUser('user_entitled');

    expect(access?.hasSmartVideoGo).toBe(true);
    expect(access?.status).toBe('active');
    expect(access?.entitlements.smartvideo_go).toBe(true);
  });

  it('a founders entitlement also grants access (lifetime purchasers keep it)', async () => {
    seedRow({ entitlements: { founders: true }, source: 'manual' });
    const { resolveSmartVideoAccessForUser } = await loadModule();

    const access = await resolveSmartVideoAccessForUser('user_entitled');

    expect(access?.hasSmartVideoGo).toBe(true);
  });

  it('an unknown user is denied with a synthetic unpaid state, not a crash', async () => {
    const { resolveSmartVideoAccessForUser } = await loadModule();

    const access = await resolveSmartVideoAccessForUser('user_never_seen');

    expect(access).not.toBeNull();
    expect(access?.hasSmartVideoGo).toBe(false);
    expect(access?.status).toBe('inactive');
  });

  it('an inactive row is denied even though the entitlement is still recorded', async () => {
    seedRow({ status: 'inactive' });
    const { resolveSmartVideoAccessForUser } = await loadModule();

    const access = await resolveSmartVideoAccessForUser('user_entitled');

    expect(access?.hasSmartVideoGo).toBe(false);
    expect(access?.entitlements.smartvideo_go).toBe(true);
  });

  it('grantEntitlement reactivates the row without dropping previously bought entitlements', async () => {
    seedRow({ clerk_user_id: 'user_both', entitlements: { founders: true }, status: 'inactive' });
    const { grantEntitlement, resolveSmartVideoAccessForUser } = await loadModule();

    await grantEntitlement('user_both', 'Buyer2@Example.com', 'smartvideo_go', 'stripe', {
      stripe_customer_id: 'cus_2',
    });

    const access = await resolveSmartVideoAccessForUser('user_both');
    expect(access?.hasSmartVideoGo).toBe(true);
    expect(access?.status).toBe('active');
    expect(access?.entitlements).toEqual({ founders: true, smartvideo_go: true });
    expect(db.user_entitlements).toHaveLength(1);
    expect(db.user_entitlements[0].email).toBe('buyer2@example.com');
    expect(db.user_entitlements[0].stripe_customer_id).toBe('cus_2');
  });

  it('a refunded purchase loses access while a lifetime purchase retains it', async () => {
    const refunded = seedRow({
      id: 'ent_refunded',
      clerk_user_id: 'user_refunded',
      email: 'refunded@example.com',
      entitlements: { smartvideo_go: true },
      status: 'active',
      source: 'stripe',
      stripe_customer_id: 'cus_refunded',
    });
    const lifetime = seedRow({
      id: 'ent_lifetime',
      clerk_user_id: 'user_lifetime',
      email: 'lifetime@example.com',
      entitlements: { smartvideo_go: true },
      status: 'active',
      source: 'stripe',
      stripe_customer_id: 'cus_lifetime',
    });

    const { revokeEntitlement, resolveSmartVideoAccessForUser } = await loadModule();

    const result = await revokeEntitlement(
      { stripeCustomerId: 'cus_refunded' },
      { reason: 'charge.refunded' }
    );

    expect(result).toEqual({ revoked: true, matched: 1, reason: 'charge.refunded' });

    const revokedAccess = await resolveSmartVideoAccessForUser('user_refunded');
    const lifetimeAccess = await resolveSmartVideoAccessForUser('user_lifetime');

    expect(revokedAccess?.hasSmartVideoGo).toBe(false);
    expect(revokedAccess?.status).toBe('inactive');

    expect(lifetimeAccess?.hasSmartVideoGo).toBe(true);
    expect(lifetimeAccess?.status).toBe('active');
    expect(lifetimeAccess?.entitlements).toEqual({ smartvideo_go: true });

    // The refunded row is retained for audit, never deleted.
    expect(db.user_entitlements).toHaveLength(2);
    expect(db.user_entitlements.find((r) => r.id === 'ent_refunded')?.id).toBe(refunded.id);
    expect(db.user_entitlements.find((r) => r.id === 'ent_lifetime')?.id).toBe(lifetime.id);
  });

  it('revoking by email matches case-insensitively and does not touch other purchasers', async () => {
    seedRow({ id: 'ent_a', clerk_user_id: 'user_a', email: 'a@example.com', stripe_customer_id: 'cus_a' });
    seedRow({ id: 'ent_b', clerk_user_id: 'user_b', email: 'b@example.com', stripe_customer_id: 'cus_b' });

    const { revokeEntitlement } = await loadModule();
    const result = await revokeEntitlement({ email: 'a@EXAMPLE.com' }, { reason: 'customer.subscription.deleted' });

    expect(result.revoked).toBe(true);
    expect(result.matched).toBe(1);
    expect(db.user_entitlements.find((r) => r.id === 'ent_a')?.status).toBe('inactive');
    expect(db.user_entitlements.find((r) => r.id === 'ent_b')?.status).toBe('active');
  });
});

describe('zz-stripe: paid-route gate', () => {
  beforeEach(() => {
    vi.resetModules();
    db.user_entitlements = [];
  });

  it('returns 401 for a signed-out caller', async () => {
    vi.doMock('@clerk/nextjs/server', () => ({ auth: vi.fn(async () => ({ userId: null })), currentUser: vi.fn(async () => null) }));
    vi.doMock('@/access/resolveAccess', () => ({ resolveSmartVideoAccessForUser: vi.fn() }));

    const { requireApiEntitlement } = await import('@/access/apiRequireEntitlement');
    const result = await requireApiEntitlement('smartvideo_go');

    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.status).toBe(401);
  });

  it('returns 403 PAYMENT_REQUIRED for an authenticated unpaid caller', async () => {
    vi.doMock('@clerk/nextjs/server', () => ({ auth: vi.fn(async () => ({ userId: 'user_unpaid' })), currentUser: vi.fn(async () => null) }));
    vi.doMock('@/access/resolveAccess', () => ({
      resolveSmartVideoAccessForUser: vi.fn(async () => ({
        clerkUserId: 'user_unpaid',
        email: '',
        entitlements: { smartvideo_go: false },
        status: 'inactive',
        source: 'manual',
        hasSmartVideoGo: false,
      })),
    }));

    const { requireApiEntitlement, entitlementForbiddenResponse } = await import('@/access/apiRequireEntitlement');

    const result = await requireApiEntitlement('smartvideo_go');
    expect(result.allowed).toBe(false);
    if (!result.allowed && result.status === 403) {
      expect(result.entitlement).toBe('smartvideo_go');
    }

    const response = entitlementForbiddenResponse('smartvideo_go');
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: 'PAYMENT_REQUIRED',
      entitlement: 'smartvideo_go',
      upgradeRequired: true,
    });
  });

  it('allows a caller whose entitlement was just granted by the webhook', async () => {
    vi.doMock('@clerk/nextjs/server', () => ({ auth: vi.fn(async () => ({ userId: 'user_entitled' })), currentUser: vi.fn(async () => null) }));
    vi.doMock('@/access/resolveAccess', () => ({
      resolveSmartVideoAccessForUser: vi.fn(async () => ({
        clerkUserId: 'user_entitled',
        email: 'buyer@example.com',
        entitlements: { smartvideo_go: true },
        status: 'active',
        source: 'stripe',
        hasSmartVideoGo: true,
      })),
    }));

    const { requireApiEntitlement } = await import('@/access/apiRequireEntitlement');
    const result = await requireApiEntitlement('smartvideo_go');

    expect(result).toEqual({ allowed: true });
  });

  it('allows a founders (legacy lifetime) purchaser through the same gate', async () => {
    vi.doMock('@clerk/nextjs/server', () => ({ auth: vi.fn(async () => ({ userId: 'user_founders' })), currentUser: vi.fn(async () => null) }));
    vi.doMock('@/access/resolveAccess', () => ({
      resolveSmartVideoAccessForUser: vi.fn(async () => ({
        clerkUserId: 'user_founders',
        email: 'founders@example.com',
        entitlements: { founders: true },
        status: 'active',
        source: 'manual',
        hasSmartVideoGo: true,
      })),
    }));

    const { requireApiEntitlement } = await import('@/access/apiRequireEntitlement');
    const result = await requireApiEntitlement('smartvideo_go');

    expect(result).toEqual({ allowed: true });
  });
});
