import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const gate = vi.fn();
const keyMock = vi.fn();
vi.mock('@/access/apiRequireEntitlement', () => ({
  requireApiEntitlement: (...a: unknown[]) => gate(...a),
  entitlementForbiddenResponse: () => new Response(JSON.stringify({ error: 'PAYMENT_REQUIRED' }), { status: 403 }),
}));
vi.mock('../app/api/v1/lib/auth', () => ({ getMuApiKeyFromRequest: (...a: unknown[]) => keyMock(...a) }));

import { DELETE, PATCH } from '../app/api/v1/[...slug]/route';

const req = (method: string, body?: unknown) => new NextRequest('http://x/api/v1/social/ext/accounts/42', { method, body: body ? JSON.stringify(body) : undefined, headers: { 'content-type': 'application/json' } });
const ctx = (slug: string[]) => ({ params: { slug } });

beforeEach(() => {
  gate.mockReset(); keyMock.mockReset();
  gate.mockResolvedValue({ allowed: true });
  keyMock.mockResolvedValue('muapi-key');
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } })));
});

describe('MuAPI proxy: connected-account management', () => {
  it('forwards DELETE of a connected account with the user key', async () => {
    const res = await DELETE(req('DELETE'), ctx(['social', 'ext', 'accounts', '42']));
    expect(res.status).toBe(200);
    const [url, init] = (fetch as any).mock.calls[0];
    expect(url).toBe('https://api.muapi.ai/api/v1/social/ext/accounts/42');
    expect(init.method).toBe('DELETE');
    expect(init.headers['x-api-key']).toBe('muapi-key');
  });
  it('forwards PATCH (rename) with its body', async () => {
    await PATCH(req('PATCH', { account_name: 'Brand' }), ctx(['social', 'ext', 'accounts', '42']));
    const [, init] = (fetch as any).mock.calls[0];
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body)).toEqual({ account_name: 'Brand' });
  });
  it('refuses DELETE/PATCH on any other path (no general delete proxy)', async () => {
    for (const slug of [['account'], ['predictions', '1', 'result'], ['social', 'ext', 'accounts', '4/../x'], ['social', 'ext', 'accounts']]) {
      expect((await DELETE(req('DELETE'), ctx(slug))).status).toBe(405);
    }
    expect(fetch).not.toHaveBeenCalled();
  });
  it('requires the existing SmartVideo GO entitlement and a key', async () => {
    gate.mockResolvedValue({ allowed: false, status: 401 });
    expect((await DELETE(req('DELETE'), ctx(['social', 'ext', 'accounts', '42']))).status).toBe(401);
    gate.mockResolvedValue({ allowed: false, status: 403, entitlement: 'smartvideo_go' });
    expect((await DELETE(req('DELETE'), ctx(['social', 'ext', 'accounts', '42']))).status).toBe(403);
    gate.mockResolvedValue({ allowed: true });
    keyMock.mockRejectedValue(new Error('no key'));
    expect((await DELETE(req('DELETE'), ctx(['social', 'ext', 'accounts', '42']))).status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });
});
