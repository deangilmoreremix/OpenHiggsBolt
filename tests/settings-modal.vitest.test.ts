/**
 * DOM-level test for the Settings popup (src/components/SettingsModal.js).
 *
 * Verifies the user-facing behavior after BYOK + CWE-522 hardening:
 *
 *   - Saving persists the MuAPI key and the OpenAI key to the USER'S OWN key
 *     store (POST /api/auth/muapi-key + POST /api/auth/openai-key) and then to
 *     localStorage.
 *   - Keys are NEVER written to a cookie (`document.cookie` write tripwire).
 *     A non-HttpOnly cookie is readable by any script on the page, so a single
 *     XSS would exfiltrate a live billing key.
 *   - Empty / invalid input is validated, and only the keys actually provided
 *     are persisted (an empty field clears that key).
 *   - Keys persist across close/reopen: the reopened popup is seeded from the
 *     user's own key store, and a Cancel never wipes saved keys.
 *
 * Converted from tests/settings-modal.test.js (node:test) to vitest so it runs
 * in CI. The old assertion "saving sets the muapi_key cookie" is the removed
 * insecure behavior: server-side /api/* routes now resolve the key from the
 * Clerk-scoped encrypted store (or the request's x-api-key header), never from
 * a client-readable cookie.
 */

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SettingsModal } from '../src/components/SettingsModal.js'

const MUAPI_KEY_STORAGE = 'muapi_key'
const OPENAI_KEY_STORAGE = 'openai_key'

// ── Fake "user's own key store" behind the two POST endpoints ────────────────
type KeyStore = { muapiKey: string; openaiKey: string }
type PostedRequest = { url: string; body: Record<string, unknown> }

let keyStore: KeyStore
let posted: PostedRequest[]
let cookieWrites: string[]
let originalCookieDescriptor: PropertyDescriptor | undefined

function installCookieTripwire() {
  cookieWrites = []
  originalCookieDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie')
  Object.defineProperty(Document.prototype, 'cookie', {
    configurable: true,
    get(): string {
      return ''
    },
    set(value: string) {
      cookieWrites.push(String(value))
    },
  })
}

function removeCookieTripwire() {
  if (originalCookieDescriptor) {
    Object.defineProperty(Document.prototype, 'cookie', originalCookieDescriptor)
  }
}

function installFakeKeyStore() {
  keyStore = { muapiKey: '', openaiKey: '' }
  posted = []

  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (init?.method === 'POST') {
        const body = JSON.parse(String(init.body ?? '{}')) as Record<string, unknown>
        posted.push({ url, body })
        if (url.includes('/api/auth/muapi-key')) {
          if (!body.key) {
            return {
              ok: false,
              status: 400,
              json: async () => ({ ok: false, error: 'MuAPI key is required' }),
            }
          }
          keyStore.muapiKey = String(body.key)
        }
        if (url.includes('/api/auth/openai-key')) {
          keyStore.openaiKey = String(body.openaiKey ?? '')
        }
        return { ok: true, status: 200, json: async () => ({ ok: true }) }
      }

      // GET: the server-side store is what seeds the popup inputs.
      return {
        ok: true,
        status: 200,
        json: async () => ({ key: keyStore.muapiKey, openaiKey: keyStore.openaiKey }),
      }
    }),
  )
}

function postedUrls() {
  return posted.map((p) => p.url)
}

function expectNoCookieWrite() {
  expect(cookieWrites, `no cookie may be written, saw: ${cookieWrites.join(' | ')}`).toEqual([])
  expect(document.cookie).toBe('')
}

/** Open the popup and wait for the async key-store seeding to settle. */
async function openModal() {
  vi.resetModules()
  const overlay = SettingsModal()
  document.body.appendChild(overlay)
  for (let i = 0; i < 10; i++) {
    await Promise.resolve()
  }
  return overlay
}

function input(id: string): HTMLInputElement {
  const el = document.body.querySelector<HTMLInputElement>(id)
  if (!el) throw new Error(`#${id} not found in the Settings popup`)
  return el
}

async function save() {
  await (input('#settings-save-btn').onclick as unknown as () => Promise<void>)()
}

beforeEach(() => {
  // The popup closes itself 600ms after a successful save; fake timers keep
  // that pending timeout from firing after the jsdom environment is torn down.
  vi.useFakeTimers()
  installCookieTripwire()
  installFakeKeyStore()
  window.localStorage.clear()
  document.body.innerHTML = ''
})

afterEach(() => {
  // Flush the auto-close timeout while jsdom is still alive, then go back to
  // real timers so nothing leaks into the next test file.
  vi.runOnlyPendingTimers()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  removeCookieTripwire()
  window.localStorage.clear()
  document.body.innerHTML = ''
})

describe('SettingsModal save', () => {
  it('persists both keys to the user key store and localStorage — and never to a cookie', async () => {
    await openModal()

    input('#settings-api-key').value = 'muapi-user-key-123'
    input('#settings-openai-key').value = 'sk-user-openai-456'
    await save()

    // Persisted to the user's OWN store (server-side, Clerk-scoped).
    expect(postedUrls()).toEqual([
      '/api/auth/muapi-key',
      '/api/auth/openai-key',
    ])
    expect(posted[0].body).toEqual({ key: 'muapi-user-key-123' })
    expect(posted[1].body).toEqual({ openaiKey: 'sk-user-openai-456' })
    expect(keyStore.muapiKey).toBe('muapi-user-key-123')
    expect(keyStore.openaiKey).toBe('sk-user-openai-456')

    // ... and mirrored to localStorage for the browser callers.
    expect(window.localStorage.getItem(MUAPI_KEY_STORAGE)).toBe('muapi-user-key-123')
    expect(window.localStorage.getItem(OPENAI_KEY_STORAGE)).toBe('sk-user-openai-456')

    // SECURITY: no key ever reaches a non-HttpOnly cookie.
    expectNoCookieWrite()
  })

  it('shows a success status when the save succeeds', async () => {
    await openModal()
    input('#settings-api-key').value = 'muapi-user-key-123'

    await save()

    expect(input('#settings-status').textContent).toContain('Keys saved')
    expectNoCookieWrite()
  })

  it('clears the OpenAI key when the field is left empty', async () => {
    keyStore.openaiKey = 'sk-old-openai'
    window.localStorage.setItem(OPENAI_KEY_STORAGE, 'sk-old-openai')

    await openModal()
    input('#settings-api-key').value = 'muapi-user-key-789'
    input('#settings-openai-key').value = ''
    await save()

    // MuAPI saved; OpenAI left empty => the stored OpenAI key is removed.
    expect(window.localStorage.getItem(MUAPI_KEY_STORAGE)).toBe('muapi-user-key-789')
    expect(window.localStorage.getItem(OPENAI_KEY_STORAGE)).toBeNull()
    expect(postedUrls()).not.toContain('/api/auth/openai-key')
    expectNoCookieWrite()
  })

  it('persists no MuAPI key when the MuAPI field is left empty', async () => {
    await openModal()
    input('#settings-api-key').value = ''
    input('#settings-openai-key').value = 'sk-user-openai-456'
    await save()

    expect(postedUrls()).not.toContain('/api/auth/muapi-key')
    expect(window.localStorage.getItem(MUAPI_KEY_STORAGE)).toBeNull()
    expect(window.localStorage.getItem(OPENAI_KEY_STORAGE)).toBe('sk-user-openai-456')
    expectNoCookieWrite()
  })

  it('rejects an invalid key format with a status message and saves nothing', async () => {
    await openModal()
    input('#settings-api-key').value = 'short'
    input('#settings-openai-key').value = 'sk-openai'

    await save()

    const status = input('#settings-status')
    expect(status.textContent).toMatch(/valid MuAPI key/i)
    expect(posted).toEqual([])
    expect(window.localStorage.getItem(MUAPI_KEY_STORAGE)).toBeNull()
    expect(window.localStorage.getItem(OPENAI_KEY_STORAGE)).toBeNull()
    expectNoCookieWrite()
  })

  it('surfaces a server rejection and does not persist the key locally', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (resource: RequestInfo | URL, init?: RequestInit) => {
        if (init?.method === 'POST') {
          return {
            ok: false,
            status: 500,
            json: async () => ({ ok: false, error: 'Failed to save MuAPI key' }),
          }
        }
        return { ok: true, status: 200, json: async () => ({ key: '', openaiKey: '' }) }
      }),
    )

    await openModal()
    input('#settings-api-key').value = 'muapi-user-key-123'
    await save()

    expect(input('#settings-status').textContent).toContain('Failed to save MuAPI key')
    expect(window.localStorage.getItem(MUAPI_KEY_STORAGE)).toBeNull()
    expectNoCookieWrite()
  })
})

describe('SettingsModal persistence across reopen', () => {
  it('a reopened popup is seeded from the user key store, not from a cookie', async () => {
    await openModal()
    input('#settings-api-key').value = 'muapi-persist-1'
    input('#settings-openai-key').value = 'sk-persist-1'
    await save()

    document.body.innerHTML = ''
    await openModal()

    expect(input('#settings-api-key').value).toBe('muapi-persist-1')
    expect(input('#settings-openai-key').value).toBe('sk-persist-1')
    // The underlying stores still hold them.
    expect(keyStore.muapiKey).toBe('muapi-persist-1')
    expect(window.localStorage.getItem(MUAPI_KEY_STORAGE)).toBe('muapi-persist-1')
    expect(window.localStorage.getItem(OPENAI_KEY_STORAGE)).toBe('sk-persist-1')
    expectNoCookieWrite()
  })

  it('a Cancel does NOT wipe previously saved keys', async () => {
    await openModal()
    input('#settings-api-key').value = 'muapi-keep'
    input('#settings-openai-key').value = 'sk-openai-keep'
    await save()
    posted = []

    document.body.innerHTML = ''
    await openModal()

    // User opens, changes the fields, but hits Cancel instead of Save.
    input('#settings-api-key').value = 'muapi-different'
    input('#settings-openai-key').value = 'sk-openai-different'
    await (input('#settings-cancel-btn').onclick as unknown as () => Promise<void>)()

    expect(keyStore.muapiKey).toBe('muapi-keep')
    expect(keyStore.openaiKey).toBe('sk-openai-keep')
    expect(window.localStorage.getItem(MUAPI_KEY_STORAGE)).toBe('muapi-keep')
    expect(window.localStorage.getItem(OPENAI_KEY_STORAGE)).toBe('sk-openai-keep')
    // Nothing was sent, nothing was written to a cookie.
    expect(posted).toEqual([])
    expectNoCookieWrite()
  })

  it('with no keys stored, a reopened popup shows empty inputs and writes nothing', async () => {
    window.localStorage.clear()

    await openModal()

    expect(input('#settings-api-key').value).toBe('')
    expect(input('#settings-openai-key').value).toBe('')
    expect(posted).toEqual([])
    expect(window.localStorage.getItem(MUAPI_KEY_STORAGE)).toBeNull()
    expect(window.localStorage.getItem(OPENAI_KEY_STORAGE)).toBeNull()
    expectNoCookieWrite()
  })
})
