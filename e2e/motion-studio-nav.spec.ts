import { test, expect, type Page } from '@playwright/test';
import { installStudioSession, waitForWorkbench } from './helpers/motion-studio';

// Dev-only E2E auth bypass. The __e2e_auth_bypass cookie makes the middleware
// skip Clerk auth so tests can run fully offline without a live Clerk session.
// The cookie is injected straight into the browser context: /api/dev-login
// answers with a 307 that hangs Playwright, and its httpOnly cookie is
// invisible to `document.cookie`, which the entry page reads.
// Never active in production.
async function enableDevAuth(page: Page, options: { entrySeen?: boolean } = {}) {
  await installStudioSession(page, { entrySeen: options.entrySeen ?? false });
}

/**
 * Open the Motion Studio *workspace* (the editor, not the /new entry page).
 * The entry-seen flag is seeded so the internal router skips the input step
 * and mounts the workbench — without it the editor chrome (.timeline,
 * .preview) never exists and the workspace assertions would be vacuous.
 */
async function openWorkspace(page: Page, url = '/studio/motion-studio'): Promise<void> {
  await enableDevAuth(page, { entrySeen: true });
  await page.goto(url);
  await waitForWorkbench(page);
}

test.describe('Motion Studio navigation & workspace', () => {
  test('opens /studio/motion-studio via direct navigation', async ({ page }) => {
    await enableDevAuth(page);
    await page.goto('/studio/motion-studio');
    await expect(page).toHaveURL(/\/studio\/motion-studio/);
    // The Motion Studio wrapper sets its own title; expect "SmartVideo GO" or "motion"
    await expect(page).toHaveTitle(/SmartVideo|Studio|motion/i);
  });

  test('clicking Motion Studio tab navigates to /studio/motion-studio', async ({ page }) => {
    await enableDevAuth(page);
    await page.goto('/studio');
    const tabBtn = page.locator('button:has-text("Motion Studio")').first();
    await tabBtn.click();
    await page.waitForURL(/\/studio\/motion-studio/, { timeout: 60_000 });
    await expect(page).toHaveURL(/\/studio\/motion-studio/);
  });

  test('no Personalization Modal opens on Motion Studio route', async ({ page }) => {
    await enableDevAuth(page);
    await page.goto('/studio/motion-studio');
    await expect(page).toHaveURL(/\/studio\/motion-studio/);
    const modal = page.locator('.personalization-modal, [role="dialog"][aria-label*="Personalization"]');
    await expect(modal).toHaveCount(0);
  });

  test('BasicText deep link resolves to Motion Studio workspace', async ({ page }) => {
    await openWorkspace(page, '/studio/motion-studio?template=motion-studio|BasicText');
    // The route is the Motion Studio route and the template survived the
    // round-trip. `|` is percent-encoded to `%7C` in the query string, so the
    // parameter is decoded instead of matched against the raw URL text (the
    // raw text is `?template=motion-studio%7CBasicText` — "motion-studio"
    // comes BEFORE "BasicText", so a `BasicText.*motion-studio` regex can
    // never match the real URL).
    const url = new URL(page.url());
    expect(url.pathname).toBe('/studio/motion-studio');
    expect(url.searchParams.get('template')).toBe('motion-studio|BasicText');
    expect(page.url()).toContain('BasicText');
    expect(page.url()).toContain('motion-studio');
  });

  test('workspace renders recipe library area', async ({ page }) => {
    await openWorkspace(page);
    await expect(page.getByText(/recipe|card|category/i).first()).toBeVisible({ timeout: 90_000 });
  });

  test('workspace has timeline or preview controls', async ({ page }) => {
    await openWorkspace(page);
    const hasTimeline = await page.locator('.timeline, .preview-timeline, [class*="timeline"]').count().catch(() => 0);
    const hasPreview = await page.locator('.player, .preview').count().catch(() => 0);
    expect(hasTimeline + hasPreview).toBeGreaterThanOrEqual(1);
  });
});
