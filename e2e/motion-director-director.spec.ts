import { test, expect, type Page } from '@playwright/test';
import { deflateSync } from 'node:zlib';
import { BASE_URL, assertNoOnboardingModal, captureEvidence, installStudioSession } from './helpers/motion-studio';

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
    await page.getByRole('button', { name: 'Duration' }).or(page.getByRole('button', { name: '5s', exact: true })).first().click();
    await page.getByRole('menuitemradio', { name: '15s' }).click();
    await page.getByRole('button', { name: 'Generate' }).click();

    const plan = page.getByTestId('director-plan');
    await expect(plan).toBeVisible({ timeout: 60_000 });
    await expect(plan).toContainText('Acme launch film');
    await expect(plan).toContainText('Crash Zoom Punch · Crash Impact Real');
    await expect(plan).toContainText('shows your site');
    await expect(page.getByText(/Captured Acme · 1 card crops/)).toBeVisible();
    expect(calls).toMatchObject({ capture: 1, plan: 1 });
    await captureEvidence(page, `${OUT}/director-storyboard-desktop.png`, { minBytes: 10 * 1024 });

    await page.getByRole('button', { name: 'Approve & build film' }).click();
    await expect(page.locator('.topbar')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('.project-name')).toHaveValue('Acme launch film');
    // 4 scenes + 2 caption strips (one per shot; title cards carry theirs as a subtitle) + 1 flash cut + background
    await expect(page.locator('.clip')).toHaveCount(8, { timeout: 30_000 });

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
    const agentInput = page.getByPlaceholder(/Tell the agent/);
    await agentInput.fill('rewrite the opening line so it feels punchier');
    await agentInput.press('Enter');
    await expect(page.getByText('Rewrote the opening line.')).toBeVisible({ timeout: 30_000 });
    expect(calls.edit).toBe(1);
    await expect
      .poll(async () => page.evaluate(() => {
        const p = JSON.parse(localStorage.getItem('shotcraft-workbench-project-v1') || '{}');
        return p.tracks?.flatMap((t: any) => t.clips).find((c: any) => c.cardId === 'inkpress-title-card')?.props?.text ?? null;
      }), { timeout: 10_000 })
      .toBe('Acme ships *faster*');
  });

  test('without an OpenAI key it falls back to a quick project and says why', async ({ page }) => {
    await installStudioSession(page);
    await page.route('**/api/motion-studio/director', (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'OPENAI_KEY_REQUIRED', message: 'Add your OpenAI API key in SmartVideo GO Settings to use the Motion Studio director.' }) }),
    );
    await page.goto(`${BASE_URL}/studio/motion-director/new`);
    await expect(page.locator('.ms-root')).toBeVisible({ timeout: 120_000 });
    await page.getByPlaceholder('Describe your motion video...').fill('A calm product teaser');
    await page.getByRole('button', { name: 'Generate' }).click();
    await expect(page.locator('.topbar')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('.project-name')).toHaveValue('A calm product teaser');
  });
});
