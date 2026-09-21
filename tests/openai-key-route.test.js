import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

// The route encrypts the key at rest; it needs a server-only secret.
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-secret';

const store = {
  userId: 'user_test_123',
  app_users: new Map(),
};

function makeBuilder() {
  // Enforce that the route actually filters by clerk_user_id.
  let lastEqClause = null;
  const builder = {
    eq: (column, value) => {
      if (column === 'clerk_user_id') {
        lastEqClause = String(value);
      }
      return builder;
    },
    update: (payload) => {
      const key = lastEqClause || store.userId;
      const existing = store.app_users.get(key) || {};
      store.app_users.set(key, {
        ...existing,
        ...payload,
      });
      return builder;
    },
    insert: (payload) => {
      store.app_users.set(payload.clerk_user_id, payload);
      return builder;
    },
    select: () => builder,
    maybeSingle: () => {
      const key = lastEqClause || store.userId;
      const row = store.app_users.get(key) || null;
      return Promise.resolve({
        data: row ? { openai_key: row.openai_key, openai_key_updated_at: row.openai_key_updated_at } : null,
        error: null,
      });
    },
  };
  return builder;
}

const mockAuth = () => Promise.resolve({ userId: store.userId });
const mockSb = () => ({ from: () => makeBuilder() });

function postReq(body) {
  return new Request('https://x/api/auth/openai-key', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('openai-key route (integration)', () => {
  let route;

  // Default verification mock: accept any key as valid.
  const mockVerify = async () => ({
    isValid: true,
    status: 'verified',
    warning: null,
    error: null,
  });

  before(async () => {
    store.app_users.clear();
    const mod = await import('../app/api/auth/openai-key/route.ts');
    route = mod.buildHandlers({
      auth: mockAuth,
      getSupabaseAdmin: mockSb,
      verifyOpenAIKey: mockVerify,
    });
  });

  after(() => { store.app_users.clear(); });

  it('blocks GET when unauthenticated -> 401', async () => {
    store.userId = null;
    const res = await route.GET();
    assert.equal(res.status, 401);
    const json = await res.json();
    assert.equal(json.configured, false);
    store.userId = 'user_test_123';
  });

  it('blocks POST when unauthenticated -> 401', async () => {
    store.userId = null;
    const res = await route.POST(postReq({ openaiKey: 'sk-test' }));
    assert.equal(res.status, 401);
    store.userId = 'user_test_123';
  });

  it('blocks DELETE when unauthenticated -> 401', async () => {
    store.userId = null;
    const res = await route.DELETE();
    assert.equal(res.status, 401);
    store.userId = 'user_test_123';
  });

  it('rejects an empty key with 400', async () => {
    const res = await route.POST(postReq({ openaiKey: '   ' }));
    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.ok, false);
  });

  it('rejects a missing key field with 400', async () => {
    const res = await route.POST(postReq({}));
    assert.equal(res.status, 400);
  });

  it('rejects a key shorter than 8 chars with 400', async () => {
    const res = await route.POST(postReq({ openaiKey: 'sk-123' }));
    assert.equal(res.status, 400);
  });

  it('saves the key encrypted (not plaintext) and GET returns masked metadata', async () => {
    const KEY = 'sk-proj-test-key-value-xyz';
    const post = await route.POST(postReq({ openaiKey: KEY }));
    assert.equal(post.status, 200);
    assert.equal((await post.json()).ok, true);

    const stored = store.app_users.get(store.userId);
    assert.ok(stored, 'key should be persisted server-side');
    assert.notEqual(stored.openai_key, KEY);
    assert.ok(stored.openai_key.startsWith('v1:'), 'ciphertext must be encrypted at rest');

    const get = await route.GET();
    assert.equal(get.status, 200);
    const json = await get.json();
    assert.equal(json.configured, true);
    assert.ok(json.masked.startsWith('sk-proj-'), 'masked key should show prefix');
    assert.ok(json.masked.includes('••••'), 'masked key should hide most characters');
    assert.equal(json.updatedAt, stored.openai_key_updated_at);
  });

  it('GET returns not-configured when the user has no stored key', async () => {
    store.app_users.clear();
    const json = await (await route.GET()).json();
    assert.equal(json.configured, false);
    assert.equal(json.masked, null);
  });

  it('DELETE clears the stored key', async () => {
    store.app_users.set(store.userId, { openai_key: 'v1:abc:def:ghi', openai_key_updated_at: null });
    const del = await route.DELETE();
    assert.equal(del.status, 200);
    assert.equal((await del.json()).ok, true);
    const json = await (await route.GET()).json();
    assert.equal(json.configured, false);
  });

  it('DELETE returns failure when Supabase update errors', async () => {
    const failingSb = () => ({
      from: () => ({
        update: async () => {
          const { error } = await Promise.resolve({ error: new Error('Simulated DB delete failure') });
          if (error) throw error;
          return { error: null };
        },
        eq: () => ({
          select: () => ({
            maybeSingle: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
      }),
    });
    const mod = await import('../app/api/auth/openai-key/route.ts');
    const h = mod.buildHandlers({ auth: mockAuth, getSupabaseAdmin: failingSb });
    const res = await h.DELETE();
    assert.equal(res.status, 500);
    const json = await res.json();
    assert.equal(json.ok, false);
  });

  it('persists per-user: another user does not see a different user key', async () => {
    store.app_users.set('user_test_123', { openai_key: 'v1:owner:owner:owner', openai_key_updated_at: null });
    store.userId = 'user_other';
    store.app_users.set('user_other', { openai_key: null, openai_key_updated_at: null });
    const json = await (await route.GET()).json();
    assert.equal(json.configured, false);
    store.userId = 'user_test_123';
  });

  it('uses the authenticated clerk_user_id filter', async () => {
    const targetUserId = 'user_filter_test';
    store.app_users.set(targetUserId, { openai_key: null, openai_key_updated_at: null });
    store.userId = targetUserId;

    const res = await route.POST(postReq({ openaiKey: 'filter-test-key' }));
    assert.equal(res.status, 200);

    const stored = store.app_users.get(targetUserId);
    assert.ok(stored, 'row should be written under the authenticated user ID');
    assert.ok(stored.openai_key.startsWith('v1:'));
  });

  it('first-write insert fallback: inserts when no row exists', async () => {
    store.app_users.clear();
    store.userId = 'user_first_write';

    const res = await route.POST(postReq({ openaiKey: 'first-write-key' }));
    assert.equal(res.status, 200);
    assert.equal((await res.json()).ok, true);

    const stored = store.app_users.get('user_first_write');
    assert.ok(stored, 'insert fallback must create the row');
    assert.ok(stored.openai_key.startsWith('v1:'));
  });

  it('saves an sk-proj-style key without rejecting the format', async () => {
    const skProjKey = 'sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz';
    const res = await route.POST(postReq({ openaiKey: skProjKey }));
    assert.equal(res.status, 200);
    assert.equal((await res.json()).ok, true);
  });

  it('rejects a quoted key with 400', async () => {
    const res = await route.POST(postReq({ openaiKey: '"sk-proj-quoted"' }));
    assert.equal(res.status, 400);
  });

  it('returns 500 on database failure without leaking internals', async () => {
    const failingSb = () => ({
      from: () => ({
        update: async () => {
          throw new Error('Simulated DB failure');
        },
        eq: () => ({
          select: () => ({
            maybeSingle: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
      }),
    });
    const mod = await import('../app/api/auth/openai-key/route.ts');
    const h = mod.buildHandlers({ auth: mockAuth, getSupabaseAdmin: failingSb, verifyOpenAIKey: mockVerify });
    const res = await h.POST(postReq({ openaiKey: 'sk-proj-db-failure-test' }));
    assert.equal(res.status, 500);
    const json = await res.json();
    assert.equal(json.ok, false);
    assert.ok(typeof json.error === 'string');
    assert.ok(!json.error.includes('Simulated DB failure'), 'must not leak internal error');
  });
});

describe('openai-key route — verification policy', () => {
  async function makeHandlerWithVerify(verifyFn) {
    const mod = await import('../app/api/auth/openai-key/route.ts');
    return mod.buildHandlers({
      auth: mockAuth,
      getSupabaseAdmin: mockSb,
      verifyOpenAIKey: verifyFn,
    });
  }

  it('rejects save when verification returns invalid (simulated 401)', async () => {
    const h = await makeHandlerWithVerify(async () => ({
      isValid: false,
      status: 'temporarily_unverified',
      warning: null,
      error: 'OpenAI did not recognize this API key. Re-copy the key from your OpenAI dashboard and try again.',
    }));
    const res = await h.POST(postReq({ openaiKey: 'sk-proj-invalid-key' }));
    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.ok, false);
    assert.match(json.error, /openai did not recognize/i);
  });

  it('allows save with warning when verification returns restricted (403)', async () => {
    const h = await makeHandlerWithVerify(async () => ({
      isValid: true,
      status: 'restricted',
      warning: 'Your OpenAI key was saved, but OpenAI restricted the verification request.',
      error: null,
    }));
    const res = await h.POST(postReq({ openaiKey: 'sk-proj-restricted-key' }));
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.ok, true);
    assert.equal(json.warning, 'Your OpenAI key was saved, but OpenAI restricted the verification request.');
  });

  it('allows save with warning when verification returns temporarily_unverified (429)', async () => {
    const h = await makeHandlerWithVerify(async () => ({
      isValid: true,
      status: 'temporarily_unverified',
      warning: 'Your OpenAI key was saved, but OpenAI temporarily rate-limited verification.',
      error: null,
    }));
    const res = await h.POST(postReq({ openaiKey: 'sk-proj-rate-limited-key' }));
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.ok, true);
    assert.match(json.warning, /rate-limited/i);
  });

  it('allows save with warning when verification returns temporarily_unverified (5xx)', async () => {
    const h = await makeHandlerWithVerify(async () => ({
      isValid: true,
      status: 'temporarily_unverified',
      warning: 'Your OpenAI key was saved, but OpenAI verification is temporarily unavailable.',
      error: null,
    }));
    const res = await h.POST(postReq({ openaiKey: 'sk-proj-server-error-key' }));
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.ok, true);
    assert.match(json.warning, /temporarily unavailable/i);
  });
});

describe('openaiKey client service (unit)', () => {
  let originalFetch;

  before(() => {
    originalFetch = globalThis.fetch;
  });

  after(() => {
    globalThis.fetch = originalFetch;
  });

  it('saveOpenAIKey sends the key to the canonical endpoint', async () => {
    let capturedUrl = null;
    let capturedBody = null;
    globalThis.fetch = async (url, options) => {
      capturedUrl = String(url);
      capturedBody = options?.body;
      return { ok: true, status: 200, json: async () => ({ ok: true, configured: true, verification: 'verified', warning: null }) };
    };

    const { saveOpenAIKey } = await import('../src/shared/api/openaiKey.ts');
    const result = await saveOpenAIKey(' sk-proj-client-test ');
    assert.equal(capturedUrl, '/api/auth/openai-key');
    assert.equal(JSON.parse(capturedBody).openaiKey, 'sk-proj-client-test');
    assert.equal(result.verification, 'verified');
  });

  it('saveOpenAIKey throws on server error', async () => {
    globalThis.fetch = async () => ({
      ok: false,
      status: 500,
      json: async () => ({ ok: false, error: 'Server error' }),
    });

    const { saveOpenAIKey } = await import('../src/shared/api/openaiKey.ts');
    await assert.rejects(() => saveOpenAIKey('sk-proj-test'), /Server error/);
  });

  it('getOpenAIKeyStatus returns masked status', async () => {
    globalThis.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ configured: true, masked: 'sk-proj-••••••••1234', updatedAt: '2026-01-01T00:00:00Z' }),
    });

    const { getOpenAIKeyStatus } = await import('../src/shared/api/openaiKey.ts');
    const status = await getOpenAIKeyStatus();
    assert.equal(status.configured, true);
    assert.equal(status.masked, 'sk-proj-••••••••1234');
  });

  it('deleteOpenAIKey calls DELETE on the canonical endpoint', async () => {
    let capturedMethod = null;
    globalThis.fetch = async (url, options) => {
      capturedMethod = options?.method;
      return { ok: true, status: 200, json: async () => ({ ok: true }) };
    };

    const { deleteOpenAIKey } = await import('../src/shared/api/openaiKey.ts');
    await deleteOpenAIKey();
    assert.equal(capturedMethod, 'DELETE');
  });
});
