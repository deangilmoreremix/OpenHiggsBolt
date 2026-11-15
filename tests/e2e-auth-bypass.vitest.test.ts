import { describe, it, expect } from 'vitest'
// @ts-expect-error plain JS module
import { isE2eAuthBypassAllowed, E2E_BYPASS_ROUTES } from '../lib/e2eAuthBypass.js'

const headers = (o: Record<string, string> = {}) => ({
  get: (n: string) => o[n.toLowerCase()] ?? null,
})
const ok = () => ({
  nodeEnv: 'development',
  flag: 'true',
  cookieValue: '1',
  hostname: 'localhost',
  pathname: '/personalization-demo',
  headers: headers({ host: 'localhost:3111' }),
})

describe('E2E auth bypass', () => {
  it('allows the fully-qualified local development request', () => {
    expect(isE2eAuthBypassAllowed(ok())).toBe(true)
    expect(isE2eAuthBypassAllowed({ ...ok(), hostname: '127.0.0.1', headers: headers({ host: '127.0.0.1:3111' }) })).toBe(true)
  })
  it.each(['production', 'test', undefined, ''])('is off when NODE_ENV=%s', (nodeEnv) => {
    expect(isE2eAuthBypassAllowed({ ...ok(), nodeEnv })).toBe(false)
  })
  it.each([undefined, '', 'false', '1', 'TRUE'])('is off when the flag is %s', (flag) => {
    expect(isE2eAuthBypassAllowed({ ...ok(), flag })).toBe(false)
  })
  it.each([undefined, '', '0', 'true', 'yes'])('is off when the cookie is %s', (cookieValue) => {
    expect(isE2eAuthBypassAllowed({ ...ok(), cookieValue })).toBe(false)
  })
  it.each(['example.com', 'go.smartvid.app', '192.0.2.2', 'localhost.evil.com'])('is off for non-local host %s', (hostname) => {
    expect(isE2eAuthBypassAllowed({ ...ok(), hostname, headers: headers({ host: hostname }) })).toBe(false)
  })
  it('is off when the Host header is not local even if the URL hostname is', () => {
    expect(isE2eAuthBypassAllowed({ ...ok(), headers: headers({ host: 'evil.com' }) })).toBe(false)
  })
  it.each(['forwarded', 'x-real-ip', 'x-original-host'])('is off when proxy-only header %s is present', (h) => {
    expect(isE2eAuthBypassAllowed({ ...ok(), headers: headers({ host: 'localhost:3111', [h]: 'localhost' }) })).toBe(false)
  })
  it.each(['8.8.8.8', '127.0.0.1, 8.8.8.8', '203.0.113.9'])('is off when x-forwarded-for is %s', (xff) => {
    expect(isE2eAuthBypassAllowed({ ...ok(), headers: headers({ host: 'localhost:3111', 'x-forwarded-for': xff }) })).toBe(false)
  })
  it.each(['evil.com', 'localhost, evil.com'])('is off when x-forwarded-host is %s', (xfh) => {
    expect(isE2eAuthBypassAllowed({ ...ok(), headers: headers({ host: 'localhost:3111', 'x-forwarded-host': xfh }) })).toBe(false)
  })
  it('tolerates the loopback x-forwarded-* values the Next dev server stamps itself', () => {
    expect(
      isE2eAuthBypassAllowed({
        ...ok(),
        headers: headers({ host: '127.0.0.1:3111', 'x-forwarded-for': '127.0.0.1', 'x-forwarded-host': 'localhost:3111', 'x-forwarded-proto': 'http' }),
      }),
    ).toBe(true)
    expect(isE2eAuthBypassAllowed({ ...ok(), headers: headers({ host: 'localhost:3111', 'x-forwarded-for': '::1' }) })).toBe(true)
  })
  it.each(['/', '/studio', '/api/personalization/discover-assets', '/api/v1/x', '/personalization-demo/extra', '/api/dev-login'])(
    'is off for non-allow-listed path %s',
    (pathname) => {
      expect(isE2eAuthBypassAllowed({ ...ok(), pathname })).toBe(false)
    },
  )
  it('allow-lists page routes only (never an API route)', () => {
    expect(E2E_BYPASS_ROUTES.every((r: string) => !r.startsWith('/api'))).toBe(true)
  })
  it('is off for missing input', () => {
    expect(isE2eAuthBypassAllowed(undefined as never)).toBe(false)
    expect(isE2eAuthBypassAllowed({} as never)).toBe(false)
  })
})
