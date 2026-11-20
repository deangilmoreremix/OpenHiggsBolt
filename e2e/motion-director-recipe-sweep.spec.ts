import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { BASE_URL, installStudioSession } from './helpers/motion-studio';
import { SUPPLIED, colorShare, rawRgb, variance } from './helpers/film-evidence';

/**
 * Renders every recipe of the catalog as one shot with supplied pictures, a brand name and words (lib/recipeSweep.ts,
 * through the same planToProject and export renderer a film uses) and records what appears in real frames. The result
 * is the measured half of the recipe contract (lib/recipeContract.ts): which recipes render, and which actually show
 * the supplied pictures or have their own words replaced.
 *
 * Run: MS_OFFLINE_CLERK=1 npx playwright test -c playwright.ms.config.ts e2e/motion-director-recipe-sweep.spec.ts --timeout 3600000
 * Output: src/apps/motion-director/lib/_generated/recipeSweepResults.json (override with SWEEP_OUT).
 */
const OUT = process.env.SWEEP_OUT ?? path.resolve('src/apps/motion-director/lib/_generated/recipeSweepResults.json');

test('sweep every recipe with supplied pictures, brand and words', async ({ page }) => {
  test.setTimeout(90 * 60_000);
  await installStudioSession(page);
  await page.goto(`${BASE_URL}/studio/motion-director/new`);
  await expect(page.locator('.ms-root')).toBeVisible({ timeout: 120_000 });
  await page.waitForFunction(() => Boolean((window as unknown as { __recipeSweep?: unknown }).__recipeSweep), null, { timeout: 60_000 });
  const stems: string[] = await page.evaluate(() => (window as unknown as { __recipeSweep: { stems: string[] } }).__recipeSweep.stems);
  const only = process.env.SWEEP_ONLY?.split(',');
  const results: Record<string, { renderable: boolean; supplied: number; variance: number; lines: number; replaced: number; neutral: number; textDiff: number; brandDiff: number; error?: string }> = {};
  for (const stem of stems.filter((s) => !only || only.includes(s))) {
    const r = await page.evaluate(({ s }) => (window as unknown as { __recipeSweep: { render: (stem: string, f: number[]) => Promise<{ lines: number; replaced: number; neutral: number; frames: string[]; plain: string[]; error?: string }> } }).__recipeSweep.render(s, [0.1, 0.25, 0.4, 0.6, 0.85]), { s: stem });
    let supplied = 0;
    let v = 0;
    let textDiff = 0;
    for (const f of r.frames) {
      const img = rawRgb(Buffer.from(f.replace(/^data:image\/png;base64,/, ''), 'base64'));
      supplied = Math.max(supplied, ...Object.values(SUPPLIED).map((rgb) => colorShare(img, rgb)));
      v = Math.max(v, variance(img));
    }
    // Share of pixels that changed when the person's words replaced the template's: the words are visible only if this is above zero.
    r.frames.forEach((f, i) => {
      const a = rawRgb(Buffer.from(f.replace(/^data:image\/png;base64,/, ''), 'base64'));
      const b = rawRgb(Buffer.from(r.plain[i].replace(/^data:image\/png;base64,/, ''), 'base64'));
      let diff = 0;
      for (let k = 0; k < a.data.length; k += 3) if (Math.max(Math.abs(a.data[k] - b.data[k]), Math.abs(a.data[k + 1] - b.data[k + 1]), Math.abs(a.data[k + 2] - b.data[k + 2])) > 32) diff++;
      textDiff = Math.max(textDiff, diff / (a.data.length / 3));
    });
    // What the company's brand alone changes (no pictures, no words) against the recipe as authored: its wordmark, logo, colours and lines.
    let brandDiff = 0;
    (r.brand ?? []).forEach((f, i) => {
      const a = rawRgb(Buffer.from(f.replace(/^data:image\/png;base64,/, ''), 'base64'));
      const b = rawRgb(Buffer.from(r.sample[i].replace(/^data:image\/png;base64,/, ''), 'base64'));
      let diff = 0;
      for (let k = 0; k < a.data.length; k += 3) if (Math.max(Math.abs(a.data[k] - b.data[k]), Math.abs(a.data[k + 1] - b.data[k + 1]), Math.abs(a.data[k + 2] - b.data[k + 2])) > 32) diff++;
      brandDiff = Math.max(brandDiff, diff / (a.data.length / 3));
    });
    results[stem] = { renderable: !r.error && r.frames.length === 5 && v > 15, supplied: +supplied.toFixed(4), variance: +v.toFixed(1), lines: r.lines, replaced: r.replaced, neutral: r.neutral, textDiff: +textDiff.toFixed(5), brandDiff: +brandDiff.toFixed(5), ...(r.error ? { error: r.error.slice(0, 160) } : {}) };
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const previous = fs.existsSync(OUT) && only ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
  fs.writeFileSync(OUT, JSON.stringify({ ...previous, ...results }, null, 1) + '\n');
  const bad = Object.entries(results).filter(([, r]) => !r.renderable);
  console.log(`SWEEP ${Object.keys(results).length} recipes, ${bad.length} not renderable: ${bad.map(([s, r]) => `${s} (${r.error ?? 'blank'})`).join(', ')}`);
});
