/**
 * Tests for the API-key resolution logic that backs the Settings popup.
 *
 * These verify the root-cause fixes:
 *   1. OpenAI key is read from localStorage (not just a build-time env var),
 *      so a key entered in the Settings popup actually reaches OpenAI calls.
 *   2. The MuAPI key resolves from localStorage / explicit arg / env, and the
 *      server proxy cookie (`muapi_key`) is what the /api/* routes rely on.
 *   3. Save format validation rejects empty / quoted / too-short keys without
 *      truncating valid keys (the old Latin1-strip bug).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

// Minimal localStorage + window shim so the module's environment branches
// behave like a real browser during the test run.
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
globalThis.window = { localStorage: globalThis.localStorage };

const { resolveMuapiKey, resolveOpenAIKey, isValidKeyFormat, MUAPI_KEY_STORAGE, OPENAI_KEY_STORAGE } =
  await import('../src/lib/keys.js');

function clearStore() {
  store.clear();
  delete process.env.MUAPI_API_KEY;
  delete process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  delete window.__MUAPI_KEY__;
}

test('resolveMuapiKey: explicit arg wins over storage', () => {
  clearStore();
  store.set(MUAPI_KEY_STORAGE, 'stored-muapi');
  assert.equal(resolveMuapiKey('explicit-muapi'), 'explicit-muapi');
});

test('resolveMuapiKey: falls back to localStorage when no explicit arg', () => {
  clearStore();
  store.set(MUAPI_KEY_STORAGE, 'stored-muapi');
  assert.equal(resolveMuapiKey(), 'stored-muapi');
});

test('resolveMuapiKey: window.__MUAPI_KEY__ beats localStorage', () => {
  clearStore();
  store.set(MUAPI_KEY_STORAGE, 'stored-muapi');
  window.__MUAPI_KEY__ = 'global-muapi';
  assert.equal(resolveMuapiKey(), 'global-muapi');
});

test('resolveMuapiKey: env fallback when nothing else set', () => {
  clearStore();
  process.env.MUAPI_API_KEY = 'env-muapi';
  assert.equal(resolveMuapiKey(), 'env-muapi');
});

test('resolveMuapiKey: trims whitespace but does NOT strip valid non-Latin1 bytes', () => {
  clearStore();
  // A key with a trailing space and an unusual byte should keep the byte.
  const key = '  múa-pi-këy-123  ';
  store.set(MUAPI_KEY_STORAGE, key);
  assert.equal(resolveMuapiKey(), 'múa-pi-këy-123');
});

test('resolveOpenAIKey: reads from localStorage (the popup entry point)', () => {
  clearStore();
  store.set(OPENAI_KEY_STORAGE, 'sk-user-entered');
  assert.equal(resolveOpenAIKey(), 'sk-user-entered');
});

test('resolveOpenAIKey: explicit arg wins over storage', () => {
  clearStore();
  store.set(OPENAI_KEY_STORAGE, 'sk-stored');
  assert.equal(resolveOpenAIKey('sk-explicit'), 'sk-explicit');
});

test('resolveOpenAIKey: env fallback for SSR builds', () => {
  clearStore();
  process.env.NEXT_PUBLIC_OPENAI_API_KEY = 'sk-env';
  assert.equal(resolveOpenAIKey(), 'sk-env');
});

test('resolveOpenAIKey: empty when nothing configured (previously this was the silent failure)', () => {
  clearStore();
  assert.equal(resolveOpenAIKey(), '');
});

test('isValidKeyFormat: rejects empty / short / quoted keys', () => {
  assert.equal(isValidKeyFormat(''), false);
  assert.equal(isValidKeyFormat('   '), false);
  assert.equal(isValidKeyFormat('abc'), false);
  assert.equal(isValidKeyFormat('"sk-quoted"'), false);
  assert.equal(isValidKeyFormat("'sk-quoted'"), false);
});

test('isValidKeyFormat: accepts normal keys', () => {
  assert.equal(isValidKeyFormat('muapi-real-key-123'), true);
  assert.equal(isValidKeyFormat('sk-proj-abc123'), true);
  assert.equal(isValidKeyFormat('  sk-padded  '), true); // trimmed internally by callers
});
