/**
 * Tests for the API-key resolution logic that backs the Settings popup.
 *
 * BYOK (CWE-798/522 hardening) note: these verify the root-cause fixes
 *   1. OpenAI key is read from localStorage (not just a build-time env var),
 *      so a key entered in the Settings popup actually reaches OpenAI calls.
 *   2. The MuAPI key resolves from localStorage / explicit arg ONLY. There is
 *      deliberately NO server-side env fallback: a server key would bill the
 *      operator instead of the requesting user, so with nothing configured the
 *      resolver returns '' and the UI prompts the user to add it in Settings.
 *   3. Save format validation rejects empty / quoted / too-short keys without
 *      truncating valid keys (the old Latin1-strip bug).
 *
 * Converted from tests/api-keys.test.js (node:test) to vitest so it runs in CI.
 */

// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  resolveMuapiKey,
  resolveOpenAIKey,
  isValidKeyFormat,
  MUAPI_KEY_STORAGE,
  OPENAI_KEY_STORAGE,
} from '../src/lib/keys.js'

declare global {
  interface Window {
    __MUAPI_KEY__?: string
  }
}

const USER_MUAPI_KEY = 'muapi-user-key-123'
const USER_OPENAI_KEY = 'sk-user-openai-456'

// Sentinels for the forbidden server-side key env vars. Any resolution path
// that returns one of these is a BYOK violation.
const ENV_MUAPI_SENTINEL = 'sk-SENTINEL-server-muapi-key-DO-NOT-USE'
const ENV_OPENAI_SENTINEL = 'sk-SENTINEL-server-openai-key-DO-NOT-USE'

beforeEach(() => {
  window.localStorage.clear()
  delete process.env.MUAPI_API_KEY
  delete process.env.MUAPI_KEY
  delete process.env.OPENAI_API_KEY
  delete process.env.NEXT_PUBLIC_OPENAI_API_KEY
  delete window.__MUAPI_KEY__
})

afterEach(() => {
  delete process.env.MUAPI_API_KEY
  delete process.env.MUAPI_KEY
  delete process.env.OPENAI_API_KEY
  delete process.env.NEXT_PUBLIC_OPENAI_API_KEY
  delete window.__MUAPI_KEY__
})

describe('resolveMuapiKey', () => {
  it('explicit arg wins over storage', () => {
    window.localStorage.setItem(MUAPI_KEY_STORAGE, 'stored-muapi')
    expect(resolveMuapiKey('explicit-muapi')).toBe('explicit-muapi')
  })

  it('falls back to localStorage when no explicit arg', () => {
    window.localStorage.setItem(MUAPI_KEY_STORAGE, 'stored-muapi')
    expect(resolveMuapiKey()).toBe('stored-muapi')
  })

  it('window.__MUAPI_KEY__ beats localStorage', () => {
    window.localStorage.setItem(MUAPI_KEY_STORAGE, 'stored-muapi')
    window.__MUAPI_KEY__ = 'global-muapi'
    expect(resolveMuapiKey()).toBe('global-muapi')
  })

  it('NEVER falls back to a server-side env key', () => {
    process.env.MUAPI_API_KEY = ENV_MUAPI_SENTINEL
    process.env.MUAPI_KEY = ENV_MUAPI_SENTINEL

    expect(resolveMuapiKey()).toBe('')
    expect(resolveMuapiKey()).not.toBe(ENV_MUAPI_SENTINEL)
    expect(resolveMuapiKey(undefined)).toBe('')
    expect(resolveMuapiKey('   ')).toBe('')
  })

  it('the user key still wins while the server env key is present', () => {
    process.env.MUAPI_API_KEY = ENV_MUAPI_SENTINEL
    window.localStorage.setItem(MUAPI_KEY_STORAGE, USER_MUAPI_KEY)
    expect(resolveMuapiKey()).toBe(USER_MUAPI_KEY)
  })

  it('trims whitespace but does NOT strip valid non-Latin1 bytes', () => {
    const key = '  múa-pi-këy-123  '
    window.localStorage.setItem(MUAPI_KEY_STORAGE, key)
    expect(resolveMuapiKey()).toBe('múa-pi-këy-123')
  })
})

describe('resolveOpenAIKey', () => {
  it('reads from localStorage (the popup entry point)', () => {
    window.localStorage.setItem(OPENAI_KEY_STORAGE, USER_OPENAI_KEY)
    expect(resolveOpenAIKey()).toBe(USER_OPENAI_KEY)
  })

  it('explicit arg wins over storage', () => {
    window.localStorage.setItem(OPENAI_KEY_STORAGE, 'sk-stored')
    expect(resolveOpenAIKey('sk-explicit')).toBe('sk-explicit')
  })

  it('only ever uses the PUBLIC build-time var, never the server secret', () => {
    // NEXT_PUBLIC_* is baked into the user's own client bundle by their own
    // build — it is user-supplied by definition and is not a server secret.
    process.env.NEXT_PUBLIC_OPENAI_API_KEY = 'sk-public-user-supplied'
    expect(resolveOpenAIKey()).toBe('sk-public-user-supplied')

    // The server secret must never reach the client resolver.
    delete process.env.NEXT_PUBLIC_OPENAI_API_KEY
    process.env.OPENAI_API_KEY = ENV_OPENAI_SENTINEL
    expect(resolveOpenAIKey()).toBe('')
    expect(resolveOpenAIKey()).not.toBe(ENV_OPENAI_SENTINEL)
  })

  it('localStorage beats the public env var', () => {
    process.env.NEXT_PUBLIC_OPENAI_API_KEY = 'sk-public-user-supplied'
    window.localStorage.setItem(OPENAI_KEY_STORAGE, USER_OPENAI_KEY)
    expect(resolveOpenAIKey()).toBe(USER_OPENAI_KEY)
  })

  it('empty when nothing configured (previously this was the silent failure)', () => {
    expect(resolveOpenAIKey()).toBe('')
  })
})

describe('isValidKeyFormat', () => {
  it('rejects empty / short / quoted keys', () => {
    expect(isValidKeyFormat('')).toBe(false)
    expect(isValidKeyFormat('   ')).toBe(false)
    expect(isValidKeyFormat('abc')).toBe(false)
    expect(isValidKeyFormat('"sk-quoted"')).toBe(false)
    expect(isValidKeyFormat("'sk-quoted'")).toBe(false)
  })

  it('accepts normal keys', () => {
    expect(isValidKeyFormat('muapi-real-key-123')).toBe(true)
    expect(isValidKeyFormat('sk-proj-abc123')).toBe(true)
    expect(isValidKeyFormat('  sk-padded  ')).toBe(true) // trimmed internally by callers
  })
})
