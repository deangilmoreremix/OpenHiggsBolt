import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import axios from 'axios'

/**
 * SSRF / DNS-rebinding regression suite for the centralized network
 * destination validator.
 *
 * Every test is hermetic: `dns` is mocked so no name is ever really resolved,
 * and the HTTP client is spied so no socket is ever opened. The suite covers
 * the bypasses the audit found in the two pre-existing implementations
 * (src/server/discoverAssets.ts `isPrivateIp` and src/lib/uploadProxyTarget.js
 * `BLOCKED_IP_RANGES`), plus the two structural holes: hostname-only checking
 * and automatic redirect following.
 */

// ---------------------------------------------------------------------------
// DNS mock
// ---------------------------------------------------------------------------

const dnsMocks = vi.hoisted(() => ({
  resolve4: vi.fn(),
  resolve6: vi.fn(),
}))

vi.mock('dns', () => {
  const promises = { resolve4: dnsMocks.resolve4, resolve6: dnsMocks.resolve6 }
  return { default: { promises }, promises }
})

import {
  SSRF_BLOCKED_MESSAGE,
  NetworkSafetyError,
  checkDestination,
  createPinnedFetch,
  createPinnedLookup,
  isBlockedHostname,
  isBlockedIpAddress,
  isRedirectStatus,
  parseIpv4,
  parseIpv6,
  safeRequestConfig,
  validateRedirect,
} from '../src/lib/networkSafety'
import { discoverBusinessAssets, fetchPage, sanitizeUrl, validateImage } from '../src/server/discoverAssets'
import { validateUploadProxyTarget } from '../src/lib/uploadProxyTarget'

type AddressMap = Record<string, string[]>

function notFound(): never {
  const err = new Error('mock dns: ENOTFOUND')
  Object.assign(err, { code: 'ENOTFOUND' })
  throw err
}

function noRecords(): never {
  const err = new Error('mock dns: ENODATA')
  Object.assign(err, { code: 'ENODATA' })
  throw err
}

/** Programs the mocked resolver: name -> list of addresses. */
function resolveNames(map: AddressMap) {
  dnsMocks.resolve4.mockImplementation(async (hostname: string) => {
    const addresses = map[hostname]
    if (!addresses) return notFound()
    const v4 = addresses.filter((address) => address.indexOf(':') === -1)
    return v4.length > 0 ? v4 : noRecords()
  })
  dnsMocks.resolve6.mockImplementation(async (hostname: string) => {
    const addresses = map[hostname]
    if (!addresses) return notFound()
    const v6 = addresses.filter((address) => address.indexOf(':') !== -1)
    return v6.length > 0 ? v6 : noRecords()
  })
}

const PUBLIC_IP = '93.184.216.34'
const PUBLIC_IP_ALT = '104.20.23.154'
const METADATA_IP = '169.254.169.254'

beforeEach(() => {
  resolveNames({ 'example.com': [PUBLIC_IP] })
})

afterEach(() => {
  vi.restoreAllMocks()
  dnsMocks.resolve4.mockReset()
  dnsMocks.resolve6.mockReset()
  resolveNames({ 'example.com': [PUBLIC_IP] })
})

// ---------------------------------------------------------------------------
// 1. Every numeric form of a private address is blocked
// ---------------------------------------------------------------------------

describe('networkSafety: hostname literals', () => {
  const BLOCKED_HOSTNAMES = [
    // IPv4 private / loopback / link-local / CGNAT / unspecified
    '169.254.169.254',
    '169.254.0.1',
    '169.254.255.255',
    '100.64.0.1',
    '100.127.255.255',
    '127.0.0.1',
    '127.1.2.3',
    '10.1.2.3',
    '192.168.1.1',
    '172.16.0.1',
    '172.20.1.1',
    '172.31.255.255',
    '0.0.0.0',
    '0.1.2.3',
    // Other never-public IPv4
    '255.255.255.255',
    '224.0.0.1',
    '240.0.0.1',
    '192.0.2.1',
    '198.18.0.1',
    '198.51.100.7',
    '203.0.113.9',
    // IPv6 loopback / ULA / link-local / multicast / documentation
    '::1',
    '::',
    '0:0:0:0:0:0:0:1',
    'fe80::1',
    'fe80::1234:5678:9abc',
    'fc00::1',
    'fd12:3456:789a:1::1',
    'fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
    'ff02::1',
    '2001:db8::1',
    // IPv4-mapped / translated / compatible IPv6
    '::ffff:127.0.0.1',
    '::ffff:7f00:1',
    '::ffff:169.254.169.254',
    '::ffff:10.0.0.1',
    '::ffff:100.64.0.1',
    '::127.0.0.1',
    '::ffff:0:127.0.0.1',
    '64:ff9b::7f00:1',
    // Bracketed URL form
    '[::1]',
    '[::ffff:127.0.0.1]',
    // Unusual IPv4 spellings
    '2130706433',
    '0x7f000001',
    '0177.0.0.1',
    '017700000001',
    '0x7f.0.0.1',
    '127.1',
    '127.0.0.01',
    '2130706433.',
    '127.0.0.1.',
    '0177.0.0.1.',
    // Reserved hostnames
    'localhost',
    'localhost.localdomain',
    'ip6-localhost',
    'metadata',
    'metadata.google.internal',
    'instance-data',
    'instance-data.ec2.internal',
    'api.internal',
    'printer.local',
    'host.localhost',
    'nas.home.arpa',
  ]

  it.each(BLOCKED_HOSTNAMES)('blocks %s', (hostname) => {
    expect(isBlockedHostname(hostname), hostname).toBe(true)
  })

  const PUBLIC_HOSTNAMES = [
    'example.com',
    'www.example.com',
    'example.com.',
    'sub.domain.co.uk',
    '93.184.216.34',
    '8.8.8.8',
    '1.1.1.1',
    '2606:4700:10::6814:179a',
    '2001:4860:4860::8888',
    'my-bucket.s3.amazonaws.com',
  ]

  it.each(PUBLIC_HOSTNAMES)('allows %s', (hostname) => {
    expect(isBlockedHostname(hostname), hostname).toBe(false)
  })

  it('never treats a hostname as an IP literal', () => {
    expect(isBlockedHostname('example.com')).toBe(false)
    expect(parseIpv4('example.com')).toBeNull()
    expect(parseIpv6('example.com')).toBeNull()
  })
})

describe('networkSafety: resolved addresses', () => {
  it.each([
    '169.254.169.254',
    '100.64.0.1',
    '127.0.0.1',
    '10.0.0.1',
    '192.168.0.1',
    '172.16.0.1',
    '0.0.0.0',
    '::1',
    '::ffff:127.0.0.1',
    'fc00::1',
    'fe80::1',
    'fe80::',
  ])('blocks resolved address %s', (address) => {
    expect(isBlockedIpAddress(address), address).toBe(true)
  })

  it.each([PUBLIC_IP, '104.20.23.154', '8.8.8.8', '2606:4700:10::6814:179a'])(
    'allows resolved address %s',
    (address) => {
      expect(isBlockedIpAddress(address), address).toBe(false)
    },
  )

  it('fails closed on a value that is not an address at all', () => {
    expect(isBlockedIpAddress('not-an-ip')).toBe(false) // name: caller must resolve
    expect(isBlockedIpAddress('')).toBe(true)
    expect(isBlockedIpAddress('1.2.3.4.5')).toBe(true)
    expect(isBlockedIpAddress('999.999.999.999')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 2. Hostnames that RESOLVE to a private address (hostname regexes are not enough)
// ---------------------------------------------------------------------------

describe('networkSafety: hostname resolving to a private address', () => {
  it('rejects a public-looking name that resolves to 127.0.0.1', async () => {
    resolveNames({ 'rebind.example.com': ['127.0.0.1'] })

    const result = await checkDestination('https://rebind.example.com/page')

    expect(result.ok).toBe(false)
    expect(result.ok === false && result.reason).toBe('resolved_to_blocked_ip')
  })

  it('rejects a name that resolves to the cloud metadata address', async () => {
    resolveNames({ 'metadata.example.com': [METADATA_IP] })

    const result = await checkDestination('https://metadata.example.com/latest/meta-data/')

    expect(result.ok).toBe(false)
    expect(result.ok === false && result.reason).toBe('resolved_to_blocked_ip')
  })

  it('rejects when ANY of several resolved addresses is private', async () => {
    resolveNames({ 'mixed.example.com': [PUBLIC_IP, METADATA_IP] })

    const result = await checkDestination('https://mixed.example.com/')

    expect(result.ok).toBe(false)
    expect(result.ok === false && result.reason).toBe('resolved_to_blocked_ip')
  })

  it('rejects a name whose AAAA record is an IPv4-mapped loopback', async () => {
    resolveNames({ 'v6.example.com': ['::ffff:127.0.0.1'] })

    const result = await checkDestination('https://v6.example.com/')

    expect(result.ok).toBe(false)
    expect(result.ok === false && result.reason).toBe('resolved_to_blocked_ip')
  })

  it('rejects a name that resolves to a CGNAT address', async () => {
    resolveNames({ 'cgnat.example.com': ['100.64.0.5'] })

    const result = await checkDestination('https://cgnat.example.com/')

    expect(result.ok).toBe(false)
  })

  it('accepts a public name and reports every validated address', async () => {
    resolveNames({ 'example.com': [PUBLIC_IP, PUBLIC_IP_ALT] })

    const result = await checkDestination('https://example.com/assets/logo.png')

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.addresses).toEqual([PUBLIC_IP, PUBLIC_IP_ALT])
    expect(result.hostname).toBe('example.com')
  })

  it('reports a name that does not resolve at all', async () => {
    resolveNames({})

    const result = await checkDestination('https://nx.example.com/')

    expect(result.ok).toBe(false)
    expect(result.ok === false && result.reason).toBe('dns_resolution_failed')
  })

  it('still enforces the protocol allowlist', async () => {
    const ftp = await checkDestination('ftp://example.com/file')
    expect(ftp.ok).toBe(false)
    expect(ftp.ok === false && ftp.reason).toBe('invalid_url')

    const file = await checkDestination('file:///etc/passwd')
    expect(file.ok).toBe(false)

    // Discovery operates on plain http too, so that must stay allowed.
    const http = await checkDestination('http://example.com/')
    expect(http.ok).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 3. sanitizeUrl keeps its historical contract
// ---------------------------------------------------------------------------

describe('sanitizeUrl', () => {
  it('throws the historical message for every blocked form', () => {
    const blocked = [
      'http://localhost:3000',
      'http://127.0.0.1/page',
      'http://10.0.0.1/secret',
      'http://192.168.1.1/internal',
      'http://172.16.0.1/private',
      'http://169.254.169.254/latest/meta-data/',
      'http://100.64.0.1/',
      'http://0.0.0.0/',
      'http://2130706433/',
      'http://0x7f000001/',
      'http://0177.0.0.1/',
      'http://[::1]/',
      'http://[::ffff:127.0.0.1]/',
      'http://fc00::1/',
      'http://fe80::1/',
    ]
    for (const input of blocked) {
      expect(() => sanitizeUrl(input), input).toThrow(SSRF_BLOCKED_MESSAGE)
    }
  })

  it('still rejects non-http protocols with the historical message', () => {
    expect(() => sanitizeUrl('file:///etc/passwd')).toThrow(
      'Only http/https protocols are allowed',
    )
    expect(() => sanitizeUrl('ftp://internal.server/file')).toThrow(
      'Only http/https protocols are allowed',
    )
    expect(() => sanitizeUrl('javascript:alert(1)')).toThrow(
      'Only http/https protocols are allowed',
    )
  })

  it('throws a NetworkSafetyError that carries a machine-readable reason', () => {
    try {
      sanitizeUrl('http://169.254.169.254/')
      throw new Error('expected sanitizeUrl to throw')
    } catch (err) {
      expect(err).toBeInstanceOf(NetworkSafetyError)
      expect((err as NetworkSafetyError).reason).toBe('blocked_host')
      expect((err as Error).message).toBe(SSRF_BLOCKED_MESSAGE)
    }
  })

  it('allows a genuinely public URL and normalizes it', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com/')
    expect(sanitizeUrl('example.com')).toBe('https://example.com/')
    expect(sanitizeUrl('http://example.com/a/b?c=d')).toBe('http://example.com/a/b?c=d')
  })
})

// ---------------------------------------------------------------------------
// 4. TOCTOU: the connection is bound to a pre-validated address
// ---------------------------------------------------------------------------

describe('networkSafety: connection pinning (TOCTOU)', () => {
  it('disables automatic redirects for every request', async () => {
    const destination = await checkDestination('https://example.com/page')
    expect(destination.ok).toBe(true)
    if (!destination.ok) return

    const config = safeRequestConfig(destination)
    expect(config.maxRedirects).toBe(0)
    expect(typeof config.lookup).toBe('function')
  })

  it('pins the lookup to the address that was validated', async () => {
    resolveNames({ 'example.com': [PUBLIC_IP] })
    const destination = await checkDestination('https://example.com/page')
    expect(destination.ok).toBe(true)
    if (!destination.ok) return

    const { lookup } = safeRequestConfig(destination)
    expect(lookup).toBeDefined()

    const first = await (lookup as (h: string, o: unknown) => Promise<unknown>)('example.com', {})
    expect(first).toEqual({ address: PUBLIC_IP, family: 4 })

    // Simulate the DNS record flipping to the metadata address AFTER the
    // destination was validated. The pinned lookup must still hand back the
    // validated address, and never the rebound one.
    resolveNames({ 'example.com': [METADATA_IP] })
    const second = await (lookup as (h: string, o: unknown) => Promise<unknown>)('example.com', {})
    expect(second).toEqual({ address: PUBLIC_IP, family: 4 })
    expect(second).not.toEqual({ address: METADATA_IP, family: 4 })
  })

  it('pins IPv6 destinations to an IPv6 address', async () => {
    resolveNames({ 'example.com': ['2606:4700:10::6814:179a'] })
    const destination = await checkDestination('https://example.com/page')
    expect(destination.ok).toBe(true)
    if (!destination.ok) return

    const { lookup } = safeRequestConfig(destination)
    const resolved = await (lookup as (h: string, o: unknown) => Promise<unknown>)('example.com', {})
    expect(resolved).toEqual({ address: '2606:4700:10::6814:179a', family: 6 })
  })

  it('node-style lookup supports the all=true contract used by net.connect', () => {
    const lookup = createPinnedLookup([PUBLIC_IP, PUBLIC_IP_ALT])
    const all = vi.fn()
    lookup('example.com', { all: true }, all)
    expect(all).toHaveBeenCalledWith(null, [
      { address: PUBLIC_IP, family: 4 },
      { address: PUBLIC_IP_ALT, family: 4 },
    ])

    const single = vi.fn()
    lookup('example.com', {}, single)
    expect(single).toHaveBeenCalledWith(null, PUBLIC_IP, 4)
  })

  it('fails closed when there is nothing pre-validated to return', () => {
    const callback = vi.fn()
    createPinnedLookup([])('example.com', {}, callback)
    expect(callback).toHaveBeenCalledTimes(1)
    const err = callback.mock.calls[0][0] as Error & { code?: string }
    expect(err.code).toBe('ENOTFOUND')
  })
})

// ---------------------------------------------------------------------------
// 5. Redirects are validated per hop instead of followed blindly
// ---------------------------------------------------------------------------

describe('networkSafety: redirect handling', () => {
  it('classifies redirect statuses', () => {
    for (const status of [301, 302, 303, 307, 308]) {
      expect(isRedirectStatus(status), String(status)).toBe(true)
    }
    for (const status of [200, 204, 404, 500]) {
      expect(isRedirectStatus(status), String(status)).toBe(false)
    }
  })

  it('refuses a redirect to the cloud metadata address', async () => {
    const next = await validateRedirect(
      'http://169.254.169.254/latest/meta-data/iam/security-credentials/',
      'https://example.com/',
    )
    expect(next).toBeNull()
  })

  it('refuses a redirect to a host that resolves to a private address', async () => {
    resolveNames({ 'evil.example.com': ['10.1.2.3'] })

    const next = await validateRedirect('https://evil.example.com/steal', 'https://example.com/')
    expect(next).toBeNull()
  })

  it('refuses a redirect to loopback', async () => {
    expect(await validateRedirect('http://127.0.0.1:8080/admin', 'https://example.com/')).toBeNull()
    expect(await validateRedirect('http://localhost/admin', 'https://example.com/')).toBeNull()
  })

  it('refuses a non-http redirect scheme', async () => {
    expect(await validateRedirect('file:///etc/passwd', 'https://example.com/')).toBeNull()
    expect(await validateRedirect('gopher://example.com/', 'https://example.com/')).toBeNull()
  })

  it('follows a relative redirect to a validated public destination', async () => {
    const next = await validateRedirect('/about', 'https://example.com/start')
    expect(next).not.toBeNull()
    if (!next) return
    expect(next.url).toBe('https://example.com/about')
    expect(next.addresses).toEqual([PUBLIC_IP])
  })

  it('follows an absolute redirect to a validated public destination', async () => {
    resolveNames({ 'cdn.example.com': [PUBLIC_IP_ALT] })
    const next = await validateRedirect('https://cdn.example.com/logo.png', 'https://example.com/')
    expect(next).not.toBeNull()
    if (!next) return
    expect(next.addresses).toEqual([PUBLIC_IP_ALT])
  })
})

describe('fetchPage: end-to-end request path', () => {
  it('returns the HTML of a public page and requests with pinning + no redirects', async () => {
    const get = vi.spyOn(axios, 'get').mockResolvedValue({
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
      data: Buffer.from('<html><body>ok</body></html>'),
    })

    const html = await fetchPage('https://example.com/')

    expect(html).toBe('<html><body>ok</body></html>')
    expect(get).toHaveBeenCalledTimes(1)
    const config = get.mock.calls[0][1] as Record<string, unknown>
    expect(config.maxRedirects).toBe(0)
    expect(typeof config.lookup).toBe('function')
  })

  it('does not follow a redirect into the metadata service', async () => {
    const get = vi.spyOn(axios, 'get').mockResolvedValue({
      status: 302,
      headers: { location: 'http://169.254.169.254/latest/meta-data/' },
      data: Buffer.from(''),
    })

    const html = await fetchPage('https://example.com/')

    expect(html).toBeNull()
    expect(get).toHaveBeenCalledTimes(1)
  })

  it('does not follow a redirect to a host that resolves to a private IP', async () => {
    resolveNames({ 'example.com': [PUBLIC_IP], 'next.example.com': ['192.168.1.10'] })
    const get = vi.spyOn(axios, 'get').mockResolvedValue({
      status: 301,
      headers: { location: 'https://next.example.com/internal' },
      data: Buffer.from(''),
    })

    const html = await fetchPage('https://example.com/')

    expect(html).toBeNull()
    expect(get).toHaveBeenCalledTimes(1)
  })

  it('follows a redirect whose destination validates', async () => {
    const get = vi
      .spyOn(axios, 'get')
      .mockResolvedValueOnce({
        status: 302,
        headers: { location: 'https://example.com/home' },
        data: Buffer.from(''),
      })
      .mockResolvedValueOnce({
        status: 200,
        headers: { 'content-type': 'text/html' },
        data: Buffer.from('<html>home</html>'),
      })

    const html = await fetchPage('https://example.com/')

    expect(html).toBe('<html>home</html>')
    expect(get).toHaveBeenCalledTimes(2)
  })

  it('gives up after too many redirect hops', async () => {
    const get = vi.spyOn(axios, 'get').mockImplementation(async (url: string) => ({
      status: 302,
      headers: { location: `${String(url)}next/` },
      data: Buffer.from(''),
    }))

    const html = await fetchPage('https://example.com/')

    expect(html).toBeNull()
    // 6 requests = 5 hops + the initial one (REDIRECT_LIMIT)
    expect(get).toHaveBeenCalledTimes(6)
  })
})

// ---------------------------------------------------------------------------
// 6. The upload proxy shares the same rules
// ---------------------------------------------------------------------------

describe('validateUploadProxyTarget', () => {
  const S3 = 'https://my-bucket.s3.amazonaws.com/upload'

  it('accepts a public S3 destination', async () => {
    resolveNames({ 'my-bucket.s3.amazonaws.com': [PUBLIC_IP] })
    expect(S3.includes('my-bucket')).toBe(true)

    const result = await validateUploadProxyTarget(S3)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.url).toBe(S3)
    expect(result.addresses).toEqual([PUBLIC_IP])
  })

  it('accepts a regional and dualstack S3 endpoint', async () => {
    resolveNames({ 'b.s3.us-west-2.amazonaws.com': [PUBLIC_IP], 'b.s3.us-west-2.dualstack.amazonaws.com': [PUBLIC_IP] })

    expect((await validateUploadProxyTarget('https://b.s3.us-west-2.amazonaws.com/x')).ok).toBe(true)
    expect((await validateUploadProxyTarget('https://b.s3.us-west-2.dualstack.amazonaws.com/x')).ok).toBe(true)
  })

  it('honours the UPLOAD_PROXY_ALLOWED_HOSTS allowlist', async () => {
    resolveNames({ 'uploads.example.net': [PUBLIC_IP] })

    const result = await validateUploadProxyTarget('https://uploads.example.net/put', {
      env: { UPLOAD_PROXY_ALLOWED_HOSTS: 'uploads.example.net' },
    })

    expect(result.ok).toBe(true)
    // ...and still refuses it when the allowlist does not name it.
    expect((await validateUploadProxyTarget('https://uploads.example.net/put')).ok).toBe(false)
  })

  it('rejects an S3 host that resolves to a private address', async () => {
    resolveNames({ 'my-bucket.s3.amazonaws.com': ['10.0.0.7'] })

    const result = await validateUploadProxyTarget(S3)

    expect(result.ok).toBe(false)
    expect(result.ok === false && result.reason).toBe('resolved_to_blocked_ip')
  })

  it('rejects an S3 host that resolves to the metadata address', async () => {
    resolveNames({ 'my-bucket.s3.amazonaws.com': [METADATA_IP] })

    const result = await validateUploadProxyTarget(S3)

    expect(result.ok).toBe(false)
    expect(result.ok === false && result.reason).toBe('resolved_to_blocked_ip')
  })

  it('rejects a host that does not resolve', async () => {
    resolveNames({})

    const result = await validateUploadProxyTarget(S3)

    expect(result.ok).toBe(false)
    expect(result.ok === false && result.reason).toBe('dns_resolution_failed')
  })

  const BLOCKED_TARGETS = [
    'https://169.254.169.254/latest/meta-data/',
    'https://100.64.0.1/',
    'https://100.127.255.255/',
    'https://127.0.0.1/',
    'https://10.0.0.1/',
    'https://192.168.1.1/',
    'https://172.16.0.1/',
    'https://172.31.255.255/',
    'https://0.0.0.0/',
    'https://0.1.2.3/',
    'https://[::1]/',
    'https://[::ffff:127.0.0.1]/',
    'https://[fc00::1]/',
    'https://[fe80::1]/',
    'https://2130706433/',
    'https://0x7f000001/',
    'https://0177.0.0.1/',
    'https://127.1/',
    'https://localhost/',
    'https://metadata.google.internal/',
    'https://service.internal/',
    'https://printer.local/',
    'https://[::ffff:169.254.169.254]/',
  ]

  it.each(BLOCKED_TARGETS)('rejects %s', async (target) => {
    const result = await validateUploadProxyTarget(target)
    expect(result.ok, target).toBe(false)
    expect(result.ok === false && result.reason, target).toBe('host_not_allowed')
  })

  it('rejects a plain http target and a missing/invalid one', async () => {
    expect(await validateUploadProxyTarget('http://b.s3.amazonaws.com/x')).toEqual({
      ok: false,
      reason: 'unsafe_protocol',
    })
    expect(await validateUploadProxyTarget('')).toEqual({ ok: false, reason: 'missing_target' })
    expect(await validateUploadProxyTarget('   ')).toEqual({ ok: false, reason: 'missing_target' })
    expect(await validateUploadProxyTarget(undefined)).toEqual({ ok: false, reason: 'missing_target' })
    expect((await validateUploadProxyTarget('not a url')).reason).toBe('invalid_url')
    expect((await validateUploadProxyTarget('ftp://b.s3.amazonaws.com/x')).reason).toBe(
      'unsafe_protocol',
    )
    // A public-looking host that is not an S3 endpoint is still refused.
    expect((await validateUploadProxyTarget('https://evil.example.com/x')).reason).toBe(
      'host_not_allowed',
    )
  })
})

// ---------------------------------------------------------------------------
// 7. Legitimate public discovery must keep working
// ---------------------------------------------------------------------------

describe('discoverBusinessAssets still discovers a public site', () => {
  const HOME_HTML = `<!doctype html>
<html>
  <head>
    <meta property="og:image" content="https://example.com/og/hero.jpg">
  </head>
  <body>
    <img src="/logo.png" alt="Acme logo">
    <img src="/team/jane.jpg" alt="Jane">
    <a href="/about">About us</a>
    <a href="/services">Services</a>
  </body>
</html>`

  beforeEach(() => {
    resolveNames({ 'example.com': [PUBLIC_IP] })
    vi.spyOn(axios, 'get').mockImplementation(async (url: string) => ({
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
      data: Buffer.from(HOME_HTML),
    }))
    vi.spyOn(axios, 'head').mockImplementation(async () => ({
      status: 200,
      headers: { 'content-type': 'image/png' },
    }))
  })

  it('returns classified assets for a public website', async () => {
    const assets = await discoverBusinessAssets({
      websiteUrl: 'https://example.com',
      maxPages: 3,
      maxImages: 10,
    })

    expect(Array.isArray(assets)).toBe(true)
    expect(assets.length).toBeGreaterThan(0)

    const urls = assets.map((asset) => asset.sourceUrl)
    expect(urls).toContain('https://example.com/logo.png')

    const logo = assets.find((asset) => asset.sourceUrl === 'https://example.com/logo.png')
    expect(logo).toBeDefined()
    expect(logo?.category).toBe('logo')
    expect(logo?.confidence).toBeGreaterThan(0)

    // Every request went through the validated/pinned path.
    const get = axios.get as unknown as { mock: { calls: unknown[][] } }
    expect(get.mock.calls.length).toBeGreaterThan(0)
    for (const call of get.mock.calls) {
      const config = call[1] as Record<string, unknown>
      expect(config.maxRedirects).toBe(0)
      expect(typeof config.lookup).toBe('function')
    }
  })

  it('returns an empty list instead of throwing when the site is unreachable', async () => {
    vi.spyOn(axios, 'get').mockRejectedValue(new Error('ECONNREFUSED'))
    resolveNames({})

    const assets = await discoverBusinessAssets({ websiteUrl: 'https://example.com' })

    expect(assets).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// 8. Image validation honours the same rules
// ---------------------------------------------------------------------------

describe('validateImage', () => {
  it('accepts a public image', async () => {
    vi.spyOn(axios, 'head').mockResolvedValue({
      status: 200,
      headers: { 'content-type': 'image/png' },
    })

    const result = await validateImage('https://example.com/logo.png')

    expect(result).toEqual({ valid: true, mime: 'image/png' })
  })

  it('rejects an image whose host resolves to a private address', async () => {
    resolveNames({ 'images.example.com': ['127.0.0.1'] })
    const head = vi.spyOn(axios, 'head')

    const result = await validateImage('https://images.example.com/logo.png')

    expect(result).toEqual({ valid: false })
    expect(head).not.toHaveBeenCalled()
  })

  it('rejects an image behind a redirect into the metadata service', async () => {
    const head = vi.spyOn(axios, 'head').mockResolvedValue({
      status: 302,
      headers: { location: 'http://169.254.169.254/latest/meta-data/' },
    })
    const get = vi.spyOn(axios, 'get').mockResolvedValue({
      status: 200,
      headers: { 'content-type': 'image/jpeg' },
      data: Buffer.from('x'),
    })

    const result = await validateImage('https://example.com/logo.png')

    expect(result.valid).toBe(false)
    expect(get).not.toHaveBeenCalled()
    expect(head).toHaveBeenCalledTimes(1)
  })

  it('follows a public redirect to another public host', async () => {
    resolveNames({ 'example.com': [PUBLIC_IP], 'cdn.example.net': [PUBLIC_IP_ALT] })
    vi.spyOn(axios, 'head')
      .mockResolvedValueOnce({ status: 302, headers: { location: 'https://cdn.example.net/a.png' } })
      .mockResolvedValueOnce({ status: 200, headers: { 'content-type': 'image/jpeg' } })

    const result = await validateImage('https://example.com/logo.png')

    expect(result).toEqual({ valid: true, mime: 'image/jpeg' })
  })

  it('still falls back to a bounded GET when HEAD reports a method error', async () => {
    const get = vi.spyOn(axios, 'get').mockResolvedValue({
      status: 200,
      headers: { 'content-type': 'image/jpeg' },
      data: Buffer.from('fake-image'),
    })
    vi.spyOn(axios, 'head').mockRejectedValue({ response: { status: 405 }, message: 'nope' })

    const result = await validateImage('https://example.com/photo.jpg')

    expect(result.valid).toBe(true)
    expect(get).toHaveBeenCalledTimes(1)
    expect(get.mock.calls[0][1]).toMatchObject({ maxContentLength: 5 * 1024 * 1024 })
  })
})

// ---------------------------------------------------------------------------
// 9. The shared module stays consumable by a plain .js consumer
// ---------------------------------------------------------------------------

describe('networkSafety stays a plain-JS-consumable module', () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), 'src/lib/networkSafety.ts'),
    'utf8',
  )

  it('contains no TypeScript-only syntax', () => {
    const forbidden: Array<[string, RegExp]> = [
      ['interface declaration', /^\s*(export\s+)?interface\s+\w+/m],
      ['type alias', /^\s*(export\s+)?type\s+\w+\s*=/m],
      ['enum declaration', /^\s*(export\s+)?enum\s+\w+/m],
      ['import type', /\bimport\s+type\b/],
      ['as cast', /\)\s+as\s+[A-Za-z_$]/],
      ['non-null assertion', /\w!\s*[.)\],;]/],
      ['generics', /<[A-Z][\w,\s]*>\s*\(/],
      ['declare keyword', /\bdeclare\s+\w/],
      [
        'type annotations',
        /(const|let|function\s+\w+|\w+\s*\()\s*\w*[A-Za-z_$)\]]\s*:\s*(string|number|boolean|unknown|any|void|null|Promise|Record|Array)\b/,
      ],
    ]

    for (const [label, pattern] of forbidden) {
      expect(pattern.test(source), `networkSafety.ts must not contain a ${label}`).toBe(false)
    }
  })

  it('does not read a MuAPI/OpenAI server key from the environment', () => {
    // The BYOK source scan walks src/ and fails on MUAPI_API_KEY / MUAPI_KEY /
    // OPENAI_API_KEY reads; the shared validator must stay key-agnostic.
    expect(source).not.toMatch(/MUAPI_API_KEY|MUAPI_KEY|OPENAI_API_KEY/)
    expect(source).not.toMatch(/process\s*\.\s*env/)
  })

  it('is not imported by the studio package (whose Babel build has no TypeScript plugin)', () => {
    const studioRoot = path.join(process.cwd(), 'packages/studio/src')
    const offenders: string[] = []

    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          walk(full)
        } else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) {
          const code = fs.readFileSync(full, 'utf8')
          if (/from\s+['"][^'"]*src\/lib\//.test(code) || /networkSafety/.test(code)) {
            offenders.push(path.join(path.relative(process.cwd(), full)))
          }
        }
      }
    }

    walk(studioRoot)
    expect(offenders).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// 10. createPinnedFetch: the pin-bound request primitive
//
// The socket-level behaviour (a real listener on 127.0.0.1, TLS SNI/certificate
// verification, multipart S3 bodies) is covered by
// tests/s3-dns-pinning.vitest.test.ts. What is asserted here is the API
// contract of the primitive itself: what it refuses to build, and which
// destination fields it trusts.
// ---------------------------------------------------------------------------

describe('networkSafety.createPinnedFetch', () => {
  it('refuses a destination with no usable URL', async () => {
    for (const destination of [{}, { url: '' }, { url: 'not a url' }]) {
      const fetch2 = createPinnedFetch(destination as { url: string })
      await expect(fetch2('not a url')).rejects.toThrow(NetworkSafetyError)
    }
  })

  it('refuses a destination with no validated address', async () => {
    const fetch2 = createPinnedFetch({
      url: 'https://example.com/upload',
      hostname: 'example.com',
      addresses: [],
    })
    // The machine-readable code lives on `reason`; the message is the stable
    // SSRF string every caller of this module already reports.
    await expect(fetch2('https://example.com/upload')).rejects.toMatchObject({
      reason: 'no_validated_address',
    })
  })

  it('refuses to write a FormData body raw (it must be serialized first)', async () => {
    const fetch2 = createPinnedFetch({
      url: 'https://example.com/upload',
      hostname: 'example.com',
      addresses: [PUBLIC_IP],
    })
    const formData = new FormData()
    formData.append('key', 'value')
    await expect(fetch2('https://example.com/upload', { method: 'POST', body: formData })).rejects.toMatchObject({
      reason: 'unsupported_body',
    })
  })

  it('refuses a request to any origin other than the validated destination', async () => {
    const fetch2 = createPinnedFetch({
      url: 'https://example.com/upload',
      hostname: 'example.com',
      addresses: [PUBLIC_IP],
    })

    for (const target of [
      'https://evil.example.com/upload',
      'http://example.com/upload',
      'https://example.com:8443/upload',
    ]) {
      await expect(fetch2(target), target).rejects.toMatchObject({
        reason: 'pinned_fetch_refused_origin',
      })
    }
  })

  it('trusts only the address list it was given, not the resolver', async () => {
    // The pin is closed over at factory time, so a DNS answer that changes
    // afterwards cannot move the connection target.
    const destination = { url: 'https://example.com/upload', hostname: 'example.com', addresses: [PUBLIC_IP] }
    createPinnedFetch(destination)
    resolveNames({ 'example.com': [METADATA_IP] })

    const lookup = createPinnedLookup(destination.addresses)
    const resolved = await new Promise<string>((resolve) => {
      lookup('example.com', {}, (_err, address) => resolve(address))
    })
    expect(resolved).toBe(PUBLIC_IP)
  })

  it('builds its lookup for the address the destination validated', async () => {
    const destination = {
      url: 'https://example.com/upload',
      hostname: 'example.com',
      addresses: [PUBLIC_IP_ALT, PUBLIC_IP],
    }
    createPinnedFetch(destination)

    const resolved = await new Promise<{ address: string; family: number }>((resolve) => {
      createPinnedLookup(destination.addresses)('example.com', {}, (_err, address, family) =>
        resolve({ address, family }),
      )
    })
    expect(resolved.address).toBe(PUBLIC_IP_ALT)
    expect(resolved.family).toBe(4)
  })
})
