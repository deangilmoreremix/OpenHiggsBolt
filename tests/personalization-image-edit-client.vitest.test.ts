import { afterEach, describe, expect, it, vi } from 'vitest';
import { editSmartVideoGoImage } from '@/shared/personalization/image-editor/imageEditApi';

afterEach(() => vi.unstubAllGlobals());

describe('editSmartVideoGoImage form fields', () => {
  const run = async (extra: Record<string, unknown>) => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [] }) });
    vi.stubGlobal('fetch', fetchMock);
    await editSmartVideoGoImage({
      operation: 'custom', prompt: 'p', image: new Blob(['x'], { type: 'image/png' }), model: 'gpt-image-2.6-flare',
      quality: 'max', size: '1024x1024', outputFormat: 'png', background: 'auto', inputFidelity: 'low', ...extra,
    } as any);
    return fetchMock.mock.calls[0][1].body as FormData;
  };

  it('sends complexity and 2.6 model ids when set', async () => {
    const form = await run({ complexity: 'high' });
    expect(form.get('complexity')).toBe('high');
    expect(form.get('model')).toBe('gpt-image-2.6-flare');
    expect(form.get('quality')).toBe('max');
  });

  it('omits complexity when unset', async () => {
    expect((await run({})).has('complexity')).toBe(false);
  });
});
