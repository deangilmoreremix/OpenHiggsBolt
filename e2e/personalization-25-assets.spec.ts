import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

/**
 * S7 — 25 imported pictures in a REAL browser with a REAL export:
 *   - the asset panel says how many are imported / in the video / not used (it never implies 25 appear);
 *   - assigning one picture puts it in the exported frame; removing it takes it out again;
 *   - the whole journey makes zero AI / prompt-personalization / MuAPI / recast requests.
 * The target picture is solid magenta and every other picture is green-to-blue, so "is it in the frame" is a pixel check.
 */
const OUT = process.env.PHASE5_OUT_DIR ?? path.join(process.cwd(), 'test-results', 'assets-25');
const AI_REQUEST = /muapi|openai|\/api\/personalization\/(personalize|generate|recast|generate-prompt)|promptPersonaliz/i;
const COUNT = Number(process.env.ASSET_COUNT ?? 25);
const TARGET = Math.min(16, COUNT - 1); // index of the magenta picture

async function exportOnce(page: Page, label: string): Promise<string> {
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: /Step 4/i }).click();
  await expect(dialog.getByRole('heading', { name: 'Preview and approve' })).toBeVisible();
  await dialog.getByRole('button', { name: /Approve this personalization|^Approved$/i }).click({ timeout: 30_000 });
  const rights = page.getByTestId('guided-rights-confirm').locator('input');
  if (await rights.count()) await rights.check();
  const before = await page.evaluate(() => (window as unknown as { __blobs: Blob[] }).__blobs.filter((b) => /^video\//.test(b.type)).length);
  await dialog.getByRole('button', { name: 'Render branded video' }).click({ timeout: 60_000 });
  await expect.poll(() => page.evaluate(() => (window as unknown as { __blobs: Blob[] }).__blobs.filter((b) => /^video\//.test(b.type)).length), { timeout: 240_000, intervals: [500, 1000] }).toBeGreaterThan(before);
  const b64 = await page.evaluate(async () => {
    const blobs = (window as unknown as { __blobs: Blob[] }).__blobs.filter((b) => /^video\//.test(b.type));
    const bytes = new Uint8Array(await blobs[blobs.length - 1].arrayBuffer());
    let bin = ''; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)));
    return btoa(bin);
  });
  const file = path.join(OUT, `${label}.mp4`);
  fs.writeFileSync(file, Buffer.from(b64, 'base64'));
  expect(fs.statSync(file).size).toBeGreaterThan(10_000);
  return file;
}

/** Number of magenta pixels (r>200, g<80, b>150) in a frame taken at `seconds`. */
function magentaPixels(file: string, seconds: number): number {
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-ss', String(seconds), '-i', file, '-frames:v', '1', '-vf', 'scale=480:-2', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 64 * 1024 * 1024 });
  let n = 0;
  for (let i = 0; i + 2 < raw.length; i += 3) if (raw[i] > 200 && raw[i + 1] < 80 && raw[i + 2] > 150) n++;
  return n;
}

test(`${COUNT} imported pictures: honest summary, assign -> in the frame, remove -> out of the frame, zero AI requests`, async ({ page }) => {
  test.setTimeout(600_000);
  fs.mkdirSync(OUT, { recursive: true });
  const requests: string[] = [];
  page.on('request', (r) => requests.push(r.url()));
  await page.addInitScript(() => {
    const original = URL.createObjectURL.bind(URL);
    const blobs: Blob[] = [];
    (window as unknown as { __blobs: Blob[] }).__blobs = blobs;
    URL.createObjectURL = (obj: Blob | MediaSource) => { try { if (obj instanceof Blob) blobs.push(obj); } catch { /* ignore */ } return original(obj); };
  });
  await page.context().addCookies([{ name: '__e2e_auth_bypass', value: '1', url: process.env.DEMO_BASE_URL || 'http://localhost:3111' }]);
  await page.goto('/personalization-demo?test=true', { timeout: 60_000 });
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: /Advanced Editing/i }).click();
  await dialog.getByRole('button', { name: 'My Business' }).click();
  await dialog.getByRole('button', { name: /Next: Profile/ }).click();
  await page.fill('input[placeholder="ABC Roofing"]', 'Pictures Co');
  await dialog.getByRole('button', { name: /Next: Your assets/ }).click();

  // 25 distinct pictures; index TARGET is solid magenta, the rest are hues between green and blue.
  const pictures: string[] = await page.evaluate(([count, target]) => {
    const out: string[] = [];
    for (let i = 0; i < (count as number); i++) {
      const c = document.createElement('canvas'); c.width = 800; c.height = 600;
      const g = c.getContext('2d')!;
      g.fillStyle = i === target ? '#ff00cc' : `hsl(${100 + i * 6}, 70%, 45%)`;
      g.fillRect(0, 0, 800, 600);
      g.fillStyle = '#ffffff'; g.font = 'bold 120px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(String(i + 1), 400, 300);
      out.push(c.toDataURL('image/png'));
    }
    return out;
  }, [COUNT, TARGET]);
  const prodCard = page.locator('article.asset-card').filter({ hasText: /3\. PRODUCTS/i }).first();
  for (const pic of pictures) {
    const more = prodCard.getByRole('button', { name: /add more/i });
    if (await more.count()) await more.first().click();
    await prodCard.locator('input[placeholder*="Paste"]').first().fill(pic);
    await page.locator('button:has-text("Add Image/Video URL")').first().dispatchEvent('click');
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: /Simple Mode/i }).click();

  await dialog.getByRole('button', { name: /Step 2/i }).click();
  await dialog.getByRole('tab', { name: /AI Demos/i }).click();
  await dialog.getByPlaceholder('Search demos…').fill('luxury perfume');
  const card = dialog.locator('[data-testid*="luxury-perfume-commercial"]').first();
  await card.scrollIntoViewIfNeeded(); await card.click();
  await page.waitForTimeout(1500);

  await dialog.getByRole('button', { name: /Step 3/i }).click();
  const panel = dialog.getByTestId('asset-usage-panel');
  await expect(panel).toBeVisible();
  const read = async () => {
    const text = await dialog.getByTestId('asset-usage-summary').innerText();
    const m = /(\d+) imported\D+(\d+) in the video\D+(\d+) not used/.exec(text);
    expect(m, `summary text: ${text}`).not.toBeNull();
    return { total: Number(m![1]), inVideo: Number(m![2]), unused: Number(m![3]) };
  };
  const first = await read();
  fs.writeFileSync(path.join(OUT, 'summary-initial.json'), JSON.stringify(first));
  expect(first.total).toBe(COUNT);
  expect(first.inVideo + first.unused).toBe(COUNT);
  expect(first.inVideo).toBeLessThan(COUNT); // importing 25 pictures never puts all 25 in the video
  await expect(panel.locator('[data-testid^="asset-usage-"][data-state]')).toHaveCount(COUNT);

  // Put the magenta picture on the Product layer.
  const rows = panel.locator('[data-testid^="asset-usage-"][data-state]');
  await rows.nth(TARGET).getByRole('button', { name: /as the product image/ }).click();
  await expect(rows.nth(TARGET)).toHaveAttribute('data-state', 'rendered');
  const assigned = await read();
  expect(assigned.total).toBe(COUNT);
  expect(assigned.inVideo).toBeGreaterThanOrEqual(1);
  expect(assigned.inVideo).toBeLessThan(COUNT);

  const withIt = await exportOnce(page, 'with-target');
  const withCount = Math.max(magentaPixels(withIt, 2.0), magentaPixels(withIt, 3.0));

  // After a render, "Step 3" shows the result screen first; "Generate Again" returns to the wizard. The pictures and the
  // assignment must still be there afterwards.
  await dialog.getByRole('button', { name: /Step 3/i }).click();
  const again = dialog.getByRole('button', { name: 'Generate Again' });
  if (await again.isVisible({ timeout: 4000 }).catch(() => false)) await again.click();
  await dialog.getByRole('button', { name: /Step 3/i }).click();
  await expect(panel).toBeVisible();
  expect((await read()).total, 'the pictures survive going back from the result screen').toBe(COUNT);
  await expect(rows.nth(TARGET)).toHaveAttribute('data-state', 'rendered');
  await rows.nth(TARGET).getByRole('button', { name: /^Remove\s.*from the video$/ }).click();
  await expect(rows.nth(TARGET)).not.toHaveAttribute('data-state', 'rendered');
  const removed = await read();
  expect(removed.total).toBe(COUNT);

  const without = await exportOnce(page, 'without-target');
  const withoutCount = Math.max(magentaPixels(without, 2.0), magentaPixels(without, 3.0));

  fs.writeFileSync(path.join(OUT, 'result.json'), JSON.stringify({ first, assigned, removed, magentaWith: withCount, magentaWithout: withoutCount }, null, 2));
  expect(withCount, 'the assigned picture is in the exported frame').toBeGreaterThan(500);
  expect(withoutCount, 'after Remove the picture is out of the exported frame').toBeLessThan(50);

  const ai = requests.filter((u) => AI_REQUEST.test(u));
  expect(ai, `AI requests: ${ai.join(', ')}`).toEqual([]);
});
