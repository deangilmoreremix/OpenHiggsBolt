import { type Page, type Locator } from '@playwright/test';
import { resolveDemoBaseURL } from '../../../playwright.shared';

export const DEMO_BASE_URL = resolveDemoBaseURL();

export async function waitForDemoBeat(page: Page, ms: number): Promise<void> {
  await page.waitForTimeout(ms);
}

export async function smoothScrollTo(
  page: Page,
  target: Locator
): Promise<void> {
  await target.scrollIntoViewIfNeeded();
  await waitForDemoBeat(page, 100);
}

export async function focusElementForRecording(
  page: Page,
  locator: Locator
): Promise<void> {
  await locator.scrollIntoViewIfNeeded();
  await locator.focus();
  await waitForDemoBeat(page, 150);
}

export async function moveCursorAway(page: Page): Promise<void> {
  await page.mouse.move(0, 0);
  await waitForDemoBeat(page, 100);
}

export async function dismissKnownOnboarding(page: Page): Promise<void> {
  const closeButton = page.locator('button[aria-label="Close"]').first();
  if (await closeButton.count() > 0) {
    try {
      await closeButton.click({ timeout: 1_000 }).catch(() => {});
      await waitForDemoBeat(page, 300);
    } catch {
      // ignore
    }
  }
}

export async function ensureStudioReady(page: Page): Promise<void> {
  await page.waitForURL((url) => url.pathname.includes('/studio'), {
    timeout: 30_000,
  });
  await dismissKnownOnboarding(page);
  await waitForDemoBeat(page, 500);
}

export function buildForbiddenGenerationPatterns(): RegExp[] {
  return [
    /\/api\/.*\/generate/i,
    /\/api\/.*\/create/i,
    /\/api\/.*\/compose/i,
    /\/api\/video\/generation/i,
    /\/api\/image\/generation/i,
    /\/api\/audio\/generation/i,
    /\/api\/marketing\/generation/i,
    /\/api\/workflow\/.*\/run/i,
    /\/api\/checkout/i,
    /\/api\/purchase/i,
    /\/api\/social\/publish/i,
    /muapi\.ai\/access-keys.*\/generate/i,
    /api\.openai\.com\/v1\/images\/generations/i,
    /api\.openai\.com\/v1\/audio\/generations/i,
  ];
}

export async function assertNoForbiddenRequest(
  page: Page,
  forbiddenPatterns: RegExp[]
): Promise<void> {
  page.on('request', (request) => {
    const url = request.url();

    for (const pattern of forbiddenPatterns) {
      if (pattern.test(url)) {
        throw new Error(
          `Forbidden request detected during recording: ${url} matched ${pattern.source}`
        );
      }
    }
  });
}
