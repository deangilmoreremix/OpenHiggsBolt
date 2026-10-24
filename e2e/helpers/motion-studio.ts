/**
 * Shared helpers for the Motion Studio evidence + acceptance specs.
 *
 * Everything here is deterministic and offline:
 *  - auth is bypassed with the dev-only `__e2e_auth_bypass` cookie (the
 *    `/api/dev-login` route answers with a 307 that hangs Playwright, so the
 *    cookie is injected directly through the browser context);
 *  - the "Welcome to SmartVideo GO" onboarding modal is suppressed through the
 *    API-key-present check in `components/StandaloneShell.js:266`
 *    (`if (hasApiKey && hasOpenAiKey) return;`) — `useAuthConfig` restores both
 *    keys from `localStorage` on module load, so seeding `muapi_key` and
 *    `openai_key` means the modal is never rendered. No product code changes
 *    and no real credential is used;
 *  - every outbound host that could bill an account (muapi.ai, openai.com) is
 *    aborted at the network layer, so a run can never spend money.
 */
import { expect, type Page } from '@playwright/test';

/** Target under test. Override with MS_BASE_URL to run the same specs against a deployed preview. */
export const BASE_URL = process.env.MS_BASE_URL ?? 'http://127.0.0.1:3100';

/** Motion Studio's internal router switches /new → / once this flag is set. */
export const ENTRY_SEEN_KEY = 'motion-studio:entry-seen-v1';

/** Workbench panel widths (see `usePanelSize` in `src/apps/motion-studio/App.tsx`). */
export const LIB_PANEL_WIDTH_KEY = 'wb-lib-w';
export const INSPECTOR_WIDTH_KEY = 'wb-insp-w';
export const TIMELINE_HEIGHT_KEY = 'wb-tl-h';

/** Session store key (see `src/apps/motion-studio/store.ts`). */
export const SESSIONS_STORAGE_KEY = 'shotcraft-motion-sessions-v1';

/** Placeholder of the entry page prompt textarea. */
export const ENTRY_PROMPT_PLACEHOLDER = 'Describe your motion video...';

/** Label of the entry page generate button (upstream `PromptAction`). */
export const GENERATE_LABEL = 'Generate';

/** Label of the workbench export button. */
export const EXPORT_LABEL = 'Export video';

const DUMMY_MUAPI_KEY = 'e2e-dummy-muapi-key-000000';
const DUMMY_OPENAI_KEY = 'e2e-dummy-openai-key-000000';

export interface StudioSeed {
  /** Seed the entry-seen flag so the workbench route renders instead of /new. */
  entrySeen?: boolean;
  /** Library panel width in px. */
  libWidth?: number;
  /** Inspector panel width in px. */
  inspectorWidth?: number;
  /** Timeline height in px. */
  timelineHeight?: number;
  /** Extra raw localStorage entries. */
  extra?: Record<string, string>;
}

/**
 * Install the offline test session: bypass cookie + blocked billing hosts +
 * a localStorage seed applied before any page script runs.
 */
export async function installStudioSession(page: Page, seed: StudioSeed = {}): Promise<void> {
  // The bypass cookie MUST be readable from `document.cookie`: the entry page
  // detects it with `document.cookie.includes('__e2e_auth_bypass=1')`
  // (src/apps/motion-studio/pages/MotionStudioEntry.tsx:135-136). An httpOnly
  // cookie (what /api/dev-login sets) is invisible there, so requireEntitlement
  // fires and the upgrade modal blocks the transition into the editor.
  await page.context().addCookies([
    { name: '__e2e_auth_bypass', value: '1', domain: '127.0.0.1', path: '/' },
    // MS_OFFLINE_CLERK=1: the dev server runs with a placeholder Clerk dev key
    // and no Clerk network access. Clerk's middleware would answer every
    // document request with a handshake redirect to the (unreachable) dev
    // instance; a signed-out marker plus a dev-browser token skips it.
    ...(process.env.MS_OFFLINE_CLERK === '1'
      ? [
          { name: '__client_uat', value: '0', domain: '127.0.0.1', path: '/' },
          { name: '__clerk_db_jwt', value: 'dvb_e2e', domain: '127.0.0.1', path: '/' },
        ]
      : []),
  ]);

  // Hard guarantee that nothing in the run can reach a paid endpoint.
  await page.route('**://*.muapi.ai/**', (route) => route.abort());
  await page.route('**://api.openai.com/**', (route) => route.abort());

  // The host polls the account balance every 30s (components/StandaloneShell.js:433).
  // The dummy key makes the proxy answer 401, and the shell turns a 401 into the
  // Settings modal (StandaloneShell.js:466) which then blocks the whole UI.
  // Answer the poll deterministically instead.
  await page.route('**/api/v1/account/balance', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ balance: 0 }),
    }),
  );

  const entries: Record<string, string> = {
    // Presence of both keys short-circuits the onboarding modal in
    // StandaloneShell.js:266 — the modal is never rendered.
    muapi_key: DUMMY_MUAPI_KEY,
    openai_key: DUMMY_OPENAI_KEY,
    ...(seed.extra ?? {}),
  };
  if (seed.entrySeen) entries[ENTRY_SEEN_KEY] = '1';
  else entries[ENTRY_SEEN_KEY] = '';
  if (seed.libWidth !== undefined) entries[LIB_PANEL_WIDTH_KEY] = String(seed.libWidth);
  if (seed.inspectorWidth !== undefined) entries[INSPECTOR_WIDTH_KEY] = String(seed.inspectorWidth);
  if (seed.timelineHeight !== undefined) entries[TIMELINE_HEIGHT_KEY] = String(seed.timelineHeight);

  await page.addInitScript((values: Record<string, string>) => {
    for (const [key, value] of Object.entries(values)) {
      try {
        if (value === '') window.localStorage.removeItem(key);
        else window.localStorage.setItem(key, value);
      } catch {
        /* storage disabled */
      }
    }
  }, entries);
}

/**
 * Belt-and-braces dismissal: if the onboarding modal ever renders anyway
 * (e.g. a future change to the key-presence check), close it and prove it is
 * gone before any evidence is captured. The host Settings modal (opened by a
 * 401 from the balance poll) uses a "Close" button as well, so it is closed
 * by the same loop.
 */
export async function assertNoOnboardingModal(page: Page): Promise<void> {
  const closeButton = page.getByRole('button', { name: /^Close$/ });
  for (let attempt = 0; attempt < 5; attempt += 1) {
    if ((await closeButton.count()) === 0) break;
    await closeButton.first().click({ force: true }).catch(() => undefined);
    await page.waitForTimeout(400);
  }
  await expect(
    page.getByText('Welcome to SmartVideo GO', { exact: false }),
    'onboarding modal must not be visible in evidence captures',
  ).toHaveCount(0);
  await expect(
    page.locator('.fixed.inset-0.bg-black\\/60'),
    'no full-screen host overlay may block the captured UI',
  ).toHaveCount(0);
}

/** Wait until the Motion Studio shell has mounted its workbench. */
export async function waitForWorkbench(page: Page): Promise<void> {
  await expect(page.locator('.ms-root')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('.topbar')).toBeVisible({ timeout: 60_000 });
}

/** Wait until the Motion Studio entry page (the /new internal route) renders. */
export async function waitForEntryPage(page: Page): Promise<void> {
  await expect(page.locator('.ms-root')).toBeVisible({ timeout: 60_000 });
  await expect(
    page.getByPlaceholder(ENTRY_PROMPT_PLACEHOLDER),
  ).toBeVisible({ timeout: 60_000 });
}

/**
 * Save a screenshot and assert it is a real (non-blank) image.
 * A blank page compresses to a few KB; the evidence must stay well above that.
 */
export async function captureEvidence(
  page: Page,
  path: string,
  options: { fullPage?: boolean; minBytes?: number } = {},
): Promise<number> {
  const minBytes = options.minBytes ?? 40 * 1024;
  await page.screenshot({ path, fullPage: options.fullPage ?? false });
  const { size } = await import('node:fs/promises').then((m) => m.stat(path));
  expect(
    size,
    `${path} is only ${size} bytes — the capture looks blank`,
  ).toBeGreaterThan(minBytes);
  return size;
}
