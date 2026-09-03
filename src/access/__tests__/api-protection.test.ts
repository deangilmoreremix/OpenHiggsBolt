import { describe, it, expect, vi, beforeEach } from 'vitest';

// We test the entitlement check logic in isolation by mocking the modules
describe('apiRequireEntitlement', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns 401 when user is not authenticated', async () => {
    vi.doMock('@clerk/nextjs/server', () => ({
      auth: vi.fn(async () => ({ userId: null })),
    }));

    vi.doMock('@/access/resolveAccess', () => ({
      resolveSmartVideoAccessForUser: vi.fn(),
    }));

    vi.doMock('@/access/entitlements', () => ({
      ENTITLEMENTS: { SMARTVIDEO_GO: 'smartvideo_go' },
    }));

    const { requireApiEntitlement } = await import('@/access/apiRequireEntitlement');
    const result = await requireApiEntitlement('smartvideo_go');
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.status).toBe(401);
    }
  });

  it('returns 403 when user is authenticated but unpaid', async () => {
    vi.doMock('@clerk/nextjs/server', () => ({
      auth: vi.fn(async () => ({ userId: 'user_123' })),
    }));

    vi.doMock('@/access/resolveAccess', () => ({
      resolveSmartVideoAccessForUser: vi.fn(async () => ({
        clerkUserId: 'user_123',
        email: 'test@example.com',
        entitlements: { smartvideo_go: false },
        status: 'inactive',
        source: 'manual',
        hasSmartVideoGo: false,
      })),
    }));

    vi.doMock('@/access/entitlements', () => ({
      ENTITLEMENTS: { SMARTVIDEO_GO: 'smartvideo_go' },
    }));

    const { requireApiEntitlement } = await import('@/access/apiRequireEntitlement');
    const result = await requireApiEntitlement('smartvideo_go');
    expect(result.allowed).toBe(false);
    if (!result.allowed && result.status === 403) {
      expect(result.entitlement).toBe('smartvideo_go');
    }
  });

  it('returns allowed when user has smartvideo_go entitlement', async () => {
    vi.doMock('@clerk/nextjs/server', () => ({
      auth: vi.fn(async () => ({ userId: 'user_123' })),
    }));

    vi.doMock('@/access/resolveAccess', () => ({
      resolveSmartVideoAccessForUser: vi.fn(async () => ({
        clerkUserId: 'user_123',
        email: 'test@example.com',
        entitlements: { smartvideo_go: true },
        status: 'active',
        source: 'stripe',
        hasSmartVideoGo: true,
      })),
    }));

    vi.doMock('@/access/entitlements', () => ({
      ENTITLEMENTS: { SMARTVIDEO_GO: 'smartvideo_go' },
    }));

    const { requireApiEntitlement } = await import('@/access/apiRequireEntitlement');
    const result = await requireApiEntitlement('smartvideo_go');
    expect(result.allowed).toBe(true);
  });

  it('returns allowed when user has founders entitlement', async () => {
    vi.doMock('@clerk/nextjs/server', () => ({
      auth: vi.fn(async () => ({ userId: 'user_123' })),
    }));

    vi.doMock('@/access/resolveAccess', () => ({
      resolveSmartVideoAccessForUser: vi.fn(async () => ({
        clerkUserId: 'user_123',
        email: 'test@example.com',
        entitlements: { founders: true },
        status: 'active',
        source: 'manual',
        hasSmartVideoGo: true,
      })),
    }));

    vi.doMock('@/access/entitlements', () => ({
      ENTITLEMENTS: { SMARTVIDEO_GO: 'smartvideo_go' },
    }));

    const { requireApiEntitlement } = await import('@/access/apiRequireEntitlement');
    const result = await requireApiEntitlement('smartvideo_go');
    expect(result.allowed).toBe(true);
  });
});
