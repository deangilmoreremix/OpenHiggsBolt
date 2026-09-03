import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/src/lib/supabaseServer';
import { grantEntitlement } from '@/access/resolveAccess';
import { ENTITLEMENTS } from '@/access/entitlements';

export const runtime = 'nodejs';

const STRIPE_PRODUCT_MAP: Record<string, string> = {
  // Replace with actual Stripe price IDs for SmartVideo GO products.
  [ENTITLEMENTS.SMARTVIDEO_GO]: ENTITLEMENTS.SMARTVIDEO_GO,
  [ENTITLEMENTS.SMARTVIDEO_AI]: ENTITLEMENTS.SMARTVIDEO_AI,
  [ENTITLEMENTS.FOUNDERS]: ENTITLEMENTS.FOUNDERS,
};

function resolveEntitlementFromEvent(event: any): string {
  const session = event?.data?.object || {};
  const lineItems = session.line_items?.data || session.display_items || [];
  const priceId = lineItems[0]?.price?.id || '';
  if (priceId && STRIPE_PRODUCT_MAP[priceId]) {
    return STRIPE_PRODUCT_MAP[priceId];
  }
  return ENTITLEMENTS.SMARTVIDEO_GO;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') || '';
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let event;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const relevantEvents = [
    'checkout.session.completed',
    'payment_intent.succeeded',
  ];

  if (!relevantEvents.includes(event.type)) {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object;
  const customerEmail = session.customer_details?.email || session.customer_email;
  const customerId = session.customer;
  const metadata = session.metadata || {};
  const clerkUserId = metadata.clerk_user_id;

  if (!customerEmail) {
    return NextResponse.json({ error: 'No customer email' }, { status: 400 });
  }

  const entitlementKey = resolveEntitlementFromEvent(event);
  const normalizedEmail = customerEmail.toLowerCase().trim();
  const supabase = getSupabaseAdmin();

  if (clerkUserId) {
    await grantEntitlement(clerkUserId, normalizedEmail, entitlementKey, 'stripe', {
      stripe_customer_id: customerId,
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
      });
    }
  }

  return NextResponse.json({ received: true });
}
