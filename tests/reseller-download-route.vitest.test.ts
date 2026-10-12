import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * Endpoint contract for GET /api/reseller/download:
 *   401 unauthenticated · 403 not entitled · 404 unknown app ·
 *   302 short-lived signed URL for entitled callers ·
 *   503 documented storage gaps. Entitlement isolation: user A's
 *   entitlements never apply to user B's session.
 */

const APP_ID = 'ai-headshot-studio';

const { state, SIGNED_URL, BUCKET_CALLS } = vi.hoisted(() => ({
  state: {
    authUserId: 'user_a' as string | null,
    entitlements: {} as Record<string, boolean>,
    status: 'active',
    externalThrows: false,
    signedUrl: 'https://example.supabase.co/storage/v1/sign/token-abc' as
      | string
      | null,
    publishArtifact: false,
    storageConfigured: true,
    accessCalls: [] as string[],
  },
  SIGNED_URL: 'https://example.supabase.co/storage/v1/sign/token-abc',
  BUCKET_CALLS: [] as string[],
}));

const externalStateMock = vi.hoisted(() => vi.fn());
const accessMock = vi.hoisted(() => vi.fn());
const signedUrlMock = vi.hoisted(() => vi.fn());

vi.mock('@clerk/nextjs/server', () => ({
  auth: async () => ({ userId: state.authUserId }),
}));

vi.mock('@/lib/reseller/entitlements', () => ({
  getResellerUserState: async (userId: string) => {
    if (state.externalThrows) throw new Error('external helper unavailable');
    externalStateMock(userId);
    return { entitlements: state.entitlements, status: state.status };
  },
}));

vi.mock('@/access/resolveAccess', () => ({
  resolveSmartVideoAccessForUser: async (userId: string) => {
    state.accessCalls.push(userId);
    accessMock(userId);
    return { entitlements: state.entitlements, status: state.status };
  },
}));

vi.mock('@/lib/supabaseServer', () => ({
  getSupabaseAdmin: () => ({
    storage: {
      from: (bucket: string) => {
        BUCKET_CALLS.push(bucket);
        return { createSignedUrl: signedUrlMock };
      },
    },
  }),
}));

/**
 * Manifest fixture for this file. Vitest caches a `vi.mock` factory's
 * RESULT (it is not re-run by `vi.resetModules()`), so this object is
 * created once and mutated in place by `configure()`. `getResellerApp()`
 * hands back these very app objects, so flipping the artifact status here
 * is exactly what the storage layer observes. The 38-app allowlist, the
 * `missing` statuses and the null checksums of the REAL manifest are
 * asserted in tests/reseller-access.vitest.test.ts.
 */
const PUBLISHED_MANIFEST = {
  bucket: 'reseller-app-bundles',
  bucketVisibility: 'private',
  signedUrlTtlSeconds: 120,
  apps: [
    {
      id: APP_ID,
      name: 'AI Headshot Studio',
      category: 'Image',
      repo: 'https://github.com/SamurAIGPT/ai-headshot-generator',
      artifacts: [
        {
          kind: 'source-zip',
          objectPath: `bundles/${APP_ID}/${APP_ID}-source.zip`,
          status: 'available' as 'available' | 'missing',
          sha256: null,
        },
      ],
    },
  ],
};

vi.mock('@/data/resellerAppBundles.json', () => ({
  default: PUBLISHED_MANIFEST,
}));

const ENV_KEYS = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] as const;
let savedEnv: Record<string, string | undefined> = {};

function configure(options: {
  userId?: string | null;
  entitlements?: Record<string, boolean>;
  status?: string;
  externalThrows?: boolean;
  signedUrl?: string | null;
  publishArtifact?: boolean;
  storageConfigured?: boolean;
}) {
  // NOTE: explicit null must survive (signed-out caller), so guard with
  // `undefined` checks instead of `??` defaults.
  state.authUserId = options.userId === undefined ? 'user_a' : options.userId;
  state.entitlements = options.entitlements ?? {};
  state.status = options.status ?? 'active';
  state.externalThrows = options.externalThrows ?? false;
  state.signedUrl = options.signedUrl === undefined ? SIGNED_URL : options.signedUrl;
  state.publishArtifact = options.publishArtifact ?? false;
  state.storageConfigured = options.storageConfigured ?? true;
  state.accessCalls = [];
  BUCKET_CALLS.length = 0;

  // Toggle artifact availability on the shared manifest fixture.
  PUBLISHED_MANIFEST.apps[0].artifacts[0].status = state.publishArtifact
    ? 'available'
    : 'missing';

  signedUrlMock.mockReset();
  signedUrlMock.mockImplementation(async () => ({
    data: state.signedUrl ? { signedUrl: state.signedUrl } : null,
    error: state.signedUrl ? null : new Error('object not found'),
  }));

  for (const key of ENV_KEYS) delete process.env[key];
  if (state.storageConfigured) {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
  }
}

function makeRequest(app?: string, extraParams = ''): NextRequest {
  const query = new URLSearchParams();
  if (app !== undefined) query.set('app', app);
  if (extraParams) {
    for (const part of extraParams.split('&')) {
      const [k, v] = part.split('=');
      if (k) query.set(k, v);
    }
  }
  return new NextRequest(
    new URL(`http://localhost/api/reseller/download?${query.toString()}`),
  );
}

/** Raw query string, so percent-encoded traversal payloads reach the handler. */
function makeRawRequest(query: string): NextRequest {
  return new NextRequest(
    new URL(`http://localhost/api/reseller/download?${query}`),
  );
}

beforeEach(() => {
  // Every test re-imports the route module, so start each case from a
  // clean module registry.
  vi.resetModules();
  savedEnv = {};
  for (const key of ENV_KEYS) savedEnv[key] = process.env[key];
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    const value = savedEnv[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe('GET /api/reseller/download', () => {
  it('401 when unauthenticated', async () => {
    configure({ userId: null, entitlements: { apps_studio_diy: true } });
    const { GET } = await import('@/app/api/reseller/download/route');
    const res = await GET(makeRequest(APP_ID));
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ error: 'UNAUTHENTICATED' });
  });

  it('400 when app param is missing', async () => {
    configure({ entitlements: { apps_studio_diy: true } });
    const { GET } = await import('@/app/api/reseller/download/route');
    const res = await GET(makeRequest());
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: 'MISSING_APP_ID' });
  });

  it('404 for unknown app (allowlist gate)', async () => {
    configure({ entitlements: { apps_studio_diy: true } });
    const { GET } = await import('@/app/api/reseller/download/route');
    const res = await GET(makeRequest('definitely-not-an-app'));
    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({ error: 'UNKNOWN_APP' });
  });

  it('404 for directory-traversal appIds', async () => {
    configure({
      entitlements: { apps_studio_diy: true, apps_studio_training: true },
    });
    const { GET } = await import('@/app/api/reseller/download/route');
    for (const payload of [
      'app=../../etc/passwd',
      'app=..%2f..%2fetc%2fpasswd',
      'app=ai-headshot-studio%2f..%2f..%2fx',
      'app=ai-headshot-studio%00',
      'app=%2e%2e%2f%2e%2e%2fetc%2fpasswd',
    ]) {
      const res = await GET(makeRawRequest(payload));
      expect(res.status).toBe(404);
    }
  });

  it('403 for a user with no entitlement (user B cannot download user A’s bundle)', async () => {
    configure({ userId: 'user_b', entitlements: {}, status: 'inactive' });
    const { GET } = await import('@/app/api/reseller/download/route');
    const res = await GET(makeRequest(APP_ID));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('NOT_ENTITLED');
    expect(body.entitlement).toBe('apps_studio_diy');
    expect(signedUrlMock).not.toHaveBeenCalled();
  });

  it('403 for a DIY holder whose entitlement went inactive', async () => {
    configure({ entitlements: { apps_studio_diy: true }, status: 'inactive' });
    const { GET } = await import('@/app/api/reseller/download/route');
    const res = await GET(makeRequest(APP_ID));
    expect(res.status).toBe(403);
  });

  it('302 to a short-lived signed URL for an entitled DIY user (user A)', async () => {
    configure({
      entitlements: { apps_studio_diy: true },
      publishArtifact: true,
    });
    const { GET } = await import('@/app/api/reseller/download/route');
    const res = await GET(makeRequest(APP_ID));
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe(SIGNED_URL);
    expect(res.headers.get('cache-control')).toBe('no-store');
    // Signed against the PRIVATE bucket with a short TTL; the object
    // path comes from the manifest, never from the query string.
    expect(BUCKET_CALLS).toEqual(['reseller-app-bundles']);
    expect(signedUrlMock).toHaveBeenCalledWith(
      `bundles/${APP_ID}/${APP_ID}-source.zip`,
      120,
    );
    // The redirect target is a signed token URL, never a public path.
    expect(res.headers.get('location')).toMatch(/^https:\/\//);
    expect(res.headers.get('location')).not.toContain('/object/public/');
  });

  it('302 for a training-only user (training grants downloads too)', async () => {
    configure({
      userId: 'user_c',
      entitlements: { apps_studio_training: true },
      publishArtifact: true,
    });
    const { GET } = await import('@/app/api/reseller/download/route');
    const res = await GET(makeRequest(APP_ID));
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe(SIGNED_URL);
  });

  it('ignores client-supplied user identifiers (no cross-user spoofing)', async () => {
    configure({ entitlements: { apps_studio_diy: true }, publishArtifact: true });
    const { GET } = await import('@/app/api/reseller/download/route');
    const res = await GET(makeRequest(APP_ID, 'userId=user_b&clerk_user_id=user_b'));
    expect(res.status).toBe(302);
    // Entitlements were resolved for the authenticated caller only.
    expect(externalStateMock).toHaveBeenCalledWith('user_a');
    expect(state.accessCalls).not.toContain('user_b');
  });

  it('exposes no POST handler, so no request body can carry a user identifier', async () => {
    configure({ entitlements: { apps_studio_diy: true }, publishArtifact: true });
    const route = await import('@/app/api/reseller/download/route');
    expect(typeof route.GET).toBe('function');
    // No body-consuming method: identity can only ever come from the
    // Clerk session, never from the request payload.
    expect(route.POST).toBeUndefined();
    expect(route.PUT).toBeUndefined();
    expect(route.PATCH).toBeUndefined();
    expect(route.DELETE).toBeUndefined();
  });

  it('503 STORAGE_NOT_CONFIGURED when Supabase credentials are absent', async () => {
    configure({
      entitlements: { apps_studio_diy: true },
      publishArtifact: true,
      storageConfigured: false,
    });
    const { GET } = await import('@/app/api/reseller/download/route');
    const res = await GET(makeRequest(APP_ID));
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ error: 'STORAGE_NOT_CONFIGURED' });
  });

  it('503 BUNDLE_NOT_AVAILABLE while artifacts are unpublished (documented gap)', async () => {
    configure({
      entitlements: { apps_studio_diy: true, apps_studio_training: true },
      publishArtifact: false,
    });
    const { GET } = await import('@/app/api/reseller/download/route');
    const res = await GET(makeRequest(APP_ID));
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ error: 'BUNDLE_NOT_AVAILABLE' });
  });

  it('503 SIGN_FAILED when signed-URL minting fails for a published artifact', async () => {
    configure({
      entitlements: { apps_studio_diy: true },
      publishArtifact: true,
      signedUrl: null,
    });
    const { GET } = await import('@/app/api/reseller/download/route');
    const res = await GET(makeRequest(APP_ID));
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ error: 'SIGN_FAILED' });
  });

  it('falls back to the existing entitlement store when the reseller helper is unavailable', async () => {
    configure({
      entitlements: { apps_studio_diy: true },
      externalThrows: true,
      publishArtifact: true,
    });
    const { GET } = await import('@/app/api/reseller/download/route');
    const res = await GET(makeRequest(APP_ID));
    expect(res.status).toBe(302);
    // The existing user_entitlements store resolved the same entitlement.
    expect(state.accessCalls).toEqual(['user_a']);
  });
});
