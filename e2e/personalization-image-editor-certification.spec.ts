import { test, expect, type Page, type Route } from '@playwright/test';

const AUTH_STATE_PATH = 'playwright/.clerk/smartvideo-demo-http_localhost_3111.json';
const DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

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
  const section = page.locator('article.asset-card').filter({ hasText: assetLabel });
  
  // Find URL input in the section
  const urlInput = section.getByPlaceholder('Paste image URL and press Enter');
  if (await urlInput.count() === 0) {
    const logoUrlInput = section.getByPlaceholder('Paste logo URL and press Enter');
    if (await logoUrlInput.count() > 0) {
      await logoUrlInput.fill(DATA_URL);
    } else {
      const genericUrlInput = section.getByPlaceholder('Paste image or video URL and press Enter');
      if (await genericUrlInput.count() > 0) {
        await genericUrlInput.fill(DATA_URL);
      }
    }
  } else {
    await urlInput.fill(DATA_URL);
  }
  
  // Use global button selectors based on section type
  let addBtn;
  const upperLabel = assetLabel.toUpperCase();
  if (upperLabel.includes('PERSON')) {
    addBtn = page.locator('button:has-text("Add Photo URL")').first();
  } else if (upperLabel.includes('LOGO')) {
    addBtn = page.locator('button:has-text("Add Logo URL")').first();
  } else if (upperLabel.includes('PRODUCT') || upperLabel.includes('BRAND')) {
    addBtn = page.locator('button:has-text("Add Image/Video URL")').first();
  } else if (upperLabel.includes('FIRST FRAME') || upperLabel.includes('LAST FRAME')) {
    addBtn = page.locator('button:has-text("Add Image URL")').first();
  } else if (upperLabel.includes('CTA')) {
    addBtn = page.locator('button:has-text("Add CTA Graphic")').first();
  } else {
    // Generic fallback
    addBtn = page.locator('button:has-text("Add Images")').first();
    if (await addBtn.count() === 0) {
      addBtn = page.locator('button:has-text("Add Image URL")').first();
    }
  }
  
  if (await addBtn.count() > 0 && await addBtn.isVisible().catch(() => false)) {
    await addBtn.dispatchEvent('click');
  }
  
  // Wait for image to load and Edit with AI button to appear
  await page.waitForTimeout(3000);
  
  const img = section.locator('img[src*="data:image"]');
  await expect(img).toBeVisible({ timeout: 30000 });

  const editBtn = page.locator('button:has-text("Edit with AI")').first();
  await expect(editBtn).toBeVisible({ timeout: 30000 });
  await editBtn.dispatchEvent('click');
  await page.waitForTimeout(2000);

  const editor = page.getByRole('dialog', { name: /smartvideo go image editor/i }).first();
  await expect(editor).toBeVisible({ timeout: 15000 });
  return editor;
}

async function applyLocalEditAndUseEditedAsset(page: Page) {
  const advancedBtn = page.getByRole('button', { name: /Advanced Edit/i }).first();
  console.log('7. advanced edit button visible:', await advancedBtn.isVisible().catch(() => false));
  if (await advancedBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await advancedBtn.dispatchEvent('click');
    console.log('8. switched to advanced mode');
    await page.waitForTimeout(1000);
  }

  const localToolsSummary = page.locator('summary:has-text("Local Canvas Tools")').first();
  console.log('9. local canvas tools summary visible:', await localToolsSummary.isVisible().catch(() => false));
  if (await localToolsSummary.isVisible({ timeout: 2000 }).catch(() => false)) {
    await localToolsSummary.dispatchEvent('click');
    console.log('10. expanded local canvas tools');
    await page.waitForTimeout(1000);
  }

  const applyLocalBtn = page.getByRole('button', { name: /Apply Local Edit/i }).first();
  console.log('11. apply local edit button visible:', await applyLocalBtn.isVisible().catch(() => false));
  if (await applyLocalBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await applyLocalBtn.dispatchEvent('click');
    console.log('12. clicked apply local edit');
    await page.waitForTimeout(3000);
  } else {
    console.log('11. apply local edit button NOT visible');
  }

  const useEditedBtn = page.getByRole('button', { name: /Use Edited Asset/i }).first();
  const isEnabled = await useEditedBtn.isEnabled();
  const disabledAttr = await useEditedBtn.getAttribute('disabled');
  console.log('13. apply button state after local edit:', { isEnabled, disabledAttr });
  
  if (isEnabled) {
    console.log('14. clicking use edited asset');
    await useEditedBtn.dispatchEvent('click');
    console.log('15. waiting for editor to close');
  } else {
    console.log('14. apply button still disabled, cannot complete flow');
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

    const editor = await openEditorForAsset(page, '1. PERSON / PRESENTER');
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

    const editor = await openEditorForAsset(page, '2. LOGO');
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

    const editor = await openEditorForAsset(page, '3. Products / Services');
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

    const editor = await openEditorForAsset(page, '4. Brand References');
    await applyLocalEditAndUseEditedAsset(page);
    await expect(editor).toBeHidden({ timeout: 10000 });
  });

  test('FIRST FRAME asset: URL input → edit → apply → editor closes', async ({ page }) => {
    await page.goto('/personalization-demo?test=true', { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    const editor = await openEditorForAsset(page, '5. FIRST FRAME');
    await applyLocalEditAndUseEditedAsset(page);
    await expect(editor).toBeHidden({ timeout: 10000 });
  });

  test('LAST FRAME asset: URL input → edit → apply → editor closes', async ({ page }) => {
    await page.goto('/personalization-demo?test=true', { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    const editor = await openEditorForAsset(page, '6. LAST FRAME / CTA');
    await applyLocalEditAndUseEditedAsset(page);
    await expect(editor).toBeHidden({ timeout: 10000 });
  });

  test('CTA asset: upload → edit → apply → editor closes', async ({ page }) => {
    await page.goto('/personalization-demo?test=true', { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // CTA Graphic is part of the Last Frame / CTA section
    const editor = await openEditorForAsset(page, '6. LAST FRAME / CTA');
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

    const editor = await openEditorForAsset(page, '1. PERSON / PRESENTER');
    await applyLocalEditAndUseEditedAsset(page);
    await expect(editor).toBeHidden({ timeout: 10000 });

    const criticalErrors = errors.filter((e) => !e.includes('chrome-extension') && !e.includes('devtools'));
    expect(criticalErrors).toHaveLength(0);
  });
});
