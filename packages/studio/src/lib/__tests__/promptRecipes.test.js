import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../muapi.js', () => ({
  generateImage: vi.fn(),
  generateI2I: vi.fn(),
  generateI2V: vi.fn(),
  generateVideo: vi.fn(),
  generateAudio: vi.fn(),
  runClipping: vi.fn(),
  generateCharacterVideo: vi.fn(),
}));

import * as muapi from '../../muapi.js';
import registry from '../../skills/registry.json';
import { runSkill, buildParams } from '../promptRecipes.js';

const skill = (slug) => registry.skills.find((s) => s.slug === slug);

beforeEach(() => vi.clearAllMocks());

describe('runSkill', () => {
  it('feeds step 0 output into step 1 via {{phase0.output}}', async () => {
    muapi.generateImage.mockResolvedValue({ url: 'https://x/img.png' });
    muapi.generateI2V.mockResolvedValue({ url: 'https://x/vid.mp4' });
    const events = [];
    await runSkill('key', skill('muapi-product-campaign'), { product_name: 'Mug' }, (i, p) => events.push([i, p.status]));
    expect(muapi.generateImage.mock.calls[0][1].prompt).toContain('Mug');
    expect(muapi.generateI2V.mock.calls[0][1].images_list).toEqual(['https://x/img.png']);
    expect(events).toContainEqual([1, 'done']);
  });

  it('runs a converted image-then-video recipe, feeding the upload and the still into the video step', async () => {
    muapi.generateI2I.mockResolvedValue({ url: 'https://x/logo3d.png' });
    muapi.generateI2V.mockResolvedValue({ url: 'https://x/logo.mp4' });
    const logo = skill('muapi-3d-logo-animation');
    expect(logo.kind).toBe('workflow');
    expect(logo.steps.map((s) => s.type)).toEqual(['image', 'i2v']);
    await runSkill('key', logo, { logo_image: 'https://x/logo2d.png', material_style: 'chrome' }, () => {});
    expect(muapi.generateI2I.mock.calls[0][1].images_list).toEqual(['https://x/logo2d.png']);
    const video = muapi.generateI2V.mock.calls[0][1];
    expect(video.model).toBe('seedance-2-image-to-video-fast');
    expect(video.images_list).toEqual(['https://x/logo3d.png']);
  });

  it('every video-promising workflow ends in a video step fed by the previous output', () => {
    for (const s of registry.skills.filter((k) => !k.hidden && k.kind === 'workflow')) {
      const video = s.steps.filter((st) => st.type === 'i2v' || st.type === 't2v');
      for (const st of video) {
        if (st.type === 'i2v') expect(st.references?.length, s.slug).toBeGreaterThan(0);
      }
    }
  });

  it('runs a character step through the image-to-image dispatch so its reference is forwarded', async () => {
    muapi.generateI2I.mockResolvedValue({ url: 'https://x/char.mp4' });
    const character = {
      steps: [{ type: 'character', endpoint: 'seedance-2-character', prompt: 'x', references: ['{{ref}}'] }],
    };
    await runSkill('key', character, { ref: 'https://x/sheet.png' }, () => {});
    expect(muapi.generateI2I).toHaveBeenCalledTimes(1);
    expect(muapi.generateI2I.mock.calls[0][1].images_list).toEqual(['https://x/sheet.png']);
    expect(muapi.generateI2V).not.toHaveBeenCalled();
  });

  it('pauses at approval and stops when declined', async () => {
    muapi.generateI2I.mockResolvedValue({ url: 'https://x/a.png' });
    muapi.generateImage.mockResolvedValue({ url: 'https://x/a.png' });
    const onApproval = vi.fn().mockResolvedValue(false);
    await expect(
      runSkill('key', skill('muapi-ugc-ads-workflow'), { product_name: 'P', human_image: 'h', product_image: 'p' }, () => {}, { onApproval }),
    ).rejects.toThrow(/approval/);
    expect(onApproval).toHaveBeenCalledWith(1, expect.anything());
    expect(muapi.generateI2V).not.toHaveBeenCalled();
  });

  it('continues past approval when approved', async () => {
    muapi.generateI2I.mockResolvedValue({ url: 'https://x/a.png' });
    muapi.generateImage.mockResolvedValue({ url: 'https://x/a.png' });
    muapi.generateI2V.mockResolvedValue({ url: 'https://x/v.mp4' });
    await runSkill('key', skill('muapi-ugc-ads-workflow'), { product_name: 'P', human_image: 'h', product_image: 'p' }, () => {}, { onApproval: async () => true });
    expect(muapi.generateI2V).toHaveBeenCalledTimes(1);
  });

  it('sends the source video to the clipping service as video_url', async () => {
    muapi.runClipping.mockResolvedValue({ url: 'https://x/clip.mp4' });
    await runSkill('key', skill('muapi-youtube-shorts'), { source_video: 'https://x/long.mp4' }, () => {});
    expect(muapi.runClipping.mock.calls[0][1]).toMatchObject({ video_url: 'https://x/long.mp4', aspect_ratio: '9:16' });
    expect(muapi.runClipping.mock.calls[0][1].images_list).toBeUndefined();
  });

  it('reports the error and rethrows when a step fails', async () => {
    muapi.generateImage.mockRejectedValue(new Error('boom'));
    const events = [];
    await expect(runSkill('key', skill('muapi-social-pack'), { product_name: 'P' }, (i, p) => events.push(p))).rejects.toThrow('boom');
    expect(events.some((e) => e.status === 'error')).toBe(true);
  });

  it('stops when the signal is aborted', async () => {
    const ctl = new AbortController();
    ctl.abort();
    await expect(runSkill('key', skill('muapi-social-pack'), { product_name: 'P' }, () => {}, { signal: ctl.signal })).rejects.toThrow(/cancelled/);
  });
});

describe('buildParams', () => {
  it('fills the prompt template', () => {
    const p = buildParams({ endpoint: 'm', prompt: 'Hi {{name}}' }, { name: 'Al' }, []);
    expect(p.prompt).toBe('Hi Al');
    expect(p.model).toBe('m');
  });
});
