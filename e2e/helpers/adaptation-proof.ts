import fs from 'node:fs';
import path from 'node:path';
import { expect, type Page, type TestInfo } from '@playwright/test';
import { colorFootprint, diffShare, rawRgbFull } from './film-evidence';
import { customerFixture, customerRows, fixtureImages, captureLayoutOf, captureRowsOf, COLORS } from './layout-fixture';
import { BASE_URL } from './motion-studio';
import { openSweep, recipeFrames, save } from './recipe-frames';

/**
 * The proof that an ADAPTED shot (not merely a rendered one) does what the recipe does, for the customer's content:
 * exact recipe source + card in, the adaptation loop and sandbox, the acceptance gate, real frames, and measurements against the
 * proven parameterised recipe (Round 7) and the original's motion. `source: 'reference'` stands in for the model with the recipe's own
 * served source (clearly labelled: it proves the checks and the pipeline, NOT that a model can write the adaptation); `source: 'model'`
 * asks the real model through the app's route.
 */
export type Source = 'reference' | 'model';
interface Spec { stem: string; rows?: boolean; hero: number; kind: 'hero' | 'grid' | 'row'; peakFrame?: boolean }
export const PROOFS: Record<string, Spec> = {
  SpotlightHeroCard: { stem: 'SpotlightHeroCard', hero: 1, kind: 'hero' },
  DeckDealFlyin: { stem: 'DeckDealFlyin', hero: 0, kind: 'grid' },
  RowEmbed: { stem: 'RowEmbed', rows: true, hero: 2, kind: 'row' },
};
const OUT = 'docs/motion-director-pipeline-audit/round9/adaptation';

const rgb = (dataUrl: string) => rawRgbFull(Buffer.from(dataUrl.replace(/^data:image\/png;base64,/, ''), 'base64'));
const profile = (f: Array<ReturnType<typeof rgb>>) => [diffShare(f[0], f[1]), diffShare(f[1], f[2]), diffShare(f[0], f[2])];

export async function proveAdaptation(page: Page, stem: string, source: Source, testInfo: TestInfo) {
  const spec = PROOFS[stem];
  const layout = spec.rows ? customerRows() : customerFixture();
  const img = fixtureImages(layout);
  const custom = { screens: [img.screen], cardCrops: img.crops, emptyPlate: img.plate, captureLayout: spec.rows ? captureRowsOf(layout) : captureLayoutOf(layout), main: spec.hero };
  await openSweep(page);
  // 1. The exact recipe: its card in full and its TSX implementation, as the app serves them to the adapter.
  const card = await page.evaluate(async (s) => (await fetch(`/motion-studio/sources/${s}.card.md`)).text(), stem);
  const code = await page.evaluate(async (s) => (await fetch(`/motion-studio/sources/${s}.tsx.txt`)).text(), stem);
  expect(card.length, 'the recipe\'s Markdown card is served').toBeGreaterThan(200);
  expect(code, 'the recipe\'s TSX implementation is served').toContain(`export const ${stem}`);
  // 2. Adapt through the app's own loop (model or the labelled reference), sandbox, acceptance gate; render real frames.
  const r = await page.evaluate(({ stem, custom, code, source }) => (window as unknown as { __recipeSweep: { adaptProof: (s: string, a: unknown) => Promise<Record<string, unknown>> } }).__recipeSweep.adaptProof(stem, { custom, ...(source === 'reference' ? { code } : {}) }), { stem, custom, code, source });
  const problems = (r.problems as string[]) ?? [];
  expect(r.adapted, `accepted by the gate (problems: ${problems.join(' | ')}; error: ${String(r.error ?? '')})`).toBe(true);
  const adaptedCode = r.adaptedCode as string;
  const frames = (r.frames as string[]).map(rgb);
  const names = ['entering', 'peak', 'settled'];
  names.forEach((n, i) => save(OUT, `${stem}-${source}-${n}-adapted.png`, Buffer.from((r.frames as string[])[i].replace(/^data:image\/png;base64,/, ''), 'base64')));
  // 3. The proven parameterised recipe on the same page (Round 7): where its geometry puts things.
  const fnum = r.frameNumbers as number[];
  const param = (await recipeFrames(page, stem, fnum, { custom, scale: 0.5 })).png;
  param.forEach((b, i) => save(OUT, `${stem}-${source}-${names[i]}-parameterised.png`, b));
  const pf = param.map(rawRgbFull);
  const orig = (await recipeFrames(page, stem, fnum, { sample: true, scale: 0.5 })).png.map(rawRgbFull);
  const checks: Record<string, unknown> = {};
  // (a) asset identity: the customer's hero colour is in the adapted frames; the sample's palette is not what fills them.
  const heroRgb = layout.cards[spec.hero].color;
  const hero = frames.map((f) => colorFootprint(f, heroRgb));
  const heroP = pf.map((f) => colorFootprint(f, heroRgb));
  expect(hero[2].n, 'the customer\'s own card is in the settled frame').toBeGreaterThan(0);
  checks.assetIdentity = { adaptedHeroShare: hero.map((h) => +h.share.toFixed(4)), parameterisedHeroShare: heroP.map((h) => +h.share.toFixed(4)) };
  // (b) target geometry against the proven placement.
  if (spec.kind === 'hero' || spec.kind === 'row') {
    for (const i of [1, 2]) {
      expect(Math.abs(hero[i].cx - heroP[i].cx), `${names[i]} centre x`).toBeLessThan(0.05);
      expect(Math.abs(hero[i].cy - heroP[i].cy), `${names[i]} centre y`).toBeLessThan(0.07);
      expect(hero[i].w / heroP[i].w, `${names[i]} width`).toBeGreaterThan(0.85);
      expect(hero[i].w / heroP[i].w, `${names[i]} width`).toBeLessThan(1.15);
    }
    expect(hero[2].share / heroP[2].share, 'the card appears once (no duplicate beneath)').toBeLessThan(1.25);
  } else {
    const seen = (fs: ReturnType<typeof rgb>[]) => layout.cards.filter((c) => colorFootprint(fs[2], c.color).n > 0).length;
    expect(seen(frames), 'every card of the customer\'s page is dealt onto the board').toBeGreaterThanOrEqual(Math.ceil(layout.cards.length * 0.75));
    expect(seen(frames)).toBeGreaterThanOrEqual(seen(pf) - 1);
    checks.cardsOnBoard = { adapted: seen(frames), parameterised: seen(pf) };
  }
  // (c) the original's motion phases: the change between entering / peak / settled follows the original recipe's pattern.
  const [pa, po, pp] = [profile(frames), profile(orig), profile(pf)];
  checks.motionProfile = { adapted: pa.map((v) => +v.toFixed(3)), originalSample: po.map((v) => +v.toFixed(3)), parameterised: pp.map((v) => +v.toFixed(3)) };
  pa.forEach((v, i) => { expect(Math.abs(v - pp[i]), `motion between checkpoints ${i}`).toBeLessThan(0.15); if (po[i] > 0.04) expect(v, `the original moves between checkpoints ${i}, so must the adapted shot`).toBeGreaterThan(po[i] * 0.2); });
  // (d) the film uses the adapted source: the project's clip carries exactly the source that was validated.
  const project = r.project as { tracks: Array<{ clips: Array<{ cardId: string; props?: Record<string, unknown> }> }> };
  const clip = project.tracks.flatMap((t) => t.clips).find((c) => c.cardId === `demo:${stem}`)!;
  expect(clip.props?.adaptedCode).toBe(adaptedCode);
  if (source === 'reference') expect(adaptedCode).toBe(code);
  // (e) save, reload, reopen: the Workbench loads the saved project (the app's own persistence), keeps the adapted source, and it renders the same frame.
  // Seed the saved project before the app starts (the page that is open now would otherwise flush its own project over it as it unloads).
  await page.addInitScript((p) => { if (!sessionStorage.getItem('__seeded')) { localStorage.setItem('motion-director:project-v1', JSON.stringify(p)); sessionStorage.setItem('__seeded', '1'); } }, project);
  await page.goto(`${BASE_URL}/studio/motion-director/workbench`);
  await expect(page.locator('.topbar')).toBeVisible({ timeout: 90_000 });
  await expect(page.locator('.clip').first()).toBeVisible({ timeout: 60_000 });
  await page.waitForTimeout(2500); // the store saves (debounced) what it loaded
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('motion-director:project-v1') ?? 'null'));
  expect(saved?.tracks?.flatMap((t: { clips: Array<{ props?: { adaptedCode?: string } }> }) => t.clips).some((c: { props?: { adaptedCode?: string } }) => c.props?.adaptedCode === adaptedCode), 'the Workbench reopened the project with the adapted source intact').toBe(true);
  await page.goto(`${BASE_URL}/studio/motion-director/new`);
  await openSweepAgain(page);
  const again = (await page.evaluate(({ p, f }) => (window as unknown as { __recipeSweep: { renderProject: (p: unknown, f: number[], s: number) => Promise<string[]> } }).__recipeSweep.renderProject(p, f, 0.5), { p: saved, f: [fnum[2]] }))[0];
  const reopen = diffShare(frames[2], rgb(again));
  expect(reopen, 'the reopened project renders the same frame').toBeLessThan(0.002);
  checks.reopenDiff = reopen;
  const result = { stem, source, modelUsed: source === 'model', requests: r.requests, notes: r.notes, adaptedCodeBytes: adaptedCode.length, gateProblemsSeen: problems, checks, frames: fnum };
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, `${stem}-${source}.json`), JSON.stringify(result, null, 2));
  await testInfo.attach(`${stem}-${source}`, { body: JSON.stringify(result, null, 2), contentType: 'application/json' });
  void COLORS;
  return result;
}

async function openSweepAgain(page: Page) {
  await expect(page.locator('.ms-root')).toBeVisible({ timeout: 120_000 });
  await page.waitForFunction(() => Boolean((window as unknown as { __recipeSweep?: unknown }).__recipeSweep), null, { timeout: 60_000 });
}
