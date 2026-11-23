import { test, expect } from '@playwright/test';
import { BASE_URL, installStudioSession } from './helpers/motion-studio';

/**
 * The studio tab row is wider than a desktop header. Every tab must still be
 * reachable: the row scrolls (mouse wheel included, its scrollbar is hidden)
 * and the open studio's tab is scrolled into view.
 */
test.describe('Studio tab row on desktop', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('the last studios are reachable with the mouse wheel', async ({ page }) => {
    await installStudioSession(page);
    await page.goto(`${BASE_URL}/studio/image`);
    const nav = page.locator('header nav').first();
    const tab = nav.getByRole('button', { name: 'Motion Director', exact: true });
    await expect(tab).toBeAttached({ timeout: 120_000 });
    expect(await nav.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);

    // Visible inside the header's tab area (not clipped by it or the window).
    const shownInRow = () =>
      tab.evaluate((el) => {
        const r = el.getBoundingClientRect();
        const area = el.closest('nav')!.parentElement!.getBoundingClientRect();
        return r.left >= area.left && r.right <= Math.min(area.right, window.innerWidth);
      });
    expect(await shownInRow()).toBe(false);

    const box = (await nav.boundingBox())!;
    await page.mouse.move(box.x + 200, box.y + box.height / 2);
    for (let i = 0; i < 12 && !(await shownInRow()); i++) {
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(100);
    }
    expect(await shownInRow()).toBe(true);
    await tab.click();
    await expect(page).toHaveURL(/\/studio\/motion-director/, { timeout: 30_000 });
  });

  test('opening a studio scrolls its tab into view', async ({ page }) => {
    await installStudioSession(page);
    await page.goto(`${BASE_URL}/studio/motion-director`);
    const tab = page.locator('header nav').first().getByRole('button', { name: 'Motion Director', exact: true });
    await expect(tab).toBeInViewport({ timeout: 120_000 });
  });
});
