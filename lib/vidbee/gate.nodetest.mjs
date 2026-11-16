import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { isAllowed, isPublicAsset, handleVidBee } from './gate.mjs';

describe('allowlist', () => {
  it('denies everyone outside development when unset', () => {
    assert.equal(isAllowed({ id: 'u1' }, { NODE_ENV: 'production' }), false);
    assert.equal(isAllowed({ id: 'u1' }, { NODE_ENV: 'development' }), true);
  });
  it('matches id or email case-insensitively', () => {
    const env = { NODE_ENV: 'production', VIDBEE_ALLOWED_USERS: 'user_1, Admin@X.com' };
    assert.equal(isAllowed({ id: 'USER_1' }, env), true);
    assert.equal(isAllowed({ id: 'z', emails: ['admin@x.com'] }, env), true);
    assert.equal(isAllowed({ id: 'o', emails: ['o@x.com'] }, env), false);
  });
});

describe('public assets', () => {
  it('only exposes built static files', () => {
    assert.equal(isPublicAsset('GET', '/vidbee/assets/index-abc.js'), true);
    assert.equal(isPublicAsset('GET', '/vidbee/app-icon.png'), true);
    assert.equal(isPublicAsset('POST', '/vidbee/assets/x.js'), false);
    assert.equal(isPublicAsset('GET', '/vidbee/rpc/downloads/list'), false);
    assert.equal(isPublicAsset('GET', '/vidbee/assets/../files'), false);
    assert.equal(isPublicAsset('GET', '/vidbee/files'), false);
  });
});

describe('proxy', () => {
  let srv, target; const seen = [];
  before(async () => {
    srv = http.createServer((q, r) => { let b = ''; q.on('data', (d) => (b += d)); q.on('end', () => { seen.push({ url: q.url, cookie: q.headers.cookie, auth: q.headers.authorization, body: b }); r.setHeader('content-type', 'application/json'); r.end(JSON.stringify({ ok: true })); }); }).listen(0);
    await new Promise((r) => srv.once('listening', r)); target = `http://127.0.0.1:${srv.address().port}`;
  });
  after(() => srv.close());
  const req = (path, init = {}) => new Request(`http://app.test${path}`, init);

  it('rejects anonymous and non-allowlisted users, without touching upstream', async () => {
    const n = seen.length;
    assert.equal((await handleVidBee(req('/vidbee/rpc/x', { method: 'POST', body: '{}' }), { target })).status, 401);
    process.env.NODE_ENV = 'production'; process.env.VIDBEE_ALLOWED_USERS = 'boss';
    assert.equal((await handleVidBee(req('/vidbee/files?path=/etc/passwd'), { user: { id: 'someone' }, target })).status, 403);
    assert.equal(seen.length, n);
  });
  it('forwards allowed requests, bodies and query, but strips credentials', async () => {
    process.env.VIDBEE_ALLOWED_USERS = 'boss';
    const res = await handleVidBee(req('/vidbee/rpc/downloads/list?a=1', { method: 'POST', body: '{"x":1}', headers: { cookie: '__session=secret', authorization: 'Bearer t', 'content-type': 'application/json' } }), { user: { id: 'boss' }, target });
    assert.equal(res.status, 200);
    const s = seen.at(-1);
    assert.equal(s.url, '/vidbee/rpc/downloads/list?a=1'); assert.equal(s.body, '{"x":1}'); assert.equal(s.cookie, undefined); assert.equal(s.auth, undefined);
  });
  it('serves the root without upstream\'s trailing-slash redirect (Next.js strips slashes)', async () => {
    process.env.VIDBEE_ALLOWED_USERS = 'boss';
    await handleVidBee(req('/vidbee'), { user: { id: 'boss' }, target });
    assert.equal(seen.at(-1).url, '/vidbee/');
  });
  it('serves public assets without login and reports a down service as 502', async () => {
    assert.equal((await handleVidBee(req('/vidbee/assets/a.js'), { target })).status, 200);
    assert.equal((await handleVidBee(req('/vidbee/assets/a.js'), { target: 'http://127.0.0.1:1' })).status, 502);
  });
});
