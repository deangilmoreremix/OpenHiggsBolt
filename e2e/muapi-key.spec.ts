import { test, expect } from '@playwright/test';
import { clerkSetup, clerk, setupClerkTestingToken } from '@clerk/testing/playwright';

const email = process.env.E2E_TEST_EMAIL;
const password = process.env.E2E_TEST_PASSWORD;

// The dev instance may require choosing/creating an organization on first sign-in.
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

// Helper to read / clear / restore the signed-in user's stored key so the test
// is non-destructive (it leaves the account in the state it found it).
async function getKey(page) {
  return page.evaluate(async () => {
    const r = await fetch('/api/auth/muapi-key', { credentials: 'same-origin' });
    const j = await r.json();
    return j.key ?? null;
  });
}
async function setKey(page, key) {
  await page.evaluate(async (k) => {
    await fetch('/api/auth/muapi-key', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key: k }),
    });
  }, key);
}
async function clearKey(page) {
  await page.evaluate(async () => {
    await fetch('/api/auth/muapi-key', { method: 'DELETE', credentials: 'same-origin' });
  });
}

test.beforeAll(async () => {
  await clerkSetup();
});

test.describe('MuAPI key first-run experience', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!email || !password, 'No E2E test credentials configured');
    await page.goto('/');
    await setupClerkTestingToken({ page });
    await clerk.signIn({ page, emailAddress: email, password });
    await completeOrgTaskIfPresent(page);
  });

  test('signed-in user with no key is prompted to add one (first-run modal)', async ({ page }) => {
    const before = await getKey(page);
    if (before) await clearKey(page);

    await page.goto('/studio');
    // The first-run prompt opens the Settings modal in its "Add your API key" state.
    await expect(page.getByRole('heading', { name: /add your api key/i })).toBeVisible();
    await expect(
      page.getByRole('link', { name: /get your key at muapi\.ai/i })
    ).toBeVisible();

    // Restore prior state so the account is left untouched.
    if (before) await setKey(page, before);
  });

  test('entering a key in the modal persists it and closes the prompt', async ({ page }) => {
    const before = await getKey(page);
    if (before) await clearKey(page);

    await page.goto('/studio');
    await expect(page.getByRole('heading', { name: /add your api key/i })).toBeVisible();

    const TEST_KEY = 'sk_e2e_test_key_not_real_0123456789';
    await page.getByPlaceholder(/enter your muapi key/i).fill(TEST_KEY);
    await page.getByRole('button', { name: /save key/i }).click();

    // Modal closes and the key is now retrievable from the account.
    await expect(page.getByRole('heading', { name: /add your api key/i })).toHaveCount(0);
    const after = await getKey(page);
    expect(after).toBe(TEST_KEY);

    // Restore prior state (prefer the original key, else just clear the test one).
    if (before) await setKey(page, before);
    else await clearKey(page);
  });
});
