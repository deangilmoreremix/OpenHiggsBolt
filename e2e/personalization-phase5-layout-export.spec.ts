import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Phase 5 — REAL browser export of the three layout templates at every aspect
 * ratio, with the template-card player, the Step 4 editor stage and the Step 4
 * preview captured for the same project so the frames can be compared with the
 * exported MP4 (see scripts/phase5-compare-frames.sh).
 *
 * Browser-only: no AI, no MuAPI, no network. The export is the product's own
 * `Render branded video` path (@remotion/web-renderer -> WebCodecs -> MP4).
 *
 * Output: `PHASE5_OUT_DIR` (default test-results/phase5-export).
 */
const OUT = process.env.PHASE5_OUT_DIR ?? path.join(process.cwd(), 'test-results', 'phase5-export');
const LAYOUTS = ['Business Introduction', 'Product Showcase', 'Service Promotion'];
const RATIOS = (process.env.PHASE5_RATIOS ?? '16:9,9:16,1:1,4:5').split(',');
const LONG_NAME = 'Kreindler & Kreindler LLP';

async function makeDataUrl(page: Page, w: number, h: number, bg: string, label: string): Promise<string> {
  return page.evaluate(
    ([w, h, bg, label]) => {
      const c = document.createElement('canvas');
      c.width = w as number; c.height = h as number;
      const g = c.getContext('2d')!;
      g.fillStyle = bg as string; g.fillRect(0, 0, c.width, c.height);
      g.fillStyle = '#fff'; g.font = `bold ${Math.round((h as number) / 6)}px sans-serif`;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(label as string, c.width / 2, c.height / 2);
      return c.toDataURL('image/png');
    },
    [w, h, bg, label],
  );
}

async function seedBrand(page: Page) {
  await page.addInitScript(() => {
    const original = URL.createObjectURL.bind(URL);
    const blobs: Blob[] = [];
    (window as unknown as { __a1Blobs: Blob[] }).__a1Blobs = blobs;
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
  await page.fill('input[placeholder="ABC Roofing"]', LONG_NAME);
  await dialog.getByRole('button', { name: /Next: Your assets/ }).click();
  const logo = await makeDataUrl(page, 600, 200, '#12355b', 'KK LAW');
  const product = await makeDataUrl(page, 800, 800, '#a33b6b', 'PRODUCT');
  const logoCard = page.locator('article.asset-card').filter({ hasText: '2. LOGO' });
  await logoCard.getByPlaceholder('Paste logo URL and press Enter').fill(logo);
  await page.locator('button:has-text("Add Logo URL")').first().dispatchEvent('click');
  const prodCard = page.locator('article.asset-card').filter({ hasText: /3\. PRODUCTS/i }).first();
  await prodCard.locator('input[placeholder*="Paste"]').first().fill(product);
  await page.locator('button:has-text("Add Image/Video URL")').first().dispatchEvent('click');
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: /Simple Mode/i }).click();
}

test.describe('Phase 5 — layout templates: card vs editor vs preview vs exported MP4', () => {
  for (const ratio of RATIOS) {
    for (const layout of LAYOUTS) {
      test(`${layout} @ ${ratio}`, async ({ page }) => {
        test.setTimeout(240_000);
        fs.mkdirSync(OUT, { recursive: true });
        const slug = `${layout.replace(/\s+/g, '-').toLowerCase()}-${ratio.replace(':', 'x')}`;
        await seedBrand(page);
        const dialog = page.getByRole('dialog');

        // Aspect ratio is a project setting (Step 4).
        await dialog.getByRole('button', { name: /Step 4/i }).click();
        await dialog.getByLabel(/video shape/i).selectOption(ratio);

        // 1) Template card (Step 3): select the layout and capture its player.
        await dialog.getByRole('button', { name: /Step 3/i }).click();
        const card = dialog.locator('[data-testid="personalization-template-card"]', { hasText: layout }).first();
        await card.scrollIntoViewIfNeeded();
        // The gallery tints the CURRENTLY SELECTED card, so select a different
        // layout first; the target card is then captured untinted.
        const other = LAYOUTS.find((l) => l !== layout)!;
        await dialog
          .locator('[data-testid="personalization-template-card"]', { hasText: other })
          .first()
          .locator('[data-testid="personalization-template-use"]')
          .click();
        await page.waitForTimeout(1500);
        await card.scrollIntoViewIfNeeded();
        await page.waitForTimeout(2500);
        // Capture the card BEFORE applying it: right after "Use this template" the
        // card shows a transient selected/applying overlay.
        const player = card.locator('[data-testid="personalization-template-player"]').first();
        await player.screenshot({ path: path.join(OUT, `${slug}-1-card.png`) });
        await card.locator('[data-testid="personalization-template-use"]').click();
        await page.waitForTimeout(1500);

        // 2) Step 4: editor stage and live preview.
        await dialog.getByRole('button', { name: /Step 4/i }).click();
        await expect(dialog.getByRole('heading', { name: 'Preview and approve' })).toBeVisible();
        await page.waitForTimeout(2500);
        const stage = dialog.getByText('Edit on the video').locator('xpath=ancestor::*[self::section or self::div][1]/..').first();
        await stage.screenshot({ path: path.join(OUT, `${slug}-2-editor.png`) }).catch(async () => {
          await dialog.screenshot({ path: path.join(OUT, `${slug}-2-editor.png`) });
        });
        await dialog.getByRole('button', { name: 'Compare' }).click().catch(() => undefined);
        await page.waitForTimeout(1500);
        const after = page.getByRole('region', { name: /After: personalized preview/i });
        if (await after.count()) {
          // Seek the live preview to the card's rest time (1.5 s) through its own slider.
          const seeked = await after.first().evaluate((root) => {
            const range = root.querySelector('input[type=range]') as HTMLInputElement | null;
            if (!range) return false;
            const max = Number(range.max) || 1;
            const min = Number(range.min) || 0;
            const text = root.textContent ?? '';
            const m = /\/\s*(\d+):(\d+(?:\.\d+)?)/.exec(text);
            const total = m ? Number(m[1]) * 60 + Number(m[2]) : 5;
            const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
            setter.call(range, String(min + (max - min) * (1.5 / total)));
            range.dispatchEvent(new Event('input', { bubbles: true }));
            range.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
          });
          await page.waitForTimeout(1200);
          fs.writeFileSync(path.join(OUT, `${slug}-3-preview.seeked.txt`), String(seeked));
          await after.first().screenshot({ path: path.join(OUT, `${slug}-3-preview.png`) });
        }

        // 3) Approve and run the real in-browser export.
        await dialog.getByRole('button', { name: /Approve this personalization|^Approved$/i }).click({ timeout: 30_000 });
        await dialog.getByRole('button', { name: 'Render branded video' }).click({ timeout: 60_000 });
        await expect
          .poll(
            () => page.evaluate(() => (window as unknown as { __a1Blobs: Blob[] }).__a1Blobs.filter((b) => /^video\//.test(b.type)).length),
            { timeout: 200_000, intervals: [500, 1000] },
          )
          .toBeGreaterThan(0);
        const base64 = await page.evaluate(async () => {
          const blobs = (window as unknown as { __a1Blobs: Blob[] }).__a1Blobs.filter((b) => /^video\//.test(b.type));
          const bytes = new Uint8Array(await blobs[blobs.length - 1].arrayBuffer());
          let binary = '';
          for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)));
          return btoa(binary);
        });
        const file = path.join(OUT, `${slug}.mp4`);
        fs.writeFileSync(file, Buffer.from(base64, 'base64'));
        expect(fs.statSync(file).size).toBeGreaterThan(10_000);
      });
    }
  }
});
