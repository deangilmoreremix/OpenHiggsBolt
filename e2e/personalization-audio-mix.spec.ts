import { test, expect, type Page } from '@playwright/test';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/**
 * The audio mix in the real modal and the real in-browser export. Offline: the same-origin demo clip (which has sound), a logo,
 * and two pure test tones generated with ffmpeg. Exports MP4s and measures their audio with ffmpeg's volumedetect:
 *   1. video sound off + a music track starting at 1 s with a 1 s fade in, 1 s fade out and half volume: silent before 1 s,
 *      ramping, steady at about half the tone's level, fading out at the end;
 *   2. a muted track leaves only the video's sound; soloing the track leaves only the track.
 * No paid API is called. Needs `ffmpeg` on PATH.
 */
const OUT = process.env.AUDIO_OUT_DIR ?? path.join(process.cwd(), 'test-results', 'audio-mix');
const CLIP = path.join(process.cwd(), 'public/media/minimax-h3/videos/luxury-perfume-commercial.webm');
const LOGO = path.join(process.cwd(), 'public/motion-studio/previews/IconFlipBloomLogo-a.jpg');
const dataUrl = (file: string) => `data:image/jpeg;base64,${fs.readFileSync(file).toString('base64')}`;

function tone(file: string, hz: number) {
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', `sine=frequency=${hz}:duration=8`, '-af', 'volume=0.8', '-ar', '44100', file]);
}
/** Mean volume in dB of [from, from+len] seconds of a media file. */
function meanDb(file: string, from: number, len: number): number {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-ss', String(from), '-t', String(len), '-i', file, '-af', 'volumedetect', '-vn', '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
  const m = /mean_volume:\s*(-?[\d.]+) dB/.exec(r);
  return m ? Number(m[1]) : -99;
}

async function seed(page: Page) {
  await page.addInitScript(() => {
    const original = URL.createObjectURL.bind(URL);
    const blobs: Blob[] = [];
    (window as unknown as { __blobs: Blob[] }).__blobs = blobs;
    URL.createObjectURL = (obj: Blob | MediaSource) => {
      try { if (obj instanceof Blob) blobs.push(obj); } catch { /* ignore */ }
      return original(obj);
    };
  });
  await page.goto('/personalization-demo?test=true', { timeout: 60_000 });
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: /Advanced Editing/i }).click();
  await dialog.getByRole('button', { name: 'My Business' }).click();
  await dialog.getByRole('button', { name: /Next: Profile/ }).click();
  await page.fill('input[placeholder="ABC Roofing"]', 'Rascop And Associates LLC');
  await dialog.getByRole('button', { name: /Next: Your assets/ }).click();
  const logoCard = page.locator('article.asset-card').filter({ hasText: '2. LOGO' });
  await logoCard.getByPlaceholder('Paste logo URL and press Enter').fill(dataUrl(LOGO));
  await page.locator('button:has-text("Add Logo URL")').first().dispatchEvent('click');
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: /Simple Mode/i }).click();
  await dialog.getByRole('button', { name: /Step 3/i }).click();
  await dialog.getByRole('button', { name: /Step 4/i }).click();
  await expect(dialog.getByRole('heading', { name: 'Preview and approve' })).toBeVisible();
}

async function addTrack(page: Page, kind: 'music' | 'voiceover', file: string) {
  const dialog = page.getByRole('dialog');
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), dialog.getByTestId(`audio-add-${kind}`).click()]);
  await chooser.setFiles(file);
}

async function renderMp4(page: Page, name: string): Promise<string> {
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: /Approve this personalization|^Approved$/i }).click({ timeout: 30_000 });
  const rights = page.getByTestId('guided-rights-confirm').locator('input');
  if (await rights.count()) await rights.check();
  const before = await page.evaluate(() => (window as unknown as { __blobs: Blob[] }).__blobs.filter((b) => /^video\//.test(b.type)).length);
  await dialog.getByRole('button', { name: /Render branded video|Render again/ }).first().click({ timeout: 60_000 });
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __blobs: Blob[] }).__blobs.filter((b) => /^video\//.test(b.type)).length), { timeout: 300_000, intervals: [1000] })
    .toBeGreaterThan(before);
  const b64 = await page.evaluate(async () => {
    const blobs = (window as unknown as { __blobs: Blob[] }).__blobs.filter((b) => /^video\//.test(b.type));
    const bytes = new Uint8Array(await blobs[blobs.length - 1].arrayBuffer());
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)));
    return btoa(s);
  });
  const file = path.join(OUT, `${name}.mp4`);
  fs.writeFileSync(file, Buffer.from(b64, 'base64'));
  return file;
}

test('a music track with a start, fades and half volume is exactly that in the exported audio', async ({ page }) => {
  test.setTimeout(420_000);
  fs.mkdirSync(OUT, { recursive: true });
  const tone440 = path.join(OUT, 'tone440.wav');
  tone(tone440, 440);
  const toneDb = meanDb(tone440, 1, 3);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 300)));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await seed(page);
  const dialog = page.getByRole('dialog');
  await dialog.getByTestId('audio-toggle-panel').scrollIntoViewIfNeeded();
  await dialog.getByTestId('audio-toggle-panel').click();

  // Video sound off, so only the track is heard.
  await dialog.getByTestId('audio-video-volume').fill('0');
  await addTrack(page, 'music', tone440);
  const track = dialog.getByTestId('audio-track').first();
  await expect(track).toBeVisible();
  await expect(dialog.getByTestId('audio-wave-strip').first()).toBeVisible();
  const id = (await track.getAttribute('data-track-id'))!;
  await track.getByTestId('audio-track-volume').fill('0.5');
  await dialog.getByTestId(`audio-start-${id}`).fill('1');
  await dialog.getByTestId(`audio-fadein-${id}`).fill('1');
  await dialog.getByTestId(`audio-fadeout-${id}`).fill('1');
  await page.screenshot({ path: path.join(OUT, 'audio-panel.png') });

  const file = await renderMp4(page, 'mix');
  const before = meanDb(file, 0.05, 0.8);
  const rampStart = meanDb(file, 1.0, 0.25);
  const steady = meanDb(file, 2.3, 1.4);
  const rampEnd = meanDb(file, 4.75, 0.2);
  const expected = toneDb + 20 * Math.log10(0.5);
  expect(before, `silent before the start (${before} dB)`).toBeLessThan(-55);
  expect(steady, `steady level ${steady} dB vs expected ${expected} dB`).toBeGreaterThan(expected - 2.5);
  expect(steady).toBeLessThan(expected + 2.5);
  expect(rampStart, `fade-in start ${rampStart} dB is well below steady ${steady} dB`).toBeLessThan(steady - 6);
  expect(rampEnd, `fade-out end ${rampEnd} dB is well below steady ${steady} dB`).toBeLessThan(steady - 6);
  expect(errors, 'no uncaught page errors').toEqual([]);
});

test('mute leaves only the video\'s sound, solo leaves only the track', async ({ page }) => {
  test.setTimeout(540_000);
  fs.mkdirSync(OUT, { recursive: true });
  const tone880 = path.join(OUT, 'tone880.wav');
  tone(tone880, 880);
  const toneDb = meanDb(tone880, 1, 3);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await seed(page);
  const dialog = page.getByRole('dialog');
  await dialog.getByTestId('audio-toggle-panel').scrollIntoViewIfNeeded();
  await dialog.getByTestId('audio-toggle-panel').click();
  await addTrack(page, 'voiceover', tone880);
  const track = dialog.getByTestId('audio-track').first();
  await expect(track).toBeVisible();
  await track.getByTestId('audio-track-mute').click();

  const clipDb = meanDb(CLIP, 0.5, 3);
  const mutedExport = await renderMp4(page, 'muted-track');
  const withVideoOnly = meanDb(mutedExport, 0.5, 3);
  expect(Math.abs(withVideoOnly - clipDb), `muted track: export ${withVideoOnly} dB vs the clip's own ${clipDb} dB`).toBeLessThan(3);

  await track.getByTestId('audio-track-mute').click(); // unmute
  await track.getByTestId('audio-track-solo').click();
  const soloExport = await renderMp4(page, 'solo-track');
  const soloDb = meanDb(soloExport, 0.5, 3);
  expect(Math.abs(soloDb - toneDb), `solo: export ${soloDb} dB vs the tone's ${toneDb} dB`).toBeLessThan(3);
});
