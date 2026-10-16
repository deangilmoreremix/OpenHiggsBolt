import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabaseServer', () => ({
  getSupabaseAdmin: () => fakeSupabase,
}));

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(async () => ({ userId: 'user_123' })),
  currentUser: vi.fn(async () => null),
}));

type Row = Record<string, any>;

interface DbState {
  user_entitlements: Row[];
  failures: { table: string; op: string }[];
}

const db: DbState = { user_entitlements: [], failures: [] };

function matchesFilters(row: Row, filters: { column: string; value: any; isIn?: boolean }[]): boolean {
  return filters.every((filter) =>
    filter.isIn ? filter.value.includes(row[filter.column]) : row[filter.column] === filter.value
  );
}

const fakeSupabase = {
  from(table: string) {
    const op: { kind: string; payload?: any; filters: any[] } = { kind: 'select', filters: [] };
    const builder: any = {};

    const execute = () => {
      const rows = db[table] || [];

      if (db.failures.some((failure) => failure.table === table && failure.op === op.kind)) {
        return { data: null, error: { code: '42501', message: `forced ${op.kind} failure` } };
      }

      switch (op.kind) {
        case 'select': {
          const matched = rows.filter((row) => matchesFilters(row, op.filters));
          return { data: op.filters.length ? matched : rows, error: null };
        }
        case 'update': {
          const matched = rows.filter((row) => matchesFilters(row, op.filters));
          const updated = matched.map((row) => ({ ...row, ...op.payload }));
          db[table] = rows.map((row) => updated.find((entry) => entry.id === row.id) || row);
          return { data: updated, error: null };
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

function seedRow(overrides: Row = {}) {
  const row: Row = {
    id: 'ent_1',
    clerk_user_id: 'user_123',
    email: 'buyer@example.com',
    entitlements: { smartvideo_go: true },
    status: 'active',
    source: 'stripe',
    stripe_customer_id: 'cus_123',
    stripe_subscription_id: null,
    created_at: '2026-10-01T00:00:00.000Z',
    updated_at: '2026-10-01T00:00:00.000Z',
    ...overrides,
  };
  db.user_entitlements = [row];
  return row;
}

async function loadModule() {
  vi.resetModules();
  return import('@/access/resolveAccess');
}

describe('entitlement revocation', () => {
  beforeEach(() => {
    db.user_entitlements = [];
    db.failures = [];
  });

  it('flips the row to inactive without deleting history', async () => {
    const seeded = seedRow();
    const { revokeEntitlement } = await loadModule();

    const result = await revokeEntitlement({ stripeCustomerId: 'cus_123' });

    expect(result).toEqual({ revoked: true, matched: 1, reason: 'revoked' });
    expect(db.user_entitlements).toHaveLength(1);

    const row = db.user_entitlements[0];
    expect(row.id).toBe(seeded.id);
    expect(row.status).toBe('inactive');
    expect(row.entitlements).toEqual({ smartvideo_go: true });
    expect(row.stripe_customer_id).toBe('cus_123');
    expect(row.updated_at).not.toBe(seeded.updated_at);
  });

  it('records the revocation reason', async () => {
    seedRow();
    const { revokeEntitlement } = await loadModule();

    const result = await revokeEntitlement(
      { clerkUserId: 'user_123' },
      { reason: 'charge.refunded' }
    );

    expect(result).toEqual({ revoked: true, matched: 1, reason: 'charge.refunded' });
    expect(db.user_entitlements[0].status).toBe('inactive');
  });

  it('matches rows by clerk user id', async () => {
    seedRow();
    const { revokeEntitlement } = await loadModule();

    const result = await revokeEntitlement({ clerkUserId: 'user_123' });

    expect(result.revoked).toBe(true);
    expect(db.user_entitlements[0].status).toBe('inactive');
  });

  it('matches rows by email, case-insensitively', async () => {
    seedRow();
    const { revokeEntitlement } = await loadModule();

    const result = await revokeEntitlement({ email: 'Buyer@Example.com' });

    expect(result.revoked).toBe(true);
    expect(db.user_entitlements[0].status).toBe('inactive');
  });

  it('reports no match instead of failing when nothing is found', async () => {
    seedRow();
    const { revokeEntitlement } = await loadModule();

    const result = await revokeEntitlement({ stripeCustomerId: 'cus_unknown' });

    expect(result).toEqual({ revoked: false, matched: 0, reason: 'revoked' });
    expect(db.user_entitlements[0].status).toBe('active');
  });

  it('throws when the update fails so Stripe can retry', async () => {
    seedRow();
    const { revokeEntitlement } = await loadModule();
    db.failures = [{ table: 'user_entitlements', op: 'update' }];

    await expect(revokeEntitlement({ clerkUserId: 'user_123' })).rejects.toThrow(
      'Failed to revoke entitlement'
    );
    expect(db.user_entitlements[0].status).toBe('active');
  });

  it('makes paid resolution return false for a revoked row', async () => {
    seedRow();
    const { resolveSmartVideoAccessForUser, revokeEntitlement } = await loadModule();

    const revoked = await revokeEntitlement({ clerkUserId: 'user_123' });
    expect(revoked.revoked).toBe(true);

    const access = await resolveSmartVideoAccessForUser('user_123');
    expect(access?.hasSmartVideoGo).toBe(false);
    expect(access?.status).toBe('inactive');
  });
});
