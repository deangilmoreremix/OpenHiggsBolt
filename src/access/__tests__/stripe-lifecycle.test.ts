import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks. `vi.hoisted` keeps the handles alive across `vi.resetModules()` so the
// mocked Stripe webhook verifier and the mocked Supabase admin client can be
// re-seeded per test.
// ---------------------------------------------------------------------------
const h = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  supabase: { current: null as any },
}));

// Mock Stripe SDK to avoid requiring a real API key during tests
vi.mock('stripe', () => ({
  default: class Stripe {
    webhooks = {
      constructEvent: h.constructEvent,
    };
    checkout = {
      sessions: {
        retrieve: async () => ({ line_items: { data: [] } }),
      },
    };
  },
}));

// Mock both possible import paths for supabase server; both point at the same
// module once the vite aliases are resolved.
vi.mock('@/src/lib/supabaseServer', () => ({
  getSupabaseAdmin: () => h.supabase.current,
}));
vi.mock('@/lib/supabaseServer', () => ({
  getSupabaseAdmin: () => h.supabase.current,
}));

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(async () => ({ userId: 'user_buyer' })),
  currentUser: vi.fn(async () => ({
    id: 'user_buyer',
    emailAddresses: [{ emailAddress: 'buyer@example.com' }],
  })),
}));

import { getStripeProductMap, resolveEntitlementFromSession } from '@/app/api/webhooks/stripe/route';

// ---------------------------------------------------------------------------
// Minimal in-memory Supabase stand-in: a chainable/thenable query builder over
// plain arrays, supporting the operations the access layer performs.
// ---------------------------------------------------------------------------
type Row = Record<string, any>;

interface Filter {
  col: string;
  compare: (value: any) => boolean;
}

function createFakeSupabase(seed: { user_entitlements?: Row[]; user_purchases?: Row[] } = {}) {
  const tables: Record<string, Row[]> = {
    user_entitlements: (seed.user_entitlements || []).map((row) => ({ ...row })),
    user_purchases: (seed.user_purchases || []).map((row) => ({ ...row })),
  };
  let seq = 0;

  function run(state: any): Promise<Row[]> {
    const rows = tables[state.table] || [];
    const matches = (row: Row) => state.filters.every((f: Filter) => f.compare(row[f.col]));

    if (state.op === 'select') {
      let result = rows.filter(matches).map((row) => ({ ...row }));
      if (state.order) {
        const { col, ascending } = state.order;
        result = result.sort((a, b) => {
          const av = a[col] ?? '';
          const bv = b[col] ?? '';
          if (av === bv) return 0;
          return (av < bv ? -1 : 1) * (ascending ? 1 : -1);
        });
      }
      if (state.limit != null) result = result.slice(0, state.limit);
      return Promise.resolve(result);
    }

    if (state.op === 'update') {
      const affected = rows.filter(matches);
      for (const row of affected) Object.assign(row, state.payload);
      return Promise.resolve(affected.map((row) => ({ ...row })));
    }

    if (state.op === 'delete') {
      const removed = rows.filter(matches);
      tables[state.table] = rows.filter((row) => !matches(row));
      return Promise.resolve(removed.map((row) => ({ ...row })));
    }

    // insert / upsert
    const payloads = Array.isArray(state.payload) ? state.payload : [state.payload];
    const conflictCols: string[] = state.onConflict ? [state.onConflict] : [];
    const written: Row[] = [];

    for (const payload of payloads) {
      const existing = conflictCols.length
        ? rows.find((row) => conflictCols.every((col) => row[col] === payload[col]))
        : undefined;

      if (existing) {
        // onConflict update: replace the provided columns only
        Object.assign(existing, payload);
        written.push(existing);
      } else {
        seq += 1;
        const row: Row = { id: `row_${seq}`, created_at: new Date().toISOString(), ...payload };
        rows.push(row);
        written.push(row);
      }
    }

    return Promise.resolve(written.map((row) => ({ ...row })));
  }

  function from(table: string) {
    const state: any = {
      table,
      op: 'select',
      filters: [],
      payload: null,
      onConflict: '',
      order: null,
      limit: null,
    };

    const builder: any = {
      select: () => builder,
      insert: (payload: Row) => {
        state.op = 'insert';
        state.payload = payload;
        return builder;
      },
      upsert: (payload: Row, opts?: { onConflict?: string }) => {
        state.op = 'upsert';
        state.payload = payload;
        state.onConflict = opts?.onConflict || '';
        return builder;
      },
      update: (payload: Row) => {
        state.op = 'update';
        state.payload = payload;
        return builder;
      },
      delete: () => {
        state.op = 'delete';
        return builder;
      },
      eq: (col: string, value: any) => {
        state.filters.push({ col, compare: (v: any) => v === value });
        return builder;
      },
      neq: (col: string, value: any) => {
        state.filters.push({ col, compare: (v: any) => v !== value });
        return builder;
      },
      in: (col: string, values: any[]) => {
        state.filters.push({ col, compare: (v: any) => values.includes(v) });
        return builder;
      },
      order: (col: string, opts?: { ascending?: boolean }) => {
        state.order = { col, ascending: opts?.ascending !== false };
        return builder;
      },
      limit: (n: number) => {
        state.limit = n;
        return builder;
      },
      maybeSingle: () => run(state).then((rows) => ({ data: rows[0] ?? null, error: null })),
      single: () => run(state).then((rows) => ({ data: rows[0] ?? null, error: null })),
      then: (onFulfilled: any, onRejected: any) =>
        run(state)
          .then((rows) => ({ data: rows, error: null }))
          .then(onFulfilled, onRejected),
    };

    return builder;
  }

  return { from, tables };
}

// ---------------------------------------------------------------------------
// Event builders
// ---------------------------------------------------------------------------
function stripeEvent(type: string, object: Row, id = 'evt_test_1') {
  return { id, type, object: 'event', livemode: false, data: { object } };
}

function checkoutSession(overrides: Row = {}) {
  return {
    id: 'cs_test_123',
    object: 'checkout.session',
    mode: 'payment',
    payment_status: 'paid',
    customer: 'cus_123',
    customer_details: { email: 'buyer@example.com', name: 'Buyer' },
    customer_email: null,
    line_items: { data: [{ price: { id: 'price_go' } }] },
    amount_total: 4900,
    currency: 'usd',
    livemode: false,
    metadata: {},
    ...overrides,
  };
}

function subscription(overrides: Row = {}) {
  return {
    id: 'sub_test_123',
    object: 'subscription',
    customer: 'cus_sub_123',
    status: 'active',
    items: { data: [{ price: { id: 'price_go' } }] },
    metadata: {},
    ...overrides,
  };
}

function makeRequest(event: Row) {
  return {
    text: async () => JSON.stringify(event),
    headers: { get: () => 'sig_test' },
  } as any;
}

async function loadWebhook() {
  process.env.STRIPE_SECRET_KEY = 'sk_test_123';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123';
  process.env.STRIPE_PRODUCT_MAP = JSON.stringify({ price_go: 'smartvideo_go' });
  return import('@/app/api/webhooks/stripe/route');
}

function seedWebhook(event: Row) {
  h.constructEvent.mockReturnValue(event);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('stripe webhook lifecycle', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.NEXT_PUBLIC_STRIPE_PRODUCT_MAP;
    delete process.env.STRIPE_PRODUCT_MAP;
  });

  describe('product mapping (contract preserved)', () => {
    it('keeps getStripeProductMap and resolveEntitlementFromSession behavior', () => {
      process.env.STRIPE_PRODUCT_MAP = JSON.stringify({ price_go: 'smartvideo_go' });
      expect(getStripeProductMap()).toEqual({ price_go: 'smartvideo_go' });
      expect(resolveEntitlementFromSession(checkoutSession() as any)).toBe('smartvideo_go');
      expect(resolveEntitlementFromSession(checkoutSession({ line_items: { data: [] } }) as any)).toBe('');
    });
  });

  it('(a) checkout.session.completed with clerk_user_id grants and records the purchase', async () => {
    h.supabase.current = createFakeSupabase();
    const { POST } = await loadWebhook();
    seedWebhook(stripeEvent('checkout.session.completed', checkoutSession({ metadata: { clerk_user_id: 'user_buyer', stripe_subscription_id: 'sub_test_123' } })));

    const res = await POST(makeRequest({ id: 'evt_checkout_1', type: 'checkout.session.completed' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true });

    const entitlements = h.supabase.current.tables.user_entitlements;
    expect(entitlements).toHaveLength(1);
    expect(entitlements[0]).toMatchObject({
      clerk_user_id: 'user_buyer',
      email: 'buyer@example.com',
      status: 'active',
      source: 'stripe',
      stripe_customer_id: 'cus_123',
      entitlements: { smartvideo_go: true },
    });

    const purchases = h.supabase.current.tables.user_purchases;
    expect(purchases).toHaveLength(1);
    expect(purchases[0]).toMatchObject({
      clerk_user_id: 'user_buyer',
      email: 'buyer@example.com',
      stripe_session_id: 'cs_test_123',
      stripe_customer_id: 'cus_123',
      entitlement_key: 'smartvideo_go',
      amount_total: 4900,
      currency: 'usd',
      purchase_status: 'paid',
    });
  });

  it('(a2) duplicate checkout events stay idempotent', async () => {
    h.supabase.current = createFakeSupabase();
    const { POST } = await loadWebhook();
    const event = stripeEvent('checkout.session.completed', checkoutSession({ metadata: { clerk_user_id: 'user_buyer' } }));
    seedWebhook(event);

    await POST(makeRequest(event));
    const res = await POST(makeRequest(event));
    expect(res.status).toBe(200);

    expect(h.supabase.current.tables.user_entitlements).toHaveLength(1);
    expect(h.supabase.current.tables.user_purchases).toHaveLength(1);
    expect(h.supabase.current.tables.user_purchases[0].purchase_status).toBe('paid');
  });

  it('(b) without clerk id but an existing email row grants to that row only', async () => {
    h.supabase.current = createFakeSupabase({
      user_entitlements: [
        {
          id: 'ent_existing',
          clerk_user_id: 'user_existing',
          email: 'buyer@example.com',
          entitlements: {},
          status: 'pending',
          source: 'manual',
        },
      ],
    });
    const { POST } = await loadWebhook();
    seedWebhook(stripeEvent('checkout.session.completed', checkoutSession()));

    const res = await POST(makeRequest(stripeEvent('checkout.session.completed', checkoutSession())));
    expect(res.status).toBe(200);

    const entitlements = h.supabase.current.tables.user_entitlements;
    expect(entitlements).toHaveLength(1);
    expect(entitlements[0]).toMatchObject({
      clerk_user_id: 'user_existing',
      email: 'buyer@example.com',
      status: 'lifetime',
      entitlements: { smartvideo_go: true },
    });
  });

  it('(c) without either, the email-keyed row is created so the purchase is not dropped', async () => {
    h.supabase.current = createFakeSupabase();
    const { POST } = await loadWebhook();
    seedWebhook(stripeEvent('checkout.session.completed', checkoutSession({ customer_details: { email: 'NEW.Buyer@Example.com ' } })));

    const res = await POST(makeRequest(stripeEvent('checkout.session.completed', checkoutSession({ customer_details: { email: 'NEW.Buyer@Example.com ' } }))));
    expect(res.status).toBe(200);

    const entitlements = h.supabase.current.tables.user_entitlements;
    expect(entitlements).toHaveLength(1);
    expect(entitlements[0]).toMatchObject({
      clerk_user_id: 'email:new.buyer@example.com',
      email: 'new.buyer@example.com',
      status: 'active',
      entitlements: { smartvideo_go: true },
    });

    // The purchase is still recorded in the ledger.
    expect(h.supabase.current.tables.user_purchases).toHaveLength(1);

    // The email-only placeholder must never grant access to a real Clerk user.
    const { resolveSmartVideoAccessForUser } = await import('@/access/resolveAccess');
    const access = await resolveSmartVideoAccessForUser('user_real');
    expect(access).not.toBeNull();
    expect(access!.hasSmartVideoGo).toBe(false);

    // ...and the email-keyed row is not readable as a paid row via status alone
    const { isQualifyingStatus, QUALIFYING_STATUSES } = await import('@/access/entitlements');
    expect(QUALIFYING_STATUSES).toEqual(['active', 'lifetime']);
    expect(isQualifyingStatus('revoked')).toBe(false);
    expect(isQualifyingStatus('pending')).toBe(false);
    expect(isQualifyingStatus('expired')).toBe(false);
    expect(isQualifyingStatus(undefined)).toBe(true);
  });

  it('(c2) a repeat email-only purchase merges instead of duplicating rows', async () => {
    h.supabase.current = createFakeSupabase();
    const { POST } = await loadWebhook();
    seedWebhook(stripeEvent('checkout.session.completed', checkoutSession()));

    await POST(makeRequest(stripeEvent('checkout.session.completed', checkoutSession(), 'evt_1')));
    await POST(makeRequest(stripeEvent('checkout.session.completed', checkoutSession(), 'evt_2')));

    const entitlements = h.supabase.current.tables.user_entitlements;
    expect(entitlements).toHaveLength(1);
    expect(entitlements[0].clerk_user_id).toBe('email:buyer@example.com');
    // The ledger still holds one row per checkout session.
    expect(h.supabase.current.tables.user_purchases).toHaveLength(1);
  });

  it('(d) a refund marks the purchase refunded and revokes the entitlement', async () => {
    h.supabase.current = createFakeSupabase({
      user_entitlements: [
        {
          id: 'ent_1',
          clerk_user_id: 'user_buyer',
          email: 'buyer@example.com',
          entitlements: { smartvideo_go: true },
          status: 'active',
          source: 'stripe',
          stripe_customer_id: 'cus_123',
        },
      ],
      user_purchases: [
        {
          id: 'purchase_1',
          clerk_user_id: 'user_buyer',
          email: 'buyer@example.com',
          stripe_session_id: 'cs_test_123',
          stripe_payment_intent_id: 'pi_123',
          stripe_customer_id: 'cus_123',
          purchase_status: 'paid',
          created_at: '2026-10-14T00:00:00.000Z',
          updated_at: '2026-10-14T00:00:00.000Z',
        },
      ],
    });
    const { POST } = await loadWebhook();
    const event = stripeEvent('charge.refunded', {
      id: 'ch_123',
      payment_intent: 'pi_123',
      customer: 'cus_123',
      receipt_email: 'buyer@example.com',
      amount_refunded: 4900,
    });
    seedWebhook(event);

    const res = await POST(makeRequest(event));
    expect(res.status).toBe(200);

    expect(h.supabase.current.tables.user_purchases[0].purchase_status).toBe('refunded');
    expect(h.supabase.current.tables.user_entitlements[0]).toMatchObject({
      status: 'revoked',
      entitlements: { smartvideo_go: true },
    });
    expect(String(h.supabase.current.tables.user_entitlements[0].revoked_reason)).toContain('charge.refunded');

    // Idempotent: a duplicate refund event changes nothing further.
    const res2 = await POST(makeRequest(event));
    expect(res2.status).toBe(200);
    expect(h.supabase.current.tables.user_entitlements[0].status).toBe('revoked');

    // Revoked rows no longer qualify for access.
    const { resolveSmartVideoAccessForUser } = await import('@/access/resolveAccess');
    const access = await resolveSmartVideoAccessForUser('user_buyer');
    expect(access!.hasSmartVideoGo).toBe(false);
  });

  it('(d2) a dispute marks the purchase disputed and revokes', async () => {
    h.supabase.current = createFakeSupabase({
      user_entitlements: [
        {
          id: 'ent_1',
          clerk_user_id: 'user_buyer',
          email: 'buyer@example.com',
          entitlements: { smartvideo_go: true },
          status: 'active',
          source: 'stripe',
        },
      ],
      user_purchases: [
        {
          id: 'purchase_1',
          clerk_user_id: 'user_buyer',
          email: 'buyer@example.com',
          stripe_session_id: 'cs_test_123',
          stripe_payment_intent_id: 'pi_123',
          purchase_status: 'paid',
          created_at: '2026-10-14T00:00:00.000Z',
        },
      ],
    });
    const { POST } = await loadWebhook();
    const event = stripeEvent('charge.dispute.created', {
      id: 'dp_123',
      payment_intent: 'pi_123',
      charge: 'ch_123',
      status: 'needs_response',
    });
    seedWebhook(event);

    const res = await POST(makeRequest(event));
    expect(res.status).toBe(200);
    expect(h.supabase.current.tables.user_purchases[0].purchase_status).toBe('disputed');
    expect(h.supabase.current.tables.user_entitlements[0].status).toBe('revoked');
  });

  it('(d3) refund.created also revokes', async () => {
    h.supabase.current = createFakeSupabase({
      user_entitlements: [
        {
          id: 'ent_1',
          clerk_user_id: 'user_buyer',
          email: 'buyer@example.com',
          entitlements: { smartvideo_go: true },
          status: 'active',
          source: 'stripe',
          stripe_customer_id: 'cus_123',
        },
      ],
      user_purchases: [
        {
          id: 'purchase_1',
          clerk_user_id: 'user_buyer',
          email: 'buyer@example.com',
          stripe_session_id: 'cs_test_123',
          stripe_payment_intent_id: 'pi_123',
          purchase_status: 'paid',
          created_at: '2026-10-14T00:00:00.000Z',
        },
      ],
    });
    const { POST } = await loadWebhook();
    const event = stripeEvent('refund.created', { id: 're_123', payment_intent: 'pi_123', customer: 'cus_123' });
    seedWebhook(event);

    const res = await POST(makeRequest(event));
    expect(res.status).toBe(200);
    expect(h.supabase.current.tables.user_purchases[0].purchase_status).toBe('refunded');
    expect(h.supabase.current.tables.user_entitlements[0].status).toBe('revoked');
  });

  it('(e) subscription.deleted expires the entitlement; subscription.created activates it', async () => {
    h.supabase.current = createFakeSupabase({
      user_entitlements: [
        {
          id: 'ent_1',
          clerk_user_id: 'user_buyer',
          email: 'buyer@example.com',
          entitlements: { smartvideo_go: true },
          status: 'active',
          source: 'stripe',
          stripe_customer_id: 'cus_sub_123',
          stripe_subscription_id: 'sub_test_123',
        },
      ],
    });
    const { POST } = await loadWebhook();

    const deleted = stripeEvent('customer.subscription.deleted', subscription({ status: 'canceled' }));
    seedWebhook(deleted);
    let res = await POST(makeRequest(deleted));
    expect(res.status).toBe(200);
    expect(h.supabase.current.tables.user_entitlements[0].status).toBe('expired');

    const created = stripeEvent('customer.subscription.created', subscription({ status: 'trialing' }));
    seedWebhook(created);
    res = await POST(makeRequest(created));
    expect(res.status).toBe(200);
    expect(h.supabase.current.tables.user_entitlements[0].status).toBe('active');
  });

  it('(e2) subscription updates resolve targets through the purchase ledger', async () => {
    h.supabase.current = createFakeSupabase({
      user_entitlements: [
        {
          id: 'ent_1',
          clerk_user_id: 'email:buyer@example.com',
          email: 'buyer@example.com',
          entitlements: { smartvideo_go: true },
          status: 'active',
          source: 'stripe',
        },
      ],
      user_purchases: [
        {
          id: 'purchase_1',
          clerk_user_id: null,
          email: 'buyer@example.com',
          stripe_session_id: 'cs_test_123',
          stripe_customer_id: 'cus_sub_123',
          purchase_status: 'paid',
          created_at: '2026-10-14T00:00:00.000Z',
        },
      ],
    });
    const { POST } = await loadWebhook();
    const deleted = stripeEvent('customer.subscription.deleted', subscription({ status: 'unpaid' }));
    seedWebhook(deleted);

    const res = await POST(makeRequest(deleted));
    expect(res.status).toBe(200);
    expect(h.supabase.current.tables.user_entitlements[0]).toMatchObject({
      clerk_user_id: 'email:buyer@example.com',
      status: 'expired',
    });
  });

  it('(f) restore adopts an email-keyed row and reports already_active', async () => {
    h.supabase.current = createFakeSupabase({
      user_entitlements: [
        {
          id: 'ent_1',
          clerk_user_id: 'email:buyer@example.com',
          email: 'buyer@example.com',
          entitlements: { smartvideo_go: true },
          status: 'active',
          source: 'stripe',
        },
      ],
    });

    const { restoreAccessByEmail } = await import('@/access/resolveAccess');

    const result = await restoreAccessByEmail('user_buyer', 'buyer@example.com');
    expect(result.status).toBe('already_active');

    const entitlements = h.supabase.current.tables.user_entitlements;
    expect(entitlements).toHaveLength(1);
    expect(entitlements[0].clerk_user_id).toBe('user_buyer');

    // Repeated restore stays idempotent and never duplicates the row.
    const again = await restoreAccessByEmail('user_buyer', 'buyer@example.com');
    expect(again.status).toBe('already_active');
    expect(h.supabase.current.tables.user_entitlements).toHaveLength(1);

    // After adoption the caller resolves as paid.
    const { resolveSmartVideoAccessForUser } = await import('@/access/resolveAccess');
    const access = await resolveSmartVideoAccessForUser('user_buyer');
    expect(access!.hasSmartVideoGo).toBe(true);
  });

  it('(f2) restore grants when the adopted row has no entitlement yet', async () => {
    h.supabase.current = createFakeSupabase({
      user_entitlements: [
        {
          id: 'ent_1',
          clerk_user_id: 'email:buyer@example.com',
          email: 'buyer@example.com',
          entitlements: {},
          status: 'pending',
          source: 'stripe',
        },
      ],
    });

    const { restoreAccessByEmail } = await import('@/access/resolveAccess');
    const result = await restoreAccessByEmail('user_buyer', 'buyer@example.com');
    expect(result.status).toBe('restored');

    const entitlements = h.supabase.current.tables.user_entitlements;
    expect(entitlements).toHaveLength(1);
    expect(entitlements[0]).toMatchObject({
      clerk_user_id: 'user_buyer',
      entitlements: { smartvideo_go: true },
      status: 'lifetime',
    });
  });

  it('(f3) restore keeps the caller-owned row and returns already_active', async () => {
    h.supabase.current = createFakeSupabase({
      user_entitlements: [
        {
          id: 'ent_own',
          clerk_user_id: 'user_buyer',
          email: 'buyer@example.com',
          entitlements: { smartvideo_go: true },
          status: 'active',
          source: 'stripe',
        },
        {
          id: 'ent_email',
          clerk_user_id: 'email:buyer@example.com',
          email: 'buyer@example.com',
          entitlements: { smartvideo_go: true },
          status: 'active',
          source: 'stripe',
        },
      ],
    });

    const { restoreAccessByEmail } = await import('@/access/resolveAccess');
    const result = await restoreAccessByEmail('user_buyer', 'buyer@example.com');
    expect(result.status).toBe('already_active');

    const own = h.supabase.current.tables.user_entitlements.find((r: Row) => r.id === 'ent_own');
    expect(own.clerk_user_id).toBe('user_buyer');
  });

  it('(f4) restore returns not_found when no purchase exists for the email', async () => {
    h.supabase.current = createFakeSupabase();
    const { restoreAccessByEmail } = await import('@/access/resolveAccess');
    const result = await restoreAccessByEmail('user_buyer', 'buyer@example.com');
    expect(result.status).toBe('not_found');
  });

  it('(g) an unmapped price is a silent no-op and never throws', async () => {
    h.supabase.current = createFakeSupabase();
    const { POST } = await loadWebhook();
    const session = checkoutSession({ line_items: { data: [{ price: { id: 'price_unknown' } }] } });
    const event = stripeEvent('checkout.session.completed', session);
    seedWebhook(event);

    const res = await POST(makeRequest(event));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true });
    expect(h.supabase.current.tables.user_entitlements).toHaveLength(0);
    expect(h.supabase.current.tables.user_purchases).toHaveLength(0);
  });

  it('(h) only qualifying statuses grant access; legacy rows without a status keep it', async () => {
    h.supabase.current = createFakeSupabase({
      user_entitlements: [
        { id: 'ent_legacy', clerk_user_id: 'user_legacy', email: 'legacy@example.com', entitlements: { smartvideo_go: true }, source: 'manual' },
        { id: 'ent_preview', clerk_user_id: 'user_preview', email: 'preview@example.com', entitlements: { smartvideo_go: true }, status: 'preview' },
        { id: 'ent_pending', clerk_user_id: 'user_pending', email: 'pending@example.com', entitlements: { smartvideo_go: true }, status: 'pending' },
        { id: 'ent_expired', clerk_user_id: 'user_expired', email: 'expired@example.com', entitlements: { smartvideo_go: true }, status: 'expired' },
        { id: 'ent_lifetime', clerk_user_id: 'user_lifetime', email: 'lifetime@example.com', entitlements: { smartvideo_go: true }, status: 'lifetime' },
      ],
    });

    const { resolveSmartVideoAccessForUser } = await import('@/access/resolveAccess');

    // Pre-existing rows created before the status column keep access.
    expect((await resolveSmartVideoAccessForUser('user_legacy'))!.hasSmartVideoGo).toBe(true);
    expect((await resolveSmartVideoAccessForUser('user_lifetime'))!.hasSmartVideoGo).toBe(true);
    // Non-qualifying statuses never grant paid functionality.
    expect((await resolveSmartVideoAccessForUser('user_preview'))!.hasSmartVideoGo).toBe(false);
    expect((await resolveSmartVideoAccessForUser('user_pending'))!.hasSmartVideoGo).toBe(false);
    expect((await resolveSmartVideoAccessForUser('user_expired'))!.hasSmartVideoGo).toBe(false);
  });

  it('(g2) unmapped subscription prices and unknown events are no-ops', async () => {
    h.supabase.current = createFakeSupabase();
    const { POST } = await loadWebhook();

    const unmapped = stripeEvent('customer.subscription.updated', subscription({ items: { data: [{ price: { id: 'price_unknown' } }] } }));
    seedWebhook(unmapped);
    let res = await POST(makeRequest(unmapped));
    expect(res.status).toBe(200);
    expect(h.supabase.current.tables.user_entitlements).toHaveLength(0);

    const unknown = stripeEvent('invoice.payment_failed', { id: 'in_123' });
    seedWebhook(unknown);
    res = await POST(makeRequest(unknown));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true });

    // payment_intent.succeeded is acknowledged, unchanged.
    const piEvent = stripeEvent('payment_intent.succeeded', { id: 'pi_123' });
    seedWebhook(piEvent);
    res = await POST(makeRequest(piEvent));
    expect(res.status).toBe(200);
  });

  // ---------------------------------------------------------------------------
  // Phase 8: Lifetime / subscription interaction scenarios
  // ---------------------------------------------------------------------------

  it('one-time purchase receives lifetime status', async () => {
    h.supabase.current = createFakeSupabase();
    const { POST } = await loadWebhook();
    seedWebhook(
      stripeEvent('checkout.session.completed',
        checkoutSession({ metadata: { clerk_user_id: 'user_lifetime' } }))
    );

    const res = await POST(makeRequest({ id: 'evt_lifetime', type: 'checkout.session.completed' }));
    expect(res.status).toBe(200);

    const row = h.supabase.current.tables.user_entitlements[0];
    expect(row.status).toBe('lifetime');
    expect(row.entitlements).toEqual({ smartvideo_go: true });

    const { resolveSmartVideoAccessForUser } = await import('@/access/resolveAccess');
    const access = await resolveSmartVideoAccessForUser('user_lifetime');
    expect(access!.hasSmartVideoGo).toBe(true);
  });

  it('subscription purchase receives active (not lifetime) status', async () => {
    h.supabase.current = createFakeSupabase();
    const { POST } = await loadWebhook();
    const session = checkoutSession({
      mode: 'subscription',
      metadata: { clerk_user_id: 'user_sub', stripe_subscription_id: 'sub_test_123' },
    });
    seedWebhook(stripeEvent('checkout.session.completed', session));

    const res = await POST(makeRequest({ id: 'evt_sub', type: 'checkout.session.completed' }));
    expect(res.status).toBe(200);

    const row = h.supabase.current.tables.user_entitlements[0];
    expect(row.status).toBe('active');
  });

  it('subscription cancellation does NOT revoke a lifetime entitlement', async () => {
    h.supabase.current = createFakeSupabase({
      user_entitlements: [
        {
          id: 'ent_lt',
          clerk_user_id: 'user_mixed',
          email: 'buyer@example.com',
          entitlements: { smartvideo_go: true },
          status: 'lifetime',
          source: 'stripe',
          stripe_customer_id: 'cus_mixed',
        },
      ],
      user_purchases: [],
    });
    const { POST } = await loadWebhook();
    const deleted = stripeEvent('customer.subscription.deleted', subscription({
      status: 'canceled',
      customer: 'cus_mixed',
    }));
    seedWebhook(deleted);

    const res = await POST(makeRequest(deleted));
    expect(res.status).toBe(200);

    // The lifetime status must survive the subscription deletion.
    const row = h.supabase.current.tables.user_entitlements[0];
    expect(row.status).toBe('lifetime');

    const { resolveSmartVideoAccessForUser } = await import('@/access/resolveAccess');
    const access = await resolveSmartVideoAccessForUser('user_mixed');
    expect(access!.hasSmartVideoGo).toBe(true);
  });

  it('subscription cancellation DOES expire a non-lifetime entitlement', async () => {
    h.supabase.current = createFakeSupabase({
      user_entitlements: [
        {
          id: 'ent_1',
          clerk_user_id: 'user_sub',
          email: 'buyer@example.com',
          entitlements: { smartvideo_go: true },
          status: 'active',
          source: 'stripe',
          stripe_customer_id: 'cus_sub_123',
        },
      ],
    });
    const { POST } = await loadWebhook();
    const deleted = stripeEvent('customer.subscription.deleted', subscription({ status: 'canceled' }));
    seedWebhook(deleted);

    const res = await POST(makeRequest(deleted));
    expect(res.status).toBe(200);

    const row = h.supabase.current.tables.user_entitlements[0];
    expect(row.status).toBe('expired');
  });

  it('founders entitlement survives even when status is non-qualifying', async () => {
    h.supabase.current = createFakeSupabase({
      user_entitlements: [
        {
          id: 'ent_founder',
          clerk_user_id: 'user_founder',
          email: 'founder@example.com',
          entitlements: { smartvideo_go: true, founders: true },
          status: 'expired', // subscription canceled, but founders grant survives
          source: 'manual',
        },
      ],
    });

    const { resolveSmartVideoAccessForUser } = await import('@/access/resolveAccess');
    const access = await resolveSmartVideoAccessForUser('user_founder');
    expect(access!.hasSmartVideoGo).toBe(true);
  });

  it('lifetime status with smartvideo_go grants access', async () => {
    h.supabase.current = createFakeSupabase({
      user_entitlements: [
        {
          id: 'ent_l',
          clerk_user_id: 'user_lt',
          email: 'lt@example.com',
          entitlements: { smartvideo_go: true },
          status: 'lifetime',
          source: 'stripe',
        },
      ],
    });

    const { resolveSmartVideoAccessForUser } = await import('@/access/resolveAccess');
    const access = await resolveSmartVideoAccessForUser('user_lt');
    expect(access!.hasSmartVideoGo).toBe(true);
    expect(access!.status).toBe('lifetime');
  });
});
