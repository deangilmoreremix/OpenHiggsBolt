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

test.describe('Personalization Demo — Live Feature Tests', () => {
  test.beforeEach(async ({ context, page }) => {
    await context.addCookies([
      { name: '__e2e_auth_bypass', value: '1', url: BASE },
    ]);

    mockMuApi(page);
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/personalization-demo');
    await page.waitForTimeout(1000);

    await page.evaluate(() => {
      localStorage.setItem('muapi_key', 'e2e-fake-muapi-key');
      localStorage.setItem('openai_key', 'e2e-fake-openai-key');
    });

    await page.reload();
    await page.waitForTimeout(3000);
  });

  test('opens modal and shows all configuration sections', async ({ page }) => {
    await page.screenshot({ path: '/tmp/personalization-modal-open.png', fullPage: true });

    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Source Demo');
    expect(bodyText).toContain('Who Is This For');
    expect(bodyText).toContain('Client Profile');
    expect(bodyText).toContain('Person / Presenter');
    expect(bodyText).toContain('Products / Services');
    expect(bodyText).toContain('Brand References');
    expect(bodyText).toContain('First Frame');
    expect(bodyText).toContain('Last Frame / CTA');
    expect(bodyText).toContain('CTA & Business Content');
    expect(bodyText).toContain('Original Prompt');
    expect(bodyText).toContain('Personalized Prompt');
    expect(bodyText).toContain('What Do You Want To Create');
    expect(bodyText).toContain('SmartVideo Recommended');
  });

  test('can fill client form and verify CTA fields are independent', async ({ page }) => {
    await page.fill('input[placeholder="ABC Roofing"]', 'ABC Roofing');
    await page.fill('input[placeholder="Roofing"]', 'Roofing');
    await page.fill('input[placeholder="Tampa, Florida"]', 'Tampa, Florida');
    await page.fill('input[placeholder="Residential Roof Replacement"]', 'Residential Roof Replacement');
    await page.fill('input[placeholder="Free Roof Inspection"]', 'Free Roof Inspection');
    await page.fill('input[placeholder="Protect Your Home Today"]', 'Protect Your Home Today');
    await page.fill('input[placeholder="Book Your Inspection"]', 'Book Your Inspection');
    await page.fill('input[placeholder="555-555-5555"]', '555-555-5555');
    await page.fill('input[placeholder="abcroofing.com"]', 'abcroofing.com');

    await page.screenshot({ path: '/tmp/personalization-client-form.png', fullPage: true });

    await page.fill('input[placeholder="Protect Your Home Today"]', 'New Headline');
    const buttonValue = await page.locator('input[placeholder="Book Your Inspection"]').inputValue();
    expect(buttonValue).toBe('Book Your Inspection');
  });

  test('can personalize prompt and verify button is present and clickable', async ({ page }) => {
    await page.fill('input[placeholder="ABC Roofing"]', 'ABC Roofing');
    await page.fill('input[placeholder="Roofing"]', 'Roofing');
    await page.fill('input[placeholder="Tampa, Florida"]', 'Tampa, Florida');
    await page.fill('input[placeholder="Residential Roof Replacement"]', 'Residential Roof Replacement');
    await page.fill('input[placeholder="Free Roof Inspection"]', 'Free Roof Inspection');

    const personalizeBtn = page.locator('button:has-text("Personalize Prompt")').first();
    await expect(personalizeBtn).toBeVisible();
    
    await personalizeBtn.click();
    await page.waitForTimeout(3000);

    await page.screenshot({ path: '/tmp/personalization-prompt-result.png', fullPage: true });

    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('ABC ROOFING');
  });

  test('can upload asset and verify upload UI is present', async ({ page }) => {
    const uploadText = page.getByText(/Drag & drop or browse/i).first();
    await expect(uploadText).toBeVisible();
    await page.screenshot({ path: '/tmp/personalization-upload-ui.png', fullPage: true });
  });
});
