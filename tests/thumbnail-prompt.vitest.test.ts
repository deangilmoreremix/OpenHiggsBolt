import { describe, expect, it } from 'vitest';
import {
  CONCEPT_PRESETS,
  DEFAULT_BRIEF,
  aspectRatioForSize,
  buildThumbnailPrompt,
  deriveCanvasAdjustments,
  distinctConceptBriefs,
  validateCustomSize,
  type ThumbnailBrief,
} from '@/components/social-publishing/thumbnail/thumbnailPrompt';

const brief = (over: Partial<ThumbnailBrief> = {}): ThumbnailBrief => ({ ...DEFAULT_BRIEF, title: 'I tried 5 mics', ...over });

describe('buildThumbnailPrompt', () => {
  it('writes the brief fields into the prompt', () => {
    const p = buildThumbnailPrompt(brief({ topic: 'USB microphones', audience: 'new streamers', viewerSees: 'a mic on a desk' }));
    expect(p).toContain('Video title: "I tried 5 mics"');
    expect(p).toContain('Topic: USB microphones');
    expect(p).toContain('Audience: new streamers');
    expect(p).toContain('What the viewer sees: a mic on a desk');
  });

  it('each preset contributes its own fragment', () => {
    const prompts = CONCEPT_PRESETS.map((p) => buildThumbnailPrompt(brief({ presetId: p.id })));
    expect(new Set(prompts).size).toBe(CONCEPT_PRESETS.length);
    CONCEPT_PRESETS.forEach((p, i) => expect(prompts[i]).toContain(p.fragment));
  });

  it('describes subject placement and keeps headline space on the opposite side', () => {
    const left = buildThumbnailPrompt(brief({ subject: { ...DEFAULT_BRIEF.subject, placement: 'left', crop: 'close-up', gaze: 'right', expression: 'surprised', scale: 80, outline: 'white', pose: 'pointing' } }));
    expect(left).toContain('placed on the left of the frame');
    expect(left).toContain('tight close-up crop');
    expect(left).toContain('looking to the right');
    expect(left).toContain('surprised expression');
    expect(left).toContain('about 80%');
    expect(left).toContain('white outline');
    expect(left).toContain('pose: pointing');
    expect(left).toContain('Keep the right side of the frame free for a headline');
    expect(buildThumbnailPrompt(brief({ subject: { ...DEFAULT_BRIEF.subject, placement: 'center' } }))).toContain('Keep the top of the frame free');
  });

  it('omits subject lines when there is no subject', () => {
    const p = buildThumbnailPrompt(brief({ subject: { ...DEFAULT_BRIEF.subject, kind: 'none' } }));
    expect(p).not.toContain('Subject:');
    expect(p).not.toContain('free for a headline');
  });

  it('use original photo references the supplied person or product exactly', () => {
    const p = buildThumbnailPrompt(brief({
      subject: { ...DEFAULT_BRIEF.subject, kind: 'product', useOriginal: true },
      references: [{ role: 'product', label: 'upload 1' }],
    }));
    expect(p).toContain('Reference image 1 (upload 1) - Use this product exactly');
    expect(p).toContain('Use the supplied product photo exactly as the product');
  });

  it('writes every reference role into the prompt in order', () => {
    const p = buildThumbnailPrompt(brief({ references: [{ role: 'person' }, { role: 'lighting' }, { role: 'style' }, { role: 'layout' }] }));
    expect(p).toContain('Reference image 1 - Use this person exactly');
    expect(p).toContain('Reference image 2 - Match this lighting');
    expect(p).toContain('Reference image 3 - Style reference');
    expect(p).toContain('Reference image 4 - Layout sketch');
  });

  it('background and style controls become prompt text; solid and gradient stay approximate', () => {
    const scene = buildThumbnailPrompt(brief({ background: { ...DEFAULT_BRIEF.background, scene: 'a neon city street', blur: 'strong', palette: 'teal and orange', lighting: 'neon', style: 'cinematic', depth: 'deep' } }));
    expect(scene).toContain('Background scene: a neon city street');
    expect(scene).toContain('background heavily blurred');
    expect(scene).toContain('colour palette: teal and orange');
    expect(scene).toContain('neon coloured lighting');
    expect(scene).toContain('cinematic film look');
    const solid = buildThumbnailPrompt(brief({ background: { ...DEFAULT_BRIEF.background, mode: 'solid', solidColor: '#ff0000' } }));
    expect(solid).toContain('plain flat solid backdrop');
    expect(solid).toContain('approximately #ff0000');
    const grad = buildThumbnailPrompt(brief({ background: { ...DEFAULT_BRIEF.background, mode: 'gradient', gradientFrom: '#111111', gradientTo: '#2222ff' } }));
    expect(grad).toContain('from approximately #111111 to #2222ff');
  });

  it('is deterministic', () => {
    expect(buildThumbnailPrompt(brief())).toBe(buildThumbnailPrompt(brief()));
  });
});

describe('distinctConceptBriefs', () => {
  it('returns three briefs with different presets, placements and prompts', () => {
    const briefs = distinctConceptBriefs(brief({ presetId: 'host-headline' }));
    expect(briefs).toHaveLength(3);
    expect(new Set(briefs.map((b) => b.presetId)).size).toBe(3);
    expect(new Set(briefs.map((b) => b.subject.placement)).size).toBe(3);
    expect(new Set(briefs.map(buildThumbnailPrompt)).size).toBe(3);
    expect(briefs[0].presetId).toBe('host-headline');
  });
});

describe('deriveCanvasAdjustments', () => {
  it('keeps exact colours out of the prompt and in the canvas adjustments', () => {
    const adj = deriveCanvasAdjustments(brief({ background: { ...DEFAULT_BRIEF.background, mode: 'gradient', gradientFrom: '#111111', gradientTo: '#2222ff', blur: 'soft', contrast: 'high', saturation: 'low' } }));
    expect(adj.gradient).toEqual({ from: '#111111', to: '#2222ff', angle: 135 });
    expect(adj.backgroundColor).toBeUndefined();
    expect(adj.backgroundBlurPx).toBeGreaterThan(0);
    expect(adj.contrast).toBeGreaterThan(1);
    expect(adj.saturation).toBeLessThan(1);
    expect(deriveCanvasAdjustments(brief({ background: { ...DEFAULT_BRIEF.background, mode: 'solid', solidColor: '#abcdef' } })).backgroundColor).toBe('#abcdef');
  });
});

describe('validateCustomSize', () => {
  it('accepts allowed sizes', () => {
    expect(validateCustomSize('1536', '864')).toEqual({ ok: true, size: '1536x864' });
    expect(validateCustomSize(1280, 720)).toEqual({ ok: true, size: '1280x720' });
    expect(validateCustomSize(3840, 2160).ok).toBe(true);
  });

  it.each([
    ['abc', '720', /whole-number/],
    ['1280', '', /whole-number/],
    ['1281', '720', /multiples of 16/],
    ['4096', '1024', /3840/],
    ['3840', '1024', /3 times/],
    ['512', '512', /0\.65/],
    ['3840', '2400', /8\.3/],
  ])('rejects %s x %s', (w, h, message) => {
    const r = validateCustomSize(w, h);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(message);
  });
});

describe('aspectRatioForSize', () => {
  it('reduces WxH to a ratio', () => {
    expect(aspectRatioForSize('1536x864')).toBe('16:9');
    expect(aspectRatioForSize('1024x1024')).toBe('1:1');
    expect(aspectRatioForSize('864x1536')).toBe('9:16');
  });
});
