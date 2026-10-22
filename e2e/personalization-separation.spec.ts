import { test, expect } from '@playwright/test';
import { BASE_URL as BASE } from './helpers/motion-studio';

/**
 * Job A — Personalization Modal / Motion Studio separation.
 *
 * Verifies that opening the personalization modal on the demo page does not
 * leak any Motion Studio UI into the personalization surface:
 *   - no "Motion Studio" text on the page
 *   - no "BasicText" or motion recipe names
 *   - no [role="dialog"] whose class references motion studio
 *   - no `/studio/motion-studio` URL reference anywhere in the page
 *   - existing personalization buttons (Personalize Prompt / Find Business Assets)
 *     are still rendered inside the personalization dialog
 */
test.describe('Personalization separation from Motion Studio', () => {
  test('opens personalization modal on the demo page without Motion Studio UI leaking', async ({ page }) => {
    // 1. Trigger the personalization modal by navigating to the demo page. The
    //    demo route auto-opens the personalization dialog after ~500ms via
    //    DemoPersonalizeProvider.openPersonalize(). Clicking the "Personalization"
    //    heading is the canonical trigger per the spec.
    await page.goto('/personalization-demo?test=true');

    const heading = page.getByRole('heading', { name: /personalization/i }).first();
    await heading.waitFor({ state: 'visible', timeout: 30_000 });
    await heading.click();

    // Wait for the personalization dialog to open (it auto-opens via the URL).
    const dialog = page.getByRole('dialog', { name: /personalize this demo/i }).first();
    await dialog.waitFor({ state: 'visible', timeout: 30_000 });

    // 2a. Page must contain demo categories (the sample source exposes a "Category"
    //      field and the guided wizard renders section headings like "Business Niche",
    //      "Categories", etc.).
    await expect(page.getByText(/business niche|categories|source demo|client profile/i).first()).toBeVisible({
      timeout: 15_000,
    });

    // 2b. Assert NO "Motion Studio" text appears anywhere on the page. This is the
    //      core separation guarantee — the personalization route must not surface
    //      the motion editor branding.
    const motionStudioText = await page.locator('body').textContent().catch(() => '');
    expect(motionStudioText ?? '').not.toMatch(/motion\s*studio/i);

    // 2c. Assert NO "BasicText" text and NO motion recipe slugs appear on the
    //      personalization surface. Recipe ids like 'text-basic' / 'inkpress-title-card'
    //      are Motion Studio identifiers and must not leak into the personalization
    //      UI. We assert against a representative set of recipe slugs plus the
    //      display names shown in MotionStudioEntry (Basic Text, Ink Press Title, ...).
    const personalizationText = await page.locator('body').textContent().catch(() => '');
    expect(personalizationText ?? '').not.toMatch(/basic\s*text|inkpress|flash\s*cut|caption\s*strip/i);

    // 2d. Assert NO [role="dialog"] whose class contains "motion" — any motion
    //      studio dialog should not be present inside the personalization modal.
    const motionDialogs = page.locator('[role="dialog"]').filter({ has: page.locator('[class*="motion"], [class*="studio"]') });
    expect(await motionDialogs.count()).toBe(0);

    // 2e. Assert NO reference to /studio/motion-studio URL on the page — neither
    //      in links, anchors, nor anywhere else in the document body.
    const studioUrlRefs = page.locator('body').textContent().then((t) => (t || '').toString());
    expect(studioUrlRefs ?? '').not.toMatch(/studio\/motion[-_]?studio/i);
    const anchorRefs = await page.locator('a').allTextContents().catch(() => []);
    const allText = [...anchorRefs, studioUrlRefs ?? ''].join('\n');
    expect(allText).not.toMatch(/studio\/motion[-_]?studio/i);

    // 3. Existing personalization buttons must still be rendered (the submit /
    //    generate action "Personalize Prompt" and the asset discovery action
    //    "Find Business Assets"). These prove the personalization surface is intact
    //    and was not replaced or shadowed by motion studio chrome.
    await expect(page.getByRole('button', { name: /personalize prompt/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /find business assets/i })).toBeVisible();
  });
});
