import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { openQualityPanel } from './helpers/qualityPanel';

/**
 * Real footage, real images, no network: drives the actual personalization modal with the demo
 * video the harness page opens with (`/media/minimax-h3/videos/luxury-perfume-commercial.webm`,
 * a same-origin file in this repo) and a logo and product image that ship in the repo, so nothing is
 * fetched from a CDN or an API. (Uploading a video through Step 2 is not used here: it creates a
 * `blob:` URL, which the app's CSP `connect-src` does not allow the video engine to read.) Checks the Layout Quality Check sits directly under the video, that the
 * full panel opens from its bar, and that nothing throws while the real clip is sampled.
 *
 * Screenshots go to `test-results/local-footage/` (git-ignored) or `LOCAL_FOOTAGE_OUT_DIR`.
 */
const OUT = process.env.LOCAL_FOOTAGE_OUT_DIR ?? path.join(process.cwd(), 'test-results', 'local-footage');
const LOGO = path.join(process.cwd(), 'public/motion-studio/previews/IconFlipBloomLogo-a.jpg');
const PRODUCT = path.join(process.cwd(), 'public/motion-studio/previews/IconFlipBloomLogo-b.jpg');
const NAME = 'Rascop And Associates LLC';

const dataUrl = (file: string) => `data:image/jpeg;base64,${fs.readFileSync(file).toString('base64')}`;

async function seedBrand(page: Page) {
  await page.goto('/personalization-demo?test=true');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: /Advanced Editing/i }).click();
  await dialog.getByRole('button', { name: 'My Business' }).click();
  await dialog.getByRole('button', { name: /Next: Profile/ }).click();
  await page.fill('input[placeholder="ABC Roofing"]', NAME);
  await dialog.getByRole('button', { name: /Next: Your assets/ }).click();
  const logoCard = page.locator('article.asset-card').filter({ hasText: '2. LOGO' });
  await logoCard.getByPlaceholder('Paste logo URL and press Enter').fill(dataUrl(LOGO));
  await page.locator('button:has-text("Add Logo URL")').first().dispatchEvent('click');
  const prodCard = page.locator('article.asset-card').filter({ hasText: /3\. PRODUCTS/i }).first();
  await prodCard.locator('input[placeholder*="Paste"]').first().fill(dataUrl(PRODUCT));
  await page.locator('button:has-text("Add Image/Video URL")').first().dispatchEvent('click');
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: /Simple Mode/i }).click();
}

test.describe('Personalization modal on real local footage', () => {
  test('quality bar sits under the video, opens the full panel, and the page stays error-free', async ({ page }) => {
    test.setTimeout(240_000);
    fs.mkdirSync(OUT, { recursive: true });
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e).slice(0, 300)));
    // Console errors are reported (not asserted): a bare dev server has no Supabase/Clerk env, so
    // unrelated API calls log errors. They are attached to the test so a real new one stands out.
    const consoleErrors: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 240)); });

    await page.setViewportSize({ width: 1440, height: 900 });
    await seedBrand(page);
    const dialog = page.getByRole('dialog');

    // Step 3 → Step 4.
    await dialog.getByRole('button', { name: /Step 3/i }).click();
    await dialog.getByRole('button', { name: /Step 4/i }).click();
    await expect(dialog.getByRole('heading', { name: 'Preview and approve' })).toBeVisible();

    // The bar is directly under the video stage, not after the whole editor.
    const stage = dialog.getByRole('group', { name: 'Video overlay stage' });
    const bar = page.getByTestId('layout-quality-bar');
    await bar.scrollIntoViewIfNeeded();
    await expect(stage).toBeVisible();
    await expect(bar).toBeVisible();
    const s = (await stage.boundingBox())!;
    const b = (await bar.boundingBox())!;
    expect(b.y, 'bar starts below the stage').toBeGreaterThanOrEqual(s.y + s.height - 1);
    expect(b.y - (s.y + s.height), 'bar is right under the stage (no editor controls in between)').toBeLessThan(40);

    await page.screenshot({ path: path.join(OUT, 'step4-quality-bar.png') });

    // Opening the full panel shows the scope text and the issue controls.
    await openQualityPanel(page);
    await expect(page.getByTestId('layout-quality-scope')).not.toContainText('Measuring', { timeout: 90_000 });
    await expect(page.getByTestId('layout-quality-status')).toHaveAttribute('data-status', /ready|needs-adjustment|review-required/);
    await page.getByTestId('layout-quality-panel').screenshot({ path: path.join(OUT, 'step4-quality-panel.png') });

    // Collapsing it again leaves just the bar.
    await page.getByTestId('layout-quality-toggle').click();
    await expect(page.getByTestId('layout-quality-panel')).toHaveCount(0);

    await test.info().attach('console-errors.txt', { body: consoleErrors.join('\n') || '(none)', contentType: 'text/plain' });
    console.log('CONSOLE ERRORS:\n' + (consoleErrors.join('\n') || '(none)'));
    expect(pageErrors, `uncaught page errors: ${pageErrors.join(' | ')}`).toEqual([]);
  });

  test('the color popover opens on the real clip, offers colors from the video, and applies one', async ({ page }) => {
    test.setTimeout(240_000);
    fs.mkdirSync(OUT, { recursive: true });
    await page.setViewportSize({ width: 1440, height: 900 });
    await seedBrand(page);
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: /Step 3/i }).click();
    await dialog.getByRole('button', { name: /Step 4/i }).click();
    await expect(dialog.getByRole('heading', { name: 'Preview and approve' })).toBeVisible();

    await dialog.getByRole('button', { name: 'Select Business name' }).click();
    const trigger = dialog.getByRole('button', { name: 'Text color' });
    await trigger.scrollIntoViewIfNeeded();
    const before = (await trigger.innerText()).trim();
    await trigger.click();
    const pop = dialog.getByTestId('color-field-popover');
    await expect(pop).toBeVisible();

    // Colors read from the video's own frame, and a contrast readout against it.
    await expect(pop.getByText('From your video')).toBeVisible({ timeout: 15_000 });
    await expect(pop.getByTestId('color-field-contrast')).toBeVisible();
    await page.waitForTimeout(400); // let the popover finish scrolling into view
    await page.screenshot({ path: path.join(OUT, 'color-popover.png') });

    // Applying a sampled color changes the control (and the layer).
    const sample = pop.getByRole('button', { name: /^Use #/ }).nth(3);
    const wanted = (await sample.getAttribute('aria-label'))!.replace('Use ', '').toUpperCase();
    await sample.click();
    await expect(trigger).toContainText(wanted);
    expect(before).not.toBe(wanted);

    // Auto picks a readable color for this footage; Esc closes and keeps focus on the control.
    await pop.getByTestId('color-field-auto').click();
    await expect(pop.getByTestId('color-field-contrast')).toHaveAttribute('data-grade', /AAA|AA/);
    await page.keyboard.press('Escape');
    await expect(pop).toHaveCount(0);
  });

  test('the layer toolbar restacks, locks and hides; the layers list reorders from the keyboard', async ({ page }) => {
    test.setTimeout(240_000);
    fs.mkdirSync(OUT, { recursive: true });
    await page.setViewportSize({ width: 1440, height: 900 });
    await seedBrand(page);
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: /Step 3/i }).click();
    await dialog.getByRole('button', { name: /Step 4/i }).click();
    await expect(dialog.getByRole('heading', { name: 'Preview and approve' })).toBeVisible();

    const order = async () => dialog.getByTestId('layer-row').evaluateAll((rows) => rows.map((r) => r.getAttribute('data-layer-id')));
    const before = await order(); // front to back
    expect(before.length).toBeGreaterThanOrEqual(3);

    // Select the frontmost layer: Bring forward is disabled; Send backward moves it down one place.
    const front = before[0]!;
    await dialog.locator(`[data-layer-id="${front}"] [role="button"][aria-label^="Select"]`).click();
    const toolbar = dialog.getByTestId('layer-toolbar');
    await expect(toolbar).toBeVisible();
    await expect(toolbar.getByTestId('layer-toolbar-forward')).toBeDisabled();
    await page.screenshot({ path: path.join(OUT, 'layer-toolbar.png') });
    await toolbar.getByTestId('layer-toolbar-backward').click();
    await expect.poll(order).toEqual([before[1], before[0], ...before.slice(2)]);

    // Keyboard reorder through the drag handle (dnd-kit): Space picks up, ArrowDown moves, Space drops.
    const handle = dialog.locator(`[data-layer-id="${before[1]}"] [data-testid="layer-drag-handle"]`);
    await handle.focus();
    // dnd-kit measures between steps, so give each key a frame to land.
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(300);
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);
    await expect.poll(order).toEqual([before[0], before[1], ...before.slice(2)]);

    // Lock then hide from the toolbar.
    await dialog.getByTestId('layer-toolbar-lock').click();
    await expect(dialog.getByTestId('layer-toolbar-lock')).toHaveAttribute('aria-pressed', 'true');
    await dialog.getByTestId('layer-toolbar-hide').click();
    await expect(dialog.getByRole('button', { name: /^Show / }).first()).toBeVisible();
  });

  test('tooltips explain controls on hover and keyboard focus', async ({ page }) => {
    test.setTimeout(240_000);
    fs.mkdirSync(OUT, { recursive: true });
    await page.setViewportSize({ width: 1440, height: 900 });
    await seedBrand(page);
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: /Step 3/i }).click();
    await dialog.getByRole('button', { name: /Step 4/i }).click();
    await expect(dialog.getByRole('heading', { name: 'Preview and approve' })).toBeVisible();

    // Keyboard focus shows the tip and links it to the control; Esc hides it.
    const snap = dialog.getByTestId('editor-snap');
    await snap.scrollIntoViewIfNeeded();
    await snap.focus();
    const tip = dialog.getByTestId('editor-tip');
    await expect(tip).toBeVisible();
    await expect(tip).toContainText('Snap layers to the frame center');
    await expect(snap).toHaveAttribute('aria-describedby', /.+/);
    await page.screenshot({ path: path.join(OUT, 'tooltip-snap.png') });
    await page.keyboard.press('Escape');
    await expect(tip).toHaveCount(0);

    // Hover also shows a tip (the Render / Generate buttons are only shown to signed-in users, so their
    // paid/free badges are covered by the Tip unit tests instead).
    const undo = dialog.locator('[data-tip-id="undo"]');
    await undo.hover();
    await expect(dialog.getByTestId('editor-tip')).toContainText('Undo your last change');
  });
});
