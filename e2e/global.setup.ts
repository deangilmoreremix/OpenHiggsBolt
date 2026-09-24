import { clerk, clerkSetup } from '@clerk/testing/playwright';
import { test as setup, expect } from '@playwright/test';
import path from 'path';

import { completeOrgTaskIfPresent, isChooseOrganizationTask } from './helpers/clerk';
import { resolveDemoBaseURL, resolveDemoAuthStatePath } from '../playwright.shared';

setup.describe.configure({ mode: 'serial' });

const DEMO_BASE_URL = resolveDemoBaseURL();
const authFile = resolveDemoAuthStatePath();

setup('configure Clerk', async () => {
  await clerkSetup();
});

setup('authenticate SmartVideo GO demo user', async ({ page }) => {
  const email = process.env.E2E_CLERK_USER_EMAIL;

  if (!email) {
    throw new Error('E2E_CLERK_USER_EMAIL is not configured');
  }

  await page.goto(`${DEMO_BASE_URL}/`);

  await clerk.signIn({
    page,
    emailAddress: email,
  });

  // The Clerk organization task, when enabled, is surfaced asynchronously
  // after the first protected navigation as #/tasks/choose-organization.
  await page.goto(`${DEMO_BASE_URL}/studio`);

  await completeOrgTaskIfPresent(page, { waitForAppearance: true });

  await expect(page).toHaveURL((url) => {
    return url.pathname.includes('/studio') && !isChooseOrganizationTask(url);
  });

  await page.context().storageState({
    path: authFile,
  });
});
