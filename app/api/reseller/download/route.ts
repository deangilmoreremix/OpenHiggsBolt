import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseAdmin } from '@/lib/supabaseServer';
import {
  RESELLER_ENTITLEMENTS,
  canDownloadSource,
  getResellerApp,
  resolveResellerEntitlements,
} from '@/lib/resellerAccess';
import { createBundleDownloadUrl } from '@/lib/resellerStorage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/reseller/download?app=<appId>
 *
 * Secure per-app source-bundle delivery for the Apps Studio reseller
 * collection.
 *
 * Contract:
 *   401 UNAUTHENTICATED      caller has no Clerk session
 *   400 MISSING_APP_ID       no `app` query parameter
 *   404 UNKNOWN_APP          appId is not one of the 38 allowlisted apps
 *   403 NOT_ENTITLED         caller holds neither apps_studio_diy nor
 *                            apps_studio_training
 *   503 STORAGE_NOT_CONFIGURED / BUNDLE_NOT_AVAILABLE / SIGN_FAILED
 *                            private storage or bundle artifact missing
 *   302                      redirect to a short-lived signed URL in the
 *                            PRIVATE bucket (never a public path)
 *
 * The signed URL is minted per request against the caller's own
 * entitlements only; no user identifiers are accepted from the client,
 * so one user's session can never fetch another user's bundles.
 */
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  }

  const appId = (req.nextUrl.searchParams.get('app') ?? '').trim();
  if (!appId) {
    return NextResponse.json(
      { error: 'MISSING_APP_ID', message: 'Query parameter `app` is required.' },
      { status: 400 },
    );
  }

  // Allowlist gate BEFORE entitlement evaluation: unknown ids (including
  // traversal payloads like `../../x`) can never match, and the storage
  // object path is only ever taken from the manifest entry.
  const app = getResellerApp(appId);
  if (!app) {
    return NextResponse.json({ error: 'UNKNOWN_APP' }, { status: 404 });
  }

  // Resolve entitlements for the AUTHENTICATED caller only. Any
  // client-supplied user/ownership parameters are ignored.
  const user = await resolveResellerEntitlements(userId);
  if (!canDownloadSource(user, app.id)) {
    return NextResponse.json(
      {
        error: 'NOT_ENTITLED',
        entitlement: RESELLER_ENTITLEMENTS.DIY,
        message:
          'Source bundles require the Apps Studio DIY or Apps + Training package.',
      },
      { status: 403 },
    );
  }

  const bundle = await createBundleDownloadUrl(app.id, {
    getSupabaseAdmin: () => getSupabaseAdmin(),
  });
  if (!bundle.ok) {
    return NextResponse.json(
      { error: bundle.code, message: bundle.message, appId: app.id },
      { status: 503 },
    );
  }

  const response = NextResponse.redirect(bundle.signedUrl, 302);
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('X-Robots-Tag', 'noindex');
  return response;
}
