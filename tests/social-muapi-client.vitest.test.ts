import { describe, expect, it, vi, beforeEach } from 'vitest';

const post = vi.fn();
const get = vi.fn();
vi.mock('axios', () => ({ default: { post: (...a: unknown[]) => post(...a), get: (...a: unknown[]) => get(...a), delete: vi.fn() } }));

import { connectSocialAccount, pollSocialResult } from '@/lib/muapi';
import { publishOne } from '@/shared/api/publishOrchestrator';

beforeEach(() => { post.mockReset(); get.mockReset(); vi.useRealTimers(); });

describe('connect URLs', () => {
  it('uses the platform-specific connect-url for the 4 platforms MuAPI has one for (never the YouTube one)', async () => {
    post.mockResolvedValue({ data: { url: 'https://connect/x' } });
    for (const p of ['youtube', 'tiktok', 'instagram', 'facebook']) {
      await connectSocialAccount('key', 'user-1', 'https://app/back', p);
      expect(post.mock.calls.at(-1)![0]).toBe(`/api/v1/social/${p}/connect-url`);
      expect(post.mock.calls.at(-1)![1]).toEqual({ external_user_id: 'user-1', redirect_to: 'https://app/back' });
    }
  });
  it('LinkedIn, Pinterest, Threads and X have no connect-url in MuAPI: explain it instead of calling a route that does not exist', async () => {
    post.mockReset();
    for (const p of ['linkedin', 'pinterest', 'threads', 'x']) {
      await expect(connectSocialAccount('key', 'u', '/', p)).rejects.toThrow(/not available yet.*MuAPI dashboard.*manually/s);
    }
    expect(post).not.toHaveBeenCalled();
  });
  it('rejects unknown platforms instead of falling back to YouTube', async () => {
    await expect(connectSocialAccount('key', 'u', '/', 'myspace')).rejects.toThrow(/Unsupported platform/);
    expect(post).not.toHaveBeenCalled();
  });
});

describe('polling', () => {
  it('returns the completed result', async () => {
    get.mockResolvedValueOnce({ data: { status: 'processing' } }).mockResolvedValueOnce({ data: { status: 'completed', output: { url: 'u' } } });
    expect((await pollSocialResult('k', 'r1', 5, 1)).output.url).toBe('u');
  });
  it('marks a platform rejection as terminal (isRejected) so the post can be submitted again, but not a timeout or a 404', async () => {
    get.mockResolvedValue({ data: { status: 'failed', error: 'Video too long' } });
    await expect(pollSocialResult('k', 'r1', 50, 1)).rejects.toMatchObject({ isRejected: true, message: 'Video too long' });
    get.mockReset();
    get.mockRejectedValue({ response: { status: 404 } });
    await expect(pollSocialResult('k', 'r1', 5, 1)).rejects.not.toHaveProperty('isRejected');
    get.mockReset();
    get.mockResolvedValue({ data: { status: 'processing' } });
    await expect(pollSocialResult('k', 'r1', 2, 1)).rejects.not.toHaveProperty('isRejected');
  });
  it('fails immediately when the platform reports failure (no more retry-until-timeout)', async () => {
    get.mockResolvedValue({ data: { status: 'failed', error: 'Video too long' } });
    await expect(pollSocialResult('k', 'r1', 50, 1)).rejects.toThrow('Video too long');
    expect(get).toHaveBeenCalledTimes(1);
  });
  it('fails fast on 4xx but retries 5xx/429', async () => {
    get.mockRejectedValue({ response: { status: 404 } });
    await expect(pollSocialResult('k', 'r1', 50, 1)).rejects.toMatchObject({ response: { status: 404 } });
    expect(get).toHaveBeenCalledTimes(1);
    get.mockReset();
    get.mockRejectedValueOnce({ response: { status: 503 } }).mockResolvedValueOnce({ data: { status: 'completed' } });
    await expect(pollSocialResult('k', 'r1', 5, 1)).resolves.toMatchObject({ status: 'completed' });
    expect(get).toHaveBeenCalledTimes(2);
  });
  it('does not report an early hiccup after later polls succeeded', async () => {
    get.mockReset();
    get.mockRejectedValueOnce({ response: { status: 503 } }).mockResolvedValue({ data: { status: 'processing' } });
    await expect(pollSocialResult('k', 'r1', 4, 1)).rejects.toThrow(/taking longer than expected/);
  });
  it('still reports the request error when polling ends on one', async () => {
    get.mockReset();
    get.mockResolvedValueOnce({ data: { status: 'processing' } }).mockRejectedValue({ response: { status: 503 } });
    await expect(pollSocialResult('k', 'r1', 3, 1)).rejects.toMatchObject({ response: { status: 503 } });
  });
  it('times out with a clear message', async () => {
    get.mockResolvedValue({ data: { status: 'processing' } });
    await expect(pollSocialResult('k', 'r1', 3, 1)).rejects.toThrow(/taking longer than expected/);
  });
});

describe('publishOne through the real poller', () => {
  const dest = { id: 'instagram:5', platform: 'instagram', accountId: '5', enabled: true, settings: {} } as any;
  const asset = { type: 'video', url: 'https://cdn.muapi.ai/v.mp4' } as any;
  const copy = { master: 'Hello', title: 'T', platforms: {} } as any;
  const deps = () => ({
    publish: { instagram: async () => ({ request_id: 'req-1' }) } as any,
    poll: (k: string, id: string) => pollSocialResult(k, id, 3, 1), // the real poller
  });

  it('a platform rejection drops the request id (so it can be posted again)', async () => {
    get.mockResolvedValue({ data: { status: 'failed', error: 'Video too long' } });
    const r = await publishOne(dest, asset, copy, undefined, 'k', deps());
    expect(r).toMatchObject({ status: 'failed', requestId: '' });
    expect(r.error).not.toMatch(/already sent/);
  });
  it('a poll that never finishes keeps the request id (the post may still go live)', async () => {
    get.mockResolvedValue({ data: { status: 'processing' } });
    const r = await publishOne(dest, asset, copy, undefined, 'k', deps());
    expect(r).toMatchObject({ status: 'failed', requestId: 'req-1' });
    expect(r.error).toMatch(/already sent/);
  });
});
