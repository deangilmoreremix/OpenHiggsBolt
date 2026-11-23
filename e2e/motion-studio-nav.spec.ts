import { test, expect, type Page } from '@playwright/test';
import { installStudioSession, waitForWorkbench } from './helpers/motion-studio';

// Motion Studio was removed: its route redirects to Motion Director (next.config.mjs)
// and the studio nav has no Motion Studio tab. These tests cover that hand-over.

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
 * Open the Motion Workbench (Motion Director's editor). Without it the editor
 * chrome (.timeline, .preview) never exists and the workspace assertions would
 * be vacuous.
 */
async function openWorkspace(page: Page, url = '/studio/motion-director/workbench'): Promise<void> {
  await enableDevAuth(page, { entrySeen: true });
  await page.goto(url);
  await waitForWorkbench(page);
}

test.describe('Motion Studio redirect & Motion Director workspace', () => {
  test('/studio/motion-studio redirects to /studio/motion-director', async ({ page }) => {
    await enableDevAuth(page);
    await page.goto('/studio/motion-studio');
    await expect(page).toHaveURL(/\/studio\/motion-director/);
    await expect(page).toHaveTitle(/SmartVideo|Studio|motion/i);
  });

  test('paths under /studio/motion-studio redirect too', async ({ page }) => {
    await enableDevAuth(page);
    await page.goto('/studio/motion-studio/new');
    await expect(page).toHaveURL(/\/studio\/motion-director/);
  });

  test('studio nav has a Motion Director tab and no Motion Studio tab', async ({ page }) => {
    await enableDevAuth(page);
    await page.goto('/studio');
    await expect(page.locator('button:has-text("Motion Studio")')).toHaveCount(0);
    await page.locator('button:has-text("Motion Director")').first().click();
    await page.waitForURL(/\/studio\/motion-director/, { timeout: 60_000 });
  });

  test('no Personalization Modal opens on the redirected route', async ({ page }) => {
    await enableDevAuth(page);
    await page.goto('/studio/motion-studio');
    await expect(page).toHaveURL(/\/studio\/motion-director/);
    const modal = page.locator('.personalization-modal, [role="dialog"][aria-label*="Personalization"]');
    await expect(modal).toHaveCount(0);
  });

  test('a template deep link keeps its template through the redirect', async ({ page }) => {
    await enableDevAuth(page);
    await page.goto('/studio/motion-studio?template=motion-studio|BasicText');
    await expect(page).toHaveURL(/\/studio\/motion-director/);
    // `|` is percent-encoded to `%7C`, so decode the parameter instead of matching raw URL text.
    const url = new URL(page.url());
    expect(url.pathname.startsWith('/studio/motion-director')).toBe(true);
    expect(url.searchParams.get('template')).toBe('motion-studio|BasicText');
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
