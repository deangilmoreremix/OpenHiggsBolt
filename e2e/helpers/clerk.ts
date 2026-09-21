/**
 * Shared Clerk helpers for Playwright E2E tests.
 *
 * These are intentionally small so they can be reused by both the existing
 * auth.spec.ts flows and the global SmartVideo GO demo-auth setup without
 * duplicating fragile selectors.
 */

import { type Page } from '@playwright/test';

const DEMO_ORG_NAME = 'SmartVideo GO Demo Org';
const ORG_TASK_APPEAR_TIMEOUT_MS = 12_000;
const ORG_TASK_RESOLVE_TIMEOUT_MS = 10_000;
const ORG_CONTROL_TIMEOUT_MS = 5_000;

export function isChooseOrganizationTask(url: URL | string): boolean {
  const parsed = typeof url === 'string' ? new URL(url) : url;
  return parsed.hash.includes('choose-organization');
}

async function waitForOrgTaskToAppear(page: Page): Promise<boolean> {
  if (isChooseOrganizationTask(page.url())) {
    return true;
  }

  try {
    await page.waitForURL((url) => isChooseOrganizationTask(url), {
      timeout: ORG_TASK_APPEAR_TIMEOUT_MS,
    });
    return true;
  } catch {
    // The organization task is optional. A timeout here means it did not
    // appear during Clerk's known post-sign-in task window.
    return false;
  }
}

async function waitForOrgTaskToClear(page: Page): Promise<void> {
  await page.waitForURL((url) => !isChooseOrganizationTask(url), {
    timeout: ORG_TASK_RESOLVE_TIMEOUT_MS,
  });
}

/**
 * Complete the Clerk "choose organization" session task when required.
 *
 * Clerk can surface this task asynchronously after the first protected-route
 * navigation, so this helper first waits for the known task window. If the
 * task appears, it must be resolved before the helper returns.
 *
 * Preferred order:
 * 1. Select an existing organization if one is available.
 * 2. Otherwise create exactly one deterministic demo organization.
 * 3. Fail if the task cannot be resolved; never persist a broken auth state.
 */
export async function completeOrgTaskIfPresent(page: Page): Promise<void> {
  const taskAppeared = await waitForOrgTaskToAppear(page);
  if (!taskAppeared) {
    return;
  }

  const existingOrg = page.getByRole('button', { name: /select/i }).first();
  const createOrg = page.getByRole('button', { name: /create organization/i }).first();

  // Clerk renders the task controls client-side after the hash route appears.
  // Give either supported action a short deterministic hydration window.
  await Promise.race([
    existingOrg.waitFor({ state: 'visible', timeout: ORG_CONTROL_TIMEOUT_MS }).catch(() => undefined),
    createOrg.waitFor({ state: 'visible', timeout: ORG_CONTROL_TIMEOUT_MS }).catch(() => undefined),
  ]);

  if (await existingOrg.isVisible().catch(() => false)) {
    await existingOrg.click();
    await waitForOrgTaskToClear(page);
    return;
  }

  if (await createOrg.isVisible().catch(() => false)) {
    await createOrg.click();

    const name = page.getByLabel(/organization name/i);
    await name.waitFor({ state: 'visible', timeout: ORG_CONTROL_TIMEOUT_MS });
    await name.fill(DEMO_ORG_NAME);

    const submit = page.getByRole('button', { name: /create|continue|finish/i }).first();
    await submit.waitFor({ state: 'visible', timeout: ORG_CONTROL_TIMEOUT_MS });
    await submit.click();

    await waitForOrgTaskToClear(page);
    return;
  }

  // The task is active but no supported action became available. Wait for the
  // task to clear on its own; if it does not, let Playwright throw. This
  // prevents saving an unresolved Clerk session into storageState.
  await waitForOrgTaskToClear(page);
}
