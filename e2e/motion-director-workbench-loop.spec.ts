import fs from 'node:fs';
import { test, expect, type Page } from '@playwright/test';
import { BASE_URL, installStudioSession } from './helpers/motion-studio';
import { colorShare, decodeAll, extractFrame, probe, rawRgb, solidPng, variance, type Rgb } from './helpers/film-evidence';

/**
 * The Workbench loop (Round 9, P9), in the real browser: create a film from photos → open it in the Workbench → edit a scene, replace an
 * image, change a title → save → reload → the project reopens with its components intact → re-export an MP4 with the existing browser
 * renderer → the exported frames contain the edits. A second test interrupts a production, resumes it after a reload, then edits it.
 * The director route is mocked (no OpenAI key here); everything else, including the export, is the app.
 */
const PROJECT_KEY = 'motion-director:project-v1';
const RUN_KEY = 'motion-director:run-v1';
const OUT = 'docs/motion-director-pipeline-audit/round9/workbench';
const PHOTO_COLORS: Rgb[] = [[236, 0, 140], [110, 210, 0], [0, 175, 235]];
const NEW_LOGO: Rgb = [255, 120, 0]; // the replacement image: orange, a colour none of the photos or the paper theme has
const png = (c: Rgb) => solidPng(960, 640, c);
const dataUrl = (c: Rgb) => `data:image/png;base64,${solidPng(240, 240, c).toString('base64')}`;

async function mockDirector(page: Page, opts: { review: 'none' | 'pass' | 'fail-shot' | 'one-item' }, hold: { adapt: boolean }) {
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



/** Storage is not configured offline: the upload route answers with lasting (data:) addresses, as configured storage would. */
async function durableUploads(page: Page) {
  await page.route('**/api/motion-studio/upload', async (route) => {
    const { name } = JSON.parse(route.request().postData() || '{}') as { name: string };
    const i = Math.max(0, Number(/home-(\d)/.exec(name)?.[1] ?? 1) - 1);
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ uploadUrl: `${BASE_URL}/e2e-put/${i}`, url: `data:image/png;base64,${png(PHOTO_COLORS[i % PHOTO_COLORS.length]).toString('base64')}` }) });
  });
  await page.route('**/e2e-put/**', (r) => r.fulfill({ status: 200, body: '' }));
}

async function createFilm(page: Page, hold: { adapt: boolean }) {
  await installStudioSession(page);
  const seen = await mockDirector(page, { review: 'pass' }, hold);
  await durableUploads(page);
  await page.goto(`${BASE_URL}/studio/motion-director/new`);
  await expect(page.locator('.ms-root')).toBeVisible({ timeout: 120_000 });
  await page.getByTestId('motion-prompt-media-input').setInputFiles(PHOTO_COLORS.map((c, i) => ({ name: `home-${i + 1}.png`, mimeType: 'image/png', buffer: png(c) })));
  await expect(page.getByTestId('motion-prompt-media-thumb').first()).toBeVisible();
  await page.getByPlaceholder('Describe your motion video...').fill('Make a 20-second luxury real estate video with these three photos of a beachfront home for Seaside Homes. Cinematic camera movement, end with a call to book a tour.');
  await page.getByRole('button', { name: 'Generate' }).click();
  await page.getByRole('button', { name: /Let the director pick shots/ }).click({ timeout: 30_000 }).catch(() => {});
  await expect(page.getByTestId('director-plan')).toBeVisible({ timeout: 90_000 });
  await page.getByRole('button', { name: 'Approve & build film' }).click();
  return seen;
}

const openWorkbench = async (page: Page) => {
  await page.getByTestId('film-open-workbench').click();
  await expect(page.locator('.topbar')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('.clip').first()).toBeVisible({ timeout: 60_000 });
};
const saved = (page: Page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? 'null'), PROJECT_KEY);
type Clip = { id: string; cardId: string; start: number; duration: number; props?: Record<string, unknown> };
const clipsOf = (p: { tracks: Array<{ name: string; clips: Clip[] }> }) => p.tracks.flatMap((t) => t.clips);
const row = (page: Page, label: string | RegExp) => page.locator('.inspector .prop-row', { hasText: label });
const select = async (page: Page, text: string | RegExp) => { await page.locator('.clip', { hasText: text }).first().click(); await expect(page.locator('.inspector')).toBeVisible(); };

/** Edit a scene, replace an image, change a title, through the Workbench inspector. */
async function editFilm(page: Page) {
  // 1. Change a title: the closing title card's copy.
  await select(page, 'Seaside Homes');
  await row(page, 'Copy (*word* = accent)').locator('input, textarea').first().fill('Visit *Ocean View Homes*');
  // 2. Replace an image: the title card's logo is swapped for a new picture (orange).
  await row(page, 'Logo (image URL)').locator('input, textarea').first().fill(dataUrl(NEW_LOGO));
  // 3. Edit a scene: the Multiplane shot gets its own title and a shorter duration.
  await select(page, 'Multiplane');
  await row(page, 'Title text').locator('input').first().fill('Every room, edited');
  const dur = row(page, 'Duration').locator('input').first();
  await dur.fill('5');
  await dur.press('Enter');
  await expect.poll(async () => {
    const p = await saved(page);
    const c = clipsOf(p);
    const card = c.find((x) => x.cardId === 'inkpress-title-card' && String(x.props?.text ?? x.props?.title ?? x.props?.copy ?? '').includes('Ocean View'));
    const mp = c.find((x) => x.cardId === 'demo:MultiplaneReal');
    return Boolean(card) && mp?.props?.title === 'Every room, edited' && mp.duration === 150;
  }, { timeout: 15_000 }).toBe(true);
}

test.describe('Workbench loop', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('create → Workbench → edit scene, replace image, change title → save → reload → reopen intact → export MP4 with the edits', async ({ page }) => {
    test.setTimeout(40 * 60_000);
    await createFilm(page, { adapt: false });
    await expect(page.getByTestId('film-result')).toBeVisible({ timeout: 10 * 60_000 });
    await openWorkbench(page);
    const before = await saved(page);
    const tracksBefore = before.tracks.map((t: { name: string; clips: Clip[] }) => [t.name, t.clips.length]);
    const mpBefore = clipsOf(before).find((c) => c.cardId === 'demo:MultiplaneReal')!;
    expect(mpBefore.props?.screens ?? mpBefore.props?.crops, 'the shot carries the customer\'s photos').toBeTruthy();
    expect(before.run, 'the project carries its production run').toBeTruthy();

    await editFilm(page);

    // Save → reload → reopen: the Workbench loads the saved project; every component and the edits are still there.
    await page.waitForTimeout(1500);
    await page.reload();
    await expect(page.locator('.topbar')).toBeVisible({ timeout: 90_000 });
    await expect(page.locator('.clip').first()).toBeVisible({ timeout: 60_000 });
    await page.waitForTimeout(1500);
    const after = await saved(page);
    expect(after.tracks.map((t: { name: string; clips: Clip[] }) => [t.name, t.clips.length]), 'the same tracks and clip counts after reopening').toEqual(tracksBefore);
    const aClips = clipsOf(after);
    const mp = aClips.find((c) => c.cardId === 'demo:MultiplaneReal')!;
    expect(mp.props?.title).toBe('Every room, edited');
    expect(mp.duration).toBe(150);
    expect(mp.props?.screens ?? mp.props?.crops, 'the photos are still on the shot').toEqual(mpBefore.props?.screens ?? mpBefore.props?.crops);
    const card = aClips.find((c) => c.cardId === 'inkpress-title-card' && JSON.stringify(c.props).includes('Ocean View'))!;
    expect(JSON.stringify(card.props)).toContain(dataUrl(NEW_LOGO).slice(0, 60));
    expect(after.run?.stages?.build?.status, 'the production run survived').toBeTruthy();
    // Untouched clips are byte-for-byte what they were (sound and music included).
    const untouched = (p: { tracks: Array<{ name: string; clips: Clip[] }> }) => JSON.stringify(p.tracks.filter((t) => ['SFX', 'Music', 'Background'].includes(t.name)).map((t) => t.clips.map((c) => [c.cardId, c.start, c.duration, c.props])));
    expect(untouched(after)).toBe(untouched(before));

    // Re-export with the existing browser renderer (draft size) and check the exported frames hold the edits.
    await page.getByTestId('export-draft').check();
    await page.getByRole('button', { name: 'Export video' }).click();
    const done = page.locator('a[download$=".mp4"]');
    await expect(done).toBeVisible({ timeout: 30 * 60_000 });
    const download = page.waitForEvent('download');
    await done.click();
    fs.mkdirSync(OUT, { recursive: true });
    const file = `${OUT}/edited-film.mp4`;
    await (await download).saveAs(file);
    const info = probe(file);
    expect(info.video?.codec_name).toBe('h264');
    const dec = decodeAll(file);
    expect(dec.errors).toBe('');
    const endFrame = Math.max(...aClips.map((c) => c.start + c.duration));
    expect(Math.abs(info.durationSec - endFrame / after.fps), 'the MP4 is as long as the edited project').toBeLessThan(1.2);
    // The replaced logo (orange) is in the title card's frames; the photos are in the Multiplane shot's frames.
    const cardSec = (card.start + card.duration * 0.7) / after.fps;
    const cardFrame = rawRgb(extractFrame(file, cardSec));
    fs.writeFileSync(`${OUT}/edited-title-card.png`, extractFrame(file, cardSec));
    expect(variance(cardFrame)).toBeGreaterThan(20);
    expect(colorShare(cardFrame, NEW_LOGO, 45), 'the replacement logo appears in the exported title card').toBeGreaterThan(0.002);
    const mpSec = (mp.start + mp.duration * 0.6) / after.fps;
    fs.writeFileSync(`${OUT}/edited-multiplane.png`, extractFrame(file, mpSec));
    const mpFrame = rawRgb(extractFrame(file, mpSec));
    expect(PHOTO_COLORS.some((c) => colorShare(mpFrame, c, 45) > 0.01), 'the customer\'s photos are in the exported shot').toBe(true);
  });

  test('an interrupted production is resumed after a reload, then edited in the Workbench', async ({ page }) => {
    test.setTimeout(20 * 60_000);
    const hold = { adapt: true };
    const seen = await createFilm(page, hold);
    await expect.poll(() => seen.adapt ?? 0, { timeout: 120_000 }).toBeGreaterThan(0);
    hold.adapt = false;
    await page.reload();
    await expect(page.getByTestId('resume-offer')).toBeVisible({ timeout: 120_000 });
    await page.getByTestId('resume-run').click();
    await expect(page.getByTestId('film-result')).toBeVisible({ timeout: 10 * 60_000 });
    await openWorkbench(page);
    const before = await saved(page);
    expect(before.run?.stages?.build?.status).toBe('completed');
    expect(clipsOf(before).some((c) => c.cardId === 'demo:MultiplaneReal')).toBe(true);
    await editFilm(page);
    await page.waitForTimeout(1500);
    await page.reload();
    await expect(page.locator('.topbar')).toBeVisible({ timeout: 90_000 });
    await page.waitForTimeout(1500);
    const after = await saved(page);
    expect(clipsOf(after).find((c) => c.cardId === 'demo:MultiplaneReal')?.props?.title).toBe('Every room, edited');
    expect(after.run?.stages?.build?.status).toBe('completed');
    // The run store no longer offers a resume for a finished film.
    const run = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? 'null')?.run?.stages?.build?.status, RUN_KEY);
    expect(run).toBe('completed');
  });
});
