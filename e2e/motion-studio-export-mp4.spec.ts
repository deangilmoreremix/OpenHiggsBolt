/**
 * G10b — Motion Studio MP4 export.
 *
 * Drives the CURRENT UI end to end:
 *   1. INPUT step  `/studio/motion-studio/new`
 *      - prompt textarea, placeholder "Describe your motion video..."
 *      - aspect-ratio / duration controls
 *      - "Choose Motion Design" recipe picker
 *      - "Generate" button
 *   2. EDITOR       `/studio/motion-studio/`
 *      - "Export video" → the client-side Remotion Web Renderer
 *      - the finished render is offered as a download link
 *
 * The MP4 is written INTO the repo (`docs/motion-studio-evidence/export.mp4`)
 * and the metadata JSON next to it is generated from the ACTUAL file by
 * parsing its MP4 boxes (scripts/motion-studio-mp4-metadata.mjs) — no ffprobe,
 * no ffmpeg, no stale values.
 */
import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  BASE_URL,
  installStudioSession,
  assertNoOnboardingModal,
  ENTRY_PROMPT_PLACEHOLDER,
} from './helpers/motion-studio';

const REPO = path.resolve(__dirname, '..');
const EVIDENCE_DIR = path.join(REPO, 'docs/motion-studio-evidence');
const MP4_PATH = path.join(EVIDENCE_DIR, 'export.mp4');
const METADATA_PATH = path.join(EVIDENCE_DIR, 'export-metadata.json');
const METADATA_SCRIPT = path.join(REPO, 'scripts/motion-studio-mp4-metadata.mjs');

const DESCRIPTION = 'Motion Studio MP4 export — crash zoom punch over a warm paper backdrop';

test.describe('Motion Studio MP4 export', () => {
  test('renders a real MP4 with the Export button and stores it in the repo', async ({
    page,
  }) => {
    test.setTimeout(15 * 60 * 1000);

    await installStudioSession(page, { entrySeen: false });

    // Any native dialog (e.g. "this browser cannot encode MP4") must not block
    // the run — log it and dismiss it.
    page.removeAllListeners('dialog');
    page.on('dialog', (d) => {
      console.log('[export] DIALOG:', d.message());
      d.dismiss();
    });
    page.on('pageerror', (err) => console.log('[export] PAGEERROR:', err.message));

    // ── 1. INPUT step ────────────────────────────────────────────────────
    await page.goto(`${BASE_URL}/studio/motion-studio/new`, { waitUntil: 'load' });
    await assertNoOnboardingModal(page);

    const prompt = page.getByPlaceholder(ENTRY_PROMPT_PLACEHOLDER);
    await expect(prompt).toBeVisible({ timeout: 60_000 });
    await prompt.fill(DESCRIPTION);

    // aspect-ratio + duration controls are part of the current input step
    await expect(page.getByRole('button', { name: '16:9', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '5s', exact: true })).toBeVisible();

    // Pick a shot so the rendered composition is not empty.
    await page.getByRole('button', { name: /Select a recipe/ }).click();
    const search = page.getByPlaceholder('Search recipes...');
    await expect(search).toBeVisible();
    await search.fill('crash-zoom-punch');
    const firstHit = page.locator('button').filter({ hasText: 'crash-zoom-punch' }).first();
    await expect(firstHit).toBeVisible();
    await firstHit.click();

    // ── 2. Generate → the editor ─────────────────────────────────────────
    const generate = page.getByRole('button', { name: /^Generate$/ });
    await expect(generate).toBeEnabled();
    await generate.click();

    await expect(page).toHaveURL(/\/studio\/motion-studio\/?(\?.*)?$/, { timeout: 60_000 });
    const exportButton = page.getByRole('button', { name: 'Export video' });
    await expect(exportButton).toBeVisible({ timeout: 120_000 });

    // ── 3. Render ────────────────────────────────────────────────────────
    await exportButton.click();

    // While rendering the button shows "Exporting N%"; when it is done the
    // component swaps it for a download link ("✓ Exported · Show file").
    const doneLink = page.locator('a[download$=".mp4"]');
    await expect(doneLink).toBeVisible({ timeout: 12 * 60 * 1000 });

    const downloadPromise = page.waitForEvent('download', { timeout: 120_000 });
    await doneLink.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename().toLowerCase()).toMatch(/\.mp4$/);
    console.log('[export] downloaded:', download.suggestedFilename());

    // ── 4. Store the artifact in the repo ────────────────────────────────
    await fs.mkdir(EVIDENCE_DIR, { recursive: true });
    await download.saveAs(MP4_PATH);

    const stat = await fs.stat(MP4_PATH);
    console.log('[export] saved', MP4_PATH, stat.size, 'bytes');
    expect(stat.size, 'the exported MP4 must not be empty').toBeGreaterThan(10 * 1024);

    // The file must really be an MP4 container.
    const header = await fs.readFile(MP4_PATH);
    expect(header.subarray(4, 8).toString('latin1')).toBe('ftyp');

    // ── 5. Metadata from the ACTUAL file ─────────────────────────────────
    // The metadata is produced by the box parser in
    // scripts/motion-studio-mp4-metadata.mjs (no ffprobe / no ffmpeg).
    const raw = execFileSync(process.execPath, [METADATA_SCRIPT, MP4_PATH], {
      encoding: 'utf8',
    });
    const meta = JSON.parse(raw) as {
      size_bytes: number;
      duration_seconds: number;
      width: number;
      height: number;
      video_codec: string;
      ftyp_brand: string;
    };
    console.log('[export] metadata', JSON.stringify(meta, null, 2));

    expect(meta.size_bytes).toBe(stat.size);
    expect(meta.duration_seconds).toBeGreaterThan(0);
    expect(meta.width).toBeGreaterThan(0);
    expect(meta.height).toBeGreaterThan(0);
    expect(meta.video_codec).not.toBe('');
    expect(meta.ftyp_brand).toBeTruthy();

    await fs.writeFile(METADATA_PATH, `${JSON.stringify(meta, null, 2)}\n`);
    console.log('[export] metadata written to', METADATA_PATH);
  });
});
