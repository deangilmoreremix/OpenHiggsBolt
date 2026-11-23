// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const clerkAuth = vi.fn();
vi.mock('@clerk/nextjs/server', () => ({ auth: (...a: unknown[]) => clerkAuth(...a), currentUser: vi.fn() }));

const eqs: Array<[string, unknown]> = [];
vi.mock('@/lib/supabase', () => ({
  createServerClient: () => {
    const q: any = { select: () => q, eq: (c: string, v: unknown) => { eqs.push([c, v]); return q; }, order: () => q, limit: () => q, then: (res: any) => res({ data: [{ id: 'a1' }], error: null }) };
    return { from: () => q };
  },
}));

const { runAs } = await import('../../lib/principal');
const route = await import('../../app/api/assets/library/route');
const get = () => route.GET(new Request('https://x.test/api/assets/library?kind=image') as never);

beforeEach(() => { clerkAuth.mockReset(); eqs.length = 0; });

describe('asset library identity', () => {
  it('signed out is still refused', async () => {
    clerkAuth.mockResolvedValue({ userId: null });
    expect((await get()).status).toBe(401);
  });
  it('a Clerk session still works exactly as before', async () => {
    clerkAuth.mockResolvedValue({ userId: 'clerk_user' });
    expect((await get()).status).toBe(200);
    expect(eqs).toContainEqual(['clerk_user_id', 'clerk_user']);
  });
  it('an MCP principal is accepted and the rows are that user\'s only', async () => {
    clerkAuth.mockResolvedValue({ userId: null });
    const res = await runAs({ userId: 'mcp_owner' }, () => get());
    expect(res.status).toBe(200);
    expect(eqs).toContainEqual(['clerk_user_id', 'mcp_owner']);
    expect(clerkAuth).not.toHaveBeenCalled();
  });
});
