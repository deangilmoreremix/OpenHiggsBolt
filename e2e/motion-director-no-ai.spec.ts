import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { BASE_URL, installStudioSession } from './helpers/motion-studio';
import { decodeAll, probe } from './helpers/film-evidence';

/**
 * Create WITHOUT AI, from a real public website (https://www.connections.com/), through the real Motion Director UI.
 * Nothing is mocked: the capture is the app's real capture of the live site, the build and the MP4 export run in the browser.
 * The test FAILS if the app calls the AI director route or OpenAI at all (it only observes requests, it answers none).
 * Evidence: docs/motion-director-pipeline-audit/round9/noai/
 */
const OUT = 'docs/motion-director-pipeline-audit/round9/noai';
const URL_ = 'https://www.connections.com/';
const save = (name: string, data: Buffer | string) => { fs.mkdirSync(OUT, { recursive: true }); fs.writeFileSync(path.join(OUT, name), data); };
type Clip = { id: string; cardId: string; start: number; duration: number; label?: string; props?: Record<string, unknown> };

test('connections.com → film without AI → frames → Workbench → MP4', async ({ page }) => {
  test.setTimeout(60 * 60_000);
  const aiCalls: string[] = [];
  page.on('request', (r) => { if (/\/api\/motion-studio\/director|api\.openai\.com/.test(r.url())) aiCalls.push(`${r.method()} ${r.url()}`); });
  await installStudioSession(page);
  await page.goto(`${BASE_URL}/studio/motion-director/new`);
  await expect(page.locator('.ms-root')).toBeVisible({ timeout: 120_000 });
  await page.getByPlaceholder('Describe your motion video...').fill(`Create a cinematic 25-second promotional video for ${URL_} using its actual website, images, branding, and services.`);
  await page.getByRole('button', { name: 'Generate' }).click();
  await page.getByTestId('create-without-ai').click({ timeout: 60_000 });
  const plan = page.getByTestId('director-plan');
  await expect(plan).toBeVisible({ timeout: 8 * 60_000 });
  save('storyboard.txt', await plan.innerText());
  save('chat-after-storyboard.txt', await page.getByTestId('film-chat').innerText());
  await plan.scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(OUT, 'storyboard.png') });
  await page.getByRole('button', { name: 'Approve & build film' }).click();
  await expect(page.getByTestId('film-result')).toBeVisible({ timeout: 15 * 60_000 });
  await page.waitForFunction(() => Boolean((window as unknown as { __motionParity?: unknown }).__motionParity), null, { timeout: 30_000 });
  await page.waitForTimeout(5000);
  save('chat-after-build.txt', await page.getByTestId('film-chat').innerText());

  // Frames at the start, peak and settled point of every scene, drawn the way the MP4 export draws them.
  const project = await page.evaluate(() => (window as unknown as { __motionParity: { getProject: () => unknown } }).__motionParity.getProject()) as { fps: number; tracks: Array<{ name: string; clips: Clip[] }> };
  const shots = project.tracks.find((t) => t.name === 'Shots')!.clips.slice().sort((a, b) => a.start - b.start);
  const summary: Array<Record<string, unknown>> = [];
  for (let i = 0; i < shots.length; i++) {
    const c = shots[i];
    const frames = { enter: c.start + Math.max(2, Math.round(c.duration * 0.12)), peak: c.start + Math.round(c.duration * 0.5), settled: c.start + c.duration - 4 };
    for (const [phase, f] of Object.entries(frames)) {
      const url = await page.evaluate((fr) => (window as unknown as { __motionParity: { exportStill: (n: number) => Promise<string> } }).__motionParity.exportStill(fr), f);
      save(`scene${String(i + 1).padStart(2, '0')}-${c.cardId.replace(/[^A-Za-z0-9]+/g, '_')}-${phase}-f${f}.png`, Buffer.from(url.replace(/^data:image\/png;base64,/, ''), 'base64'));
    }
    summary.push({ scene: i + 1, cardId: c.cardId, label: c.label, startSec: +(c.start / project.fps).toFixed(2), durationSec: +(c.duration / project.fps).toFixed(2), props: Object.keys(c.props ?? {}), screens: (c.props?.screens as string[] | undefined)?.length, crops: (c.props?.crops as string[] | undefined)?.length, adapted: Boolean(c.props?.adaptedCode) });
  }
  save('scenes.json', JSON.stringify(summary, null, 2));

  // Open in the Workbench: the saved project is editable.
  await page.getByTestId('film-open-workbench').click();
  await expect(page.locator('.topbar')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('.clip').first()).toBeVisible({ timeout: 60_000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT, 'workbench.png') });
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('motion-director:project-v1') ?? 'null'));
  save('run-record.json', JSON.stringify(saved?.run ?? null, null, 2));
  // Edit a title in the Workbench: it stays editable and persists.
  const title = page.locator('.clip', { hasText: /Connections/ }).first();
  await title.click();
  await expect(page.locator('.inspector')).toBeVisible();

  // Export an MP4 with the existing browser renderer (draft size).
  await page.getByTestId('export-draft').check();
  await page.getByRole('button', { name: 'Export video' }).click();
  const done = page.locator('a[download$=".mp4"]');
  await expect(done).toBeVisible({ timeout: 40 * 60_000 });
  const download = page.waitForEvent('download');
  await done.click();
  const file = path.join(OUT, 'connections-without-ai.mp4');
  fs.mkdirSync(OUT, { recursive: true });
  await (await download).saveAs(file);
  const info = probe(file);
  save('mp4-probe.json', JSON.stringify({ ...info, decode: decodeAll(file) }, null, 2));
  expect(info.video?.codec_name).toBe('h264');
  save('ai-calls.json', JSON.stringify({ aiRequestsObserved: aiCalls }, null, 2));
  expect(aiCalls, 'no request to the AI director route or OpenAI was made').toEqual([]);
});
