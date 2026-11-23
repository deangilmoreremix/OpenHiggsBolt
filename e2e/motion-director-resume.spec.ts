import { test, expect, type Page } from '@playwright/test';
import { deflateSync } from 'node:zlib';
import { BASE_URL, installStudioSession } from './helpers/motion-studio';

/**
 * Interrupted production (Round 9, P6) in the real browser: the film is being built, the tab is reloaded in the middle of it, the
 * app offers Resume / Start over from the stored run, and Resume finishes the film from the stored storyboard.
 * The director route is mocked at the network layer (no OpenAI key here); the checkpointing, recovery and resume are the app's own code.
 */
const RUN_KEY = 'motion-director:run-v1';
function solidPng(width: number, height: number, rgb: [number, number, number]): Buffer {
  const table = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (b: Buffer) => { let c = 0xffffffff; for (const x of b) c = table[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (t: string, d: Buffer) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const body = Buffer.concat([Buffer.from(t), d]); const s = Buffer.alloc(4); s.writeUInt32BE(crc(body)); return Buffer.concat([l, body, s]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 2;
  const row = Buffer.concat([Buffer.from([0]), Buffer.from(Array.from({ length: width }, () => rgb).flat())]);
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(Buffer.concat(Array.from({ length: height }, () => row)))), chunk('IEND', Buffer.alloc(0))]);
}

const PHOTO_COLORS: Array<[number, number, number]> = [[236, 0, 140], [110, 210, 0], [0, 175, 235]];

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


test.describe('interrupted production', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  async function startAndInterrupt(page: Page, hold: { adapt: boolean }, opts: { durable: boolean } = { durable: false }) {
    await installStudioSession(page);
    if (opts.durable) {
      // Storage is not configured offline, so the upload route is answered here: each photo gets a lasting (data:) address, as a configured storage would give.
      await page.route('**/api/motion-studio/upload', async (route) => {
        const { name } = JSON.parse(route.request().postData() || '{}') as { name: string };
        const i = Math.max(0, Number(/home-(\d)/.exec(name)?.[1] ?? 1) - 1);
        const url = `data:image/png;base64,${solidPng(960, 640, PHOTO_COLORS[i % PHOTO_COLORS.length]).toString('base64')}`;
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ uploadUrl: `${BASE_URL}/e2e-put/${i}`, url }) });
      });
      await page.route('**/e2e-put/**', (route) => route.fulfill({ status: 200, body: '' }));
    }
    const seen = await mockDirector(page, { review: 'pass' }, hold);
    await page.goto(`${BASE_URL}/studio/motion-director/new`);
    await expect(page.locator('.ms-root')).toBeVisible({ timeout: 120_000 });
    await page.getByTestId('motion-prompt-media-input').setInputFiles(PHOTO_COLORS.map((c, i) => ({ name: `home-${i + 1}.png`, mimeType: 'image/png', buffer: solidPng(960, 640, c) })));
    await expect(page.getByTestId('motion-prompt-media-thumb').first()).toBeVisible();
    await page.getByPlaceholder('Describe your motion video...').fill('Make a 20-second luxury real estate video with these three photos of a beachfront home for Seaside Homes. Cinematic camera movement, end with a call to book a tour.');
    await page.getByRole('button', { name: 'Generate' }).click();
    await page.getByRole('button', { name: /Let the director pick shots/ }).click({ timeout: 30_000 }).catch(() => {});
    await expect(page.getByTestId('director-plan')).toBeVisible({ timeout: 90_000 });
    await page.getByRole('button', { name: 'Approve & build film' }).click();
    // The build reaches shot adaptation, which is held: the production is "in the middle of it".
    await expect.poll(() => seen.adapt ?? 0, { timeout: 120_000 }).toBeGreaterThan(0);
    return seen;
  }
  const stored = (page: Page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? 'null'), RUN_KEY);

  test('reload mid-build: the stored run is recovered, Resume finishes the film, Start over drops it', async ({ page }) => {
    test.setTimeout(15 * 60_000);
    const hold = { adapt: true };
    await startAndInterrupt(page, hold, { durable: true });
    // The checkpoint holds the run with the build stage still running, the request and the approved storyboard (no key, no secret).
    const before = await stored(page);
    expect(before.run.stages.build.status).toBe('running');
    expect(before.run.stages.storyboard.status).toBe('completed');
    expect(before.storyboard.plan.scenes.length).toBeGreaterThan(2);
    expect(JSON.stringify(before)).not.toMatch(/sk-[A-Za-z0-9]{10}/);
    // Reload in the middle of the build; from now on the model answers.
    hold.adapt = false;
    await page.reload();
    await expect(page.locator('.ms-root')).toBeVisible({ timeout: 120_000 });
    const offer = page.getByTestId('resume-offer');
    await expect(offer).toBeVisible({ timeout: 30_000 });
    await expect(offer).toContainText('interrupted');
    await expect(offer).toContainText('build stage');
    await page.getByTestId('resume-run').click();
    await expect(page.getByTestId('film-result')).toBeVisible({ timeout: 10 * 60_000 });
    // The resumed build is recorded as a normal build, not as the interrupted one.
    await expect.poll(async () => (await stored(page))?.run?.stages?.build?.status, { timeout: 60_000 }).toBe('completed');
    await expect(page.getByTestId('film-chat')).toContainText('Resuming the interrupted film');
    // After a resumed, finished film a reload offers nothing to resume.
    await page.reload();
    await expect(page.locator('.ms-root')).toBeVisible({ timeout: 120_000 });
    await expect(page.getByTestId('resume-offer')).toHaveCount(0);
  });

  test('Start over drops the stored run and nothing is offered again', async ({ page }) => {
    test.setTimeout(10 * 60_000);
    const hold = { adapt: true };
    await startAndInterrupt(page, hold);
    hold.adapt = false;
    await page.reload();
    await expect(page.getByTestId('resume-offer')).toBeVisible({ timeout: 120_000 });
    await page.getByTestId('discard-run').click();
    await expect(page.getByTestId('resume-offer')).toHaveCount(0);
    expect(await stored(page)).toBeNull();
    await page.reload();
    await expect(page.locator('.ms-root')).toBeVisible({ timeout: 120_000 });
    await expect(page.getByTestId('resume-offer')).toHaveCount(0);
  });

  test('pictures that only lived in the closed tab cannot be resumed: the app says which ones and offers Start over', async ({ page }) => {
    test.setTimeout(10 * 60_000);
    const hold = { adapt: true };
    await startAndInterrupt(page, hold);
    hold.adapt = false;
    await page.reload();
    const offer = page.getByTestId('resume-offer');
    await expect(offer).toBeVisible({ timeout: 120_000 });
    await expect(offer).toContainText('home-1.png');
    await expect(offer).toContainText('only lived in the tab');
    await expect(page.getByTestId('resume-run')).toHaveCount(0);
  });
});
