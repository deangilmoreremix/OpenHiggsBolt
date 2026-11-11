import { describe, it, expect, vi, beforeEach } from 'vitest';

const authMock = vi.fn();
const resolveMock = vi.fn();
const upsert = vi.fn(async () => ({ error: null }));
vi.mock('@clerk/nextjs/server', () => ({ auth: () => authMock() }));
vi.mock('@/lib/resellerAccess', async (orig) => ({ ...(await orig<object>()), resolveResellerEntitlements: (...a: unknown[]) => resolveMock(...a) }));
vi.mock('@/lib/supabaseServer', () => ({
  getSupabaseAdmin: () => ({
    from: () => ({ upsert, select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }),
  }),
}));

import { GET, PUT } from './progress/route';

const req = (body: unknown) => new Request('http://x/api', { method: 'PUT', body: JSON.stringify(body) }) as never;
const trained = { userId: 'u1', entitlements: { apps_studio_training: true } };

beforeEach(() => { authMock.mockReset(); resolveMock.mockReset(); upsert.mockClear(); });

describe('academy progress API', () => {
  it('401 when signed out', async () => {
    authMock.mockResolvedValue({ userId: null });
    expect((await GET())!.status).toBe(401);
  });
  it('403 when the existing training gate says no (and nothing is written)', async () => {
    authMock.mockResolvedValue({ userId: 'u1' });
    resolveMock.mockResolvedValue({ userId: 'u1', entitlements: { apps_studio_diy: true } });
    expect((await PUT(req({ progress: {} })))!.status).toBe(403);
    expect(upsert).not.toHaveBeenCalled();
  });
  it('saves sanitised progress for entitled users, keyed by the session user only', async () => {
    authMock.mockResolvedValue({ userId: 'u1' });
    resolveMock.mockResolvedValue(trained);
    const res = await PUT(req({ clerk_user_id: 'attacker', progress: { completedLessons: ['1.1', 'bogus'] } }));
    expect(res!.status).toBe(200);
    const row = (upsert.mock.calls[0] as unknown[])[0] as { clerk_user_id: string; state: { completedLessons: string[] } };
    expect(row.clerk_user_id).toBe('u1');
    expect(row.state.completedLessons).toEqual(['1.1']);
  });
});
