/**
 * Regression tests for the Stripe webhook -> entitlement lifecycle.
 *
 * These tests are offline and deterministic: the Stripe SDK and the Supabase
 * client are replaced by controllable fakes, so no network, no Stripe account
 * and no database are required. The suite pins the money-path contract:
 *
 *  - signature verification is mandatory (unsigned / invalid signatures are
 *    rejected before any entitlement mutation runs)
 *  - the webhook fails closed when Stripe is not configured
 *  - checkout.session.completed grants exactly one entitlement row
 *  - a re-delivered event id never double-grants or re-grants a revoked row
 *  - failed payments grant nothing
 *  - refunds and subscription cancellations revoke access while keeping the row
 *  - a refund only affects the purchaser's row: an existing lifetime purchaser
 *    keeps access (the preservation invariant)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the Stripe SDK: signature verification and session retrieval are driven
// from the tests. Hoisted so the factory can reference the handles before the
// route module (a static import target) is evaluated.
const stripeMocks = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  retrieveSession: vi.fn(),
  retrieveCharge: vi.fn(),
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
    charges = {
      retrieve: stripeMocks.retrieveCharge,
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
  updates: Row[];
}

const db: DbState = {
  user_entitlements: [],
  stripe_webhook_events: [],
  failures: [],
  upserts: [],
  updates: [],
};

const PRICE_LIFETIME = 'price_e2e_lifetime';
const PRICE_FOUNDERS = 'price_e2e_founders';

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
      db.updates.push(...op.payload ? [op.payload] : []);
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

function makeRequest(payload: unknown, signature = 'stripe-signature-test') {
  return new NextRequest('http://localhost/api/webhooks/stripe', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: signature ? { 'stripe-signature': signature } : {},
  });
}

function checkoutSessionEvent(id = 'evt_rebuild_purchase_1', overrides: Record<string, any> = {}) {
  return {
    id,
    object: 'event',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_rebuild_1',
        object: 'checkout.session',
        customer: 'cus_rebuild_1',
        customer_details: { email: 'New.Buyer@Example.com' },
        customer_email: null,
        mode: 'payment',
        payment_status: 'paid',
        metadata: {
          clerk_user_id: 'user_rebuild_buyer',
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

function chargeRefundedEvent(id = 'evt_rebuild_refund_1', overrides: Record<string, any> = {}) {
  return {
    id,
    object: 'event',
    type: 'charge.refunded',
    data: {
      object: {
        id: 'ch_rebuild_1',
        object: 'charge',
        customer: 'cus_rebuild_1',
        amount_refunded: 29900,
        refunded: true,
        billing_details: { email: 'new.buyer@example.com' },
        receipt_email: 'new.buyer@example.com',
        metadata: {},
        ...overrides,
      },
    },
  };
}

function subscriptionEvent(id: string, type: string, status: string, overrides: Record<string, any> = {}) {
  return {
    id,
    object: 'event',
    type,
    data: {
      object: {
        id: 'sub_rebuild_1',
        object: 'subscription',
        customer: 'cus_rebuild_1',
        status,
        metadata: {},
        ...overrides,
      },
    },
  };
}

/** A pre-existing lifetime purchaser that must survive unrelated refunds. */
function seedLifetimePurchaser() {
  const row: Row = {
    id: 'ent_lifetime_1',
    clerk_user_id: 'user_lifetime_buyer',
    email: 'lifetime@example.com',
    entitlements: { smartvideo_go: true },
    status: 'active',
    source: 'stripe',
    stripe_customer_id: 'cus_lifetime_1',
    stripe_subscription_id: null,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
  };
  db.user_entitlements.push(row);
  return row;
}

function rowFor(clerkUserId: string): Row | undefined {
  return db.user_entitlements.find((row) => row.clerk_user_id === clerkUserId);
}

describe('zz-stripe: webhook entitlement lifecycle', () => {
  let route: { POST: (req: NextRequest) => Promise<Response> };

  beforeEach(async () => {
    db.user_entitlements = [];
    db.stripe_webhook_events = [];
    db.failures = [];
    db.upserts = [];
    db.updates = [];
    stripeMocks.constructEvent.mockReset();
    stripeMocks.constructEvent.mockImplementation((body: string) => JSON.parse(body));
    stripeMocks.retrieveSession.mockReset();
    stripeMocks.retrieveSession.mockResolvedValue({ line_items: { data: [] } });
    stripeMocks.retrieveCharge.mockReset();
    stripeMocks.retrieveCharge.mockResolvedValue({
      id: 'ch_rebuild_1',
      customer: 'cus_rebuild_1',
      billing_details: { email: 'new.buyer@example.com' },
      receipt_email: 'new.buyer@example.com',
      metadata: {},
    });
    route = await loadRoute();
    // Set after loading the route: loadRoute() resets the module AND clears the
    // price-map env vars, while the route reads the map lazily per event.
    process.env.NEXT_PUBLIC_STRIPE_PRODUCT_MAP = JSON.stringify({
      [PRICE_LIFETIME]: 'smartvideo_go',
      [PRICE_FOUNDERS]: 'founders',
    });
  });

  describe('signature verification (fail closed)', () => {
    it('rejects a webhook delivered with an invalid signature', async () => {
      stripeMocks.constructEvent.mockImplementation(() => {
        throw new Error('No signatures found matching the expected signature for the given payload');
      });

      const res = await route.POST(makeRequest(checkoutSessionEvent()));

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: 'Invalid signature' });
      expect(db.user_entitlements).toHaveLength(0);
      expect(db.stripe_webhook_events).toHaveLength(0);
    });

    it('rejects a webhook delivered with no signature header at all', async () => {
      stripeMocks.constructEvent.mockImplementation(() => {
        throw new Error('No stripe-signature header value was provided');
      });

      const res = await route.POST(makeRequest(checkoutSessionEvent(), ''));

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: 'Invalid signature' });
      expect(db.user_entitlements).toHaveLength(0);
    });

    it('rejects a stale-timestamp signature instead of replaying an old event', async () => {
      stripeMocks.constructEvent.mockImplementation(() => {
        throw new Error('Timestamp outside the tolerance zone');
      });

      const res = await route.POST(makeRequest(checkoutSessionEvent(), 't=1,v1=stale'));

      expect(res.status).toBe(400);
      expect(db.user_entitlements).toHaveLength(0);
    });

    it('returns 500 when STRIPE_SECRET_KEY is not configured', async () => {
      const isolated = await loadRoute({ secret: '' });

      const res = await isolated.POST(makeRequest(checkoutSessionEvent()));

      expect(res.status).toBe(500);
      expect(db.upserts).toHaveLength(0);
    });

    it('returns 500 when STRIPE_WEBHOOK_SECRET is not configured', async () => {
      const isolated = await loadRoute({ webhookSecret: '' });

      const res = await isolated.POST(makeRequest(checkoutSessionEvent()));

      expect(res.status).toBe(500);
      expect(db.upserts).toHaveLength(0);
      expect(db.user_entitlements).toHaveLength(0);
    });
  });

  describe('checkout.session.completed grants the entitlement', () => {
    it('creates exactly one row with the purchaser identity and normalized email', async () => {
      const res = await route.POST(makeRequest(checkoutSessionEvent()));

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ received: true });

      const rows = db.user_entitlements.filter((r) => r.clerk_user_id === 'user_rebuild_buyer');
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        clerk_user_id: 'user_rebuild_buyer',
        email: 'new.buyer@example.com',
        entitlements: { smartvideo_go: true },
        status: 'active',
        source: 'stripe',
        stripe_customer_id: 'cus_rebuild_1',
      });
    });

    it('grants the entitlement exactly once when the same event is re-delivered', async () => {
      // db.upserts also records the purchase-ledger write (upserted by the
      // checkout flow since the PR #60 purchase ledger); the grant-exactly-once
      // contract is about the ENTITLEMENT upsert.
      const entitlementUpserts = () => db.upserts.filter((u) => 'entitlements' in u);

      const first = await route.POST(makeRequest(checkoutSessionEvent('evt_idem_1')));
      expect(first.status).toBe(200);
      expect(entitlementUpserts()).toHaveLength(1);

      const second = await route.POST(makeRequest(checkoutSessionEvent('evt_idem_1')));
      expect(second.status).toBe(200);

      const rows = db.user_entitlements.filter((r) => r.clerk_user_id === 'user_rebuild_buyer');
      expect(rows).toHaveLength(1);
      expect(rows[0].status).toBe('active');
      expect(db.stripe_webhook_events).toHaveLength(1);
      expect(entitlementUpserts()).toHaveLength(1);
    });

    it('resolves the entitlement from the price map carried in the event line items', async () => {
      const res = await route.POST(makeRequest(checkoutSessionEvent('evt_price_map_event_1', {
        metadata: { clerk_user_id: 'user_rebuild_buyer' },
      })));

      expect(res.status).toBe(200);
      expect(rowFor('user_rebuild_buyer')?.entitlements).toEqual({ smartvideo_go: true });
    });

    it('resolves the entitlement from the price map by retrieving the session when line items are not expanded', async () => {
      stripeMocks.retrieveSession.mockResolvedValue({
        line_items: { data: [{ price: { id: PRICE_LIFETIME } }] },
      });

      const res = await route.POST(makeRequest(checkoutSessionEvent('evt_price_map_retrieve_1', {
        line_items: undefined,
        metadata: { clerk_user_id: 'user_rebuild_buyer' },
      })));

      expect(res.status).toBe(200);
      expect(stripeMocks.retrieveSession).toHaveBeenCalledWith('cs_rebuild_1', { expand: ['line_items'] });
      expect(rowFor('user_rebuild_buyer')?.entitlements).toEqual({ smartvideo_go: true });
    });

    it('grants nothing when the price is unmapped and metadata carries no entitlement key', async () => {
      const res = await route.POST(makeRequest(checkoutSessionEvent('evt_unmapped_1', {
        line_items: { data: [{ price: { id: 'price_not_configured' } }] },
        metadata: { clerk_user_id: 'user_rebuild_buyer', plan: 'pro_lifetime' },
      })));

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ received: true });
      expect(db.user_entitlements).toHaveLength(0);
      expect(db.stripe_webhook_events).toHaveLength(1);
    });

    it('attaches the grant to the row already matched by email when no clerk id is present', async () => {
      db.user_entitlements.push({
        id: 'ent_existing_1',
        clerk_user_id: 'user_existing_purchaser',
        email: 'new.buyer@example.com',
        entitlements: { founders: true },
        status: 'inactive',
        source: 'manual',
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z',
      });

      const res = await route.POST(makeRequest(checkoutSessionEvent('evt_email_match_1', {
        metadata: { entitlement: 'smartvideo_go' },
      })));

      expect(res.status).toBe(200);
      const rows = db.user_entitlements.filter((r) => r.email === 'new.buyer@example.com');
      expect(rows).toHaveLength(1);
      expect(rows[0].clerk_user_id).toBe('user_existing_purchaser');
      expect(rows[0].status).toBe('active');
      expect(rows[0].entitlements).toEqual({ founders: true, smartvideo_go: true });
    });

    it('releases the idempotency claim when the grant fails so Stripe can retry', async () => {
      db.failures = [{ table: 'user_entitlements', op: 'upsert' }];

      const res = await route.POST(makeRequest(checkoutSessionEvent('evt_grant_fail_1')));

      expect(res.status).toBe(500);
      expect(db.stripe_webhook_events).toHaveLength(0);
      expect(db.user_entitlements).toHaveLength(0);
    });

    it('rejects a session with no customer email so the grant cannot be orphaned', async () => {
      const res = await route.POST(makeRequest(checkoutSessionEvent('evt_no_email_1', {
        customer_details: undefined,
        customer_email: null,
      })));

      expect(res.status).toBe(400);
      expect(db.user_entitlements).toHaveLength(0);
    });
  });

  describe('failed payments grant nothing', () => {
    it('acks payment_intent.payment_failed without granting an entitlement', async () => {
      const res = await route.POST(makeRequest({
        id: 'evt_pi_failed_1',
        object: 'event',
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_failed_1',
            object: 'payment_intent',
            customer: 'cus_rebuild_1',
            status: 'requires_payment_method',
            last_payment_error: { code: 'card_declined', message: 'Your card was declined.' },
            metadata: {},
          },
        },
      }));

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ received: true });
      expect(db.user_entitlements).toHaveLength(0);
      expect(db.upserts).toHaveLength(0);
    });

    it('acks invoice.payment_failed without granting an entitlement', async () => {
      const res = await route.POST(makeRequest({
        id: 'evt_invoice_failed_1',
        object: 'event',
        type: 'invoice.payment_failed',
        data: {
          object: {
            id: 'in_failed_1',
            object: 'invoice',
            customer: 'cus_rebuild_1',
            amount_due: 29900,
            attempt_count: 1,
            metadata: {},
          },
        },
      }));

      expect(res.status).toBe(200);
      expect(db.user_entitlements).toHaveLength(0);
      expect(db.stripe_webhook_events).toHaveLength(0);
    });

    it('acks checkout.session.async_payment_failed without granting an entitlement', async () => {
      const res = await route.POST(makeRequest({
        id: 'evt_async_failed_1',
        object: 'event',
        type: 'checkout.session.async_payment_failed',
        data: {
          object: {
            id: 'cs_async_1',
            object: 'checkout.session',
            customer: 'cus_rebuild_1',
            customer_details: { email: 'new.buyer@example.com' },
            metadata: { clerk_user_id: 'user_rebuild_buyer', entitlement: 'smartvideo_go' },
          },
        },
      }));

      expect(res.status).toBe(200);
      expect(db.user_entitlements).toHaveLength(0);
    });
  });

  describe('refund and subscription-status handling', () => {
    it('charge.refunded revokes access but keeps the purchased entitlements on the row', async () => {
      await route.POST(makeRequest(checkoutSessionEvent('evt_grant_for_refund_1')));
      expect(rowFor('user_rebuild_buyer')?.status).toBe('active');

      const res = await route.POST(makeRequest(chargeRefundedEvent('evt_rebuild_refund_1')));

      expect(res.status).toBe(200);
      const row = rowFor('user_rebuild_buyer');
      expect(row).toBeDefined();
      expect(row?.status).toBe('inactive');
      expect(row?.entitlements).toEqual({ smartvideo_go: true });
      expect(row?.stripe_customer_id).toBe('cus_rebuild_1');
    });

    it('a refund only revokes the purchaser it belongs to — a lifetime purchaser keeps access', async () => {
      seedLifetimePurchaser();
      await route.POST(makeRequest(checkoutSessionEvent('evt_grant_before_refund_2')));

      const res = await route.POST(makeRequest(chargeRefundedEvent('evt_rebuild_refund_2')));

      expect(res.status).toBe(200);
      expect(rowFor('user_rebuild_buyer')?.status).toBe('inactive');

      // Preservation invariant: the unrelated lifetime purchase is untouched.
      const lifetime = rowFor('user_lifetime_buyer');
      expect(lifetime?.status).toBe('active');
      expect(lifetime?.entitlements).toEqual({ smartvideo_go: true });
      expect(lifetime?.stripe_customer_id).toBe('cus_lifetime_1');
    });

    it('a refunded purchase cannot be restored by re-delivering the original purchase event', async () => {
      await route.POST(makeRequest(checkoutSessionEvent('evt_replay_grant_1')));
      await route.POST(makeRequest(chargeRefundedEvent('evt_replay_refund_1')));
      expect(rowFor('user_rebuild_buyer')?.status).toBe('inactive');

      const res = await route.POST(makeRequest(checkoutSessionEvent('evt_replay_grant_1')));

      expect(res.status).toBe(200);
      expect(rowFor('user_rebuild_buyer')?.status).toBe('inactive');
    });

    it('charge.dispute.created revokes access via a real (Dispute-shaped) payload', async () => {
      await route.POST(makeRequest(checkoutSessionEvent('evt_grant_for_dispute_1')));

      // A real `charge.dispute.created` payload is a Dispute: it carries only
      // the charge id — no customer id, no email, no metadata.
      const res = await route.POST(makeRequest({
        id: 'evt_rebuild_dispute_1',
        object: 'event',
        type: 'charge.dispute.created',
        data: {
          object: {
            id: 'dp_rebuild_1',
            object: 'dispute',
            charge: 'ch_rebuild_1',
            payment_intent: 'pi_rebuild_1',
            amount: 29900,
            reason: 'fraudulent',
            status: 'needs_response',
            metadata: {},
          },
        },
      }));

      expect(res.status).toBe(200);
      expect(stripeMocks.retrieveCharge).toHaveBeenCalledWith('ch_rebuild_1');
      expect(rowFor('user_rebuild_buyer')?.status).toBe('inactive');
    });

    it('a dispute whose disputed charge cannot be resolved is acked, never granted', async () => {
      seedLifetimePurchaser();
      stripeMocks.retrieveCharge.mockRejectedValue(Object.assign(new Error('no such charge'), { code: 'resource_missing' }));

      const res = await route.POST(makeRequest({
        id: 'evt_rebuild_dispute_2',
        object: 'event',
        type: 'charge.dispute.created',
        data: { object: { id: 'dp_rebuild_2', object: 'dispute', charge: 'ch_unknown', metadata: {} } },
      }));

      expect(res.status).toBe(200);
      expect(rowFor('user_lifetime_buyer')?.status).toBe('active');
      expect(rowFor('user_rebuild_buyer')).toBeUndefined();
    });

    it('customer.subscription.deleted revokes access', async () => {
      seedLifetimePurchaser();
      await route.POST(makeRequest(checkoutSessionEvent('evt_grant_for_sub_1')));

      const res = await route.POST(makeRequest(
        subscriptionEvent('evt_rebuild_sub_deleted', 'customer.subscription.deleted', 'canceled')
      ));

      expect(res.status).toBe(200);
      expect(rowFor('user_rebuild_buyer')?.status).toBe('inactive');
      expect(rowFor('user_lifetime_buyer')?.status).toBe('active');
    });

    it('customer.subscription.updated revokes only when the status is no longer active', async () => {
      await route.POST(makeRequest(checkoutSessionEvent('evt_grant_for_sub_2')));

      const stillActive = await route.POST(makeRequest(
        subscriptionEvent('evt_rebuild_sub_active', 'customer.subscription.updated', 'active')
      ));
      expect(stillActive.status).toBe(200);
      expect(rowFor('user_rebuild_buyer')?.status).toBe('active');

      const pastDue = await route.POST(makeRequest(
        subscriptionEvent('evt_rebuild_sub_past_due', 'customer.subscription.updated', 'past_due')
      ));
      expect(pastDue.status).toBe(200);
      expect(rowFor('user_rebuild_buyer')?.status).toBe('inactive');
    });

    it('revocation with no matching row is acked rather than failing the delivery', async () => {
      const res = await route.POST(makeRequest(chargeRefundedEvent('evt_rebuild_refund_nomatch')));

      expect(res.status).toBe(200);
      expect(db.user_entitlements).toHaveLength(0);
    });
  });
});
