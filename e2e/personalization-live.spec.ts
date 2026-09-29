import { test, expect, type Page, type Route } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';

const BASE = 'http://localhost:3111';
const FAKE_MUAPI_KEY = 'e2e-fake-muapi-key';
const FAKE_OPENAI_KEY = 'e2e-fake-openai-key';
const OUTPUT_DIR = path.resolve(__dirname, '../visual-assets/marketing-current/personalization');

async function ensureDir(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function marketingShot(page: Page, name: string, fullPage = true) {
  const filePath = path.join(OUTPUT_DIR, `${name}.png`);
  await ensureDir(filePath);
  await page.screenshot({ path: filePath, fullPage });
}

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
    await marketingShot(page, '01-modal-overview');

    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Source Demo');
    expect(bodyText).toContain('WHO IS THIS FOR?');
    expect(bodyText).toContain('Client Profile');
    expect(bodyText).toContain('Person / Presenter');
    expect(bodyText).toContain('Products / Services');
    expect(bodyText).toContain('Brand References');
    expect(bodyText).toContain('First Frame');
    expect(bodyText).toContain('Last Frame / CTA');
    expect(bodyText).toContain('CTA & BUSINESS CONTENT');
    expect(bodyText).toContain('Original Prompt');
    expect(bodyText).toContain('Personalized Prompt');
    expect(bodyText).toContain('STEP 4 — CREATE');
    expect(bodyText).toContain('SMARTVIDEO ENGINE');
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
    await page.fill('input[placeholder="https://joesroofing.com"]', 'https://abcroofing.com');

    await marketingShot(page, '02-client-profile');

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
    
    await expect(page.getByText('Personalizing prompt...')).toBeVisible({ timeout: 10000 });

    await marketingShot(page, '03-personalized-prompt');
  });

  test('can upload asset and verify upload UI is present', async ({ page }) => {
    const uploadText = page.getByText(/Drag & drop or browse/i).first();
    await expect(uploadText).toBeVisible();
    await marketingShot(page, '04-asset-upload');
  });

  test('can upload image and open edit image entry', async ({ page }) => {
    // Fill required client fields so uploads/assets are enabled.
    await page.fill('input[placeholder="ABC Roofing"]', 'ABC Roofing');
    await page.fill('input[placeholder="Roofing"]', 'Roofing');
    await page.fill('input[placeholder="Tampa, Florida"]', 'Tampa, Florida');
    await page.fill('input[placeholder="Residential Roof Replacement"]', 'Residential Roof Replacement');
    await page.fill('input[placeholder="Free Roof Inspection"]', 'Free Roof Inspection');

    // Upload a small image into the Person / Presenter identity uploader.
    const fileInput = page.locator('input[type="file"]').first();
    await expect(fileInput).toBeAttached();
    await fileInput.setInputFiles(path.join(__dirname, '../../test-assets/sample-person.png'));

    // Wait for the asset to become ready and expose Edit with AI.
    const editButton = page.locator('button:has-text("Edit with AI")').first();
    await expect(editButton).toBeVisible({ timeout: 30000 });

    await editButton.click();
    await expect(page.locator('.image-editor-modal, [data-testid="image-editor-modal"], text=Edit Image').first()).toBeVisible({ timeout: 10000 });
    await marketingShot(page, '06-edit-image-entry');
  });

  test('can reveal what smartvideo will use engine section', async ({ page }) => {
    await page.fill('input[placeholder="ABC Roofing"]', 'ABC Roofing');
    await page.fill('input[placeholder="Roofing"]', 'Roofing');
    await page.fill('input[placeholder="Tampa, Florida"]', 'Tampa, Florida');
    await page.fill('input[placeholder="Residential Roof Replacement"]', 'Residential Roof Replacement');
    await page.fill('input[placeholder="Free Roof Inspection"]', 'Free Roof Inspection');

    const engineSection = page.locator('text=SMARTVIDEO ENGINE').first();
    await expect(engineSection).toBeVisible();
    await engineSection.scrollIntoViewIfNeeded();
    await marketingShot(page, '07-what-smartvideo-will-use', false);
  });
});
});
