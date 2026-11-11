import { describe, it, expect, vi, beforeEach } from 'vitest';

const authMock = vi.fn();
const upsert = vi.fn(async () => ({ error: null as unknown }));
let stored: unknown = null;
let storeError: unknown = null;
vi.mock('@clerk/nextjs/server', () => ({ auth: () => authMock() }));
vi.mock('@/lib/supabaseServer', () => ({
  getSupabaseAdmin: () => ({
    from: () => ({ upsert, select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: stored, error: storeError }) }) }) }),
  }),
}));

import { GET, PUT } from './progress/route';

const req = (body: unknown, raw?: string) => new Request('http://x/api', { method: 'PUT', body: raw ?? JSON.stringify(body) }) as never;
const LESSON = 'ugc/01-how-ugc-works';

beforeEach(() => { authMock.mockReset(); upsert.mockClear(); stored = null; storeError = null; });

describe('academy progress API', () => {
  it('401 when signed out (GET and PUT), and nothing is written', async () => {
    authMock.mockResolvedValue({ userId: null });
    expect((await GET())!.status).toBe(401);
    expect((await PUT(req({ progress: {} })))!.status).toBe(401);
    expect(upsert).not.toHaveBeenCalled();
  });
  it('needs no paid entitlement: any signed-in learner can save', async () => {
    authMock.mockResolvedValue({ userId: 'u1' });
    const res = await PUT(req({ progress: { updatedAt: 5, lastLessonId: LESSON, lastStepId: 'overview' } }));
    expect(res!.status).toBe(200);
    expect(upsert).toHaveBeenCalledTimes(1);
  });
  it('saves sanitised progress keyed by the session user only', async () => {
    authMock.mockResolvedValue({ userId: 'u1' });
    const res = await PUT(req({ clerk_user_id: 'attacker', progress: { updatedAt: 9, completedLessons: [LESSON, 'bogus/lesson'], stepsDone: { [LESSON]: ['overview'], 'x/y': ['a'] }, checks: { [LESSON]: [0, 99] } } }));
    expect(res!.status).toBe(200);
    const row = (upsert.mock.calls[0] as unknown[])[0] as { clerk_user_id: string; state: { completedLessons: string[]; stepsDone: object; checks: object } };
    expect(row.clerk_user_id).toBe('u1');
    expect(row.state.completedLessons).toEqual([LESSON]);
    expect(row.state.stepsDone).toEqual({ [LESSON]: ['overview'] });
    expect(row.state.checks).toEqual({ [LESSON]: [0] });
  });
  it('GET returns the saved progress and the owner id', async () => {
    authMock.mockResolvedValue({ userId: 'u1' });
    stored = { state: { updatedAt: 3, completedLessons: [LESSON] } };
    const body = await (await GET())!.json();
    expect(body.owner).toBe('u1');
    expect(body.progress.completedLessons).toEqual([LESSON]);
    stored = null;
    expect((await (await GET())!.json()).progress).toBeNull();
  });
  it('ignores a request older than what is already saved (out-of-order requests)', async () => {
    authMock.mockResolvedValue({ userId: 'u1' });
    stored = { state: { updatedAt: 9000, completedLessons: [LESSON] } };
    const res = await PUT(req({ progress: { updatedAt: 5000 } }));
    const body = await res!.json();
    expect(body.stale).toBe(true);
    expect(body.progress.completedLessons).toEqual([LESSON]);
    expect(upsert).not.toHaveBeenCalled();
  });
  it('413 for an oversized body, 400 for bad JSON', async () => {
    authMock.mockResolvedValue({ userId: 'u1' });
    expect((await PUT(req(null, 'x'.repeat(40 * 1024))))!.status).toBe(413);
    expect((await PUT(req(null, '{nope')))!.status).toBe(400);
  });
  it('503 when the progress table is not available yet (the browser keeps progress)', async () => {
    authMock.mockResolvedValue({ userId: 'u1' });
    storeError = { message: 'relation "academy_progress" does not exist' };
    expect((await GET())!.status).toBe(503);
    expect((await PUT(req({ progress: { updatedAt: 1 } })))!.status).toBe(503);
  });
});
