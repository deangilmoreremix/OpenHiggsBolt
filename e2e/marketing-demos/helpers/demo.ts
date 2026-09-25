import { type Page, type Locator } from '@playwright/test';
import { resolveDemoBaseURL } from '../../../playwright.shared';

export const DEMO_BASE_URL = resolveDemoBaseURL();

export async function gotoStudio(page: Page): Promise<void> {
  await page.goto(`${DEMO_BASE_URL}/studio`);
  await page.waitForURL((url) => url.pathname.includes('/studio'), {
    timeout: 30_000,
  });
}

export async function waitForNoBlockingOverlay(page: Page): Promise<void> {
  const maxAttempts = 6;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const overlayCount = await page.locator('.fixed.inset-0.z-\\[200\\]').count();
    if (overlayCount === 0) {
      await page.waitForTimeout(100);
      return;
    }

    const closeButton = page.locator('button[aria-label="Close"]').first();
    if (await closeButton.count() > 0) {
      try {
        await closeButton.click({ timeout: 1_000 });
        await page.waitForTimeout(400);
        continue;
      } catch {
        // ignore and fall through to JS hide
      }
    }

    await page.evaluate(() => {
      const overlay = document.querySelector('.fixed.inset-0.z-\\[200\\]');
      if (overlay) {
        (overlay as HTMLElement).style.display = 'none';
      }
    });
    await page.waitForTimeout(300);
  }

  await page.waitForTimeout(200);
}

export async function dismissModals(page: Page): Promise<void> {
  await waitForNoBlockingOverlay(page);
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

  // Dismiss any modal that might intercept the click.
  await dismissModals(page);

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
