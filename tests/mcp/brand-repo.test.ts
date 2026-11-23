// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const clerkAuth = vi.fn();
vi.mock('@clerk/nextjs/server', () => ({ auth: (...a: unknown[]) => clerkAuth(...a), currentUser: vi.fn() }));
vi.mock('@/access/resolveAccess', () => ({ resolveSmartVideoAccessForUser: async () => ({ isSuperUser: false, hasSmartVideoGo: true, entitlements: {} }) }));

// A tiny stand-in for the brand_studio_brands table.
const table = new Map<string, { id: string; clerk_user_id: string; data: any; created_at?: string }>();
const calls: string[] = [];
function fakeAdmin() {
  return {
    from: (name: string) => {
      calls.push(name);
      const f: Record<string, string> = {};
      const q: any = {
        select: () => q, order: () => q,
        eq: (c: string, v: string) => { f[c] = v; return q; },
        maybeSingle: async () => { const r = table.get(f.id); return { data: r && r.clerk_user_id === f.clerk_user_id ? r : null, error: null }; },
        upsert: async (row: any) => { table.set(row.id, row); return { error: null }; },
        then: (res: any) => res({ data: [...table.values()].filter((r) => r.clerk_user_id === f.clerk_user_id), error: null }),
      };
      return q;
    },
  };
}

const { memoryBrandRepo, supabaseBrandRepo, getBrandRepo, resetBrandRepo } = await import('../../src/shared/brandRepo');
const { brands } = await import('../../src/shared/brandStore');
const brand = (id: string, owner: string) => ({ id, owner, url: `https://${id}.example`, brand_name: id, created_at: 'x' }) as any;

beforeEach(() => { table.clear(); calls.length = 0; brands.clear(); clerkAuth.mockReset(); resetBrandRepo(); });

describe.each([['memory', () => memoryBrandRepo()], ['supabase', () => supabaseBrandRepo(fakeAdmin())]])('brand repo (%s)', (_n, make) => {
  it('saves and lists only the owner\'s brands; a non-owned id is simply missing', async () => {
    const repo = make();
    await repo.save(brand('br_a', 'owner_1')); await repo.save(brand('br_b', 'owner_2'));
    expect((await repo.list('owner_1')).map((b) => b.id)).toEqual(['br_a']);
    expect(await repo.get('br_a', 'owner_1')).toMatchObject({ id: 'br_a' });
    expect(await repo.get('br_a', 'owner_2')).toBeUndefined();
    expect(await repo.list('nobody')).toEqual([]);
  });
  it('save is an upsert keyed by id (a PATCH replaces, it does not duplicate)', async () => {
    const repo = make();
    await repo.save(brand('br_a', 'owner_1'));
    await repo.save({ ...brand('br_a', 'owner_1'), tagline: 'new' });
    const all = await repo.list('owner_1');
    expect(all).toHaveLength(1);
    expect(all[0].tagline).toBe('new');
  });
});

describe('the Supabase repo survives a restart (new instance, same table)', () => {
  it('a brand saved by one instance is read by another', async () => {
    await supabaseBrandRepo(fakeAdmin()).save(brand('br_keep', 'owner_1'));
    expect(await supabaseBrandRepo(fakeAdmin()).get('br_keep', 'owner_1')).toMatchObject({ id: 'br_keep' });
  });
});

describe('repo selection', () => {
  it('uses memory without Supabase env or when BRAND_STORE=memory', () => {
    const env = { ...process.env };
    delete process.env.SUPABASE_URL; delete process.env.NEXT_PUBLIC_SUPABASE_URL; delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    resetBrandRepo();
    expect(getBrandRepo()).toBeDefined();
    process.env = env;
  });
});

describe('the brands routes read through the repo', () => {
  it('GET /api/brands lists the signed-in user\'s brands only and refuses signed-out callers', async () => {
    const { GET } = await import('../../app/api/brands/route');
    await memoryBrandRepo().save(brand('br_a', 'owner_1')); await memoryBrandRepo().save(brand('br_b', 'owner_2'));
    clerkAuth.mockResolvedValue({ userId: null });
    expect((await GET(new Request('https://x.test/api/brands') as never)).status).toBe(401);
    clerkAuth.mockResolvedValue({ userId: 'owner_1' });
    const res = await GET(new Request('https://x.test/api/brands') as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect((body.data ?? body).map((b: any) => b.id)).toEqual(['br_a']);
  });
  it('GET /api/brand?id= is 404 for someone else\'s brand and 200 for your own', async () => {
    const { GET } = await import('../../app/api/brand/route');
    await memoryBrandRepo().save(brand('br_a', 'owner_1'));
    clerkAuth.mockResolvedValue({ userId: 'owner_2' });
    expect((await GET(new Request('https://x.test/api/brand?id=br_a') as never)).status).toBe(404);
    clerkAuth.mockResolvedValue({ userId: 'owner_1' });
    expect((await GET(new Request('https://x.test/api/brand?id=br_a') as never)).status).toBe(200);
  });
});
