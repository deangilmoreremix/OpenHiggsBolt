import { describe, it, expect } from 'vitest';
import { getAdvancedControlsForModel, buildAdvancedPayload } from './videoAdvancedControls.js';

// Provider model fakes (only id + provider matter for control resolution).
const klingModel = { id: 'kling-v3.0-pro-text-to-video', provider: 'kling' };
const bytedanceModel = { id: 'bytedance-fake-t2v', provider: 'bytedance' };

describe('buildAdvancedPayload', () => {
  describe('seed', () => {
    const controls = getAdvancedControlsForModel(bytedanceModel);
    it('omits seed === -1', () => {
      const payload = buildAdvancedPayload(controls, { seed: -1 });
      expect(payload).not.toHaveProperty('seed');
    });
    it('includes seed === 42 as a number', () => {
      const payload = buildAdvancedPayload(controls, { seed: 42 });
      expect(payload.seed).toBe(42);
      expect(typeof payload.seed).toBe('number');
    });
  });

  describe('boolean (generate_audio default true)', () => {
    const controls = getAdvancedControlsForModel(bytedanceModel);
    it('sends generate_audio only when !== default (false is sent)', () => {
      const payload = buildAdvancedPayload(controls, { generate_audio: false });
      expect(payload.generate_audio).toBe(false);
    });
    it('omits generate_audio when === default (true)', () => {
      const payload = buildAdvancedPayload(controls, { generate_audio: true });
      expect(payload).not.toHaveProperty('generate_audio');
    });
  });

  describe('enum (bitrate_mode default "high")', () => {
    const controls = getAdvancedControlsForModel(bytedanceModel);
    it('sends enum only when !== default', () => {
      const payload = buildAdvancedPayload(controls, { bitrate_mode: 'standard' });
      expect(payload.bitrate_mode).toBe('standard');
    });
    it('omits enum when === default', () => {
      const payload = buildAdvancedPayload(controls, { bitrate_mode: 'high' });
      expect(payload).not.toHaveProperty('bitrate_mode');
    });
  });

  describe('Kling camera_control assembly', () => {
    const controls = getAdvancedControlsForModel(klingModel);
    it('assembles camera_control from type + axis', () => {
      const payload = buildAdvancedPayload(controls, { camera_control_type: 'down_back', camera_zoom: 3 });
      expect(payload.camera_control).toEqual({ type: 'down_back', config: { zoom: 3 } });
    });
    it('omits camera_control when all defaults', () => {
      const payload = buildAdvancedControlsAllDefaults(controls);
      expect(payload).not.toHaveProperty('camera_control');
    });
  });

  describe('empty / undefined values', () => {
    const controls = getAdvancedControlsForModel(bytedanceModel);
    it('omits undefined values', () => {
      const payload = buildAdvancedPayload(controls, {});
      expect(payload).toEqual({});
    });
    it('omits empty-string negative_prompt', () => {
      const payload = buildAdvancedPayload(controls, { negative_prompt: '' });
      expect(payload).not.toHaveProperty('negative_prompt');
    });
    it('omits null values', () => {
      const payload = buildAdvancedPayload(controls, { negative_prompt: null, seed: null });
      expect(payload).toEqual({});
    });
  });
});

// Helper: a value object where every control is at its default.
function buildAdvancedControlsAllDefaults(controls) {
  const values = {};
  for (const c of controls) {
    if (c.default !== undefined) values[c.key] = c.default;
  }
  return buildAdvancedPayload(controls, values);
}
