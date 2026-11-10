import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { test, expect } from '@playwright/test';
import { installStudioSession } from './helpers/motion-studio';
import {
  SUPPLIED, buildFilmViaChat, collectShotEvidence, decodeAll, exportMp4ViaChat, extractFrame, filmInfo, probe, rawRgb, stubCompleteCapture, stubDirector,
  variance, writeEvidence, writeSuppliedImages, type ShotEvidence,
} from './helpers/film-evidence';

/**
 * Acceptance tests A-H for the Motion Director film pipeline. Frames are real: the export renderer in Chromium and,
 * for F, an exported MP4 decoded with ffmpeg. The director is the only stub (no OpenAI key here); the site capture is
 * stubbed only where a test says so (C uses the real connections.com capture).
 *
 * Run: MS_OFFLINE_CLERK=1 EVIDENCE_DIR=<dir> npx playwright test -c playwright.ms.config.ts e2e/motion-director-acceptance.spec.ts --timeout 2700000
 */
test.describe.configure({ mode: 'serial' });

const IMAGES_DIR = path.join(process.env.TMPDIR ?? '/tmp', 'md-acceptance-images');
const hasSupplied = (ev: ShotEvidence[]) => ev.some((e) => Object.values(e.suppliedShare).some((v) => v >= 0.01));
const demoSeen = (ev: ShotEvidence[]) => [...new Set(ev.flatMap((e) => e.forbidden))];
const flat = (ev: ShotEvidence[]) => ev.filter((e) => e.variance < 15);

test.beforeEach(async ({ page }) => {
  await installStudioSession(page);
  await stubDirector(page);
});

test('A. one personalised shot from supplied images', async ({ page }, testInfo) => {
  test.setTimeout(30 * 60_000);
  const built = await buildFilmViaChat(page, { prompt: 'Use the spotlight-hero-card shot as a close-up for Acme', files: writeSuppliedImages(IMAGES_DIR, ['magenta', 'lime', 'orange']) });
  const info = await filmInfo(page);
  const ev = await collectShotEvidence(page, info, testInfo, 'A');
  writeEvidence(testInfo, 'A', { built, shots: info.shots, ev });
  expect(info.shots.filter((s) => s.cardId.startsWith('demo:'))).toHaveLength(1);
  expect(hasSupplied(ev), 'the supplied pictures appear in the shot').toBe(true);
  expect(demoSeen(ev), 'no demo branding').toEqual([]);
  expect(flat(ev), 'no blank frames').toEqual([]);
});

test('B. three-shot film with transitions is assembled in order', async ({ page }, testInfo) => {
  test.setTimeout(30 * 60_000);
  const built = await buildFilmViaChat(page, { prompt: 'Make a launch film for Acme using the spotlight-hero-card, deck-deal-flyin and row-embed shot cards', files: writeSuppliedImages(IMAGES_DIR) });
  const info = await filmInfo(page);
  writeEvidence(testInfo, 'B', { built, tracks: info.tracks.map((t) => ({ name: t.name, role: t.role, clips: t.clips.map((c) => [c.cardId, c.start, c.duration]) })) });
  const shotsTrack = info.tracks.find((t) => t.clips.some((c) => c.cardId.startsWith('demo:')))!;
  const clips = [...shotsTrack.clips].sort((a, b) => a.start - b.start);
  const recipes = clips.filter((c) => c.cardId.startsWith('demo:')).map((c) => c.cardId);
  expect(recipes.map((r) => r.slice(5)), 'the named shots, in the order named').toEqual(['SpotlightHeroCard', 'DeckDealFlyin', 'RowEmbed']);
  for (let i = 1; i < clips.length; i++) expect(Math.abs(clips[i].start - (clips[i - 1].start + clips[i - 1].duration)), `shots ${i - 1} and ${i} run back to back`).toBeLessThanOrEqual(1);
  const seams = info.tracks.flatMap((t) => t.clips).filter((c) => c.cardId === 'connected-seam');
  expect(seams.length, 'a seam where the storyboard asked for a transition').toBeGreaterThan(0);
  for (const seam of seams) {
    const at = seam.start + seam.duration / 2;
    expect(clips.some((c) => Math.abs(c.start - at) <= 2), 'each seam sits on a shot boundary').toBe(true);
  }
  const audio = info.tracks.flatMap((t) => t.clips).filter((c) => c.cardId === 'audio-clip');
  for (const a of audio) expect(a.start + a.duration, 'audio ends inside the film').toBeLessThanOrEqual(info.endFrame + 1);
  expect(info.tracks.some((t) => t.role === 'music'), 'music track present').toBe(true);
  const ev = await collectShotEvidence(page, info, testInfo, 'B');
  expect(demoSeen(ev), 'no demo branding').toEqual([]);
});

test('C. film from a real website (connections.com)', async ({ page }, testInfo) => {
  test.setTimeout(40 * 60_000);
  const reach = spawnSync('curl', ['-sI', '-m', '20', 'https://www.connections.com/']);
  test.skip(reach.status !== 0, 'connections.com is not reachable from this machine');
  const built = await buildFilmViaChat(page, { prompt: 'Make a launch film for https://www.connections.com/ with the Ink Press template', inkPress: 'inkpress' });
  const info = await filmInfo(page);
  const ev = await collectShotEvidence(page, info, testInfo, 'C');
  writeEvidence(testInfo, 'C', { built, shots: info.shots, ev });
  expect(built.stepsText, 'capture reported as done').toMatch(/Capture[\s\S]{0,40}\d+ page/);
  expect(built.chatText, 'no claim of sample pages').not.toMatch(/sample pages instead/i);
  expect(info.shots.some((s) => s.props?.logo), 'a title card carries the site logo').toBe(true);
  expect(info.shots.some((s) => (s.props?.screens ?? 0) > 0), 'product shots carry the site pages').toBe(true);
  expect(demoSeen(ev), 'no demo branding').toEqual([]);
  expect(flat(ev)).toEqual([]);
});

test('D. film from uploaded images, no website', async ({ page }, testInfo) => {
  test.setTimeout(30 * 60_000);
  const built = await buildFilmViaChat(page, { prompt: 'Make a promo for Acme with the Ink Press template', files: writeSuppliedImages(IMAGES_DIR), inkPress: 'inkpress' });
  const info = await filmInfo(page);
  const ev = await collectShotEvidence(page, info, testInfo, 'D');
  writeEvidence(testInfo, 'D', { built, shots: info.shots, ev });
  expect(hasSupplied(ev), 'the uploaded pictures appear in the film').toBe(true);
  expect(demoSeen(ev), 'no demo branding').toEqual([]);
  expect(flat(ev)).toEqual([]);
});

test('E. film from user-selected recipes: each is personalised or reported as not', async ({ page }, testInfo) => {
  test.setTimeout(30 * 60_000);
  const built = await buildFilmViaChat(page, { prompt: 'Use the page-waterfall-wall, list-stack-press and hit-counter shot cards for Acme', files: writeSuppliedImages(IMAGES_DIR) });
  const info = await filmInfo(page);
  const ev = await collectShotEvidence(page, info, testInfo, 'E');
  writeEvidence(testInfo, 'E', { built, shots: info.shots, ev });
  const recipes = info.shots.filter((s) => s.cardId.startsWith('demo:')).map((s) => s.cardId.slice(5));
  expect(recipes.sort()).toEqual(['HitCounter', 'ListStackPress', 'PageWaterfallWall']);
  for (const r of recipes) {
    const personalised = hasSupplied(ev.filter((e) => e.card === `demo:${r}`));
    const reported = new RegExp(`${r}[^\\n]{0,160}(not personali[sz]ed|unmodified|sample)|(not personali[sz]ed|unmodified|sample)[^\\n]{0,160}${r}`, 'i').test(built.chatText);
    expect(personalised || reported, `${r} is either personalised or reported as not personalised`).toBe(true);
  }
  expect(demoSeen(ev), 'no demo branding').toEqual([]);
});

test('F. a film exports to a playable MP4 whose frames match what was built', async ({ page }, testInfo) => {
  test.setTimeout(60 * 60_000);
  await buildFilmViaChat(page, { prompt: 'Make a promo for Acme with the Ink Press template', files: writeSuppliedImages(IMAGES_DIR), inkPress: 'inkpress' });
  const mp4 = await exportMp4ViaChat(page, { draft: true, to: testInfo.outputPath('film-draft.mp4') });
  const p = probe(mp4);
  const d = decodeAll(mp4);
  const frames: Array<{ sec: number; variance: number; supplied: Record<string, number> }> = [];
  for (const frac of [0.2, 0.45, 0.7, 0.9]) {
    const sec = +(p.durationSec * frac).toFixed(2);
    const png = extractFrame(mp4, sec);
    fs.writeFileSync(testInfo.outputPath(`mp4-frame-${sec}.png`), png);
    const img = rawRgb(png);
    frames.push({ sec, variance: +variance(img).toFixed(1), supplied: {} });
  }
  writeEvidence(testInfo, 'F', { probe: p, decode: d, frames });
  expect(p.video?.codec_name).toBe('h264');
  expect([p.video?.width, p.video?.height]).toEqual([1280, 720]);
  expect(p.audio, 'the film has sound').toBe(true);
  expect(d.errors, 'ffmpeg decodes every frame without errors').toBe('');
  expect(d.frames, 'frame count matches the duration').toBeGreaterThan(p.durationSec * 29);
  for (const f of frames) expect(f.variance, `frame at ${f.sec}s is not blank`).toBeGreaterThan(15);
});

test('G. no demo branding or sample UI in personalised output', async ({ page }, testInfo) => {
  test.setTimeout(30 * 60_000);
  // The recipes that draw the most sample content: a sample UI, sample labels and the Shotcraft tagline.
  const built = await buildFilmViaChat(page, { prompt: 'Use the deck-deal-flyin, spotlight-hero-card, list-stack-press and hit-counter shot cards for Acme', files: writeSuppliedImages(IMAGES_DIR) });
  const info = await filmInfo(page);
  const ev = await collectShotEvidence(page, info, testInfo, 'G');
  writeEvidence(testInfo, 'G', { built, ev });
  expect(demoSeen(ev), 'demo strings seen in the output').toEqual([]);
});

test('H1. failed adaptation is reported, not counted as success', async ({ page }, testInfo) => {
  test.setTimeout(30 * 60_000);
  await stubCompleteCapture(page);
  await stubDirector(page, { status: 502, body: { error: 'DIRECTOR_FAILED', code: 'DIRECTOR_FAILED', message: 'The model returned no usable code' } });
  const built = await buildFilmViaChat(page, { prompt: 'Make a launch film for https://acme.example.com with the Ink Press template', inkPress: 'inkpress' });
  writeEvidence(testInfo, 'H1', built);
  expect(built.chatText, 'says how many shots were personalised').toMatch(/personali[sz]ed\s+\d+\s+of\s+\d+|\d+\s+of\s+\d+\s+shots?\s+(?:were\s+)?personali[sz]ed/i);
  expect(built.stepsText, 'the Animate step is not a plain success when no shot was adapted').not.toMatch(/Animate[\s\S]{0,60}Remotion code[\s\S]{0,40}\d+ clips/);
});

test('H2. missing recipe sources are reported as a deployment problem', async ({ page }, testInfo) => {
  test.setTimeout(30 * 60_000);
  await stubCompleteCapture(page);
  await page.route('**/motion-studio/sources/**', (route) => route.fulfill({ status: 404, body: 'not found' }));
  const built = await buildFilmViaChat(page, { prompt: 'Make a launch film for https://acme.example.com with the Ink Press template', inkPress: 'inkpress' });
  writeEvidence(testInfo, 'H2', built);
  expect(built.chatText, 'names the real cause').toMatch(/sources? (?:are |is )?(?:not deployed|unavailable|missing)/i);
});
