/**
 * Captures the Step 4 "Motion design" panel of the Personalization Modal for
 * the Remotion Phase 1 verification.
 *
 * Writes three full-page screenshots (viewport 1440×900) to docs/screenshots/:
 *   - step4-before-designs.png   — no motion design selected
 *   - step4-after-designs.png    — a full-frame design selected
 *   - step4-overlay-design.png   — an OVERLAY design selected over the video
 */

import { test, expect, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.DEMO_BASE_URL || 'http://localhost:3113';
const OUT_DIR = path.resolve(process.cwd(), 'docs/screenshots');

const BRAND = {
  businessName: 'Aurelia Beauty Co',
  offer: 'Signature Scent Collection',
  callToAction: 'Shop the collection',
  website: 'https://aurelia-beauty.example.com',
};

async function clickViaElement(locator: Locator) {
  const el = await locator.elementHandle();
  if (!el) throw new Error(`element not found for click: ${locator}`);
  await el.evaluate((e) => (e as HTMLElement).click());
}

async function seedBusinessProfile(page: Page) {
  await page.addInitScript((brand) => {
    const now = new Date().toISOString();
    localStorage.setItem(
      'smartvideo_clients',
      JSON.stringify({
        'client-agent7-shots': {
          id: 'client-agent7-shots',
          audience: 'me',
          name: brand.businessName,
          businessName: brand.businessName,
          industry: 'Beauty',
          location: 'London',
          phone: '+44 20 7946 0000',
          website: brand.website,
          offer: brand.offer,
          callToAction: brand.callToAction,
          brandDescription: 'Aurelia Beauty Co crafts signature scent collections.',
          createdAt: now,
          updatedAt: now,
        },
      }),
    );
  }, BRAND);
}

async function openModal(page: Page): Promise<Locator> {
  await page.goto(`${BASE}/personalization-demo?test=true`, { waitUntil: 'domcontentloaded' });
  const dialog = page.getByRole('dialog', { name: 'Personalize this demo' });
  await expect(dialog).toBeVisible({ timeout: 30000 });
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  return dialog;
}

async function applyBusinessProfile(dialog: Locator) {
  const useButton = dialog.getByRole('button', { name: 'Use', exact: true }).first();
  await expect(useButton).toBeVisible({ timeout: 15000 });
  await clickViaElement(useButton);
  await expect(dialog.getByText(BRAND.businessName, { exact: true }).first()).toBeVisible({
    timeout: 15000,
  });
}

async function gotoStep4(page: Page, dialog: Locator) {
  const continueBtn = dialog.getByRole('button', { name: /Continue/i }).first();
  await expect(continueBtn).toBeVisible({ timeout: 20000 });
  await clickViaElement(continueBtn);

  await expect(dialog.getByRole('tab', { name: /Your video/i })).toBeVisible({ timeout: 15000 });
  const continueToStep3 = dialog.getByRole('button', { name: /Continue/i }).first();
  await expect(continueToStep3).toBeVisible({ timeout: 15000 });
  await clickViaElement(continueToStep3);

  const previewMyVideo = dialog.getByRole('button', { name: /Preview my video/i }).first();
  await expect(previewMyVideo).toBeVisible({ timeout: 20000 });
  await clickViaElement(previewMyVideo);

  await expect(
    dialog.getByRole('heading', { name: /Preview and approve/i }),
  ).toBeVisible({ timeout: 20000 });
}

async function selectDesign(dialog: Locator, designId: string) {
  const pill = dialog.getByTestId(`design-pill-${designId}`);
  await expect(pill).toBeVisible({ timeout: 15000 });
  await clickViaElement(pill);
  await expect(pill).toHaveAttribute('aria-pressed', 'true', { timeout: 15000 });
}

async function showAfterPane(page: Page) {
  const region = page.getByRole('region', { name: 'After: personalized preview' }).first();
  if ((await region.count()) > 0 && (await region.isVisible().catch(() => false))) return;
  const toggle = page.getByRole('button', { name: /^Before$/ }).first();
  await expect(toggle).toBeVisible({ timeout: 15000 });
  await clickViaElement(toggle);
  await expect(region).toBeVisible({ timeout: 15000 });
}

async function playPreview(page: Page) {
  const play = page.getByRole('button', { name: /^Play preview$/i }).first();
  if ((await play.count()) > 0 && (await play.isVisible().catch(() => false))) {
    await clickViaElement(play);
    await page.waitForTimeout(1200);
  }
}

test('capture the Step 4 motion-design screenshots', async ({ page }) => {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  await page.setViewportSize({ width: 1440, height: 900 });
  await seedBusinessProfile(page);
  const dialog = await openModal(page);
  await applyBusinessProfile(dialog);
  await gotoStep4(page, dialog);

  // Scroll the Motion design panel into view so the screenshot shows it.
  const picker = dialog.getByTestId('remotion-design-picker');
  await expect(picker).toBeVisible({ timeout: 15000 });
  await picker.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  const beforePath = path.join(OUT_DIR, 'step4-before-designs.png');
  await page.screenshot({ path: beforePath, fullPage: true });
  console.log(`CAPTURED ${beforePath} (${fs.statSync(beforePath).size} bytes)`);

  // A full-frame design selected.
  await selectDesign(dialog, 'bounce-in-headline');
  await showAfterPane(page);
  await playPreview(page);
  await picker.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);

  const afterPath = path.join(OUT_DIR, 'step4-after-designs.png');
  await page.screenshot({ path: afterPath, fullPage: true });
  console.log(`CAPTURED ${afterPath} (${fs.statSync(afterPath).size} bytes)`);

  // An OVERLAY design selected over the customer's video.
  await selectDesign(dialog, 'lower-third-glass-card');
  await showAfterPane(page);
  await playPreview(page);
  await picker.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);

  const overlayPath = path.join(OUT_DIR, 'step4-overlay-design.png');
  await page.screenshot({ path: overlayPath, fullPage: true });
  console.log(`CAPTURED ${overlayPath} (${fs.statSync(overlayPath).size} bytes)`);

  expect(fs.existsSync(beforePath)).toBe(true);
  expect(fs.existsSync(afterPath)).toBe(true);
  expect(fs.existsSync(overlayPath)).toBe(true);
});
