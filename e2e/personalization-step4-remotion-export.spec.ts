import { test, expect, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Phase 2 — the Remotion designs survive the REAL browser export.
 *
 * Phase 1 proved the five designs render in the LIVE PREVIEW (a Remotion
 * <Player>). It did NOT prove they survive the export: the unit tests
 * (`brandedRenderEvidence.test.ts`, `webExport.*.test.ts`) assert MP4
 * *properties* against a MOCKED `@remotion/web-renderer`, so no design was
 * ever baked into an actual encoded file.
 *
 * This spec closes that gap. It drives the real production app
 * (`/personalization-demo?test=true` → Simple Mode → Step 4), applies the
 * "Animated Headline" Remotion design, and triggers the real in-browser
 * export (`@remotion/web-renderer` → WebCodecs → a real MP4 file).
 *
 * It proves, in the ENCODED FILE and in the ENCODED PIXELS, that:
 *
 *   1. the file is a real video — ISO base media container, H.264 video
 *      track, non-zero size, a positive duration, and videoWidth/videoHeight
 *      equal to the composition dimensions;
 *   2. the composition the web renderer rasterized contained the design
 *      (`[data-remotion-design-id="animated-headline"]`) AND the MIT credit
 *      line (`[data-remotion-design-credit]`) — the credit line is read out
 *      of the DOM the renderer built for the export, not out of the on-screen
 *      preview player;
 *   3. the design's brand-primary pixels are present inside the design's box
 *      in the personalized render, and absent from the SAME region of the
 *      un-personalized render (the control: the identical composition with
 *      the design layer hidden);
 *   4. the ONLY difference between the two encoded frames is inside the
 *      design box (the renders are frame-aligned and the design is the sole
 *      difference);
 *   5. the MIT credit line is inside the encoded frame, not only in the DOM.
 *
 * REQUIREMENTS
 * ------------
 * A production server must already be listening on http://localhost:3111 —
 * the Playwright config's own `webServer` command uses the broken
 * `--turbopack` dev server, so this spec reuses an existing server:
 *
 *     npm run build
 *     npx next start --port 3111
 *
 * The exported files are written to `test-results/remotion-export/` (git
 * ignored) so the raw artifacts can be inspected after a run.
 */

/** The brand primary the design is painted in. */
const BRAND_PRIMARY = { r: 0x29, g: 0xd3, b: 0xf2 };

/** Per-channel tolerance when matching a pixel against the brand primary. */
const BRAND_TOLERANCE = 40;

/** Per-channel tolerance that counts a pixel as "changed" between two frames. */
const CHANGE_TOLERANCE = 24;

/**
 * The frame the comparison samples.
 *
 * 2.0 s = frame 60 at 30 fps. The design's upstream bounce finishes at frame
 * 36 and the layer entrance animation at frame 15, so the headline is at rest
 * and fully opaque; the branded end card only starts at frame 105, so this
 * frame is clean of it.
 */
const SAMPLE_TIME_SECONDS = 2.0;

/** Minimum number of brand-primary pixels the encoded frame must contain. */
const MIN_BRAND_PIXELS = 200;

/** Maximum number of brand-primary pixels the control render may contain. */
const MAX_CONTROL_BRAND_PIXELS = 5;

/** Where the exported artifacts are written. */
const ARTIFACT_DIR = path.join(process.cwd(), 'test-results', 'remotion-export');

/** The design pill label used in this spec. */
const DESIGN_LABEL = 'Animated Headline';

/** The design id the composition renders for that pill. */
const DESIGN_ID = 'animated-headline';

/** Every design the registry ships, in catalog order. */
const ALL_DESIGNS: { id: string; label: string; primarySlotLabel?: string }[] = [
  { id: 'animated-headline', label: 'Animated Headline', primarySlotLabel: 'Headline' },
  { id: 'logo-reveal', label: 'Logo Reveal', primarySlotLabel: 'Business name' },
  { id: 'lower-third', label: 'Lower Third', primarySlotLabel: 'Name' },
  { id: 'promo-cta', label: 'Promo CTA', primarySlotLabel: 'Headline' },
  { id: 'visual-effect', label: 'Bokeh Particles' },
];

/** The text the headline is set to, so the encoded frame has a big glyph block. */
const HEADLINE_TEXT = 'EXPORT PROOF';

/** The colour the design is painted in (the brand primary). */
const BRAND_PRIMARY_HEX = '#29d3f2';

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface ExportProbe {
  exportRootCount: number;
  designId: string | null;
  creditPresent: boolean;
  creditText: string | null;
  designBox: Box | null;
  creditBox: Box | null;
  samples: number;
}

interface ExportResult {
  size: number;
  type: string;
  base64: string;
  probe: ExportProbe;
  file: string;
}

/* -------------------------------------------------------------------------- */
/* Page plumbing                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Records every Blob the app turns into an object URL.
 *
 * The export engine hands the finished file to the user twice: the provider
 * creates `URL.createObjectURL(blob)` for the result panel and
 * `downloadWebExportBlob()` creates a second one for the download anchor.
 * Both point at the same Blob, so the last recorded video blob is the export.
 */
async function installBlobRecorder(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const original = URL.createObjectURL.bind(URL);
    const blobs: Blob[] = [];
    (window as unknown as { __a1Blobs: Blob[] }).__a1Blobs = blobs;
    URL.createObjectURL = (obj: Blob | MediaSource) => {
      try {
        if (obj instanceof Blob) blobs.push(obj);
      } catch {
        /* never let the probe break the app */
      }
      return original(obj);
    };
  });
}

/**
 * Starts the export-DOM probe.
 *
 * `@remotion/web-renderer` builds the composition as a REAL DOM tree and
 * appends it to `document.body` for the lifetime of the render. Every
 * body-level child that exists after the probe started is therefore the
 * exported composition — which is how this spec proves the credit line was in
 * the DOM the renderer actually rasterized (and not only in the on-screen
 * preview player).
 */
async function startExportDomProbe(page: Page): Promise<void> {
  await page.evaluate(() => {
    const marked = new Set<Element>(Array.from(document.body.children));
    const probe: ExportProbe = {
      exportRootCount: 0,
      designId: null,
      creditPresent: false,
      creditText: null,
      designBox: null,
      creditBox: null,
      samples: 0,
    };
    (window as unknown as { __a1Probe: ExportProbe }).__a1Probe = probe;

    const box = (el: Element, base: DOMRect): Box => {
      const r = el.getBoundingClientRect();
      return {
        left: Math.round(r.left - base.left),
        top: Math.round(r.top - base.top),
        width: Math.round(r.width),
        height: Math.round(r.height),
      };
    };

    const timer = setInterval(() => {
      probe.samples += 1;
      for (const child of Array.from(document.body.children)) {
        if (marked.has(child)) continue;
        const design = child.querySelector('[data-remotion-design-id]');
        const credit = child.querySelector('[data-remotion-design-credit]');
        if (!design && !credit) continue;
        probe.exportRootCount += 1;
        const canvas = child.querySelector('canvas');
        const base = (canvas ?? child).getBoundingClientRect();
        if (design) {
          probe.designId = design.getAttribute('data-remotion-design-id');
          probe.designBox = box(design, base);
        }
        if (credit) {
          probe.creditPresent = true;
          probe.creditText = credit.textContent;
          probe.creditBox = box(credit, base);
        }
      }
    }, 40);

    (window as unknown as { __a1StopProbe: () => void }).__a1StopProbe = () => clearInterval(timer);
  });
}

/** Stops the export-DOM probe and returns what it saw. */
async function stopExportDomProbe(page: Page): Promise<ExportProbe> {
  return page.evaluate(() => {
    (window as unknown as { __a1StopProbe?: () => void }).__a1StopProbe?.();
    return (window as unknown as { __a1Probe: ExportProbe }).__a1Probe;
  });
}

/** Opens the demo, jumps to Step 4 and switches the preview into compare mode. */
async function openStep4(page: Page): Promise<void> {
  await gotoWithRetry(page, '/personalization-demo?test=true');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  await dialog.getByRole('button', { name: /Step 4/i }).click();
  await expect(dialog.getByRole('heading', { name: 'Preview and approve' })).toBeVisible();

  // Compare (split) mode mounts BOTH the original and the personalized
  // player, so the personalized composition is in the DOM.
  await dialog.getByRole('button', { name: 'Compare' }).click();
  await expect(page.getByRole('region', { name: 'After: personalized preview' })).toBeVisible();
}

/**
 * Navigates, retrying a couple of times.
 *
 * The production server is a single Node process and the export drives many
 * range requests for the source video, so a cold `goto` can occasionally time
 * out while the server is busy.
 */
async function gotoWithRetry(page: Page, url: string): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.goto(url, { timeout: 60_000 });
      return;
    } catch (error) {
      lastError = error;
      await page.waitForTimeout(2000);
    }
  }
  throw lastError;
}

/**
 * Applies a design and paints it in the brand primary.
 *
 * The design's own colour is set through the product's own layer inspector
 * (`input[aria-label="Text color"]`), which is the only place a user can pick
 * the colour a design is drawn in.
 */
async function applyDesign(
  page: Page,
  design: { id: string; label: string; primarySlotLabel?: string },
  options: { paint?: boolean } = {},
): Promise<void> {
  const dialog = page.getByRole('dialog');
  const pill = dialog.getByRole('button', { name: design.label, exact: true });
  // The pill TOGGLES the design, so it is only clicked when the design is not
  // applied yet — otherwise a restored project would be de-selected.
  if ((await pill.getAttribute('aria-pressed')) !== 'true') {
    await pill.click({ timeout: 30_000 });
  }
  await expect(pill).toHaveAttribute('aria-pressed', 'true');

  // The overlay inspector lists the applied design as a layer.
  await dialog.getByRole('button', { name: 'Select Design' }).click({ timeout: 30_000 });

  // The design's PRIMARY text slot carries the headline. The inspector
  // renders it either as one field per declared slot (labelled with the
  // slot's label) or as a single generic "Layer text" field; a design that
  // declares no text slot at all has no field.
  const primaryField = design.primarySlotLabel
    ? dialog.getByRole('textbox', { name: design.primarySlotLabel })
    : null;
  if (primaryField && (await primaryField.count())) {
    await primaryField.fill(HEADLINE_TEXT, { timeout: 15_000 });
  } else {
    const genericField = dialog.getByRole('textbox', { name: 'Layer text' });
    if (await genericField.count()) {
      await genericField.fill(HEADLINE_TEXT, { timeout: 15_000 });
    }
  }

  if (options.paint !== false) {
    const colour = dialog.locator('input[aria-label="Text color"]');
    await setColour(colour, BRAND_PRIMARY_HEX);
    await expect(colour).toHaveValue(BRAND_PRIMARY_HEX);
  }
}

/**
 * Sets a React-controlled `<input type="color">`.
 *
 * `locator.fill()` is not supported for colour inputs, and assigning
 * `el.value` directly does not notify React — so the native value setter is
 * used and the React-visible `input` event is dispatched.
 */
async function setColour(locator: Locator, hex: string): Promise<void> {
  await locator.evaluate((el, value) => {
    const input = el as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value',
    )?.set;
    if (!setter) throw new Error('cannot set the colour input value');
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, hex);
}

/** Hides or shows the applied design layer through the overlay inspector. */
async function setDesignVisible(page: Page, visible: boolean): Promise<void> {
  const dialog = page.getByRole('dialog');
  await dialog
    .getByRole('button', { name: visible ? 'Show Design' : 'Hide Design' })
    .click({ timeout: 30_000 });
  await expect(
    dialog.getByRole('button', { name: visible ? 'Hide Design' : 'Show Design' }),
  ).toBeVisible();
}

/** Approves the personalization (the export refuses to run without it). */
async function approve(page: Page): Promise<void> {
  const dialog = page.getByRole('dialog');
  await dialog
    .getByRole('button', { name: /Approve this personalization|^Approved$/i })
    .click({ timeout: 30_000 });
}

/**
 * Runs the real in-browser export and returns the produced video.
 *
 * Waits for the app to publish a `video/*` blob, which only happens after
 * `renderMediaOnWeb()` finished encoding.
 */
async function renderBrandedVideo(page: Page): Promise<{ size: number; type: string }> {
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Render branded video' }).click({ timeout: 60_000 });

  await expect
    .poll(
      async () =>
        page.evaluate(
          () =>
            (window as unknown as { __a1Blobs: Blob[] }).__a1Blobs.filter((b) =>
              /^video\//.test(b.type),
            ).length,
        ),
      { timeout: 300_000, intervals: [250, 500, 1000] },
    )
    .toBeGreaterThan(0);

  return page.evaluate(() => {
    const blobs = (window as unknown as { __a1Blobs: Blob[] }).__a1Blobs.filter((b) =>
      /^video\//.test(b.type),
    );
    const blob = blobs[blobs.length - 1];
    return { size: blob.size, type: blob.type };
  });
}

/** Reads the exported video as base64 so it can be moved between pages. */
async function readVideoAsBase64(page: Page): Promise<string> {
  return page.evaluate(async () => {
    const blobs = (window as unknown as { __a1Blobs: Blob[] }).__a1Blobs.filter((b) =>
      /^video\//.test(b.type),
    );
    const blob = blobs[blobs.length - 1];
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
    }
    return btoa(binary);
  });
}

/** Writes the raw exported file next to the test output. */
function writeArtifact(name: string, base64: string): string {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  const file = path.join(ARTIFACT_DIR, name);
  fs.writeFileSync(file, Buffer.from(base64, 'base64'));
  return file;
}

/** Reads the duration and the pixel dimensions of the last exported video. */
async function decodeVideoFacts(
  page: Page,
): Promise<{ duration: number; videoWidth: number; videoHeight: number }> {
  return page.evaluate(async () => {
    const blobs = (window as unknown as { __a1Blobs: Blob[] }).__a1Blobs.filter((b) =>
      /^video\//.test(b.type),
    );
    const blob = blobs[blobs.length - 1];
    const url = URL.createObjectURL(blob);
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    // The element has to be IN the document: a detached media element never
    // presents a frame.
    video.style.cssText =
      'position:fixed;left:-10000px;top:0;width:8px;height:8px;opacity:0;pointer-events:none;';
    document.body.appendChild(video);
    video.src = url;
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error('the produced file could not be decoded'));
      setTimeout(() => reject(new Error('metadata timeout')), 60000);
    });
    const out = {
      duration: video.duration,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
    };
    video.remove();
    URL.revokeObjectURL(url);
    return out;
  });
}

/**
 * Reads the overlay inspector's own view of the applied design.
 *
 * Diagnostic only: the inspector shows one field per declared text slot when
 * the design resolves inside it, and "This design is not registered, so it
 * will not render." when the registry lookup fails there.
 */
async function readInspectorDiagnostics(page: Page): Promise<Record<string, unknown>> {
  return page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('[aria-label^="Select "]')).map(
      (row) => row.textContent,
    );
    const textareas = Array.from(document.querySelectorAll('textarea')).map((t) =>
      t.getAttribute('aria-label'),
    );
    const body = document.body.innerText;
    return {
      layerRows: rows,
      textareas,
      inspectorSaysUnregistered: body.includes('This design is not registered'),
    };
  });
}

/**
 * Runs the whole app-driven export and returns the produced file plus what
 * the export-DOM probe saw.
 */
async function runPersonalizedExport(
  page: Page,
  options: {
    design?: { id: string; label: string };
    hideDesign?: boolean;
    paint?: boolean;
    fileName: string;
  },
): Promise<ExportResult> {
  const design = options.design ?? {
    id: DESIGN_ID,
    label: DESIGN_LABEL,
    primarySlotLabel: 'Headline',
  };
  await installBlobRecorder(page);
  await openStep4(page);
  await applyDesign(page, design, { paint: options.paint });
  // Read the inspector while it is still on screen: the export replaces the
  // whole wizard with the result view.
  const inspector = await readInspectorDiagnostics(page);
  if (options.hideDesign) await setDesignVisible(page, false);
  await approve(page);

  await startExportDomProbe(page);
  const info = await renderBrandedVideo(page);
  const probe = await stopExportDomProbe(page);
  const base64 = await readVideoAsBase64(page);
  const file = writeArtifact(options.fileName, base64);

  // eslint-disable-next-line no-console
  console.log('A1: export done', JSON.stringify({ file, info, probe, inspector }));

  return { ...info, base64, probe, file };
}

/** The container facts of an MP4, read out of the produced bytes. */
function inspectMp4(base64: string): {
  magic: string;
  majorBrand: string;
  hasAvc1: boolean;
  hasMp4a: boolean;
  byteLength: number;
} {
  const bytes = Buffer.from(base64, 'base64');
  const ascii = bytes.toString('latin1');
  return {
    magic: bytes.subarray(4, 8).toString('latin1'),
    majorBrand: bytes.subarray(8, 12).toString('latin1'),
    hasAvc1: ascii.includes('avc1'),
    hasMp4a: ascii.includes('mp4a'),
    byteLength: bytes.length,
  };
}

/* -------------------------------------------------------------------------- */
/* The specs                                                                   */
/* -------------------------------------------------------------------------- */

test.describe('Phase 2 — Remotion designs survive the real browser export', () => {
  test('the browser export produces a real encoded MP4 that contains the design', async ({
    page,
  }) => {
    test.setTimeout(600_000);

    const exported = await runPersonalizedExport(page, {
      fileName: 'personalized-with-design.mp4',
    });

    /* ── The produced file is a real video ──────────────────────────────── */
    expect(exported.size).toBeGreaterThan(0);
    expect(exported.type).toBe('video/mp4');

    const container = inspectMp4(exported.base64);
    // "....ftyp" → an ISO base media file (MP4).
    expect(container.magic).toBe('ftyp');
    // The video track is H.264 ("avc1" sample entry) and the soundtrack is
    // AAC ("mp4a" sample entry) — read out of the produced bytes.
    expect(container.hasAvc1, 'no avc1 (H.264) sample entry in the MP4').toBe(true);
    expect(container.hasMp4a, 'no mp4a (AAC) sample entry in the MP4').toBe(true);
    expect(container.byteLength).toBe(exported.size);

    /* ── The DOM the web renderer built contained the design + credit ───── */
    expect(exported.probe.exportRootCount).toBeGreaterThan(0);
    expect(exported.probe.designId).toBe(DESIGN_ID);
    expect(exported.probe.creditPresent).toBe(true);
    expect(String(exported.probe.creditText)).toContain('Trimora');
    expect(String(exported.probe.creditText)).toContain('MIT');

    const designBox = exported.probe.designBox as Box;
    const creditBox = exported.probe.creditBox as Box;
    expect(designBox.width).toBeGreaterThan(0);
    expect(designBox.height).toBeGreaterThan(0);
    // The credit line is drawn inside the design's own box.
    expect(creditBox.left).toBeGreaterThanOrEqual(designBox.left);
    expect(creditBox.top).toBeGreaterThanOrEqual(designBox.top);
    expect(creditBox.left + creditBox.width).toBeLessThanOrEqual(
      designBox.left + designBox.width + 1,
    );

    /* ── The file decodes as a video of the composition's size ──────────── */
    const decoded = await decodeVideoFacts(page);

    expect(decoded.duration).toBeGreaterThan(0);
    expect(decoded.videoWidth).toBe(1920);
    expect(decoded.videoHeight).toBe(1080);

    // eslint-disable-next-line no-console
    console.log(
      'A1: container + decode evidence:',
      JSON.stringify({ container, decoded, size: exported.size, file: exported.file }, null, 2),
    );
  });

  test('the design is in the encoded pixels, and the un-personalized render has none', async ({
    page,
  }) => {
    test.setTimeout(900_000);

    /* ── 1. The control render: the identical composition, design hidden ── */
    //
    // The control runs in its OWN browser context: the app persists the
    // approved project (including the applied design id) into the browser
    // storage, and a shared context would restore that state into the
    // personalized run and de-select the design again.
    const baseURL = test.info().project.use.baseURL as string;
    const controlContext = await (page.context().browser()!).newContext({ baseURL });
    const controlPage = await controlContext.newPage();

    const control = await runPersonalizedExport(controlPage, {
      hideDesign: true,
      fileName: 'personalized-without-design.mp4',
    });
    await controlContext.close();

    /* ── 2. The personalized render: the same composition, design applied ── */
    const personalized = await runPersonalizedExport(page, {
      fileName: 'personalized-with-design.mp4',
    });

    const designBox = personalized.probe.designBox as Box;
    const creditBox = personalized.probe.creditBox as Box;

    /* ── 3. Decode both files and compare the pixels ────────────────────── */
    // eslint-disable-next-line no-console
    console.log('A1: decoding both exported files and comparing pixels…');
    const result = await page.evaluate(
      async ({
        controlBase64,
        controlType,
        designBox: box,
        creditBox: credit,
        sampleTime,
        brandTol,
        changeTol,
      }) => {
        const decode = async (blob: Blob) => {
          const url = URL.createObjectURL(blob);
          const video = document.createElement('video');
          video.muted = true;
          video.playsInline = true;
          video.preload = 'auto';
          // The element has to be IN the document: a detached media element
          // never presents a frame, so the seek would never be composited.
          video.style.cssText =
            'position:fixed;left:-10000px;top:0;width:8px;height:8px;opacity:0;pointer-events:none;';
          document.body.appendChild(video);
          video.src = url;
          await new Promise<void>((resolve, reject) => {
            video.onloadedmetadata = () => resolve();
            video.onerror = () => reject(new Error('the produced file could not be decoded'));
            setTimeout(() => reject(new Error('metadata timeout')), 60000);
          });
          await new Promise<void>((resolve, reject) => {
            video.onseeked = () => resolve();
            video.onerror = () => reject(new Error('seek failed'));
            video.currentTime = sampleTime;
            setTimeout(() => reject(new Error('seek timeout')), 60000);
          });
          // Wait for the seeked frame to be presented, but never block on it.
          await new Promise<void>((resolve) => {
            const done = setTimeout(resolve, 2000);
            if ('requestVideoFrameCallback' in video) {
              (
                video as HTMLVideoElement & {
                  requestVideoFrameCallback: (cb: () => void) => number;
                }
              ).requestVideoFrameCallback(() => {
                clearTimeout(done);
                resolve();
              });
            } else {
              clearTimeout(done);
              resolve();
            }
          });
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
          ctx.drawImage(video, 0, 0);
          const out = {
            width: canvas.width,
            height: canvas.height,
            duration: video.duration,
            data: ctx.getImageData(0, 0, canvas.width, canvas.height),
          };
          video.remove();
          URL.revokeObjectURL(url);
          return out;
        };

        const bytes = Uint8Array.from(atob(controlBase64), (c) => c.charCodeAt(0));
        const controlBlob = new Blob([bytes], { type: controlType });
        const withDesign = await decode(
          (window as unknown as { __a1Blobs: Blob[] }).__a1Blobs.filter((b) =>
            /^video\//.test(b.type),
          )[0],
        );
        const withoutDesign = await decode(controlBlob);

        const near = (d: number, t: number, tol: number) => Math.abs(d - t) <= tol;
        const brand = { r: 0x29, g: 0xd3, b: 0xf2 };
        const inBox = (x: number, y: number) =>
          x >= box.left && x < box.left + box.width && y >= box.top && y < box.top + box.height;
        const inCredit = (x: number, y: number) =>
          x >= credit.left &&
          x < credit.left + credit.width &&
          y >= credit.top &&
          y < credit.top + credit.height;

        let brandInBox = 0;
        let brandInBoxControl = 0;
        let changedInBox = 0;
        let changedOutsideBox = 0;
        let changedTotal = 0;
        let creditBrighter = 0;
        let creditChanged = 0;
        let sumR = 0;
        let sumG = 0;
        let sumB = 0;

        const a = withDesign.data.data;
        const b = withoutDesign.data.data;
        for (let y = 0; y < withDesign.height; y++) {
          for (let x = 0; x < withDesign.width; x++) {
            const i = (y * withDesign.width + x) * 4;
            const changed =
              Math.abs(a[i] - b[i]) > changeTol ||
              Math.abs(a[i + 1] - b[i + 1]) > changeTol ||
              Math.abs(a[i + 2] - b[i + 2]) > changeTol;
            const isBrand =
              near(a[i], brand.r, brandTol) &&
              near(a[i + 1], brand.g, brandTol) &&
              near(a[i + 2], brand.b, brandTol);
            if (isBrand) {
              sumR += a[i];
              sumG += a[i + 1];
              sumB += a[i + 2];
            }
            if (inBox(x, y)) {
              if (isBrand) brandInBox += 1;
              if (changed) changedInBox += 1;
            } else if (changed) {
              changedOutsideBox += 1;
            }
            if (changed) changedTotal += 1;
            if (inCredit(x, y)) {
              if (changed) creditChanged += 1;
              if (a[i] > b[i] + 12 && a[i + 1] > b[i + 1] + 12 && a[i + 2] > b[i + 2] + 12) {
                creditBrighter += 1;
              }
            }
            if (
              inBox(x, y) &&
              near(b[i], brand.r, brandTol) &&
              near(b[i + 1], brand.g, brandTol) &&
              near(b[i + 2], brand.b, brandTol)
            ) {
              brandInBoxControl += 1;
            }
          }
        }

        return {
          withDesignWidth: withDesign.width,
          withDesignHeight: withDesign.height,
          withDesignDuration: withDesign.duration,
          withoutDesignWidth: withoutDesign.width,
          withoutDesignHeight: withoutDesign.height,
          withoutDesignDuration: withoutDesign.duration,
          brandInBox,
          brandInBoxControl,
          changedInBox,
          changedOutsideBox,
          changedTotal,
          creditChanged,
          creditBrighter,
          meanBrand: brandInBox
            ? {
                r: Math.round(sumR / brandInBox),
                g: Math.round(sumG / brandInBox),
                b: Math.round(sumB / brandInBox),
              }
            : null,
        };
      },
      {
        controlBase64: control.base64,
        controlType: control.type,
        designBox,
        creditBox,
        sampleTime: SAMPLE_TIME_SECONDS,
        brandTol: BRAND_TOLERANCE,
        changeTol: CHANGE_TOLERANCE,
      },
    );

    /* ── 4. The assertions that matter ─────────────────────────────────── */

    // Both files are videos of the composition's size.
    expect(result.withDesignWidth).toBe(1920);
    expect(result.withDesignHeight).toBe(1080);
    expect(result.withDesignDuration).toBeGreaterThan(0);
    expect(result.withoutDesignWidth).toBe(1920);
    expect(result.withoutDesignHeight).toBe(1080);
    expect(result.withoutDesignDuration).toBeGreaterThan(0);

    // The design's brand-primary pixels are in the encoded frame ...
    expect(result.brandInBox).toBeGreaterThanOrEqual(MIN_BRAND_PIXELS);
    // ... and the mean of those pixels really is the brand primary.
    expect(result.meanBrand).not.toBeNull();
    expect(Math.abs(result.meanBrand!.r - BRAND_PRIMARY.r)).toBeLessThanOrEqual(20);
    expect(Math.abs(result.meanBrand!.g - BRAND_PRIMARY.g)).toBeLessThanOrEqual(20);
    expect(Math.abs(result.meanBrand!.b - BRAND_PRIMARY.b)).toBeLessThanOrEqual(20);

    // ... and the identical region of the un-personalized render has none.
    expect(result.brandInBoxControl).toBeLessThanOrEqual(MAX_CONTROL_BRAND_PIXELS);

    // The design is the ONLY difference between the two encoded frames.
    expect(result.changedInBox).toBeGreaterThan(0);
    expect(result.changedOutsideBox).toBeLessThanOrEqual(
      Math.max(50, Math.round(result.changedTotal * 0.05)),
    );

    // The MIT credit line is inside the encoded frame, not only in the DOM.
    expect(result.creditChanged).toBeGreaterThan(0);
    expect(result.creditBrighter).toBeGreaterThan(0);

    // eslint-disable-next-line no-console
    console.log(
      'A1: pixel evidence:',
      JSON.stringify(
        {
          designBox,
          creditBox,
          personalizedSize: personalized.size,
          controlSize: control.size,
          ...result,
          personalizedFile: personalized.file,
          controlFile: control.file,
        },
        null,
        2,
      ),
    );
  });

  test('every registered design exports to a real encoded MP4', async ({ page }) => {
    test.setTimeout(900_000);

    const baseURL = test.info().project.use.baseURL as string;
    const browser = page.context().browser()!;
    const summary: Record<string, unknown>[] = [];

    for (const design of ALL_DESIGNS) {
      // A fresh context per design: the app persists the approved project
      // (including the applied design id), and a shared context would
      // de-select the design again on the next iteration.
      const context = await browser.newContext({ baseURL });
      const designPage = await context.newPage();

      const exported = await runPersonalizedExport(designPage, {
        design,
        fileName: `design-${design.id}.mp4`,
      });

      // The file is a real, encoded MP4.
      expect(exported.size, `${design.id} produced no bytes`).toBeGreaterThan(0);
      expect(exported.type).toBe('video/mp4');
      const container = inspectMp4(exported.base64);
      expect(container.magic, `${design.id} is not an MP4`).toBe('ftyp');
      expect(container.hasAvc1, `${design.id} has no H.264 video track`).toBe(true);

      // The composition the web renderer rasterized was this design and
      // carried the MIT credit line.
      expect(exported.probe.exportRootCount, `${design.id} never reached the renderer`).toBeGreaterThan(
        0,
      );
      expect(exported.probe.designId).toBe(design.id);
      expect(exported.probe.creditPresent, `${design.id} lost the credit line`).toBe(true);
      expect(String(exported.probe.creditText)).toContain('MIT');

      // The file decodes as a video of the composition's size.
      const decoded = await decodeVideoFacts(designPage);
      expect(decoded.duration, `${design.id} has no duration`).toBeGreaterThan(0);
      expect(decoded.videoWidth).toBe(1920);
      expect(decoded.videoHeight).toBe(1080);

      summary.push({
        id: design.id,
        size: exported.size,
        container,
        decoded,
        file: exported.file,
      });

      await context.close();
    }

    // eslint-disable-next-line no-console
    console.log('A1: all-designs evidence:', JSON.stringify(summary, null, 2));
  });
});
