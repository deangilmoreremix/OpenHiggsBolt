import { describe, it, expect, vi } from 'vitest';
import { generateVideo } from './muapi.js';
import { getAdvancedControlsForModel, buildAdvancedPayload } from './videoAdvancedControls.js';

// Seedance 2.5 declares: negative_prompt, seed, camera_fixed, bitrate_mode,
// output_format, watermark, return_last_frame, generate_audio, ratio_adaptive.
// It does NOT declare: cfg_scale, enable_sound, camera_control, reference_image_urls, images_list.
const seedance25 = { id: 'seedance-2.5-text-to-video', provider: 'bytedance' };
const seedance25Controls = getAdvancedControlsForModel(seedance25);

const seedance25Values = {
  negative_prompt: 'no cats',
  seed: 42,
  camera_fixed: true,
  bitrate_mode: 'standard',
  output_format: 'mov',
  watermark: true,
  return_last_frame: true,
  generate_audio: false,
};

// Kling 3.0 Omni declares: seed, cfg_scale, enable_sound, camera_*, reference_image_urls,
// multi_prompt, multi_shots. It does NOT declare negative_prompt.
const klingOmni = { id: 'kling-v3.0-omni-pro-text-to-video', provider: 'kling' };
const klingOmniControls = getAdvancedControlsForModel(klingOmni);

const klingOmniValues = {
  seed: 7,
  enable_sound: true,
  reference_image_urls: 'a.jpg\nb.jpg',
  multi_prompt: 'shot1\n shot2 ',
  multi_shots: true,
};

describe('generateVideo advanced pass-through', () => {
  async function runWith(modelId, advanced) {
    let capturedBody = null;
    global.fetch = vi.fn(async (url, options) => {
      const method = options?.method || 'GET';
      if (method === 'POST') {
        capturedBody = JSON.parse(options.body);
        return { ok: true, json: async () => ({ request_id: 'r' }) };
      }
      return {
        ok: true,
        json: async () => ({ status: 'succeeded', url: 'https://example.com/video.mp4' }),
      };
    });
    const result = await generateVideo('fakekey', { model: modelId, prompt: 'x', ...advanced });
    return { result, capturedBody };
  }

  it('Seedance 2.5: forwards only declared advanced keys, excludes undeclared', async () => {
    const { result, capturedBody } = await runWith(
      'seedance-2.5-text-to-video',
      buildAdvancedPayload(seedance25Controls, seedance25Values),
    );

    expect(result.url).toBe('https://example.com/video.mp4');
    expect(capturedBody.prompt).toBe('x');

    for (const [k, v] of Object.entries(seedance25Values)) {
      expect(capturedBody, k).toHaveProperty(k, v);
    }
    // generate_audio:false is forwarded (≠ default true).
    expect(capturedBody.generate_audio).toBe(false);

    for (const k of ['cfg_scale', 'enable_sound', 'camera_control', 'reference_image_urls', 'images_list', 'multi_prompt']) {
      expect(capturedBody, k).not.toHaveProperty(k);
    }
  });

  it('Kling 3.0 Omni: forwards reference + multi-shot, excludes negative_prompt', async () => {
    const { result, capturedBody } = await runWith(
      'kling-v3.0-omni-pro-text-to-video',
      buildAdvancedPayload(klingOmniControls, klingOmniValues),
    );

    expect(result.url).toBe('https://example.com/video.mp4');

    expect(capturedBody.seed).toBe(7);
    expect(capturedBody.enable_sound).toBe(true);
    expect(capturedBody.reference_image_urls).toEqual(['a.jpg', 'b.jpg']);
    expect(capturedBody.multi_prompt).toEqual(['shot1', 'shot2']);
    expect(capturedBody.multi_shots).toBe(true);
    expect(capturedBody).not.toHaveProperty('negative_prompt');
  });
});
