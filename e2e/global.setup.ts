import { clerk, clerkSetup } from '@clerk/testing/playwright';
import { test as setup, expect } from '@playwright/test';
import path from 'path';

import { completeOrgTaskIfPresent, isChooseOrganizationTask } from './helpers/clerk';

setup.describe.configure({ mode: 'serial' });

const authFile = path.join(
  process.cwd(),
  'playwright/.clerk/smartvideo-demo.json'
);

setup('configure Clerk', async () => {
  await clerkSetup();
});

setup('authenticate SmartVideo GO demo user', async ({ page }) => {
  const email = process.env.E2E_CLERK_USER_EMAIL;

  if (!email) {
    throw new Error('E2E_CLERK_USER_EMAIL is not configured');
  }

  await page.goto('/');

  await clerk.signIn({
    page,
    emailAddress: email,
  });

  // The Clerk organization task, when enabled, is surfaced asynchronously
  // after the first protected navigation as #/tasks/choose-organization.
  await page.goto('/studio');

  await completeOrgTaskIfPresent(page, { waitForAppearance: true });

  await expect(page).toHaveURL((url) => {
    return url.pathname.includes('/studio') && !isChooseOrganizationTask(url);
  });

  await page.context().storageState({
    path: authFile,
  });
});
