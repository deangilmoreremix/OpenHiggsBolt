import { test, expect, type Page } from '@playwright/test';
import { BASE_URL, installStudioSession } from './helpers/motion-studio';
import { solidPng } from './helpers/film-evidence';

/**
 * The three creation modes leave the production run they should (Round 9, P8), in the real browser: Ink Press skips direction and mapping WITH a
 * recorded, legitimate waiver (it is never "completed"); autonomous completes both from the director with no approval prompt; co-creation completes
 * them with the person. The run is read from the checkpoint the app stores (motion-director:run-v1). The director route is mocked (no key here).
 */
const RUN_KEY = 'motion-director:run-v1';
const PHOTO_COLORS: Array<[number, number, number]> = [[236, 0, 140], [110, 210, 0], [0, 175, 235]];
const png = (c: [number, number, number]) => solidPng(960, 640, c);

async function mockDirector(page: Page, opts: { review: 'none' | 'pass' | 'fail-shot' | 'one-item' }, hold: { adapt: boolean } = { adapt: false }) {
  const seen: Record<string, number> = {};
  await page.route('**/api/motion-studio/director', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    seen[body.mode ?? 'plan'] = (seen[body.mode ?? 'plan'] ?? 0) + 1;
    const ok = (json: unknown) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(json) });
    if (body.mode === 'direction') return ok({ options: { directions: [{ name: 'Quiet luxury', claim: 'Controlled camera, long holds', keywords: ['calm'], look: 'warm light, serif type', motion: 'slow pushes', why: 'a premium property', tradeoff: 'less energetic' }], recommended: 0 } });
    if (body.mode === 'mapping') return ok({ mapping: [{ feature: 'The home', firstShot: 'camera/depth-layer-moves/MultiplaneReal', altShot: '', expresses: 'the property photos slide past in depth', pageState: '' }] });
    if (body.mode === 'final-review') {
      if (opts.review === 'none') return route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'OPENAI_KEY_REQUIRED', message: 'No key.' }) });
      // 'pass' answers every required checklist group; 'one-item' is one generic positive statement; 'fail-shot' fails one shot.
      if (opts.review === 'one-item') return ok({ items: [{ id: 'P1', ok: true, seconds: [], text: 'looks fine overall', stage: 'none' }], summary: 'simulated reviewer' });
      const groups = ['P1', 'F1', 'V1', 'S1', 'B1', 'D1', 'Q1'];
      return ok({ items: groups.map((g) => ({ id: g, ok: !(opts.review === 'fail-shot' && g === 'S1'), seconds: g === 'S1' ? [4] : [], text: g === 'S1' && opts.review === 'fail-shot' ? 'the photo is not visible' : 'holds (simulated reviewer)', stage: g === 'S1' ? '5' : 'none' })), summary: 'simulated reviewer' });
    }
    if (body.mode === 'adapt' && hold.adapt) return new Promise<void>(() => { /* the production is interrupted while this shot is being adapted */ });
    if (body.mode === 'adapt') return route.fulfill({ status: 502, contentType: 'application/json', body: JSON.stringify({ error: 'DIRECTOR_FAILED', message: 'no model in this test' }) });
    // The plan: a page-geometry shot (SpotlightHeroCard) the photos cannot support, an image shot, and framing titles.
    return ok({ plan: { title: 'Seaside Homes film', summary: 'Open, the home, close.', palette: { background: '#f4efe6', text: '#1b1712', accent: '#b5651d' }, scenes: [
      { kind: 'title', recipeId: '', durationSec: 3, headline: 'Seaside *Homes*', caption: 'Beachfront living', transition: 'cut' },
      { kind: 'shot', recipeId: 'opening/spotlight-hero-card/SpotlightHeroCard', durationSec: 6, headline: 'The home', caption: '', transition: 'cut', feature: 'The home' },
      { kind: 'shot', recipeId: 'camera/depth-layer-moves/MultiplaneReal', durationSec: 5.5, headline: 'Every room', caption: '', transition: 'cut', feature: 'The home' },
      { kind: 'title', recipeId: '', durationSec: 3, headline: 'Visit *Seaside Homes*', caption: 'Book a tour', transition: 'cut' },
    ] } });
  });
  return seen;
}



const stages = (page: Page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? 'null')?.run?.stages ?? null, RUN_KEY);

async function start(page: Page) {
  await installStudioSession(page);
  const seen = await mockDirector(page, { review: 'pass' });
  await page.goto(`${BASE_URL}/studio/motion-director/new`);
  await expect(page.locator('.ms-root')).toBeVisible({ timeout: 120_000 });
  await page.getByTestId('motion-prompt-media-input').setInputFiles(PHOTO_COLORS.map((c, i) => ({ name: `home-${i + 1}.png`, mimeType: 'image/png', buffer: png(c) })));
  await expect(page.getByTestId('motion-prompt-media-thumb').first()).toBeVisible();
  await page.getByPlaceholder('Describe your motion video...').fill('Make a 20-second luxury real estate video with these three photos of a beachfront home for Seaside Homes. Cinematic camera movement, end with a call to book a tour.');
  await page.getByRole('button', { name: 'Generate' }).click();
  return seen;
}

test.describe('creation modes leave the right production run', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('Ink Press: direction and mapping are skipped with a legitimate waiver, never "completed"; the director is not asked for them', async ({ page }) => {
    test.setTimeout(10 * 60_000);
    const seen = await start(page);
    await page.getByRole('button', { name: 'Use Ink Press' }).click({ timeout: 30_000 });
    await expect(page.getByTestId('director-plan')).toBeVisible({ timeout: 90_000 });
    const st = await stages(page);
    expect(st.direction.status).toBe('skipped');
    expect(st.direction.waiver?.legit).toBe(true);
    expect(st.mapping.status).toBe('skipped');
    expect(st.mapping.waiver?.legit).toBe(true);
    expect(seen.direction ?? 0).toBe(0);
    expect(seen.mapping ?? 0).toBe(0);
    expect(st.storyboard.status).toBe('completed');
    await page.getByRole('button', { name: 'Approve & build film' }).click();
    await expect(page.getByTestId('film-result')).toBeVisible({ timeout: 10 * 60_000 });
    // A skipped stage with a legitimate waiver does not block readiness: the status line never names direction or mapping as missing.
    await expect(page.getByTestId('film-chat')).not.toContainText(/direction (is|was) missing|mapping (is|was) missing/i);
  });

  test('autonomous: the director chooses the direction and the map, no approval prompt, both recorded as completed', async ({ page }) => {
    test.setTimeout(10 * 60_000);
    const seen = await start(page);
    await page.getByRole('button', { name: /Let the director pick shots/ }).click({ timeout: 30_000 });
    // No confirmation steps: straight to the storyboard.
    await expect(page.getByTestId('director-plan')).toBeVisible({ timeout: 90_000 });
    await expect(page.getByTestId('guided-choices')).toHaveCount(0);
    expect(seen.direction ?? 0).toBeGreaterThan(0);
    expect(seen.mapping ?? 0).toBeGreaterThan(0);
    const st = await stages(page);
    expect(st.direction.status).toBe('completed');
    expect(st.mapping.status).toBe('completed');
    expect(st.direction.waiver).toBeUndefined();
    expect(st.mapping.waiver).toBeUndefined();
  });
});
