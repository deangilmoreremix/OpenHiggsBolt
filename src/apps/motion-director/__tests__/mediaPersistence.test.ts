// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useStore } from '../store';
import { demoProject } from '../demoProject';
import { applyLastingUrls, storeFile, switchToLastingUrl, type MediaAttachment } from '../lib/mediaUpload';
import { confirmLeaveWhileRendering, guardTabWhileRendering } from '../webRenderer';

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
  vi.restoreAllMocks();
});

const firstClipId = () => useStore.getState().project.tracks.flatMap((t) => t.clips)[0].id;
const fileOf = (id: string) => useStore.getState().project.tracks.flatMap((t) => t.clips).find((c) => c.id === id)?.props?.file;

describe('attached files outlive the tab', () => {
  it('stores a file through a one-time upload address, or says it could not', async () => {
    const calls: { url: string; method?: string }[] = [];
    globalThis.fetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), method: init?.method });
      if (String(url) === '/api/motion-studio/upload') return new Response(JSON.stringify({ uploadUrl: 'https://storage.test/sign/x?token=t', url: 'https://storage.test/x' }));
      return new Response(null, { status: 200 });
    }) as unknown as typeof fetch;
    const file = new File(['abc'], 'song.mp3', { type: 'audio/mpeg' });
    expect(await storeFile(file)).toBe('https://storage.test/x');
    expect(calls).toEqual([
      { url: '/api/motion-studio/upload', method: 'POST' },
      { url: 'https://storage.test/sign/x?token=t', method: 'PUT' },
    ]);
    globalThis.fetch = vi.fn(async () => new Response('{}', { status: 503 })) as unknown as typeof fetch;
    expect(await storeFile(file)).toBeNull();
  });

  it('a file the system gave no type is stored with the type its extension names', async () => {
    const sent: { body?: string; type?: string }[] = [];
    globalThis.fetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      sent.push({ body: typeof init?.body === 'string' ? init.body : undefined, type: (init?.headers as Record<string, string> | undefined)?.['content-type'] });
      if (String(url) === '/api/motion-studio/upload') return new Response(JSON.stringify({ uploadUrl: 'https://storage.test/sign/x', url: 'https://storage.test/x' }));
      return new Response(null, { status: 200 });
    }) as unknown as typeof fetch;
    await storeFile(new File(['abc'], 'Clip.MOV', { type: '' }));
    expect(JSON.parse(sent[0].body!).type).toBe('video/quicktime');
    expect(sent[1].type).toBe('video/quicktime');
  });

  it('asks before the tab closes only while an upload is running', async () => {
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    let finish: (r: Response) => void = () => undefined;
    globalThis.fetch = vi.fn(() => new Promise<Response>((resolve) => { finish = resolve; })) as unknown as typeof fetch;
    const upload = storeFile(new File(['abc'], 'song.mp3', { type: 'audio/mpeg' }));
    expect(add).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    expect(remove).not.toHaveBeenCalledWith('beforeunload', expect.any(Function));
    finish(new Response('{}', { status: 503 }));
    expect(await upload).toBeNull();
    expect(remove).toHaveBeenCalledWith('beforeunload', add.mock.calls.find(([name]) => name === 'beforeunload')![1]);
  });

  it('swaps the blob: address for the stored one in the open project, and in a film opened later', () => {
    useStore.getState().setProject(demoProject());
    const id = firstClipId();
    useStore.getState().updateClipProps(id, { file: 'blob:tab-1' });
    const attachment: MediaAttachment = { id: 'm1', kind: 'audio', name: 'song.mp3', url: 'blob:tab-1', size: 3 };
    switchToLastingUrl(attachment, 'https://storage.test/song.mp3');
    expect(attachment.url).toBe('https://storage.test/song.mp3');
    expect(fileOf(id)).toBe('https://storage.test/song.mp3');
    // A film built before the upload finished still carries the blob: address until it is opened.
    useStore.getState().setProject(demoProject());
    const later = firstClipId();
    useStore.getState().updateClipProps(later, { file: 'blob:tab-1' });
    applyLastingUrls();
    expect(fileOf(later)).toBe('https://storage.test/song.mp3');
  });
});

describe('leaving while an MP4 renders', () => {
  it('asks only while a render runs', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    expect(confirmLeaveWhileRendering('Leave?')).toBe(true);
    expect(confirm).not.toHaveBeenCalled();
    const release = guardTabWhileRendering();
    expect(confirmLeaveWhileRendering('Leave?')).toBe(false);
    expect(confirm).toHaveBeenCalledWith('Leave?');
    release();
    release(); // releasing twice does not unbalance the count
    expect(confirmLeaveWhileRendering('Leave?')).toBe(true);
    expect(confirm).toHaveBeenCalledTimes(1);
  });
});
