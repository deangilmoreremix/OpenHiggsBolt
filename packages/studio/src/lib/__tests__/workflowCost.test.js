import { describe, it, expect, vi } from 'vitest';
import registry from '../../skills/registry.json';
import {
  summarizeWorkflowSteps,
  describeWorkflowOutputs,
  staticCostNote,
  estimateWorkflowCost,
  formatUsd,
} from '../workflowCost.js';

const skill = (slug) => registry.skills.find((s) => s.slug === slug);

describe('summarizeWorkflowSteps', () => {
  it('counts billable steps and ignores script/approval/upload', () => {
    expect(summarizeWorkflowSteps(skill('muapi-3d-logo-animation'))).toMatchObject({ image: 1, video: 1 });
    expect(summarizeWorkflowSteps(skill('muapi-social-pack'))).toMatchObject({ image: 2, video: 0 });
    // script + image + i2v
    expect(summarizeWorkflowSteps(skill('muapi-storyboard-to-cooking-video'))).toMatchObject({ image: 1, video: 1 });
    // upload + clipping
    expect(summarizeWorkflowSteps(skill('muapi-youtube-shorts'))).toMatchObject({ image: 0, video: 0, clipping: 1 });
  });
});

describe('notes', () => {
  it('describes outputs and prices from measured runs', () => {
    const s = summarizeWorkflowSteps(skill('muapi-3d-logo-animation'));
    expect(describeWorkflowOutputs(s)).toBe('This will generate 1 image and 1 video.');
    expect(staticCostNote(s)).toContain('$0.75 per 5 s video');
    expect(staticCostNote(summarizeWorkflowSteps(skill('muapi-social-pack')))).not.toContain('video');
  });

  it('formats small amounts with three decimals', () => {
    expect(formatUsd(0.0165)).toBe('$0.017');
    expect(formatUsd(0.7665)).toBe('$0.77');
  });
});

describe('estimateWorkflowCost', () => {
  it('sums one estimate per model step', async () => {
    const estimate = vi.fn().mockResolvedValueOnce(0.0165).mockResolvedValueOnce(0.75);
    const total = await estimateWorkflowCost('key', skill('muapi-3d-logo-animation'), { material_style: 'x' }, estimate);
    expect(total).toBeCloseTo(0.7665);
    expect(estimate.mock.calls.map((c) => c[1])).toEqual(['nano-banana-2-edit', 'seedance-2-image-to-video-fast']);
    expect(estimate.mock.calls[1][2]).toMatchObject({ duration: 5 });
  });

  it('returns null rather than a partial total when any estimate is unavailable', async () => {
    const estimate = vi.fn().mockResolvedValueOnce(0.0165).mockResolvedValueOnce(null);
    expect(await estimateWorkflowCost('key', skill('muapi-3d-logo-animation'), {}, estimate)).toBeNull();
  });

  it('returns null when an estimate call hangs past the timeout', async () => {
    const hang = vi.fn(() => new Promise(() => {}));
    const started = Date.now();
    expect(await estimateWorkflowCost('key', skill('muapi-3d-logo-animation'), {}, hang, 30)).toBeNull();
    expect(Date.now() - started).toBeLessThan(1000);
  });

  it('returns null without an API key and for clipping workflows', async () => {
    const estimate = vi.fn();
    expect(await estimateWorkflowCost('', skill('muapi-3d-logo-animation'), {}, estimate)).toBeNull();
    expect(await estimateWorkflowCost('key', skill('muapi-youtube-shorts'), {}, estimate)).toBeNull();
    expect(estimate).not.toHaveBeenCalled();
  });
});
