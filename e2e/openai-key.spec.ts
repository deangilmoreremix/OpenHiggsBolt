import { test, expect } from '@playwright/test';
import { clerkSetup, clerk, setupClerkTestingToken } from '@clerk/testing/playwright';

const email = process.env.E2E_TEST_EMAIL;
const password = process.env.E2E_TEST_PASSWORD;

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

async function getOpenAIKey(page) {
  return page.evaluate(async () => {
    const r = await fetch('/api/auth/openai-key', { credentials: 'same-origin' });
    const j = await r.json();
    return j;
  });
}

async function setOpenAIKey(page, key) {
  await page.evaluate(async (k) => {
    await fetch('/api/auth/openai-key', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ openaiKey: k }),
    });
  }, key);
}

async function clearOpenAIKey(page) {
  await page.evaluate(async () => {
    await fetch('/api/auth/openai-key', { method: 'DELETE', credentials: 'same-origin' });
  });
}

test.beforeAll(async () => {
  await clerkSetup();
});

test.describe('OpenAI API key E2E flow', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!email || !password, 'No E2E test credentials configured');
    await page.goto('/');
    await setupClerkTestingToken({ page });
    await clerk.signIn({ page, emailAddress: email, password });
    await completeOrgTaskIfPresent(page);
  });

  test('user can save an OpenAI key and see it as configured after refresh', async ({ page }) => {
    const before = await getOpenAIKey(page);
    if (before?.configured) await clearOpenAIKey(page);

    // Open Settings.
    await page.goto('/studio');
    await page.getByRole('button', { name: /settings/i }).click();

    // Enter a fake sk-proj-style key.
    const TEST_KEY = 'sk-proj-e2e-test-key-0123456789abcdef';
    await page.getByPlaceholder(/sk-... \(openai key\)/i).fill(TEST_KEY);
    await page.getByRole('button', { name: /save openai key/i }).click();

    // Should show a success message (server returns 200 with verification status).
    await expect(page.getByText(/keys saved|saved|verified/i)).toBeVisible({ timeout: 10000 });

    // Reopen Settings and verify it shows as configured.
    await page.getByRole('button', { name: /close/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /settings/i }).click();

    // The OpenAI section should show the masked key.
    await expect(page.getByText(/active openai key/i)).toBeVisible();

    // Refresh the page and verify it persists.
    await page.reload();
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: /settings/i }).click();
    await expect(page.getByText(/active openai key/i)).toBeVisible();

    // Cleanup.
    await clearOpenAIKey(page);
  });

  test('403 verification response does not tell the user the key is invalid', async ({ page }) => {
    await page.goto('/studio');
    await page.getByRole('button', { name: /settings/i }).click();

    // We cannot force a 403 from the real OpenAI API in E2E without a restricted
    // project key, so we verify the UI does not display the "invalid key" error
    // for keys that merely fail provider verification. Instead, it should show a
    // non-destructive warning.
    const TEST_KEY = 'sk-proj-e2e-403-simulation-key-0123456789abcdef';
    await page.getByPlaceholder(/sk-... \(openai key\)/i).fill(TEST_KEY);
    await page.getByRole('button', { name: /save openai key/i }).click();

    // The key should save (server accepts it). We should NOT see "invalid API key".
    const invalidMsg = page.getByText(/openai key is invalid/i);
    if (await invalidMsg.count()) {
      await expect(invalidMsg).toHaveCount(0);
    }

    // Cleanup.
    await clearOpenAIKey(page);
  });
});
