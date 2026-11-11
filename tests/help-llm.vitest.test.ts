import { describe, it, expect, vi, afterEach } from 'vitest';
import { streamAnswer, HelpLlmError, HELP_DEFAULT_MODEL } from '@/lib/helpLlm';

const enc = new TextEncoder();
const KEY = 'sk-test-' + 'Q'.repeat(40);
const okStream = (lines: string[]) => new Response(new ReadableStream({ start(c) { for (const l of lines) c.enqueue(enc.encode(l)); c.close(); } }), { status: 200 });
const collect = async (g: AsyncGenerator<string>) => { let s = ''; for await (const t of g) s += t; return s; };
afterEach(() => vi.unstubAllGlobals());

describe('OpenAI help provider (customer key)', () => {
  it('calls OpenAI chat completions with the customer key, streaming, system prompt first', async () => {
    const f = vi.fn().mockResolvedValue(okStream(['data: {"choices":[{"delta":{"content":"Hel"}}]}\n\n', 'data: {"choices":[{"delta":{"content":"lo [S1]"}}]}\n\ndata: [DONE]\n\n']));
    vi.stubGlobal('fetch', f);
    const out = await collect(streamAnswer({ apiKey: KEY, system: 'SYS', messages: [{ role: 'user', content: 'hi' }] }));
    expect(out).toBe('Hello [S1]');
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.openai.com/v1/chat/completions');
    expect((init.headers as Record<string, string>).authorization).toBe(`Bearer ${KEY}`);
    const body = JSON.parse(init.body as string);
    expect(body.model).toBe(HELP_DEFAULT_MODEL);
    expect(body.stream).toBe(true);
    expect(body.messages[0]).toEqual({ role: 'system', content: 'SYS' });
    expect(JSON.stringify(body)).not.toContain(KEY); // key is a header only
  });
  it('handles chunks split across reads and ignores junk lines', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okStream(['data: {"choices":[{"delta":{"con', 'tent":"ab"}}]}\n', ': keep-alive\n', 'data: not-json\n', 'data: {"choices":[{"delta":{}}]}\n', 'data: [DONE]\n'])));
    expect(await collect(streamAnswer({ apiKey: KEY, system: 's', messages: [] }))).toBe('ab');
  });
  it('maps 401, insufficient_quota, 429 and others to typed errors without the key', async () => {
    const cases: [number, unknown, string][] = [[401, { error: { code: 'invalid_api_key' } }, 'OPENAI_KEY_INVALID'], [429, { error: { code: 'insufficient_quota' } }, 'OPENAI_QUOTA'], [429, { error: { code: 'rate_limit_exceeded' } }, 'OPENAI_RATE'], [500, {}, 'OPENAI_ERROR']];
    for (const [status, json, code] of cases) {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(json), { status })));
      const err = await collect(streamAnswer({ apiKey: KEY, system: 's', messages: [] })).catch((e) => e);
      expect(err).toBeInstanceOf(HelpLlmError);
      expect(err.code).toBe(code);
      expect(String(err.message)).not.toContain(KEY);
    }
  });
});
