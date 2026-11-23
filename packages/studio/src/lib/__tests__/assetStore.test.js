// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { assetKindOf, saveUploadedFile, saveResultUrl, listAssets, deleteAsset } from '../assetStore.js';

const ok = (body) => ({ ok: true, status: 200, json: async () => body });
const fail = (status = 503) => ({ ok: false, status, json: async () => ({}) });
let fetchMock;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('assetKindOf', () => {
  it('reads a file type or a url extension', () => {
    expect(assetKindOf({ type: 'image/png' })).toBe('image');
    expect(assetKindOf({ type: 'video/mp4' })).toBe('video');
    expect(assetKindOf('https://x.test/a.mp3?x=1')).toBe('audio');
    expect(assetKindOf('https://x.test/clip.MP4')).toBe('video');
    expect(assetKindOf('https://x.test/readme.txt')).toBeNull();
  });
});

describe('saveUploadedFile', () => {
  const file = new File(['abc'], 'pic.png', { type: 'image/png' });

  it('stores the original, then lists the lasting address', async () => {
    fetchMock
      .mockResolvedValueOnce(ok({ uploadUrl: 'https://s.test/sign', url: 'https://s.test/public/pic.png', storagePath: 'smartvideo/u/library/1-pic.png' }))
      .mockResolvedValueOnce({ ok: true, status: 200 })
      .mockResolvedValueOnce(ok({ asset: { id: 'a1', url: 'https://s.test/public/pic.png' } }));
    const asset = await saveUploadedFile(file);
    expect(asset).toEqual({ id: 'a1', url: 'https://s.test/public/pic.png' });
    expect(fetchMock.mock.calls[0][0]).toBe('/api/assets/library/upload');
    expect(fetchMock.mock.calls[1][0]).toBe('https://s.test/sign');
    expect(fetchMock.mock.calls[1][1].method).toBe('PUT');
    expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toMatchObject({ url: 'https://s.test/public/pic.png', kind: 'image', source: 'upload' });
  });

  it('is silent when signed out or storage is down', async () => {
    fetchMock.mockResolvedValueOnce(fail(401));
    expect(await saveUploadedFile(file)).toBeNull();
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    expect(await saveUploadedFile(file)).toBeNull();
  });

  it('skips files that are not media', async () => {
    expect(await saveUploadedFile(new File(['x'], 'a.pdf', { type: 'application/pdf' }))).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('saveResultUrl / list / delete', () => {
  it('registers a generated result by its url', async () => {
    fetchMock.mockResolvedValueOnce(ok({ asset: { id: 'r1' } }));
    expect(await saveResultUrl('https://cdn.test/out.mp4')).toEqual({ id: 'r1' });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ kind: 'video', source: 'result' });
  });

  it('ignores non-https or unknown results', async () => {
    expect(await saveResultUrl('http://cdn.test/out.mp4')).toBeNull();
    expect(await saveResultUrl('https://cdn.test/out.bin')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('lists with a kind filter and returns [] on failure', async () => {
    fetchMock.mockResolvedValueOnce(ok({ assets: [{ id: 'a' }] }));
    expect(await listAssets({ kind: 'image' })).toEqual([{ id: 'a' }]);
    expect(fetchMock.mock.calls[0][0]).toContain('kind=image');
    fetchMock.mockResolvedValueOnce(fail(401));
    expect(await listAssets()).toEqual([]);
  });

  it('deletes by id', async () => {
    fetchMock.mockResolvedValueOnce(ok({ ok: true }));
    expect(await deleteAsset('abc')).toBe(true);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/assets/library?id=abc');
    expect(fetchMock.mock.calls[0][1].method).toBe('DELETE');
  });
});
