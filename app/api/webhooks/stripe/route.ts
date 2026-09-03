import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/src/lib/supabaseServer';
import { grantEntitlement } from '@/access/resolveAccess';
import { ENTITLEMENTS } from '@/access/entitlements';

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

  let entitlementKey = resolveEntitlementFromSession(session);
  if (!entitlementKey) {
    entitlementKey = await resolveEntitlementFromSessionId(session.id);
  }

  if (!entitlementKey) {
    console.warn('[stripe webhook] unmapped price for session:', session.id);
    return NextResponse.json({ received: true });
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

  return NextResponse.json({ received: true });
}
