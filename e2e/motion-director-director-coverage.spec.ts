import { test, expect, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { promises as fs, readFileSync } from 'node:fs';
import { BASE_URL, assertNoOnboardingModal, installStudioSession } from './helpers/motion-studio';

/**
 * Director-built films across the whole ShotCraft library.
 *
 * 1. Every catalog shot (all 150) goes through the real flow — storyboard →
 *    Approve → film — in films of up to 14 scenes, and every shot is rendered
 *    in the Workbench preview with no page error.
 * 2. A director-built film (title cards, product-page shots showing the
 *    capture, captions, a flash cut) exports to a real MP4.
 *
 * Capture/director responses are mocked at the network layer (no public site
 * or OpenAI key here); the plan contents are real catalog ids.
 */
const OUT = 'docs/motion-studio-design-replacement';
const MP4_PATH = `${OUT}/director-film.mp4`;
const META_PATH = `${OUT}/director-film-metadata.json`;
const METADATA_SCRIPT = 'scripts/motion-studio-mp4-metadata.mjs';

/** Shot ids straight from the catalog file (every `MOTION_TEMPLATES` entry has three path segments). */
const SHOT_IDS = Array.from(
  readFileSync('src/data/motionRecipeCatalog.ts', 'utf8').matchAll(/^\s+id: '([a-z-]+\/[a-z0-9-]+\/[A-Za-z0-9]+)',$/gm),
  (m) => m[1],
);

const capturePng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR42mP4z8AAAAMBAQBZ8vGWAAAAAElFTkSuQmCC',
  'base64',
);

async function mockApis(page: Page, scenes: object[], title: string) {
  await page.route('https://captures.example.com/**', (route) => route.fulfill({ status: 200, contentType: 'image/png', body: capturePng }));
  await page.route('**/api/motion-studio/capture', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        url: 'https://acme.example.com/',
        title: 'Acme',
        page: { url: 'https://captures.example.com/page.png', width: 3840, height: 3492 },
        crops: ['https://captures.example.com/crop-1.png'],
        brand: { background: '#111111', text: '#fafafa', accent: '#ec008c', fontFamily: 'Inter' },
        transient: false,
      }),
    }),
  );
  await page.route('**/api/motion-studio/director', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ plan: { title, summary: '', palette: { background: '#111111', text: '#fafafa', accent: '#ec008c' }, scenes } }),
    }),
  );
}

async function buildFilm(page: Page, prompt: string, seconds: string) {
  await page.goto(`${BASE_URL}/studio/motion-director/new`);
  await expect(page.locator('.ms-root')).toBeVisible({ timeout: 120_000 });
  await assertNoOnboardingModal(page);
  await page.getByPlaceholder('Describe your motion video...').fill(prompt);
  await page.getByRole('button', { name: '5s', exact: true }).click();
  await page.getByRole('menuitemradio', { name: seconds }).click();
  await page.getByRole('button', { name: 'Generate' }).click();
  await expect(page.getByTestId('director-plan')).toBeVisible({ timeout: 60_000 });
  await page.getByRole('button', { name: 'Approve & build film' }).click();
  await expect(page.locator('.topbar')).toBeVisible({ timeout: 60_000 });
}

test.describe('Director films across the ShotCraft library', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('every catalog shot builds into a film and renders', async ({ page }) => {
    test.setTimeout(30 * 60 * 1000);
    expect(SHOT_IDS).toHaveLength(150);
    const errors: string[] = [];
    page.on('pageerror', (e) => {
      if (!/Clerk|clerk/.test(e.message)) errors.push(e.message);
    });
    await installStudioSession(page);

    const BATCH = 14;
    for (let i = 0; i < SHOT_IDS.length; i += BATCH) {
      const batch = SHOT_IDS.slice(i, i + BATCH);
      await page.unroute('**/api/motion-studio/director').catch(() => undefined);
      await mockApis(
        page,
        batch.map((id) => ({ kind: 'shot', recipeId: id, durationSec: 3, headline: id.split('/')[1], caption: '', transition: 'cut' })),
        `Library film ${i / BATCH + 1}`,
      );
      // 14 scenes × ~3s: pick the duration that keeps every scene ≥ 1.5s.
      await buildFilm(page, `Library coverage film for https://acme.example.com batch ${i / BATCH + 1}`, '45s');

      const shots = page.locator('.tl-row').filter({ hasText: /Shots/ }).locator('.clip');
      await expect(shots).toHaveCount(batch.length, { timeout: 30_000 });
      const ruler = (await page.locator('.timeline .ruler').boundingBox())!;
      for (let k = 0; k < batch.length; k++) {
        const box = (await shots.nth(k).boundingBox())!;
        await page.mouse.click(box.x + box.width * 0.5, ruler.y + ruler.height / 2);
        await page.waitForTimeout(250);
      }
      expect(errors, `render errors in batch ${i / BATCH + 1}: ${batch.join(', ')}`).toEqual([]);
    }
  });

  test('a director-built film exports to a real MP4', async ({ page }) => {
    test.setTimeout(20 * 60 * 1000);
    await installStudioSession(page);
    await mockApis(
      page,
      [
        { kind: 'title', recipeId: '', durationSec: 2, headline: 'Meet *Acme*', caption: 'Ship faster', transition: 'cut' },
        { kind: 'shot', recipeId: 'camera/crash-zoom-punch/CrashImpactReal', durationSec: 3, headline: 'Your real product', caption: 'LIVE PAGES', transition: 'flash' },
        { kind: 'shot', recipeId: 'ui-entrance/page-waterfall-wall/PageWaterfallWall', durationSec: 3, headline: 'Every page', caption: '', transition: 'cut' },
        { kind: 'shot', recipeId: 'effects/impact-feedback/HitCounter', durationSec: 3, headline: 'Every release counts', caption: '', transition: 'cut' },
        { kind: 'title', recipeId: '', durationSec: 2, headline: 'Try *Acme*', caption: 'acme.example.com', transition: 'cut' },
      ],
      'Acme export film',
    );
    await buildFilm(page, 'A 15-second film for https://acme.example.com', '15s');
    await expect(page.locator('.project-name')).toHaveValue('Acme export film');

    await page.getByRole('button', { name: 'Export video' }).click();
    const done = page.locator('a[download$=".mp4"]');
    await expect(done).toBeVisible({ timeout: 15 * 60 * 1000 });
    const download = page.waitForEvent('download');
    await done.click();
    await (await download).saveAs(MP4_PATH);

    const header = await fs.readFile(MP4_PATH);
    expect(header.subarray(4, 8).toString('latin1')).toBe('ftyp');
    const meta = JSON.parse(execFileSync(process.execPath, [METADATA_SCRIPT, MP4_PATH], { encoding: 'utf8' }));
    expect(meta.duration_seconds).toBeGreaterThan(12);
    expect(meta.video_codec).not.toBe('');
    delete meta.file;
    await fs.writeFile(META_PATH, `${JSON.stringify(meta, null, 2)}\n`);
  });
});
