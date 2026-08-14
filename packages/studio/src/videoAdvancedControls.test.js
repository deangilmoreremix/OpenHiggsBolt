import { describe, it, expect } from 'vitest';
import { getAdvancedControlsForModel, buildAdvancedPayload } from './videoAdvancedControls.js';

// Realistic model fakes (provider + id drive control resolution).
const seedance25 = { id: 'seedance-2.5-text-to-video', provider: 'bytedance' };
const seedanceV2 = { id: 'seedance-v2.0-t2v', provider: 'bytedance' };
const seedanceOmni = { id: 'seedance-2-omni-reference', provider: 'bytedance' };
const seedanceFirstLast = { id: 'seedance-2-first-last-frame', provider: 'bytedance' };
const klingOmni = { id: 'kling-v3.0-omni-pro-text-to-video', provider: 'kling' };

describe('getAdvancedControlsForModel (per-model audit)', () => {
  it('Seedance 2.5 gets the 2.x control set', () => {
    const keys = getAdvancedControlsForModel(seedance25).map((c) => c.key);
    expect(keys).toEqual(
      expect.arrayContaining([
        'negative_prompt', 'seed', 'camera_fixed', 'bitrate_mode',
        'output_format', 'watermark', 'return_last_frame', 'generate_audio', 'ratio_adaptive',
      ]),
    );
  });

  it('older Seedance (v2.0) is NOT over-exposed with 2.x-only controls', () => {
    const keys = getAdvancedControlsForModel(seedanceV2).map((c) => c.key);
    expect(keys).toEqual(['negative_prompt', 'seed']);
    expect(keys).not.toContain('bitrate_mode');
    expect(keys).not.toContain('output_format');
  });

  it('Seedance omni-reference adds reference media controls', () => {
    const keys = getAdvancedControlsForModel(seedanceOmni).map((c) => c.key);
    expect(keys).toEqual(expect.arrayContaining(['images_list', 'videos_list', 'audios_list']));
  });

  it('Seedance first/last-frame adds first_frame/last_frame', () => {
    const keys = getAdvancedControlsForModel(seedanceFirstLast).map((c) => c.key);
    expect(keys).toEqual(expect.arrayContaining(['first_frame', 'last_frame']));
  });

  it('Kling 3.0 Omni drops negative_prompt but adds reference + multi-shot', () => {
    const keys = getAdvancedControlsForModel(klingOmni).map((c) => c.key);
    expect(keys).not.toContain('negative_prompt');
    expect(keys).toEqual(expect.arrayContaining(['cfg_scale', 'enable_sound', 'reference_image_urls', 'multi_prompt', 'multi_shots']));
  });
});

describe('buildAdvancedPayload', () => {
  describe('seed', () => {
    const controls = getAdvancedControlsForModel(seedance25);
    it('omits seed === -1', () => {
      expect(buildAdvancedPayload(controls, { seed: -1 })).not.toHaveProperty('seed');
    });
    it('includes seed === 42 as a number', () => {
      const p = buildAdvancedPayload(controls, { seed: 42 });
      expect(p.seed).toBe(42);
    });
  });

  describe('boolean (generate_audio default true)', () => {
    const controls = getAdvancedControlsForModel(seedance25);
    it('sends generate_audio only when !== default (false is sent)', () => {
      expect(buildAdvancedPayload(controls, { generate_audio: false }).generate_audio).toBe(false);
    });
    it('omits generate_audio when === default (true)', () => {
      expect(buildAdvancedPayload(controls, { generate_audio: true })).not.toHaveProperty('generate_audio');
    });
  });

  describe('enum (bitrate_mode default "high")', () => {
    const controls = getAdvancedControlsForModel(seedance25);
    it('sends enum only when !== default', () => {
      expect(buildAdvancedPayload(controls, { bitrate_mode: 'standard' }).bitrate_mode).toBe('standard');
    });
    it('omits enum when === default', () => {
      expect(buildAdvancedPayload(controls, { bitrate_mode: 'high' })).not.toHaveProperty('bitrate_mode');
    });
  });

  describe('camera_fixed (distinct boolean, not a camera axis)', () => {
    const controls = getAdvancedControlsForModel(seedance25);
    it('forwards camera_fixed when true', () => {
      expect(buildAdvancedPayload(controls, { camera_fixed: true }).camera_fixed).toBe(true);
    });
    it('omits camera_fixed when false (default)', () => {
      expect(buildAdvancedPayload(controls, { camera_fixed: false })).not.toHaveProperty('camera_fixed');
    });
  });

  describe('Kling camera_control assembly', () => {
    const controls = getAdvancedControlsForModel(klingOmni);
    it('assembles camera_control from type + axis', () => {
      const p = buildAdvancedPayload(controls, { camera_control_type: 'down_back', camera_zoom: 3 });
      expect(p.camera_control).toEqual({ type: 'down_back', config: { zoom: 3 } });
    });
    it('omits camera_control when all defaults', () => {
      expect(buildAdvancedPayload(controls, {})).not.toHaveProperty('camera_control');
    });
  });

  describe('url_list (reference media)', () => {
    const controls = getAdvancedControlsForModel(seedanceOmni);
    it('splits on newlines/commas into an array', () => {
      const p = buildAdvancedPayload(controls, { images_list: 'a.jpg\nb.jpg, c.jpg' });
      expect(p.images_list).toEqual(['a.jpg', 'b.jpg', 'c.jpg']);
    });
    it('clamps to maxItems (30)', () => {
      const urls = Array.from({ length: 35 }, (_, i) => `img${i}.jpg`).join('\n');
      const p = buildAdvancedPayload(controls, { images_list: urls });
      expect(p.images_list).toHaveLength(30);
    });
    it('omits when empty', () => {
      expect(buildAdvancedPayload(controls, { images_list: '' })).not.toHaveProperty('images_list');
    });
  });

  describe('first/last frame → images_list', () => {
    const controls = getAdvancedControlsForModel(seedanceFirstLast);
    it('assembles images_list:[first,last]', () => {
      const p = buildAdvancedPayload(controls, { first_frame: 'f.jpg', last_frame: 'l.jpg' });
      expect(p.images_list).toEqual(['f.jpg', 'l.jpg']);
    });
    it('omits when both empty', () => {
      expect(buildAdvancedPayload(controls, {})).not.toHaveProperty('images_list');
    });
  });

  describe('multi_prompt → array (max 6)', () => {
    const controls = getAdvancedControlsForModel(klingOmni);
    it('splits into an array capped at 6', () => {
      const p = buildAdvancedPayload(controls, { multi_prompt: 'p1\np2\np3\np4\np5\np6\np7' });
      expect(p.multi_prompt).toEqual(['p1', 'p2', 'p3', 'p4', 'p5', 'p6']);
    });
  });

  describe('ratio_adaptive', () => {
    const controls = getAdvancedControlsForModel(seedance25);
    it('emits ratio:"adaptive" when true', () => {
      expect(buildAdvancedPayload(controls, { ratio_adaptive: true }).ratio).toBe('adaptive');
    });
    it('omits when false', () => {
      expect(buildAdvancedPayload(controls, { ratio_adaptive: false })).not.toHaveProperty('ratio');
    });
  });

  describe('empty / undefined values', () => {
    const controls = getAdvancedControlsForModel(seedance25);
    it('omits undefined values', () => {
      expect(buildAdvancedPayload(controls, {})).toEqual({});
    });
    it('omits empty-string negative_prompt', () => {
      expect(buildAdvancedPayload(controls, { negative_prompt: '' })).not.toHaveProperty('negative_prompt');
    });
    it('omits null values', () => {
      expect(buildAdvancedPayload(controls, { negative_prompt: null, seed: null })).toEqual({});
    });
  });
});
