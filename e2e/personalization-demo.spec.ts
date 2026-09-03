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

async function getKey(page) {
  return page.evaluate(async () => {
    const base = window.location.origin;
    const r = await fetch(`${base}/api/auth/muapi-key`, { credentials: 'same-origin' });
    const j = await r.json();
    return j.key ?? null;
  });
}
async function setKey(page, key) {
  await page.evaluate(async (k) => {
    const base = window.location.origin;
    await fetch(`${base}/api/auth/muapi-key`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key: k }),
    });
  }, key);
}
async function clearKey(page) {
  await page.evaluate(async () => {
    const base = window.location.origin;
    await fetch(`${base}/api/auth/muapi-key`, { method: 'DELETE', credentials: 'same-origin' });
  });
}

test.beforeAll(async () => {
  await clerkSetup();
});

test.describe('Personalization Demo', () => {
  test.beforeEach(async ({ page }) => {
    if (email && password) {
      await page.goto('/');
      await setupClerkTestingToken({ page });
      await clerk.signIn({ page, emailAddress: email, password });
      await completeOrgTaskIfPresent(page);
    }
  });

  test('shows missing API key state when no MuAPI key is configured', async ({ page }) => {
    await page.goto('/');
    const before = await getKey(page);
    if (before) await clearKey(page);

    await page.goto('/personalization-demo');

    await expect(page.getByText(/Missing MuAPI Key/i)).toBeVisible();
    await expect(page.getByText(/Set your MuAPI key in Settings/i)).toBeVisible();
  });

  test('opens personalization modal with source demo when API key is present', async ({ page }) => {
    test.skip(!email || !password, 'No E2E test credentials configured');
    await page.goto('/');
    const before = await getKey(page);
    if (!before) {
      test.skip(true, 'No MuAPI key available for generation test');
      return;
    }

    await page.goto('/personalization-demo');

    // The modal should auto-open with the sample source.
    await expect(page.getByRole('heading', { name: /Viral Roofing Demo/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Storm Damage/i)).toBeVisible();
  });

  test('displays personalization configuration UI', async ({ page }) => {
    test.skip(!email || !password, 'No E2E test credentials configured');
    await page.goto('/');
    const before = await getKey(page);
    if (!before) {
      test.skip(true, 'No MuAPI key available');
      return;
    }

    await page.goto('/personalization-demo');
    await page.waitForTimeout(2000);

    // Verify key sections are visible
    await expect(page.getByText(/Source Demo/i)).toBeVisible();
    await expect(page.getByText(/Who Is This For/i)).toBeVisible();
    await expect(page.getByText(/Client Profile/i)).toBeVisible();
    await expect(page.getByText(/Person \/ Presenter/i)).toBeVisible();
    await expect(page.getByText(/Logo/i)).toBeVisible();
    await expect(page.getByText(/Products \/ Services/i)).toBeVisible();
    await expect(page.getByText(/Brand References/i)).toBeVisible();
    await expect(page.getByText(/First Frame/i)).toBeVisible();
    await expect(page.getByText(/Last Frame \/ CTA/i)).toBeVisible();
    await expect(page.getByText(/CTA & Business Content/i)).toBeVisible();
    await expect(page.getByText(/Original Prompt/i)).toBeVisible();
    await expect(page.getByText(/Personalized Prompt/i)).toBeVisible();
    await expect(page.getByText(/What Do You Want To Create/i)).toBeVisible();
    await expect(page.getByText(/Personalization Mode/i)).toBeVisible();
    await expect(page.getByText(/SmartVideo Recommended/i)).toBeVisible();
  });
});
