import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@clerk/nextjs/server';
import {
  getResellerMissingConfig,
  getResellerPackage,
  getResellerStripePriceId,
} from '@/lib/reseller/packages';
import {
  evaluateUpgradeEligibility,
  getResellerUserState,
} from '@/lib/reseller/entitlements';

export const dynamic = 'force-dynamic';

export const runtime = 'nodejs';

const STRIPE_API_VERSION = '2026-08-26.dahlia' as const;
const UPGRADE_PACKAGE_ID = 'upgrade' as const;

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
  let clerkUserId: string | null = null;
  try {
    const authResult = await auth();
    clerkUserId = authResult?.userId || null;
  } catch {
    clerkUserId = null;
  }

  if (!clerkUserId) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  }

  let userState;
  try {
    userState = await getResellerUserState(clerkUserId);
  } catch (err: any) {
    console.error('[reseller upgrade] failed to load entitlements:', err?.message || err);
    return NextResponse.json(
      { error: 'ENTITLEMENT_LOOKUP_FAILED' },
      { status: 500 }
    );
  }

  const eligibility = evaluateUpgradeEligibility(userState);
  if (!eligibility.eligible) {
    return NextResponse.json(
      { error: eligibility.reason, message: eligibility.message },
      { status: eligibility.reason === 'ALREADY_TRAINING' ? 409 : 402 }
    );
  }

  const missing = getResellerMissingConfig([UPGRADE_PACKAGE_ID]);
  if (missing.length > 0) {
    console.error('[reseller upgrade] missing Stripe configuration:', missing.join(', '));
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

  const pkg = getResellerPackage(UPGRADE_PACKAGE_ID)!;
  const priceId = getResellerStripePriceId(UPGRADE_PACKAGE_ID);

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
        clerk_user_id: clerkUserId,
        package_id: pkg.id,
        entitlement: pkg.grantsEntitlements.join(','),
        upgrade_from: 'apps_studio_diy',
        source: 'apps_studio_reseller',
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: 'RESELLER_CHECKOUT_FAILED', message: 'Failed to create upgrade session.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url, sessionId: session.id, package: pkg.id });
  } catch (err: any) {
    console.error('[reseller upgrade] failed to create session:', err?.message || err);
    return NextResponse.json(
      { error: 'RESELLER_CHECKOUT_FAILED', message: 'Failed to start upgrade checkout.' },
      { status: 500 }
    );
  }
}
