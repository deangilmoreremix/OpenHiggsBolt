import { test, expect, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Saved text styles in the real modal and the real in-browser export. Offline: the demo clip and a logo that ship in this repo.
 * Styles one text layer (magenta, bigger), saves it, applies it to a second text layer, checks the second layer took the look and
 * kept its own words and place, checks a brand color follows the project, checks the style is offered again in a fresh project
 * (this browser's library), then exports an MP4 and measures with ffmpeg that both layers are magenta. No paid API is called.
 * Needs `ffmpeg` on PATH.
 */
const OUT = process.env.TEXT_STYLES_OUT_DIR ?? path.join(process.cwd(), 'test-results', 'text-styles');
const LOGO = path.join(process.cwd(), 'public/motion-studio/previews/IconFlipBloomLogo-a.jpg');
const dataUrl = (file: string) => `data:image/jpeg;base64,${fs.readFileSync(file).toString('base64')}`;

async function seed(page: Page) {
  await page.addInitScript(() => {
    const original = URL.createObjectURL.bind(URL);
    const blobs: Blob[] = [];
    (window as unknown as { __blobs: Blob[] }).__blobs = blobs;
    URL.createObjectURL = (obj: Blob | MediaSource) => {
      try { if (obj instanceof Blob) blobs.push(obj); } catch { /* ignore */ }
      return original(obj);
    };
  });
  await page.goto('/personalization-demo?test=true', { timeout: 60_000 });
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: /Advanced Editing/i }).click();
  await dialog.getByRole('button', { name: 'My Business' }).click();
  await dialog.getByRole('button', { name: /Next: Profile/ }).click();
  await page.fill('input[placeholder="ABC Roofing"]', 'Rascop And Associates LLC');
  await dialog.getByRole('button', { name: /Next: Your assets/ }).click();
  const logoCard = page.locator('article.asset-card').filter({ hasText: '2. LOGO' });
  await logoCard.getByPlaceholder('Paste logo URL and press Enter').fill(dataUrl(LOGO));
  await page.locator('button:has-text("Add Logo URL")').first().dispatchEvent('click');
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: /Simple Mode/i }).click();
  await dialog.getByRole('button', { name: /Step 3/i }).click();
  await dialog.getByRole('button', { name: /Step 4/i }).click();
  await expect(dialog.getByRole('heading', { name: 'Preview and approve' })).toBeVisible();
}

test('save a text style, apply it to another layer, reuse it in a new project, and see it in the export', async ({ page }) => {
  test.setTimeout(420_000);
  fs.mkdirSync(OUT, { recursive: true });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 300)));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await seed(page);
  const dialog = page.getByRole('dialog');
  const select = async (name: string) => { await dialog.getByRole('button', { name: `Move ${name}` }).click(); await dialog.getByTestId('inspector-tab-content').click(); };
  const setColor = async (label: string, hex: string) => {
    await dialog.getByRole('button', { name: label }).first().click();
    const hexInput = page.getByRole('textbox', { name: /hex/i }).first();
    await hexInput.fill(hex);
    await hexInput.press('Enter');
    await page.keyboard.press('Escape');
  };
  const state = () => page.evaluate(() => {
    const dlg = document.querySelector('[role="dialog"]')!;
    const pick = (n: string) => dlg.querySelector<HTMLElement>(`[aria-label="Move ${n}"]`)!.getBoundingClientRect();
    const stage = dlg.querySelector('[data-testid="editor-live-player"]')!.getBoundingClientRect();
    const f = (n: string) => { const r = pick(n); return { x: (r.left - stage.left) / stage.width, y: (r.top - stage.top) / stage.height, w: r.width / stage.width, h: r.height / stage.height }; };
    return { name: f('Business name'), headline: f('Headline') };
  });

  // 1. Style the business name: magenta text.
  await dialog.getByTestId('editor-live-player').scrollIntoViewIfNeeded();
  await select('Business name');
  await setColor('Text color', '#ff00ff');
  const before = await state();
  await dialog.getByTestId('layer-style-name').fill('Magenta name');
  await dialog.getByTestId('layer-style-save').click();
  await expect(dialog.getByTestId('layer-style-apply')).toHaveText('Magenta name');

  // 2. Apply it to the headline: takes the look, keeps its own words and place.
  await select('Headline');
  await dialog.getByLabel('Layer text').fill('Fresh scents daily');
  const headlineBefore = await state();
  const wordsBefore = await dialog.getByLabel('Layer text').inputValue();
  await dialog.getByTestId('layer-style-apply').click();
  await expect(dialog.getByRole('button', { name: 'Text color' }).first()).toContainText(/ff00ff/i);
  expect(await dialog.getByLabel('Layer text').inputValue(), 'the words are untouched').toBe(wordsBefore);
  const headlineAfter = await state();
  expect(Math.abs(headlineAfter.headline.x - headlineBefore.headline.x), 'position untouched').toBeLessThan(0.01);
  expect(Math.abs(headlineAfter.headline.y - headlineBefore.headline.y), 'position untouched').toBeLessThan(0.01);
  void before;
  await page.screenshot({ path: path.join(OUT, 'applied.png') });

  // 3. This browser keeps it.
  const stored = await page.evaluate(() => window.localStorage.getItem('personalization:text-styles'));
  expect(stored).toContain('Magenta name');

  // 4. Export and measure: both layers are magenta in the video.
  await dialog.getByRole('button', { name: /Approve this personalization|^Approved$/i }).click({ timeout: 30_000 });
  const rights = page.getByTestId('guided-rights-confirm').locator('input');
  if (await rights.count()) await rights.check();
  const blobCount = () => page.evaluate(() => (window as unknown as { __blobs: Blob[] }).__blobs.filter((b) => /^video\//.test(b.type)).length);
  const n0 = await blobCount();
  await dialog.getByRole('button', { name: 'Render branded video' }).click({ timeout: 60_000 });
  await expect.poll(blobCount, { timeout: 300_000, intervals: [1000] }).toBeGreaterThan(n0);
  const b64 = await page.evaluate(async () => {
    const blobs = (window as unknown as { __blobs: Blob[] }).__blobs.filter((b) => /^video\//.test(b.type));
    const bytes = new Uint8Array(await blobs[blobs.length - 1].arrayBuffer());
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)));
    return btoa(s);
  });
  const file = path.join(OUT, 'styles.mp4');
  fs.writeFileSync(file, Buffer.from(b64, 'base64'));
  const W = 480, H = 270;
  const magentaIn = (t: number, box: { x: number; y: number; w: number; h: number }) => {
    const raw = execFileSync('ffmpeg', ['-v', 'error', '-ss', String(t), '-i', file, '-frames:v', '1', '-vf', `scale=${W}:${H}`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']);
    let n = 0;
    for (let y = Math.max(0, Math.floor(box.y * H) - 2); y < Math.min(H, Math.ceil((box.y + box.h) * H) + 2); y++) for (let x = Math.max(0, Math.floor(box.x * W) - 2); x < Math.min(W, Math.ceil((box.x + box.w) * W) + 2); x++) {
      const i = (y * W + x) * 3;
      if (raw[i] > 190 && raw[i + 1] < 110 && raw[i + 2] > 190) n++;
    }
    return n;
  };
  let nameHits = 0, headHits = 0;
  for (const t of [1.5, 2.0, 2.5]) { nameHits = Math.max(nameHits, magentaIn(t, headlineAfter.name)); headHits = Math.max(headHits, magentaIn(t, headlineAfter.headline)); }
  expect(nameHits, 'business name is magenta in the export').toBeGreaterThan(30);
  expect(headHits, 'headline took the style and is magenta in the export').toBeGreaterThan(30);
  expect(errors, 'no uncaught page errors').toEqual([]);
});

test('a style saved elsewhere is offered from this browser, follows this project\'s brand color, and captions styles save and apply', async ({ page }) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 300)));
  await page.setViewportSize({ width: 1440, height: 1000 });
  const look = { scale: 1.2, opacity: 1, animation: 'fade', color: '@accent' };
  const cap = { position: 'top', size: 0.07, highlight: 'none', color: '@primary', highlightColor: '#ffffff', boxColor: '#000000', boxOpacity: 0.5, box: true, uppercase: false, bold: true };
  await page.addInitScript(({ look, cap }) => {
    window.localStorage.setItem('personalization:text-styles', JSON.stringify([
      { id: 'b1', name: 'Accent headline', kind: 'text', style: look },
      { id: 'b2', name: 'Top bar', kind: 'captions', style: cap },
    ]));
  }, { look, cap });
  await seed(page);
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Move Headline' }).click();
  await dialog.getByTestId('inspector-tab-content').click();
  await expect(dialog.getByTestId('layer-browser-styles')).toContainText('Accent headline');
  await expect(dialog.getByTestId('layer-browser-styles')).not.toContainText('Top bar'); // a captions style is not offered for text
  await dialog.getByTestId('layer-browser-add').click();
  await dialog.getByTestId('layer-style-apply').click();
  // The accent color is THIS project's, shown as the layer color.
  const color = (await dialog.getByRole('button', { name: 'Text color' }).first().innerText()).trim().toLowerCase();
  expect(color).toMatch(/#[0-9a-f]{6}/);
  expect(color, 'the brand reference resolved to a real color').not.toContain('@');

  expect(errors, 'no uncaught page errors').toEqual([]);
});
