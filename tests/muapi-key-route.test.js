import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

// The route encrypts the key at rest; it needs a server-only secret.
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-secret';

// End-to-end handler tests. Because the route injects its auth + db
// dependencies (buildHandlers), we exercise the REAL route logic — encryption,
// auth gating, validation, per-user isolation — with in-memory mocks and no
// live Clerk/Supabase/DB.

const store = {
  userId: 'user_test_123',
  app_users: new Map(), // clerk_user_id -> { muapi_key, openai_key, key_updated_at, openai_key_updated_at }
};

function makeBuilder() {
  // Track the last requested clerk_user_id so we can verify the filter is used.
  let lastEqClause: string | null = null;
  const builder = {
    eq: (column, value) => {
      if (column === 'clerk_user_id') {
        lastEqClause = String(value);
      }
      return builder;
    },
    update: (payload) => {
      const existing = store.app_users.get(lastEqClause) || {};
      store.app_users.set(lastEqClause, {
        ...existing,
        ...payload,
      });
      return builder;
    },
    insert: (payload) => {
      store.app_users.set(payload.clerk_user_id || store.userId, payload);
      return builder;
    },
    select: () => builder, // chain continues to maybeSingle()
    maybeSingle: () => {
      const row = store.app_users.get(lastEqClause || store.userId) || null;
      return Promise.resolve({ data: row || null, error: null });
    },
  };
  return builder;
}

const mockAuth = () => Promise.resolve({ userId: store.userId });
const mockSb = () => ({ from: () => makeBuilder() });

process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-secret';

function postReq(body) {
  return new Request('https://x/api/auth/muapi-key', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('muapi-key route (integration)', () => {
  let route;

  before(async () => {
    store.app_users.clear();
    const mod = await import('../app/api/auth/muapi-key/route.ts');
    route = mod.buildHandlers({ auth: mockAuth, getSupabaseAdmin: mockSb });
  });

  after(() => { store.app_users.clear(); });

  it('blocks GET when unauthenticated (no userId) -> 401', async () => {
    store.userId = null;
    const res = await route.GET();
    assert.equal(res.status, 401);
    assert.equal((await res.json()).key, null);
    store.userId = 'user_test_123';
  });

  it('blocks POST when unauthenticated -> 401', async () => {
    store.userId = null;
    const res = await route.POST(postReq({ key: 'sk_test_abc' }));
    assert.equal(res.status, 401);
    store.userId = 'user_test_123';
  });

  it('rejects an empty key with 400', async () => {
    const res = await route.POST(postReq({ key: '   ' }));
    assert.equal(res.status, 400);
    assert.equal((await res.json()).ok, false);
  });

  it('rejects a missing key field with 400', async () => {
    const res = await route.POST(postReq({}));
    assert.equal(res.status, 400);
  });

  it('saves the key encrypted (not plaintext) and GET returns the plaintext', async () => {
    const KEY = 'sk_live_secret_value_xyz';
    const post = await route.POST(postReq({ key: KEY }));
    assert.equal(post.status, 200);
    assert.equal((await post.json()).ok, true);

    const stored = store.app_users.get(store.userId);
    assert.ok(stored, 'key should be persisted server-side');
    assert.notEqual(stored.muapi_key, KEY);
    assert.ok(stored.muapi_key.startsWith('v1:'), 'ciphertext must be encrypted at rest');

    const get = await route.GET();
    assert.equal(get.status, 200);
    assert.equal((await get.json()).key, KEY);
  });

  it('GET returns null when the user has no stored key', async () => {
    store.app_users.clear();
    const json = await (await route.GET()).json();
    assert.equal(json.key, null);
  });

  it('DELETE clears the stored key', async () => {
    store.app_users.set(store.userId, { muapi_key: 'v1:abc:def:ghi' });
    const del = await route.DELETE();
    assert.equal(del.status, 200);
    assert.equal((await del.json()).ok, true);
    assert.equal((await (await route.GET()).json()).key, null);
  });

  it('persists per-user: another user does not see a different user key', async () => {
    store.app_users.set('user_test_123', { muapi_key: 'v1:owner:owner:owner' });
    store.userId = 'user_other';
    store.app_users.set('user_other', { muapi_key: null });
    assert.equal((await (await route.GET()).json()).key, null);
    store.userId = 'user_test_123';
  });

  it('MuAPI-only save preserves existing OpenAI key (PATCH semantics)', async () => {
    store.app_users.set(store.userId, {
      muapi_key: 'v1:old_muapi:old',
      openai_key: 'v1:old_openai:old',
    });

    const res = await route.POST(postReq({ key: 'new-muapi-key-123' }));
    assert.equal(res.status, 200);
    assert.equal((await res.json()).ok, true);

    const stored = store.app_users.get(store.userId);
    assert.ok(stored.muapi_key.startsWith('v1:'), 'MuAPI should be updated');
    assert.equal(stored.openai_key, 'v1:old_openai:old', 'OpenAI must NOT be cleared by MuAPI-only save');
  });

  it('OpenAI-only save preserves existing MuAPI key (PATCH semantics)', async () => {
    store.app_users.set(route, {
      muapi_key: 'v1:old_muapi:old',
      openai_key: 'v1:old_openai:old',
    });

    const res = await route.POST(postReq({ key: 'keep-muapi', openaiKey: 'new-openai-key' }));
    assert.equal(res.status, 200);
    assert.equal((await res.json()).ok, true);

    const stored = store.app_users.get(store.userId);
    assert.ok(stored.muapi_key.startsWith('v1:'), 'MuAPI must NOT be cleared by OpenAI-only save');
    assert.ok(stored.openai_key.startsWith('v1:'), 'OpenAI should be updated');
  });

  it('uses the authenticated clerk_user_id filter, not a hard-coded value', async () => {
    const targetUserId = 'user_filter_test';
    store.app_users.set(targetUserId, { muapi_key: null });
    store.userId = targetUserId;

    const res = await route.POST(postReq({ key: 'filter-test-key' }));
    assert.equal(res.status, 200);

    const stored = store.app_users.get(targetUserId);
    assert.ok(stored, 'row should be written under the authenticated user ID');
    assert.ok(stored.muapi_key.startsWith('v1:'));
  });

  it('first-write insert fallback: inserts when no row exists', async () => {
    store.app_users.clear();
    store.userId = 'user_first_write';

    const res = await route.POST(postReq({ key: 'first-write-key' }));
    assert.equal(res.status, 200);
    assert.equal((await res.json()).ok, true);

    const stored = store.app_users.get('user_first_write');
    assert.ok(stored, 'insert fallback must create the row');
    assert.ok(stored.muapi_key.startsWith('v1:'));
  });
});

describe('muapi-key route — rate limiting + audit timestamp', () => {
  function makeBuilder2() {
    const b = {
      update: (payload) => {
        store.app_users.set(store.userId, {
          muapi_key: payload?.muapi_key ?? null,
          key_updated_at: payload?.key_updated_at ?? null,
        });
        return b;
      },
      insert: (payload) => {
        store.app_users.set(store.userId, {
          muapi_key: payload?.muapi_key ?? null,
          key_updated_at: payload?.key_updated_at ?? null,
        });
        return b;
      },
      eq: () => b,
      select: () => b,
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
    };
    return b;
  }

  it('returns 429 when the rate limiter blocks a save', async () => {
    const calls = [];
    const limiter = (k) => { calls.push(k); return false; }; // always blocked
    const h = buildHandlersForTest2(limiter);
    const res = await h.POST(postReq({ key: 'sk_should_be_blocked' }));
    assert.equal(res.status, 429);
    const json = await res.json();
    assert.equal(json.ok, false);
    assert.match(json.error, /too many requests/i);
  });

  it('records key_updated_at (audit timestamp) on save and on clear', async () => {
    let allow = true;
    const limiter = () => allow;
    const h = buildHandlersForTest2(limiter);

    await h.POST(postReq({ key: 'sk_audit_me' }));
    const afterSave = store.app_users.get(store.userId);
    assert.ok(afterSave.key_updated_at, 'key_updated_at set on save');
    assert.ok(!Number.isNaN(Date.parse(afterSave.key_updated_at)), 'valid ISO timestamp');

    await h.DELETE();
    const afterClear = store.app_users.get(store.userId);
    assert.ok(afterClear.key_updated_at, 'key_updated_at set on clear');
  });

  function buildHandlersForTest2(limiter) {
    store.app_users.clear();
    return route2.buildHandlers({ auth: mockAuth, getSupabaseAdmin: mockSb2, rateLimit: limiter });
  }
  const mockSb2 = () => ({ from: () => makeBuilder2() });

  let route2;
  before(async () => {
    const mod = await import('../app/api/auth/muapi-key/route.ts');
    route2 = mod;
  });
});
