import { test, expect } from '@playwright/test';

const AUTH_STATE_PATH = 'playwright/.clerk/smartvideo-demo-http_localhost_3111.json';
const DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

test.use({ storageState: AUTH_STATE_PATH });

test('dump after fix', async ({ page }) => {
  await page.goto('/personalization-demo?test=true');
  await page.waitForLoadState('domcontentloaded', { timeout: 10000 });

  await page.fill('input[placeholder="ABC Roofing"]', 'Certification Roofing');
  await page.fill('input[placeholder="Roofing"]', 'Roofing');
  await page.fill('input[placeholder="Tampa, Florida"]', 'Tampa, Florida');
  await page.fill('input[placeholder="Residential Roof Replacement"]', 'Roof Replacement');
  await page.fill('input[placeholder="Free Roof Inspection"]', 'Free Inspection');

  const urlInputs = page.locator('input[type="text"]');
  const firstUrlInput = urlInputs.nth(0);
  await firstUrlInput.fill(DATA_URL);
  await page.locator('button:has-text("Add Photo URL")').first().dispatchEvent('click');

  const editButton = page.locator('button:has-text("Edit with AI")').first();
  await expect(editButton).toBeVisible({ timeout: 30000 });
  await editButton.dispatchEvent('click');

  const editor = page.getByRole('dialog', { name: /smartvideo go image editor/i }).first();
  await expect(editor).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(2000);

  // Switch to advanced mode
  const advancedBtn = page.getByRole('button', { name: /Advanced Edit/i }).first();
  if (await advancedBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await advancedBtn.dispatchEvent('click');
    await page.waitForTimeout(1000);
  }

  // Expand Local Canvas Tools
  const localToolsSummary = page.locator('summary:has-text("Local Canvas Tools")').first();
  if (await localToolsSummary.isVisible({ timeout: 2000 }).catch(() => false)) {
    await localToolsSummary.dispatchEvent('click');
    await page.waitForTimeout(1000);
  }

  // Click Apply Local Edit
  const applyLocalBtn = page.getByRole('button', { name: /Apply Local Edit/i }).first();
  if (await applyLocalBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await applyLocalBtn.dispatchEvent('click');
    await page.waitForTimeout(3000);
  }

  // Click apply button
  const applyBtn = page.getByRole('button', { name: /use edited asset/i }).first();
  if (await applyBtn.isEnabled()) {
    await applyBtn.dispatchEvent('click');
    await page.waitForTimeout(3000);
  }
  
  // Dump all text in the editor
  const allText = await page.locator('.fixed.inset-0.z-\\[120\\]').textContent();
  console.log('All text in editor after fix:', allText?.slice(0, 1000));
});
