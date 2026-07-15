import { test, expect } from '@playwright/test';
import { clerkSetup, clerk, setupClerkTestingToken } from '@clerk/testing/playwright';

const email = process.env.E2E_TEST_EMAIL;
const password = process.env.E2E_TEST_PASSWORD;

// The dev instance may require choosing/creating an organization on first sign-in
// (a Clerk session task shown at #/tasks/choose-organization). Complete it if present
// so downstream assertions can reach the protected app.
async function completeOrgTaskIfPresent(page) {
  if (!page.url().includes('choose-organization')) return;
  const create = page.getByRole('button', { name: /create organization/i });
  if (await create.count()) {
    await create.first().click();
    const name = page.getByLabel(/organization name/i);
    if (await name.count()) await name.fill('E2E Test Org');
    const submit = page.getByRole('button', { name: /create|continue|finish/i });
    if (await submit.count()) await submit.first().click();
  }
  await page.waitForTimeout(2000);
}

// clerkSetup() must run inside the worker process (beforeAll) so its env vars
// are visible to setupClerkTestingToken, which runs in beforeEach.
test.beforeAll(async () => {
  await clerkSetup();
});

test.describe('Clerk auth integration', () => {
  test('public landing page is reachable', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/SmartVideo GO|Studio/i);
  });

  test('protected route redirects unauthenticated users to sign-in', async ({ page }) => {
    await page.goto('/studio');
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('sign-in page renders the email/password form', async ({ page }) => {
    await page.goto('/sign-in');
    await expect(page.getByLabel(/email address/i)).toBeVisible();
    await expect(page.getByLabel(/^password$/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /continue|sign in/i })).toBeVisible();
  });

  test('sign-up page renders the registration form', async ({ page }) => {
    await page.goto('/sign-up');
    await expect(page.getByLabel(/email address/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /continue|create account/i })).toBeVisible();
  });

  test('forgot-password (reset) page renders the form', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.getByLabel(/email address/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /continue|sign in/i })).toBeVisible();
  });

  test('sign-in form accepts valid credentials (no error)', async ({ page }) => {
    test.skip(!email || !password, 'No E2E test credentials configured');
    await setupClerkTestingToken({ page });
    await page.goto('/sign-in');
    await page.getByLabel(/email address/i).fill(email);
    await page.getByLabel(/^password$/i).fill(password);
    await page.getByRole('button', { name: /continue|sign in/i }).click();
    // Valid creds are accepted: no "invalid"/"breach" error is shown.
    // (The dev instance enforces MFA/client-trust, so the UI then prompts for
    // a second factor — completed separately via clerk.signIn in the tests below.)
    await expect(page.getByText(/invalid|incorrect|breach/i)).toHaveCount(0);
  });

  // --- Authenticated flows (MFA-safe: authenticate via Clerk's sign-in token) ---
  test.describe('authenticated', () => {
    test.beforeEach(async ({ page }) => {
      test.skip(!email, 'No E2E test credentials configured');
      await page.goto('/');
      await clerk.signIn({ page, emailAddress: email });
      await completeOrgTaskIfPresent(page);
    });

    test('login reaches the studio', async ({ page }) => {
      // The active session is reflected on the landing page (signed-in header).
      // Auth controls (incl. the user button) live on the landing page, not on
      // the standalone /studio shell, so we assert the session here first.
      await page.goto('/');
      await expect(page.getByRole('button', { name: /open user menu/i })).toBeVisible();
      await page.goto('/studio');
      // Authenticated users reach the protected studio; unauthenticated users
      // are redirected to /sign-in by middleware.
      await expect(page).toHaveURL(/\/studio/);
    });

    test('account page (change password) is reachable and renders UserProfile', async ({
      page,
    }) => {
      await page.goto('/account');
      await expect(page.getByRole('heading', { name: /manage your account/i })).toBeVisible();
      // Clerk's UserProfile exposes a Profile + Security (change password) section.
      await expect(page.getByRole('button', { name: /security/i })).toBeVisible();
    });

    test('logout (sign out) returns to the landing page', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: /open user menu/i }).click();
      // Clerk renders "Sign out" as a button inside the account panel.
      await page.getByRole('button', { name: /sign out/i }).click();
      await expect(page).toHaveURL(/\/$/);
      // After sign-out the landing header shows the "Sign in" link (not a button).
      await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
    });
  });
});
