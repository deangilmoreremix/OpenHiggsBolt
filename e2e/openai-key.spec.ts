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

  test('successful save: key is persisted and survives refresh', async ({ page }) => {
    // Mock OpenAI verification to return 200 OK.
    await page.route('**/v1/models', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [{ id: 'gpt-4' }] }),
      });
    });

    const before = await getOpenAIKey(page);
    if (before?.configured) await clearOpenAIKey(page);

    await page.goto('/studio');
    await page.getByRole('button', { name: /settings/i }).click();

    const TEST_KEY = 'sk-proj-e2e-success-key-0123456789abcdef';
    await page.getByPlaceholder(/sk-... \(openai key\)/i).fill(TEST_KEY);
    await page.getByRole('button', { name: /save openai key/i }).click();

    await expect(page.getByText(/keys saved/i)).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /close/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /settings/i }).click();
    await expect(page.getByText(/active openai key/i)).toBeVisible();

    await page.reload();
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: /settings/i }).click();
    await expect(page.getByText(/active openai key/i)).toBeVisible();

    await clearOpenAIKey(page);
  });

  test('401 verification rejects save and does not persist key', async ({ page }) => {
    await page.route('**/v1/models', (route) => {
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: { message: 'Invalid API key' } }) });
    });

    await page.goto('/studio');
    await page.getByRole('button', { name: /settings/i }).click();

    const TEST_KEY = 'sk-proj-e2e-401-key-0123456789abcdef';
    await page.getByPlaceholder(/sk-... \(openai key\)/i).fill(TEST_KEY);
    await page.getByRole('button', { name: /save openai key/i }).click();

    // Should show invalid key error, not success.
    await expect(page.getByText(/openai did not recognize this api key/i)).toBeVisible({ timeout: 10000 });

    const after = await getOpenAIKey(page);
    assert.equal(after?.configured, false);
  });

  test('403 verification saves key with restriction warning', async ({ page }) => {
    await page.route('**/v1/models', (route) => {
      route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ error: { message: 'Permission denied' } }) });
    });

    await page.goto('/studio');
    await page.getByRole('button', { name: /settings/i }).click();

    const TEST_KEY = 'sk-proj-e2e-403-key-0123456789abcdef';
    await page.getByPlaceholder(/sk-... \(openai key\)/i).fill(TEST_KEY);
    await page.getByRole('button', { name: /save openai key/i }).click();

    // Should save and show restriction warning, NOT "invalid key".
    await expect(page.getByText(/restricted the verification request/i)).toBeVisible({ timeout: 10000 });
    const invalidMsg = page.getByText(/openai key is invalid/i);
    if (await invalidMsg.count()) {
      await expect(invalidMsg).toHaveCount(0);
    }

    const after = await getOpenAIKey(page);
    assert.equal(after?.configured, true);

    await clearOpenAIKey(page);
  });

  test('429 verification saves key with temporary warning', async ({ page }) => {
    await page.route('**/v1/models', (route) => {
      route.fulfill({ status: 429, contentType: 'application/json', body: JSON.stringify({ error: { message: 'Rate limit exceeded' } }) });
    });

    await page.goto('/studio');
    await page.getByRole('button', { name: /settings/i }).click();

    const TEST_KEY = 'sk-proj-e2e-429-key-0123456789abcdef';
    await page.getByPlaceholder(/sk-... \(openai key\)/i).fill(TEST_KEY);
    await page.getByRole('button', { name: /save openai key/i }).click();

    await expect(page.getByText(/rate-limited/i)).toBeVisible({ timeout: 10000 });

    const after = await getOpenAIKey(page);
    assert.equal(after?.configured, true);

    await clearOpenAIKey(page);
  });

  test('500 verification saves key with provider warning', async ({ page }) => {
    await page.route('**/v1/models', (route) => {
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: { message: 'Server error' } }) });
    });

    await page.goto('/studio');
    await page.getByRole('button', { name: /settings/i }).click();

    const TEST_KEY = 'sk-proj-e2e-500-key-0123456789abcdef';
    await page.getByPlaceholder(/sk-... \(openai key\)/i).fill(TEST_KEY);
    await page.getByRole('button', { name: /save openai key/i }).click();

    await expect(page.getByText(/verification is temporarily unavailable/i)).toBeVisible({ timeout: 10000 });

    const after = await getOpenAIKey(page);
    assert.equal(after?.configured, true);

    await clearOpenAIKey(page);
  });
});
