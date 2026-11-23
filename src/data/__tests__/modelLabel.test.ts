import { describe, it, expect } from 'vitest';
import { getModelLabel, MODEL_BY_SOURCE } from '../types';
import { MINIMAX_H3_DEMOS } from '../minimaxH3Demos';
import { SEEDANCE_25_DEMOS } from '../seedance25Demos';
import { SEEDANCE_1_DEMOS } from '../seedance1Demos';
import { PROMPTFEED_DEMOS } from '../promptFeedDemos';
import { SEEDANCE_2PROMPT_DEMOS } from '../seedance2PromptDemos';

describe('getModelLabel', () => {
  it("prefers the demo's own recorded model", () => {
    expect(getModelLabel({ sourceRepo: 'promptfeed', modelName: 'Kling V2.5 Turbo Pro' })).toBe('Kling V2.5 Turbo Pro');
    expect(getModelLabel({ sourceRepo: 'minimax-h3', modelName: 'MiniMax Image 01' })).toBe('MiniMax Image 01');
  });

  it("falls back to the collection's model", () => {
    expect(getModelLabel({ sourceRepo: 'minimax-h3' })).toBe('MiniMax Hailuo');
    expect(getModelLabel({ sourceRepo: 'seedance-25' })).toBe('Seedance 2.5');
    expect(getModelLabel({ sourceRepo: 'seedance-1' })).toBe('Seedance 1');
    expect(getModelLabel({ sourceRepo: 'seedance2prompt' })).toBe('Seedance 2.0');
  });

  it('calls mixed-model and unknown sources a community prompt', () => {
    expect(getModelLabel({ sourceRepo: 'promptfeed' })).toBe('Community prompt');
    expect(getModelLabel({ sourceRepo: 'something-new' })).toBe('Community prompt');
  });

  it('never labels a catalog demo "SmartVideo GO AI"', () => {
    const all = [...MINIMAX_H3_DEMOS, ...SEEDANCE_25_DEMOS, ...SEEDANCE_1_DEMOS, ...PROMPTFEED_DEMOS, ...SEEDANCE_2PROMPT_DEMOS];
    for (const demo of all) expect(getModelLabel(demo)).not.toMatch(/SmartVideo/i);
    expect(Object.keys(MODEL_BY_SOURCE)).not.toContain('promptfeed');
  });

  it('labels the Prompt Feed prompts that name Seedance 2.5 in their text', () => {
    const named = PROMPTFEED_DEMOS.filter((d) => d.modelName === 'Seedance 2.5').map((d) => d.slug);
    expect(named).toEqual(expect.arrayContaining([
      '2690-cinematic-korean-convenience-store-snack-challenge-vlog',
      '3320-cozy-crochet-amigurumi-girl-ordering-pizza-seedance-2-5-stop',
    ]));
  });
});
