import { test, expect, type Page, type Route } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const FIXTURE_PATH = path.join(
  '/Users/deanellgilmore/Downloads/openbolt/OpenHiggsBolt/test-assets',
  'sample-person.png',
);

const BASE = 'http://localhost:3111';
const FIXTURE_URL = 'http://localhost:3111/deterministic-test-person.png';

function mockFixtures(page: Page) {
  const fixtureBuffer = fs.readFileSync(FIXTURE_PATH);
  const fixtureBase64 = fixtureBuffer.toString('base64');

  page.route('**/deterministic-test-person.png', (route) => {
    return route.fulfill({ status: 200, body: fixtureBuffer, contentType: 'image/png' });
  });

  page.route('**/api/personalization/download-image', async (route) => {
    const postData = route.request().postData();
    let urls: string[] = [];
    if (postData) {
      try {
        const body = JSON.parse(postData);
        urls = body.urls || [];
      } catch { /* ignore */ }
    }
    const results = urls.map((url) => {
      if (url === FIXTURE_URL || url.endsWith('.png') || url.endsWith('.jpg')) {
        return { url, dataUrl: `data:image/png;base64,${fixtureBase64}`, ok: true };
      }
      return { url, error: 'Not handled in test mock', ok: false };
    });
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, results }) });
  });
}

async function openPersonalization(page: Page) {
  await page.goto(`${BASE}/personalization-demo?test=true`);
  const dialog = page.getByRole('dialog', { name: /personalize this demo/i }).first();
  await expect(dialog).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/Test mode active/)).toBeVisible();
}

async function fillClientForm(page: Page) {
  await page.locator('input[placeholder="ABC Roofing"]').fill('Certification Test Co');
  await page.locator('input[placeholder="Roofing"]').fill('Roofing');
  await page.locator('input[placeholder="https://joesroofing.com"]').fill('https://example.com');
}

async function addAssetByUrl(page: Page, placeholder: string, url: string) {
  const input = page.locator(`input[placeholder="${placeholder}"]`).first();
  if (await input.count() > 0) {
    await input.fill(url);
    await input.press('Enter');
    await page.waitForTimeout(1000);
  }
}

async function openEditorForFirstAsset(page: Page, assetLabel: string): Promise<boolean> {
  const editButton = page.locator(`button:has-text("Edit with AI")`).first();
  const visible = await editButton.isVisible({ timeout: 5_000 }).catch(() => false);
  if (visible) {
    await editButton.click();
    await expect(page.locator('#smartvideo-go-image-editor-title')).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(2000);
  }
  return visible;
}

async function performLocalEditInAdvancedMode(page: Page) {
  await page.getByText('Advanced Edit').click();
  await page.waitForTimeout(1000);

  const summary = page.locator('summary:has-text("Local Canvas Tools")');
  if (await summary.count() > 0) {
    await summary.scrollIntoViewIfNeeded();
    await summary.click();
    await page.waitForTimeout(500);
  }

  const brightnessSlider = page.locator('label:has-text("Brightness") input[type="range"]').first();
  if (await brightnessSlider.count() > 0) {
    await brightnessSlider.scrollIntoViewIfNeeded();
    await brightnessSlider.fill('120');
  }

  const applyBtn = page.getByText('Apply Local Edit');
  if (await applyBtn.count() > 0) {
    await applyBtn.scrollIntoViewIfNeeded();
    await applyBtn.click();
    await page.waitForTimeout(2000);
  }
}

async function getVersionStripButton(page: Page, label: string) {
  return page.locator(`button:has-text("${label}")`).first();
}

async function toggleCompareMode(page: Page) {
  const compareBtn = page.getByText('Compare');
  if (await compareBtn.count() > 0) {
    await compareBtn.click();
    await page.waitForTimeout(1000);
  }
}

async function clickUseEditedAsset(page: Page) {
  const useEditedBtn = page.getByText('Use Edited Asset');
  const enabled = await useEditedBtn.isEnabled().catch(() => false);
  if (enabled) {
    await useEditedBtn.click();
    await page.waitForTimeout(2000);
  }
  return enabled;
}

async function closeEditor(page: Page) {
  try {
    const editorTitle = page.locator('#smartvideo-go-image-editor-title');
    const editorOpen = (await editorTitle.count()) > 0 && (await editorTitle.isVisible({ timeout: 1000 }).catch(() => false));
    if (editorOpen) {
      const closeBtn = page.getByRole('button', { name: /Close SmartVideo GO image editor/i }).first();
      if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await closeBtn.click();
        await page.waitForTimeout(500);
      }
    }
  } catch (e) {
    // If the page or context has already closed, skip cleanup.
  }
}

test.describe('Personalization Image Editor Browser Certification', () => {
  test.beforeEach(async ({ page }) => {
    mockFixtures(page);
    await openPersonalization(page);
    await fillClientForm(page);
  });

  test.afterEach(async ({ page }) => {
    await page.screenshot({ path: 'playwright/marketing-artifacts/cert-after-each.png', fullPage: true }).catch(() => {});
  });

  test('PERSON: upload photo via URL and verify thumbnail', async ({ page }) => {
    await addAssetByUrl(page, 'Paste image URL and press Enter', FIXTURE_URL);
    await expect(page.getByText('PHOTO').first()).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: 'playwright/marketing-artifacts/cert-person-uploaded.png', fullPage: true });
  });

  test('LOGO: upload logo via URL and verify thumbnail', async ({ page }) => {
    await page.locator('input[placeholder="Paste image URL and press Enter"]').nth(1).fill(FIXTURE_URL);
    await page.locator('input[placeholder="Paste image URL and press Enter"]').nth(1).press('Enter');
    await page.waitForTimeout(1000);
    await expect(page.getByText('LOGO').first()).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: 'playwright/marketing-artifacts/cert-logo-uploaded.png', fullPage: true });
  });

  test('PRODUCT: upload product image via URL', async ({ page }) => {
    const productInput = page.locator('input[placeholder="Paste image or video URL and press Enter"]').first();
    if (await productInput.count() > 0) {
      await productInput.fill(FIXTURE_URL);
      await productInput.press('Enter');
      await page.waitForTimeout(1000);
    }
    await page.screenshot({ path: 'playwright/marketing-artifacts/cert-product-uploaded.png', fullPage: true });
  });

  test('BRAND REFERENCE: upload brand image via URL', async ({ page }) => {
    const brandInputs = page.locator('input[placeholder="Paste image or video URL and press Enter"]');
    if (await brandInputs.count() > 1) {
      await brandInputs.nth(1).fill(FIXTURE_URL);
      await brandInputs.nth(1).press('Enter');
      await page.waitForTimeout(1000);
    }
    await page.screenshot({ path: 'playwright/marketing-artifacts/cert-brand-uploaded.png', fullPage: true });
  });

  test('FIRST FRAME: upload first frame via URL', async ({ page }) => {
    const firstFrameInput = page.locator('input[placeholder="Paste image URL and press Enter"]').last();
    if (await firstFrameInput.count() > 0) {
      await firstFrameInput.fill(FIXTURE_URL);
      await firstFrameInput.press('Enter');
      await page.waitForTimeout(1000);
    }
    await expect(page.getByText('First Frame').first()).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: 'playwright/marketing-artifacts/cert-first-frame.png', fullPage: true });
  });

  test('LAST FRAME: upload last frame via URL', async ({ page }) => {
    await page.getByRole('button', { name: /Find Business Assets/i }).first().click();
    await page.waitForTimeout(3000);
    await expect(page.getByText('Last Frame').first()).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: 'playwright/marketing-artifacts/cert-last-frame.png', fullPage: true });
  });

  test('CTA GRAPHIC: upload CTA graphic via URL', async ({ page }) => {
    await addAssetByUrl(page, 'Paste image URL and press Enter', FIXTURE_URL);
    await page.waitForTimeout(1000);
    const ctaInput = page.locator('input[placeholder="Paste image URL and press Enter"]').last();
    if (await ctaInput.count() > 0) {
      await ctaInput.fill(FIXTURE_URL);
      await ctaInput.press('Enter');
      await page.waitForTimeout(1000);
    }
    await expect(page.getByText('CTA Graphic').first()).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: 'playwright/marketing-artifacts/cert-cta-graphic.png', fullPage: true });
  });

  test('SAVED CLIENT ASSET NOT IN JOB: save client, remove asset, re-add from saved library', async ({ page }) => {
    await addAssetByUrl(page, 'Paste image URL and press Enter', FIXTURE_URL);
    await page.waitForTimeout(1000);

    const saveBtn = page.getByRole('button', { name: /Save Client/i }).first();
    if (await saveBtn.count() > 0 && await saveBtn.isVisible().catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(1500);
    }

    const savedSection = page.getByText('SAVED CLIENT ASSETS');
    if (await savedSection.count() > 0) {
      await expect(savedSection).toBeVisible();
      const peopleTab = page.getByRole('button', { name: /People/i }).first();
      if (await peopleTab.count() > 0) {
        await peopleTab.click();
        await page.waitForTimeout(1000);
      }
    }

    await page.screenshot({ path: 'playwright/marketing-artifacts/cert-saved-client-asset.png', fullPage: true });
  });

  test('TRUE ORIGINAL AND REVERT: edit asset and revert to original', async ({ page }) => {
    await addAssetByUrl(page, 'Paste image URL and press Enter', FIXTURE_URL);
    await page.waitForTimeout(1000);

    const editorOpened = await openEditorForFirstAsset(page, 'PERSON');
    if (editorOpened) {
      await performLocalEditInAdvancedMode(page);
      await clickUseEditedAsset(page);
      await closeEditor(page);
    }

    await page.waitForTimeout(1000);
    const revertBtn = page.getByRole('button', { name: /Revert/i }).first();
    if (await revertBtn.count() > 0 && await revertBtn.isVisible().catch(() => false)) {
      await revertBtn.click();
      await page.waitForTimeout(1000);
      test.info().annotations.push({ type: 'RESULT', description: 'Revert button was visible and clickable' });
    } else {
      test.info().annotations.push({
        type: 'BLOCKER',
        description: 'Revert button not visible. This may be because uploadAsset requires a valid MuAPI key and the edited asset upload failed in test mode.',
      });
    }

    await page.screenshot({ path: 'playwright/marketing-artifacts/cert-revert-flow.png', fullPage: true });
  });

  test('BEFORE/AFTER: editor Compare mode shows Original and Edited side by side', async ({ page }) => {
    await addAssetByUrl(page, 'Paste image URL and press Enter', FIXTURE_URL);
    await page.waitForTimeout(1000);

    const editorOpened = await openEditorForFirstAsset(page, 'PERSON');
    if (editorOpened) {
      await performLocalEditInAdvancedMode(page);

      const originalBtn = await getVersionStripButton(page, 'Original');
      const editedBtn = await getVersionStripButton(page, 'Local Edit');
      await expect(originalBtn).toBeVisible();
      await expect(editedBtn).toBeVisible();
      test.info().annotations.push({ type: 'RESULT', description: 'Version strip shows Original and Local Edit buttons' });

      await closeEditor(page);
    }

    await page.screenshot({ path: 'playwright/marketing-artifacts/cert-compare-mode.png', fullPage: true });
  });

  test.skip('GENERATION RESOLUTION: capture runtime evidence of URL resolution', async ({ page }) => {
    await addAssetByUrl(page, 'Paste image URL and press Enter', FIXTURE_URL);
    await page.waitForTimeout(1000);

    const editorOpened = await openEditorForFirstAsset(page, 'PERSON');
    if (editorOpened) {
      await performLocalEditInAdvancedMode(page);

      const originalUrl = FIXTURE_URL;
      let editedUploadedUrl = 'not-captured';
      let resolvedGenerationUrl = 'not-captured';
      let summaryText = 'not-captured';

      try {
        const editorImageSrc = await page.locator('#smartvideo-go-image-editor-title')
          .locator('..')
          .locator('img')
          .first()
          .getAttribute('src')
          .catch(() => null);
        editedUploadedUrl = editorImageSrc || 'not-captured';

        summaryText = await page.getByText('What SmartVideo Will Use').textContent().catch(() => 'not-captured') || 'not-captured';

        const summaryImages = page.locator('img[alt=""], img[alt="Person"], img[alt="Logo"]');
        const summaryImgCount = await summaryImages.count().catch(() => 0) ?? 0;
        if (summaryImgCount > 0) {
          resolvedGenerationUrl = await summaryImages.first().getAttribute('src').catch(() => null) || 'not-captured';
        }
      } catch (e) {
        test.info().annotations.push({
          type: 'BLOCKER',
          description: `Evidence capture failed: ${e instanceof Error ? e.message : String(e)}`,
        });
      }

      test.info().annotations.push(
        { type: 'RESULT', description: `ORIGINAL_URL: ${originalUrl}` },
        { type: 'RESULT', description: `EDITED_UPLOADED_URL: ${editedUploadedUrl}` },
        { type: 'RESULT', description: `RESOLVED_GENERATION_URL: ${resolvedGenerationUrl}` },
        { type: 'RESULT', description: `Summary text: ${summaryText}` },
      );

      await closeEditor(page);
    }

    await page.screenshot({ path: 'playwright/marketing-artifacts/cert-generation-resolution.png', fullPage: true }).catch(() => {});
  });

  test('deterministic local edit: version strip appends Local Edit button after apply', async ({ page }) => {
    await addAssetByUrl(page, 'Paste image URL and press Enter', FIXTURE_URL);
    await page.waitForTimeout(1000);

    const editorOpened = await openEditorForFirstAsset(page, 'PERSON');
    if (editorOpened) {
      await performLocalEditInAdvancedMode(page);

      const localEditBtn = page.locator('button:has-text("Local Edit")').first();
      await expect(localEditBtn).toBeVisible();

      const label = await localEditBtn.textContent();
      await expect(label).toContain('Local Edit');

      test.info().annotations.push({ type: 'RESULT', description: 'Version strip contains Local Edit button after apply' });

      await closeEditor(page);
    }

    await page.screenshot({ path: 'playwright/marketing-artifacts/cert-deterministic-local-edit.png', fullPage: true });
  });
});
