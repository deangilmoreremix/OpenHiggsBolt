import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyOpenAIKeyServerSide } from '../src/lib/server/openaiKeyVerification';

describe('verifyOpenAIKeyServerSide', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns invalid=false for 401', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        status: 401,
        ok: false,
        text: () => Promise.resolve('Invalid API key'),
      } as Response)
    );

    const result = await verifyOpenAIKeyServerSide('sk-invalid');
    expect(result.isValid).toBe(false);
    expect(result.status).toBe('temporarily_unverified');
    expect(result.error).toContain('OpenAI did not recognize');
  });

  it('returns restricted for 403', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        status: 403,
        ok: false,
        text: () => Promise.resolve('You do not have access'),
      } as Response)
    );

    const result = await verifyOpenAIKeyServerSide('sk-restricted');
    expect(result.isValid).toBe(true);
    expect(result.status).toBe('restricted');
    expect(result.warning).toContain('restricted');
  });

  it('returns temporarily_unverified for 429', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        status: 429,
        ok: false,
        text: () => Promise.resolve('Rate limit exceeded'),
      } as Response)
    );

    const result = await verifyOpenAIKeyServerSide('sk-rate-limited');
    expect(result.isValid).toBe(true);
    expect(result.status).toBe('temporarily_unverified');
    expect(result.warning).toContain('rate-limited');
  });

  it('returns temporarily_unverified for 500', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        status: 500,
        ok: false,
        text: () => Promise.resolve('Server error'),
      } as Response)
    );

    const result = await verifyOpenAIKeyServerSide('sk-server-error');
    expect(result.isValid).toBe(true);
    expect(result.status).toBe('temporarily_unverified');
    expect(result.warning).toContain('temporarily unavailable');
  });

  it('returns verified for 200', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        status: 200,
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      } as Response)
    );

    const result = await verifyOpenAIKeyServerSide('sk-valid');
    expect(result.isValid).toBe(true);
    expect(result.status).toBe('verified');
    expect(result.warning).toBeNull();
    expect(result.error).toBeNull();
  });
});
