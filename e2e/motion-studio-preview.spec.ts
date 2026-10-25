import { test, expect } from '@playwright/test';
import { clerkSetup, clerk } from '@clerk/testing/playwright';
import { completeOrgTaskIfPresent } from './helpers/clerk';
import { BASE_URL, EXPORT_LABEL } from './helpers/motion-studio';

/**
 * The customer flow, end to end, against whatever MS_BASE_URL points at.
 *
 *   MS_BASE_URL=http://127.0.0.1:3100               -> local dev server
 *   MS_BASE_URL=https://<preview>--<site>.netlify.app -> deployed preview
 *
 * Auth uses Clerk's real sign-in (the pattern in e2e/auth.spec.ts) so the
 * preview is exercised with a genuine session, not the dev-only bypass
 * cookie, which production context ignores.
 */
// The repo stores the E2E account as E2E_CLERK_USER_EMAIL (auth.spec.ts reads a
// different name that is never set, so its authenticated tests always skip).
const email = process.env.E2E_CLERK_USER_EMAIL ?? process.env.E2E_TEST_EMAIL;
const isDeployed = !/127\.0\.0\.1|localhost/.test(BASE_URL);

test.beforeAll(async () => {
  // Must run in the worker so its env vars reach setupClerkTestingToken.
  await clerkSetup();
});

test.describe('Motion Studio customer flow', () => {
  test('opens the studio, edits a recipe, and exports an MP4', async ({ page }) => {
    // The export run is the point of this spec, and it is slow (real in-browser
    // render). Locally the same flow is covered by motion-studio-export-mp4.spec.ts,
    // so only run the heavy path against a deployed target.
    test.skip(!email || !isDeployed, 'Needs an E2E account and a deployed preview target');

    // 1. Sign in for real.
    await page.goto(`${BASE_URL}/`, { waitUntil: 'load' });
    await clerk.signIn({ page, emailAddress: email });
    await completeOrgTaskIfPresent(page);

    // 2. The Motion Studio workspace opens (not Image Studio, not a modal).
    await page.goto(`${BASE_URL}/studio/motion-studio`, { waitUntil: 'load' });
    await expect(page).toHaveURL(/\/studio\/motion-studio/);
    await expect(page.locator('.ms-root .topbar')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText('Motion Studio', { exact: false }).first()).toBeVisible();

    // 3. The library renders recipe cards with live Remotion previews.
    const cards = page.locator('.ms-root [class*="recipe-card"], .ms-root .library-list > *');
    await expect(cards.first()).toBeVisible({ timeout: 60_000 });
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);

    // 4. Adding a recipe puts a clip on the timeline.
    const timelineClips = page.locator('.ms-root .timeline [class*="clip"]');
    const clipsBefore = await timelineClips.count();
    await page.locator('[aria-label="Add to timeline"]').first().click({ force: true });
    await page.waitForTimeout(1500);
    const clipsAfter = await timelineClips.count();
    expect(clipsAfter).toBe(clipsBefore + 1);

    // 5. Export produces a real MP4.
    const download = page.waitForEvent('download', { timeout: 15 * 60_000 });
    await page.getByRole('button', { name: EXPORT_LABEL }).click({ force: true });
    const file = await download;
    const path = '/tmp/motion-studio-preview-export.mp4';
    await file.saveAs(path);

    const { statSync, readFileSync } = await import('node:fs');
    const size = statSync(path).size;
    console.log(`PREVIEW EXPORT: ${file.suggestedFilename()} size=${size}`);
    expect(size).toBeGreaterThan(0);
    expect(readFileSync(path).subarray(4, 8).toString('ascii')).toMatch(/ftyp/);
  });

  test('personalization modal stays free of Motion Studio UI', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'load' });
    const open = page.getByRole('button', { name: /personaliz|preview|customize/i }).first();
    if (await open.count()) {
      await open.click({ force: true }).catch(() => {});
      await page.waitForTimeout(1500);
    }
    await expect(page.locator('.ms-root')).toHaveCount(0);
    await expect(page.getByText('BasicText')).toHaveCount(0);
  });
});
