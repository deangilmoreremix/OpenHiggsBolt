import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@clerk/nextjs/server';
import {
  getResellerMissingConfig,
  getResellerPackage,
  getResellerStripePriceId,
  isResellerPurchasablePackageId,
  type ResellerPackageId,
} from '@/lib/reseller/packages';

export const dynamic = 'force-dynamic';

export const runtime = 'nodejs';

const STRIPE_API_VERSION = '2026-08-26.dahlia' as const;

function getStripeClient(): Stripe | null {
  const key = (process.env.STRIPE_SECRET_KEY || '').trim();
  if (!key) return null;
  return new Stripe(key, { apiVersion: STRIPE_API_VERSION });
}

function getOrigin(req: NextRequest): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  const url = req.headers.get('origin');
  if (url) return url.replace(/\/$/, '');
  return 'http://localhost:3000';
}

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const requestedPackage: unknown = body?.package;
  if (!isResellerPurchasablePackageId(requestedPackage)) {
    return NextResponse.json(
      { error: 'UNKNOWN_PACKAGE', message: 'package must be "diy" or "training".' },
      { status: 400 }
    );
  }

  const packageId: ResellerPackageId = requestedPackage;
  const pkg = getResellerPackage(packageId)!;

  const missing = getResellerMissingConfig([packageId]);
  if (missing.length > 0) {
    console.error('[reseller checkout] missing Stripe configuration:', missing.join(', '));
    return NextResponse.json(
      { error: 'RESELLER_STRIPE_NOT_CONFIGURED', missing },
      { status: 503 }
    );
  }

  const stripe = getStripeClient();
  if (!stripe) {
    return NextResponse.json(
      { error: 'RESELLER_STRIPE_NOT_CONFIGURED', missing: ['STRIPE_SECRET_KEY'] },
      { status: 503 }
    );
  }

  const priceId = getResellerStripePriceId(packageId);

  let clerkUserId: string | null = null;
  try {
    const authResult = await auth();
    clerkUserId = authResult?.userId || null;
  } catch {
    clerkUserId = null;
  }

  const origin = getOrigin(req);
  const successUrl = `${origin}/studio/apps?purchase=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin}/studio/apps`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      metadata: {
        ...(clerkUserId ? { clerk_user_id: clerkUserId } : {}),
        package_id: pkg.id,
        entitlement: pkg.grantsEntitlements.join(','),
        source: 'apps_studio_reseller',
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: 'RESELLER_CHECKOUT_FAILED', message: 'Failed to create checkout session.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url, sessionId: session.id, package: pkg.id });
  } catch (err: any) {
    console.error('[reseller checkout] failed to create session:', err?.message || err);
    return NextResponse.json(
      { error: 'RESELLER_CHECKOUT_FAILED', message: 'Failed to start checkout. Please try again.' },
      { status: 500 }
    );
  }
}
