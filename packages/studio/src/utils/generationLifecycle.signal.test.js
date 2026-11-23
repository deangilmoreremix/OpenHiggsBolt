import { describe, expect, it, vi } from 'vitest';
import { pollForGenerationResult } from './generationLifecycle.js';

describe('pollForGenerationResult cancellation', () => {
  it('stops polling when the signal is aborted', async () => {
    const controller = new AbortController();
    const fetchImpl = vi.fn(async () => {
      controller.abort();
      return { ok: true, json: async () => ({ status: 'processing' }) };
    });

    await expect(pollForGenerationResult({
      baseUrl: '', requestId: 'req-1', apiKey: 'k', interval: 1, maxAttempts: 10, fetchImpl, signal: controller.signal,
    })).rejects.toMatchObject({ name: 'AbortError', requestId: 'req-1' });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('still returns the result without a signal', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => ({ status: 'completed', outputs: ['u'] }) }));
    await expect(pollForGenerationResult({ baseUrl: '', requestId: 'r', apiKey: 'k', interval: 1, fetchImpl }))
      .resolves.toMatchObject({ status: 'completed' });
  });
});
