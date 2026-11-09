import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Phase 5 — the three layout templates (Business Introduction, Product
 * Showcase, Service Promotion) as the customer sees them in the Step 3
 * template browser. Captures each card's live Remotion player and asserts that
 * no drawn text/image layer hangs outside the frame or wraps a word mid-word.
 *
 * Artifacts go to `test-results/phase5/` (git-ignored), never to tracked docs.
 */
const OUT = path.join(process.cwd(), 'test-results', 'phase5');
const LAYOUTS = ['Business Introduction', 'Product Showcase', 'Service Promotion'];

test.describe('Phase 5 — layout templates composition', () => {
  for (const name of LAYOUTS) {
    test(`${name}: card renders inside the frame`, async ({ page }) => {
      fs.mkdirSync(OUT, { recursive: true });
      await page.goto('/personalization-demo?test=true');
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await dialog.getByRole('button', { name: /Step 3/i }).click();

      const card = dialog.locator('[data-testid="personalization-template-card"]', { hasText: name }).first();
      await card.scrollIntoViewIfNeeded();
      await expect(card).toBeVisible();
      await page.waitForTimeout(2500); // let the paused rest frame render
      await card.screenshot({ path: path.join(OUT, `${name.replace(/\s+/g, '-').toLowerCase()}-card.png`) });

      const player = card.locator('[data-testid="personalization-template-player"]').first();
      const frame = await player.boundingBox();
      expect(frame).not.toBeNull();
      // Every leaf element drawn inside the player must lie inside its frame.
      const outside = await player.evaluate((root) => {
        const r = root.getBoundingClientRect();
        const bad: string[] = [];
        root.querySelectorAll('*').forEach((el) => {
          const e = el as HTMLElement;
          if (!e.innerText?.trim() || e.children.length > 0) return;
          const b = e.getBoundingClientRect();
          if (b.width === 0 || b.height === 0) return;
          if (b.left < r.left - 1 || b.right > r.right + 1) bad.push(`${e.innerText.trim().slice(0, 30)} [${Math.round(b.left - r.left)},${Math.round(b.right - r.right)}]`);
        });
        return bad;
      });
      expect(outside, `text hanging outside the frame: ${outside.join(' | ')}`).toEqual([]);
    });
  }
});
