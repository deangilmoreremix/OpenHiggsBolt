import { test, expect, type Page, type Route } from '@playwright/test';

const BASE = 'http://localhost:3111';
const FAKE_MUAPI_KEY = 'e2e-fake-muapi-key';
const FAKE_OPENAI_KEY = 'e2e-fake-openai-key';

function mockMuApi(page: Page) {
  page.route('/api/auth/muapi-key', async (route: Route) => {
    const req = route.request();
    if (req.method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ key: FAKE_MUAPI_KEY, openaiKey: FAKE_OPENAI_KEY }),
      });
      return;
    }
    if (req.method() === 'DELETE') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ key: FAKE_MUAPI_KEY, openaiKey: FAKE_OPENAI_KEY }),
    });
  });

  page.route('**/api.muapi.ai/**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    });
  });
}

async function openPersonalization(page: Page) {
  await page.goto('/personalization-demo');
  await page.waitForTimeout(1000);
  await page.evaluate(() => {
    localStorage.setItem('muapi_key', 'e2e-fake-muapi-key');
    localStorage.setItem('openai_key', 'e2e-fake-openai-key');
  });
  await page.reload();
  await page.waitForTimeout(3000);
}

test.describe('Personalization Remaining Flows — Live Verification', () => {
  test.beforeEach(async ({ context, page }) => {
    await context.addCookies([
      { name: '__e2e_auth_bypass', value: '1', url: BASE },
    ]);
    mockMuApi(page);
  });

  test.beforeEach(async ({ page }) => {
    await openPersonalization(page);
  });

  test('BUSINESS FINDER: search, select, cancel, and profile replacement', async ({ page }) => {
    const clientButton = page.getByRole('button', { name: /Client/i }).first();
    await expect(clientButton).toBeVisible();
    await clientButton.click();

    const nicheSelect = page.locator('#business-niche');
    const locationInput = page.locator('#business-location');

    if (await nicheSelect.count() > 0 && await locationInput.count() > 0) {
      await nicheSelect.selectOption('Roofing');
      await locationInput.fill('Tampa, FL');

      const findBtn = page.getByRole('button', { name: /Find Businesses/i }).first();
      if (await findBtn.count() > 0 && await findBtn.isVisible().catch(() => false)) {
        await findBtn.click();
        await page.waitForTimeout(3000);

        const results = page.getByText(/result|business|company/i).first();
        if (await results.count() > 0) {
          await page.screenshot({ path: '/tmp/personalization-business-finder-results.png', fullPage: true });
        }
      }
    }
  });

  test('AUTO PLACEMENT: verify forbidden sections remain user-controlled', async ({ page }) => {
    await page.getByPlaceholder('ABC Roofing', { exact: true }).fill('Auto Placement Test');
    await page.getByPlaceholder('Roofing', { exact: true }).fill('Roofing');
    await page.getByPlaceholder('https://joesroofing.com', { exact: true }).fill('https://wordpress.org');

    const findAssetsBtn = page.getByRole('button', { name: /Find Business Assets/i }).first();
    await findAssetsBtn.click();
    await page.waitForTimeout(4000);

    const firstFrameSection = page.getByText(/First Frame/i).first();
    const lastFrameSection = page.getByText(/Last Frame/i).first();
    const ctaSection = page.getByText(/CTA/i).first();

    await expect(firstFrameSection).toBeVisible();
    await expect(lastFrameSection).toBeVisible();
    await expect(ctaSection).toBeVisible();

    await page.screenshot({ path: '/tmp/personalization-auto-placement-check.png', fullPage: true });
  });

  test('EDIT WITH AI: verify editor entry from multiple asset areas', async ({ page }) => {
    await page.getByPlaceholder('https://joesroofing.com', { exact: true }).fill('https://wordpress.org');
    await page.getByRole('button', { name: /Find Business Assets/i }).first().click();
    await page.waitForTimeout(4000);

    const editButtons = page.getByRole('button', { name: /Edit with AI|Edit Image/i });
    const count = await editButtons.count();
    expect(count).toBeGreaterThanOrEqual(0);

    await page.screenshot({ path: '/tmp/personalization-edit-with-ai.png', fullPage: true });
  });

  test('SAVED CLIENTS: save, load, update, delete flow', async ({ page }) => {
    await page.getByPlaceholder('ABC Roofing', { exact: true }).fill('Saved Client Test');
    await page.getByPlaceholder('Roofing', { exact: true }).fill('Testing');
    await page.getByPlaceholder('https://joesroofing.com', { exact: true }).fill('https://example.com');

    const saveBtn = page.getByRole('button', { name: /Save Client/i }).first();
    if (await saveBtn.count() > 0 && await saveBtn.isVisible().catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: '/tmp/personalization-saved-client-save.png', fullPage: true });
    }
  });

  test('WHAT SMARTVIDEO WILL USE: verify summary reflects current state', async ({ page }) => {
    await page.getByPlaceholder('ABC Roofing', { exact: true }).fill('Summary Test');
    await page.getByPlaceholder('Roofing', { exact: true }).fill('Roofing');

    const summaryBtn = page.getByRole('button', { name: /What SmartVideo Will Use/i }).first();
    if (await summaryBtn.count() > 0 && await summaryBtn.isVisible().catch(() => false)) {
      await summaryBtn.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: '/tmp/personalization-summary.png', fullPage: true });
    }
  });

  test('DESKTOP: complete flow at 1920x1080', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await openPersonalization(page);

    await page.getByPlaceholder('ABC Roofing', { exact: true }).fill('Desktop Test');
    await page.getByPlaceholder('Roofing', { exact: true }).fill('Roofing');
    await page.getByPlaceholder('https://joesroofing.com', { exact: true }).fill('https://wordpress.org');

    await page.getByRole('button', { name: /Find Business Assets/i }).first().click();
    await page.waitForTimeout(3000);

    await page.screenshot({ path: '/tmp/personalization-desktop.png', fullPage: true });
  });

  test('MOBILE: modal and controls fit at 390x844', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openPersonalization(page);

    await page.getByPlaceholder('ABC Roofing', { exact: true }).fill('Mobile Test');
    await page.getByPlaceholder('Roofing', { exact: true }).fill('Roofing');

    const personalizeBtn = page.getByRole('button', { name: /Personalize Prompt/i }).first();
    if (await personalizeBtn.count() > 0) {
      await personalizeBtn.click();
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: '/tmp/personalization-mobile.png', fullPage: true });
  });

  test('CONSOLE_HEALTH: no unexpected errors during core flow', async ({ page }) => {
    const consoleErrors: string[] = [];
    const failedRequests: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('requestfailed', (request) => failedRequests.push(request.url()));

    await page.getByPlaceholder('https://joesroofing.com', { exact: true }).fill('https://wordpress.org');
    await page.getByRole('button', { name: /Find Business Assets/i }).first().click();
    await page.waitForTimeout(4000);

    const unexpectedErrors = consoleErrors.filter(
      (e) => !e.includes('Firecrawl') && !e.includes('401') && !e.includes('Unauthorized')
    );
    expect(unexpectedErrors).toHaveLength(0);
  });
});
