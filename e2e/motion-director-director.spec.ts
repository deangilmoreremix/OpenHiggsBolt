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
const CAPTURE_PRICING = 'https://captures.example.com/page-pricing.png';

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
  const calls = { capture: 0, plan: 0, edit: 0, planCapture: null as Record<string, unknown> | null, planPrompt: '' };
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
        // Upstream-style capture: more routes of the site, and what it says about itself.
        pages: [
          { name: 'home', path: '/', url: CAPTURE_PAGE, width: 3840, height: 3492, layout: { pageH: 1746, sections: [], cards: [] } },
          { name: 'pricing', path: '/pricing', url: CAPTURE_PRICING, width: 3840, height: 2400, layout: { pageH: 1200, sections: [], cards: [] } },
        ],
        cutouts: { nav: null, search: null, button: null },
        emptyPlate: null,
        content: { description: 'Acme ships releases faster.', headline: 'Ship faster with Acme', headings: ['Plan in minutes', 'Release with confidence'], ctas: ['Start free'], nav: ['Pricing'] },
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
    if (body.mode === 'brief') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ brief: { rows: [{ item: 'Positioning', judgment: 'A tool that ships releases faster', evidence: 'the site headline' }, { item: 'Features to show', judgment: 'Planning and releasing', evidence: 'section headings' }], questions: ['Open on the headline “Ship faster with Acme”? I would recommend yes because it is what the site leads with.'] } }) });
      return;
    }
    if (body.mode === 'direction') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ options: { directions: [{ name: 'Clean product', claim: 'Quiet and precise', keywords: ['calm', 'light'], look: 'Inter on near-black', motion: 'slow pushes', why: 'it matches the site', tradeoff: 'less energy' }, { name: 'Bold launch', claim: 'Loud and fast', keywords: ['punchy'], look: 'magenta accents', motion: 'whip cuts', why: 'launch energy', tradeoff: 'busier' }], recommended: 0 } }) });
      return;
    }
    if (body.mode === 'mapping') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ mapping: [{ feature: 'Plan in minutes', firstShot: 'ui-entrance/deck-deal-flyin/DeckDealFlyin', altShot: '', expresses: 'cards dealt onto the page', pageState: 'hero section' }, { feature: 'Release with confidence', firstShot: 'ui-entrance/row-embed/RowEmbed', altShot: '', expresses: 'rows embed into the layout', pageState: 'features section' }] }) });
      return;
    }
    calls.plan++;
    calls.planCapture = body.capture ?? null;
    calls.planPrompt = String(body.prompt ?? '');
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
            { kind: 'shot', recipeId: 'camera/crash-zoom-punch/CrashImpactReal', durationSec: 4.5, headline: 'Your real product', caption: 'LIVE PAGES', transition: 'flash', feature: 'Plan in minutes', action: 'cards deal in', asset: 'hero section of your page', sfx: 'impact on the flash' },
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
    // Each storyboard row says what the scene shows and does.
    await expect(plan).toContainText('shows: hero section of your page');
    await expect(plan).toContainText('sound: impact on the flash');
    await expect(page.getByText('Captured Acme · 2 pages (/, /pricing) · 1 card crops · logo · 1 site image')).toBeVisible();
    await expect(page.getByText('Read the site: "Ship faster with Acme" · 2 sections')).toBeVisible();
    // The director is given the site's own words and every captured route.
    expect(calls.planCapture).toMatchObject({ pages: ['/', '/pricing'], content: { headline: 'Ship faster with Acme', ctas: ['Start free'] } });
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
    // Every captured route is a screen of the product shots, the page asked for first.
    expect(all.find((c: any) => Array.isArray(c.props?.screens))?.props.screens.slice(0, 2)).toEqual([CAPTURE_PAGE, CAPTURE_PRICING]);
    // 4 scenes + 2 caption strips (one per shot; title cards carry theirs as a subtitle)
    // + 1 flash cut + 3 sound effects (one per scene change) + background
    // + 1 site inset (the Hit Counter shot draws its own UI, so it gets a picture of the site)
    await expect(page.locator('.clip')).toHaveCount(12, { timeout: 30_000 });

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
    // The seven workflow steps, Product → Deliver, all ran.
    const steps = page.getByTestId('film-steps');
    for (const id of ['product', 'capture', 'storyboard', 'animate', 'beat', 'qa', 'deliver']) {
      await expect(steps.locator(`[data-step="${id}"]`)).toHaveAttribute('data-state', 'done');
    }
    await expect(steps.locator('[data-step="capture"]')).toContainText('1 card crops · logo · 1 site image');
    await expect(page.getByTestId('film-render')).toBeVisible();
    await captureEvidence(page, `${OUT}/chat-film-desktop.png`, { minBytes: 10 * 1024 });

    await page.getByTestId('film-open-workbench').click();
    await expect(page.locator('.topbar')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('.project-name')).toHaveValue('Acme launch film');
    // The film is saved as a session that carries the chat, so the workbench agent continues it.
    await expect
      .poll(() =>
        page.evaluate(() => {
          const sessions = JSON.parse(window.localStorage.getItem('motion-director:sessions-v1') || '[]');
          const list = Array.isArray(sessions) ? sessions : sessions.sessions ?? [];
          return list.some((x: { name: string; messages: unknown[] }) => x.name === 'Acme launch film' && x.messages.length > 3);
        }),
      )
      .toBe(true);
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

  test('chat: opening the workbench mid-render asks before cancelling the MP4', async ({ page }) => {
    await installStudioSession(page);
    await page.route('**/api/motion-studio/director', (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'OPENAI_KEY_REQUIRED', message: 'No key.' }) }),
    );
    await page.goto(`${BASE_URL}/studio/motion-director/new`);
    await expect(page.locator('.ms-root')).toBeVisible({ timeout: 120_000 });
    await setEntryDuration(page, '5s');
    await page.getByPlaceholder('Describe your motion video...').fill('Make a launch film for Acme with the Ink Press template');
    await page.getByRole('button', { name: 'Generate' }).click();
    await page.getByRole('button', { name: 'Approve & build film' }).click();
    await expect(page.getByTestId('film-result')).toBeVisible({ timeout: 120_000 });
    await page.getByTestId('film-render').click();
    await expect(page.getByTestId('film-render-status')).toBeVisible();

    // Declining keeps the render going and stays in the chat.
    page.once('dialog', (d) => void d.dismiss());
    await page.getByTestId('film-open-workbench').click();
    await expect(page.getByTestId('film-render-status')).toBeVisible();
    await expect(page.locator('.topbar')).toHaveCount(0);

    // Accepting cancels it and opens the workbench.
    page.once('dialog', (d) => void d.accept());
    await page.getByTestId('film-open-workbench').click();
    await expect(page.locator('.topbar')).toBeVisible({ timeout: 60_000 });
  });

  test('the Motion Director tab opens the chat; the workbench has its own URL and a way back', async ({ page }) => {
    await installStudioSession(page, { entrySeen: true });
    await page.route('**/api/motion-studio/director', (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'OPENAI_KEY_REQUIRED', message: 'No key.' }) }),
    );
    // Returning user: the tab still opens the chat, not the last film.
    await page.goto(`${BASE_URL}/studio/motion-director`);
    await expect(page.getByPlaceholder('Describe your motion video...')).toBeVisible({ timeout: 120_000 });
    await expect(page.locator('.topbar')).toHaveCount(0);

    // Build a film and open it: the URL says /workbench, and a reload stays there.
    await setEntryDuration(page, '5s');
    await page.getByPlaceholder('Describe your motion video...').fill('Make a launch film for Acme with the Ink Press template');
    await page.getByRole('button', { name: 'Generate' }).click();
    await approveFilmAndOpenWorkbench(page);
    await expect(page).toHaveURL(/\/studio\/motion-director\/workbench/);
    await page.reload();
    await expect(page.locator('.topbar')).toBeVisible({ timeout: 120_000 });

    // "← Back to chat" goes back, and so does clicking the Motion Director tab.
    await page.getByTestId('workbench-back-to-chat').click();
    await expect(page.getByPlaceholder(/Describe your motion video|Describe another film/)).toBeVisible();
    await expect(page).toHaveURL(/\/studio\/motion-director\/?(\?.*)?$/);
    // The "Continue editing" tile (the current project) reopens the film.
    await page.getByRole('button', { name: /^Open project / }).first().click();
    await expect(page.locator('.topbar')).toBeVisible({ timeout: 60_000 });
    await page.locator('header nav').first().getByRole('button', { name: 'Motion Director', exact: true }).click();
    await expect(page.locator('.topbar')).toHaveCount(0, { timeout: 30_000 });
    await expect(page.getByPlaceholder(/Describe your motion video|Describe another film/)).toBeVisible();
    // Browser Back returns to the workbench URL, and the editor with it.
    await page.goBack();
    await expect(page).toHaveURL(/\/studio\/motion-director\/workbench/);
    await expect(page.locator('.topbar')).toBeVisible({ timeout: 30_000 });
  });

  test('chat: Stop halts a film being built and keeps the storyboard', async ({ page }) => {
    await installStudioSession(page);
    await page.route('**/api/motion-studio/director', (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'OPENAI_KEY_REQUIRED', message: 'No key.' }) }),
    );
    await page.goto(`${BASE_URL}/studio/motion-director/new`);
    await expect(page.locator('.ms-root')).toBeVisible({ timeout: 120_000 });
    await page.getByPlaceholder('Describe your motion video...').fill('Make a launch film for Acme with the Ink Press template');
    await page.getByRole('button', { name: 'Generate' }).click();
    await expect(page.getByTestId('director-plan')).toBeVisible({ timeout: 60_000 });
    await page.getByRole('button', { name: 'Approve & build film' }).click();
    await page.getByTestId('film-stop').click();
    await expect(page.getByTestId('film-chat')).toContainText('Stopped building the film');
    await expect(page.getByTestId('film-result')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Approve & build film' })).toBeEnabled();
  });

  test('picking a template goes straight back to the chat box', async ({ page }) => {
    await installStudioSession(page);
    await page.goto(`${BASE_URL}/studio/motion-director/new`);
    await expect(page.locator('.ms-root')).toBeVisible({ timeout: 120_000 });
    await page.getByRole('button', { name: /Select a recipe/ }).click();
    const dialog = page.getByRole('dialog', { name: 'Motion Templates' });
    await dialog.getByPlaceholder('Search recipes...').fill('deck-deal-flyin');
    await dialog.locator('button').filter({ hasText: /Deck Deal Flyin/i }).first().click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByPlaceholder('Describe your motion video...')).toBeFocused();
    await expect(page.getByRole('button', { name: /Remove Deck Deal Flyin/i })).toBeVisible();
  });

  test('a film made of picked shots has only those shots, with the site\'s pictures and words', async ({ page }) => {
    await installStudioSession(page);
    const calls = await mockDirector(page);
    await page.goto(`${BASE_URL}/studio/motion-director/new`);
    await expect(page.locator('.ms-root')).toBeVisible({ timeout: 120_000 });
    await setEntryDuration(page, '30s');
    // Pick two shots in Templates.
    for (const name of ['Deck Deal Flyin', 'Row Embed']) {
      await page.getByRole('button', { name: /Templates/ }).first().click();
      const dialog = page.getByRole('dialog', { name: 'Motion Templates' });
      await dialog.getByPlaceholder('Search recipes...').fill(name.toLowerCase().replace(/ /g, '-'));
      await dialog.locator('button').filter({ hasText: new RegExp(name, 'i') }).first().click();
      await expect(dialog).toHaveCount(0);
    }
    await page.getByPlaceholder('Describe your motion video...').fill('A launch film for https://acme.example.com');
    await page.getByRole('button', { name: 'Generate' }).click();
    const plan = page.getByTestId('director-plan');
    await expect(plan).toBeVisible({ timeout: 60_000 });
    // The director's mock returns Crash Zoom Punch and Hit Counter too; only the picks stay.
    await expect(plan).toContainText('Deck Deal Flyin');
    await expect(plan).toContainText('Row Embed');
    await expect(plan).not.toContainText('Crash Impact Real');
    await expect(plan).not.toContainText('Hit Counter');
    // The picks repeat to fill the length (about one scene per 4 s), not one scene each.
    await expect(plan).toContainText('8 scenes · 30s');
    expect(calls.planCapture).toMatchObject({ content: { headline: 'Ship faster with Acme' } });
    // The picks were used up: the next film starts with none.
    await expect(page.getByRole('button', { name: /Remove Deck Deal Flyin/i })).toHaveCount(0);
  });

  test('a shot that draws its own UI still shows the site: a picture inset on that scene', async ({ page }) => {
    await installStudioSession(page);
    await mockDirector(page);
    await page.goto(`${BASE_URL}/studio/motion-director/new`);
    await expect(page.locator('.ms-root')).toBeVisible({ timeout: 120_000 });
    await setEntryDuration(page, '10s');
    await page.getByRole('button', { name: /Templates/ }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Motion Templates' });
    await dialog.getByPlaceholder('Search recipes...').fill('hit-counter');
    await dialog.locator('button').filter({ hasText: /Hit Counter/i }).first().click();
    await page.getByPlaceholder('Describe your motion video...').fill('A launch film for https://acme.example.com');
    await page.getByRole('button', { name: 'Generate' }).click();
    await expect(page.getByTestId('director-plan')).toBeVisible({ timeout: 60_000 });
    await approveFilmAndOpenWorkbench(page);
    const savedInsets = () =>
      page.evaluate(() => (JSON.parse(localStorage.getItem('motion-director:project-v1') || '{}').tracks ?? []).flatMap((t: any) => t.clips).filter((c: any) => c.cardId === 'site-inset'));
    await expect.poll(async () => (await savedInsets()).length, { timeout: 15_000 }).toBeGreaterThan(0);
    const insets = await savedInsets();
    expect(String(insets[0].props.file)).toMatch(/^https:\/\/captures\.example\.com\//);
  });

  test('typing a different site while a storyboard is open starts a new film; New film clears the chat', async ({ page }) => {
    await installStudioSession(page);
    const calls = await mockDirector(page);
    await page.goto(`${BASE_URL}/studio/motion-director/new`);
    await expect(page.locator('.ms-root')).toBeVisible({ timeout: 120_000 });
    await setEntryDuration(page, '10s');
    await page.getByPlaceholder('Describe your motion video...').fill('A launch film for https://acme.example.com');
    await page.getByRole('button', { name: 'Generate' }).click();
    await answerInkPressOffer(page, 'director');
    await expect(page.getByTestId('director-plan')).toBeVisible({ timeout: 60_000 });
    expect(calls.capture).toBe(1);
    // A different company: a new film (captured again), not a revision of the one on the table.
    await page.getByPlaceholder(/Tell me what to change/).fill('make a promo for https://globex.example.com');
    await page.getByRole('button', { name: 'Send' }).click();
    // A new film asks the Ink Press question again, then captures the new site.
    await answerInkPressOffer(page, 'director');
    await expect.poll(() => calls.capture, { timeout: 60_000 }).toBe(2);
    await expect(page.getByTestId('director-plan')).toBeVisible({ timeout: 60_000 });
    // Start over: the conversation is cleared.
    await page.getByTestId('film-new').click();
    await expect(page.getByTestId('film-chat')).toHaveCount(0);
    await expect(page.getByPlaceholder('Describe your motion video...')).toBeVisible();
  });

  test('clicking a recipe in the workbench library goes to the chat with it picked', async ({ page }) => {
    await installStudioSession(page, { entrySeen: true });
    await page.goto(`${BASE_URL}/studio/motion-director/workbench`);
    await expect(page.locator('.topbar')).toBeVisible({ timeout: 120_000 });
    await page.getByPlaceholder('Search recipes...').fill('deck-deal-flyin');
    const card = page.getByTestId('library-recipe-card').first();
    // Add still puts it on the timeline without leaving the editor.
    const clips = await page.locator('.clip').count();
    await page.locator('.library-item').first().getByRole('button', { name: /^Add/ }).first().dispatchEvent('click');
    await expect(page.locator('.clip')).toHaveCount(clips + 1);
    await page.waitForTimeout(400);
    await expect(page.locator('.topbar')).toBeVisible();
    // A single click goes to the chat, with the shot picked and the cursor in the box.
    await card.click();
    await expect(page.getByPlaceholder(/Describe your motion video|Describe another film/)).toBeFocused({ timeout: 30_000 });
    await expect(page.getByRole('button', { name: /Remove Deck Deal Flyin/i })).toBeVisible();
    await expect(page).toHaveURL(/\/studio\/motion-director\/?(\?.*)?$/);
    // Keyboard: Enter on a focused library card does the same.
    await page.goto(`${BASE_URL}/studio/motion-director/workbench`);
    await expect(page.locator('.topbar')).toBeVisible({ timeout: 60_000 });
    await page.getByPlaceholder('Search recipes...').fill('row-embed');
    await page.getByTestId('library-recipe-card').first().focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: /Remove Row Embed/i })).toBeVisible({ timeout: 30_000 });
  });

  test('work it out together: brief → direction → shot mapping → storyboard, each confirmed', async ({ page }) => {
    await installStudioSession(page);
    const calls = await mockDirector(page);
    await page.goto(`${BASE_URL}/studio/motion-director/new`);
    await expect(page.locator('.ms-root')).toBeVisible({ timeout: 120_000 });
    await assertNoOnboardingModal(page);
    await page.getByPlaceholder('Describe your motion video...').fill('I want a promo for https://acme.example.com with a screenshot for each part of the page');
    await page.getByRole('button', { name: 'Generate' }).click();
    await page.getByTestId('cocreate-start').click();

    const chat = page.getByTestId('film-chat');
    const choices = page.getByTestId('guided-choices');
    await expect(choices).toHaveAttribute('data-step', 'brief', { timeout: 60_000 });
    await expect(chat).toContainText('Product check');
    await expect(chat).toContainText('Positioning: A tool that ships releases faster');
    await expect(chat).toContainText('To confirm');
    await page.getByTestId('guided-accept').click();

    await expect(choices).toHaveAttribute('data-step', 'direction', { timeout: 60_000 });
    await expect(chat).toContainText('Visual directions');
    await expect(chat).toContainText('B. Bold launch');
    await choices.getByRole('button', { name: 'Use B' }).click();

    await expect(choices).toHaveAttribute('data-step', 'mapping', { timeout: 60_000 });
    await expect(chat).toContainText('Plan in minutes → Deck Deal Flyin');
    await expect(chat).toContainText('Release with confidence → Row Embed');
    await page.getByTestId('guided-accept').click();

    const plan = page.getByTestId('director-plan');
    await expect(plan).toBeVisible({ timeout: 60_000 });
    // Only the mapped shots; the storyboard rows say what each scene shows and does.
    await expect(plan).toContainText('Deck Deal Flyin');
    await expect(plan).toContainText('Row Embed');
    await expect(plan).not.toContainText('Crash Impact Real');
    expect(calls.planPrompt).toContain('Bold launch');
    expect(calls.planPrompt).toContain('Plan in minutes');
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
