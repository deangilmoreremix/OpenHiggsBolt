import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { colorFootprint, diffShare, rawRgbFull, writeEvidence } from './helpers/film-evidence';
import { customerFixture, customerRows, fixtureImages, sampleRowsTwin, sampleTwin, captureLayoutOf, captureRowsOf, COLORS } from './helpers/layout-fixture';
import { openSweep, recipeFrames, save } from './helpers/recipe-frames';

/**
 * Customer-layout fidelity of the screenshot recipes. For each repaired recipe, at entry / peak / settled frames:
 *  1. IDENTITY  the recipe given the sample's own layout draws exactly what the unmodified recipe draws
 *               (its easing, camera, timing and effects are untouched);
 *  2. TARGET    on a customer page unlike the sample, the hero card lands where the sample shot puts the sample's hero card
 *               (same camera composition), measured by the card's unique colour against a twin built from the sample's geometry;
 *  3. NO DUPLICATE  the card appears once: no second copy of it shows beneath the animated one.
 * Frames are saved beside the results so they can be looked at, not only counted.
 */
const OUT = process.env.EVIDENCE_DIR ?? path.resolve('test-results/fidelity');
const SCALE = 0.5;

interface Config { stem: string; kind?: 'hero' | 'grid'; rows?: boolean; frames: Record<string, number>; sampleMain: number; customMain: number; heroFrames: string[] }
const RECIPES: Config[] = [
  { stem: 'RowEmbed', rows: true, frames: { entry: 4, mid: 30, peak: 52, settled: 66 }, sampleMain: 2, customMain: 2, heroFrames: ['peak', 'settled'] },
  { stem: 'DeckDealFlyin', kind: 'grid', frames: { entry: 4, deal: 60, peak: 100, settled: 145 }, sampleMain: 0, customMain: 0, heroFrames: [] },
  { stem: 'SpotlightHeroCard', frames: { entry: 4, rise: 62, peak: 95, settled: 168 }, sampleMain: 3, customMain: 1, heroFrames: ['rise', 'peak', 'settled'] },
];

for (const cfg of RECIPES) {
  test(`${cfg.stem}: identity, camera target, no duplicate`, async ({ page }, testInfo) => {
    test.setTimeout(30 * 60_000);
    await openSweep(page);
    const names = Object.keys(cfg.frames);
    const nums = names.map((n) => cfg.frames[n]);
    const shots = async (opts: Parameters<typeof recipeFrames>[3]) => (await recipeFrames(page, cfg.stem, nums, { scale: SCALE, ...opts })).png;

    // 1. IDENTITY
    const baseline = await shots({ sample: true });
    const identity = await shots({ custom: { screens: [], cardCrops: [], identity: true } });
    const idDiff = names.map((n, i) => ({ frame: n, diff: diffShare(rawRgbFull(baseline[i]), rawRgbFull(identity[i])) }));

    // 2./3. TARGET and NO DUPLICATE against the twin
    const twinL = cfg.rows ? sampleRowsTwin() : sampleTwin();
    const custL = cfg.rows ? customerRows() : customerFixture();
    const layoutOf = cfg.rows ? captureRowsOf : captureLayoutOf;
    const twinImg = fixtureImages(twinL);
    const custImg = fixtureImages(custL);
    const twin = await shots({ custom: { screens: [twinImg.screen], cardCrops: twinImg.crops, emptyPlate: twinImg.plate, captureLayout: layoutOf(twinL), main: cfg.sampleMain } });
    const cust = await shots({ custom: { screens: [custImg.screen], cardCrops: custImg.crops, emptyPlate: custImg.plate, captureLayout: layoutOf(custL), main: cfg.customMain } });
    if (cfg.kind === 'grid') {
      // Every card of the customer's page must be dealt onto the board: its unique colour shows in the frame.
      const seen = (img: { w: number; h: number; data: Buffer }, layout: typeof custL) => layout.cards.map((c) => colorFootprint(img, c.color).n > 0);
      const visible = names.map((n, i) => ({ frame: n, twin: seen(rawRgbFull(twin[i]), twinL).filter(Boolean).length + '/' + twinL.cards.length, customer: seen(rawRgbFull(cust[i]), custL).filter(Boolean).length + '/' + custL.cards.length }));
      names.forEach((n, i) => {
        save(OUT, `${cfg.stem}-${n}-baseline.png`, baseline[i]);
        save(OUT, `${cfg.stem}-${n}-twin.png`, twin[i]);
        save(OUT, `${cfg.stem}-${n}-customer.png`, cust[i]);
      });
      fs.mkdirSync(OUT, { recursive: true });
      fs.writeFileSync(path.join(OUT, `fidelity-${cfg.stem}.json`), JSON.stringify({ identity: idDiff, visible }, null, 1));
      for (const d of idDiff) expect(d.diff, `identity: ${d.frame} frame differs from the unmodified recipe`).toBeLessThan(0.0005);
      const last = visible[visible.length - 1];
      expect(Number(last.customer.split('/')[0]), `settled: the customer's cards are on the board (${last.customer})`).toBeGreaterThanOrEqual(Math.ceil(custL.cards.length * 0.75));
      return;
    }
    const twinHero = twinL.cards[cfg.sampleMain].color;
    const custHero = custL.cards[cfg.customMain].color;
    const rows = names.map((n, i) => {
      const t = colorFootprint(rawRgbFull(twin[i]), twinHero);
      const c = colorFootprint(rawRgbFull(cust[i]), custHero);
      return { frame: n, twin: t, customer: c };
    });
    names.forEach((n, i) => {
      save(OUT, `${cfg.stem}-${n}-baseline.png`, baseline[i]);
      save(OUT, `${cfg.stem}-${n}-twin.png`, twin[i]);
      save(OUT, `${cfg.stem}-${n}-customer.png`, cust[i]);
    });
    writeEvidence(testInfo, `fidelity-${cfg.stem}`, { identity: idDiff, hero: rows });
    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(path.join(OUT, `fidelity-${cfg.stem}.json`), JSON.stringify({ identity: idDiff, hero: rows }, null, 1));

    for (const d of idDiff) expect(d.diff, `identity: ${d.frame} frame differs from the unmodified recipe`).toBeLessThan(0.0005);
    for (const r of rows.filter((r) => cfg.heroFrames.includes(r.frame))) {
      expect(r.customer.n, `${r.frame}: the customer's hero card is visible`).toBeGreaterThan(0);
      expect(Math.abs(r.customer.cx - r.twin.cx), `${r.frame}: hero centre x (camera target)`).toBeLessThan(0.05);
      expect(Math.abs(r.customer.cy - r.twin.cy), `${r.frame}: hero centre y (camera target)`).toBeLessThan(0.07);
      expect(r.customer.w / r.twin.w, `${r.frame}: hero width on screen`).toBeGreaterThan(0.85);
      expect(r.customer.w / r.twin.w, `${r.frame}: hero width on screen`).toBeLessThan(1.15);
      // The same card seen once: its colour covers no more of the frame than the twin's card does (a duplicate beneath would double it).
      expect(r.customer.share / r.twin.share, `${r.frame}: the card appears once`).toBeLessThan(1.25);
    }
  });
}
