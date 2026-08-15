// UNIT — payload assembly for the three video generation wrappers in muapi.js.
// Each wrapper calls submitAndPoll, which POSTs a payload and then polls a
// (mocked) prediction result. We capture the POST body and assert the params
// each wrapper builds. No live MuAPI key / network required.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateVideo, generateI2V, processV2V } from './muapi.js';

// Shared fetch mock. We capture the POST body so the assertions can inspect
// exactly what was sent over the wire. The POST returns a body with no
// `request_id`, so submitAndPoll returns immediately (no polling) — the tests
// focus purely on payload assembly, not on the poll/result loop.
function mockSubmitAndPoll() {
  let capturedBody = null;
  global.fetch = vi.fn(async (url, options) => {
    const method = options?.method || 'GET';
    if (method === 'POST') {
      capturedBody = JSON.parse(options.body);
      return { ok: true, json: async () => ({}) };
    }
    return {
      ok: true,
      json: async () => ({ status: 'succeeded', url: 'https://example.com/video.mp4' }),
    };
  });
  return () => capturedBody;
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('generateVideo (T2V) payload assembly', () => {
  it('builds prompt, aspect_ratio, duration, resolution, quality, mode', async () => {
    const getBody = mockSubmitAndPoll();
    await generateVideo('fakekey', {
      model: 'seedance-v2.0-t2v',
      prompt: 'A soaring eagle over mountains',
      aspect_ratio: '16:9',
      duration: 10,
      resolution: '1080p',
      quality: 'high',
      mode: 'normal',
    });

    const body = getBody();
    expect(body.prompt).toBe('A soaring eagle over mountains');
    expect(body.aspect_ratio).toBe('16:9');
    expect(body.duration).toBe(10);
    expect(body.resolution).toBe('1080p');
    expect(body.quality).toBe('high');
    expect(body.mode).toBe('normal');
  });

  it('omits params that are not provided (no null/undefined keys sent)', async () => {
    const getBody = mockSubmitAndPoll();
    await generateVideo('fakekey', {
      model: 'seedance-v2.0-t2v',
      prompt: 'only a prompt',
    });
    const body = getBody();
    expect(body.prompt).toBe('only a prompt');
    for (const k of ['aspect_ratio', 'duration', 'resolution', 'quality', 'mode', 'image_url', 'images_list', 'videos_list']) {
      expect(body, k).not.toHaveProperty(k);
    }
  });

  it('forwards request_id for the Seedance 2.0 Extend flow', async () => {
    const getBody = mockSubmitAndPoll();
    await generateVideo('fakekey', {
      model: 'seedance-v2.0-extend',
      request_id: 'abc-123',
      prompt: 'continue the scene',
      duration: 5,
    });
    const body = getBody();
    expect(body.request_id).toBe('abc-123');
    expect(body.prompt).toBe('continue the scene');
  });
});

describe('generateI2V (image-to-video) payload assembly', () => {
  it('resolves imageField (image_url) and forwards the effect `name`', async () => {
    // ai-video-effects declares imageField:"image_url" and inputs.name (effects enum).
    const getBody = mockSubmitAndPoll();
    await generateI2V('fakekey', {
      model: 'ai-video-effects',
      prompt: 'a cute kitten',
      image_url: 'https://example.com/start.jpg',
      name: 'Fire',
    });
    const body = getBody();
    expect(body.prompt).toBe('a cute kitten');
    expect(body.image_url).toBe('https://example.com/start.jpg');
    expect(body.name).toBe('Fire');
  });

  it('supports images_list when the model imageField is images_list', async () => {
    // seedance-v2.0-i2v declares imageField:"images_list".
    const getBody = mockSubmitAndPoll();
    const list = ['https://example.com/a.jpg', 'https://example.com/b.jpg'];
    await generateI2V('fakekey', {
      model: 'seedance-v2.0-i2v',
      images_list: list,
    });
    const body = getBody();
    expect(body.images_list).toEqual(list);
  });

  it('resolves lastImageField (end-frame) alongside the start frame', async () => {
    // kling-v2.1-master-i2v: imageField:"image_url", lastImageField:"last_image".
    const getBody = mockSubmitAndPoll();
    await generateI2V('fakekey', {
      model: 'kling-v2.1-master-i2v',
      prompt: 'animate',
      image_url: 'https://example.com/start.jpg',
      last_image: 'https://example.com/end.jpg',
    });
    const body = getBody();
    expect(body.image_url).toBe('https://example.com/start.jpg');
    expect(body.last_image).toBe('https://example.com/end.jpg');
    expect(body.prompt).toBe('animate');
  });

  it('falls back to image_url when only image_url is supplied (no images_list)', async () => {
    const getBody = mockSubmitAndPoll();
    await generateI2V('fakekey', {
      model: 'ai-video-effects',
      image_url: 'https://example.com/start.jpg',
    });
    const body = getBody();
    expect(body.image_url).toBe('https://example.com/start.jpg');
    expect(body).not.toHaveProperty('images_list');
  });
});

describe('processV2V (video-to-video) payload assembly', () => {
  it('uploads the video and an optional reference image plus prompt', async () => {
    // kling-v2.6-std-motion-control: videoField:"video_url", imageField:"image_url", hasPrompt:true.
    const getBody = mockSubmitAndPoll();
    await processV2V('fakekey', {
      model: 'kling-v2.6-std-motion-control',
      video_url: 'https://example.com/clip.mp4',
      image_url: 'https://example.com/ref.jpg',
      prompt: 'slow dolly zoom',
    });
    const body = getBody();
    expect(body.video_url).toBe('https://example.com/clip.mp4');
    expect(body.image_url).toBe('https://example.com/ref.jpg');
    expect(body.prompt).toBe('slow dolly zoom');
  });

  it('sends only the video when no reference image is provided', async () => {
    const getBody = mockSubmitAndPoll();
    await processV2V('fakekey', {
      model: 'kling-v2.6-std-motion-control',
      video_url: 'https://example.com/clip.mp4',
    });
    const body = getBody();
    expect(body.video_url).toBe('https://example.com/clip.mp4');
    // imageField is only attached when params.image_url is present.
    expect(body).not.toHaveProperty('image_url');
    expect(body).not.toHaveProperty('prompt');
  });

  it('uses the model videoField even when it differs from the default (watermark remover)', async () => {
    const getBody = mockSubmitAndPoll();
    await processV2V('fakekey', {
      model: 'video-watermark-remover',
      video_url: 'https://example.com/wm.mp4',
    });
    const body = getBody();
    expect(body.video_url).toBe('https://example.com/wm.mp4');
  });
});
