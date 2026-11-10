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
  const results: Record<string, { renderable: boolean; supplied: number; variance: number; lines: number; replaced: number; neutral: number; error?: string }> = {};
  for (const stem of stems.filter((s) => !only || only.includes(s))) {
    const r = await page.evaluate(({ s }) => (window as unknown as { __recipeSweep: { render: (stem: string, f: number[]) => Promise<{ lines: number; replaced: number; neutral: number; frames: string[]; error?: string }> } }).__recipeSweep.render(s, [0.35, 0.8]), { s: stem });
    let supplied = 0;
    let v = 0;
    for (const f of r.frames) {
      const img = rawRgb(Buffer.from(f.replace(/^data:image\/png;base64,/, ''), 'base64'));
      supplied = Math.max(supplied, ...Object.values(SUPPLIED).map((rgb) => colorShare(img, rgb)));
      v = Math.max(v, variance(img));
    }
    results[stem] = { renderable: !r.error && r.frames.length === 2 && v > 15, supplied: +supplied.toFixed(4), variance: +v.toFixed(1), lines: r.lines, replaced: r.replaced, neutral: r.neutral, ...(r.error ? { error: r.error.slice(0, 160) } : {}) };
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const previous = fs.existsSync(OUT) && only ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
  fs.writeFileSync(OUT, JSON.stringify({ ...previous, ...results }, null, 1) + '\n');
  const bad = Object.entries(results).filter(([, r]) => !r.renderable);
  console.log(`SWEEP ${Object.keys(results).length} recipes, ${bad.length} not renderable: ${bad.map(([s, r]) => `${s} (${r.error ?? 'blank'})`).join(', ')}`);
});
