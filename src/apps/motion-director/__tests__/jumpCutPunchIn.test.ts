import { describe, expect, it } from 'vitest';
import { JUMP_1, JUMP_2, JUMP_CUT_PUNCH_IN_DURATION, STEPS, stepAt } from '../demosrc/rhythm/rhythm-interrupt-moves/JumpCutPunchIn';
import { MOTION_TEMPLATES } from '@/data/motionRecipeCatalog';

describe('JumpCutPunchIn: three hard cuts, each at least 1.5x the last', () => {
  it('steps exactly on the two cut frames and nowhere else', () => {
    expect(stepAt(0)).toBe(0);
    expect(stepAt(JUMP_1 - 1)).toBe(0);
    expect(stepAt(JUMP_1)).toBe(1);
    expect(stepAt(JUMP_2 - 1)).toBe(1);
    expect(stepAt(JUMP_2)).toBe(2);
    expect(stepAt(JUMP_CUT_PUNCH_IN_DURATION - 1)).toBe(2);
  });
  it('each step is >= 1.5x the one before, or the cut reads as a shake', () => {
    expect(STEPS[1] / STEPS[0]).toBeGreaterThanOrEqual(1.5);
    expect(STEPS[2] / STEPS[1]).toBeGreaterThanOrEqual(1.5);
  });
  it('the catalog plays it for exactly the length the recipe was authored for', () => {
    const t = MOTION_TEMPLATES.find((m) => m.componentName === 'JumpCutPunchIn');
    expect(t?.durationInFrames).toBe(JUMP_CUT_PUNCH_IN_DURATION);
  });
  it('has a long enough still final step (>= 45 frames)', () => {
    expect(JUMP_CUT_PUNCH_IN_DURATION - (JUMP_2 + 16)).toBeGreaterThanOrEqual(45);
  });
});
