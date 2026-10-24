/**
 * G10c — R8 acceptance assertions for Motion Studio.
 *
 *   R8-1  library coverage      → 124 grouped cards / 150 shots / 10 categories
 *   R8-2  card previews         → a real Remotion <Player> per visible card
 *   R8-3  agent round trip      → a chat turn mutates a clip prop, Player re-renders
 *   R8-4  Remotion playback     → the playhead advances while playing
 *
 * Everything is deterministic and offline: the auth bypass is a cookie, the
 * onboarding modal is suppressed through the API-key presence check, and the
 * billing hosts are aborted at the network layer (see e2e/helpers/motion-studio.ts).
 */
import { test, expect, type Page } from '@playwright/test';
import {
  BASE_URL,
  installStudioSession,
  assertNoOnboardingModal,
} from './helpers/motion-studio';

/** Catalog size — see src/data/motionRecipeCatalog.ts. */
const GROUPED_CARDS = 124;
/** Individual shots (the Community tab). */
const SHOTS = 150;
/** MOTION_CATEGORIES. */
const CATEGORY_LABELS = [
  'Opening & Brand',
  'Typography & Title Cards',
  'UI Entrance & Showcase',
  'Camera & Space',
  'Data & Metrics',
  'Interaction & Feature Demo',
  'Transitions',
  'Rhythm & Montage',
  'Light & Emphasis',
  'Outro',
];

async function openWorkbench(page: Page): Promise<void> {
  await installStudioSession(page, { entrySeen: true });
  await page.goto(`${BASE_URL}/studio/motion-studio`, { waitUntil: 'load' });
  await expect(page.locator('.topbar')).toBeVisible({ timeout: 120_000 });
  await expect(page.locator('.timeline')).toBeVisible({ timeout: 120_000 });
  await expect(page.locator('.preview-stage')).toBeVisible({ timeout: 120_000 });
  await assertNoOnboardingModal(page);
}

test.describe('R8 · Motion Studio acceptance', () => {
  test('R8-1: the library exposes 124 grouped cards, 150 shots and 10 categories', async ({
    page,
  }) => {
    await openWorkbench(page);

    // ── Templates tab → the 124 grouped cards ────────────────────────────
    await expect(page.getByRole('button', { name: 'Templates', exact: true })).toBeVisible();
    await expect(page.locator('.library-grid [data-recipe-card]')).toHaveCount(GROUPED_CARDS, {
      timeout: 120_000,
    });

    // The "All" chip carries the size of the active source.
    const allChip = page.locator('.library-categories button').filter({ hasText: 'All' });
    await expect(allChip).toHaveText(`All ${GROUPED_CARDS}`);

    // ── 10 categories, each with its own chip ────────────────────────────
    const chips = page.locator('.library-categories button');
    await expect(chips).toHaveCount(CATEGORY_LABELS.length + 1); // + the "All" chip
    for (const label of CATEGORY_LABELS) {
      await expect(page.locator('.library-categories button').filter({ hasText: label })).toHaveCount(1);
    }

    // ── Community tab → the 150 individual shots ─────────────────────────
    await page.getByRole('button', { name: 'Community', exact: true }).click();
    await expect(page.locator('.library-grid [data-recipe-card]')).toHaveCount(SHOTS, {
      timeout: 120_000,
    });
    await expect(allChip).toHaveText(`All ${SHOTS}`);
  });

  test('R8-2: visible library cards render a real Remotion player (no gradient placeholder)', async ({
    page,
  }) => {
    await openWorkbench(page);

    await expect(page.locator('.library-grid [data-recipe-card]').first()).toBeVisible({
      timeout: 120_000,
    });

    // The library panel scrolls internally; bring the card grid into its
    // viewport so the IntersectionObserver mounts the shot previews.
    await page.evaluate(() => {
      const panel = document.querySelector('.library-panel');
      if (panel) panel.scrollTop = 420;
    });

    const audit = async () =>
      page.evaluate(() => {
        const panel = document.querySelector('.library-panel');
        const pr = panel?.getBoundingClientRect();
        const cards = [...document.querySelectorAll('[data-recipe-card]')] as HTMLElement[];
        const onScreen = pr
          ? cards.filter((el) => {
              const r = el.getBoundingClientRect();
              return (
                r.width > 0 &&
                r.height > 0 &&
                r.bottom > pr.top &&
                r.top < pr.bottom &&
                r.right > pr.left &&
                r.left < pr.right
              );
            })
          : [];
        return {
          onScreen: onScreen.length,
          withPlayer: onScreen.filter((el) => el.querySelector('.__remotion-player')).length,
          pendingThumb: onScreen.filter((el) =>
            el.querySelector('[data-recipe-thumb="pending"]'),
          ).length,
          sized: onScreen.filter((el) => el.getBoundingClientRect().width > 10).length,
        };
      });

    await expect
      .poll(async () => (await audit()).withPlayer > 0, { timeout: 60_000 })
      .toBe(true);

    const result = await audit();
    console.log('R8-2 card audit', JSON.stringify(result));
    expect(result.onScreen).toBeGreaterThanOrEqual(3);
    // every on-screen card mounts a real <Player>
    expect(result.withPlayer).toBe(result.onScreen);
    // and none of them is a "pending"/gradient placeholder
    expect(result.pendingThumb).toBe(0);
    // the cards are actually laid out (not collapsed slivers)
    expect(result.sized).toBe(result.onScreen);

    // The players are Remotion players, not <video> placeholders.
    const player = page.locator('.library-grid [data-recipe-card] .__remotion-player').first();
    await expect(player).toBeVisible();
  });

  test('R8-3: an agent turn mutates a clip prop and the Player re-renders', async ({ page }) => {
    await openWorkbench(page);

    await page.getByTestId('topbar-agent-toggle').click();
    await expect(page.getByTestId('studio-rail')).toBeVisible();
    await expect(page.getByTestId('rail-tab-agent')).toHaveAttribute('aria-selected', 'true');

    // Select the Ink Press caption clip on the timeline.
    const titleClip = page.locator('.clip', { hasText: 'Ink Press' }).first();
    await expect(titleClip).toBeVisible();
    await titleClip.click();

    const fontSizeValue = page
      .locator('.prop-row', { hasText: 'Font size' })
      .locator('.slider-val');
    await expect(fontSizeValue).toHaveText('116px');

    // The Player renders the very value the inspector shows.
    await expect
      .poll(async () => (await page.locator('.preview-stage').innerHTML()).includes('font-size: 116px'), {
        timeout: 60_000,
      })
      .toBe(true);

    // One chat turn → the clip prop changes.
    const agentInput = page.getByPlaceholder(/Tell the agent/);
    await agentInput.fill('make the text bigger');
    await agentInput.press('Enter');
    await expect(page.getByText(/Set the text size on/)).toBeVisible({ timeout: 60_000 });

    await expect(fontSizeValue).toHaveText('137px');
    await expect
      .poll(async () => (await page.locator('.preview-stage').innerHTML()).includes('font-size: 137px'), {
        timeout: 60_000,
      })
      .toBe(true);

    // The prop change is persisted in the store (the store debounces the
    // localStorage write by 800ms — see src/apps/motion-studio/store.ts:478).
    await expect
      .poll(
        async () =>
          (await page.evaluate(() =>
            localStorage.getItem('shotcraft-workbench-project-v1'),
          )) ?? '',
        { timeout: 30_000 },
      )
      .toContain('fontSize');
  });

  test('R8-4: Remotion playback advances the playhead', async ({ page }) => {
    await openWorkbench(page);

    const timecode = page.locator('.timecode');
    await expect(timecode).toBeVisible();
    const before = await timecode.innerText();
    expect(before).toMatch(/00:00\.00/);

    const playheadLeft = () =>
      page.evaluate(() => document.querySelector('.playhead')?.getAttribute('style') ?? '');

    const leftBefore = await playheadLeft();

    await page.locator('.btn-play').click();

    await expect
      .poll(async () => (await timecode.innerText()) !== before, { timeout: 30_000 })
      .toBe(true);
    const after = await timecode.innerText();
    console.log('R8-4 timecode', before, '->', after);

    // The playhead moved on the timeline as well.
    await expect.poll(async () => (await playheadLeft()) !== leftBefore, { timeout: 30_000 }).toBe(
      true,
    );
  });
});
