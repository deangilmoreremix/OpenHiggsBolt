import { describe, it, expect, vi, beforeEach } from 'vitest';

const authMock = vi.fn();
const upsert = vi.fn();
// stored = the row's `state`; its updated_at is derived from state.updatedAt like the route writes it
let stored: unknown = null;
let storedAt: string | null = null;
let storeError: unknown = null;
const tick = () => new Promise((r) => setTimeout(r, 0));
const rowOf = () => (stored == null ? null : { state: stored, updated_at: storedAt });
/** Minimal in-memory stand-in for the supabase-js calls the route makes. Each single statement is atomic; awaits between statements let requests interleave. */
function fakeDb() {
  return {
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => { await tick(); return { data: rowOf(), error: storeError }; } }) }),
      upsert: (row: { state: { updatedAt: number }; updated_at: string }, opts?: { ignoreDuplicates?: boolean }) => {
        upsert(row, opts);
        const run = async () => {
          await tick();
          if (storeError) return { data: null, error: storeError };
          if (stored != null && opts?.ignoreDuplicates) return { data: [], error: null };
          stored = row.state; storedAt = row.updated_at;
          return { data: [{ clerk_user_id: 'x' }], error: null };
        };
        const p = run();
        return Object.assign(p, { select: () => p });
      },
      update: (vals: { state: unknown; updated_at: string }) => ({
        eq: () => ({
          lte: (_c: string, bound: string) => ({
            select: async () => {
              await tick();
              if (storeError) return { data: null, error: storeError };
              if (stored == null || (storedAt as string) > bound) return { data: [], error: null };
              stored = vals.state; storedAt = vals.updated_at;
              return { data: [{ clerk_user_id: 'x' }], error: null };
            },
          }),
        }),
      }),
    }),
  };
}
vi.mock('@clerk/nextjs/server', () => ({ auth: () => authMock() }));
vi.mock('@/lib/supabaseServer', () => ({ getSupabaseAdmin: () => fakeDb() }));

import { GET, PUT } from '@/app/api/academy/progress/route';

const req = (body: unknown, raw?: string) => new Request('http://x/api', { method: 'PUT', body: raw ?? JSON.stringify(body) }) as never;
const LESSON = 'ugc/01-how-ugc-works';

beforeEach(() => { authMock.mockReset(); upsert.mockClear(); stored = null; storedAt = null; storeError = null; });

describe('academy progress API', () => {
  it('401 when signed out (GET and PUT), and nothing is written', async () => {
    authMock.mockResolvedValue({ userId: null });
    expect((await GET())!.status).toBe(401);
    expect((await PUT(req({ progress: {} })))!.status).toBe(401);
    expect(upsert).not.toHaveBeenCalled();
  });
  it('needs no paid entitlement: any signed-in learner can save', async () => {
    authMock.mockResolvedValue({ userId: 'u1' });
    const res = await PUT(req({ progress: { updatedAt: 5, last: { ugc: { lessonId: LESSON, stepId: 'overview', at: 5 } } } }));
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
    expect(row.state.stepsDone).toEqual({}); // completed lessons keep no per-step detail
    expect(row.state.checks).toEqual({ [LESSON]: [0] });
  });
  it('GET returns the saved progress and the owner id', async () => {
    authMock.mockResolvedValue({ userId: 'u1' });
    stored = { updatedAt: 3, completedLessons: [LESSON] };
    const body = await (await GET())!.json();
    expect(body.owner).toBe('u1');
    expect(body.progress.completedLessons).toEqual([LESSON]);
    stored = null;
    expect((await (await GET())!.json()).progress).toBeNull();
  });
  it('ignores a request older than what is already saved (out-of-order requests)', async () => {
    authMock.mockResolvedValue({ userId: 'u1' });
    stored = { updatedAt: 9000, completedLessons: [LESSON] };
    storedAt = new Date(9000).toISOString();
    const res = await PUT(req({ progress: { updatedAt: 5000 } }));
    const body = await res!.json();
    expect(body.stale).toBe(true);
    expect(body.progress.completedLessons).toEqual([LESSON]);
    expect((stored as { updatedAt: number }).updatedAt).toBe(9000);
  });
  it('two interleaved saves: the older request landing last never overwrites the newer one', async () => {
    authMock.mockResolvedValue({ userId: 'u1' });
    const older = req({ progress: { updatedAt: 5000, completedLessons: [] } });
    const newer = req({ progress: { updatedAt: 9000, completedLessons: [LESSON] } });
    // both start together (both would pass a read-then-write check); the newer finishes its write first
    const [a, b] = await Promise.all([PUT(older), PUT(newer)]);
    expect([a!.status, b!.status]).toEqual([200, 200]);
    expect((stored as { updatedAt: number }).updatedAt).toBe(9000);
    expect((stored as { completedLessons: string[] }).completedLessons).toEqual([LESSON]);
    // and the reverse arrival order
    stored = null; storedAt = null;
    await Promise.all([PUT(req({ progress: { updatedAt: 9000, completedLessons: [LESSON] } })), PUT(req({ progress: { updatedAt: 5000 } }))]);
    expect((stored as { updatedAt: number }).updatedAt).toBe(9000);
  });
  it('413 for an oversized body, 400 for bad JSON', async () => {
    authMock.mockResolvedValue({ userId: 'u1' });
    expect((await PUT(req(null, 'x'.repeat(65 * 1024))))!.status).toBe(413);
    expect((await PUT(req(null, '{nope')))!.status).toBe(400);
  });
  it('503 when the progress table is not available yet (the browser keeps progress)', async () => {
    authMock.mockResolvedValue({ userId: 'u1' });
    storeError = { message: 'relation "academy_progress" does not exist' };
    expect((await GET())!.status).toBe(503);
    expect((await PUT(req({ progress: { updatedAt: 1 } })))!.status).toBe(503);
  });
});
