import { describe, it, expect } from 'vitest';
import { planFinalCut, buildSrt } from '../finalCutPlan.js';

describe('planFinalCut (upstream assemble.py semantics)', () => {
  const eight = Array.from({ length: 5 }, (_, i) => ({ src: `c${i}`, duration: 8, planned: 3 }));

  it('uses each clip\'s REAL length: 5 x 8 s with 0.35 s transitions is upstream\'s 38.6 s (within frame rounding)', () => {
    const p = planFinalCut(eight);
    expect(p.clips.map((c) => c.frames)).toEqual([240, 240, 240, 240, 240]);
    expect(p.transitions).toHaveLength(4);
    expect(p.durationInFrames / 30).toBeCloseTo(38.6, 0);
    expect(Math.abs(p.durationInFrames / 30 - 38.6)).toBeLessThan(0.1);
    expect([p.width, p.height, p.fps]).toEqual([720, 1280, 30]);
  });

  it('clamps a transition to a shorter clip like upstream\'s min(td, clip, timeline), and never exceeds neighbours', () => {
    const p = planFinalCut([{ src: 'a', duration: 8 }, { src: 'b', duration: 0.2 }], { transitionSec: 0.35 });
    expect(p.transitions[0]).toBeLessThan(p.clips[1].frames);
    expect(p.transitions[0]).toBe(5); // 0.2 s at 30 fps = 6 frames, minus one so the sequence outlives it
  });

  it('keeps the clip sound at full level by default; extras only apply when asked', () => {
    expect(planFinalCut(eight)).toMatchObject({ keepClipAudio: true, mixVoice: false, clipVolume: 1 });
    expect(planFinalCut(eight, { mixVoice: true, hasNarration: true }).clipVolume).toBe(0.25);
    expect(planFinalCut(eight, { mixVoice: true, hasNarration: false }).clipVolume).toBe(1);
    expect(planFinalCut(eight, { keepClipAudio: false }).keepClipAudio).toBe(false);
  });

  it('extension: trimToPlanned cuts each clip to its planned shot length', () => {
    const p = planFinalCut(eight, { trimToPlanned: true });
    expect(p.clips.map((c) => c.frames)).toEqual([90, 90, 90, 90, 90]);
    expect(planFinalCut([{ src: 'a', duration: 2, planned: 3 }], { trimToPlanned: true }).clips[0].frames).toBe(60); // never longer than the clip
  });

  it('handles one clip and rejects bad input', () => {
    expect(planFinalCut([eight[0]])).toMatchObject({ transitions: [], durationInFrames: 240 });
    expect(() => planFinalCut([])).toThrow(/No clips/);
    expect(() => planFinalCut([{ src: 'a', duration: 0 }])).toThrow(/usable duration/);
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

  it('follows the rendered clip lengths when given them (8 s clips planned as 3 s)', () => {
    const beats = [
      { narration: 'one two', shots: [{ duration_sec: 3 }, { duration_sec: 3 }] },
      { narration: 'three four', shots: [{ duration_sec: 3 }] },
    ];
    expect(buildSrt(beats, 0.5)).toContain('00:00:00,000 --> 00:00:05,500\none two');
    const real = buildSrt(beats, 0.5, [8, 8, 8]);
    expect(real).toContain('00:00:00,000 --> 00:00:15,500\none two'); // 8 + (8 - 0.5)
    expect(real).toContain('00:00:15,500 --> 00:00:23,000\nthree four');
  });
});
