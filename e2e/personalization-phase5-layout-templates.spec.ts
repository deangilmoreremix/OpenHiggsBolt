import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Phase 5 — the three layout templates (Business Introduction, Product
 * Showcase, Service Promotion) as the customer sees them in the Step 3
 * template browser, with deterministic brand data (long business name, wide
 * logo, product image — all generated on a canvas, no network) at every
 * supported aspect ratio.
 *
 * Browser-only: no AI, no MuAPI, no network. Artifacts go to
 * `test-results/phase5/` (git-ignored), never to tracked docs.
 */
const OUT = path.join(process.cwd(), 'test-results', 'phase5');
const LAYOUTS = ['Business Introduction', 'Product Showcase', 'Service Promotion'];
const RATIOS = ['16:9', '9:16', '1:1', '4:5'];
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
  await page.goto('/personalization-demo?test=true');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  // Advanced Editing has the plain asset inputs; the project state is shared.
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

test.describe('Phase 5 — layout templates composition', () => {
  for (const ratio of RATIOS) {
    test(`all three layouts at ${ratio} stay inside the frame`, async ({ page }) => {
      fs.mkdirSync(OUT, { recursive: true });
      await seedBrand(page);
      const dialog = page.getByRole('dialog');
      // Aspect ratio is a project setting (Step 4), shared with Step 3's cards.
      await dialog.getByRole('button', { name: /Step 4/i }).click();
      await dialog.getByLabel(/video shape/i).selectOption(ratio);
      await dialog.getByRole('button', { name: /Step 3/i }).click();

      for (const name of LAYOUTS) {
        const card = dialog.locator('[data-testid="personalization-template-card"]', { hasText: name }).first();
        await card.scrollIntoViewIfNeeded();
        await expect(card).toBeVisible();
        await page.waitForTimeout(2000);
        const slug = `${name.replace(/\s+/g, '-').toLowerCase()}-${ratio.replace(':', 'x')}`;
        await card.screenshot({ path: path.join(OUT, `${slug}.png`) });

        const player = card.locator('[data-testid="personalization-template-player"]').first();
        const outside = await player.evaluate((root) => {
          const r = root.getBoundingClientRect();
          const bad: string[] = [];
          root.querySelectorAll('*').forEach((el) => {
            const e = el as HTMLElement;
            if (e.children.length > 0) return;
            const isImg = e.tagName === 'IMG';
            if (!isImg && !e.innerText?.trim()) return;
            const b = e.getBoundingClientRect();
            if (b.width === 0 || b.height === 0) return;
            if (b.left < r.left - 1 || b.right > r.right + 1)
              bad.push(`${(e.innerText || e.tagName).trim().slice(0, 30)} [${Math.round(b.left - r.left)},${Math.round(b.right - r.right)}]`);
          });
          return bad;
        });
        expect(outside, `${name} @ ${ratio}: hanging outside the frame: ${outside.join(' | ')}`).toEqual([]);
      }
    });
  }
});
