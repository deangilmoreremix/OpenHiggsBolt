import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { colorFootprint, diffShare, rawRgbFull, writeEvidence } from './helpers/film-evidence';
import { customerFixture, customerPapers, customerRows, fixtureImages, sampleRowsTwin, sampleTwin, captureLayoutOf, captureRowsOf, COLORS } from './helpers/layout-fixture';
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

interface Config { stem: string; kind?: 'hero' | 'grid' | 'zoom'; rows?: boolean | 'papers'; /** The card's colour also appears elsewhere in the twin, so its bounding box is not comparable; its area and centre still are. */ areaOnly?: boolean; /** Identity may differ by this share where the export draws something the unmodified recipe's export did not (see the recipe note). */ idTolerance?: Record<string, number>; /** Largest customer/twin ratio of the hero's screen area: the zoom is scaled from another card than the hero (a duplicate beneath would double it, i.e. 2). */ maxAreaRatio?: number; /** Measure the hero only inside this part of the frame [x0,y0,x1,y1] (fractions): the shot's composition is fixed, and the page behind it shows the same card blurred. */ roi?: [number, number, number, number]; frames: Record<string, number>; sampleMain: number; customMain: number; heroFrames: string[] }
const RECIPES: Config[] = [
  { stem: 'JumpCutPunchIn', kind: 'zoom', frames: { entry: 10, jump1: 50, jump2: 100, settled: 130 }, sampleMain: 3, customMain: 1, heroFrames: [] },
  { stem: 'ListStackPress', rows: 'papers', frames: { entry: 3, mid: 40, peak: 70, settled: 86 }, sampleMain: 2, customMain: 2, heroFrames: ['settled'], areaOnly: true, maxAreaRatio: 1.7 },
  { stem: 'OutroGroupPhotoLaunch', frames: { entry: 14, gather: 40, peak: 80, settled: 125 }, sampleMain: 3, customMain: 1, heroFrames: ['peak', 'settled'], areaOnly: true, maxAreaRatio: 1.6, roi: [0, 0.08, 0.3, 0.55], idTolerance: { entry: 0.0005, gather: 0.003, peak: 0.003, settled: 0.003 } /* sub-pixel text differences in the paper elements between two renders of the same sample (max 0.2 % of pixels, text edges) */ },
  { stem: 'WhipBrakeReal', frames: { entry: 10, whip: 30, peak: 70, settled: 120 }, sampleMain: 3, customMain: 1, heroFrames: ['settled'], areaOnly: true, maxAreaRatio: 1.6 },
  { stem: 'FreezeAnnotateReal', frames: { entry: 20, freeze: 50, peak: 90, settled: 150 }, sampleMain: 8, customMain: 1, heroFrames: ['freeze', 'peak'], areaOnly: true, maxAreaRatio: 1.6 },
  { stem: 'TypeAndFilter', frames: { entry: 14, full: 52, peak: 62, settled: 72 }, sampleMain: 8, customMain: 1, heroFrames: ['peak', 'settled'], areaOnly: true, maxAreaRatio: 1.5 },
  { stem: 'MultiplaneReal', frames: { entry: 8, slide: 70, peak: 130, settled: 160 }, sampleMain: 3, customMain: 1, heroFrames: ['settled'], areaOnly: true },
  { stem: 'CrashImpactReal', frames: { entry: 12, scan: 30, peak: 47, settled: 100 }, sampleMain: 3, customMain: 1, heroFrames: ['peak', 'settled'] },
  { stem: 'CrashZoomReal', frames: { entry: 10, lock: 30, peak: 47, settled: 100 }, sampleMain: 3, customMain: 1, heroFrames: ['peak', 'settled'] },
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
    names.forEach((n, i) => save(OUT, `${cfg.stem}-${n}-identity.png`, identity[i]));
    const idDiff = names.map((n, i) => ({ frame: n, diff: diffShare(rawRgbFull(baseline[i]), rawRgbFull(identity[i])) }));

    // 2./3. TARGET and NO DUPLICATE against the twin
    const twinL = cfg.rows ? sampleRowsTwin(cfg.rows === 'papers' ? 'papers' : 'detail') : sampleTwin();
    const custL = cfg.rows ? (cfg.rows === 'papers' ? customerPapers() : customerRows()) : customerFixture();
    const layoutOf = cfg.rows ? captureRowsOf : captureLayoutOf;
    const twinImg = fixtureImages(twinL);
    const custImg = fixtureImages(custL);
    const twin = await shots({ custom: { screens: [twinImg.screen], cardCrops: twinImg.crops, emptyPlate: twinImg.plate, captureLayout: layoutOf(twinL), main: cfg.sampleMain } });
    const cust = await shots({ custom: { screens: [custImg.screen], cardCrops: custImg.crops, emptyPlate: custImg.plate, captureLayout: layoutOf(custL), main: cfg.customMain } });
    if (cfg.kind === 'zoom') {
      // The zoom lands on the customer's own card: it stays where the page puts it and grows by the authored steps (1.0, 1.6, 2.6).
      const hero = custL.cards[cfg.customMain];
      const fp = names.map((n, i) => ({ frame: n, ...colorFootprint(rawRgbFull(cust[i]), hero.color) }));
      names.forEach((n, i) => { save(OUT, `${cfg.stem}-${n}-baseline.png`, baseline[i]); save(OUT, `${cfg.stem}-${n}-twin.png`, twin[i]); save(OUT, `${cfg.stem}-${n}-customer.png`, cust[i]); });
      fs.mkdirSync(OUT, { recursive: true });
      fs.writeFileSync(path.join(OUT, `fidelity-${cfg.stem}.json`), JSON.stringify({ identity: idDiff, footprint: fp }, null, 1));
      for (const d of idDiff) expect(d.diff, `identity: ${d.frame} frame differs from the unmodified recipe`).toBeLessThan(0.0005);
      const ex = (hero.x + hero.w / 2) / 1920, ey = (hero.y + hero.h / 2) / 1080;
      for (const f of fp) {
        expect(f.n, `${f.frame}: the customer's card is on screen`).toBeGreaterThan(0);
        expect(Math.abs(f.cx - ex), `${f.frame}: the zoom stays centred on the card (x)`).toBeLessThan(0.02);
        expect(Math.abs(f.cy - ey), `${f.frame}: the zoom stays centred on the card (y)`).toBeLessThan(0.03);
      }
      expect(fp[1].w / fp[0].w, 'first jump zooms 1.6x').toBeGreaterThan(1.45);
      expect(fp[1].w / fp[0].w, 'first jump zooms 1.6x').toBeLessThan(1.75);
      expect(fp[2].w / fp[0].w, 'second jump zooms 2.6x').toBeGreaterThan(2.3);
      expect(fp[2].w / fp[0].w, 'second jump zooms 2.6x').toBeLessThan(2.9);
      return;
    }
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
      const crop = (img: { w: number; h: number; data: Buffer }) => {
        if (!cfg.roi) return img;
        const [x0, y0, x1, y1] = cfg.roi.map((v, k) => Math.round(v * (k % 2 === 0 ? img.w : img.h)));
        const w = x1 - x0, h = y1 - y0;
        const data = Buffer.alloc(w * h * 3);
        for (let y = 0; y < h; y++) img.data.copy(data, y * w * 3, ((y + y0) * img.w + x0) * 3, ((y + y0) * img.w + x1) * 3);
        return { w, h, data };
      };
      const t = colorFootprint(crop(rawRgbFull(twin[i])), twinHero);
      const c = colorFootprint(crop(rawRgbFull(cust[i])), custHero);
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

    for (const d of idDiff) {
      if (cfg.idTolerance && !(d.frame in cfg.idTolerance)) continue;
      expect(d.diff, `identity: ${d.frame} frame differs from the unmodified recipe`).toBeLessThan(cfg.idTolerance?.[d.frame] ?? 0.0005);
    }
    for (const r of rows.filter((r) => cfg.heroFrames.includes(r.frame))) {
      expect(r.customer.n, `${r.frame}: the customer's hero card is visible`).toBeGreaterThan(0);
      expect(Math.abs(r.customer.cx - r.twin.cx), `${r.frame}: hero centre x (camera target)`).toBeLessThan(0.05);
      expect(Math.abs(r.customer.cy - r.twin.cy), `${r.frame}: hero centre y (camera target)`).toBeLessThan(0.07);
      if (!cfg.areaOnly) {
        expect(r.customer.w / r.twin.w, `${r.frame}: hero width on screen`).toBeGreaterThan(0.85);
        expect(r.customer.w / r.twin.w, `${r.frame}: hero width on screen`).toBeLessThan(1.15);
      } else {
        expect(r.customer.share / r.twin.share, `${r.frame}: hero area on screen`).toBeGreaterThan(0.8);
      }
      // The same card seen once: its colour covers no more of the frame than the twin's card does (a duplicate beneath would double it).
      expect(r.customer.share / r.twin.share, `${r.frame}: the card appears once`).toBeLessThan(cfg.maxAreaRatio ?? 1.25);
    }
  });
}

/**
 * JumpCutPunchIn on its own (a project of this one shot, no other recipe, no brand scene before it): it must draw, and show the
 * authored three zoom steps, both as the sample demo and on a customer's page. (It was reported blank when exercised with a
 * flat-colour stand-in picture; a real page, and the sample, both draw.)
 */
test('JumpCutPunchIn plays standalone: not blank, three distinct zoom steps', async ({ page }) => {
  test.setTimeout(20 * 60_000);
  await openSweep(page);
  const DUR = 135;
  const at = [0.1, 0.3, 0.55, 0.9].map((f) => Math.round(DUR * f));
  const spread = (img: { data: Buffer }) => {
    let sum = 0, sq = 0;
    const n = img.data.length / 3;
    for (let i = 0; i < img.data.length; i += 3) { const l = (img.data[i] + img.data[i + 1] + img.data[i + 2]) / 3; sum += l; sq += l * l; }
    const m = sum / n;
    return Math.sqrt(Math.max(0, sq / n - m * m));
  };
  const L = customerFixture();
  const im = fixtureImages(L);
  for (const [label, opts] of [['sample', { sample: true }], ['customer page', { custom: { screens: [im.screen], cardCrops: im.crops, emptyPlate: im.plate, captureLayout: captureLayoutOf(L) } }]] as const) {
    const r = await recipeFrames(page, 'JumpCutPunchIn', at, { scale: 0.5, ...opts });
    expect(r.durationFrames, 'the catalog plays the full authored length').toBe(DUR);
    const imgs = r.png.map(rawRgbFull);
    imgs.forEach((img, i) => expect(spread(img), `${label}: frame ${at[i]} is not blank`).toBeGreaterThan(8));
    // the cuts are hard: consecutive steps differ a lot; the last two frames (both on the final step) are alike
    expect(diffShare(imgs[0], imgs[1]), `${label}: first cut changes the frame`).toBeGreaterThan(0.15);
    expect(diffShare(imgs[1], imgs[2]), `${label}: second cut changes the frame`).toBeGreaterThan(0.15);
    expect(diffShare(imgs[2], imgs[3]), `${label}: the final step only drifts (0.8 %), it does not cut`).toBeLessThan(0.08);
  }
});
