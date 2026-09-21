import { clerk, clerkSetup } from '@clerk/testing/playwright';
import { test as setup, expect } from '@playwright/test';
import path from 'path';

import { completeOrgTaskIfPresent } from './helpers/clerk';

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

  // Navigate to a protected route first; the Clerk organization task, if
  // required by the instance, typically appears after the first protected
  // navigation rather than immediately after sign-in.
  await page.goto('/studio');

  // Complete the Clerk organization task if the instance requires it.
  await completeOrgTaskIfPresent(page);

  await expect(page).toHaveURL(/\/studio/);

  await page.context().storageState({
    path: authFile,
  });
});
