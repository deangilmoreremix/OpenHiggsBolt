import type { DirectorScene } from './directorPlan';

/**
 * Upstream pipeline stage 3: the timeline keeps room to breathe. The opening subject action gets at least 3 s, and the closing
 * brand/wordmark scene settles and then holds for at least 1 s (so at least 3 s in all). Rhythm feedback only ever asks for
 * "slower", so these are floors, never ceilings. (The 0.5 s rest after batch motion is part of each recipe's own tuned length;
 * recipes are never sped up, so it is not re-checked here.)
 */
export const HOLD_BUDGET = { openerSec: 3, closerSec: 3 } as const;
const MAX_SCENE_SEC = 12;

export interface HoldViolation { index: number; rule: 'opener' | 'closer'; needSec: number; haveSec: number }

type Timed = Pick<DirectorScene, 'durationSec'>;

export function holdViolations(scenes: readonly Timed[]): HoldViolation[] {
  const out: HoldViolation[] = [];
  const first = scenes[0];
  const last = scenes[scenes.length - 1];
  if (first && first.durationSec < HOLD_BUDGET.openerSec - 0.01) out.push({ index: 0, rule: 'opener', needSec: HOLD_BUDGET.openerSec, haveSec: first.durationSec });
  if (scenes.length > 1 && last && last.durationSec < HOLD_BUDGET.closerSec - 0.01) out.push({ index: scenes.length - 1, rule: 'closer', needSec: HOLD_BUDGET.closerSec, haveSec: last.durationSec });
  return out;
}

/** Lengthen the opener and closer to their floors (never shorten anything). */
export function applyHoldBudget<T extends Timed>(scenes: readonly T[]): T[] {
  const need = new Map(holdViolations(scenes).map((v) => [v.index, v.needSec]));
  return scenes.map((s, i) => (need.has(i) ? { ...s, durationSec: Math.min(MAX_SCENE_SEC, Math.max(s.durationSec, need.get(i)!)) } : s));
}
