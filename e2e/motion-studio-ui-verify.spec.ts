/**
 * Motion Studio — UI verification checks.
 *
 * The six checks below keep their original intent (tab in the header, tab
 * navigation, no Personalization dialog, template deep link, recipe content,
 * timeline/preview) but they now assert REAL Motion Studio elements instead of
 * a generic /recipe|card|category/ text match:
 *
 *   - the studio header nav really carries a "Motion Studio" tab next to the
 *     other studio tabs (so it is the real shell, not a stub);
 *   - the Motion Studio workbench really mounts (`.ms-root` + the workbench
 *     `.topbar` with the "Motion Studio" logo);
 *   - the library really holds recipe cards (`[data-recipe-card]`) with a
 *     title and a category chip;
 *   - the editor really has a timeline, an inspector, a preview stage and a
 *     mounted Remotion player.
 *
 * Auth is the offline dev-only `__e2e_auth_bypass` cookie, installed exactly
 * like the other Motion Studio specs do (see e2e/helpers/motion-studio.ts).
 * Without it `/studio/*` 307-redirects to `/sign-in` and the page renders
 * empty, so every check would fail on a blank screen.
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

test.describe('Motion Studio UI verification', () => {
  // The dev server compiles ~150 Remotion cards on the first hit; give every
  // check room without pretending the global 15-minute timeout applies.
  test.beforeEach(() => {
    test.setTimeout(300_000);
  });

  // Check 1: Tab "Motion Studio" visible in the studio header.
  test('CHECK 1: Motion Studio tab is visible in the studio header', async ({ page }) => {
    await installStudioSession(page, { entrySeen: true });
    await page.goto(`${BASE_URL}/studio`, { waitUntil: 'load' });

    // The shell must not have bounced us to the sign-in page.
    await expect(page).toHaveURL(/\/studio$/);

    // The real studio header renders the whole tab rail.
    const nav = page.locator('header nav');
    await expect(nav).toBeVisible({ timeout: 120_000 });

    const tab = motionStudioTab(page);
    await expect(tab).toBeVisible();
    await expect(tab).toHaveCount(1);

    // It is a genuine tab of the studio rail, sitting between its siblings.
    await expect(nav.getByRole('button', { name: 'Image Studio', exact: true })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Video Studio', exact: true })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Motion Studio', exact: true })).toBeVisible();

    // The tab carries the studio label text (not an icon-only button).
    await expect(tab).toHaveText(/Motion Studio/);
  });

  // Check 2: Clicking the tab navigates to /studio/motion-studio only.
  test('CHECK 2: clicking Motion Studio tab navigates to /studio/motion-studio', async ({
    page,
  }) => {
    await installStudioSession(page, { entrySeen: true });
    await page.goto(`${BASE_URL}/studio`, { waitUntil: 'load' });
    await expect(page).toHaveURL(/\/studio$/);

    const tabBtn = motionStudioTab(page);
    await expect(tabBtn).toBeVisible();
    await tabBtn.click();
    await page.waitForURL(/\/studio\/motion-studio/, { timeout: 120_000 });

    const url = page.url();
    const targets = url.match(/\/studio\/motion-studio/i);
    const offImage = !url.toLowerCase().includes('image');
    const offPersonalization = !url.toLowerCase().includes('personalization');
    expect(Array.isArray(targets) && targets.length > 0, `unexpected url ${url}`).toBe(true);
    expect(offImage, `must not land on the image studio: ${url}`).toBe(true);
    expect(offPersonalization, `must not land on personalization: ${url}`).toBe(true);

    // The navigation really opened Motion Studio (not a blank redirect).
    await expect(page.locator('.ms-root')).toBeVisible({ timeout: 120_000 });
    await expect(page.locator('.topbar .logo')).toHaveText(/Motion\s*Studio/);
  });

  // Check 3: No [role="dialog"] carrying a Personalization label leaks in.
  test('CHECK 3: no Personalization dialog appears on Motion Studio route', async ({ page }) => {
    await openEditor(page);

    const dialogs = await page.locator('[role="dialog"]').count();
    const personalizingDialogs = await page
      .locator('[role="dialog"][aria-label*="Personalization"]')
      .count();
    expect(personalizingDialogs, 'a Personalization dialog leaked into Motion Studio').toBe(0);

    // The other Personalization modal shapes must not be there either.
    await expect(
      page.locator('.personalization-modal, #personalization-modal'),
    ).toHaveCount(0);

    // The zero-dialog result must come from a real editor, not an empty page.
    await expect(page.locator('.topbar')).toBeVisible({ timeout: 120_000 });
    await expect(page.locator('.library-grid')).toBeVisible({ timeout: 120_000 });

    console.log('CHECK RESULT: no-personalization-dialog', 'PASS', {
      totalDialogs: dialogs,
      personalizingDialogs,
    });
  });

  // Check 4: Deep link ?template=motion-studio|BasicText resolves (URL contains BasicText).
  test('CHECK 4: deep link ?template=motion-studio|BasicText loads with BasicText in URL', async ({
    page,
  }) => {
    await openEditor(page, '/studio/motion-studio?template=motion-studio|BasicText');

    // The route is the Motion Studio route and the template survived the
    // round-trip. `|` is percent-encoded to `%7C` in the query, so the
    // assertion decodes the parameter instead of matching raw URL text.
    expect(new URL(page.url()).pathname).toBe('/studio/motion-studio');
    expect(new URL(page.url()).searchParams.get('template')).toBe('motion-studio|BasicText');
    expect(page.url()).toContain('BasicText');
    expect(page.url()).toContain('motion-studio');

    // The deep link still boots the editor instead of a redirect target.
    await expect(page.locator('.topbar')).toBeVisible({ timeout: 120_000 });
    await expect(page.locator('.preview-stage')).toBeVisible({ timeout: 120_000 });
  });

  // Check 5: the recipe library really renders recipe cards with titles + categories.
  test('CHECK 5: recipe cards with title and category render on the Motion Studio workspace', async ({
    page,
  }) => {
    await openEditor(page);

    const cards = page.locator('.library-grid [data-recipe-card]');
    await expect(cards.first()).toBeVisible({ timeout: 120_000 });
    const cardCount = await cards.count();
    expect(cardCount, 'the library grid must hold the recipe catalog').toBeGreaterThan(50);

    // Every visible card carries a non-empty recipe title (h3) …
    const firstCard = cards.first();
    const title = firstCard.locator('h3');
    await expect(title).toBeVisible();
    expect((await title.innerText()).trim().length).toBeGreaterThan(0);

    // … and the category chip of the card.
    const categoryChip = firstCard.locator('span.uppercase').first();
    await expect(categoryChip).toBeVisible();
    expect((await categoryChip.innerText()).trim().length).toBeGreaterThan(0);

    // The library really is a recipe browser: its three tabs and the category
    // filter rail are present, and the "All" chip counts the active source.
    await expect(page.getByRole('button', { name: 'Templates', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Community', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'My Motion Recipes', exact: true })).toBeVisible();

    const allChip = page.locator('.library-categories button').filter({ hasText: 'All' });
    await expect(allChip).toBeVisible();
    const allText = (await allChip.innerText()).replace(/\s+/g, ' ').trim();
    expect(allText, `unexpected "All" chip: ${allText}`).toMatch(/^All \d+$/);
    expect(Number(allText.replace('All ', ''))).toBe(cardCount);

    console.log('CHECK RESULT: recipe-cards', 'PASS', {
      cardCount,
      firstTitle: (await title.innerText()).trim(),
      firstCategory: (await categoryChip.innerText()).trim(),
    });
  });

  // Check 6: the editor really has a timeline and a Remotion preview player.
  test('CHECK 6: timeline, inspector and Remotion player are mounted', async ({ page }) => {
    await openEditor(page);

    // The timeline (transport + tracks) …
    await expect(page.locator('.timeline')).toBeVisible({ timeout: 120_000 });
    await expect(page.locator('.timeline .ruler')).toBeVisible();

    // … the inspector …
    await expect(page.locator('.inspector')).toBeVisible({ timeout: 120_000 });
    await expect(page.getByTestId('inspector-tab-props')).toBeVisible();

    // … and the preview stage with a real Remotion <Player> inside it.
    await expect(page.locator('.preview-stage')).toBeVisible({ timeout: 120_000 });
    const player = page.locator('.preview-stage .__remotion-player');
    await expect(player).toHaveCount(1);
    await expect(player).toBeVisible();

    // The transport controls belong to the same workbench.
    await expect(page.locator('.btn-play')).toBeVisible();
    await expect(page.locator('.timecode')).toHaveText(/00:00\.00/);

    console.log('CHECK RESULT: timeline-player', 'PASS', {
      timeline: await page.locator('.timeline').count(),
      inspector: await page.locator('.inspector').count(),
      remotionPlayers: await page.locator('.preview-stage .__remotion-player').count(),
    });
  });
});
