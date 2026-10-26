import { test, expect, type Page } from '@playwright/test';
import { deflateSync } from 'node:zlib';
import { BASE_URL, answerInkPressOffer, approveFilmAndOpenWorkbench, assertNoOnboardingModal, captureEvidence, installStudioSession, setEntryDuration } from './helpers/motion-studio';

/**
 * Prompt → site capture → AI director storyboard → Approve → a real film in the
 * Workbench, with the captured page rendered inside a ShotCraft shot, then a
 * conversational edit routed to the director.
 *
 * Only the two server calls are mocked at the network layer (capture needs a
 * public site and a browser; the director needs an OpenAI key): their response
 * shapes are the routes' real contracts. Everything else is the real app.
 */
const OUT = 'docs/motion-studio-design-replacement';
const CAPTURE_PAGE = 'https://captures.example.com/page.png';
const CAPTURE_CROP = 'https://captures.example.com/crop-1.png';
const CAPTURE_IMAGE = 'https://captures.example.com/image-1.jpg';
const CAPTURE_LOGO = 'https://captures.example.com/logo.png';

/** Solid-colour PNG so the capture is unmistakable in the render. */
function solidPng(width: number, height: number, rgb: [number, number, number]): Buffer {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf: Buffer) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type), data]);
    const sum = Buffer.alloc(4);
    sum.writeUInt32BE(crc(body));
    return Buffer.concat([len, body, sum]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const row = Buffer.concat([Buffer.from([0]), Buffer.from(Array.from({ length: width }, () => rgb).flat())]);
  const raw = Buffer.concat(Array.from({ length: height }, () => row));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

async function mockDirector(page: Page) {
  const calls = { capture: 0, plan: 0, edit: 0 };
  const png = solidPng(480, 436, [236, 0, 140]);
  await page.route('https://captures.example.com/**', (route) => route.fulfill({ status: 200, contentType: 'image/png', body: png }));
  await page.route('**/api/motion-studio/capture', async (route) => {
    calls.capture++;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        url: 'https://acme.example.com/',
        title: 'Acme',
        page: { url: CAPTURE_PAGE, width: 3840, height: 3492 },
        crops: [CAPTURE_CROP],
        images: [CAPTURE_IMAGE],
        logo: CAPTURE_LOGO,
        brand: { background: '#111111', text: '#fafafa', accent: '#ec008c', fontFamily: 'Inter' },
        transient: false,
      }),
    });
  });
  await page.route('**/api/motion-studio/director', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    if (body.mode === 'edit') {
      calls.edit++;
      const opener = (body.clips as Array<{ id: string; recipe: string }>).find((c) => c.recipe.startsWith('inkpress-title-card'));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          reply: 'Rewrote the opening line.',
          ops: [{ op: 'set_text', clipId: opener?.id ?? '', recipeId: '', seconds: 0, text: 'Acme ships *faster*', background: '', accent: '' }],
        }),
      });
      return;
    }
    calls.plan++;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        plan: {
          title: 'Acme launch film',
          summary: 'Opener, real product pages, outro.',
          palette: { background: '#111111', text: '#fafafa', accent: '#ec008c' },
          scenes: [
            { kind: 'title', recipeId: '', durationSec: 2.5, headline: 'Meet *Acme*', caption: 'The new way to ship', transition: 'cut' },
            { kind: 'shot', recipeId: 'camera/crash-zoom-punch/CrashImpactReal', durationSec: 4.5, headline: 'Your real product', caption: 'LIVE PAGES', transition: 'flash' },
            { kind: 'shot', recipeId: 'effects/impact-feedback/HitCounter', durationSec: 5, headline: 'Every release counts', caption: '', transition: 'cut' },
            { kind: 'title', recipeId: '', durationSec: 3, headline: 'Try *Acme* today', caption: 'acme.example.com', transition: 'cut' },
          ],
        },
      }),
    });
  });
  return calls;
}

test.describe('Motion Studio director', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('prompt with a site URL → storyboard → approve → film with the captured page', async ({ page }) => {
    await installStudioSession(page);
    const calls = await mockDirector(page);
    await page.goto(`${BASE_URL}/studio/motion-director/new`);
    await expect(page.locator('.ms-root')).toBeVisible({ timeout: 120_000 });
    await assertNoOnboardingModal(page);

    await page.getByPlaceholder('Describe your motion video...').fill('A 15-second launch film for https://acme.example.com showing the real pages');
    await setEntryDuration(page, '15s');
    await page.getByRole('button', { name: 'Generate' }).click();
    // A plain film request: the chat introduces Ink Press and asks first.
    await answerInkPressOffer(page, 'director');

    const plan = page.getByTestId('director-plan');
    await expect(plan).toBeVisible({ timeout: 60_000 });
    await expect(plan).toContainText('Acme launch film');
    await expect(plan).toContainText('Crash Zoom Punch · Crash Impact Real');
    await expect(plan).toContainText('shows your site');
    await expect(page.getByText(/Captured Acme · 1 card crops · logo · 1 site image/)).toBeVisible();
    // The assets pulled from the site are shown in the chat.
    const assets = page.getByTestId('site-assets');
    await expect(assets.locator(`img[src="${CAPTURE_LOGO}"]`)).toBeVisible();
    await expect(assets.locator(`img[src="${CAPTURE_IMAGE}"]`)).toBeVisible();
    expect(calls).toMatchObject({ capture: 1, plan: 1 });
    await captureEvidence(page, `${OUT}/director-storyboard-desktop.png`, { minBytes: 10 * 1024 });

    await approveFilmAndOpenWorkbench(page);
    await expect(page.locator('.project-name')).toHaveValue('Acme launch film');
    // The site's logo is on the title cards; its image leads the product shots' card slots.
    const savedClips = () =>
      page.evaluate(() => (JSON.parse(localStorage.getItem('motion-director:project-v1') || '{}').tracks ?? []).flatMap((t: any) => t.clips));
    await expect.poll(async () => (await savedClips()).some((c: any) => c.props?.logo), { timeout: 15_000 }).toBe(true);
    const all = await savedClips();
    const titles = all.filter((c: any) => c.cardId === 'inkpress-title-card');
    expect(titles.length).toBeGreaterThan(0);
    for (const t of titles) expect(t.props.logo).toBe(CAPTURE_LOGO);
    expect(all.find((c: any) => Array.isArray(c.props?.crops))?.props.crops[0]).toBe(CAPTURE_IMAGE);
    // 4 scenes + 2 caption strips (one per shot; title cards carry theirs as a subtitle)
    // + 1 flash cut + 3 sound effects (one per scene change) + background
    await expect(page.locator('.clip')).toHaveCount(11, { timeout: 30_000 });

    // The product shot renders the captured page, not the sample texture.
    // Seek into the product shot (2.5s–7s) by clicking the ruler above it.
    const shot = page.locator('.clip', { hasText: /Crash/ }).first();
    const box = (await shot.boundingBox())!;
    const ruler = (await page.locator('.timeline .ruler').boundingBox())!;
    await page.mouse.click(box.x + box.width * 0.6, ruler.y + ruler.height / 2);
    await expect(page.locator(`.preview-stage img[src="${CAPTURE_PAGE}"]`).first()).toBeAttached({ timeout: 30_000 });
    await page.waitForTimeout(800);
    await captureEvidence(page, `${OUT}/director-film-workbench-desktop.png`, { minBytes: 10 * 1024 });

    // A conversational edit the built-in commands do not cover goes to the director.
    const agentInput = page.getByPlaceholder(/tell the agent/i);
    await agentInput.fill('rewrite the opening line so it feels punchier');
    await agentInput.press('Enter');
    await expect(page.getByText('Rewrote the opening line.')).toBeVisible({ timeout: 30_000 });
    expect(calls.edit).toBe(1);
    await expect
      .poll(async () => page.evaluate(() => {
        const p = JSON.parse(localStorage.getItem('motion-director:project-v1') || '{}');
        return p.tracks?.flatMap((t: any) => t.clips).find((c: any) => c.cardId === 'inkpress-title-card')?.props?.text ?? null;
      }), { timeout: 10_000 })
      .toBe('Acme ships *faster*');
  });

  test('chat: "make a promo" → Ink Press question → storyboard → film plays in the chat → Motion Workbench', async ({ page }) => {
    await installStudioSession(page);
    const calls = await mockDirector(page);
    await page.goto(`${BASE_URL}/studio/motion-director/new`);
    await expect(page.locator('.ms-root')).toBeVisible({ timeout: 120_000 });
    await assertNoOnboardingModal(page);

    await page.getByPlaceholder('Describe your motion video...').fill('Use video-shotcraft to make a promo for https://acme.example.com');
    await page.getByRole('button', { name: 'Generate' }).click();
    const chat = page.getByTestId('film-chat');
    await expect(chat).toContainText('Ink Press template');
    await answerInkPressOffer(page, 'inkpress');
    await expect(page.getByTestId('director-plan')).toBeVisible({ timeout: 60_000 });
    expect(calls).toMatchObject({ capture: 1, plan: 1 });
    await captureEvidence(page, `${OUT}/chat-storyboard-desktop.png`, { minBytes: 10 * 1024 });

    await page.getByRole('button', { name: 'Approve & build film' }).click();
    const film = page.getByTestId('film-result');
    await expect(film).toBeVisible({ timeout: 120_000 });
    await expect(film).toContainText('1920×1080 · 30 fps');
    await expect(film.locator('.__remotion-player')).toBeVisible();
    await expect(chat).toContainText('Your film is ready');
    await expect(page.getByTestId('film-render')).toBeVisible();
    await captureEvidence(page, `${OUT}/chat-film-desktop.png`, { minBytes: 10 * 1024 });

    await page.getByTestId('film-open-workbench').click();
    await expect(page.locator('.topbar')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('.project-name')).toHaveValue('Acme launch film');
  });

  test('chat: shot cards named in the message are the film\'s shots', async ({ page }) => {
    await installStudioSession(page);
    await page.route('**/api/motion-studio/director', (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'OPENAI_KEY_REQUIRED', message: 'No key.' }) }),
    );
    await page.goto(`${BASE_URL}/studio/motion-director/new`);
    await expect(page.locator('.ms-root')).toBeVisible({ timeout: 120_000 });
    await page.getByPlaceholder('Describe your motion video...').fill('Use the deck-deal-flyin and row-embed shot cards to present this feature.');
    await page.getByRole('button', { name: 'Generate' }).click();
    const plan = page.getByTestId('director-plan');
    await expect(plan).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('inkpress-offer')).toHaveCount(0);
    await expect(plan).toContainText(/Deck Deal Flyin/i);
    await expect(plan).toContainText(/Row Embed/i);
  });

  test('chat: Render MP4 encodes the film in the browser with the Remotion web renderer', async ({ page }) => {
    test.setTimeout(15 * 60 * 1000);
    await installStudioSession(page);
    await page.route('**/api/motion-studio/director', (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'OPENAI_KEY_REQUIRED', message: 'No key.' }) }),
    );
    await page.goto(`${BASE_URL}/studio/motion-director/new`);
    await expect(page.locator('.ms-root')).toBeVisible({ timeout: 120_000 });
    await setEntryDuration(page, '5s');
    await page.getByPlaceholder('Describe your motion video...').fill('Make a launch film for Acme with the Ink Press template');
    await page.getByRole('button', { name: 'Generate' }).click();
    await expect(page.getByTestId('director-plan')).toBeVisible({ timeout: 60_000 });
    await page.getByRole('button', { name: 'Approve & build film' }).click();
    await expect(page.getByTestId('film-result')).toBeVisible({ timeout: 120_000 });

    await page.getByTestId('film-render').click();
    await expect(page.getByTestId('film-render-status')).toContainText('keep it open');
    const link = page.getByTestId('film-download');
    await expect(link).toBeVisible({ timeout: 12 * 60 * 1000 });
    const [download] = await Promise.all([page.waitForEvent('download'), link.click()]);
    expect(download.suggestedFilename()).toMatch(/\.mp4$/);
    const bytes = await (await import('node:fs/promises')).readFile((await download.path())!);
    expect(bytes.length).toBeGreaterThan(20_000);
    // ISO-BMFF: an `ftyp` box at offset 4.
    expect(bytes.subarray(4, 8).toString('latin1')).toBe('ftyp');
    if (process.env.MS_FFPROBE !== '0') {
      try {
        const { execFileSync } = await import('node:child_process');
        const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-of', 'json', (await download.path())!]).toString());
        const video = probe.streams.find((st: any) => st.codec_type === 'video');
        expect([video.codec_name, video.width, video.height]).toEqual(['h264', 1920, 1080]);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      }
    }

    // In the Motion Workbench, "render the MP4" in the chat runs the toolbar export.
    await page.getByTestId('film-open-workbench').click();
    await expect(page.locator('.topbar')).toBeVisible({ timeout: 60_000 });
    const agentInput = page.getByPlaceholder(/tell the agent/i);
    await agentInput.fill('render the MP4');
    await agentInput.press('Enter');
    await expect(page.getByText(/Rendering the MP4 with Remotion/)).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('.topbar a[download$=".mp4"]')).toBeVisible({ timeout: 12 * 60 * 1000 });
  });

  test('chat: an attached video is cut into the film, and Fast draft renders a 720p MP4', async ({ page }) => {
    test.setTimeout(15 * 60 * 1000);
    await installStudioSession(page);
    await page.route('**/api/motion-studio/director', (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'OPENAI_KEY_REQUIRED', message: 'No key.' }) }),
    );
    await page.goto(`${BASE_URL}/studio/motion-director/new`);
    await expect(page.locator('.ms-root')).toBeVisible({ timeout: 120_000 });
    await page.getByTestId('motion-prompt-media-input').setInputFiles('public/landing/hero-converge.mp4');
    await expect(page.getByTestId('motion-prompt-media-thumb')).toBeVisible();
    await setEntryDuration(page, '5s');
    await page.getByPlaceholder('Describe your motion video...').fill('Make a launch film for Acme with the Ink Press template');
    await page.getByRole('button', { name: 'Generate' }).click();
    await expect(page.getByTestId('director-plan')).toBeVisible({ timeout: 60_000 });
    await page.getByRole('button', { name: 'Approve & build film' }).click();
    await expect(page.getByTestId('film-result')).toBeVisible({ timeout: 120_000 });
    await expect(page.getByTestId('film-chat')).toContainText('Cutting in 1 attached video');

    await page.getByTestId('film-render-draft').click();
    const link = page.getByTestId('film-download');
    await expect(link).toBeVisible({ timeout: 12 * 60 * 1000 });
    await expect(link).toContainText('draft 1280×720');
    const [download] = await Promise.all([page.waitForEvent('download'), link.click()]);
    expect(download.suggestedFilename()).toMatch(/-draft-720p\.mp4$/);
    const file = (await download.path())!;
    const bytes = await (await import('node:fs/promises')).readFile(file);
    expect(bytes.subarray(4, 8).toString('latin1')).toBe('ftyp');
    try {
      const { execFileSync } = await import('node:child_process');
      const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-of', 'json', file]).toString());
      const video = probe.streams.find((st: any) => st.codec_type === 'video');
      expect([video.codec_name, video.width, video.height]).toEqual(['h264', 1280, 720]);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }

    await page.getByTestId('film-open-workbench').click();
    await expect(page.locator('.topbar')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('.clip', { hasText: 'hero-converge.mp4' })).toHaveCount(1, { timeout: 30_000 });
  });

  test('without an OpenAI key it storyboards from the Ink Press template and says why', async ({ page }) => {
    await installStudioSession(page);
    await page.route('**/api/motion-studio/director', (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'OPENAI_KEY_REQUIRED', message: 'Add your OpenAI API key in SmartVideo GO Settings to use the Motion Studio director.' }) }),
    );
    await page.goto(`${BASE_URL}/studio/motion-director/new`);
    await expect(page.locator('.ms-root')).toBeVisible({ timeout: 120_000 });
    await page.getByPlaceholder('Describe your motion video...').fill('A calm product teaser');
    await page.getByRole('button', { name: 'Generate' }).click();
    await answerInkPressOffer(page, 'director');
    await expect(page.getByTestId('director-plan')).toContainText('INK PRESS STORYBOARD', { timeout: 60_000 });
    await expect(page.getByTestId('film-chat')).toContainText('Add your OpenAI API key');
    await approveFilmAndOpenWorkbench(page);
    await expect(page.locator('.project-name')).toHaveValue('Product — Ink Press');
  });
});
