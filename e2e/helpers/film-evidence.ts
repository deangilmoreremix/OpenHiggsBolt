/**
 * Evidence helpers for the Motion Director acceptance specs. Nothing here mocks rendering: frames come from the
 * real export renderer in Chromium (`window.__motionParity`) or from a real exported MP4 decoded with ffmpeg.
 */
import fs from 'node:fs';
import path from 'node:path';
import { deflateSync } from 'node:zlib';
import { spawnSync } from 'node:child_process';
import { expect, type Page, type TestInfo } from '@playwright/test';
import { BASE_URL, answerInkPressOffer } from './motion-studio';

export type Rgb = [number, number, number];

/** Distinctive colours for supplied pictures: none of them occurs in the sample textures or the Ink Press palette. */
export const SUPPLIED: Record<string, Rgb> = { magenta: [236, 0, 140], lime: [110, 210, 0], orange: [255, 120, 0], cyan: [0, 175, 235] };

/** Text that belongs to the Shotcraft demos or the studio itself and must not appear in a personalised film. */
export const BRANDING_STRINGS = ['SmartVideo GO', 'Motion Studio', 'Shotcraft', 'shotcraft', 'video-shotcraft', 'Your product,'];
/** Sample content of the demos: allowed only in a shot the chat reports as unmodified. */
export const SAMPLE_UI_STRINGS = ['Paper Radar', 'Shot recipes', 'Beat-synced', '2.5D camera', 'Pick a move', 'Combo'];
/** "real page captures" is a false claim for uploaded pictures; it is only true when the site's pages were captured. */
export const PAGE_CAPTURE_CLAIM = 'REAL PAGE CAPTURES';

export function solidPng(width: number, height: number, rgb: Rgb): Buffer {
  const table = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf: Buffer) => {
    let c = 0xffffffff;
    for (const b of buf) c = table[(c ^ b) & 0xff] ^ (c >>> 8);
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
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

/** Write the supplied-picture fixtures (one solid colour each, 1200x800) and return their paths. */
export function writeSuppliedImages(dir: string, names: string[] = ['magenta', 'lime', 'orange', 'cyan']): string[] {
  fs.mkdirSync(dir, { recursive: true });
  return names.map((n) => {
    const file = path.join(dir, `acme-${n}.png`);
    fs.writeFileSync(file, solidPng(1200, 800, SUPPLIED[n]));
    return file;
  });
}

/** A PNG as 320-wide raw RGB, decoded by ffmpeg. */
export function rawRgb(png: Buffer): { w: number; h: number; data: Buffer } {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-i', 'pipe:0', '-vf', 'scale=320:-2', '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1'], { input: png, maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`ffmpeg could not decode the frame: ${r.stderr?.toString().slice(0, 200)}`);
  const w = 320;
  return { w, h: r.stdout.length / (w * 3), data: r.stdout };
}

/** Share of pixels within `tol` (per channel) of a colour. */
export function colorShare(img: { data: Buffer }, rgb: Rgb, tol = 40): number {
  let hit = 0;
  const n = img.data.length / 3;
  for (let i = 0; i < img.data.length; i += 3) {
    if (Math.abs(img.data[i] - rgb[0]) <= tol && Math.abs(img.data[i + 1] - rgb[1]) <= tol && Math.abs(img.data[i + 2] - rgb[2]) <= tol) hit++;
  }
  return hit / n;
}

/** Luminance variance of a frame (a blank or flat frame is near zero). */
export function variance(img: { data: Buffer }): number {
  const n = img.data.length / 3;
  let sum = 0;
  let sq = 0;
  for (let i = 0; i < img.data.length; i += 3) {
    const y = 0.299 * img.data[i] + 0.587 * img.data[i + 1] + 0.114 * img.data[i + 2];
    sum += y;
    sq += y * y;
  }
  const mean = sum / n;
  return sq / n - mean * mean;
}

export function probe(file: string): { video: { codec_name: string; width: number; height: number; r_frame_rate: string; nb_read_frames?: string } | undefined; audio: boolean; durationSec: number } {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file]);
  if (r.status !== 0) throw new Error(`ffprobe failed: ${r.stderr?.toString().slice(0, 200)}`);
  const j = JSON.parse(r.stdout.toString());
  return { video: j.streams.find((s: { codec_type: string }) => s.codec_type === 'video'), audio: j.streams.some((s: { codec_type: string }) => s.codec_type === 'audio'), durationSec: Number(j.format.duration) };
}

/** Decode every frame of the file; returns how many decoded and whether ffmpeg reported errors. */
export function decodeAll(file: string): { frames: number; errors: string } {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-i', file, '-map', '0:v:0', '-f', 'null', '-'], { maxBuffer: 16 * 1024 * 1024 });
  const c = spawnSync('ffprobe', ['-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', file]);
  return { frames: Number(c.stdout.toString().trim()) || 0, errors: (r.stderr?.toString() ?? '').trim() };
}

export function extractFrame(file: string, sec: number): Buffer {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-ss', String(sec), '-i', file, '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', 'pipe:1'], { maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0 || !r.stdout.length) throw new Error(`could not extract a frame at ${sec}s: ${r.stderr?.toString().slice(0, 200)}`);
  return r.stdout;
}

/** Stub the director (no OpenAI key here): plan/brief/etc. answer 401, so the film comes from the Ink Press template. */
export async function stubDirector(page: Page, adapt?: { status: number; body: unknown }) {
  await page.route('**/api/motion-studio/director', (route) => {
    const mode = JSON.parse(route.request().postData() || '{}').mode;
    if (adapt && mode === 'adapt') return route.fulfill({ status: adapt.status, contentType: 'application/json', body: JSON.stringify(adapt.body) });
    return route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'OPENAI_KEY_REQUIRED', message: 'No key.' }) });
  });
}

export interface BuiltFilm {
  chatText: string;
  stepsText: string;
}

/** Drive the real chat: attach files, send the prompt, answer the Ink Press question if asked, approve, wait for the film. */
export async function buildFilmViaChat(page: Page, opts: { prompt: string; files?: string[]; inkPress?: 'inkpress' | 'director' | null }): Promise<BuiltFilm> {
  await page.goto(`${BASE_URL}/studio/motion-director/new`);
  await expect(page.locator('.ms-root')).toBeVisible({ timeout: 120_000 });
  if (opts.files?.length) {
    await page.getByTestId('motion-prompt-media-input').setInputFiles(opts.files);
    await expect(page.getByTestId('motion-prompt-media-thumb').first()).toBeVisible({ timeout: 30_000 });
  }
  await page.getByPlaceholder('Describe your motion video...').fill(opts.prompt);
  await page.getByRole('button', { name: 'Generate' }).click();
  if (opts.inkPress) await answerInkPressOffer(page, opts.inkPress).catch(() => undefined);
  await expect(page.getByTestId('director-plan')).toBeVisible({ timeout: 10 * 60_000 });
  await page.getByRole('button', { name: 'Approve & build film' }).click();
  await expect(page.getByTestId('film-result')).toBeVisible({ timeout: 15 * 60_000 });
  await page.waitForFunction(() => Boolean((window as unknown as { __motionParity?: unknown }).__motionParity), null, { timeout: 30_000 });
  return { chatText: await page.getByTestId('film-chat').innerText(), stepsText: await page.getByTestId('film-steps').innerText() };
}

interface ClipLite { cardId: string; start: number; duration: number; props?: Record<string, unknown> }
export interface FilmInfo { fps: number; endFrame: number; shots: Array<ClipLite & { label: string }>; tracks: Array<{ name: string; role?: string; clips: ClipLite[] }> }

export async function filmInfo(page: Page): Promise<FilmInfo> {
  return page.evaluate(() => {
    const hook = (window as unknown as { __motionParity: { getProject: () => any } }).__motionParity;
    const p = hook.getProject();
    const tracks = p.tracks.map((t: any) => ({ name: t.name, role: t.role, clips: t.clips.map((c: any) => ({ cardId: c.cardId, start: c.start, duration: c.duration, props: c.props ? { adaptedCode: Boolean(c.props.adaptedCode), logo: Boolean(c.props.logo), screens: Array.isArray(c.props.screens) ? c.props.screens.length : 0, crops: Array.isArray(c.props.crops) ? c.props.crops.length : 0, texts: c.props.texts ? Object.keys(c.props.texts).length : 0 } : {} })) }));
    const all = tracks.flatMap((t: any) => t.clips);
    const end = all.reduce((m: number, c: any) => Math.max(m, c.start + c.duration), 0);
    const shots = tracks.flatMap((t: any) => t.clips).filter((c: any) => c.cardId.startsWith('demo:') || c.cardId === 'inkpress-title-card' || c.cardId.startsWith('brand-')).map((c: any) => ({ ...c, label: c.cardId }));
    return { fps: p.fps, endFrame: end, shots, tracks };
  });
}

/** Seek the preview player to a frame and read what the Player shows as text, plus the export's own frame as raw pixels. */
export async function sampleFrame(page: Page, frame: number): Promise<{ text: string; img: { w: number; h: number; data: Buffer }; png: Buffer }> {
  await page.evaluate((f) => (window as unknown as { __motionParity: { seek: (n: number) => void } }).__motionParity.seek(f), frame);
  await page.waitForTimeout(1200);
  const text = await page.getByTestId('film-result').locator('.__remotion-player').innerText().catch(() => '');
  const dataUrl = await page.evaluate((f) => (window as unknown as { __motionParity: { exportStill: (n: number) => Promise<string> } }).__motionParity.exportStill(f), frame);
  const png = Buffer.from(dataUrl.replace(/^data:image\/png;base64,/, ''), 'base64');
  return { text, img: rawRgb(png), png };
}

export interface ShotEvidence { card: string; frame: number; suppliedShare: Record<string, number>; branding: string[]; sampleUi: string[]; variance: number }

/** For each recipe shot, two settled frames: the supplied-colour share, demo strings seen, and a flatness measure. */
export async function collectShotEvidence(page: Page, info: FilmInfo, testInfo: TestInfo, tag: string): Promise<ShotEvidence[]> {
  const out: ShotEvidence[] = [];
  const dir = testInfo.outputPath(tag);
  fs.mkdirSync(dir, { recursive: true });
  let i = 0;
  for (const shot of info.shots.filter((s) => s.cardId.startsWith('demo:'))) {
    for (const frac of [0.45, 0.85]) {
      const frame = Math.min(info.endFrame - 1, Math.round(shot.start + shot.duration * frac));
      const s = await sampleFrame(page, frame);
      fs.writeFileSync(path.join(dir, `${String(++i).padStart(2, '0')}-${shot.cardId.replace(/[^\w-]+/g, '_')}-f${frame}.png`), s.png);
      out.push({
        card: shot.cardId,
        frame,
        suppliedShare: Object.fromEntries(Object.entries(SUPPLIED).map(([k, rgb]) => [k, +colorShare(s.img, rgb).toFixed(4)])),
        branding: BRANDING_STRINGS.filter((d) => s.text.includes(d)),
        sampleUi: [...SAMPLE_UI_STRINGS, PAGE_CAPTURE_CLAIM].filter((d) => s.text.includes(d)),
        variance: +variance(s.img).toFixed(1),
      });
    }
  }
  return out;
}

/** Real MP4 export through the chat card's own button; returns the downloaded file path. */
export async function exportMp4ViaChat(page: Page, opts: { draft: boolean; to: string }): Promise<string> {
  await page.getByTestId(opts.draft ? 'film-render-draft' : 'film-render').click();
  const link = page.getByTestId('film-download');
  await expect(link).toBeVisible({ timeout: 40 * 60_000 });
  const [download] = await Promise.all([page.waitForEvent('download'), link.click()]);
  await download.saveAs(opts.to);
  return opts.to;
}

/** Names of the shots the chat says are unmodified ("Hit Counter is unmodified: ..."), squashed for comparison with a stem. */
export function reportedUnmodified(chatText: string): string[] {
  return [...chatText.matchAll(/([A-Z][A-Za-z0-9' -]+?) is unmodified:/g)].map((m) => m[1].toLowerCase().replace(/[^a-z0-9]/g, ''));
}

export function writeEvidence(testInfo: TestInfo, name: string, data: unknown) {
  const file = testInfo.outputPath(`${name}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 1));
  const keep = process.env.EVIDENCE_DIR;
  if (keep) {
    fs.mkdirSync(keep, { recursive: true });
    fs.writeFileSync(path.join(keep, `${name}.json`), JSON.stringify(data, null, 1));
  }
}

/** Stub only the site capture (network), with a complete capture whose pictures are solid colours. */
export async function stubCompleteCapture(page: Page) {
  const png = solidPng(480, 436, SUPPLIED.magenta);
  await page.route('https://captures.example.com/**', (route) => route.fulfill({ status: 200, contentType: 'image/png', body: png }));
  await page.route('**/api/motion-studio/capture', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        url: 'https://acme.example.com/', title: 'Acme',
        page: { url: 'https://captures.example.com/page.png', width: 3840, height: 3492 },
        crops: ['https://captures.example.com/crop-1.png'], images: ['https://captures.example.com/image-1.jpg'], logo: 'https://captures.example.com/logo.png',
        pages: [{ name: 'home', path: '/', url: 'https://captures.example.com/page.png', width: 3840, height: 3492, layout: { pageH: 1746, sections: [], cards: [] } }],
        cutouts: { nav: null, search: null, button: null }, emptyPlate: null,
        content: { description: 'Acme ships releases faster.', headline: 'Ship faster with Acme', headings: ['Plan in minutes', 'Release with confidence'], ctas: ['Start free'], nav: ['Pricing'] },
        brand: { background: '#111111', text: '#fafafa', accent: '#ec008c', fontFamily: 'Inter' }, transient: false,
      }),
    }),
  );
}
