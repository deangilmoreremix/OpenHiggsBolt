import { describe, it, expect } from 'vitest'

describe('browser executable resolver regression', () => {
  it('resolves @sparticuz/chromium package and executablePath contract', async () => {
    const mod = await import('@sparticuz/chromium')
    const Chromium = mod.default ?? mod
    expect(typeof Chromium.executablePath).toBe('function')
  })

  it('does not depend on @sparticuz/chromium-min package', async () => {
    // @ts-ignore intentionally importing the absent package to prove the resolver no longer depends on it
    await expect(import('@sparticuz/chromium-min')).rejects.toThrow()
  })
})
