import { describe, expect, it, vi, beforeEach } from 'vitest';
import { verifyOpenAIKeyServerSide } from '../src/lib/server/openaiKeyVerification';

describe('verifyOpenAIKeyServerSide', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns invalid result for 401', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        status: 401,
        ok: false,
        text: () => Promise.resolve('Invalid API key'),
      } as Response)
    );

    const result = await verifyOpenAIKeyServerSide('sk-invalid');
    expect(result).toEqual({
      isValid: false,
      status: 'temporarily_unverified',
      warning: null,
      error: expect.stringContaining('OpenAI did not recognize this API key'),
    });
  });

  it('returns restricted result for 403', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        status: 403,
        ok: false,
        text: () => Promise.resolve('You do not have access'),
      } as Response)
    );

    const result = await verifyOpenAIKeyServerSide('sk-restricted');
    expect(result).toEqual({
      isValid: true,
      status: 'restricted',
      warning: expect.stringContaining('OpenAI restricted the verification request'),
      error: null,
    });
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
    expect(result).toEqual({
      isValid: true,
      status: 'temporarily_unverified',
      warning: expect.stringContaining('temporarily rate-limited verification'),
      error: null,
    });
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
    expect(result).toEqual({
      isValid: true,
      status: 'temporarily_unverified',
      warning: expect.stringContaining('OpenAI verification is temporarily unavailable'),
      error: null,
    });
  });

  it('resolves verified for 200', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        status: 200,
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      } as Response)
    );

    const result = await verifyOpenAIKeyServerSide('sk-valid');
    expect(result).toEqual({
      isValid: true,
      status: 'verified',
      warning: null,
      error: null,
    });
  });
});
