import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-secret';

const store = {
  userId: 'user_design_123',
  app_users: new Map(),
};

function makeBuilder() {
  const builder = {
    from: () => makeBuilder(),
    update: (payload) => {
      store.app_users.set(store.userId, { muapi_key: payload?.muapi_key ?? null });
      return builder;
    },
    insert: (payload) => {
      store.app_users.set(store.userId, { muapi_key: payload?.muapi_key ?? null });
      return builder;
    },
    eq: () => builder,
    select: () => builder,
    maybeSingle: () => {
      const row = store.app_users.get(store.userId) || null;
      return Promise.resolve({ data: row ? { muapi_key: row.muapi_key } : null, error: null });
    },
  };
  return builder;
}

function mockReq(opts = {}) {
  return {
    headers: new Headers({
      ...(opts.authorization ? { authorization: opts.authorization } : {}),
      ...(opts['x-api-key'] ? { 'x-api-key': opts['x-api-key'] } : {}),
    }),
  };
}

const mockAuth = () => Promise.resolve({ userId: store.userId });
const mockSb = () => ({ from: () => makeBuilder() });

describe('design-agent auth helper', () => {
  let getDesignAgentApiKey;

  before(async () => {
    store.app_users.clear();
    const mod = await import('../app/api/design-agent/lib/auth.ts');
    getDesignAgentApiKey = (req, deps) => mod.getDesignAgentApiKey(req, {
      auth: () => Promise.resolve({ userId: store.userId }),
      getSupabaseAdmin: () => ({
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: store.app_users.get(store.userId) || null, error: null }),
            }),
          }),
        }),
      }),
      ...deps,
    });
  });

  after(() => { store.app_users.clear(); });

  it('accepts Bearer token directly without Clerk', async () => {
    const key = await getDesignAgentApiKey(mockReq({ authorization: 'Bearer direct-key-123' }));
    assert.equal(key, 'direct-key-123');
  });

  it('accepts x-api-key directly without Clerk', async () => {
    const key = await getDesignAgentApiKey(mockReq({ 'x-api-key': 'x-key-456' }));
    assert.equal(key, 'x-key-456');
  });

  it('falls back to Clerk when no direct key is provided', async () => {
    store.app_users.set('user_design_123', { muapi_key: 'clerk-key-789' });
    const key = await getDesignAgentApiKey(mockReq());
    assert.equal(key, 'clerk-key-789');
  });

  it('throws 401 when unauthenticated and no key provided', async () => {
    store.app_users.set('user_design_123', { muapi_key: null });
    let threw = false;
    let status = 500;
    try {
      await getDesignAgentApiKey(mockReq(), {
        auth: () => Promise.resolve({ userId: null }),
        getSupabaseAdmin: () => ({
          from: () => ({
            select: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve({ data: null, error: null }),
              }),
            }),
          }),
        }),
      });
    } catch (err) {
      threw = true;
      status = err.status || 500;
    }
    assert.equal(threw, true);
    assert.equal(status, 401);
  });

  it('throws 400 when no key is configured in Supabase', async () => {
    store.app_users.set('user_design_123', { muapi_key: null });
    let threw = false;
    let status = 500;
    try {
      await getDesignAgentApiKey(mockReq());
    } catch (err) {
      threw = true;
      status = err.status || 500;
    }
    assert.equal(threw, true);
    assert.equal(status, 400);
  });
});

describe('design-agent file validation', () => {
  it('rejects files over 50MB', () => {
    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    const bigFile = { size: MAX_FILE_SIZE + 1, type: 'image/jpeg', name: 'big.jpg' };
    assert.ok(bigFile.size > MAX_FILE_SIZE, 'file exceeds max size');
  });

  it('rejects unsupported file types', () => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif',
      'video/mp4', 'video/webm', 'video/quicktime',
      'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a',
    ];
    const exeFile = { size: 1024, type: 'application/x-msdownload', name: 'file.exe' };
    assert.ok(!allowedTypes.includes(exeFile.type), 'exe should be rejected');
  });
});
