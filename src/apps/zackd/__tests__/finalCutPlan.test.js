import { describe, it, expect } from 'vitest';
import { planFinalCut, buildSrt } from '../finalCutPlan.js';

describe('planFinalCut', () => {
  const shots = [{ src: 'a', duration: 3, zoom: false }, { src: 'b', duration: 3, zoom: true }, { src: 'c', duration: 4 }];
  it('computes frames and a transition-adjusted total', () => {
    const p = planFinalCut(shots);
    expect(p.transitionFrames).toBe(11); // round(0.35 * 30) = 10.5 -> 11
    expect(p.clips.map((c) => c.frames)).toEqual([90, 90, 120]);
    expect(p.durationInFrames).toBe(300 - 2 * 11);
    expect(p.clips[1].zoom).toBe(true);
    expect(p.clips[2].zoom).toBe(false);
    expect([p.width, p.height, p.fps]).toEqual([720, 1280, 30]);
  });
  it('handles one clip and rejects bad input', () => {
    expect(planFinalCut([shots[0]])).toMatchObject({ transitionFrames: 0, durationInFrames: 90 });
    expect(() => planFinalCut([])).toThrow(/No clips/);
    expect(() => planFinalCut([{ src: 'a', duration: 0.2 }, { src: 'b', duration: 3 }])).toThrow(/too short/);
  });
});

describe('buildSrt', () => {
  it('places beat captions on the transition-adjusted timeline without overlap', () => {
    const beats = [
      { narration: 'one two three four five six seven eight', shots: [{ duration_sec: 3 }, { duration_sec: 3 }] },
      { narration: 'next beat', shots: [{ duration_sec: 4 }] },
    ];
    const srt = buildSrt(beats, 0.5);
    expect(srt).toContain('1\n00:00:00,000 --> 00:00:02,750\none two three four five six');
    expect(srt).toContain('2\n00:00:02,750 --> 00:00:05,500\nseven eight');
    expect(srt).toContain('3\n00:00:05,500 --> 00:00:09,000\nnext beat');
  });
});
