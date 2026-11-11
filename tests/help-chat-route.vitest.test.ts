import { describe, it, expect, vi, beforeEach } from 'vitest';

const authMock = vi.fn();
const gateMock = vi.fn();
const streamMock = vi.fn();
const configured = vi.fn(() => true);
vi.mock('@clerk/nextjs/server', () => ({ auth: () => authMock() }));
vi.mock('@/access/apiRequireEntitlement', () => ({
  requireApiEntitlement: (...a: unknown[]) => gateMock(...a),
  entitlementForbiddenResponse: (e: string) => new Response(JSON.stringify({ error: 'PAYMENT_REQUIRED', entitlement: e }), { status: 403 }),
}));
vi.mock('@/lib/helpLlm', async (orig) => ({
  ...(await orig<object>()),
  isHelpLlmConfigured: () => configured(),
  streamAnswer: (o: unknown) => streamMock(o),
}));

import { POST, GET } from '../app/api/help/chat/route';

const req = (body: unknown) => new Request('http://x/api/help/chat', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) }) as never;
async function events(res: Response) {
  const text = await res.text();
  return text.split('\n\n').filter(Boolean).map((b) => {
    const [e, d] = b.split('\n');
    return { event: e.replace('event: ', ''), data: JSON.parse(d.replace('data: ', '')) };
  });
}
async function* fake(parts: string[]) { for (const p of parts) yield p; }

beforeEach(() => {
  authMock.mockReset(); gateMock.mockReset(); streamMock.mockReset(); configured.mockReturnValue(true);
  authMock.mockResolvedValue({ userId: `u-${Math.random()}` });
  gateMock.mockResolvedValue({ allowed: true });
});

describe('POST /api/help/chat', () => {
  it('401 signed out, 403 without the existing SmartVideo GO gate, 503 unconfigured', async () => {
    authMock.mockResolvedValue({ userId: null });
    expect((await POST(req({ messages: [] }))).status).toBe(401);
    authMock.mockResolvedValue({ userId: 'u1' });
    gateMock.mockResolvedValue({ allowed: false, status: 403, entitlement: 'smartvideo_go' });
    expect((await POST(req({ messages: [] }))).status).toBe(403);
    gateMock.mockResolvedValue({ allowed: true });
    configured.mockReturnValue(false);
    expect((await POST(req({ messages: [{ role: 'user', content: 'hi' }] }))).status).toBe(503);
    expect((await (await GET()).json()).available).toBe(false);
  });
  it('400 on bad json / no question', async () => {
    expect((await POST(req('{nope'))).status).toBe(400);
    expect((await POST(req({ messages: [{ role: 'assistant', content: 'x' }] }))).status).toBe(400);
    expect((await POST(req({ messages: [{ role: 'user', content: '   ' }] }))).status).toBe(400);
  });
  it('streams sources then deltas then done, grounded in retrieved chunks', async () => {
    streamMock.mockImplementation(() => fake(['Register ', 'the webhook [S1].']));
    const res = await POST(req({ messages: [{ role: 'user', content: 'How do I set up the Stripe webhook?' }], studioId: 'apps' }));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/event-stream');
    const ev = await events(res);
    expect(ev[0].event).toBe('sources');
    expect(ev[0].data.length).toBeGreaterThan(0);
    expect(ev[0].data[0]).toMatchObject({ id: 'S1', url: expect.stringMatching(/^\//) });
    expect(ev.filter((e) => e.event === 'delta').map((e) => e.data.text).join('')).toBe('Register the webhook [S1].');
    expect(ev[ev.length - 1]).toEqual({ event: 'done', data: { grounded: true } });
    const arg = streamMock.mock.calls[0][0] as { system: string };
    expect(arg.system).toContain('SOURCES:');
    expect(arg.system).toContain('<source id="S1"');
  });
  it('never calls the model when nothing matches', async () => {
    const res = await POST(req({ messages: [{ role: 'user', content: 'zzqx vvkk' }] }));
    const ev = await events(res);
    expect(streamMock).not.toHaveBeenCalled();
    expect(ev[ev.length - 1].data).toEqual({ grounded: false });
  });
  it('redacts pasted secrets before they reach the model', async () => {
    streamMock.mockImplementation(() => fake(['ok [S1]']));
    await POST(req({ messages: [{ role: 'user', content: 'webhook not working, my key is sk_live_' + 'a'.repeat(30) }] }));
    const sent = JSON.stringify(streamMock.mock.calls[0][0]);
    expect(sent).not.toContain('sk_live_' + 'a'.repeat(30));
    expect(sent).toContain('[redacted secret]');
  });
  it('turns model failures into an error event', async () => {
    streamMock.mockImplementation(async function* () { throw new Error('boom'); });
    const ev = await events(await POST(req({ messages: [{ role: 'user', content: 'How do I generate an image' }] })));
    expect(ev.some((e) => e.event === 'error')).toBe(true);
  });
  it('rate limits per user (10 per minute)', async () => {
    authMock.mockResolvedValue({ userId: 'limited-user' });
    streamMock.mockImplementation(() => fake(['ok']));
    let last = 200;
    for (let i = 0; i < 11; i++) last = (await POST(req({ messages: [{ role: 'user', content: 'How do I generate an image' }] }))).status;
    expect(last).toBe(429);
  });
});
