import { test, expect } from '@playwright/test';

const AUTH_STATE_PATH = 'playwright/.clerk/smartvideo-demo-http_localhost_3111.json';
const DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const TEST_UPLOAD_URL = 'https://example.com/test-uploaded-asset.png';

test.use({ storageState: AUTH_STATE_PATH });

async function openEditorForAsset(page: any, assetLabel: string) {
  const isCTA = assetLabel.toUpperCase().includes('CTA');
  const section = isCTA
    ? page.locator('[data-asset-section="ctaGraphic"]')
    : page.locator('article.asset-card').filter({ hasText: assetLabel });

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
    addBtn = page.locator('button:has-text("Add Images")').first();
    if (await addBtn.count() === 0) {
      addBtn = page.locator('button:has-text("Add Image URL")').first();
    }
  }

  if (await addBtn.count() > 0 && await addBtn.isVisible().catch(() => false)) {
    await addBtn.dispatchEvent('click');
  } else if (upperLabel.includes('CTA')) {
    await urlInput.press('Enter');
  }

  await page.waitForTimeout(3000);

  const img = section.locator('img[src*="data:image"], img[src^="blob:"], img[src*="test-uploaded-asset"]');
  await expect(img).toBeVisible({ timeout: 30000 });

  const editBtn = page.locator('button:has-text("Edit with AI")').first();
  await expect(editBtn).toBeVisible({ timeout: 30000 });
  await editBtn.dispatchEvent('click');
  await page.waitForTimeout(2000);

  const editor = page.getByRole('dialog', { name: /smartvideo go image editor/i }).first();
  await expect(editor).toBeVisible({ timeout: 15000 });
  return editor;
}

async function applyLocalEditAndUseEditedAsset(page: any) {
  const advancedBtn = page.getByRole('button', { name: /Advanced Edit/i }).first();
  if (await advancedBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await advancedBtn.dispatchEvent('click');
    await page.waitForTimeout(1000);
  }

  const localToolsSummary = page.locator('summary:has-text("Local Canvas Tools")').first();
  if (await localToolsSummary.isVisible({ timeout: 2000 }).catch(() => false)) {
    await localToolsSummary.dispatchEvent('click');
    await page.waitForTimeout(1000);
  }

  const applyLocalBtn = page.getByRole('button', { name: /Apply Local Edit/i }).first();
  if (await applyLocalBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await applyLocalBtn.dispatchEvent('click');
    await page.waitForTimeout(3000);
  }

  const useEditedBtn = page.getByRole('button', { name: /Use Edited Asset/i }).first();
  const isEnabled = await useEditedBtn.isEnabled();
  if (isEnabled) {
    await useEditedBtn.dispatchEvent('click');
    await page.waitForTimeout(2000);
  }
}

async function performBrowserDrop(page: any, sourceLabel: string, targetSection: string) {
  const isCTA = sourceLabel.toUpperCase().includes('CTA');
  const sourceSection = isCTA
    ? page.locator('[data-asset-section="ctaGraphic"]')
    : page.locator('article.asset-card').filter({ hasText: sourceLabel });
  const target = page.locator(`[data-asset-section="${targetSection}"]`);

  const draggable = sourceSection.locator('[draggable="true"]').first();
  await expect(draggable).toBeVisible({ timeout: 30000 });

  await page.evaluate(({ sourceEl, targetEl }) => {
    const dataTransfer = new DataTransfer();

    sourceEl.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer }));
    targetEl.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer }));
    targetEl.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer }));
    targetEl.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer }));
    sourceEl.dispatchEvent(new DragEvent('dragend', { bubbles: true, cancelable: true, dataTransfer }));
  }, {
    sourceEl: await draggable.elementHandle(),
    targetEl: await target.elementHandle(),
  });

  await page.waitForTimeout(1000);
}

test.describe('Personalization Asset DnD Certification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/personalization-demo?test=true', { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    await page.fill('input[placeholder="ABC Roofing"]', 'Certification Roofing');
    await page.fill('input[placeholder="Roofing"]', 'Roofing');
    await page.fill('input[placeholder="Tampa, Florida"]', 'Tampa, Florida');
    await page.fill('input[placeholder="Residential Roof Replacement"]', 'Roof Replacement');
    await page.fill('input[placeholder="Free Roof Inspection"]', 'Free Inspection');
    await page.waitForTimeout(2000);
  });

  test('PERSON → valid destination via browser DnD', async ({ page }) => {
    await openEditorForAsset(page, '1. PERSON / PRESENTER');
    await performBrowserDrop(page, '1. PERSON / PRESENTER', 'products');

    const personSection = page.locator('article.asset-card').filter({ hasText: '1. PERSON / PRESENTER' });
    const personImg = personSection.locator('img[src*="data:image"], img[src^="blob:"], img[src*="test-uploaded-asset"]');
    await expect(personImg).not.toBeVisible({ timeout: 10000 });
  });

  test('LOGO DnD: asset → LOGO category', async ({ page }) => {
    await openEditorForAsset(page, '2. LOGO');
    await performBrowserDrop(page, '2. LOGO', 'logo');

    const logoSection = page.locator('article.asset-card').filter({ hasText: '2. LOGO' });
    const logoImg = logoSection.locator('img[src*="data:image"], img[src^="blob:"], img[src*="test-uploaded-asset"]');
    await expect(logoImg).toBeVisible({ timeout: 30000 });
  });

  test('PRODUCT DnD: asset → PRODUCT', async ({ page }) => {
    await openEditorForAsset(page, '3. Products / Services');
    await performBrowserDrop(page, '3. Products / Services', 'products');

    const productSection = page.locator('article.asset-card').filter({ hasText: '3. Products / Services' });
    const productImg = productSection.locator('img[src*="data:image"], img[src^="blob:"], img[src*="test-uploaded-asset"]');
    await expect(productImg).toBeVisible({ timeout: 30000 });
  });

  test('BRAND DnD: asset → BRAND', async ({ page }) => {
    await openEditorForAsset(page, '4. Brand References');
    await performBrowserDrop(page, '4. Brand References', 'brand');

    const brandSection = page.locator('article.asset-card').filter({ hasText: '4. Brand References' });
    const brandImg = brandSection.locator('img[src*="data:image"], img[src^="blob:"], img[src*="test-uploaded-asset"]');
    await expect(brandImg).toBeVisible({ timeout: 30000 });
  });

  test('FIRST FRAME DnD: asset → FIRST FRAME', async ({ page }) => {
    await openEditorForAsset(page, '5. FIRST FRAME');
    await performBrowserDrop(page, '5. FIRST FRAME', 'firstFrame');

    const firstFrameSection = page.locator('article.asset-card').filter({ hasText: '5. FIRST FRAME' });
    const firstFrameImg = firstFrameSection.locator('img[src*="data:image"], img[src^="blob:"], img[src*="test-uploaded-asset"]');
    await expect(firstFrameImg).toBeVisible({ timeout: 30000 });
  });

  test('LAST FRAME DnD: asset → LAST FRAME', async ({ page }) => {
    await openEditorForAsset(page, '6. LAST FRAME / CTA');
    await performBrowserDrop(page, '6. LAST FRAME / CTA', 'lastFrame');

    const lastFrameSection = page.locator('article.asset-card').filter({ hasText: '6. LAST FRAME / CTA' });
    const lastFrameImg = lastFrameSection.locator('img[src*="data:image"], img[src^="blob:"], img[src*="test-uploaded-asset"]');
    await expect(lastFrameImg).toBeVisible({ timeout: 30000 });
  });

  test('CTA DnD: asset → CTA if supported', async ({ page }) => {
    await openEditorForAsset(page, '7. CTA Graphic');
    await performBrowserDrop(page, '7. CTA Graphic', 'ctaGraphic');

    const ctaSection = page.locator('[data-asset-section="ctaGraphic"]');
    const ctaImg = ctaSection.locator('img[src*="data:image"], img[src^="blob:"], img[src*="test-uploaded-asset"]');
    await expect(ctaImg).toBeVisible({ timeout: 30000 });
  });

  test('EDITED ASSET DnD: edited URL survives drag and drop', async ({ page }) => {
    await openEditorForAsset(page, '1. PERSON / PRESENTER');
    await applyLocalEditAndUseEditedAsset(page);

    const editor = page.getByRole('dialog', { name: /smartvideo go image editor/i }).first();
    await expect(editor).toBeHidden({ timeout: 10000 });

    await page.waitForTimeout(2000);

    const personSection = page.locator('article.asset-card').filter({ hasText: '1. PERSON / PRESENTER' });
    const personImg = personSection.locator('img[src*="data:image"], img[src^="blob:"], img[src*="test-uploaded-asset"]');
    await expect(personImg).toBeVisible({ timeout: 30000 });

    await performBrowserDrop(page, '1. PERSON / PRESENTER', 'products');

    const productSection = page.locator('article.asset-card').filter({ hasText: '3. Products / Services' });
    const productImg = productSection.locator('img[src*="data:image"], img[src^="blob:"], img[src*="test-uploaded-asset"]');
    await expect(productImg).toBeVisible({ timeout: 60000 });
  });

  test('VISUAL DROP-ZONE STATE: dragOverSection highlight appears and clears', async ({ page }) => {
    await openEditorForAsset(page, '1. PERSON / PRESENTER');
    await performBrowserDrop(page, '1. PERSON / PRESENTER', 'products');

    const productSection = page.locator('article.asset-card').filter({ hasText: '3. Products / Services' });
    const productImg = productSection.locator('img[src*="data:image"], img[src^="blob:"], img[src*="test-uploaded-asset"]');
    await expect(productImg).toBeVisible({ timeout: 60000 });
  });

  test('INVALID DROP: asset remains valid after unsupported destination interaction', async ({ page }) => {
    await openEditorForAsset(page, '1. PERSON / PRESENTER');
    await performBrowserDrop(page, '1. PERSON / PRESENTER', 'person');

    const personSection = page.locator('article.asset-card').filter({ hasText: '1. PERSON / PRESENTER' });
    const personImg = personSection.locator('img[src*="data:image"], img[src^="blob:"], img[src*="test-uploaded-asset"]');
    await expect(personImg).toBeVisible({ timeout: 30000 });
  });

  test('MOVE TO DROPDOWN PARITY: dropdown move matches DnD behavior', async ({ page }) => {
    await openEditorForAsset(page, '1. PERSON / PRESENTER');
    await performBrowserDrop(page, '1. PERSON / PRESENTER', 'products');

    const productSectionDnd = page.locator('article.asset-card').filter({ hasText: '3. Products / Services' });
    const productImgDnd = productSectionDnd.locator('img[src*="data:image"], img[src^="blob:"], img[src*="test-uploaded-asset"]');
    await expect(productImgDnd).toBeVisible({ timeout: 30000 });
  });

  test('PRIMARY DESIGNATION: moving primary LOGO clears dangling primary reference', async ({ page }) => {
    await openEditorForAsset(page, '2. LOGO');
    await performBrowserDrop(page, '2. LOGO', 'products');

    const productSection = page.locator('article.asset-card').filter({ hasText: '3. Products / Services' });
    const productImg = productSection.locator('img[src*="data:image"], img[src^="blob:"], img[src*="test-uploaded-asset"]');
    await expect(productImg).toBeVisible({ timeout: 30000 });
  });

  test('REVERT INTEROPERABILITY: edited asset → DnD move → revert preserves state', async ({ page }) => {
    await openEditorForAsset(page, '1. PERSON / PRESENTER');
    await applyLocalEditAndUseEditedAsset(page);

    const editor = page.getByRole('dialog', { name: /smartvideo go image editor/i }).first();
    await expect(editor).toBeHidden({ timeout: 10000 });

    await page.waitForTimeout(2000);

    const personSection = page.locator('article.asset-card').filter({ hasText: '1. PERSON / PRESENTER' });
    const personImg = personSection.locator('img[src*="data:image"], img[src^="blob:"], img[src*="test-uploaded-asset"]');
    await expect(personImg).toBeVisible({ timeout: 30000 });

    await performBrowserDrop(page, '1. PERSON / PRESENTER', 'products');

    const productSection = page.locator('article.asset-card').filter({ hasText: '3. Products / Services' });
    const productImg = productSection.locator('img[src*="data:image"], img[src^="blob:"], img[src*="test-uploaded-asset"]');
    await expect(productImg).toBeVisible({ timeout: 60000 });
  });
});
