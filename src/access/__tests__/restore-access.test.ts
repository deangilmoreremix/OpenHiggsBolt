import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('restore access', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns not_found when no qualifying purchase exists', async () => {
    vi.doMock('@clerk/nextjs/server', () => ({
      auth: vi.fn(async () => ({ userId: 'user_123' })),
    }));

    vi.doMock('@/access/resolveAccess', () => ({
      restoreAccessByEmail: vi.fn(async () => ({
        status: 'not_found' as const,
        message: 'No qualifying purchase found for this email.',
      })),
    }));

    const { POST } = await import('@/app/api/access/restore/route');
    const req = {
      json: vi.fn(async () => ({ email: 'nonexistent@example.com' })),
    } as any;
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.status).toBe('not_found');
  });

  it('returns restored when access is successfully restored', async () => {
    vi.doMock('@clerk/nextjs/server', () => ({
      auth: vi.fn(async () => ({ userId: 'user_123' })),
    }));

    vi.doMock('@/access/resolveAccess', () => ({
      restoreAccessByEmail: vi.fn(async () => ({
        status: 'restored' as const,
        message: 'Access restored successfully.',
      })),
    }));

    const { POST } = await import('@/app/api/access/restore/route');
    const req = {
      json: vi.fn(async () => ({ email: 'purchaser@example.com' })),
    } as any;
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.status).toBe('restored');
  });

  it('returns 401 when not authenticated', async () => {
    vi.doMock('@clerk/nextjs/server', () => ({
      auth: vi.fn(async () => ({ userId: null })),
    }));

    const { POST } = await import('@/app/api/access/restore/route');
    const req = {
      json: vi.fn(async () => ({ email: 'test@example.com' })),
    } as any;
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when email is missing', async () => {
    vi.doMock('@clerk/nextjs/server', () => ({
      auth: vi.fn(async () => ({ userId: 'user_123' })),
    }));

    const { POST } = await import('@/app/api/access/restore/route');
    const req = {
      json: vi.fn(async () => ({})),
    } as any;
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
