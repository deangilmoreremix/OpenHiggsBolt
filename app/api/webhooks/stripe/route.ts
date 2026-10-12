import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/src/lib/supabaseServer';
import { grantEntitlement } from '@/access/resolveAccess';
import { ENTITLEMENTS } from '@/access/entitlements';
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

function getSessionPriceId(session: Stripe.Checkout.Session): string {
  return session.line_items?.data?.[0]?.price?.id || '';
}

async function resolveSessionPriceId(session: Stripe.Checkout.Session): Promise<string> {
  const direct = getSessionPriceId(session);
  if (direct) return direct;

  if (!stripe) {
    return '';
  }

  try {
    const retrieved = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['line_items'],
    });
    return getSessionPriceId(retrieved);
  } catch (err) {
    console.error('[stripe webhook] failed to retrieve session line items:', err);
    return '';
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

  const relevantEvents = [
    'checkout.session.completed',
    'payment_intent.succeeded',
  ];

  if (!relevantEvents.includes(event.type)) {
    return NextResponse.json({ received: true });
  }

  // Payment intents are acknowledged but not processed here; entitlement
  // provisioning is driven by checkout.session.completed.
  if (event.type === 'payment_intent.succeeded') {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const customerEmail = session.customer_details?.email || session.customer_email;
  const customerId = session.customer as string | undefined;
  const metadata = (session.metadata || {}) as Record<string, string>;
  const clerkUserId = metadata.clerk_user_id;

  if (!customerEmail) {
    return NextResponse.json({ error: 'No customer email' }, { status: 400 });
  }

  const normalizedEmail = customerEmail.toLowerCase().trim();
  const sessionPriceId = await resolveSessionPriceId(session);

  // ── Reseller commerce (ADDITIVE) ──────────────────────────────────────────
  // Reseller packages (apps_studio_diy / apps_studio_training) are sold with
  // their own Stripe price IDs, configured via RESELLER_STRIPE_PRICE_* env
  // vars (see src/lib/reseller/packages.ts). When a completed checkout matches
  // a reseller price, grant the reseller entitlement(s) and record the
  // purchase in reseller_purchases, then stop. Non-reseller prices fall
  // through to the existing STRIPE_PRODUCT_MAP handling below, unchanged.
  const resellerPackageId = getResellerPackageIdForPriceId(sessionPriceId);
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
      return NextResponse.json({ error: 'Failed to apply reseller purchase' }, { status: 500 });
    }
    return NextResponse.json({ received: true });
  }
  // ── End reseller commerce (ADDITIVE) ──────────────────────────────────────

  const entitlementKey = sessionPriceId ? getStripeProductMap()[sessionPriceId] || '' : '';

  if (!entitlementKey) {
    console.warn('[stripe webhook] unmapped price for session:', session.id);
    return NextResponse.json({ received: true });
  }

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

  return NextResponse.json({ received: true });
}
