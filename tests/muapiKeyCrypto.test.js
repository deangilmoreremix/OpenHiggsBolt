import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { encryptMuapiKey, decryptMuapiKey } from '../src/lib/muapiKeyCrypto.ts';

describe('muapiKeyCrypto', () => {
  const SAMPLE = 'sk_live_9f8a7b6c5d4e3f2a1b0c';

  before(() => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-secret';
    delete process.env.MUAPI_KEY_SECRET;
  });
  after(() => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  it('round-trips an arbitrary key back to the original plaintext', () => {
    const enc = encryptMuapiKey(SAMPLE);
    assert.notEqual(enc, SAMPLE);
    assert.equal(decryptMuapiKey(enc), SAMPLE);
  });

  it('produces a different ciphertext each time (random IV)', () => {
    const a = encryptMuapiKey(SAMPLE);
    const b = encryptMuapiKey(SAMPLE);
    assert.notEqual(a, b);
    assert.equal(decryptMuapiKey(a), SAMPLE);
    assert.equal(decryptMuapiKey(b), SAMPLE);
  });

  it('stores ciphertext in the v1:<iv>:<tag>:<data> format', () => {
    const enc = encryptMuapiKey(SAMPLE);
    const parts = enc.split(':');
    assert.equal(parts[0], 'v1');
    assert.equal(parts.length, 4);
    // IV and tag are non-empty base64
    assert.ok(parts[1].length > 0);
    assert.ok(parts[2].length > 0);
  });

  it('returns null for empty / null / undefined input', () => {
    assert.equal(decryptMuapiKey(''), null);
    assert.equal(decryptMuapiKey(null), null);
    assert.equal(decryptMuapiKey(undefined), null);
  });

  it('passes through legacy (non-prefixed) plaintext values unchanged', () => {
    // A row written before encryption must still be readable.
    assert.equal(decryptMuapiKey('sk_live_plaintext_legacy'), 'sk_live_plaintext_legacy');
  });

  it('returns null when ciphertext is tampered (auth tag fails)', () => {
    const enc = encryptMuapiKey(SAMPLE);
    const [prefix, iv, tag, data] = enc.split(':');
    // Corrupt the actual ciphertext bytes (not just the base64 text) so the
    // GCM authentication tag fails on decrypt.
    const buf = Buffer.from(data, 'base64');
    buf[buf.length - 1] ^= 0xff;
    const tampered = `${prefix}:${iv}:${tag}:${buf.toString('base64')}`;
    assert.equal(decryptMuapiKey(tampered), null);
  });

  it('returns null when the format is malformed', () => {
    assert.equal(decryptMuapiKey('v1:only:two'), null);
    assert.equal(decryptMuapiKey('v1:::'), null);
  });

  it('uses a dedicated MUAPI_KEY_SECRET when provided', () => {
    process.env.MUAPI_KEY_SECRET = 'dedicated-secret';
    const enc = encryptMuapiKey(SAMPLE);
    assert.equal(decryptMuapiKey(enc), SAMPLE);
    // A different secret must NOT decrypt it.
    process.env.MUAPI_KEY_SECRET = 'other-secret';
    assert.equal(decryptMuapiKey(enc), null);
    process.env.MUAPI_KEY_SECRET = 'dedicated-secret';
  });

  it('throws a clear error when no encryption secret is configured', () => {
    delete process.env.MUAPI_KEY_SECRET;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    assert.throws(() => encryptMuapiKey(SAMPLE), /Missing encryption secret/);
  });
});
