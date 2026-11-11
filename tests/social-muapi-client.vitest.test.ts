import { describe, expect, it, vi, beforeEach } from 'vitest';

const post = vi.fn();
const get = vi.fn();
vi.mock('axios', () => ({ default: { post: (...a: unknown[]) => post(...a), get: (...a: unknown[]) => get(...a), delete: vi.fn() } }));

import { connectSocialAccount, pollSocialResult } from '@/lib/muapi';

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
