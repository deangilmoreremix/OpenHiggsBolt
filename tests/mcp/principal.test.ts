// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const clerkAuth = vi.fn();
vi.mock('@clerk/nextjs/server', () => ({ auth: (...a: unknown[]) => clerkAuth(...a), currentUser: vi.fn() }));

const resolveAccess = vi.fn();
vi.mock('@/access/resolveAccess', () => ({ resolveSmartVideoAccessForUser: (...a: unknown[]) => resolveAccess(...a) }));

const { runAs, authOrPrincipal, currentPrincipal } = await import('../../lib/principal');
const { requireApiEntitlement } = await import('@/access/apiRequireEntitlement');
const { ENTITLEMENTS } = await import('@/access/entitlements');

beforeEach(() => { clerkAuth.mockReset(); resolveAccess.mockReset(); });

describe('principal', () => {
  it('without a principal it is exactly Clerk', async () => {
    clerkAuth.mockResolvedValue({ userId: 'clerk_user' });
    expect(await authOrPrincipal()).toEqual({ userId: 'clerk_user' });
    clerkAuth.mockResolvedValue({ userId: null });
    expect(await authOrPrincipal()).toEqual({ userId: null });
    expect(currentPrincipal()).toBeUndefined();
  });

  it('inside runAs the principal wins and Clerk is not consulted', async () => {
    const out = await runAs({ userId: 'mcp_owner' }, async () => { await Promise.resolve(); return authOrPrincipal(); });
    expect(out).toEqual({ userId: 'mcp_owner' });
    expect(clerkAuth).not.toHaveBeenCalled();
    expect(currentPrincipal()).toBeUndefined(); // does not leak out of the call
  });

  it('concurrent runs keep their own principal', async () => {
    const run = (id: string) => runAs({ userId: id }, async () => { await new Promise((r) => setTimeout(r, Math.random() * 10)); return (await authOrPrincipal()).userId; });
    expect(await Promise.all(['a', 'b', 'c', 'd'].map(run))).toEqual(['a', 'b', 'c', 'd']);
  });

  it('refuses an empty or non-string principal', () => {
    expect(() => runAs({ userId: '' }, () => 1)).toThrow();
    expect(() => runAs({ userId: 5 as unknown as string }, () => 1)).toThrow();
    expect(() => runAs(undefined as unknown as { userId: string }, () => 1)).toThrow();
  });
});

describe('entitlement check through the principal', () => {
  it('signed-out stays 401', async () => {
    clerkAuth.mockResolvedValue({ userId: null });
    expect(await requireApiEntitlement(ENTITLEMENTS.SMARTVIDEO_GO)).toEqual({ allowed: false, status: 401 });
  });

  it('a principal is checked against that user\'s access, and a denied one is 403', async () => {
    resolveAccess.mockResolvedValue({ isSuperUser: false, hasSmartVideoGo: true, entitlements: {} });
    expect(await runAs({ userId: 'mcp_owner' }, () => requireApiEntitlement(ENTITLEMENTS.SMARTVIDEO_GO))).toEqual({ allowed: true });
    expect(resolveAccess).toHaveBeenCalledWith('mcp_owner');
    resolveAccess.mockResolvedValue({ isSuperUser: false, hasSmartVideoGo: false, entitlements: {} });
    expect(await runAs({ userId: 'mcp_owner' }, () => requireApiEntitlement(ENTITLEMENTS.SMARTVIDEO_GO))).toMatchObject({ allowed: false, status: 403 });
  });
});
