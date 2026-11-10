import fs from 'node:fs';
import { test, expect, type Page } from '@playwright/test';
import { deflateSync } from 'node:zlib';
import { BASE_URL, installStudioSession } from './helpers/motion-studio';
import { colorFootprint, rawRgbFull } from './helpers/film-evidence';

/**
 * The production workflow end to end in the real browser (Round 8): product brief → direction → mapping → storyboard gate →
 * asset check → per-shot build → scene QA → sound → frame QA → review status → the saved project's production run.
 *
 * Mocked at the network layer, and labelled as such: the director route (planning, direction, mapping, final review) because
 * there is no OpenAI key in this environment. Everything else is the app: the brief, the gate, the needs check, the build,
 * the frame checks and the status logic are real code running in Chromium. THE LIVE MODEL IS NOT EXERCISED HERE.
 */
const STORAGE_KEY = 'motion-director:project-v1';

function solidPng(width: number, height: number, rgb: [number, number, number]): Buffer {
  const table = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (b: Buffer) => { let c = 0xffffffff; for (const x of b) c = table[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (t: string, d: Buffer) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const body = Buffer.concat([Buffer.from(t), d]); const s = Buffer.alloc(4); s.writeUInt32BE(crc(body)); return Buffer.concat([l, body, s]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 2;
  const row = Buffer.concat([Buffer.from([0]), Buffer.from(Array.from({ length: width }, () => rgb).flat())]);
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(Buffer.concat(Array.from({ length: height }, () => row)))), chunk('IEND', Buffer.alloc(0))]);
}

const PHOTO_COLORS: Array<[number, number, number]> = [[236, 0, 140], [110, 210, 0], [0, 175, 235]];

async function mockDirector(page: Page, opts: { review: 'none' | 'pass' | 'fail-shot' }) {
  const seen: Record<string, number> = {};
  await page.route('**/api/motion-studio/director', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    seen[body.mode ?? 'plan'] = (seen[body.mode ?? 'plan'] ?? 0) + 1;
    const ok = (json: unknown) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(json) });
    if (body.mode === 'direction') return ok({ options: { directions: [{ name: 'Quiet luxury', claim: 'Controlled camera, long holds', keywords: ['calm'], look: 'warm light, serif type', motion: 'slow pushes', why: 'a premium property', tradeoff: 'less energetic' }], recommended: 0 } });
    if (body.mode === 'mapping') return ok({ mapping: [{ feature: 'The home', firstShot: 'camera/depth-layer-moves/MultiplaneReal', altShot: '', expresses: 'the property photos slide past in depth', pageState: '' }] });
    if (body.mode === 'final-review') {
      if (opts.review === 'none') return route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'OPENAI_KEY_REQUIRED', message: 'No key.' }) });
      return ok({ items: [{ id: 'S1', ok: opts.review === 'pass', seconds: [4], text: opts.review === 'pass' ? 'shot matches its card' : 'the photo is not visible', stage: '5' }], summary: 'simulated reviewer' });
    }
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

async function runUploadFilm(page: Page, review: 'none' | 'pass' | 'fail-shot') {
  await installStudioSession(page);
  const seen = await mockDirector(page, { review });
  await page.goto(`${BASE_URL}/studio/motion-director/new`);
  await expect(page.locator('.ms-root')).toBeVisible({ timeout: 120_000 });
  await page.getByTestId('motion-prompt-media-input').setInputFiles(PHOTO_COLORS.map((c, i) => ({ name: `home-${i + 1}.png`, mimeType: 'image/png', buffer: solidPng(960, 640, c) })));
  await expect(page.getByTestId('motion-prompt-media-thumb').first()).toBeVisible();
  await page.getByPlaceholder('Describe your motion video...').fill('Make a 20-second luxury real estate video with these three photos of a beachfront home for Seaside Homes. Cinematic camera movement, end with a call to book a tour.');
  await page.getByRole('button', { name: 'Generate' }).click();
  // An autonomous film: it must not stop to ask for the template or for approval of intermediate stages.
  await page.getByRole('button', { name: /Let the director pick shots/ }).click({ timeout: 30_000 }).catch(() => {});
  await expect(page.getByTestId('director-plan')).toBeVisible({ timeout: 90_000 });
  return seen;
}

/** The project as saved: it is installed in the Workbench (and persisted) when the film is opened there. */
const projectOf = async (page: Page) => {
  if (!(await page.locator('.topbar').isVisible().catch(() => false))) {
    await page.getByTestId('film-open-workbench').click();
    await expect(page.locator('.topbar')).toBeVisible({ timeout: 60_000 });
    await page.waitForTimeout(1500);
  }
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), STORAGE_KEY);
};

test.describe('film production workflow', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('uploaded photos, no website: brief for the right business, gate swaps the shot the photos cannot support, scenes check out, run is saved', async ({ page }) => {
    test.setTimeout(15 * 60_000);
    const seen = await runUploadFilm(page, 'none');
    const chat = page.getByTestId('film-chat');
    // Stage 0: the brief is about a real-estate business, not a software dashboard.
    await expect(chat).toContainText('Product brief:');
    await expect(chat).toContainText('real estate');
    // Stage 1/2: a direction and a map were obtained (autonomous: no approval stops).
    expect(seen.direction ?? 0).toBeGreaterThan(0);
    expect(seen.mapping ?? 0).toBeGreaterThan(0);
    // Stage 3: the gate swapped SpotlightHeroCard (it needs a captured page; there are only photos).
    await expect(chat).toContainText('Storyboard gate swapped');
    const plan = page.getByTestId('director-plan');
    await expect(plan).not.toContainText('Spotlight Hero Card');
    await expect(plan).toContainText('Multiplane');
    await page.getByRole('button', { name: 'Approve & build film' }).click();
    await expect(page.getByTestId('film-result')).toBeVisible({ timeout: 10 * 60_000 });
    // The film is shown as a DRAFT, and with no reviewer it is never called reviewed.
    await expect(chat).toContainText('The draft:', { timeout: 60_000 });
    await expect(chat).toContainText('independent review did not run', { timeout: 120_000 });
    await expect(chat).not.toContainText('Ready for final export');
    // The photos really are in a rendered frame of that shot (export renderer, the film's own composition), checked before the film is opened in the Workbench.
    await page.waitForFunction(() => Boolean((window as unknown as { __motionParity?: unknown }).__motionParity), null, { timeout: 30_000 });
    const live = await page.evaluate(() => (window as unknown as { __motionParity: { getProject: () => { tracks: Array<{ clips: Array<{ cardId: string; start: number; duration: number }> }> } } }).__motionParity.getProject());
    const clip = live.tracks.flatMap((t) => t.clips).find((c) => c.cardId === 'demo:MultiplaneReal')!;
    const frame = clip.start + Math.floor(clip.duration * 0.6);
    const still: string = await page.evaluate((f) => (window as unknown as { __motionParity: { exportStill: (n: number) => Promise<string> } }).__motionParity.exportStill(f), frame);
    const img = rawRgbFull(Buffer.from(still.replace(/^data:image\/png;base64,/, ''), 'base64'));
    const seenPhotos = PHOTO_COLORS.filter((c) => colorFootprint(img, c).n > 200).length;
    expect(seenPhotos, 'the customer\'s photos appear in the shot\'s frame').toBeGreaterThanOrEqual(1);
    // The saved project carries the production run: stages recorded with what really happened.
    const project = await projectOf(page);
    expect(project?.run?.stages?.brief?.status).toBe('completed');
    expect(project.run.stages.storyboard.status).toBe('completed');
    expect(project.run.stages.build.status).toMatch(/completed|needs-review/);
    expect(project.run.review.ran).toBe(false);
    expect(['unavailable', 'not-run']).toContain(project.run.review.state);
    expect(project.run.scenes.length).toBeGreaterThanOrEqual(3);
    expect(project.run.scenes.some((s: { component: string }) => s.component === 'MultiplaneReal')).toBe(true);
    // Scene QA looked at the multiplane shot on its own and found the photos in it.
    const multi = project.run.scenes.find((s: { component: string }) => s.component === 'MultiplaneReal');
    expect(multi.validation.state).toBe('passed');
    fs.mkdirSync('test-results/production', { recursive: true });
    fs.writeFileSync('test-results/production/run-upload-film.json', JSON.stringify({ run: project.run, frame, photosSeen: seenPhotos }, null, 1));
  });

  test('editing the finished film by scene: keep one, replace one, stronger ending; the rest is kept and the film is rebuilt', async ({ page }) => {
    test.setTimeout(15 * 60_000);
    await runUploadFilm(page, 'none');
    const chat = page.getByTestId('film-chat');
    await page.getByRole('button', { name: 'Approve & build film' }).click();
    await expect(page.getByTestId('film-result')).toBeVisible({ timeout: 10 * 60_000 });
    await expect(chat).toContainText('The draft:', { timeout: 60_000 });
    await page.getByPlaceholder('Describe your motion video...').fill('Keep the first scene, replace the second shot with a different camera movement, and make the ending more dramatic.');
    await page.getByRole('button', { name: 'Generate' }).click();
    await expect(chat).toContainText('Rebuilt the film from the edited storyboard', { timeout: 5 * 60_000 });
    await expect(chat).toContainText('Scene 2:');
    await expect(chat).toContainText('Kept scene 1.');
    await expect(chat).toContainText('Ending: flash cuts');
    const p = await projectOf(page);
    // The edit invalidated the earlier review; the sound cues were recomputed with the new cuts.
    expect(p.run.stages.review.status).toBe('pending');
    const sfx = (p.tracks as Array<{ clips: Array<{ cardId: string; props?: { file?: string } }> }>).flatMap((t) => t.clips).filter((c) => c.cardId === 'audio-clip' && /sfxlib/.test(c.props?.file ?? ''));
    expect(sfx.length).toBeGreaterThan(3);
  });

  test('a reviewer that ran and passed makes the film ready; one that fails a shot blocks it', async ({ page }) => {
    test.setTimeout(15 * 60_000);
    await runUploadFilm(page, 'pass');
    const chat = page.getByTestId('film-chat');
    await page.getByRole('button', { name: 'Approve & build film' }).click();
    await expect(page.getByTestId('film-result')).toBeVisible({ timeout: 10 * 60_000 });
    await expect(chat).toContainText('Independent review', { timeout: 180_000 });
    await expect(chat).toContainText('Ready for final export', { timeout: 60_000 });
    const ready = await projectOf(page);
    expect(ready.run.review).toMatchObject({ ran: true, state: 'passed' });
  });

  test('a failed shot finding triggers one correction pass; the corrected film needs a new review and is not ready', async ({ page }) => {
    test.setTimeout(15 * 60_000);
    await runUploadFilm(page, 'fail-shot');
    const chat = page.getByTestId('film-chat');
    await page.getByRole('button', { name: 'Approve & build film' }).click();
    await expect(page.getByTestId('film-result')).toBeVisible({ timeout: 10 * 60_000 });
    await expect(chat).toContainText('Independent review', { timeout: 180_000 });
    await expect(chat).toContainText('Correcting from the review', { timeout: 60_000 });
    await expect(chat).toContainText('Rebuilt the film from the edited storyboard', { timeout: 5 * 60_000 });
    await expect(chat).not.toContainText('Ready for final export');
    const p = await projectOf(page);
    // The earlier review no longer applies to the corrected film.
    expect(p.run.review.ran).toBe(false);
    expect(p.run.stages.review.status).toBe('pending');
  });
});
