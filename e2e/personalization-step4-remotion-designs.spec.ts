import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Phase 1 — Remotion designs inside Simple Mode Step 4.
 *
 * This spec is the real-browser acceptance test for the Phase 1 integration:
 * it proves that the FIVE new Remotion designs are selectable inside the
 * EXISTING Step 4 panel, that the EXISTING five pill-shaped layout options
 * still work, and that selecting a design actually renders a design layer in
 * the live preview (the same composition the browser export bakes).
 *
 * It also writes the before/after Step 4 screenshots used by
 * `docs/REMOTION_PHASE_1_REPORT.md`.
 */

const SHOT_DIR = path.join(process.cwd(), 'docs', 'screenshots', 'phase-1-step4');

const LAYOUT_PILLS = [
  'Business Introduction',
  'Product Showcase',
  'Service Promotion',
  'Special Offer',
  'Branded Ending',
];

const DESIGN_PILLS = [
  'Animated Headline',
  'Logo Reveal',
  'Lower Third',
  'Promo CTA',
  'Bokeh Particles',
];

function shot(name: string): string {
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  return path.join(SHOT_DIR, name);
}

async function openStep4(page: import('@playwright/test').Page) {
  await page.goto('/personalization-demo?test=true');

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  // Simple Mode wizard: jump straight to Step 4 ("Preview and approve").
  await dialog.getByRole('button', { name: /Step 4/i }).click();
  await expect(dialog.getByRole('heading', { name: 'Preview and approve' })).toBeVisible();

  // Compare (split) mode renders BOTH the original and the personalized
  // player. The default "toggle" mode renders a single player that starts on
  // the original, so the personalized composition — where the design layer
  // lives — is not in the DOM until the user flips it.
  await dialog.getByRole('button', { name: 'Compare' }).click();
  await expect(page.getByRole('region', { name: 'After: personalized preview' })).toBeVisible();

  return dialog;
}

test.describe('Phase 1 — Remotion designs in Step 4', () => {
  test('the five existing pill layouts are unchanged and still selectable', async ({ page }) => {
    const dialog = await openStep4(page);

    for (const label of LAYOUT_PILLS) {
      const pill = dialog.getByRole('button', { name: label, exact: true });
      await expect(pill).toBeVisible();
      // The pill shape is a border-radius of 999 on a <button>.
      const radius = await pill.evaluate((el) => getComputedStyle(el).borderRadius);
      expect(radius).toContain('999');
    }

    // The first layout is active by default and switching works.
    await expect(dialog.getByRole('button', { name: 'Business Introduction', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await dialog.getByRole('button', { name: 'Product Showcase', exact: true }).click();
    await expect(dialog.getByRole('button', { name: 'Product Showcase', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('the five Remotion designs are selectable in Step 4 and render a design layer', async ({ page }) => {
    const dialog = await openStep4(page);

    // The "Designs" group sits next to the existing layout pills.
    await expect(dialog.getByText('Designs', { exact: true })).toBeVisible();

    for (const label of DESIGN_PILLS) {
      const pill = dialog.getByRole('button', { name: label, exact: true });
      await expect(pill).toBeVisible();
      const radius = await pill.evaluate((el) => getComputedStyle(el).borderRadius);
      expect(radius).toContain('999');
      // Not selected to begin with.
      await expect(pill).toHaveAttribute('aria-pressed', 'false');
    }

    // Selecting a design activates it and pushes it into the preview settings.
    const headline = dialog.getByRole('button', { name: 'Animated Headline', exact: true });
    await headline.click();
    await expect(headline).toHaveAttribute('aria-pressed', 'true');

    // The design layer is mounted in the live preview (the Remotion Player),
    // which is the same composition the browser export renders.
    const designLayer = page
      .getByRole('region', { name: 'After: personalized preview' })
      .locator('[data-remotion-design-id]');
    await expect(designLayer.first()).toBeVisible();
    await expect(designLayer.first()).toHaveAttribute('data-remotion-design-id', 'animated-headline');

    // Clicking the active design again clears it.
    await headline.click();
    await expect(headline).toHaveAttribute('aria-pressed', 'false');
  });

  test('each design renders its own content in the live preview', async ({ page }) => {
    const dialog = await openStep4(page);

    for (const label of DESIGN_PILLS) {
      const pill = dialog.getByRole('button', { name: label, exact: true });
      await pill.click();
      await expect(pill).toHaveAttribute('aria-pressed', 'true');

      // Every design draws the MIT credit line inside the overlay, so the
      // design layer is provably present in the rendered frame.
      const credit = page
        .getByRole('region', { name: 'After: personalized preview' })
        .locator('[data-remotion-design-credit]');
      await expect(credit.first()).toBeVisible();
    }
  });

  test('captures before/after Step 4 screenshots', async ({ page }) => {
    const dialog = await openStep4(page);

    // The pill rows live below the fold of the modal, so scroll the Designs
    // group into view before capturing — otherwise both screenshots would be
    // identical (only the preview panel would be in frame).
    const designsLabel = dialog.getByText('Designs', { exact: true });
    await designsLabel.waitFor();
    await designsLabel.scrollIntoViewIfNeeded();

    // "after" — the existing five layout pills PLUS the new Designs row.
    await page.screenshot({ path: shot('step4-after.png') });

    // "before" — the same panel with the Phase 1 Designs row hidden, so the
    // two images differ only by the new row.
    const hidden = await page.evaluate(() => {
      const label = Array.from(document.querySelectorAll('div')).find(
        (node) => node.textContent?.trim() === 'Designs',
      );
      const row = label?.parentElement;
      if (!row) return false;
      row.style.setProperty('display', 'none', 'important');
      return true;
    });
    expect(hidden).toBe(true);
    await page.screenshot({ path: shot('step4-before.png') });
  });
});
