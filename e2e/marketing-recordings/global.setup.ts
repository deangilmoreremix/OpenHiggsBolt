import { clerkSetup } from '@clerk/testing/playwright';
import { test as setup, expect } from '@playwright/test';
import { resolveDemoBaseURL, resolveDemoAuthStatePath } from '../../playwright.shared';

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

  const { clerk } = await import('@clerk/testing/playwright');
  await clerk.signIn({
    page,
    emailAddress: email,
  });

  await page.context().storageState({ path: authFile });
});
