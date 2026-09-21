/**
 * Shared Clerk helpers for Playwright E2E tests.
 *
 * These are intentionally small so they can be reused by both the existing
 * auth.spec.ts flows and the new global demo-auth setup without duplicating
 * fragile selectors.
 */

import { type Page } from '@playwright/test';

/**
 * Complete the Clerk "choose organization" session task if the current page
 * is showing it. This is safe to call on any page: it returns immediately
 * when the task is not present.
 */
export async function completeOrgTaskIfPresent(page: Page): Promise<void> {
  if (!page.url().includes('choose-organization')) {
    return;
  }

  const create = page.getByRole('button', { name: /create organization/i });
  if (await create.count()) {
    await create.first().click();
    const name = page.getByLabel(/organization name/i);
    if (await name.count()) {
      await name.fill('SmartVideo GO Demo Org');
    }
    const submit = page.getByRole('button', { name: /create|continue|finish/i });
    if (await submit.count()) {
      await submit.first().click();
    }
  }

  // Give the redirect a moment to settle.
  await page.waitForTimeout(2000);
}
