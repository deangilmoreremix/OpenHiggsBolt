import { describe, it, expect, vi } from 'vitest';
import { createJobs, pool } from '../jobs.js';
import { starterBeatMap, isPlaceholderUrl, MODELS, allShots, totalDuration, narrationText } from '../zackdPrompts.js';

const PLACEHOLDER = 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/nano-banana-2.0.avif';

describe('starterBeatMap', () => {
  it('builds a valid, editable curiosity-loop skeleton', () => {
    const map = starterBeatMap('What happens when you swallow gum?');
    expect(map.beats).toHaveLength(3);
    expect(map.beats[0].hook).toBe(true);
    expect(allShots(map)).toHaveLength(5);
    expect(totalDuration(map)).toBe(15);
    expect(map.character_sheets.map((s) => s.id)).toEqual(['main_character', 'anatomy_cutaway']);
    expect(narrationText(map)).toContain('swallow gum');
    expect(starterBeatMap('').topic).toBe('this everyday mystery');
  });
  it('flags placeholder assets', () => {
    expect(isPlaceholderUrl(PLACEHOLDER)).toBe(true);
    expect(isPlaceholderUrl('https://cdn.example.com/real.png')).toBe(false);
  });
});

describe('createJobs', () => {
  const real = 'https://cdn.example.com/out.png';
  it('maps each job to the right muapi helper and payload', async () => {
    const api = {
      generateImage: vi.fn().mockResolvedValue({ url: real }),
      generateI2V: vi.fn().mockResolvedValue({ url: 'https://cdn.example.com/c.mp4' }),
      generateAudio: vi.fn().mockResolvedValue({ url: 'https://cdn.example.com/a.mp3' }),
    };
    const jobs = createJobs(api, 'KEY');
    expect(await jobs.image({ prompt: 'p', aspect: '16:9' })).toEqual({ url: real, model: MODELS.image[0] });
    expect(api.generateImage).toHaveBeenCalledWith('KEY', { model: 'nano-banana-2', prompt: 'p', aspect_ratio: '16:9' });
    await jobs.clip({ imageUrl: 'https://x/y.png', prompt: 'm' });
    expect(api.generateI2V).toHaveBeenCalledWith('KEY', { model: 'veo3.1-fast-image-to-video', prompt: 'm', image_url: 'https://x/y.png', aspect_ratio: '9:16', resolution: '720p' });
    await jobs.narration({ text: 'hi', voice: 'nope', speed: 9 });
    expect(api.generateAudio.mock.calls[0][1]).toMatchObject({ _modelId: 'minimax-speech-2.6-turbo', text: 'hi', voice_id: 'Casual_Guy', speed: 2 });
    await jobs.music({ prompt: 'calm', duration: 999 });
    expect(api.generateAudio.mock.calls[1][1]).toMatchObject({ _modelId: 'suno-create-music', duration: 180 });
  });

  it('falls back to the second model on error or placeholder output', async () => {
    const api = { generateImage: vi.fn().mockRejectedValueOnce(new Error('API Request Failed: 500')).mockResolvedValueOnce({ url: real }) };
    expect(await createJobs(api, 'K').image({ prompt: 'p' })).toEqual({ url: real, model: 'flux-dev-image' });
    const api2 = { generateImage: vi.fn().mockResolvedValueOnce({ url: PLACEHOLDER }).mockResolvedValueOnce({ url: real }) };
    expect((await createJobs(api2, 'K').image({ prompt: 'p' })).model).toBe('flux-dev-image');
  });

  it('reports placeholder-only output and bad keys clearly, never as media', async () => {
    const stub = { generateImage: vi.fn().mockResolvedValue({ url: PLACEHOLDER }) };
    await expect(createJobs(stub, 'K').image({ prompt: 'p' })).rejects.toMatchObject({ code: 'placeholder' });
    expect(stub.generateImage).toHaveBeenCalledTimes(2);
    const bad = { generateImage: vi.fn().mockRejectedValue(new Error('API Request Failed: 401 Unauthorized')) };
    await expect(createJobs(bad, 'K').image({ prompt: 'p' })).rejects.toMatchObject({ code: 'bad_key' });
    expect(bad.generateImage).toHaveBeenCalledTimes(1);
    const dead = { generateAudio: vi.fn().mockRejectedValue(new Error('boom')) };
    await expect(createJobs(dead, 'K').narration({ text: 'x' })).rejects.toMatchObject({ code: 'failed' });
  });
});

describe('captions job', () => {
  it('forwards language/theme to ai-captions, validates enums and requires a public https video', async () => {
    const api = { generateCaptions: vi.fn().mockResolvedValue({ url: 'https://cdn.example.com/captioned.mp4' }) };
    const jobs = createJobs(api, 'KEY');
    expect(await jobs.captions({ videoUrl: 'https://muapi.example.com/cut.mp4', language: 'Spanish (Mexico)', theme: 'Beast' })).toEqual({ url: 'https://cdn.example.com/captioned.mp4', model: 'ai-captions' });
    expect(api.generateCaptions).toHaveBeenCalledWith('KEY', { video_url: 'https://muapi.example.com/cut.mp4', language: 'Spanish (Mexico)', theme: 'Beast' });
    await jobs.captions({ videoUrl: 'https://muapi.example.com/cut.mp4', language: 'Klingon', theme: 'nope' });
    expect(api.generateCaptions).toHaveBeenLastCalledWith('KEY', expect.objectContaining({ language: 'English', theme: 'Hormozi_1' }));
    await expect(jobs.captions({ videoUrl: 'blob:http://localhost/abc' })).rejects.toMatchObject({ code: 'bad_input' });
    expect(api.generateCaptions).toHaveBeenCalledTimes(2);
  });
  it('rejects placeholder output instead of showing it as captioned media', async () => {
    const api = { generateCaptions: vi.fn().mockResolvedValue({ url: PLACEHOLDER }) };
    await expect(createJobs(api, 'K').captions({ videoUrl: 'https://muapi.example.com/cut.mp4' })).rejects.toMatchObject({ code: 'placeholder' });
  });
});

describe('pool', () => {
  it('limits concurrency and returns per-item errors', async () => {
    let live = 0; let peak = 0;
    const res = await pool([1, 2, 3, 4, 5], 2, async (n) => { live += 1; peak = Math.max(peak, live); await new Promise((r) => setTimeout(r, 5)); live -= 1; if (n === 3) throw new Error('x'); return n; });
    expect(peak).toBeLessThanOrEqual(2);
    expect(res.map((r) => r.ok)).toEqual([true, true, false, true, true]);
  });
});
