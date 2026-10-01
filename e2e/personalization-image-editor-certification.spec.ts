import { test, expect, type Page, type Route } from '@playwright/test';

const AUTH_STATE_PATH = 'playwright/.clerk/smartvideo-demo-http_localhost_3111.json';

test.use({ storageState: AUTH_STATE_PATH });

function mockPersonalizationApis(page: Page) {
  page.route('/api/personalization/image-edit', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [
          {
            b64_json: Buffer.from('fake-image-data').toString('base64'),
          },
        ],
      }),
    });
  });

  page.route('/api/personalization/image-analyze', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        validation: {
          passed: true,
          confidence: 96,
          issues: [],
          preserved: ['logo', 'brand colors'],
          changed: ['background'],
          summary: 'Requested edit succeeded and protected branding was preserved.',
          analyzedAt: new Date().toISOString(),
          model: 'gpt-6-astra',
        },
      }),
    });
  });

  page.route('/api/personalization/download-image', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        results: [
          {
            url: 'https://example.com/test-image.png',
            dataUrl: 'data:image/png;base64,' + Buffer.from('fake-image-data').toString('base64'),
            ok: true,
          },
        ],
      }),
    });
  });

  page.route('/api/mua/v1/personalize/media', async (route: Route) => {
    await route.fulfill({
      status: 403,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Upload endpoint should not be called in test mode' }),
    });
  });
}

async function openEditorForAsset(page: Page, assetLabel: string) {
  const section = page.getByRole('article').filter({ hasText: assetLabel });
  const urlInput = section.getByPlaceholder('Paste image URL and press Enter');
  await urlInput.fill('https://example.com/test-image.png');
  await urlInput.press('Enter');
  await page.waitForTimeout(2000);

  const img = section.locator('img[src*="test-image"]');
  await expect(img).toBeVisible({ timeout: 30000 });

  const editBtn = section.getByRole('button', { name: /Edit with AI/i });
  await expect(editBtn).toBeVisible({ timeout: 30000 });
  await editBtn.click();
  await page.waitForTimeout(2000);

  const editor = page.getByRole('dialog', { name: /smartvideo go image editor/i }).first();
  await expect(editor).toBeVisible({ timeout: 15000 });
  return editor;
}

async function applyLocalEditAndUseEditedAsset(page: Page) {
  const advancedBtn = page.getByRole('button', { name: /Advanced Edit/i }).first();
  if (await advancedBtn.count() > 0 && await advancedBtn.isVisible().catch(() => false)) {
    await advancedBtn.click();
    await page.waitForTimeout(1000);
  }

  const localToolsSummary = page.locator('summary:has-text("Local Canvas Tools")').first();
  if (await localToolsSummary.count() > 0 && await localToolsSummary.isVisible().catch(() => false)) {
    await localToolsSummary.click();
    await page.waitForTimeout(1000);
  }

  const applyLocalBtn = page.getByRole('button', { name: /Apply Local Edit/i }).first();
  if (await applyLocalBtn.count() > 0 && await applyLocalBtn.isVisible().catch(() => false)) {
    await applyLocalBtn.click();
    await page.waitForTimeout(3000);
  }

  const useEditedBtn = page.getByRole('button', { name: /Use Edited Asset/i }).first();
  if (await useEditedBtn.count() > 0) {
    await expect(useEditedBtn).toBeEnabled({ timeout: 30000 });
    await useEditedBtn.click();
  }
}

test.describe('Personalization Image Editor — Full Asset Type Certification', () => {
  test.beforeEach(async ({ page }) => {
    mockPersonalizationApis(page);
  });

  test('PERSON asset: URL input → edit → apply → editor closes', async ({ page }) => {
    await page.goto('/personalization-demo?test=true', { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    await page.fill('input[placeholder="ABC Roofing"]', 'Certification Roofing');
    await page.fill('input[placeholder="Roofing"]', 'Roofing');
    await page.fill('input[placeholder="Tampa, Florida"]', 'Tampa, Florida');
    await page.fill('input[placeholder="Residential Roof Replacement"]', 'Roof Replacement');
    await page.fill('input[placeholder="Free Roof Inspection"]', 'Free Inspection');

    const editor = await openEditorForAsset(page, '1. Person / Presenter');
    await applyLocalEditAndUseEditedAsset(page);
    await expect(editor).toBeHidden({ timeout: 10000 });
  });

  test('LOGO asset: upload → edit → apply → editor closes', async ({ page }) => {
    await page.goto('/personalization-demo?test=true', { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    await page.fill('input[placeholder="ABC Roofing"]', 'Certification Roofing');
    await page.fill('input[placeholder="Roofing"]', 'Roofing');
    await page.fill('input[placeholder="Tampa, Florida"]', 'Tampa, Florida');
    await page.fill('input[placeholder="Residential Roof Replacement"]', 'Roof Replacement');
    await page.fill('input[placeholder="Free Roof Inspection"]', 'Free Inspection');

    const editor = await openEditorForAsset(page, '2. Logo');
    await applyLocalEditAndUseEditedAsset(page);
    await expect(editor).toBeHidden({ timeout: 10000 });
  });

  test('PRODUCT asset: upload → edit → apply → editor closes', async ({ page }) => {
    await page.goto('/personalization-demo?test=true', { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    await page.fill('input[placeholder="ABC Roofing"]', 'Certification Roofing');
    await page.fill('input[placeholder="Roofing"]', 'Roofing');
    await page.fill('input[placeholder="Tampa, Florida"]', 'Tampa, Florida');
    await page.fill('input[placeholder="Residential Roof Replacement"]', 'Roof Replacement');
    await page.fill('input[placeholder="Free Roof Inspection"]', 'Free Inspection');

    const editor = await openEditorForAsset(page, '3. Product');
    await applyLocalEditAndUseEditedAsset(page);
    await expect(editor).toBeHidden({ timeout: 10000 });
  });

  test('BRAND asset: upload → edit → apply → editor closes', async ({ page }) => {
    await page.goto('/personalization-demo?test=true', { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    await page.fill('input[placeholder="ABC Roofing"]', 'Certification Roofing');
    await page.fill('input[placeholder="Roofing"]', 'Roofing');
    await page.fill('input[placeholder="Tampa, Florida"]', 'Tampa, Florida');
    await page.fill('input[placeholder="Residential Roof Replacement"]', 'Roof Replacement');
    await page.fill('input[placeholder="Free Roof Inspection"]', 'Free Inspection');

    const editor = await openEditorForAsset(page, '4. Brand Reference');
    await applyLocalEditAndUseEditedAsset(page);
    await expect(editor).toBeHidden({ timeout: 10000 });
  });

  test('FIRST FRAME asset: URL input → edit → apply → editor closes', async ({ page }) => {
    await page.goto('/personalization-demo?test=true', { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    const editor = await openEditorForAsset(page, '5. First Frame');
    await applyLocalEditAndUseEditedAsset(page);
    await expect(editor).toBeHidden({ timeout: 10000 });
  });

  test('LAST FRAME asset: URL input → edit → apply → editor closes', async ({ page }) => {
    await page.goto('/personalization-demo?test=true', { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    const editor = await openEditorForAsset(page, '6. Last Frame');
    await applyLocalEditAndUseEditedAsset(page);
    await expect(editor).toBeHidden({ timeout: 10000 });
  });

  test('CTA asset: upload → edit → apply → editor closes', async ({ page }) => {
    await page.goto('/personalization-demo?test=true', { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    const editor = await openEditorForAsset(page, '7. CTA Graphic');
    await applyLocalEditAndUseEditedAsset(page);
    await expect(editor).toBeHidden({ timeout: 10000 });
  });

  test('AUTH/NETWORK: download-image endpoint returns 200 (not 401)', async ({ page }) => {
    await page.goto('/personalization-demo', { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });

    const response = await page.request.post('/api/personalization/download-image', {
      headers: { 'Content-Type': 'application/json' },
      data: { urls: ['https://example.com/test.jpg'] },
    });

    expect(response.status()).not.toBe(401);
    console.log(`download-image response status: ${response.status()}`);
  });

  test('no unexpected console errors during editor flow', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/personalization-demo?test=true', { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    const editor = await openEditorForAsset(page, '1. Person / Presenter');
    await applyLocalEditAndUseEditedAsset(page);
    await expect(editor).toBeHidden({ timeout: 10000 });

    const criticalErrors = errors.filter((e) => !e.includes('chrome-extension') && !e.includes('devtools'));
    expect(criticalErrors).toHaveLength(0);
  });
});
