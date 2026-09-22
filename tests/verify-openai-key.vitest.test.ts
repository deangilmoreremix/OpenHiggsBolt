import { describe, expect, it, vi, beforeEach } from 'vitest';
import { verifyOpenAIKey } from '../src/shared/api/verifyOpenAIKey';

describe('verifyOpenAIKey', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns invalid status for 401', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        status: 401,
        ok: false,
        text: () => Promise.resolve('Invalid API key'),
      } as Response)
    );

    const result = await verifyOpenAIKey('sk-invalid');
    expect(result.isValid).toBe(false);
    expect(result.status).toBe('temporarily_unverified');
    expect(result.error).toBeTruthy();
    expect(result.warning).toBeNull();
  });

  it('returns restricted status for 403', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        status: 403,
        ok: false,
        text: () => Promise.resolve('You do not have access'),
      } as Response)
    );

    const result = await verifyOpenAIKey('sk-restricted');
    expect(result.isValid).toBe(true);
    expect(result.status).toBe('restricted');
    expect(result.warning).toBeTruthy();
    expect(result.error).toBeNull();
  });

  it('returns temporarily_unverified for 429', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        status: 429,
        ok: false,
        text: () => Promise.resolve('Rate limit exceeded'),
      } as Response)
    );

    const result = await verifyOpenAIKey('sk-rate-limited');
    expect(result.isValid).toBe(true);
    expect(result.status).toBe('temporarily_unverified');
    expect(result.warning).toBeTruthy();
    expect(result.error).toBeNull();
  });

  it('returns temporarily_unverified for 500', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        status: 500,
        ok: false,
        text: () => Promise.resolve('Server error'),
      } as Response)
    );

    const result = await verifyOpenAIKey('sk-server-error');
    expect(result.isValid).toBe(true);
    expect(result.status).toBe('temporarily_unverified');
    expect(result.warning).toBeTruthy();
    expect(result.error).toBeNull();
  });

  it('resolves with verified status for 200', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        status: 200,
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      } as Response)
    );

    const result = await verifyOpenAIKey('sk-valid');
    expect(result.isValid).toBe(true);
    expect(result.status).toBe('verified');
    expect(result.warning).toBeNull();
    expect(result.error).toBeNull();
  });
});
