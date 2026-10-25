import { test, expect, type Page } from '@playwright/test';
import { installStudioSession } from './helpers/motion-studio';

// Dev-only E2E auth bypass. The __e2e_auth_bypass cookie makes the middleware
// skip Clerk auth so tests can run fully offline without a live Clerk session.
// The cookie is injected straight into the browser context: /api/dev-login
// answers with a 307 that hangs Playwright, and its httpOnly cookie is
// invisible to `document.cookie`, which the entry page reads.
// Never active in production.
async function enableDevAuth(page: Page) {
  await installStudioSession(page);
}

test('opens motion studio', async ({ page }) => {
  await enableDevAuth(page);
  await page.goto('/studio/motion-studio', { waitUntil: 'load', timeout: 60_000 });
  await expect(page).toHaveURL(/\/studio\/motion-studio/, { timeout: 60_000 });
});
