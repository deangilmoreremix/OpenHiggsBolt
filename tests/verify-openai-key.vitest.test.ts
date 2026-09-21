import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyOpenAIKey } from '../src/shared/api/verifyOpenAIKey';

describe('verifyOpenAIKey', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('throws unauthorized for 401', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        status: 401,
        ok: false,
        text: () => Promise.resolve('Invalid API key'),
      } as Response)
    );

    await expect(verifyOpenAIKey('sk-invalid')).rejects.toThrow('unauthorized');
  });

  it('throws restricted for 403', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        status: 403,
        ok: false,
        text: () => Promise.resolve('You do not have access'),
      } as Response)
    );

    await expect(verifyOpenAIKey('sk-restricted')).rejects.toThrow('restricted');
  });

  it('throws rate_limited for 429', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        status: 429,
        ok: false,
        text: () => Promise.resolve('Rate limit exceeded'),
      } as Response)
    );

    await expect(verifyOpenAIKey('sk-rate-limited')).rejects.toThrow('rate_limited');
  });

  it('throws error for 500', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        status: 500,
        ok: false,
        text: () => Promise.resolve('Server error'),
      } as Response)
    );

    await expect(verifyOpenAIKey('sk-server-error')).rejects.toThrow('error');
  });

  it('resolves for 200', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        status: 200,
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      } as Response)
    );

    await expect(verifyOpenAIKey('sk-valid')).resolves.toBeUndefined();
  });
});
