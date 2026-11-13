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
    // Only the video's own transport row (play, scrubber, Live toggle) may sit between the video and the bar.
    const transport = (await page.getByTestId('editor-transport').boundingBox())!;
    expect(transport.y, 'the transport row is right under the video').toBeLessThan(s.y + s.height + 20);
    expect(b.y, 'the bar follows the transport row').toBeGreaterThanOrEqual(transport.y + transport.height - 1);
    expect(b.y - (transport.y + transport.height), 'nothing else sits between the transport row and the bar').toBeLessThan(30);

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

    // Hover also shows a tip.
    const undo = dialog.locator('[data-tip-id="undo"]');
    await undo.hover();
    await expect(dialog.getByTestId('editor-tip')).toContainText('Undo your last change');

    // Paid vs free actions are marked in their tips.
    const ai = dialog.locator('[data-tip-id="generateAi"]');
    await ai.scrollIntoViewIfNeeded();
    await ai.hover();
    await expect(dialog.getByTestId('tip-paid')).toBeVisible();
    await dialog.locator('[data-tip-id="renderBranded"]').hover();
    await expect(dialog.getByTestId('tip-free')).toBeVisible();
  });

  test('the timeline sits under the quality bar and retiming a layer changes real project state', async ({ page }) => {
    test.setTimeout(240_000);
    fs.mkdirSync(OUT, { recursive: true });
    await page.setViewportSize({ width: 1440, height: 900 });
    await seedBrand(page);
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: /Step 3/i }).click();
    await dialog.getByRole('button', { name: /Step 4/i }).click();
    await expect(dialog.getByRole('heading', { name: 'Preview and approve' })).toBeVisible();

    const timeline = dialog.getByTestId('timeline');
    await timeline.scrollIntoViewIfNeeded();
    await expect(timeline).toBeVisible();
    const bar = page.getByTestId('layout-quality-bar');
    const b = (await bar.boundingBox())!;
    const t = (await timeline.boundingBox())!;
    expect(t.y, 'timeline is under the quality bar').toBeGreaterThanOrEqual(b.y + b.height - 1);

    const headlineBar = timeline.locator('[data-testid="timeline-bar"][data-layer-id="headline"]');
    const before = Number(await headlineBar.getAttribute('data-start'));
    await headlineBar.getByTestId('timeline-move').focus();
    for (let i = 0; i < 10; i++) await page.keyboard.press('ArrowRight');
    await expect(headlineBar).toHaveAttribute('data-start', String(before + 10));
    // the same change is what the project holds, so the preview and export use it
    const held = await page.evaluate(() => (window as unknown as { __personalizationCtx?: { previewSettings?: { layers: { id: string; startFrame: number }[] } } }).__personalizationCtx?.previewSettings?.layers.find((l) => l.id === 'headline')?.startFrame);
    if (held !== undefined) expect(held).toBe(before + 10);
    await page.screenshot({ path: path.join(OUT, 'timeline.png') });
  });

  test('Remove branding (AI) asks for confirmation, shows the cost, and starts no job until confirmed', async ({ page }) => {
    test.setTimeout(240_000);
    fs.mkdirSync(OUT, { recursive: true });
    // No real request may leave: the estimate and balance are faked, and any attempt to submit the paid job is recorded.
    let jobSubmitted = 0;
    await page.route('**/api/v1/models/**/estimate-cost', (route) => route.fulfill({ json: { cost: 0.25, currency: 'USD' } }));
    await page.route('**/api/v1/account/balance', (route) => route.fulfill({ json: { balance: 12 } }));
    await page.route('**/api/v1/video-watermark-remover', (route) => { jobSubmitted++; return route.abort(); });
    await page.setViewportSize({ width: 1440, height: 900 });
    await seedBrand(page);
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: /Step 3/i }).click();
    await dialog.getByRole('button', { name: /Step 4/i }).click();
    await expect(dialog.getByRole('heading', { name: 'Preview and approve' })).toBeVisible();

    const open = dialog.getByTestId('remove-branding-open');
    await open.scrollIntoViewIfNeeded();
    await expect(open).toBeVisible();
    await expect(open).toContainText('Remove branding (AI)');
    await open.hover();
    await expect(dialog.getByTestId('tip-paid')).toBeVisible();

    await open.click();
    const confirm = dialog.getByTestId('remove-branding-confirm');
    await expect(confirm).toBeVisible();
    await expect(confirm).toContainText('This is not free');
    await expect(dialog.getByTestId('remove-branding-cost')).toContainText('0.25 USD');
    await expect(confirm).toContainText('original video is kept');
    const go = dialog.getByTestId('remove-branding-confirm-button');
    await expect(go).toBeDisabled(); // needs the rights tick first
    await page.screenshot({ path: path.join(OUT, 'remove-branding-confirm.png') });

    // Cancel: nothing was started.
    await dialog.getByTestId('remove-branding-cancel').click();
    await expect(confirm).toHaveCount(0);
    expect(jobSubmitted, 'no paid job may be submitted without an explicit confirm').toBe(0);
  });

  test('the live stage plays the real clip under the editor and a layer can be dragged on top of it', async ({ page }) => {
    test.setTimeout(240_000);
    fs.mkdirSync(OUT, { recursive: true });
    await page.setViewportSize({ width: 1440, height: 900 });
    await seedBrand(page);
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: /Step 3/i }).click();
    await dialog.getByRole('button', { name: /Step 4/i }).click();
    await expect(dialog.getByRole('heading', { name: 'Preview and approve' })).toBeVisible();

    const live = dialog.getByTestId('editor-live-player');
    await live.scrollIntoViewIfNeeded();
    await expect(live).toBeVisible();
    await expect(dialog.getByTestId('editor-live-toggle')).toHaveAttribute('aria-pressed', 'true');

    // Press play: the preview clock advances, so the real Remotion Player is running the real clip.
    const time = dialog.getByTestId('editor-timecode');
    const t0 = (await time.innerText()).trim();
    await dialog.getByTestId('editor-play').click();
    await expect.poll(async () => (await time.innerText()).trim(), { timeout: 20_000 }).not.toBe(t0);
    await dialog.getByTestId('editor-play').click(); // pause
    await expect(dialog.getByTestId('editor-play')).toHaveAttribute('aria-label', 'Play preview');
    await page.screenshot({ path: path.join(OUT, 'live-stage.png') });

    // Scrub to a later frame with the slider.
    await dialog.getByTestId('editor-scrubber').fill('90');
    await expect.poll(async () => (await time.innerText()).trim().startsWith('3.0')).toBe(true);

    // Dragging a layer over the live video moves it, and playback is paused while it is grabbed.
    const box = dialog.getByRole('button', { name: 'Move Business name' });
    const before = (await box.boundingBox())!;
    await page.mouse.move(before.x + 10, before.y + before.height / 2);
    await page.mouse.down();
    await page.mouse.move(before.x + 120, before.y + before.height / 2 - 40, { steps: 8 });
    await page.mouse.up();
    const after = (await box.boundingBox())!;
    expect(Math.abs(after.x - before.x) + Math.abs(after.y - before.y), 'the layer moved').toBeGreaterThan(20);

    // The Live toggle falls back to the still poster and back.
    await dialog.getByTestId('editor-live-toggle').click();
    await expect(live).toHaveCount(0);
    await dialog.getByTestId('editor-live-toggle').click();
    await expect(live).toBeVisible();
  });

  test('a corner resize keeps the opposite corner fixed, and the rotation handle turns the layer', async ({ page }) => {
    test.setTimeout(240_000);
    fs.mkdirSync(OUT, { recursive: true });
    await page.setViewportSize({ width: 1440, height: 900 });
    await seedBrand(page);
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: /Step 3/i }).click();
    await dialog.getByRole('button', { name: /Step 4/i }).click();
    await expect(dialog.getByRole('heading', { name: 'Preview and approve' })).toBeVisible();
    await dialog.getByTestId('editor-live-player').scrollIntoViewIfNeeded();

    // Select the logo (a clean square, so the box maths is easy to read).
    const logo = dialog.getByRole('button', { name: 'Move Logo' });
    await logo.click();
    for (const id of ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']) await expect(dialog.getByTestId(`resize-handle-${id}`)).toBeVisible();

    // Drag the bottom-right corner outward: the top-left corner must not move.
    const before = (await logo.boundingBox())!;
    const se = (await dialog.getByTestId('resize-handle-se').boundingBox())!;
    await page.mouse.move(se.x + se.width / 2, se.y + se.height / 2);
    await page.mouse.down();
    await page.mouse.move(se.x + se.width / 2 + 40, se.y + se.height / 2 + 40, { steps: 8 });
    await page.mouse.up();
    const grown = (await logo.boundingBox())!;
    expect(grown.width, 'the box grew').toBeGreaterThan(before.width + 10);
    expect(Math.abs(grown.x - before.x), 'left edge fixed').toBeLessThan(3);
    expect(Math.abs(grown.y - before.y), 'top edge fixed').toBeLessThan(3);

    // Drag the rotation handle to the right of the layer's center: about 90 degrees.
    const c = { x: grown.x + grown.width / 2, y: grown.y + grown.height / 2 };
    const rot = (await dialog.getByTestId('rotate-handle').boundingBox())!;
    await page.mouse.move(rot.x + rot.width / 2, rot.y + rot.height / 2);
    await page.mouse.down();
    await page.mouse.move(c.x + 120, c.y, { steps: 10 });
    await page.mouse.up();
    const field = dialog.getByTestId('rotation-field');
    const turned = Number(await field.inputValue());
    expect(turned, 'rotated close to 90 degrees').toBeGreaterThan(80);
    expect(turned).toBeLessThan(100);
    await expect(dialog.getByTestId('rotate-handle')).toHaveAttribute('aria-valuenow', String(turned));

    // Keyboard: arrows rotate by 1, Home straightens.
    await dialog.getByTestId('rotate-handle').focus();
    await page.keyboard.press('ArrowRight');
    await expect(field).toHaveValue(String(turned + 1));
    await page.keyboard.press('Home');
    await expect(field).toHaveValue('0');
    await page.screenshot({ path: path.join(OUT, 'handles.png') });
  });

  test('inspector tabs switch groups of settings, and the first-run tour is dismissible and remembered', async ({ page }) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await seedBrand(page);
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: /Step 3/i }).click();
    await dialog.getByRole('button', { name: /Step 4/i }).click();
    await expect(dialog.getByRole('heading', { name: 'Preview and approve' })).toBeVisible();

    // First visit: the tour opens by itself; Skip closes it and it stays closed after a reload of the step.
    const tour = dialog.getByTestId('editor-tour');
    await tour.scrollIntoViewIfNeeded();
    await expect(tour).toBeVisible();
    await dialog.getByTestId('editor-tour-next').click();
    await expect(tour).toContainText('Step 2 of 4');
    await dialog.getByTestId('editor-tour-skip').click();
    await expect(tour).toHaveCount(0);
    await dialog.getByTestId('editor-shortcuts-toggle').click();
    await expect(dialog.getByTestId('editor-shortcuts')).toContainText('Undo');
    await dialog.getByTestId('editor-shortcuts-toggle').click();

    // Tabs: only one group of settings is visible at a time.
    await dialog.getByRole('button', { name: 'Move Logo' }).click();
    await expect(dialog.getByLabel('Layer image')).toBeVisible();
    await expect(dialog.getByLabel('Layer size')).toBeHidden();
    await dialog.getByTestId('inspector-tab-layout').click();
    await expect(dialog.getByLabel('Layer size')).toBeVisible();
    await expect(dialog.getByTestId('rotation-field')).toBeVisible();
    await dialog.getByTestId('inspector-tab-timing').click();
    await expect(dialog.getByLabel('Layer animation')).toBeVisible();
    await expect(dialog.getByLabel('Layer size')).toBeHidden();
  });

  test('an uploaded video (a blob: URL) plays in the live editor and raises no security-policy errors', async ({ page }) => {
    test.setTimeout(240_000);
    const violations: string[] = [];
    page.on('console', (m) => { if (/Content Security Policy|Refused to connect/i.test(m.text())) violations.push(m.text().slice(0, 200)); });
    await page.setViewportSize({ width: 1440, height: 900 });
    await seedBrand(page);
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: /Step 2/i }).click();
    await dialog.getByRole('tab', { name: 'Upload' }).click();
    await page.setInputFiles('#guided-video-upload', path.join(process.cwd(), 'public/media/minimax-h3/videos/luxury-perfume-commercial.webm'));
    await expect(dialog.getByText(/Uploaded videos stay in this browser/)).toBeVisible();
    await dialog.getByRole('button', { name: /Step 3/i }).click();
    await dialog.getByRole('button', { name: /Step 4/i }).click();
    const live = dialog.getByTestId('editor-live-player');
    await live.scrollIntoViewIfNeeded();
    await expect(live).toBeVisible();
    const time = dialog.getByTestId('editor-timecode');
    const t0 = (await time.innerText()).trim();
    await dialog.getByTestId('editor-play').click();
    await expect.poll(async () => (await time.innerText()).trim(), { timeout: 20_000 }).not.toBe(t0);
    await dialog.getByTestId('editor-play').click();
    expect(violations, 'no CSP violations while reading the uploaded video').toEqual([]);
  });
});
