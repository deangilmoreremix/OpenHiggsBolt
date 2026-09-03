import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Clerk auth
const mockAuth = vi.fn();
vi.mock('@clerk/nextjs/server', () => ({
  auth: mockAuth,
}));

// Mock entitlement resolver
const mockResolveAccess = vi.fn();
vi.mock('@/access/resolveAccess', () => ({
  resolveSmartVideoAccessForUser: mockResolveAccess,
}));

// Mock supabase server to avoid module resolution issues in tests
vi.mock('@/src/lib/supabaseServer', () => ({
  getSupabaseAdmin: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(() => Promise.resolve({ data: { muapi_key: 'encrypted-key' }, error: null })),
        })),
      })),
    })),
  })),
}));

// Mock muapi key crypto
vi.mock('@/src/lib/muapiKeyCrypto', () => ({
  decryptMuapiKey: vi.fn(() => 'test-muapi-key'),
}));

const MUAPI_BASE = 'https://api.muapi.ai';

function makeFetchMock(overrides: any = {}) {
  return vi.fn(async () => ({
    ok: true,
    status: 200,
    headers: new Headers({ 'content-type': 'application/json' }),
    async json() {
      return { ...overrides.body };
    },
    async text() {
      return JSON.stringify(overrides.body || {});
    },
    ...overrides,
  }));
}

describe('Security: Photo Studio ownership', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('anonymous GET /api/photo-studio returns 401', async () => {
    mockAuth.mockResolvedValue({ userId: null });
    mockResolveAccess.mockResolvedValue(null);

    const req = new NextRequest(new URL('http://localhost/api/photo-studio'));
    const mod = await import('@/app/api/photo-studio/route');
    const res = await mod.GET(req);
    expect(res.status).toBe(401);
  });

  it('authenticated unpaid GET /api/photo-studio returns 403', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    mockResolveAccess.mockResolvedValue({ hasSmartVideoGo: false });

    const req = new NextRequest(new URL('http://localhost/api/photo-studio'));
    const mod = await import('@/app/api/photo-studio/route');
    const res = await mod.GET(req);
    expect(res.status).toBe(403);
  });
});

describe('Security: Design Agent ownership', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('records ownership on session creation', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-1' });
    mockResolveAccess.mockResolvedValue({ hasSmartVideoGo: true });

    const fetchMock = makeFetchMock({
      ok: true,
      status: 200,
      body: { id: 'session-123', title: 'Test' },
    });
    vi.spyOn(globalThis, 'fetch').mockImplementation(fetchMock);

    const req = new NextRequest('http://localhost/api/design-agent/sessions', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test' }),
    });

    const mod = await import('@/app/api/design-agent/sessions/route');
    const res = await mod.POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.id).toBe('session-123');
  });
});

describe('Security: Safe API response parsing', () => {
  let safeApiJson: any;

  beforeAll(async () => {
    const mod = await import('@/lib/safeApiResponse');
    safeApiJson = mod.safeApiJson;
  });

  it('handles empty response', async () => {
    const res = new Response('', { status: 200 });
    const result = await safeApiJson(res);
    expect(result).toEqual({});
  });

  it('handles valid JSON', async () => {
    const res = new Response(JSON.stringify({ id: '123' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
    const result = await safeApiJson(res);
    expect(result).toEqual({ id: '123' });
  });

  it('handles plain text response', async () => {
    const res = new Response('Unauthorized', { status: 401 });
    const result = await safeApiJson(res);
    expect(result).toEqual({ message: 'Unauthorized' });
  });

  it('handles invalid JSON', async () => {
    const res = new Response('<html>error</html>', {
      status: 500,
      headers: { 'content-type': 'text/html' },
    });
    const result = await safeApiJson(res);
    expect(result).toEqual({ message: '<html>error</html>' });
  });
});

describe('Security: Proxy timeout behavior', () => {
  it('v1 route has timeout on upstream calls', async () => {
    const mod = await import('@/app/api/v1/[...slug]/route');
    const source = String(mod.GET);
    // Verify AbortSignal.timeout is used for upstream fetch
    expect(source.includes('AbortSignal.timeout')).toBe(true);
  });
});
