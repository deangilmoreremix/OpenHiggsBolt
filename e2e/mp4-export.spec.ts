import { test, expect } from '@playwright/test';
import fs from 'fs';
import { installStudioSession } from './helpers/motion-studio';

test('Motion Studio real MP4 export via Remotion web renderer', async ({ page }) => {
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
    const line = `[dialog] ${d.message()}`;
    errors.push(line);
    console.log(line);
    await d.dismiss();
  });

  // Auth bypass cookie (readable from document.cookie) + blocked billing
  // hosts + the deterministic balance-poll stub from the shared helper.
  // entrySeen: the helper's init script re-runs on EVERY navigation, so the
  // workbench route has to be seeded here — setting the flag once in
  // page.evaluate would be wiped by the next reload.
  await installStudioSession(page, { entrySeen: true });

  // Navigate to workbench, set entry-seen flag so router lands on workbench
  await page.goto('http://127.0.0.1:3100/studio/motion-studio/', { waitUntil: 'commit', timeout: 45000 });
  await page.evaluate(() => {
    localStorage.setItem('motion-studio:entry-seen-v1', '1');
  });
  await page.reload({ waitUntil: 'commit' });
  await expect(page).toHaveURL(/\/studio\/motion-studio(\/)?(\?.*)?$/, { timeout: 15000 });

  // Wait for workbench to render
  await page.waitForSelector('.topbar', { timeout: 15000 });
  await page.waitForTimeout(2000);

  // Dismiss any modals
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  const closeBtn = page.getByRole('button', { name: /^Close$/ });
  if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await closeBtn.click({ force: true }).catch(() => {});
  }

  // 2. Click a recipe card properly — the card container div (cursor-pointer,
  //    wrapping the category tag + heading) owns the onClick that selects the
  //    recipe; clicking its heading bubbles up to that container.
  const cardHeading = page.locator('h3').filter({ hasText: '空间步进演示' }).first();
  await expect(cardHeading).toBeVisible({ timeout: 15000 });
  await cardHeading.click({ force: true });
  await page.waitForTimeout(2000);

  // 3. Verify Undo/Redo enabled (proves a change was committed to the undo stack).
  //    Clicking a card only previews it (setPreview does not commit), so commit an
  //    edit via "Add Track" if Undo is not already enabled.
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

  // 4. Click "Export video" button
  const exportBtn = page.locator('button').filter({ hasText: 'Export video' }).first();
  await expect(exportBtn).toBeVisible({ timeout: 15000 });
  await exportBtn.click();

  // Wait for the render to complete (done-state download link appears) or fail.
  // Detect: done link = success; "Export failed · Retry" button = render error;
  // back to "Export video" button = canRender check failed.
  const doneLink = page.locator('a').filter({ hasText: 'Exported' }).first();
  const retryBtn = page.locator('button').filter({ hasText: 'Export failed' }).first();
  let renderDone = false;
  let failReason = '';
  const deadline = Date.now() + 240000;
  while (Date.now() < deadline && !renderDone && !failReason) {
    await page.waitForTimeout(2000);
    if (await doneLink.isVisible().catch(() => false)) {
      renderDone = true;
      break;
    }
    if (await retryBtn.isVisible({ timeout: 0 }).catch(() => false)) {
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
  if (!renderDone) {
    console.log(`EXPORT RENDER FAILED: ${failReason || 'timeout'}`);
    console.log('CAPTURED ERRORS/WARNINGS:');
    errors.forEach((e) => console.log(e));
  }
  expect(renderDone).toBeTruthy();

  // 5. Wait for download (register before clicking the download link)
  const downloadPromise = page.waitForEvent('download', { timeout: 120000 });
  await doneLink.click();
  const download = await downloadPromise;
  console.log('DOWNLOAD FILENAME:', download.suggestedFilename());

  // 6. Save MP4
  const savePath = '/tmp/motion-studio-export.mp4';
  await download.saveAs(savePath);

  // 7. Verify: file size > 0 bytes, MP4 ftyp container at offset 4
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
