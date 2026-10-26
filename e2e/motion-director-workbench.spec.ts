import { test, expect, type Page } from '@playwright/test';
import { BASE_URL, answerInkPressOffer, approveFilmAndOpenWorkbench, assertNoOnboardingModal, captureEvidence, installStudioSession } from './helpers/motion-studio';

/**
 * After the AI director delivers a film, the user keeps working in the Motion
 * Workbench editor (the CapCut-style editor of video-shotcraft):
 *
 *   - the film is split into Shots, Transitions, Captions and SFX tracks;
 *   - selecting a shot exposes its copy, font size and colours;
 *   - clips can be moved, trimmed and speed-ramped;
 *   - any library shot can be dragged onto the timeline.
 *
 * Export of a director-built film is covered by
 * `motion-director-director-coverage.spec.ts` ("exports to a real MP4").
 */
const OUT = 'docs/motion-studio-design-replacement';
const PROJECT_KEY = 'motion-director:project-v1';

async function buildFilm(page: Page) {
  await page.route('**/api/motion-studio/director', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        plan: {
          title: 'Workbench film',
          summary: '',
          palette: { background: '#111111', text: '#fafafa', accent: '#ec008c' },
          scenes: [
            { kind: 'title', recipeId: '', durationSec: 2, headline: 'Meet *Acme*', caption: 'Ship faster', transition: 'cut' },
            { kind: 'shot', recipeId: 'effects/impact-feedback/HitCounter', durationSec: 4, headline: 'Every release counts', caption: '', transition: 'flash' },
            { kind: 'shot', recipeId: 'camera/crash-zoom-punch/CrashImpactReal', durationSec: 4, headline: 'Your real product', caption: '', transition: 'cut' },
          ],
        },
      }),
    }),
  );
  await page.goto(`${BASE_URL}/studio/motion-director/new`);
  await expect(page.locator('.ms-root')).toBeVisible({ timeout: 120_000 });
  await assertNoOnboardingModal(page);
  await page.getByPlaceholder('Describe your motion video...').fill('A 10-second launch film for Acme');
  await page.getByRole('button', { name: 'Generate' }).click();
  await answerInkPressOffer(page, 'director');
  await approveFilmAndOpenWorkbench(page);
}

/** The saved project (the store persists it after an 800 ms debounce). */
const savedProject = (page: Page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '{}'), PROJECT_KEY);

const shotClip = async (page: Page, cardId: string) =>
  (await savedProject(page)).tracks?.flatMap((t: any) => t.clips).find((c: any) => c.cardId === cardId) ?? null;

test.describe('Motion Director → Motion Workbench editor', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('a director-built film is fully editable in the workbench', async ({ page }) => {
    test.setTimeout(5 * 60 * 1000);
    await installStudioSession(page);
    await buildFilm(page);

    // Tracks exactly as authored.
    const names = await page.locator('.track-name').allTextContents();
    for (const name of ['Shots', 'Transitions', 'Captions', 'SFX', 'Background']) {
      expect(names.map((n) => n.trim()), `track ${name}`).toContain(name);
    }

    // Select a shot: its copy, font size and colours are editable.
    await page.locator('.clip', { hasText: /Hit Counter|HitCounter/ }).first().click();
    const inspector = page.locator('.inspector');
    const titleRow = inspector.locator('.prop-row', { hasText: 'Title text' });
    await expect(titleRow).toBeVisible({ timeout: 15_000 });
    await expect(inspector.locator('.prop-row', { hasText: 'Title size' })).toBeVisible();
    await expect(inspector.locator('.prop-row', { hasText: 'Title color' })).toBeVisible();
    await titleRow.locator('input').fill('Every release counts');
    await inspector.locator('.prop-row', { hasText: 'Title color' }).locator('input.color-text').fill('#22ccff');

    // Speed-ramp, move and trim.
    await inspector.getByRole('button', { name: '1.5×', exact: true }).click();
    await inspector.locator('.prop-row', { hasText: 'Duration' }).locator('input').fill('3');
    await inspector.locator('.prop-row', { hasText: 'Duration' }).locator('input').press('Enter');
    await inspector.locator('.prop-row', { hasText: 'Start' }).locator('input').fill('2.5');
    await inspector.locator('.prop-row', { hasText: 'Start' }).locator('input').press('Enter');

    await expect
      .poll(async () => {
        const c = await shotClip(page, 'demo:HitCounter');
        return c && { title: c.props.title, color: c.props.titleColor, speed: c.speed, start: c.start, duration: c.duration };
      }, { timeout: 10_000 })
      .toEqual({ title: 'Every release counts', color: '#22ccff', speed: 1.5, start: 75, duration: 90 });

    // Drag a library shot onto the Shots lane.
    await page.getByPlaceholder('Search recipes...').fill('crash zoom');
    const libraryCard = page.locator('[draggable="true"]').first();
    await expect(libraryCard).toBeVisible({ timeout: 30_000 });
    const before = (await savedProject(page)).tracks.flatMap((t: any) => t.clips).length;
    const shotsLane = page.locator('.tl-lane').nth(names.map((n) => n.trim()).indexOf('Shots'));
    await libraryCard.dragTo(shotsLane, { targetPosition: { x: 40, y: 10 } });
    await expect
      .poll(async () => (await savedProject(page)).tracks.flatMap((t: any) => t.clips).length, { timeout: 10_000 })
      .toBe(before + 1);

    await captureEvidence(page, `${OUT}/director-workbench-editing-desktop.png`, { minBytes: 10 * 1024 });
  });
});
