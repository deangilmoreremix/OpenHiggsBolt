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
