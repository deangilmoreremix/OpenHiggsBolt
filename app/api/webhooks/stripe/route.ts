import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/src/lib/supabaseServer';
import { grantEntitlement, revokeEntitlement } from '@/access/resolveAccess';
import { ENTITLEMENTS } from '@/access/entitlements';

export const dynamic = "force-dynamic";

export const runtime = 'nodejs';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

let stripe: Stripe | null = null;
if (STRIPE_SECRET_KEY) {
  stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2026-08-26.dahlia',
  });
}

const IDEMPOTENCY_TABLE = 'stripe_webhook_events';

// Entitlement keys that may be granted from checkout session metadata.
const METADATA_ENTITLEMENT_KEYS = new Set<string>(Object.values(ENTITLEMENTS));

// Events whose side effects are applied to Supabase. Everything else (including
// payment_intent.succeeded) is acknowledged without mutation.
const HANDLED_EVENTS = new Set<string>([
  'checkout.session.completed',
  'charge.refunded',
  'charge.dispute.created',
  'customer.subscription.deleted',
  'customer.subscription.updated',
]);

interface RevokeTarget {
  clerkUserId?: string;
  email?: string;
  stripeCustomerId?: string;
}

class WebhookStatusError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function getStripeProductMap(): Record<string, string> {
  const envMap = (process.env.NEXT_PUBLIC_STRIPE_PRODUCT_MAP ||
    process.env.STRIPE_PRODUCT_MAP ||
    '{}').trim();

  try {
    const parsed = JSON.parse(envMap) as Record<string, string>;
    return { ...parsed };
  } catch {
    console.error('[stripe webhook] invalid STRIPE_PRODUCT_MAP JSON');
    return {};
  }
}

export function resolveEntitlementFromSession(session: Stripe.Checkout.Session): string {
  const lineItems = session.line_items?.data || [];
  const priceId = lineItems[0]?.price?.id || '';

  if (!priceId) {
    return '';
  }

  const map = getStripeProductMap();
  const mapped = map[priceId];
  if (mapped) return mapped;

  return '';
}

// Fallback used when the price map has no entry for the purchased price. Only
// values that are real entitlement keys are accepted; `plan` metadata (e.g.
// pro_lifetime) is display data, never an entitlement key.
export function resolveEntitlementFromMetadata(session: Stripe.Checkout.Session): string {
  const metadata = (session?.metadata || {}) as Record<string, unknown>;
  const value = typeof metadata.entitlement === 'string' ? metadata.entitlement.trim() : '';

  if (!value) return '';
  return METADATA_ENTITLEMENT_KEYS.has(value) ? value : '';
}

async function resolveEntitlementFromSessionId(sessionId: string): Promise<string> {
  if (!stripe) {
    return '';
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items'],
    });

    return resolveEntitlementFromSession(session);
  } catch (err) {
    console.error('[stripe webhook] failed to retrieve session line items:', err);
    return '';
  }
}

type EventClaim = 'claimed' | 'duplicate' | 'unavailable';

// Claims a Stripe event id before any mutation. A duplicate claim means the
// event was already processed (or is in flight) and must be skipped. Insert
// failures (e.g. a ledger table that has not been migrated yet) are best
// effort: they never block grants or revocations.
async function claimWebhookEvent(event: Stripe.Event): Promise<EventClaim> {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from(IDEMPOTENCY_TABLE)
      .insert({ id: event.id, type: event.type });

    if (!error) {
      return 'claimed';
    }

    if (error.code === '23505') {
      return 'duplicate';
    }

    console.warn('[stripe webhook] idempotency ledger unavailable, processing anyway:', error.message);
    return 'unavailable';
  } catch (err: any) {
    console.warn(
      '[stripe webhook] idempotency ledger unavailable, processing anyway:',
      err?.message || err
    );
    return 'unavailable';
  }
}

// Releases a claim so a failed delivery can be retried by Stripe instead of
// being permanently treated as processed.
async function releaseWebhookEvent(event: Stripe.Event): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from(IDEMPOTENCY_TABLE).delete().eq('id', event.id);
  } catch (err: any) {
    console.warn('[stripe webhook] failed to release event claim:', err?.message || err);
  }
}

async function handleCheckoutSessionCompleted(event: Stripe.Event): Promise<void> {
  const session = event.data.object as Stripe.Checkout.Session;
  const customerEmail = session.customer_details?.email || session.customer_email;
  const customerId = session.customer as string | undefined;
  const metadata = (session.metadata || {}) as Record<string, string>;
  const clerkUserId = metadata.clerk_user_id;

  if (!customerEmail) {
    throw new WebhookStatusError(400, 'No customer email');
  }

  let entitlementKey = resolveEntitlementFromSession(session);
  if (!entitlementKey) {
    entitlementKey = resolveEntitlementFromMetadata(session);
  }
  if (!entitlementKey) {
    entitlementKey = await resolveEntitlementFromSessionId(session.id);
  }

  if (!entitlementKey) {
    console.warn('[stripe webhook] unmapped price for session:', session.id);
    return;
  }

  const normalizedEmail = customerEmail.toLowerCase().trim();
  const supabase = getSupabaseAdmin();

  if (clerkUserId) {
    await grantEntitlement(clerkUserId, normalizedEmail, entitlementKey, 'stripe', {
      stripe_customer_id: customerId,
      stripe_subscription_id: metadata.stripe_subscription_id,
    });
  } else {
    const { data: existingUser } = await supabase
      .from('user_entitlements')
      .select('clerk_user_id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingUser?.clerk_user_id) {
      await grantEntitlement(existingUser.clerk_user_id, normalizedEmail, entitlementKey, 'stripe', {
        stripe_customer_id: customerId,
        stripe_subscription_id: metadata.stripe_subscription_id,
      });
    }
  }
}

function chargeRevocationTarget(charge: Stripe.Charge): RevokeTarget {
  return {
    clerkUserId: charge.metadata?.clerk_user_id,
    email: charge.billing_details?.email || charge.receipt_email || undefined,
    stripeCustomerId: typeof charge.customer === 'string' ? charge.customer : undefined,
  };
}

function subscriptionRevocationTarget(subscription: Stripe.Subscription): RevokeTarget {
  return {
    clerkUserId: subscription.metadata?.clerk_user_id,
    stripeCustomerId: typeof subscription.customer === 'string' ? subscription.customer : undefined,
  };
}

async function revokeForCharge(event: Stripe.Event): Promise<void> {
  const charge = event.data.object as Stripe.Charge;
  await revokeForTarget(chargeRevocationTarget(charge), charge.id, event.type);
}

async function revokeForSubscription(event: Stripe.Event): Promise<void> {
  const subscription = event.data.object as Stripe.Subscription;

  if (event.type === 'customer.subscription.updated' && subscription.status === 'active') {
    return;
  }

  await revokeForTarget(subscriptionRevocationTarget(subscription), subscription.id, event.type);
}

async function revokeForTarget(
  target: RevokeTarget,
  objectId: string,
  reason: string
): Promise<void> {
  if (!target.clerkUserId && !target.email && !target.stripeCustomerId) {
    console.warn(`[stripe webhook] no revocation target for ${reason}:`, objectId);
    return;
  }

  const result = await revokeEntitlement(target, { reason });

  if (!result.revoked) {
    console.warn(`[stripe webhook] no entitlement row matched ${reason}:`, objectId);
    return;
  }

  console.log(
    `[stripe webhook] revoked ${result.matched} entitlement row(s) for ${reason}:`,
    objectId
  );
}

async function routeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event);
      return;
    case 'charge.refunded':
    case 'charge.dispute.created':
      await revokeForCharge(event);
      return;
    case 'customer.subscription.deleted':
    case 'customer.subscription.updated':
      await revokeForSubscription(event);
      return;
    default:
      return;
  }
}

export async function POST(req: NextRequest) {
  if (!STRIPE_SECRET_KEY) {
    console.error('[stripe webhook] STRIPE_SECRET_KEY is not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  if (!STRIPE_WEBHOOK_SECRET) {
    console.error('[stripe webhook] STRIPE_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const body = await req.text();
  const signature = req.headers.get('stripe-signature') || '';

  let event: Stripe.Event;
  try {
    event = stripe!.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('[stripe webhook] signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Payment intents are acknowledged but not processed here; entitlement
  // provisioning is driven by checkout.session.completed.
  if (event.type === 'payment_intent.succeeded') {
    return NextResponse.json({ received: true });
  }

  if (!HANDLED_EVENTS.has(event.type)) {
    return NextResponse.json({ received: true });
  }

  // Idempotency: a re-delivered event id (for example a checkout.session.completed
  // replayed after a refund) is skipped before any grant or revocation runs.
  const claim = await claimWebhookEvent(event);
  if (claim === 'duplicate') {
    console.log('[stripe webhook] duplicate event skipped:', event.id);
    return NextResponse.json({ received: true });
  }

  try {
    await routeEvent(event);
    return NextResponse.json({ received: true });
  } catch (err: any) {
    // Drop the claim so Stripe's retry can reprocess the event.
    await releaseWebhookEvent(event);

    if (err instanceof WebhookStatusError) {
      console.error(`[stripe webhook] rejected ${event.type}:`, err.message);
      return NextResponse.json({ error: err.message }, { status: err.status });
    }

    console.error(`[stripe webhook] failed to process ${event.type}:`, err?.message || err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
