import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/src/lib/supabaseServer';
import {
  emailOnlyClerkId,
  grantEntitlement,
  recordEmailOnlyPurchase,
  revokeEntitlement,
  setEntitlementStatus,
} from '@/access/resolveAccess';
import { ENTITLEMENTS, type EntitlementStatus } from '@/access/entitlements';
import { getResellerPackageIdForPriceId } from '@/lib/reseller/packages';
import { applyResellerPurchase } from '@/lib/reseller/entitlements';

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
  'refund.created',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
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

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

function idOf(value: any): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && typeof value.id === 'string') return value.id;
  return '';
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

// ---------------------------------------------------------------------------
// Activation is webhook-only.
//
// The checkout success URL (`/?purchase=success&session_id=...`) grants NOTHING.
// It is a landing page anybody can visit or guess, so paid functionality must
// never be unlocked merely because someone landed on it. Every entitlement
// change in this repo is driven exclusively by the signature-verified Stripe
// events handled below, which means a purchase only becomes durable once
// Stripe has actually confirmed it (and refunds/disputes revoke it).
// ---------------------------------------------------------------------------

async function recordPurchase(params: {
  sessionId: string;
  clerkUserId: string | null;
  email: string;
  customerId: string;
  paymentIntentId: string;
  priceId: string;
  entitlementKey: string;
  amountTotal: number | null;
  currency: string | null;
  livemode: boolean;
  metadata: Record<string, any>;
}): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from('user_purchases')
    .upsert(
      {
        clerk_user_id: params.clerkUserId,
        email: params.email,
        stripe_session_id: params.sessionId,
        stripe_customer_id: params.customerId || null,
        stripe_payment_intent_id: params.paymentIntentId || null,
        stripe_price_id: params.priceId || null,
        entitlement_key: params.entitlementKey || null,
        amount_total: params.amountTotal,
        currency: params.currency,
        purchase_status: 'paid',
        livemode: params.livemode,
        metadata: params.metadata || {},
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'stripe_session_id' }
    );

  if (error) {
    console.error('[stripe webhook] failed to record purchase:', error);
    throw new Error('Failed to record purchase');
  }
}

type EventClaim = 'claimed' | 'duplicate' | 'unavailable';

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
  const customerEmail = session.customer_details?.email || session.customer_email || '';
  const customerId = idOf(session.customer);
  const metadata = (session.metadata || {}) as Record<string, string>;
  const clerkUserId = metadata.clerk_user_id || '';
  const subscriptionId =
    metadata.stripe_subscription_id || idOf(session.subscription) || '';
  const paymentIntentId = idOf(session.payment_intent);

  if (!customerEmail) {
    throw new WebhookStatusError(400, 'No customer email');
  }

  const normalizedEmail = normalizeEmail(customerEmail);

  // ── Reseller commerce (ADDITIVE) ──────────────────────────────────────────
  // Reseller packages (apps_studio_diy / apps_studio_training) are sold with
  // their own Stripe price IDs, configured via RESELLER_STRIPE_PRICE_* env
  // vars. When a completed checkout matches a reseller price, grant the
  // reseller entitlement(s) via applyResellerPurchase (which falls back to
  // email-based Clerk id lookup) and record the purchase in
  // reseller_purchases, then stop. Non-reseller prices fall through to the
  // existing entitlement handling below, unchanged.
  let sessionPriceId = session.line_items?.data?.[0]?.price?.id || '';
  let resellerPackageId = getResellerPackageIdForPriceId(sessionPriceId);
  if (!sessionPriceId && stripe) {
    // The webhook payload can omit line items; retrieve the session so a
    // reseller price is still resolved (same fallback the entitlement path
    // below uses).
    try {
      const retrieved = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ['line_items'],
      });
      sessionPriceId =
        (retrieved as Stripe.Checkout.Session).line_items?.data?.[0]?.price?.id || '';
      resellerPackageId = getResellerPackageIdForPriceId(sessionPriceId);
    } catch (err: any) {
      console.warn('[stripe webhook] failed to retrieve session for reseller check:', err?.message || err);
    }
  }
  if (resellerPackageId) {
    try {
      await applyResellerPurchase({
        clerkUserId: clerkUserId || null,
        email: normalizedEmail,
        packageId: resellerPackageId,
        stripeSessionId: session.id,
        stripeCustomerId: customerId,
        amountTotal: session.amount_total ?? null,
        currency: session.currency ?? null,
      });
    } catch (err: any) {
      console.error('[stripe webhook] reseller purchase failed:', err?.message || err);
      throw err;
    }
    return;
  }
  // ── End reseller commerce (ADDITIVE) ──────────────────────────────────────

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

  // (a) Record the verified purchase first: it must never be dropped.
  await recordPurchase({
    sessionId: session.id,
    clerkUserId: clerkUserId || null,
    email: normalizedEmail,
    customerId,
    paymentIntentId,
    priceId: session.line_items?.data?.[0]?.price?.id || '',
    entitlementKey,
    amountTotal: session.amount_total ?? null,
    currency: session.currency ?? null,
    livemode: Boolean(session.livemode),
    metadata: {
      checkout_mode: session.mode || null,
      payment_status: session.payment_status || null,
      stripe_subscription_id: subscriptionId || null,
    },
  });

  const grantOpts: any = {
    stripe_customer_id: customerId || undefined,
    stripe_subscription_id: subscriptionId || undefined,
  };

  // (b) Grant by the Clerk id captured at checkout when there is one.
  if (clerkUserId) {
    await grantEntitlement(clerkUserId, normalizedEmail, entitlementKey, 'stripe', grantOpts);
    return;
  }

  // (c) Otherwise match an existing row for the buyer's email.
  const supabase = getSupabaseAdmin();
  const { data: existingUser } = await supabase
    .from('user_entitlements')
    .select('clerk_user_id')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (existingUser?.clerk_user_id) {
    await grantEntitlement(existingUser.clerk_user_id, normalizedEmail, entitlementKey, 'stripe', grantOpts);
    return;
  }

  // (d) No Clerk account and no existing row: record an email-keyed row so the
  // purchase is never dropped. `restoreAccessByEmail` adopts it later once the
  // buyer signs in with the verified email. The placeholder key can never
  // satisfy hasSmartVideoGo for a real Clerk user.
  await recordEmailOnlyPurchase(normalizedEmail, entitlementKey, {
    stripe_customer_id: customerId || undefined,
    stripe_subscription_id: subscriptionId || undefined,
    source: 'stripe',
  });
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
  if (event.type === 'charge.dispute.created') {
    const dispute = event.data.object as Stripe.Dispute;
    const chargeRef = dispute.charge;

    if (typeof chargeRef !== 'string' || !chargeRef) {
      console.warn(`[stripe webhook] dispute ${dispute.id} has no charge reference`);
      return;
    }

    if (!stripe) {
      console.warn('[stripe webhook] stripe client unavailable for dispute charge lookup');
      return;
    }

    let charge: Stripe.Charge;
    try {
      charge = await stripe.charges.retrieve(chargeRef);
    } catch (err: any) {
      console.warn(
        `[stripe webhook] failed to retrieve charge for dispute ${dispute.id}:`,
        err?.message || err
      );
      return;
    }

    await revokeForTarget(chargeRevocationTarget(charge), charge.id, event.type);
    return;
  }

  const charge = event.data.object as Stripe.Charge;
  await revokeForTarget(chargeRevocationTarget(charge), charge.id, event.type);
}

/**
 * Refund / dispute handling: mark the ledger purchase and revoke the matching
 * entitlement row(s). Matching is by stripe payment intent, stripe customer id
 * and email, so both real Clerk rows and email-only placeholder rows are
 * revoked. Repeated events are no-ops.
 */
async function handleRefundLike(
  object: any,
  purchaseStatus: 'refunded' | 'disputed',
  reason: string
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const paymentIntentId = idOf(object.payment_intent);
  const customerId = idOf(object.customer);
  const objectEmail = object.receipt_email || object.billing_details?.email || '';

  const clerkUserIds = new Set<string>();
  const emails = new Set<string>();
  const customerIds = new Set<string>();

  if (paymentIntentId) {
    const { data: purchases, error } = await supabase
      .from('user_purchases')
      .select('*')
      .eq('stripe_payment_intent_id', paymentIntentId);

    if (error) {
      console.error('[stripe webhook] purchase lookup failed:', error);
      throw new Error('Failed to look up purchase');
    }

    const matched = purchases || [];
    if (matched.length > 0) {
      const { error: updateError } = await supabase
        .from('user_purchases')
        .update({ purchase_status: purchaseStatus, updated_at: new Date().toISOString() })
        .eq('stripe_payment_intent_id', paymentIntentId);

      if (updateError) {
        console.error(`[stripe webhook] failed to mark purchase ${purchaseStatus}:`, updateError);
        throw new Error('Failed to update purchase status');
      }
    }

    for (const purchase of matched) {
      if (purchase.clerk_user_id) clerkUserIds.add(String(purchase.clerk_user_id));
      if (purchase.email) emails.add(normalizeEmail(String(purchase.email)));
      if (purchase.stripe_customer_id) customerIds.add(String(purchase.stripe_customer_id));
    }
  }

  if (objectEmail) emails.add(normalizeEmail(String(objectEmail)));
  if (customerId) customerIds.add(customerId);

  for (const id of customerIds) {
    const { data: rows } = await supabase
      .from('user_entitlements')
      .select('clerk_user_id')
      .eq('stripe_customer_id', id);

    for (const row of rows || []) {
      if (row.clerk_user_id) clerkUserIds.add(String(row.clerk_user_id));
    }
  }

  for (const email of emails) {
    const { data: rows } = await supabase
      .from('user_entitlements')
      .select('clerk_user_id')
      .eq('email', email);

    for (const row of rows || []) {
      if (row.clerk_user_id) clerkUserIds.add(String(row.clerk_user_id));
    }
  }

  for (const clerkUserId of clerkUserIds) {
    // revokeEntitlement is the canonical revocation: status flip to 'inactive'
    // (never a delete), so hasSmartVideoGo() resolves false everywhere.
    await revokeEntitlement({ clerkUserId }, { reason });
    // Also record the revocation reason so the audit trail is searchable.
    const { error: reasonError } = await supabase
      .from('user_entitlements')
      .update({ revoked_reason: reason, updated_at: new Date().toISOString() })
      .eq('clerk_user_id', clerkUserId);
    if (reasonError) {
      console.warn('[stripe webhook] failed to record revoked_reason:', reasonError.message);
    }
  }
}

function mapSubscriptionStatus(status?: string | null): EntitlementStatus {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'active';
    case 'canceled':
    case 'unpaid':
    case 'incomplete_expired':
    case 'past_due':
      return 'expired';
    default:
      return 'pending';
  }
}

async function handleSubscriptionEvent(subscription: any): Promise<void> {
  const priceId = subscription?.items?.data?.[0]?.price?.id || '';
  const entitlementKey = priceId ? getStripeProductMap()[priceId] || '' : '';

  if (!entitlementKey) {
    console.warn('[stripe webhook] unmapped subscription price:', priceId || '(none)');
    return;
  }

  const status = mapSubscriptionStatus(subscription?.status);
  const customerId = idOf(subscription?.customer);
  const subscriptionId = idOf(subscription?.id) || '';
  const clerkUserIdFromMetadata = String(subscription?.metadata?.clerk_user_id || '');
  const supabase = getSupabaseAdmin();

  let targetClerkUserId = '';
  let targetEmail = '';

  if (customerId) {
    const { data: row } = await supabase
      .from('user_entitlements')
      .select('clerk_user_id, email')
      .eq('stripe_customer_id', customerId)
      .limit(1)
      .maybeSingle();

    if (row?.clerk_user_id) {
      targetClerkUserId = String(row.clerk_user_id);
      targetEmail = String(row.email || '');
    }
  }

  if (!targetClerkUserId && !targetEmail && customerId) {
    const { data: purchase } = await supabase
      .from('user_purchases')
      .select('clerk_user_id, email')
      .eq('stripe_customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (purchase) {
      targetClerkUserId = String(purchase.clerk_user_id || '');
      targetEmail = purchase.email ? normalizeEmail(String(purchase.email)) : '';
    }
  }

  if (!targetClerkUserId && !targetEmail && clerkUserIdFromMetadata) {
    targetClerkUserId = clerkUserIdFromMetadata;
  }

  if (!targetClerkUserId && !targetEmail) {
    console.warn('[stripe webhook] no entitlement target for subscription:', subscriptionId);
    return;
  }

  const grantOpts: any = {
    stripe_customer_id: customerId || undefined,
    stripe_subscription_id: subscriptionId || undefined,
  };

  if (status === 'active') {
    if (targetClerkUserId) {
      await grantEntitlement(targetClerkUserId, targetEmail, entitlementKey, 'stripe', grantOpts);
    } else {
      await recordEmailOnlyPurchase(targetEmail, entitlementKey, {
        ...grantOpts,
        source: 'stripe',
      });
    }
    return;
  }

  if (targetClerkUserId) {
    await setEntitlementStatus(targetClerkUserId, status);
  } else {
    await setEntitlementStatus(emailOnlyClerkId(targetEmail), status);
  }
}

async function revokeForSubscription(event: Stripe.Event): Promise<void> {
  const subscription = event.data.object as Stripe.Subscription;

  if (
    event.type === 'customer.subscription.updated' &&
    mapSubscriptionStatus(subscription.status) === 'active'
  ) {
    return;
  }

  // Revoke what this subscription granted, and only that:
  //  1. rows recorded with this subscription id;
  //  2. otherwise, unless the price is a known non-SmartVideo price, the
  //     customer's rows (legacy rows granted before the subscription id was
  //     recorded must still not outlive their subscription);
  //  3. a subscription whose price is present but unmapped is unrelated and
  //     must not revoke a lifetime purchase or another active subscription.
  const target = subscriptionRevocationTarget(subscription);
  const subscriptionId = idOf(subscription?.id) || '';
  let result = subscriptionId
    ? await revokeEntitlement({ ...target, stripeSubscriptionId: subscriptionId }, { reason: event.type })
    : { revoked: false, matched: 0, reason: event.type };
  if (result.revoked) {
    console.log(`[stripe webhook] revoked ${result.matched} entitlement row(s) for ${event.type}:`, subscription.id);
    return;
  }

  const priceId = (subscription as { items?: { data?: Array<{ price?: { id?: string } }> } })
    ?.items?.data?.[0]?.price?.id || '';
  // A present-but-unmapped price identifies a subscription that is not a
  // SmartVideo product. A payload with no price at all is ambiguous, so it
  // keeps the fail-closed customer revocation below.
  if (priceId && !getStripeProductMap()[priceId]) {
    console.warn(
      `[stripe webhook] ${event.type} for an unmapped subscription with no entitlement of its own; nothing revoked:`,
      subscription.id
    );
    return;
  }

  result = await revokeEntitlement(target, { reason: event.type });

  // A subscription can outlive the customer-id link on the entitlement row.
  // Fall back to the purchase ledger, same as the grant/status path.
  if (!result.revoked) {
    const customerId = idOf(subscription?.customer);
    if (customerId) {
      const supabase = getSupabaseAdmin();
      const { data: purchase } = await supabase
        .from('user_purchases')
        .select('clerk_user_id, email')
        .eq('stripe_customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (purchase) {
        result = await revokeEntitlement(
          {
            clerkUserId: purchase.clerk_user_id ? String(purchase.clerk_user_id) : undefined,
            email: purchase.email ? normalizeEmail(String(purchase.email)) : undefined,
          },
          { reason: event.type }
        );
      }
    }
  }

  if (!result.revoked) {
    console.warn(`[stripe webhook] no entitlement row matched ${event.type}:`, subscription.id);
    return;
  }

  console.log(
    `[stripe webhook] revoked ${result.matched} entitlement row(s) for ${event.type}:`,
    subscription.id
  );
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
    case 'refund.created':
      await handleRefundLike(event.data.object, 'refunded', `${event.type}:${event.id}`);
      return;
    case 'charge.dispute.created':
      // Mark the ledger purchase and match by payment intent / email, then
      // also resolve the charge: a real Dispute payload may carry nothing but
      // the charge id, so the charge lookup is the only way to find the buyer.
      await handleRefundLike(event.data.object, 'disputed', `${event.type}:${event.id}`);
      await revokeForCharge(event);
      return;
    case 'customer.subscription.created':
      await handleSubscriptionEvent(event.data.object);
      return;
    case 'customer.subscription.updated':
      // Grant on (re)activation — `active` or `trialing`, the same statuses
      // `mapSubscriptionStatus` and the `created` path treat as active, so a
      // trial that is merely updated keeps its access. Any other status must
      // revoke the row even when its price is no longer in the product map — a
      // granted entitlement must not outlive its subscription just because the
      // map changed.
      if (mapSubscriptionStatus((event.data.object as { status?: string }).status) === 'active') {
        await handleSubscriptionEvent(event.data.object);
      } else {
        await revokeForSubscription(event);
      }
      return;
    case 'customer.subscription.deleted':
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
