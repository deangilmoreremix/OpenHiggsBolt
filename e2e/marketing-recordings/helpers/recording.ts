import {
  type Locator,
  type Page,
  type Request,
  type Route,
} from '@playwright/test';
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
    await closeButton.click({ timeout: 1_000 }).catch(() => {});
    await waitForDemoBeat(page, 300);
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
    /\/api\/proxy\/openai-/i,
    /\/api\/stripe\/checkout/i,
    /\/api\/checkout/i,
    /\/api\/purchase/i,
    /\/api\/social\/publish/i,
    /api\.muapi\.ai/i,
    /api\.openai\.com/i,
  ];
}

function forbiddenRequestReason(
  request: Request,
  forbiddenPatterns: RegExp[]
): string | null {
  const url = request.url();
  const method = request.method().toUpperCase();

  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const path = parsed.pathname;

  // Cost estimation is read-only even though it uses POST.
  if (
    method === 'POST' &&
    /^\/api\/(?:api\/)?v1\/models\/[^/]+\/estimate-cost\/?$/i.test(path)
  ) {
    return null;
  }

  // Personalization's deterministic demo discovery is safe only in test mode.
  if (
    method === 'POST' &&
    path === '/api/personalization/discover-assets'
  ) {
    try {
      const body = JSON.parse(request.postData() || '{}') as { testMode?: unknown };
      if (body.testMode === true) {
        return null;
      }
    } catch {
      // Fall through and block malformed/non-test discovery mutations.
    }
  }

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(url)) {
      return `matched ${pattern.source}`;
    }
  }

  if (/^\/api\/(?:api\/)?v1\//i.test(path)) {
    return 'MuAPI mutation route';
  }
  if (/^\/api\/workflow(?:\/|$)/i.test(path)) {
    return 'workflow mutation route';
  }
  if (/^\/api\/agents(?:\/|$)/i.test(path)) {
    return 'agent mutation route';
  }
  if (/^\/api\/personalization(?:\/|$)/i.test(path)) {
    return 'personalization mutation route';
  }
  if (/^\/api\/(?:stripe\/checkout|checkout|purchase)(?:\/|$)/i.test(path)) {
    return 'checkout or purchase route';
  }
  if (/^\/api\/proxy\/openai-/i.test(path)) {
    return 'OpenAI proxy mutation route';
  }
  if (/^\/api\/social(?:\/|$)/i.test(path)) {
    return 'social publishing mutation route';
  }

  return null;
}

export interface ForbiddenRequestGuard {
  assertClean(): void;
  dispose(): Promise<void>;
}

export async function installForbiddenRequestGuard(
  page: Page,
  forbiddenPatterns: RegExp[]
): Promise<ForbiddenRequestGuard> {
  const violations: string[] = [];

  const handler = async (route: Route): Promise<void> => {
    const request = route.request();
    const reason = forbiddenRequestReason(request, forbiddenPatterns);

    if (reason) {
      violations.push(
        `${request.method()} ${request.url()} (${reason})`
      );
      await route.abort('blockedbyclient').catch(() => {});
      return;
    }

    await route.continue().catch(() => {});
  };

  const routeMatcher = /(?:\/api\/|api\.openai\.com|api\.muapi\.ai)/i;
  await page.route(routeMatcher, handler);

  return {
    assertClean() {
      if (violations.length > 0) {
        throw new Error(
          `Forbidden request(s) blocked during recording:\n${violations.join('\n')}`
        );
      }
    },
    async dispose() {
      await page.unroute(routeMatcher, handler).catch(() => {});
    },
  };
}
