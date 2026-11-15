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
