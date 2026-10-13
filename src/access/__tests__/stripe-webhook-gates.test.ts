import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the Stripe SDK: signature verification and session retrieval are driven
// from the tests. Hoisted so the factory can reference the handles before the
// route module (a static import target) is evaluated.
const stripeMocks = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  retrieveSession: vi.fn(),
}));

vi.mock('stripe', () => ({
  default: class Stripe {
    constructor(_key?: string, _opts?: unknown) {}
    webhooks = {
      constructEvent: stripeMocks.constructEvent,
    };
    checkout = {
      sessions: {
        retrieve: stripeMocks.retrieveSession,
      },
    };
  },
}));

vi.mock('@/src/lib/supabaseServer', () => ({
  getSupabaseAdmin: () => fakeSupabase,
}));

vi.mock('@/lib/supabaseServer', () => ({
  getSupabaseAdmin: () => fakeSupabase,
}));

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(async () => ({ userId: null })),
  currentUser: vi.fn(async () => null),
}));

type Row = Record<string, any>;

interface DbState {
  user_entitlements: Row[];
  stripe_webhook_events: Row[];
  failures: { table: string; op: string }[];
  upserts: Row[];
}

const db: DbState = {
  user_entitlements: [],
  stripe_webhook_events: [],
  failures: [],
  upserts: [],
};

const PRICE_LIFETIME = 'price_lifetime';

let idCounter = 0;
// The real schema defaults `id` to gen_random_uuid(); rows written by the
// webhook never carry one, so the fake assigns it.
function withId(row: Row): Row {
  idCounter += 1;
  return row.id ? row : { id: `ent_generated_${idCounter}`, ...row };
}

function matchesFilters(row: Row, filters: { column: string; value: any; isIn?: boolean }[]): boolean {
  return filters.every((filter) =>
    filter.isIn ? filter.value.includes(row[filter.column]) : row[filter.column] === filter.value
  );
}

function executeQuery(table: string, op: { kind: string; payload?: any; filters: any[]; onConflict?: string }) {
  const rows = db[table] || [];

  if (db.failures.some((failure) => failure.table === table && failure.op === op.kind)) {
    return { data: null, error: { code: '42501', message: `forced ${op.kind} failure on ${table}` } };
  }

  switch (op.kind) {
    case 'select': {
      const matched = rows.filter((row) => matchesFilters(row, op.filters));
      return { data: op.filters.length ? matched : rows, error: null };
    }
    case 'insert': {
      const inserted = Array.isArray(op.payload) ? op.payload : [op.payload];
      for (const row of inserted) {
        if (rows.some((existing) => existing.id === row.id)) {
          return { data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint' } };
        }
      }
      db[table] = [...rows, ...inserted.map((row) => withId(row))];
      return { data: inserted, error: null };
    }
    case 'update': {
      const matched = rows.filter((row) => matchesFilters(row, op.filters));
      const updated = matched.map((row) => ({ ...row, ...op.payload }));
      db[table] = rows.map((row) => updated.find((entry) => entry.id === row.id) || row);
      return { data: updated, error: null };
    }
    case 'delete': {
      const matched = rows.filter((row) => matchesFilters(row, op.filters));
      const removed = new Set(matched.map((row) => row.id));
      db[table] = rows.filter((row) => !removed.has(row.id));
      return { data: matched, error: null };
    }
    case 'upsert': {
      const rowsToWrite = Array.isArray(op.payload) ? op.payload : [op.payload];
      db.upserts = [...db.upserts, ...rowsToWrite.map((row) => ({ ...row }))];
      const next = [...rows];
      for (const row of rowsToWrite) {
        const conflictKey = op.onConflict || 'clerk_user_id';
        const index = next.findIndex((existing) => existing[conflictKey] === row[conflictKey]);
        if (index >= 0) {
          next[index] = { ...next[index], ...withId(row) };
        } else {
          next.push(withId(row));
        }
      }
      db[table] = next;
      return { data: rowsToWrite, error: null };
    }
    default:
      return { data: null, error: null };
  }
}

const fakeSupabase = {
  from(table: string) {
    const op: { kind: string; payload?: any; filters: any[]; onConflict?: string } = {
      kind: 'select',
      filters: [],
    };
    const builder: any = {};

    builder.select = () => {
      op.kind = 'select';
      return builder;
    };
    builder.insert = (payload: any) => {
      op.kind = 'insert';
      op.payload = payload;
      return builder;
    };
    builder.update = (payload: any) => {
      op.kind = 'update';
      op.payload = payload;
      return builder;
    };
    builder.upsert = (payload: any, options?: { onConflict?: string }) => {
      op.kind = 'upsert';
      op.payload = payload;
      op.onConflict = options?.onConflict;
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
      const { data, error } = executeQuery(table, op);
      return { data: Array.isArray(data) ? (data[0] ?? null) : (data ?? null), error };
    };
    builder.then = (resolve: any, reject: any) =>
      Promise.resolve(executeQuery(table, op)).then(resolve, reject);

    return builder;
  },
};

function setEnv(overrides: { secret?: string; webhookSecret?: string } = {}) {
  delete process.env.NEXT_PUBLIC_STRIPE_PRODUCT_MAP;
  delete process.env.STRIPE_PRODUCT_MAP;
  process.env.STRIPE_SECRET_KEY = overrides.secret ?? 'sk_test_123';
  process.env.STRIPE_WEBHOOK_SECRET = overrides.webhookSecret ?? 'whsec_test_123';
}

async function loadRoute(env: { secret?: string; webhookSecret?: string } = {}) {
  vi.resetModules();
  setEnv(env);
  return import('@/app/api/webhooks/stripe/route');
}

function makeRequest(payload: unknown) {
  return new NextRequest('http://localhost/api/webhooks/stripe', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'stripe-signature': 'stripe-signature-test' },
  });
}

function checkoutSessionEvent(overrides: Record<string, any> = {}) {
  return {
    id: 'evt_checkout_1',
    object: 'event',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_123',
        object: 'checkout.session',
        customer: 'cus_123',
        customer_details: { email: 'buyer@example.com' },
        customer_email: null,
        metadata: {
          clerk_user_id: 'user_123',
          entitlement: 'smartvideo_go',
          plan: 'pro_lifetime',
        },
        line_items: {
          data: [{ price: { id: PRICE_LIFETIME } }],
        },
        ...overrides,
      },
    },
  };
}

function chargeRefundedEvent(id = 'evt_refund_1', overrides: Record<string, any> = {}) {
  return {
    id,
    object: 'event',
    type: 'charge.refunded',
    data: {
      object: {
        id: 'ch_refund_1',
        object: 'charge',
        customer: 'cus_123',
        billing_details: { email: 'buyer@example.com' },
        receipt_email: 'buyer@example.com',
        metadata: {},
        ...overrides,
      },
    },
  };
}

function subscriptionEvent(
  id: string,
  type: string,
  status: string,
  overrides: Record<string, any> = {}
) {
  return {
    id,
    object: 'event',
    type,
    data: {
      object: {
        id: 'sub_123',
        object: 'subscription',
        customer: 'cus_123',
        status,
        metadata: {},
        ...overrides,
      },
    },
  };
}

function seedEntitlementRow(overrides: Record<string, any> = {}) {
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

describe('stripe webhook payment gates', () => {
  let route: { POST: (req: NextRequest) => Promise<Response> };

  beforeEach(async () => {
    db.user_entitlements = [];
    db.stripe_webhook_events = [];
    db.failures = [];
    db.upserts = [];
    stripeMocks.constructEvent.mockReset();
    stripeMocks.constructEvent.mockImplementation((body: string) => JSON.parse(body));
    stripeMocks.retrieveSession.mockReset();
    stripeMocks.retrieveSession.mockResolvedValue({ line_items: { data: [] } });
    route = await loadRoute();
  });

  describe('fail-closed checks', () => {
    it('returns 500 when STRIPE_SECRET_KEY is missing', async () => {
      const isolated = await loadRoute({ secret: '' });

      const res = await isolated.POST(makeRequest(checkoutSessionEvent()));

      expect(res.status).toBe(500);
      expect(db.upserts).toHaveLength(0);
    });

    it('returns 500 when STRIPE_WEBHOOK_SECRET is missing', async () => {
      const isolated = await loadRoute({ webhookSecret: '' });

      const res = await isolated.POST(makeRequest(checkoutSessionEvent()));

      expect(res.status).toBe(500);
      expect(db.upserts).toHaveLength(0);
    });

    it('returns 400 when signature verification fails', async () => {
      stripeMocks.constructEvent.mockImplementation(() => {
        throw new Error('No signatures found matching the expected signature');
      });

      const res = await route.POST(makeRequest(checkoutSessionEvent()));

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: 'Invalid signature' });
      expect(db.upserts).toHaveLength(0);
      expect(db.user_entitlements).toHaveLength(0);
    });
  });

  describe('checkout.session.completed (grant path unchanged)', () => {
    it('grants the entitlement for a mapped price', async () => {
      process.env.NEXT_PUBLIC_STRIPE_PRODUCT_MAP = JSON.stringify({
        [PRICE_LIFETIME]: 'smartvideo_go',
      });

      const res = await route.POST(makeRequest(checkoutSessionEvent()));

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ received: true });
      expect(db.user_entitlements).toHaveLength(1);

      const [row] = db.user_entitlements;
      expect(row).toMatchObject({
        clerk_user_id: 'user_123',
        email: 'buyer@example.com',
        entitlements: { smartvideo_go: true },
        status: 'active',
        source: 'stripe',
        stripe_customer_id: 'cus_123',
      });
    });

    it('keeps existing entitlements when re-granting', async () => {
      seedEntitlementRow({ entitlements: { founders: true } });
      process.env.STRIPE_PRODUCT_MAP = JSON.stringify({
        [PRICE_LIFETIME]: 'smartvideo_go',
      });

      const res = await route.POST(makeRequest(checkoutSessionEvent()));

      expect(res.status).toBe(200);
      expect(db.user_entitlements).toHaveLength(1);
      expect(db.user_entitlements[0].entitlements).toEqual({
        founders: true,
        smartvideo_go: true,
      });
      expect(db.user_entitlements[0].status).toBe('active');
    });

    it('falls back to the email-matched row when metadata has no clerk_user_id', async () => {
      seedEntitlementRow({ clerk_user_id: 'user_existing', entitlements: {}, status: 'inactive' });
      process.env.NEXT_PUBLIC_STRIPE_PRODUCT_MAP = JSON.stringify({
        [PRICE_LIFETIME]: 'smartvideo_go',
      });

      const res = await route.POST(
        makeRequest(checkoutSessionEvent({ metadata: { entitlement: 'smartvideo_go' } }))
      );

      expect(res.status).toBe(200);
      expect(db.user_entitlements).toHaveLength(1);
      expect(db.user_entitlements[0].clerk_user_id).toBe('user_existing');
      expect(db.user_entitlements[0].status).toBe('active');
      expect(db.user_entitlements[0].entitlements.smartvideo_go).toBe(true);
    });

    it('uses metadata.entitlement when the price map has no entry', async () => {
      const res = await route.POST(makeRequest(checkoutSessionEvent()));

      expect(res.status).toBe(200);
      expect(db.user_entitlements).toHaveLength(1);
      expect(db.user_entitlements[0]).toMatchObject({
        clerk_user_id: 'user_123',
        entitlements: { smartvideo_go: true },
        status: 'active',
        source: 'stripe',
      });
    });

    it('lets the price map entry win over metadata.entitlement', async () => {
      process.env.NEXT_PUBLIC_STRIPE_PRODUCT_MAP = JSON.stringify({
        [PRICE_LIFETIME]: 'founders',
      });

      const res = await route.POST(makeRequest(checkoutSessionEvent()));

      expect(res.status).toBe(200);
      expect(db.user_entitlements[0].entitlements).toEqual({ founders: true });
    });

    it('acks without a grant when the price is unmapped and metadata has no entitlement key', async () => {
      const res = await route.POST(
        makeRequest(
          checkoutSessionEvent({
            metadata: { clerk_user_id: 'user_123', plan: 'pro_lifetime' },
          })
        )
      );

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ received: true });
      expect(db.user_entitlements).toHaveLength(0);
    });

    it('returns 400 when the session has no customer email', async () => {
      process.env.NEXT_PUBLIC_STRIPE_PRODUCT_MAP = JSON.stringify({
        [PRICE_LIFETIME]: 'smartvideo_go',
      });

      const res = await route.POST(
        makeRequest(checkoutSessionEvent({ customer_details: undefined, customer_email: null }))
      );

      expect(res.status).toBe(400);
      expect(db.user_entitlements).toHaveLength(0);
    });

    it('returns 500 and releases the event claim when the grant fails', async () => {
      process.env.NEXT_PUBLIC_STRIPE_PRODUCT_MAP = JSON.stringify({
        [PRICE_LIFETIME]: 'smartvideo_go',
      });
      db.failures = [{ table: 'user_entitlements', op: 'upsert' }];

      const res = await route.POST(makeRequest(checkoutSessionEvent()));

      expect(res.status).toBe(500);
      expect(db.stripe_webhook_events).toHaveLength(0);
    });
  });

  describe('revocation events', () => {
    it('charge.refunded revokes the entitlement row by stripe_customer_id', async () => {
      seedEntitlementRow();

      const res = await route.POST(makeRequest(chargeRefundedEvent()));

      expect(res.status).toBe(200);
      expect(db.user_entitlements).toHaveLength(1);
      expect(db.user_entitlements[0].status).toBe('inactive');
      expect(db.user_entitlements[0].entitlements).toEqual({ smartvideo_go: true });
      expect(db.user_entitlements[0].stripe_customer_id).toBe('cus_123');
    });

    it('charge.refunded finds the row by email when the customer id is unknown', async () => {
      seedEntitlementRow({ stripe_customer_id: null });

      const res = await route.POST(
        makeRequest(chargeRefundedEvent('evt_refund_2', { customer: 'cus_other' }))
      );

      expect(res.status).toBe(200);
      expect(db.user_entitlements[0].status).toBe('inactive');
    });

    it('charge.dispute.created revokes the entitlement row', async () => {
      seedEntitlementRow();

      const res = await route.POST(makeRequest(chargeRefundedEvent('evt_dispute_1')));

      expect(res.status).toBe(200);
      expect(db.user_entitlements[0].status).toBe('inactive');
    });

    it('charge.refunded without a matching row is acked', async () => {
      const res = await route.POST(makeRequest(chargeRefundedEvent()));

      expect(res.status).toBe(200);
      expect(db.user_entitlements).toHaveLength(0);
    });

    it('customer.subscription.deleted revokes the entitlement row', async () => {
      seedEntitlementRow();

      const res = await route.POST(
        makeRequest(subscriptionEvent('evt_sub_deleted', 'customer.subscription.deleted', 'canceled'))
      );

      expect(res.status).toBe(200);
      expect(db.user_entitlements[0].status).toBe('inactive');
    });

    it('customer.subscription.updated revokes when the status is no longer active', async () => {
      seedEntitlementRow();

      const res = await route.POST(
        makeRequest(subscriptionEvent('evt_sub_past_due', 'customer.subscription.updated', 'past_due'))
      );

      expect(res.status).toBe(200);
      expect(db.user_entitlements[0].status).toBe('inactive');
    });

    it('customer.subscription.updated leaves an active subscription alone', async () => {
      seedEntitlementRow();

      const res = await route.POST(
        makeRequest(subscriptionEvent('evt_sub_active', 'customer.subscription.updated', 'active'))
      );

      expect(res.status).toBe(200);
      expect(db.user_entitlements[0].status).toBe('active');
    });
  });

  describe('idempotency', () => {
    it('skips a re-delivered event id', async () => {
      process.env.NEXT_PUBLIC_STRIPE_PRODUCT_MAP = JSON.stringify({
        [PRICE_LIFETIME]: 'smartvideo_go',
      });

      const first = await route.POST(makeRequest(checkoutSessionEvent()));
      expect(first.status).toBe(200);
      expect(db.user_entitlements[0].status).toBe('active');

      const replay = await route.POST(makeRequest(checkoutSessionEvent()));
      expect(replay.status).toBe(200);
      expect(db.stripe_webhook_events).toHaveLength(1);
    });

    it('a replayed checkout.session.completed cannot re-grant after a refund', async () => {
      process.env.NEXT_PUBLIC_STRIPE_PRODUCT_MAP = JSON.stringify({
        [PRICE_LIFETIME]: 'smartvideo_go',
      });

      await route.POST(makeRequest(checkoutSessionEvent()));
      expect(db.user_entitlements[0].status).toBe('active');

      await route.POST(makeRequest(chargeRefundedEvent()));
      expect(db.user_entitlements[0].status).toBe('inactive');

      const replay = await route.POST(makeRequest(checkoutSessionEvent()));
      expect(replay.status).toBe(200);
      expect(db.user_entitlements[0].status).toBe('inactive');
    });

    it('does not record a claim for events that are not processed', async () => {
      const res = await route.POST(
        makeRequest({ id: 'evt_pi_1', type: 'payment_intent.succeeded', data: { object: {} } })
      );

      expect(res.status).toBe(200);
      expect(db.stripe_webhook_events).toHaveLength(0);

      const unhandled = await route.POST(
        makeRequest({ id: 'evt_invoice_1', type: 'invoice.paid', data: { object: {} } })
      );

      expect(unhandled.status).toBe(200);
      expect(db.stripe_webhook_events).toHaveLength(0);
    });

    it('keeps processing when the idempotency ledger is unavailable', async () => {
      process.env.NEXT_PUBLIC_STRIPE_PRODUCT_MAP = JSON.stringify({
        [PRICE_LIFETIME]: 'smartvideo_go',
      });
      db.failures = [{ table: 'stripe_webhook_events', op: 'insert' }];

      const res = await route.POST(makeRequest(checkoutSessionEvent()));

      expect(res.status).toBe(200);
      expect(db.user_entitlements[0].status).toBe('active');
      expect(db.stripe_webhook_events).toHaveLength(0);
    });
  });
});
