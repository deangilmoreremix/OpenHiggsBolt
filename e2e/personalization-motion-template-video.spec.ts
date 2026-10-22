import { test, expect, type Locator, type Page } from '@playwright/test';
import { MOTION_TEMPLATES, MOTION_TEMPLATE_CARDS } from '../src/data/motionRecipeCatalog';

const BASE = process.env.DEMO_BASE_URL || 'http://localhost:3112';

/**
 * The Motion Studio (ShotCraft) preview flow in Step 2 of the Personalization
 * Modal.
 *
 * Regression under test: every Motion Studio card used to render a still
 * `<img>`/SVG placeholder, so selecting a recipe never showed a moving
 * picture. The catalog now carries the real upstream ShotCraft MP4 clip for
 * every style, and the SELECTED recipe card must host a playable `<video>`.
 *
 * The grid unit is the RECIPE CARD (124 of them, `MOTION_TEMPLATE_CARDS`) —
 * the 150-clip sweep lives in the catalog data test
 * (`src/data/__tests__/motionRecipeCatalog.preview.test.ts`). Card picks here
 * are deterministic: the cards array is ordered and begins
 * `camera/basic-3d-scene`, `camera/crash-zoom-punch` (asserted there).
 */

async function clickViaElement(locator: Locator) {
  const el = await locator.elementHandle();
  if (!el) throw new Error(`element not found for click: ${locator}`);
  await el.evaluate((e) => e.click());
}

/** Open the modal and advance to Step 2 (the video-source picker). */
async function openStep2(page: Page) {
  await page.goto(`${BASE}/personalization-demo?test=true`, { waitUntil: 'domcontentloaded' });

  const dialog = page.getByRole('dialog', { name: 'Personalize this demo' });
  await expect(dialog).toBeVisible({ timeout: 20000 });

  // The clicks below are synthetic (`element.click()`), which is a no-op until
  // React has hydrated. On a cold dev server the bundle is still compiling, so
  // wait for the network to settle and for the wizard to be interactive.
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  await expect(dialog.getByRole('button', { name: /Continue/i })).toBeVisible({ timeout: 20000 });

  const continueBtn = dialog.getByRole('button', { name: /Continue/i });
  await expect(continueBtn).toBeVisible({ timeout: 10000 });
  await clickViaElement(continueBtn);

  // Step 2 renders the source-picker tablist.
  await expect(dialog.getByRole('tab', { name: /Motion Studio/i })).toBeVisible({ timeout: 10000 });
  return dialog;
}

test.describe('Personalization Modal — Motion Studio template video', () => {
  test('selecting a Motion Studio recipe plays the real ShotCraft clip', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    const dialog = await openStep2(page);

    // Open the Motion Studio tab.
    const motionTab = dialog.getByRole('tab', { name: /Motion Studio/i });
    await clickViaElement(motionTab);

    // The full recipe-card library renders (124 cards).
    const cards = dialog.getByTestId('motion-template-card');
    await expect(cards.first()).toBeVisible({ timeout: 20000 });
    await expect(cards).toHaveCount(124, { timeout: 20000 });

    // Before selecting: no player anywhere in the grid, and the first card
    // still shows a still poster (not a video).
    await expect(dialog.getByTestId('motion-template-player')).toHaveCount(0);

    const firstTemplate = MOTION_TEMPLATE_CARDS[0];
    expect(firstTemplate.preview, 'catalog entry must carry a preview clip').toBeTruthy();

    const firstCard = dialog.locator(
      `[data-testid="motion-template-card"][data-template-id="${firstTemplate.id}"]`,
    );
    await expect(firstCard).toHaveCount(1);

    // Select the first template.
    const useButton = firstCard.getByTestId('motion-template-use');
    await expect(useButton).toBeVisible({ timeout: 10000 });
    await clickViaElement(useButton);

    // The selected card now hosts a real <video>.
    const player = firstCard.getByTestId('motion-template-player');
    await expect(player).toHaveCount(1, { timeout: 15000 });

    // Exactly one card in the whole grid carries a player.
    await expect(dialog.getByTestId('motion-template-player')).toHaveCount(1);

    // The player points at the catalog's real ShotCraft MP4.
    const src = await player.getAttribute('src');
    expect(src).toBeTruthy();
    expect(src).toContain(firstTemplate.preview!);

    // The still poster is not mounted at the same time.
    await expect(firstCard.locator('img')).toHaveCount(0);

    // Inline autoplay configuration.
    const flags = await player.evaluate((v: HTMLVideoElement) => ({
      autoplay: v.autoplay,
      muted: v.muted,
      loop: v.loop,
      controls: v.controls,
      playsInline: v.playsInline,
    }));
    expect(flags).toEqual({ autoplay: true, muted: true, loop: true, controls: true, playsInline: true });

    // Wait for the clip to decode. The clip is served through the
    // same-origin proxy, so the first load also pays the upstream GitHub
    // round-trip; a cold upstream can take a while. If the element reports a
    // media error it is reloaded, because a failed first range request is not
    // retried by the browser on its own.
    const ready = await player.evaluate(async (v: HTMLVideoElement) => {
      const deadline = Date.now() + 45000;
      while (Date.now() < deadline) {
        if (v.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) return true;
        if (v.error) {
          v.load();
        }
        await new Promise((r) => setTimeout(r, 150));
      }
      return false;
    });
    expect(ready, 'video must reach HAVE_CURRENT_DATA').toBe(true);

    const dims = await player.evaluate((v: HTMLVideoElement) => ({ w: v.videoWidth, h: v.videoHeight }));
    console.log(`  motion template dimensions: ${dims.w}x${dims.h}`);
    expect(dims.w).toBeGreaterThan(0);
    expect(dims.h).toBeGreaterThan(0);

    // Playback actually advances.
    await player.evaluate((v: HTMLVideoElement) => v.play());
    const playback = await player.evaluate(async (v: HTMLVideoElement) => {
      const start = v.currentTime;
      const deadline = Date.now() + 10000;
      while (Date.now() < deadline) {
        if (v.currentTime > start + 0.05) {
          return { advanced: true, start, end: v.currentTime, paused: v.paused, error: v.error?.message ?? null };
        }
        await new Promise((r) => setTimeout(r, 100));
      }
      return { advanced: false, start, end: v.currentTime, paused: v.paused, error: v.error?.message ?? null };
    });
    console.log(`  motion template playback: ${JSON.stringify(playback)}`);
    expect(playback.error, 'video must not report a media error').toBeNull();
    expect(playback.advanced, 'currentTime must advance').toBe(true);
    expect(playback.paused).toBe(false);

    // Switching to another template moves the player to the new clip.
    const secondTemplate = MOTION_TEMPLATE_CARDS[1];
    const secondCard = dialog.locator(
      `[data-testid="motion-template-card"][data-template-id="${secondTemplate.id}"]`,
    );
    await clickViaElement(secondCard.getByTestId('motion-template-use'));

    await expect(dialog.getByTestId('motion-template-player')).toHaveCount(1);
    await expect(firstCard.getByTestId('motion-template-player')).toHaveCount(0);
    const secondSrc = await dialog.getByTestId('motion-template-player').getAttribute('src');
    expect(secondSrc).toContain(secondTemplate.preview!);

    // The old clip must not have been left with an error.
    const errors = await page.locator('video').evaluateAll((nodes) =>
      nodes.map((n) => (n as HTMLVideoElement).error?.message ?? null),
    );
    console.log(`  video errors after switch: ${JSON.stringify(errors)}`);
    expect(errors.filter(Boolean)).toEqual([]);

    // No hydration / nested-button errors.
    const nestedButtonErrors = consoleErrors.filter((err) => /cannot contain a nested/i.test(err));
    expect(nestedButtonErrors).toEqual([]);
  });

  test('the selected Motion Studio clip becomes the wizard preview video', async ({ page }) => {
    const dialog = await openStep2(page);

    // Open the Motion Studio tab and pick the first recipe card.
    await clickViaElement(dialog.getByRole('tab', { name: /Motion Studio/i }));
    const firstTemplate = MOTION_TEMPLATE_CARDS[0];
    const firstCard = dialog.locator(
      `[data-testid="motion-template-card"][data-template-id="${firstTemplate.id}"]`,
    );
    await expect(firstCard).toBeVisible({ timeout: 20000 });
    await clickViaElement(firstCard.getByTestId('motion-template-use'));

    // The provider must keep a non-empty preview URL — otherwise the
    // provider's `previewVideo` filter discards it and the wizard falls back
    // to the original demo source.
    await page.waitForFunction(
      (clip: string) => {
        const raw = window.localStorage.getItem('smartvideo_preview_state_anonymous_1');
        if (!raw) return false;
        try {
          return JSON.stringify(JSON.parse(raw)).includes(clip);
        } catch {
          return false;
        }
      },
      firstTemplate.preview!,
      { timeout: 15000 },
    ).catch(() => {
      // The anonymous session does not always mirror the preview state to
      // localStorage; the Step-4 assertion below is the authoritative check.
    });

    // Advance to Step 3, then to the Step 4 preview.
    const continueBtn = dialog.getByRole('button', { name: /Continue/i });
    await expect(continueBtn).toBeVisible({ timeout: 10000 });
    await clickViaElement(continueBtn);

    const previewMyVideoBtn = page.getByRole('button', { name: /Preview my video/i });
    await expect(previewMyVideoBtn).toBeVisible({ timeout: 15000 });
    await clickViaElement(previewMyVideoBtn);

    await expect(dialog.getByRole('heading', { name: /Preview and approve/i })).toBeVisible({ timeout: 15000 });

    // The Step 4 before/after preview is a Remotion <Player>, which renders
    // into a <canvas> — there is no DOM <video> element to read a `src` from.
    // The clip is proven to be loaded and playing by two signals:
    //   1. the same-origin proxy served the ShotCraft clip with a 206
    //      (range) response, which is what the player slices to decode, and
    //   2. the composition canvas changes between two samples once the
    //      preview is playing (frames are actually being drawn).
    const clipResponses: number[] = [];
    page.on('response', (res) => {
      if (res.url().includes('/api/media/shotcraft/')) clipResponses.push(res.status());
    });

    const playPreview = page.getByRole('button', { name: /Play preview/i });
    await expect(playPreview.first()).toBeVisible({ timeout: 15000 });
    await clickViaElement(playPreview.first());

    const probe = await page.evaluate(async () => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return { found: false as const };
      const sample = () => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let sum = 0;
        for (let i = 0; i < data.length; i += 400) sum += data[i] + data[i + 1] + data[i + 2];
        return sum;
      };
      // Poll until the composition advances. The first load of the clip goes
      // through the proxy to the upstream release, so a fixed short window can
      // miss the very first frames on a cold cache.
      const deadline = Date.now() + 25000;
      const first = sample();
      let second = first;
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 500));
        second = sample();
        if (first !== null && second !== null && first !== second) break;
      }
      return { found: true as const, first, second };
    });

    expect(probe.found, 'the preview must render a composition canvas').toBe(true);
    if (probe.found) {
      expect(probe.first, 'the canvas must contain rendered pixels').not.toBeNull();
      expect(
        probe.first !== probe.second,
        'the composition canvas must change between samples — the clip is playing',
      ).toBe(true);
    }

    // The clip must have been served (206 = range request satisfied).
    expect(clipResponses.length, 'the proxy must have served the ShotCraft clip').toBeGreaterThan(0);
    expect(clipResponses.some((s) => s === 200 || s === 206)).toBe(true);
  });

  test('the catalog carries a ShotCraft clip for every shot and the proxy serves them', async () => {
    const withPreview = MOTION_TEMPLATES.filter((t) => Boolean(t.preview));

    console.log(`MOTION_TEMPLATES total: ${MOTION_TEMPLATES.length}`);
    console.log(`  with a preview MP4 URL: ${withPreview.length}`);

    // Catalog-level counts: 150 shot clips upstream + 124 recipe cards in the
    // grid. The 150-clip × upstream parity sweep (style match + JPEG posters)
    // lives in `src/data/__tests__/motionRecipeCatalog.preview.test.ts` — it is
    // a data check, not a browser check, and running 150 upstream reads here
    // starves the playback tests in the same run.
    expect(MOTION_TEMPLATES.length).toBe(150);
    expect(withPreview.length).toBe(MOTION_TEMPLATES.length);
    expect(MOTION_TEMPLATE_CARDS.length).toBe(124);
    expect(MOTION_TEMPLATE_CARDS.filter((c) => Boolean(c.preview)).length).toBe(124);

    // Every preview must point at the same-origin ShotCraft proxy.
    for (const template of withPreview) {
      expect(template.preview).toMatch(/^\/api\/media\/shotcraft\/[a-z0-9][a-z0-9-]*\.mp4$/);
    }

    // Here we only prove the PROXY path works end to end: a range GET must
    // return 206 with a real MP4 header, and an unknown key must 404/400
    // rather than serve something else.
    const sample = withPreview.slice(0, 5);
    const results = await Promise.all(
      sample.map(async (template) => {
        const res = await fetch(`${BASE}${template.preview!}`, {
          headers: { Range: 'bytes=0-7' },
          redirect: 'follow',
        });
        const buf = new Uint8Array(await res.arrayBuffer());
        const isMp4 = buf.length >= 4 && String.fromCharCode(...buf.slice(4, 8)) === 'ftyp';
        return { id: template.id, status: res.status, isMp4 };
      }),
    );

    console.log(`ShotCraft proxy sample: ${results.filter((r) => r.status === 206 && r.isMp4).length}/${results.length} served`);
    for (const r of results) {
      expect(r.status, `${r.id} must be served as a range response`).toBe(206);
      expect(r.isMp4, `${r.id} must be a real MP4`).toBe(true);
    }

    // An unknown style key must not resolve to anything.
    const missing = await fetch(`${BASE}/api/media/shotcraft/not-a-real-style-key.mp4`, {
      headers: { Range: 'bytes=0-7' },
    });
    expect([404, 400]).toContain(missing.status);

    // A traversal attempt must be rejected outright.
    const traversal = await fetch(`${BASE}/api/media/shotcraft/${encodeURIComponent('../../etc/passwd')}.mp4`);
    expect([400, 404]).toContain(traversal.status);
  });
});
