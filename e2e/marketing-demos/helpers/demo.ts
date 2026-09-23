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
  await page.waitForTimeout(200);

  // Try to dismiss the known first-login API-key overlay through its actual
  // close control before falling back to JS hiding.
  const apiKeyOverlayClose = page.locator('button[aria-label="Close"]').first();
  if (await apiKeyOverlayClose.count() > 0) {
    try {
      await apiKeyOverlayClose.click({ timeout: 1_000 }).catch(() => {});
      await page.waitForTimeout(300);
    } catch {
      // ignore
    }
  }

  // If the known overlay is still present, hide only that specific overlay.
  // Do NOT blanket-hide every dialog; the personalization demo depends on its
  // real dialog remaining intact.
  const overlayStillPresent = await page.locator('.fixed.inset-0.z-\\[200\\]').count();
  if (overlayStillPresent > 0) {
    await page.evaluate(() => {
      const overlay = document.querySelector('.fixed.inset-0.z-\\[200\\]');
      if (overlay) {
        (overlay as HTMLElement).style.display = 'none';
      }
    });
    await page.waitForTimeout(200);
  }

  // Dismiss again in case a new overlay appeared after the first dismissal.
  await page.keyboard.press('Escape');
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
