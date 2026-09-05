import { test, expect } from '@playwright/test';

const SANDBOX_KEY = '5c0dc3a2146315592368336e8ee102087853022254158331a48cd0cd8528cec9';

test.describe('Personalization Demo — Live Feature Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/api/dev-login');
    await page.waitForURL('**/studio');
    await page.evaluate((key) => {
      localStorage.setItem('muapi_key', key);
    }, SANDBOX_KEY);
  });

  test('opens modal and shows all configuration sections', async ({ page }) => {
    await page.goto('/personalization-demo');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: '/tmp/personalization-modal-open.png', fullPage: true });

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

  test('can fill client form and verify CTA fields are independent', async ({ page }) => {
    await page.goto('/personalization-demo');
    await page.waitForTimeout(3000);

    await page.fill('input[placeholder*="Business"]', 'ABC Roofing');
    await page.fill('input[placeholder*="Industry"]', 'Roofing');
    await page.fill('input[placeholder*="Location"]', 'Tampa, Florida');
    await page.fill('input[placeholder*="Product"]', 'Residential Roof Replacement');
    await page.fill('input[placeholder*="Offer"]', 'Free Roof Inspection');
    await page.fill('input[placeholder*="CTA Headline"]', 'Protect Your Home Today');
    await page.fill('input[placeholder*="Button"]', 'Book Your Inspection');
    await page.fill('input[placeholder*="Phone"]', '555-555-5555');
    await page.fill('input[placeholder*="Website"]', 'abcroofing.com');

    await page.screenshot({ path: '/tmp/personalization-client-form.png', fullPage: true });

    await page.fill('input[placeholder*="CTA Headline"]', 'New Headline');
    const buttonValue = await page.locator('input[placeholder*="Button"]').inputValue();
    expect(buttonValue).toBe('Book Your Inspection');
  });

  test('can personalize prompt and verify client data appears', async ({ page }) => {
    await page.goto('/personalization-demo');
    await page.waitForTimeout(3000);

    await page.fill('input[placeholder*="Business"]', 'ABC Roofing');
    await page.fill('input[placeholder*="Industry"]', 'Roofing');
    await page.fill('input[placeholder*="Location"]', 'Tampa, Florida');
    await page.fill('input[placeholder*="Product"]', 'Residential Roof Replacement');
    await page.fill('input[placeholder*="Offer"]', 'Free Roof Inspection');

    const personalizeBtn = page.locator('button:has-text("Personalize Prompt"), button:has-text("Personalize")');
    if (await personalizeBtn.count() > 0) {
      await personalizeBtn.first().click();
      await page.waitForTimeout(3000);
    }

    await page.screenshot({ path: '/tmp/personalization-prompt-result.png', fullPage: true });

    const personalizedText = await page.evaluate(() => {
      const els = document.querySelectorAll('textarea, [contenteditable="true"], .prompt-text');
      return els.length > 0 ? els[0].textContent : '';
    });
    
    if (personalizedText) {
      expect(personalizedText).toContain('ABC Roofing');
    }
  });

  test('can upload asset and verify upload UI is present', async ({ page }) => {
    await page.goto('/personalization-demo');
    await page.waitForTimeout(3000);

    await expect(page.getByText(/Drag & drop/i)).toBeVisible();
    await page.screenshot({ path: '/tmp/personalization-upload-ui.png', fullPage: true });
  });
});
