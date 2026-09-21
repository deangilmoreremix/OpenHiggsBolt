/**
 * Shared Clerk helpers for Playwright E2E tests.
 *
 * These are intentionally small so they can be reused by both the existing
 * auth.spec.ts flows and the new global demo-auth setup without duplicating
 * fragile selectors.
 */

import { type Page } from '@playwright/test';

const DEMO_ORG_NAME = 'SmartVideo GO Demo Org';

/**
 * Complete the Clerk "choose organization" session task if the current page
 * is showing it. This is safe to call on any page: it returns immediately
 * when the task is not present.
 *
 * Preferred order:
 * 1. Select an existing organization if one is available.
 * 2. Otherwise create exactly one deterministic demo organization.
 * 3. Wait for the task route to resolve rather than using an arbitrary timeout.
 */
export async function completeOrgTaskIfPresent(page: Page): Promise<void> {
  if (!page.url().includes('choose-organization')) {
    return;
  }

  // Prefer selecting an existing organization rather than creating a new one
  // on every run.
  const existingOrg = page.getByRole('button', { name: /select/i }).first();
  if (await existingOrg.count()) {
    await existingOrg.click();
    await page.waitForURL((url) => !url.pathname.includes('choose-organization'), {
      timeout: 10_000,
    });
    return;
  }

  const create = page.getByRole('button', { name: /create organization/i });
  if (await create.count()) {
    await create.first().click();
    const name = page.getByLabel(/organization name/i);
    if (await name.count()) {
      await name.fill(DEMO_ORG_NAME);
    }
    const submit = page.getByRole('button', { name: /create|continue|finish/i });
    if (await submit.count()) {
      await submit.first().click();
    }
    await page.waitForURL((url) => !url.pathname.includes('choose-organization'), {
      timeout: 10_000,
    });
    return;
  }

  // If the task is present but we cannot identify actionable controls, wait
  // for the route to clear rather than failing immediately.
  await page.waitForURL((url) => !url.pathname.includes('choose-organization'), {
    timeout: 10_000,
  }).catch(() => {});
}
