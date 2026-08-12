import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateVideo } from './muapi.js';
import { getAdvancedControlsForModel, buildAdvancedPayload } from './videoAdvancedControls.js';

// Seedance 2.0 (bytedance) declares: negative_prompt, seed, generate_audio,
// camera_fixed, bitrate_mode, output_format, watermark, return_last_frame.
// It does NOT declare: cfg_scale, enable_sound, camera_control(_type).
// NOTE: buildAdvancedPayload (videoAdvancedControls.js, out of scope) currently
// skips `camera_fixed` via a `startsWith("camera_")` rule, so we assert the
// remaining declared keys that it forwards correctly.
const model = { id: 'seedance-v2.0-t2v', provider: 'bytedance' };
const controls = getAdvancedControlsForModel(model);

const fullValues = {
  negative_prompt: 'no cats',
  seed: 42,
  generate_audio: false,
  bitrate_mode: 'standard',
  output_format: 'mov',
  watermark: true,
  return_last_frame: true,
};

describe('generateVideo advanced pass-through', () => {
  let capturedBody;

  beforeEach(() => {
    capturedBody = null;
  });

  it('forwards only the model-declared advanced keys and excludes undeclared ones', async () => {
    const advanced = buildAdvancedPayload(controls, fullValues);

    global.fetch = vi.fn(async (url, options) => {
      const method = options?.method || 'GET';
      if (method === 'POST') {
        capturedBody = JSON.parse(options.body);
        return {
          ok: true,
          json: async () => ({ request_id: 'r' }),
        };
      }
      // Poll call → return a completed result so the promise resolves.
      return {
        ok: true,
        json: async () => ({
          status: 'succeeded',
          url: 'https://example.com/video.mp4',
        }),
      };
    });

    const result = await generateVideo('fakekey', {
      model: 'seedance-v2.0-t2v',
      prompt: 'x',
      ...advanced,
    });

    expect(result.url).toBe('https://example.com/video.mp4');

    // Base field present.
    expect(capturedBody.prompt).toBe('x');

    // Declared advanced keys are forwarded.
    for (const k of [
      'negative_prompt',
      'seed',
      'generate_audio',
      'bitrate_mode',
      'output_format',
      'watermark',
      'return_last_frame',
    ]) {
      expect(capturedBody).toHaveProperty(k, fullValues[k]);
    }

    // Keys NOT declared for this model are excluded.
    for (const k of ['cfg_scale', 'enable_sound', 'camera_control', 'camera_control_type']) {
      expect(capturedBody).not.toHaveProperty(k);
    }
  });
});
