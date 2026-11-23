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
  // Created WITHOUT AI (no key, no director call): the storyboard comes from a mocked capture of a site, so shots that need the site's pictures
  // and words are chosen and kept by the storyboard gate. Only the capture is mocked here; the director route is never called.
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR42mP4z8AAAAMBAQBZ8vGWAAAAAElFTkSuQmCC', 'base64');
  await page.route('https://captures.example.com/**', (route) => route.fulfill({ status: 200, contentType: 'image/png', body: png }));
  await page.route('**/api/motion-studio/capture', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        url: 'https://acme.example.com/', title: 'Acme',
        page: { url: 'https://captures.example.com/page.png', width: 3840, height: 3492 },
        crops: ['https://captures.example.com/crop-1.png', 'https://captures.example.com/crop-2.png', 'https://captures.example.com/crop-3.png'],
        content: { headline: 'Ship faster with Acme', description: 'Every release counts.', headings: ['Plan', 'Ship', 'Learn'], ctas: ['Start free'], nav: ['Product', 'Pricing'] },
        brand: { background: '#111111', text: '#fafafa', accent: '#ec008c', fontFamily: 'Inter' },
        transient: false,
      }),
    }),
  );
  await page.goto(`${BASE_URL}/studio/motion-director/new`);
  await expect(page.locator('.ms-root')).toBeVisible({ timeout: 120_000 });
  await assertNoOnboardingModal(page);
  await page.getByPlaceholder('Describe your motion video...').fill('A 20-second launch film for https://acme.example.com');
  await page.getByRole('button', { name: 'Generate' }).click();
  await page.getByTestId('create-without-ai').click({ timeout: 60_000 });
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
    await page.waitForTimeout(2000);
    const demo = ((await savedProject(page)).tracks ?? []).flatMap((t: any) => t.clips).find((c: any) => String(c.cardId).startsWith('demo:'));
    expect(demo, 'the film has a ShotCraft shot').toBeTruthy();
    const demoId = demo.cardId as string;
    // The first ShotCraft shot on the Shots lane (after the title card).
    await page.locator('.tl-lane').nth(names.map((n) => n.trim()).indexOf('Shots')).locator('.clip').nth(1).click();
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
        const c = await shotClip(page, demoId);
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
