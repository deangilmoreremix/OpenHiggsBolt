import { describe, expect, it } from 'vitest';
import { applyHoldBudget, holdViolations } from '../lib/holdBudget';

const sc = (...d: number[]) => d.map((durationSec) => ({ durationSec }));

describe('hold budget (upstream stage 3)', () => {
  it('flags an opener or closer under 3 s and nothing else', () => {
    expect(holdViolations(sc(2, 4, 4, 2.5)).map((v) => v.rule)).toEqual(['opener', 'closer']);
    expect(holdViolations(sc(3, 1.5, 3))).toEqual([]);
  });
  it('lengthens to the floor, never shortens', () => {
    expect(applyHoldBudget(sc(2, 4, 2.5)).map((s) => s.durationSec)).toEqual([3, 4, 3]);
    expect(applyHoldBudget(sc(5, 4, 6)).map((s) => s.durationSec)).toEqual([5, 4, 6]);
  });
});

import { MOTION_TEMPLATES } from '@/data/motionRecipeCatalog';
import { fitNativeLengths } from '../lib/filmChat';
import type { DirectorPlan } from '../lib/directorPlan';

describe('the hold budget is granted from spare time, never by dropping a scene', () => {
  const id = (c: string) => MOTION_TEMPLATES.find((t) => t.componentName === c)!.id;
  const plan = (): DirectorPlan => ({
    title: 't', summary: '', palette: { background: '#fff', text: '#000', accent: '#f00' },
    scenes: [
      { kind: 'title', recipeId: '', durationSec: 2, headline: 'Open', caption: '', transition: 'cut' },
      { kind: 'shot', recipeId: id('CrashImpactReal'), durationSec: 5, headline: 'a', caption: 'b', transition: 'flash' },
      { kind: 'shot', recipeId: id('HitCounter'), durationSec: 5, headline: 'a', caption: 'b', transition: 'cut' },
      { kind: 'title', recipeId: '', durationSec: 2, headline: 'End', caption: '', transition: 'cut' },
    ],
  });
  it('with spare time, the opener and closer reach 3 s', () => {
    const out = fitNativeLengths(plan(), 40);
    expect(out.scenes.length).toBe(4);
    expect(out.scenes[0].durationSec).toBeGreaterThanOrEqual(3 - 0.01);
    expect(out.scenes[out.scenes.length - 1].durationSec).toBeGreaterThanOrEqual(3 - 0.01);
  });
  it('with no spare time, no scene is dropped for the hold budget', () => {
    const natural = fitNativeLengths(plan(), 40).scenes.reduce((n, s) => n + s.durationSec, 0);
    const tight = fitNativeLengths(plan(), Math.max(15, natural - 14));
    expect(tight.scenes.length).toBeGreaterThanOrEqual(3);
    expect(tight.scenes.filter((s) => s.kind === 'shot').length).toBe(2);
  });
});
