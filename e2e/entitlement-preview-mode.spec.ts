import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import type { BrowserContext, Page } from '@playwright/test';
import { mintClerkSession, installClerkAuth, type MintedClerkSession } from './fixtures/clerkSession';

/**
 * Human-visible entitlement preview flow (scenario: a signed-in but UNPAID
 * SmartVideo GO user).
 *
 * Auth-bypass fixture pattern (read e2e/global.setup.ts + e2e/fixtures/clerkSession.ts):
 *   The dev-only `__e2e_auth_bypass` cookie is NOT sufficient here, because the
 *   PreviewModeBadge only renders for an AUTHENTICATED non-paid user
 *   (SmartVideoAccessProvider: `isPaid || !isSignedIn => hide`). The bypass
 *   cookie makes middleware skip Clerk entirely, which leaves Clerk's
 *   `useAuth().isSignedIn === false`. So a genuine signed-in session is minted
 *   via `mintClerkSession()` + `installClerkAuth()` (the same helper the
 *   personalization specs use), and `/api/access/resolve` is stubbed to
 *   `authenticated_unpaid` so the paid/unpaid state is deterministic and does
 *   not depend on a live Supabase entitlement row.
 *
 * Steps that need live Supabase/Stripe/Live-generate wiring that cannot be
 * driven or verified offline are left in place but skipped with an explanatory
 * comment (per the brief), rather than deleted.
 */

const BASE = 'http://localhost:3111';

function hasClerkCredentials(): boolean {
  let secret = process.env.CLERK_SECRET_KEY;
  let pub = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!secret || !pub) {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      secret = secret || content.match(/^CLERK_SECRET_KEY=(.*)$/m)?.[1];
      pub = pub || content.match(/^NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=(.*)$/m)?.[1];
    }
  }
  return Boolean(secret && pub);
}

/** Stub network that keeps a /studio load deterministic and offline. */
async function stubStudioNetwork(page: Page) {
  // Force the unpaid preview state without touching Supabase.
  await page.route('**/api/access/resolve', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        state: 'authenticated_unpaid',
        access: {
          clerkUserId: 'e2e-unpaid',
          email: 'e2e-unpaid@example.com',
          entitlements: { smartvideo_go: false },
          status: 'inactive',
          source: 'manual',
          hasSmartVideoGo: false,
        },
      }),
    }),
  );

  // MuAPI + key endpoints: the studio shell polls these on mount; fulfill so a
  // run never waits on real network. (Same spirit as studio-runtime-smoke.spec.ts.)
  await page.route(/\/api\/auth\/muapi-key/, (route) =>
    route.request().method() === 'GET'
      ? route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ key: '', openaiKey: '' }) })
      : route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  );
  await page.route('**/api.muapi.ai/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) }),
  );
}

async function signInUnpaid(context: BrowserContext, page: Page): Promise<MintedClerkSession> {
  const session = await mintClerkSession();
  await installClerkAuth(context, page, session, BASE);
  await stubStudioNetwork(page);
  return session;
}

test.describe('Entitlement preview mode (signed-in, unpaid)', () => {
  test.beforeEach(async ({ context, page, }, testInfo) => {
    // The whole flow depends on a genuine signed-in Clerk session. Offline (no
    // credentials) we cannot mint one, so skip rather than fail.
    test.skip(
      !hasClerkCredentials(),
      'BLOCKER: needs a live Clerk session (CLERK_SECRET_KEY + NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, read from .env.local) to render the PreviewModeBadge — the dev bypass cookie leaves isSignedIn=false and hides the badge. Skipped offline.',
    );
    await signInUnpaid(context, page);
  });

  test('an unpaid user landing on /studio sees the "Preview Mode" badge', async ({ page }) => {
    await page.goto(`${BASE}/studio`);
    await expect(page.getByText('Preview Mode', { exact: true })).toBeVisible();
    // Not a full-screen paywall: the studio navigation is still usable.
    await expect(page.getByRole('button', { name: 'Image Studio' })).toBeVisible();
  });

  test('navigates image → video → vfx → go-ai-viral → academy with the dashboard always visible (no full-screen paywall)', async ({
    page,
  }) => {
    await page.goto(`${BASE}/studio`);

    // A tab bar button staying visible across every switch proves the dashboard
    // is never replaced by a hard paywall overlay.
    const imageTab = page.getByRole('button', { name: 'Image Studio' });

    await page.getByRole('button', { name: 'Video Studio' }).click();
    await expect(imageTab).toBeVisible();

    await page.getByRole('button', { name: 'VFX', exact: true }).click();
    await expect(imageTab).toBeVisible();

    await page.getByRole('button', { name: 'GO-Viral' }).click();
    await expect(imageTab).toBeVisible();

    // The upgrade modal must not be on screen for a plain preview navigation.
    await expect(page.getByText('Unlock SmartVideo GO AI')).toHaveCount(0);

    await page.getByRole('link', { name: 'Academy' }).click();
    await expect(page).toHaveURL(/\/academy/);
    // Still no full-screen paywall walling off the app.
    await expect(page.getByText('Unlock SmartVideo GO AI')).toHaveCount(0);
  });

  test('the badge opens the upgrade modal, and "Continue Exploring" closes it leaving the dashboard visible', async ({
    page,
  }) => {
    await page.goto(`${BASE}/studio`);
    await page.getByText('Preview Mode', { exact: true }).click();

    // Upgrade modal with the three action buttons.
    await expect(page.getByText('Unlock SmartVideo GO AI')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Get SmartVideo GO AI' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Already Purchased? Restore Access' })).toBeVisible();

    // Assert the three buttons appear in DOM order.
    const order = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button')).map((b) => (b.textContent || '').trim());
      return {
        primary: buttons.findIndex((t) => t === 'Get SmartVideo GO AI'),
        restore: buttons.findIndex((t) => t === 'Already Purchased? Restore Access'),
        cont: buttons.findIndex((t) => t === 'Continue Exploring'),
      };
    });
    expect(order.primary).toBeGreaterThanOrEqual(0);
    expect(order.restore).toBeGreaterThan(order.primary);
    expect(order.cont).toBeGreaterThan(order.restore);

    // Continue Exploring dismisses it and the dashboard is fully intact.
    await page.getByRole('button', { name: 'Continue Exploring' }).click();
    await expect(page.getByText('Unlock SmartVideo GO AI')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Image Studio' })).toBeVisible();
  });

  test('opens the personalization modal from the GO-Viral studio (unpaid preview still shows the modal)', async ({
    page,
  }) => {
    // SKIPPED OFFLINE: opening the personalization modal requires the live
    // GO-Viral feed + a "Personalize This Demo" asset trigger whose copy and
    // DOM depend on a live /api/go-ai-viral/prompts response, and the modal
    // hydrates saved projects from Supabase-backed /api/personalization/project
    // (a GET). None of that can be driven or asserted without live Supabase +
    // the production GO-Viral feed, so this step is skipped rather than deleted
    // (see go-ai-viral-personalization.spec.ts for the live variant).
    test.skip(true, 'BLOCKER: needs live GO-Viral feed + Supabase-backed personalization project list; cannot run offline.');

    await page.goto(`${BASE}/studio/go-ai-viral`);
    await expect(page.getByText('Personalize This Demo').first()).toBeVisible();
  });

  test('a paid studio action that 403s (PAYMENT_REQUIRED) opens the upgrade modal', async ({ page }) => {
    // SKIPPED OFFLINE: this needs a real paid studio action (e.g. the video
    // Generate button) to issue a same-origin request that the server gates
    // with 403 PAYMENT_REQUIRED, which StandaloneShell intercepts to open the
    // upgrade modal. Driving that reliably requires the studio's exact generate
    // button + a live backend 403, which cannot be exercised offline. The modal
    // open path itself is verified deterministically via the badge test above.
    test.skip(true, 'BLOCKER: needs a live paid-generate action + backend 403 wiring; cannot be driven offline. Badge path covers the modal open.');
  });
});
