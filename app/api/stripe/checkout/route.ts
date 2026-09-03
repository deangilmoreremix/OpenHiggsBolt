import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@clerk/nextjs/server';

export const runtime = 'nodejs';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_PRICE_LIFETIME = process.env.STRIPE_PRICE_LIFETIME || '';
const STRIPE_PRODUCT_MAP = (process.env.NEXT_PUBLIC_STRIPE_PRODUCT_MAP ||
  process.env.STRIPE_PRODUCT_MAP ||
  '{}').trim();

let stripe: Stripe | null = null;
if (STRIPE_SECRET_KEY) {
  stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2026-08-26.dahlia',
  });
}

function getOrigin(req: NextRequest): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  const url = req.headers.get('origin');
  if (url) return url.replace(/\/$/, '');
  return 'http://localhost:3000';
}

export async function POST(req: NextRequest) {
  if (!stripe) {
    console.error('[stripe checkout] STRIPE_SECRET_KEY is not configured');
    return NextResponse.json(
      { error: 'Payments are not configured. Please contact support.' },
      { status: 500 }
    );
  }

  if (!STRIPE_PRICE_LIFETIME) {
    console.error('[stripe checkout] STRIPE_PRICE_LIFETIME is not configured');
    return NextResponse.json(
      { error: 'The Pro plan is temporarily unavailable. Please try again later.' },
      { status: 500 }
    );
  }

  let clerkUserId: string | null = null;
  try {
    const authResult = await auth();
    clerkUserId = authResult?.userId || null;
  } catch {
    clerkUserId = null;
  }

  const origin = getOrigin(req);
  const successUrl = `${origin}/?purchase=success&session_id={CHECKOUT_SESSION_ID}#pricing`;
  const cancelUrl = `${origin}/#pricing`;

  try {
    const map = JSON.parse(STRIPE_PRODUCT_MAP) as Record<string, string>;
    const entitlement = map[STRIPE_PRICE_LIFETIME] || 'smartvideo_go';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: STRIPE_PRICE_LIFETIME, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      metadata: {
        ...(clerkUserId ? { clerk_user_id: clerkUserId } : {}),
        entitlement,
        plan: 'pro_lifetime',
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: 'Failed to create checkout session.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err: any) {
    console.error('[stripe checkout] failed to create session:', err?.message || err);
    return NextResponse.json(
      { error: 'Failed to start checkout. Please try again.' },
      { status: 500 }
    );
  }
}
