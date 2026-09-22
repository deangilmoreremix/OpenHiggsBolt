import { type Page, type Locator } from '@playwright/test';
import { resolveDemoBaseURL } from '../../../playwright.shared';

export const DEMO_BASE_URL = resolveDemoBaseURL();

export async function gotoStudio(page: Page): Promise<void> {
  await page.goto(`${DEMO_BASE_URL}/studio`);
  await page.waitForURL((url) => url.pathname.includes('/studio'), {
    timeout: 30_000,
  });
}

export async function dismissModals(page: Page): Promise<void> {
  // Try Escape first in case the modal listens for it.
  await page.keyboard.press('Escape');

  // Force-hide any remaining full-screen overlays via JS.
  await page.evaluate(() => {
    document.querySelectorAll('[style*="z-[200]"], .fixed.inset-0').forEach((el) => {
      (el as HTMLElement).style.display = 'none';
    });
    document.querySelectorAll('[role="dialog"], [aria-modal="true"]').forEach((el) => {
      (el as HTMLElement).style.display = 'none';
    });
  });

  // Allow any transition/animation to settle.
  await page.waitForTimeout(200);
}

export async function openTab(page: Page, label: string): Promise<Locator> {
  const tab = page
    .getByRole('button', { name: label })
    .first();

  // Scroll the nearest horizontal scroll container so the tab is visible.
  await page.evaluate((tabLabel) => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const target = buttons.find((btn) => (btn.textContent || '').includes(tabLabel));
    if (target) {
      target.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'center' });
    }
  }, label);

  await tab.waitFor({ state: 'visible', timeout: 15_000 });
  return tab;
}

export async function assertRoute(page: Page, pathnameMatcher: string | RegExp): Promise<void> {
  await page.waitForURL((url) => {
    if (typeof pathnameMatcher === 'string') {
      return url.pathname.includes(pathnameMatcher);
    }
    return pathnameMatcher.test(url.pathname);
  }, { timeout: 30_000 });
}
