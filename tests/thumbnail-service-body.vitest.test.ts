import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateThumbnail, refineThumbnail } from '@/shared/api/thumbnailService';

const fetchMock = vi.fn();
const lastBody = () => JSON.parse(fetchMock.mock.calls.at(-1)![1].body as string);

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ urls: ['https://cdn.example/a.png'], model: 'gpt-image-2.6-flare' }) });
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('thumbnailService request bodies', () => {
  it('keeps the existing defaults when no new controls are given', async () => {
    await generateThumbnail({ prompt: 'p' });
    const body = lastBody();
    expect(fetchMock.mock.calls[0][0]).toBe('/api/proxy/thumbnail-generate');
    expect(body).toMatchObject({ action: 'generate', prompt: 'p', model: 'gpt-image-2', aspect_ratio: '16:9', n: 1, quality: 'medium' });
    for (const key of ['complexity', 'size', 'background', 'output_format', 'output_compression']) expect(body).not.toHaveProperty(key);
  });

  it('maps the new generate controls to snake_case fields', async () => {
    const out = await generateThumbnail({
      prompt: 'p', model: 'gpt-image-2.6-sunburst', quality: 'xhigh', complexity: 'high', size: '1536x864', aspectRatio: '16:9',
      background: 'opaque', outputFormat: 'webp', outputCompression: 70, n: 3, referenceUrls: ['data:image/png;base64,QQ=='],
    });
    expect(lastBody()).toMatchObject({
      model: 'gpt-image-2.6-sunburst', quality: 'xhigh', complexity: 'high', size: '1536x864', background: 'opaque',
      output_format: 'webp', output_compression: 70, n: 3, reference_urls: ['data:image/png;base64,QQ=='],
    });
    expect(out[0]).toMatchObject({ url: 'https://cdn.example/a.png', model: 'gpt-image-2.6-flare' });
  });

  it('allows an output compression of 0 and clamps n to 1-4', async () => {
    await generateThumbnail({ prompt: 'p', outputFormat: 'jpeg', outputCompression: 0, n: 9 });
    expect(lastBody()).toMatchObject({ output_compression: 0, n: 4 });
  });

  it('maps the same controls on refine', async () => {
    await refineThumbnail({ imageUrl: 'data:image/png;base64,QQ==', prompt: 'x', model: 'gpt-image-2.6-sunburst', quality: 'max', complexity: 'low', size: '1024x1024', maskUrl: 'data:image/png;base64,TQ==' });
    expect(lastBody()).toMatchObject({ action: 'refine', quality: 'max', complexity: 'low', size: '1024x1024', mask_url: 'data:image/png;base64,TQ==' });
  });
});
