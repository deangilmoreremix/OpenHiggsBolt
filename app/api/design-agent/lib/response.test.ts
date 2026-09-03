import { describe, expect, it } from 'vitest';
import { safeJson } from './response';

function mockResponse(body: unknown, init?: { status?: number; headers?: Record<string, string> }) {
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  return {
    status: init?.status ?? 200,
    headers: new Map(Object.entries(init?.headers ?? {})),
    text: async () => text,
    json: async () => { throw new Error('not json'); },
  } as unknown as Response;
}

describe('safeJson', () => {
  it('parses successful JSON', async () => {
    const res = mockResponse({ ok: true });
    expect(await safeJson(res)).toEqual({ ok: true });
  });

  it('returns empty object for empty response', async () => {
    const res = mockResponse('');
    expect(await safeJson(res)).toEqual({});
  });

  it('returns text as message for non-JSON response', async () => {
    const res = mockResponse('internal server error');
    expect(await safeJson(res)).toEqual({ message: 'internal server error' });
  });

  it('returns parsed JSON error body', async () => {
    const res = mockResponse({ error: 'not found' }, { status: 404 });
    expect(await safeJson(res)).toEqual({ error: 'not found' });
  });

  it('returns HTML error as message', async () => {
    const res = mockResponse('<html>502 Bad Gateway</html>', { status: 502 });
    expect(await safeJson(res)).toEqual({ message: '<html>502 Bad Gateway</html>' });
  });
});
