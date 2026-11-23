import fs from 'node:fs';
import path from 'node:path';
import { expect, type Page } from '@playwright/test';
import { BASE_URL, installStudioSession } from './motion-studio';

/** Open the studio once and wait for the dev-only recipe hook (lib/recipeSweep.ts). */
export async function openSweep(page: Page) {
  await installStudioSession(page);
  await page.goto(`${BASE_URL}/studio/motion-director/new`);
  await expect(page.locator('.ms-root')).toBeVisible({ timeout: 120_000 });
  await page.waitForFunction(() => Boolean((window as unknown as { __recipeSweep?: unknown }).__recipeSweep), null, { timeout: 60_000 });
}

/** Render frames of one recipe through the export renderer; `sample` = no customer capture (the original demo). */
export async function recipeFrames(page: Page, stem: string, frames: number[], opts: { sample?: boolean; scale?: number; custom?: unknown } = {}): Promise<{ png: Buffer[]; durationFrames: number }> {
  const r = await page.evaluate(
    ({ stem, frames, sample, scale, custom }) => (window as unknown as { __recipeSweep: { frames: (s: string, f: number[], m: { sample?: boolean; custom?: unknown }, sc: number) => Promise<{ frames: string[]; durationFrames: number; error?: string }> } }).__recipeSweep.frames(stem, frames, { sample, custom }, scale),
    { stem, frames, sample: opts.sample, scale: opts.scale ?? 0.5, custom: opts.custom },
  );
  if (r.error) throw new Error(`${stem}: ${r.error}`);
  return { png: r.frames.map((f) => Buffer.from(f.replace(/^data:image\/png;base64,/, ''), 'base64')), durationFrames: r.durationFrames };
}

export function save(dir: string, name: string, png: Buffer) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name), png);
}
