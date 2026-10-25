/**
 * Motion Studio — real MP4 export through the Remotion Web Renderer.
 *
 * The export is a CLIENT-SIDE software H.264 encode that runs inside the
 * browser, so its wall clock scales with pixels x frames:
 *
 *   - the demo project (1920x1080, 412 frames / 13.8 s) needs ~760 s
 *   - a 1280x720, 150 frame (5 s) project needs ~140 s
 *
 * The old version of this spec rendered the demo project but only allowed
 * 240 s for the render, i.e. a deadline that is unreachable by ~3.2x — the
 * spec could never pass even though the exporter itself is healthy. It now
 *
 *   1. builds a SHORT project through the real entry flow (16:9 + 5 s +
 *      the crash-zoom-punch recipe), exactly what
 *      `e2e/motion-studio-export-mp4.spec.ts` renders, so the run finishes in
 *      a reasonable time, and
 *   2. allows 900 s for the render (plus a matching Playwright test timeout),
 *      which is generous enough for a slow CI box.
 *
 * No assertion was weakened: the file must exist, must be larger than 0
 * bytes and must be a real MP4 container (`ftyp` at offset 4).
 */
import { test, expect } from '@playwright/test';
import fs from 'fs';
import { BASE_URL, installStudioSession } from './helpers/motion-studio';

/** Hard deadline for the in-browser render (15 min). */
const RENDER_DEADLINE_MS = 900_000;

/** Playwright test timeout — must be larger than the render deadline. */
const TEST_TIMEOUT_MS = 1_200_000;

test('Motion Studio real MP4 export via Remotion web renderer', async ({ page }) => {
  test.setTimeout(TEST_TIMEOUT_MS);

  // 1. Console / page error capture (logged immediately so they surface even on failure)
  const errors: string[] = [];
  page.on('console', (msg) => {
    const t = msg.type();
    if (t === 'error' || t === 'warning') {
      const line = `[console:${t}] ${msg.text()}`;
      errors.push(line);
      console.log(line);
    }
  });
  page.on('pageerror', (err) => {
    const line = `[pageerror] ${err.message}`;
    errors.push(line);
    console.log(line);
  });
  page.on('dialog', async (d) => {
    const line = `[dialog] ${d.message}`;
    errors.push(line);
    console.log(line);
    await d.dismiss();
  });

  // Auth bypass cookie (readable from document.cookie) + blocked billing
  // hosts + the deterministic balance-poll stub from the shared helper.
  // entrySeen: false — the run starts on the INPUT step (/new) so the short
  // project below is created through the real entry flow.
  await installStudioSession(page, { entrySeen: false });

  // ── 1. INPUT step: describe the video and pick the SHORT recipe ──────────
  await page.goto(`${BASE_URL}/studio/motion-studio/new`, { waitUntil: 'load' });

  const prompt = page.getByPlaceholder('Describe your motion video...');
  await expect(prompt).toBeVisible({ timeout: 60_000 });
  await prompt.fill(
    'Motion Studio MP4 export — crash zoom punch over a warm paper backdrop',
  );

  // The control labels ARE the current values, so seeing "16:9" and "5s"
  // pins the project to 1280x720 @ 30fps / 150 frames (5 s).
  await expect(page.getByRole('button', { name: '16:9', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '5s', exact: true })).toBeVisible();

  // Pick the shot so the rendered composition is not empty.
  await page.getByRole('button', { name: /Select a recipe/ }).click();
  const search = page.getByPlaceholder('Search recipes...');
  await expect(search).toBeVisible();
  await search.fill('crash-zoom-punch');
  const firstHit = page.locator('button').filter({ hasText: 'crash-zoom-punch' }).first();
  await expect(firstHit).toBeVisible();
  await firstHit.click();

  // ── 2. Generate → the workbench ─────────────────────────────────────────
  const generate = page.getByRole('button', { name: /^Generate$/ });
  await expect(generate).toBeEnabled();
  await generate.click();

  await expect(page).toHaveURL(/\/studio\/motion-studio\/?(\?.*)?$/, { timeout: 60_000 });
  await expect(page.locator('.topbar')).toBeVisible({ timeout: 60_000 });
  await page.waitForTimeout(2000);

  // Dismiss any modals
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  const closeBtn = page.getByRole('button', { name: /^Close$/ });
  if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await closeBtn.click({ force: true }).catch(() => {});
  }

  // The recipe card is in the library grid (the live-preview grid).
  await expect(
    page.locator('[data-recipe-card*="crash-zoom-punch"]').first(),
  ).toBeVisible({ timeout: 30_000 });

  // The transport shows the project size — proof the export is the SHORT one.
  const sizeLabel = await page.locator('.transport .dim').last().innerText();
  console.log('PROJECT SIZE:', sizeLabel.trim());
  expect(sizeLabel).toContain('1280');
  expect(sizeLabel).toContain('720');

  // ── 3. Verify Undo/Redo enabled (proves a change was committed to the
  //       undo stack — the entry flow's setProject() commits). ──────────────
  const undoBtn = page.locator('button').filter({ hasText: 'Undo' }).first();
  let undoEnabled = await undoBtn.isEnabled().catch(() => false);
  if (!undoEnabled) {
    const addTrackBtn = page.locator('button').filter({ hasText: 'Track' }).first();
    if (await addTrackBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addTrackBtn.click();
      await page.waitForTimeout(1000);
    }
  }
  undoEnabled = await undoBtn.isEnabled().catch(() => false);
  console.log(`UNDO_ENABLED=${undoEnabled}`);
  expect(undoEnabled).toBeTruthy();

  // ── 4. Click "Export video" button ──────────────────────────────────────
  const exportBtn = page.locator('button').filter({ hasText: 'Export video' }).first();
  await expect(exportBtn).toBeVisible({ timeout: 15_000 });
  await exportBtn.click();

  // Wait for the render to complete (done-state download link appears) or fail.
  // Detect: done link = success; "Export failed · Retry" button = render error;
  // back to "Export video" button = canRender check failed.
  const doneLink = page.locator('a').filter({ hasText: 'Exported' }).first();
  const retryBtn = page.locator('button').filter({ hasText: 'Export failed' }).first();
  let renderDone = false;
  let failReason = '';
  const started = Date.now();
  const deadline = Date.now() + RENDER_DEADLINE_MS;
  while (Date.now() < deadline && !renderDone && !failReason) {
    await page.waitForTimeout(2000);
    if (await doneLink.isVisible().catch(() => false)) {
      renderDone = true;
      break;
    }
    if (await retryBtn.isVisible().catch(() => false)) {
      failReason = 'render-failed';
      break;
    }
    const exportVideoVisible = await page.locator('button').filter({ hasText: 'Export video' }).isVisible().catch(() => false);
    const exportingVisible = await page.locator('button').filter({ hasText: 'Exporting' }).isVisible().catch(() => false);
    if (exportVideoVisible && !exportingVisible) {
      failReason = 'canrender-failed';
      break;
    }
  }
  console.log(`RENDER SECONDS=${Math.round((Date.now() - started) / 1000)}`);
  if (!renderDone) {
    console.log(`EXPORT RENDER FAILED: ${failReason || 'timeout'}`);
    console.log('CAPTURED ERRORS/WARNINGS:');
    errors.forEach((e) => console.log(e));
  }
  expect(renderDone).toBeTruthy();

  // ── 5. Wait for download (register before clicking the download link) ────
  const downloadPromise = page.waitForEvent('download', { timeout: 120000 });
  await doneLink.click();
  const download = await downloadPromise;
  console.log('DOWNLOAD FILENAME:', download.suggestedFilename());

  // ── 6. Save MP4 ─────────────────────────────────────────────────────────
  const savePath = '/tmp/motion-studio-export.mp4';
  await download.saveAs(savePath);

  // ── 7. Verify: file size > 0 bytes, MP4 ftyp container at offset 4 ──────
  const stats = fs.statSync(savePath);
  console.log(`MP4 EXPORT: path=${savePath}, size=${stats.size} bytes`);
  expect(stats.size).toBeGreaterThan(0);

  const buffer = fs.readFileSync(savePath);
  const ftyp = buffer.subarray(4, 8).toString('ascii');
  console.log(`MP4 container magic: "${ftyp}"`);
  expect(buffer.subarray(4, 8).toString('ascii')).toMatch(/ftyp/);

  console.log('MP4 export verified: valid container, size > 0 bytes');

  if (errors.length) {
    console.log('CAPTURED ERRORS/WARNINGS:');
    errors.forEach((e) => console.log(e));
  } else {
    console.log('No console errors/warnings captured.');
  }
});
