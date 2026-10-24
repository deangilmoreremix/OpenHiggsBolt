/**
 * Motion Studio — regression checks.
 *
 * The three checks keep their original intent (the studio loads as a
 * standalone workspace, the template deep link resolves, the Motion Studio tab
 * stays selected and no Personalization modal opens) but they now assert the
 * real workbench instead of just the URL:
 *
 *   - the standalone editor really mounts (`.ms-root` + the workbench
 *     `.topbar` with the "Motion Studio" logo, the library grid, the timeline
 *     and a mounted Remotion player);
 *   - the Motion Studio tab of the studio header is the SELECTED one (it owns
 *     the selection underline, its siblings do not);
 *   - no Personalization modal (any of its three known shapes) is open.
 *
 * Auth is the offline dev-only `__e2e_auth_bypass` cookie, installed the same
 * way as the other Motion Studio specs (see e2e/helpers/motion-studio.ts).
 * Without it `/studio/*` 307-redirects to `/sign-in`, the page renders empty
 * and these checks fail on a blank screen.
 */
import { test, expect, type Page } from '@playwright/test';
import {
  BASE_URL,
  installStudioSession,
  assertNoOnboardingModal,
} from './helpers/motion-studio';

/** The Motion Studio tab of the SmartVideo GO studio header. */
const motionStudioTab = (page: Page) =>
  page.locator('header nav').getByRole('button', { name: 'Motion Studio', exact: true });

/** Open the Motion Studio editor (entry-seen is seeded so /new is skipped). */
async function openEditor(page: Page, url = '/studio/motion-studio'): Promise<void> {
  await installStudioSession(page, { entrySeen: true });
  await page.goto(`${BASE_URL}${url}`, { waitUntil: 'load' });
  await expect(page.locator('.ms-root')).toBeVisible({ timeout: 120_000 });
  await assertNoOnboardingModal(page);
}

test.describe('Motion Studio regression', () => {
  // The dev server compiles ~150 Remotion cards on the first hit; give every
  // check room without pretending the global 15-minute timeout applies.
  test.beforeEach(() => {
    test.setTimeout(300_000);
  });

  test('Motion Studio loads as standalone workspace', async ({ page }) => {
    await openEditor(page);

    // Check that we're on Motion Studio route
    expect(page.url()).toContain('/studio/motion-studio');
    await expect(page).toHaveURL(/.*motion-studio/);

    // Motion Studio renders its own workspace — not the image studio, not a
    // sign-in redirect. The standalone editor owns the whole viewport.
    await expect(page.locator('.topbar .logo')).toHaveText(/Motion\s*Studio/);
    await expect(page.locator('.project-name')).toBeVisible();
    await expect(page.locator('.library-grid')).toBeVisible({ timeout: 120_000 });
    await expect(page.locator('.library-grid [data-recipe-card]').first()).toBeVisible({
      timeout: 120_000,
    });
    await expect(page.locator('.timeline')).toBeVisible({ timeout: 120_000 });
    await expect(page.locator('.inspector')).toBeVisible({ timeout: 120_000 });
    await expect(page.locator('.preview-stage .__remotion-player')).toHaveCount(1);
  });

  test('Motion Studio deep link with template works', async ({ page }) => {
    await openEditor(page, '/studio/motion-studio?template=motion-studio|BasicText');

    // The route is the Motion Studio route and the template survived the
    // round-trip. `|` is percent-encoded to `%7C` in the query, so the
    // assertion decodes the parameter instead of matching raw URL text.
    expect(new URL(page.url()).pathname).toBe('/studio/motion-studio');
    expect(new URL(page.url()).searchParams.get('template')).toBe('motion-studio|BasicText');
    expect(page.url()).toContain('motion-studio');
    expect(page.url()).toContain('BasicText');

    // The deep link boots the editor instead of bouncing to a sign-in page.
    await expect(page.locator('.topbar .logo')).toHaveText(/Motion\s*Studio/);
    await expect(page.locator('.preview-stage')).toBeVisible({ timeout: 120_000 });
  });

  test('Motion Studio tab remains selected and no personalization modal', async ({ page }) => {
    await openEditor(page);

    // Check URL is motion-studio, not a modal
    expect(page.url()).toContain('/studio/motion-studio');

    // The Motion Studio tab of the studio header is the selected one: it owns
    // the selection underline, its siblings do not.
    const tab = motionStudioTab(page);
    await expect(tab).toBeVisible();
    await expect(tab.locator('.bg-gradient-to-r')).toHaveCount(1);
    await expect(
      page.locator('header nav').getByRole('button', { name: 'Image Studio', exact: true })
        .locator('.bg-gradient-to-r'),
    ).toHaveCount(0);

    // Ensure no personalization modal is opened
    const modal = page.locator('[role="dialog"], .personalization-modal, #personalization-modal');
    await expect(modal).toHaveCount(0);
  });
});
