import { describe, expect, it } from 'vitest';
import { beatsFromEnvelope, syncReport } from '../lib/beatSync';

const HOP = 0.0116;
/** An envelope with a kick every `period` seconds starting at `offset`, decaying like a drum hit. */
const pulses = (bpm: number, seconds: number, offset = 0.2, accentEvery = 0) => {
  const n = Math.floor(seconds / HOP);
  const env = new Float64Array(n);
  const period = 60 / bpm;
  let k = 0;
  for (let t = offset; t < seconds; t += period, k++) {
    const i = Math.round(t / HOP);
    const amp = accentEvery && k % accentEvery === 0 ? 1 : 0.7;
    for (let j = 0; j < 12 && i + j < n; j++) env[i + j] = Math.max(env[i + j], amp * Math.exp(-j / 4));
  }
  return env;
};

describe('beatsFromEnvelope', () => {
  it.each([100, 120, 128, 140])('finds a steady %i bpm pulse within a bpm and lands beats on the hits', (bpm) => {
    const { bpm: found, beats } = beatsFromEnvelope(pulses(bpm, 30), HOP, 30);
    expect(Math.abs(found - bpm)).toBeLessThanOrEqual(1);
    // Every beat of the grid sits within 50 ms of a real hit, from the first to the last (no drift).
    const period = 60 / bpm;
    const worst = Math.max(...beats.map((b) => { const r = (b - 0.2) / period; return Math.abs(r - Math.round(r)) * period; }));
    expect(worst).toBeLessThan(0.05);
  });

  it('settles on the usual tempo, not half-time, when the bar has a louder downbeat', () => {
    const { bpm } = beatsFromEnvelope(pulses(120, 40, 0.1, 4), HOP, 40);
    expect(bpm).toBeGreaterThanOrEqual(110);
    expect(bpm).toBeLessThanOrEqual(130);
  });

  it('says nothing for silence', () => {
    expect(beatsFromEnvelope(new Float64Array(2000), HOP, 20).beats).toEqual([]);
  });
});

describe('syncReport', () => {
  it('measures, in frames, how many cuts sit within 3 frames of a beat', () => {
    const beats = [0, 0.5, 1, 1.5, 2];
    const r = syncReport([0.5, 1.02, 1.6], beats, 30);
    expect(r.cuts).toBe(3);
    expect(r.within).toBe(2);
    expect(r.worstFrames).toBe(3);
  });
  it('reports zero synced when there is no grid', () => {
    expect(syncReport([1, 2], [], 30)).toEqual({ cuts: 2, within: 0, worstFrames: 0 });
  });
});
