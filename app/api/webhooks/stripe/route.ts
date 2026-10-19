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
import type { EntitlementStatus } from '@/access/entitlements';

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

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/** Accepts either a string id or a Stripe expanded object with an `id`. */
function idOf(value: any): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && typeof value.id === 'string') return value.id;
  return '';
}

/**
 * Appends/refreshes the purchase ledger row for a checkout session.
 *
 * Called BEFORE granting the entitlement so a purchase is durable even if the
 * entitlement write fails — Stripe retries the event and every handler below
 * is idempotent, so the retry converges instead of dropping the purchase.
 */
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

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
): Promise<NextResponse> {
  const customerEmail = session.customer_details?.email || session.customer_email || '';
  const customerId = idOf(session.customer);
  const metadata = (session.metadata || {}) as Record<string, string>;
  const clerkUserId = metadata.clerk_user_id || '';
  const subscriptionId =
    metadata.stripe_subscription_id || idOf(session.subscription) || '';
  const paymentIntentId = idOf(session.payment_intent);

  if (!customerEmail) {
    return NextResponse.json({ error: 'No customer email' }, { status: 400 });
  }

  const normalizedEmail = normalizeEmail(customerEmail);

  let entitlementKey = resolveEntitlementFromSession(session);
  if (!entitlementKey) {
    entitlementKey = await resolveEntitlementFromSessionId(session.id);
  }

  if (!entitlementKey) {
    console.warn('[stripe webhook] unmapped price for session:', session.id);
    return NextResponse.json({ received: true });
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

   // (b) Grant by the Clerk id captured at checkout when there is one.
   // One-time purchases (mode === 'payment') receive 'lifetime' status so a
   // later subscription lifecycle event can never downgrade them to 'expired'.
   const isOneTime = session.mode === 'payment' && !subscriptionId;
   if (clerkUserId) {
     await grantEntitlement(clerkUserId, normalizedEmail, entitlementKey, 'stripe', {
       stripe_customer_id: customerId,
       stripe_subscription_id: subscriptionId || undefined,
       ...(isOneTime ? { entitlement_status: 'lifetime' } : {}),
     });
     return NextResponse.json({ received: true });
   }

  // (c) Otherwise match an existing row for the buyer's email.
  const supabase = getSupabaseAdmin();
  const { data: existingUser } = await supabase
    .from('user_entitlements')
    .select('clerk_user_id')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (existingUser?.clerk_user_id) {
    await grantEntitlement(existingUser.clerk_user_id, normalizedEmail, entitlementKey, 'stripe', {
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId || undefined,
      ...(isOneTime ? { entitlement_status: 'lifetime' } : {}),
    });
    return NextResponse.json({ received: true });
  }

  // (d) No Clerk account and no existing row: record an email-keyed row so the
  // purchase is never dropped. `restoreAccessByEmail` adopts it later once the
  // buyer signs in with the verified email. The placeholder key can never
  // satisfy hasSmartVideoGo for a real Clerk user.
  await recordEmailOnlyPurchase(normalizedEmail, entitlementKey, {
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId || undefined,
    source: 'stripe',
  });

  return NextResponse.json({ received: true });
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
    await revokeEntitlement(clerkUserId, reason);
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
      // incomplete / paused / unknown: keep the purchase on record but unconfirmed.
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

  // Resolve the entitlement row to update: stripe customer id first, then a
  // previously recorded purchase, then the subscription's own metadata.
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

  const stripeMetadata = {
    stripe_customer_id: customerId || undefined,
    stripe_subscription_id: subscriptionId || undefined,
  };

  if (status === 'active') {
    if (targetClerkUserId) {
      await grantEntitlement(targetClerkUserId, targetEmail, entitlementKey, 'stripe', stripeMetadata);
    } else {
      await recordEmailOnlyPurchase(targetEmail, entitlementKey, {
        ...stripeMetadata,
        source: 'stripe',
      });
    }
    return;
  }

   if (targetClerkUserId) {
     // Never downgrade a lifetime entitlement to 'expired' / 'revoked' when a
     // separate subscription lapses — the lifetime grant must survive.
     const { data: row } = await supabase
       .from('user_entitlements')
       .select('status')
       .eq('clerk_user_id', targetClerkUserId)
       .maybeSingle();
     if (row?.status !== 'lifetime') {
       await setEntitlementStatus(targetClerkUserId, status);
     }
   } else {
     await setEntitlementStatus(emailOnlyClerkId(targetEmail), status);
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

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        return await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        );

      // Payment intents are acknowledged but not processed here; entitlement
      // provisioning is driven by checkout.session.completed.
      case 'payment_intent.succeeded':
        return NextResponse.json({ received: true });

      case 'charge.refunded':
        await handleRefundLike(
          event.data.object,
          'refunded',
          `${event.type}:${event.id}`
        );
        return NextResponse.json({ received: true });

      case 'refund.created':
        await handleRefundLike(
          event.data.object,
          'refunded',
          `${event.type}:${event.id}`
        );
        return NextResponse.json({ received: true });

      case 'charge.dispute.created':
        await handleRefundLike(
          event.data.object,
          'disputed',
          `${event.type}:${event.id}`
        );
        return NextResponse.json({ received: true });

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionEvent(event.data.object);
        return NextResponse.json({ received: true });

      default:
        return NextResponse.json({ received: true });
    }
  } catch (err) {
    // Never swallow a durable failure: return 500 so Stripe retries the event.
    // Every handler above is idempotent, so retries converge.
    console.error(`[stripe webhook] ${event.type} handler failed:`, err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
