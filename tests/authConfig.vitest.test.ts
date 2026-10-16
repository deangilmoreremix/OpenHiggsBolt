/**
 * Tests for the centralized auth config module.
 *
 * Verifies:
 * 1. Keys resolve from localStorage via the centralized getters.
 * 2. Setters persist to localStorage ONLY — never to a non-HttpOnly cookie
 *    (CWE-522). A `document.cookie` write tripwire is installed for every test
 *    and must stay empty.
 * 3. Keys are cleaned (invisible Unicode stripped, whitespace trimmed) on set.
 * 4. Clear functions remove keys from localStorage.
 * 5. Listener notifications fire when keys change (React consumers rely on
 *    this) — exercised through the real `useAuthConfig` hook.
 * 6. Module-load initialization reads pre-existing localStorage keys.
 *
 * Converted from tests/authConfig.test.ts (node:test) to vitest so it runs in
 * CI. The old "Setters sync to both localStorage and cookies" assertions are
 * gone by design: persisting a live billing key to a readable cookie turns a
 * transient XSS into durable exfiltration.
 */

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { render, act } from '@testing-library/react'

const MUAPI_KEY_STORAGE = 'muapi_key'
const OPENAI_KEY_STORAGE = 'openai_key'

// Every value written to `document.cookie` while the tripwire is installed.
let cookieWrites: string[] = []
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

/** Fresh module state (and an empty cookie tripwire) for each test. */
async function loadAuthConfig() {
  installCookieTripwire()
  vi.resetModules()
  const mod = await import('../src/lib/authConfig')
  mod.__resetAuthConfigForTests()
  return mod
}

function expectNoCookieWrite() {
  expect(cookieWrites, `no cookie may be written, saw: ${cookieWrites.join(' | ')}`).toEqual([])
  expect(document.cookie).toBe('')
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  removeCookieTripwire()
  window.localStorage.clear()
})

describe('authConfig getters', () => {
  it('getApiKey / getOpenAiKey return empty strings when nothing is stored', async () => {
    const auth = await loadAuthConfig()
    expect(auth.getApiKey()).toBe('')
    expect(auth.getOpenAiKey()).toBe('')
    expectNoCookieWrite()
  })

  it('getApiKey / getOpenAiKey read from localStorage via the centralized resolver', async () => {
    window.localStorage.setItem(MUAPI_KEY_STORAGE, 'muapi-stored-key')
    window.localStorage.setItem(OPENAI_KEY_STORAGE, 'sk-stored-key')
    const auth = await loadAuthConfig()

    expect(auth.getApiKey()).toBe('muapi-stored-key')
    expect(auth.getOpenAiKey()).toBe('sk-stored-key')
  })
})

describe('authConfig setters persist to localStorage only', () => {
  it('setApiKey syncs to localStorage and NEVER to a cookie', async () => {
    const auth = await loadAuthConfig()

    auth.setApiKey('muapi-new-key')

    expect(window.localStorage.getItem(MUAPI_KEY_STORAGE)).toBe('muapi-new-key')
    expectNoCookieWrite()
  })

  it('setOpenAiKey syncs to localStorage and NEVER to a cookie', async () => {
    const auth = await loadAuthConfig()

    auth.setOpenAiKey('sk-new-key')

    expect(window.localStorage.getItem(OPENAI_KEY_STORAGE)).toBe('sk-new-key')
    expectNoCookieWrite()
  })

  it('setApiKey cleans invisible Unicode and trims whitespace', async () => {
    const auth = await loadAuthConfig()
    const dirty = '\u200Bmuapi\u200Ckey\u200D\uFEFF\u2060\u00AD'

    auth.setApiKey(`  ${dirty}  `)

    expect(window.localStorage.getItem(MUAPI_KEY_STORAGE)).toBe('muapikey')
    expectNoCookieWrite()
  })

  it('setApiKey with null/empty removes the localStorage key and writes no cookie', async () => {
    const auth = await loadAuthConfig()
    window.localStorage.setItem(MUAPI_KEY_STORAGE, 'muapi-to-clear')

    auth.setApiKey(null)

    expect(window.localStorage.getItem(MUAPI_KEY_STORAGE)).toBeNull()
    expect(auth.getApiKey()).toBe('')
    expectNoCookieWrite()
  })

  it('module-load initialization reads pre-existing localStorage keys, no cookie', async () => {
    window.localStorage.setItem(MUAPI_KEY_STORAGE, 'muapi-preloaded')
    window.localStorage.setItem(OPENAI_KEY_STORAGE, 'sk-preloaded')
    const auth = await loadAuthConfig()

    expect(auth.getApiKey()).toBe('muapi-preloaded')
    expect(auth.getOpenAiKey()).toBe('sk-preloaded')
    expectNoCookieWrite()
  })
})

describe('authConfig clear functions', () => {
  it('clearApiKey and clearOpenAiKey remove both keys from localStorage', async () => {
    const auth = await loadAuthConfig()
    auth.setApiKey('muapi')
    auth.setOpenAiKey('sk')

    auth.clearApiKey()
    expect(window.localStorage.getItem(MUAPI_KEY_STORAGE)).toBeNull()
    expect(auth.getApiKey()).toBe('')
    expect(window.localStorage.getItem(OPENAI_KEY_STORAGE)).toBe('sk')

    auth.clearOpenAiKey()
    expect(window.localStorage.getItem(OPENAI_KEY_STORAGE)).toBeNull()
    expect(auth.getOpenAiKey()).toBe('')

    expectNoCookieWrite()
  })

  it('clearAllKeys removes both MuAPI and OpenAI keys from localStorage', async () => {
    const auth = await loadAuthConfig()
    auth.setApiKey('muapi')
    auth.setOpenAiKey('sk')

    auth.clearAllKeys()

    expect(window.localStorage.getItem(MUAPI_KEY_STORAGE)).toBeNull()
    expect(window.localStorage.getItem(OPENAI_KEY_STORAGE)).toBeNull()
    expect(auth.getApiKey()).toBe('')
    expect(auth.getOpenAiKey()).toBe('')
    expectNoCookieWrite()
  })

  it('clearAllKeys leaves no key material behind in document.cookie', async () => {
    const auth = await loadAuthConfig()
    auth.setApiKey('muapi-secret')
    auth.setOpenAiKey('sk-secret')

    auth.clearAllKeys()

    expectNoCookieWrite()
    expect(document.cookie).not.toContain('muapi')
    expect(document.cookie).not.toContain('sk-')
  })
})

describe('authConfig setter consumers', () => {
  it('setApiKey / setOpenAiKey update the in-memory getters', async () => {
    const auth = await loadAuthConfig()

    auth.setApiKey('muapi-live')
    auth.setOpenAiKey('sk-live')

    expect(auth.getApiKey()).toBe('muapi-live')
    expect(auth.getOpenAiKey()).toBe('sk-live')
  })

  it('clearApiKey / clearOpenAiKey reset the in-memory getters', async () => {
    const auth = await loadAuthConfig()
    auth.setApiKey('muapi-temp')
    auth.setOpenAiKey('sk-temp')

    auth.clearApiKey()
    expect(auth.getApiKey()).toBe('')

    auth.clearOpenAiKey()
    expect(auth.getOpenAiKey()).toBe('')
  })

  it('clearAllKeys resets both getters at once', async () => {
    const auth = await loadAuthConfig()
    auth.setApiKey('muapi-temp')
    auth.setOpenAiKey('sk-temp')

    auth.clearAllKeys()

    expect(auth.getApiKey()).toBe('')
    expect(auth.getOpenAiKey()).toBe('')
  })
})

describe('authConfig listener notifications', () => {
  it('notifies React consumers (useAuthConfig) when a key changes', async () => {
    const auth = await loadAuthConfig()

    const renders: Array<{ apiKey: string; openaiKey: string; hasApiKey: boolean }> = []
    function Probe() {
      const cfg = auth.useAuthConfig()
      renders.push({
        apiKey: cfg.apiKey,
        openaiKey: cfg.openaiKey,
        hasApiKey: Boolean(cfg.hasApiKey),
      })
      return null
    }

    let view: ReturnType<typeof render>
    await act(async () => {
      view = render(React.createElement(Probe))
    })

    expect(renders.at(-1)).toMatchObject({ apiKey: '', openaiKey: '' })

    await act(async () => {
      auth.setApiKey('muapi-listener-test')
    })
    expect(renders.at(-1)?.apiKey).toBe('muapi-listener-test')
    expect(renders.at(-1)?.hasApiKey).toBe(true)

    await act(async () => {
      auth.setOpenAiKey('sk-listener-test')
    })
    expect(renders.at(-1)?.openaiKey).toBe('sk-listener-test')

    await act(async () => {
      auth.clearAllKeys()
    })
    expect(renders.at(-1)).toMatchObject({ apiKey: '', openaiKey: '' })

    await act(async () => {
      view!.unmount()
    })
    expectNoCookieWrite()
  })

  it('a removed listener is not notified afterwards', async () => {
    const auth = await loadAuthConfig()

    function Probe() {
      auth.useAuthConfig()
      return null
    }

    let view: ReturnType<typeof render>
    await act(async () => {
      view = render(React.createElement(Probe))
    })

    await act(async () => {
      view!.unmount()
    })

    await act(async () => {
      auth.setApiKey('after-unmount')
    })

    expect(auth.getApiKey()).toBe('after-unmount')
    expectNoCookieWrite()
  })
})

describe('authConfig exposes no cookie persistence channel', () => {
  it('exports no cookie helper and no cookie name', async () => {
    const auth = await loadAuthConfig()

    const exported = Object.keys(auth)
    expect(exported).not.toContain('buildCookie')
    expect(exported).not.toContain('setCookie')
    expect(exported).not.toContain('getCookie')
    expect(exported).not.toContain('MUAPI_KEY_COOKIE')
    expect(exported).not.toContain('OPENAI_KEY_COOKIE')
  })
})
