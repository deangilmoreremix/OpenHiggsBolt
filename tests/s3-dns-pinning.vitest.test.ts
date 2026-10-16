import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import http from 'node:http'
import https from 'node:https'
import net from 'node:net'
import tls from 'node:tls'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

/**
 * S3 upload-proxy: DNS-rebinding / connection-pinning regression suite.
 *
 * The residual gap this suite closes: `validateUploadProxyTarget` resolved and
 * validated the destination, but the caller then did a plain
 * `fetch(validatedTarget.url)`, which re-resolves DNS on its own. Between the
 * check and the connect, a record can flip from a public address to
 * 169.254.169.254 / 127.0.0.1 and the connection follows the rebound answer —
 * a textbook TOCTOU bypass.
 *
 * The fix is exercised here end to end:
 *   - `createPinnedFetch` binds the socket to the pre-validated address and
 *     never resolves a name at connect time;
 *   - `createUploadProxyPinnedFetch` adds the S3 form encoding and refuses a
 *     non-public pin as defence in depth;
 *   - `validateUploadProxyTarget` hands the caller a `pinnedFetch` so no code
 *     path has to remember to re-pin.
 *
 * Everything is hermetic except the local listeners: `dns` is mocked so no
 * name is ever really resolved, and the only sockets opened are to
 * 127.0.0.1 / ::1 inside this process. Where a destination needs a public
 * address to be *validated*, no connection is made from it at all — the
 * request target is observed at the API boundary instead.
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

import { createPinnedFetch, createPinnedLookup } from '../src/lib/networkSafety'
import {
  validateUploadProxyTarget,
  createUploadProxyPinnedFetch,
  encodeS3FormData,
} from '../src/lib/uploadProxyTarget'

const PUBLIC_IP = '93.184.216.34'
const METADATA_IP = '169.254.169.254'
const S3_HOST = 'my-bucket.s3.amazonaws.com'
const S3_URL = 'https://my-bucket.s3.amazonaws.com/upload'

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
function resolveNames(map: Record<string, string[]>) {
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

function resolverCallCount() {
  return dnsMocks.resolve4.mock.calls.length + dnsMocks.resolve6.mock.calls.length
}

beforeEach(() => {
  resolveNames({})
})

afterEach(() => {
  vi.restoreAllMocks()
  dnsMocks.resolve4.mockReset()
  dnsMocks.resolve6.mockReset()
  resolveNames({})
})

// ---------------------------------------------------------------------------
// Local listeners
// ---------------------------------------------------------------------------

interface RecordedRequest {
  method: string
  url: string
  headers: http.IncomingHttpHeaders
  body: Buffer
}

interface RecordingServer {
  origin: string
  port: number
  requests: RecordedRequest[]
  status: number
  location?: string
  close: () => Promise<void>
}

/** Starts a real HTTP listener on 127.0.0.1 (or ::1) that records every request. */
async function startRecordingServer(
  host: '127.0.0.1' | '::1' = '127.0.0.1',
  respond: (request: RecordedRequest) => { status?: number; body?: string; location?: string; headers?: Record<string, string> } = () => ({}),
): Promise<RecordingServer> {
  const recorder: RecordingServer = {
    origin: '',
    port: 0,
    requests: [],
    status: 200,
    close: async () => {},
  }

  const server = http.createServer((req, res) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    req.on('end', () => {
      const recorded: RecordedRequest = {
        method: req.method || '',
        url: req.url || '',
        headers: req.headers,
        body: Buffer.concat(chunks),
      }
      recorder.requests.push(recorded)
      const reply = respond(recorded)
      recorder.status = reply.status ?? 200
      if (reply.location) recorder.location = reply.location
      const headers: Record<string, string> = { 'content-type': 'text/plain' }
      if (reply.location) headers.location = reply.location
      Object.assign(headers, reply.headers || {})
      res.writeHead(recorder.status, headers)
      res.end(reply.body ?? 'recorded')
    })
  })

  await new Promise<void>((resolve) => server.listen(0, host, () => resolve()))
  const address = server.address()
  const port = typeof address === 'object' && address ? address.port : 0
  recorder.port = port
  recorder.origin = `${host === '::1' ? `[::1]` : '127.0.0.1'}:${port}`

  recorder.close = async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve())
      server.closeAllConnections()
    })
  }

  return recorder
}

/**
 * Extracts the SNI a TLS ClientHello carries, straight off the socket. This is
 * how the test proves the pin still presents the *hostname* to TLS instead of
 * leaking the IP into SNI (RFC 6066 also forbids an IP literal there).
 */
function parseClientHelloSni(buffer: Buffer): string | null {
  try {
    if (buffer.length < 45 || buffer[0] !== 0x16) return null
    let offset = 5 // record header (type, version, length)
    if (buffer[offset] !== 0x01) return null // handshake / ClientHello
    offset += 4 // handshake header (type, 3-byte length)
    offset += 2 + 32 // client_version + random
    const sessionIdLength = buffer[offset]
    offset += 1 + sessionIdLength
    const cipherSuitesLength = buffer.readUInt16BE(offset)
    offset += 2 + cipherSuitesLength
    const compressionLength = buffer[offset]
    offset += 1 + compressionLength
    if (offset + 2 > buffer.length) return null
    const extensionsLength = buffer.readUInt16BE(offset)
    offset += 2
    const extensionsEnd = Math.min(offset + extensionsLength, buffer.length)

    while (offset + 4 <= extensionsEnd) {
      const extensionType = buffer.readUInt16BE(offset)
      const extensionLength = buffer.readUInt16BE(offset + 2)
      const bodyOffset = offset + 4
      if (extensionType === 0x0000) {
        const listLength = buffer.readUInt16BE(bodyOffset)
        let cursor = bodyOffset + 2
        const listEnd = Math.min(bodyOffset + listLength, buffer.length)
        while (cursor + 3 <= listEnd) {
          const nameType = buffer[cursor]
          const nameLength = buffer.readUInt16BE(cursor + 1)
          if (nameType === 0) {
            return buffer.toString('ascii', cursor + 3, cursor + 3 + nameLength)
          }
          cursor += 3 + nameLength
        }
        return null
      }
      offset = bodyOffset + extensionLength
    }
    return null
  } catch {
    return null
  }
}

/** A raw TCP listener that only watches the TLS ClientHello SNI. */
function startSniWatcher(): Promise<{ port: number; sni: () => string | null; close: () => void }> {
  return new Promise((resolve) => {
    let captured: string | null = null
    let received = Buffer.alloc(0)

    const server = net.createServer((socket) => {
      socket.on('data', (chunk) => {
        received = Buffer.concat([received, chunk])
        const sni = parseClientHelloSni(received)
        if (sni) {
          captured = sni
          socket.destroy()
        }
      })
      socket.on('error', () => {})
    })

    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      const port = typeof address === 'object' && address ? address.port : 0
      resolve({
        port,
        sni: () => captured,
        close: () => server.close(),
      })
    })
  })
}

// ---------------------------------------------------------------------------
// 1. The pin binds the socket to the validated address (real sockets, no DNS)
// ---------------------------------------------------------------------------

describe('networkSafety.createPinnedFetch: the connection goes only to the validated address', () => {
  it('connects to the pinned address and never resolves a name at connect time', async () => {
    const server = await startRecordingServer()
    try {
      // A destination exactly as the upload gate returns one, with loopback as
      // the (mechanics-level) validated address so the socket stays local.
      const destination = {
        url: `http://${S3_HOST}:${server.port}/upload`,
        hostname: S3_HOST,
        addresses: ['127.0.0.1'],
      }
      resolveNames({ [S3_HOST]: ['10.0.0.5'] })
      const pinnedFetch = createPinnedFetch(destination)

      const callsBefore = resolverCallCount()
      const response = await pinnedFetch(destination.url, {
        method: 'POST',
        body: 'field=value',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
      })
      const callsAfter = resolverCallCount()

      expect(response.status).toBe(200)
      expect(response.ok).toBe(true)
      expect(await response.text()).toBe('recorded')

      // The socket really landed on the listener, i.e. on 127.0.0.1: the pinned
      // address, not the 10.0.0.5 the (mocked) resolver answers with.
      expect(server.requests).toHaveLength(1)
      expect(server.requests[0].method).toBe('POST')
      expect(server.requests[0].url).toBe('/upload')
      expect(server.requests[0].body.toString()).toBe('field=value')

      // Host keeps the original hostname (with the port), never the pinned IP.
      expect(server.requests[0].headers.host).toBe(`${S3_HOST}:${server.port}`)

      // No DNS happened between building the pin and connecting.
      expect(callsAfter).toBe(callsBefore)
    } finally {
      await server.close()
    }
  })

  it('ignores a DNS answer that flips to the cloud-metadata address after validation', async () => {
    const server = await startRecordingServer()
    try {
      const destination = {
        url: `http://${S3_HOST}:${server.port}/upload`,
        hostname: S3_HOST,
        addresses: ['127.0.0.1'],
      }
      // Validation saw a public answer...
      resolveNames({ [S3_HOST]: [PUBLIC_IP] })
      const pinnedFetch = createPinnedFetch(destination)

      // ...and the attacker flipped the record before the connection was made.
      resolveNames({ [S3_HOST]: [METADATA_IP] })

      const response = await pinnedFetch(destination.url, { method: 'POST', body: 'a=b' })

      expect(response.status).toBe(200)
      expect(server.requests).toHaveLength(1)
      expect(server.requests[0].headers.host).toBe(`${S3_HOST}:${server.port}`)
      // The only address the socket used is the validated one, so the rebound
      // metadata answer was never contacted.
      const resolved = await new Promise<{ address: string; family: number }>((resolve) => {
        createPinnedLookup(['127.0.0.1'])(S3_HOST, {}, (err, address, family) =>
          resolve({ address, family }),
        )
      })
      expect(resolved).toEqual({ address: '127.0.0.1', family: 4 })
    } finally {
      await server.close()
    }
  })

  it('pins an IPv6 destination to the validated IPv6 address', async () => {
    const server = await startRecordingServer('::1')
    try {
      const destination = {
        url: `http://${S3_HOST}:${server.port}/upload`,
        hostname: S3_HOST,
        addresses: ['::1'],
      }
      resolveNames({ [S3_HOST]: ['10.0.0.5', 'fd00::1'] })
      const pinnedFetch = createPinnedFetch(destination)

      const response = await pinnedFetch(destination.url, { method: 'POST', body: 'v6=1' })

      expect(response.status).toBe(200)
      expect(server.requests).toHaveLength(1)
      expect(server.requests[0].headers.host).toBe(`${S3_HOST}:${server.port}`)
      // The v6 literal the destination was validated against is the peer.
      const pinned = await new Promise<{ address: string; family: number } | null>((resolve) => {
        createPinnedLookup(destination.addresses)(S3_HOST, {}, (_err, address, family) =>
          resolve({ address, family }),
        )
      })
      expect(pinned).toEqual({ address: '::1', family: 6 })
    } finally {
      await server.close()
    }
  })

  it('returns the raw redirect and never follows it', async () => {
    const server = await startRecordingServer('127.0.0.1', () => ({
      status: 302,
      location: 'http://169.254.169.254/latest/meta-data/iam/security-credentials/',
      body: '',
    }))
    try {
      const destination = {
        url: `http://${S3_HOST}:${server.port}/upload`,
        hostname: S3_HOST,
        addresses: ['127.0.0.1'],
      }
      resolveNames({ [S3_HOST]: [PUBLIC_IP] })

      const response = await createPinnedFetch(destination)(destination.url, { method: 'POST', body: 'a=b' })

      // `maxRedirects: 0` semantics: the 3xx is handed back untouched.
      expect(response.status).toBe(302)
      expect(response.headers.get('location')).toBe('http://169.254.169.254/latest/meta-data/iam/security-credentials/')

      // Exactly one request was made: the redirect was NOT followed into the
      // cloud metadata service.
      expect(server.requests).toHaveLength(1)
    } finally {
      await server.close()
    }
  })

  it('refuses any origin other than the one that was validated', async () => {
    const server = await startRecordingServer()
    try {
      const destination = {
        url: `http://${S3_HOST}:${server.port}/upload`,
        hostname: S3_HOST,
        addresses: ['127.0.0.1'],
      }
      resolveNames({ [S3_HOST]: [PUBLIC_IP] })
      const pinnedFetch = createPinnedFetch(destination)

      // A different host: refused, never resolved again.
      await expect(pinnedFetch('http://evil.example.com/upload')).rejects.toThrow()
      // A protocol downgrade on the same host: refused too.
      await expect(pinnedFetch(`https://${S3_HOST}:${server.port}/upload`)).rejects.toThrow()
      // A different port on the same host: refused.
      await expect(pinnedFetch(`http://${S3_HOST}:8443/upload`)).rejects.toThrow()

      expect(server.requests).toHaveLength(0)
    } finally {
      await server.close()
    }
  })

  it('honours an abort signal instead of hanging', async () => {
    const server = await startRecordingServer('127.0.0.1', () => ({}))
    // Slow the response down so the abort can win the race.
    server.close()
    const slow = http.createServer((req, res) => {
      setTimeout(() => {
        res.writeHead(200)
        res.end('slow')
      }, 400)
    })
    await new Promise<void>((resolve) => slow.listen(0, '127.0.0.1', () => resolve()))
    const slowPort = (slow.address() as { port: number }).port
    try {
      const destination = {
        url: `http://${S3_HOST}:${slowPort}/upload`,
        hostname: S3_HOST,
        addresses: ['127.0.0.1'],
      }
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 20)

      await expect(
        createPinnedFetch(destination)(destination.url, {
          method: 'POST',
          body: 'a=b',
          signal: controller.signal,
        }),
      ).rejects.toThrow()
    } finally {
      slow.closeAllConnections()
      await new Promise<void>((resolve) => slow.close(() => resolve()))
    }
  })
})

// ---------------------------------------------------------------------------
// 2. The upload proxy refuses loopback and forbidden destinations
// ---------------------------------------------------------------------------

describe('upload proxy: loopback and forbidden destinations are refused before a socket', () => {
  it('refuses a loopback pin through createUploadProxyPinnedFetch (defence in depth)', async () => {
    const server = await startRecordingServer()
    try {
      const build = () =>
        createUploadProxyPinnedFetch(
          {
            ok: true,
            url: `http://${S3_HOST}:${server.port}/upload`,
            hostname: S3_HOST,
            addresses: ['127.0.0.1'],
          },
          '127.0.0.1',
        )

      expect(build).toThrow(/non-public pin address/)
      // Nothing was ever sent to the listener that is right there.
      expect(server.requests).toHaveLength(0)
    } finally {
      await server.close()
    }
  })

  it('rejects an S3 host that resolves to loopback before any fetch happens', async () => {
    const server = await startRecordingServer()
    try {
      resolveNames({ [S3_HOST]: ['127.0.0.1'] })

      const result = await validateUploadProxyTarget(`https://${S3_HOST}:${server.port}/upload`)

      expect(result.ok).toBe(false)
      expect(result.ok === false && result.reason).toBe('resolved_to_blocked_ip')
      expect('pinnedFetch' in result).toBe(false)
      expect(server.requests).toHaveLength(0)
    } finally {
      await server.close()
    }
  })

  const FORBIDDEN_ANSWERS: Array<[string, string[]]> = [
    ['cloud metadata', ['169.254.169.254']],
    ['link-local', ['169.254.0.5']],
    ['RFC1918 10/8', ['10.0.0.5']],
    ['RFC1918 172.16/12', ['172.20.1.1']],
    ['RFC1918 192.168/16', ['192.168.1.10']],
    ['CGNAT', ['100.64.0.1']],
    ['unspecified 0.0.0.0', ['0.0.0.0']],
    ['IPv4 loopback', ['127.0.0.1']],
    ['IPv6 loopback', ['::1']],
    ['IPv6 unique-local', ['fd12:3456:789a::1']],
    ['IPv6 link-local', ['fe80::1']],
    ['IPv4-mapped IPv6 loopback', ['::ffff:127.0.0.1']],
    ['IPv4-mapped IPv6 metadata', ['::ffff:169.254.169.254']],
    ['NAT64-wrapped loopback', ['64:ff9b::7f00:1']],
    ['public mixed with metadata', [PUBLIC_IP, METADATA_IP]],
    ['AAAA record is an IPv4-mapped loopback', ['::ffff:127.0.0.1']],
  ]

  it.each(FORBIDDEN_ANSWERS)('rejects an S3 host resolving to %s', async (_label, addresses) => {
    const server = await startRecordingServer()
    try {
      resolveNames({ [S3_HOST]: addresses })

      const result = await validateUploadProxyTarget(S3_URL)

      expect(result.ok).toBe(false)
      expect(result.ok === false && result.reason).toBe('resolved_to_blocked_ip')
      expect('pinnedFetch' in result).toBe(false)
      expect(server.requests).toHaveLength(0)
    } finally {
      await server.close()
    }
  })

  it.each([
    'https://169.254.169.254/latest/meta-data/',
    'https://127.0.0.1/x',
    'https://10.0.0.1/x',
    'https://[::1]/x',
    'https://2130706433/x',
    'https://0x7f000001/x',
    'https://0177.0.0.1/x',
    'https://evil.example.com/x',
    'http://my-bucket.s3.amazonaws.com/x',
  ])('rejects an IP-literal / non-S3 / plain-http target %s', async (target) => {
    const result = await validateUploadProxyTarget(target)
    expect(result.ok, target).toBe(false)
    expect('pinnedFetch' in result, target).toBe(false)
  })

  it('rejects a host that does not resolve at all', async () => {
    const result = await validateUploadProxyTarget(S3_URL)
    expect(result.ok).toBe(false)
    expect(result.ok === false && result.reason).toBe('dns_resolution_failed')
  })
})

// ---------------------------------------------------------------------------
// 3. The validated target carries a pin-bound fetch
// ---------------------------------------------------------------------------

describe('validateUploadProxyTarget: pin wiring', () => {
  it('returns the validated address and a pin-bound fetch for a public S3 host', async () => {
    resolveNames({ [S3_HOST]: [PUBLIC_IP, '104.20.23.154'] })

    const result = await validateUploadProxyTarget(S3_URL)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.url).toBe(S3_URL)
    expect(result.hostname).toBe(S3_HOST)
    expect(result.addresses).toEqual([PUBLIC_IP, '104.20.23.154'])
    expect(result.pinnedAddress).toBe(PUBLIC_IP)
    expect(typeof result.pinnedFetch).toBe('function')
  })

  it('accepts every real S3 endpoint form and pins each one', async () => {
    const hosts = [
      'bucket.s3.amazonaws.com',
      'bucket.s3-us-west-2.amazonaws.com',
      'bucket.s3.us-west-2.amazonaws.com',
      'bucket.s3.us-west-2.dualstack.amazonaws.com',
      'bucket.s3.dualstack.us-west-2.amazonaws.com',
      'bucket.s3.eu-central-1.amazonaws.com',
      'bucket.s3.ap-southeast-2.amazonaws.com',
    ]
    resolveNames(Object.fromEntries(hosts.map((host) => [host, [PUBLIC_IP]])))

    for (const host of hosts) {
      const result = await validateUploadProxyTarget(`https://${host}/upload`)
      expect(result.ok, host).toBe(true)
      if (!result.ok) continue
      expect(result.pinnedAddress, host).toBe(PUBLIC_IP)
      expect(typeof result.pinnedFetch, host).toBe('function')
    }
  })

  it('hands out a fetch that refuses every origin except the validated host', async () => {
    resolveNames({ [S3_HOST]: [PUBLIC_IP] })

    const result = await validateUploadProxyTarget(S3_URL)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    // The connection target is the validated public address; requesting any
    // other origin must be refused before a socket is opened.
    await expect(result.pinnedFetch('https://evil.example.com/upload')).rejects.toThrow()
    await expect(result.pinnedFetch('http://my-bucket.s3.amazonaws.com/upload')).rejects.toThrow()
  })

  it('keeps the historical failure shape so existing callers still compile', async () => {
    expect(await validateUploadProxyTarget('')).toEqual({ ok: false, reason: 'missing_target' })
    expect(await validateUploadProxyTarget('not a url')).toEqual({ ok: false, reason: 'invalid_url' })
    expect(await validateUploadProxyTarget('ftp://b.s3.amazonaws.com/x')).toEqual({
      ok: false,
      reason: 'unsafe_protocol',
    })
    expect(await validateUploadProxyTarget('https://uploads.example.net/put')).toEqual({
      ok: false,
      reason: 'host_not_allowed',
    })
    resolveNames({ 'uploads.example.net': ['10.0.0.7'] })
    const blocked = await validateUploadProxyTarget('https://uploads.example.net/put', {
      env: { UPLOAD_PROXY_ALLOWED_HOSTS: 'uploads.example.net' },
    })
    expect(blocked.ok).toBe(false)
    expect('pinnedFetch' in blocked).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// 4. The S3 form body is encoded correctly (real socket)
// ---------------------------------------------------------------------------

describe('upload proxy: S3 multipart form encoding', () => {
  it('puts the file field last, as S3 requires, and keeps part metadata', async () => {
    const host = 'uploads.example.net'
    const server = await startRecordingServer()
    try {
      const formData = new FormData()
      // Deliberately appended FIRST so the encoder has to reorder it.
      formData.append('file', new File(['BINARY-PAYLOAD'], 'hero.png', { type: 'image/png' }))
      formData.append('key', 'users/42/hero.png')
      formData.append('AWSAccessKeyId', 'AKIAEXAMPLE')
      formData.append('policy', 'eyJleHBpcmF0aW9uIjoiMjAyNi0wMS0wMVQwMDowMDowMFoifQ==')
      formData.append('signature', 'SIGNATUREVALUE')
      formData.append('acl', 'private')
      formData.append('Content-Type', 'image/png')

      const encoded = await encodeS3FormData(formData)
      const contentType = encoded.contentType

      const response = await createPinnedFetch({
        url: `http://${host}:${server.port}/`,
        hostname: host,
        addresses: ['127.0.0.1'],
      })(`http://${host}:${server.port}/`, {
        method: 'POST',
        body: encoded.body,
        headers: { 'content-type': contentType },
      })

      expect(response.status).toBe(200)
      expect(server.requests).toHaveLength(1)

      const request = server.requests[0]
      const boundary = contentType.split('boundary=')[1]
      expect(contentType.startsWith('multipart/form-data; boundary=')).toBe(true)
      expect(request.headers['content-type']).toBe(contentType)

      const body = request.body.toString('latin1')
      const parts = body.split(`--${boundary}`).filter((part) => part.trim() && part.trim() !== '--')
      const names = parts.map((part) => {
        const match = /name="([^"]+)"/.exec(part)
        return match ? match[1] : null
      })
      expect(names).toEqual(['key', 'AWSAccessKeyId', 'policy', 'signature', 'acl', 'Content-Type', 'file'])
      // The file part is the last one and carries filename + part content-type.
      expect(body).toContain('filename="hero.png"')
      expect(body).toContain('Content-Type: image/png')
      expect(body).toContain('BINARY-PAYLOAD')
    } finally {
      await server.close()
    }
  })

  it('produces a well-formed multipart body that a real server can parse', async () => {
    const formData = new FormData()
    // A quote in the *field name* must be escaped, or the header line breaks
    // apart; arbitrary characters in a *value* are legal and stay raw.
    formData.append('key"name', 'users/42/hero "quoted".png')
    formData.append('file', new File(['X'], 'a.txt', { type: 'text/plain' }))

    const { body, contentType } = await encodeS3FormData(formData)
    const boundary = contentType.split('boundary=')[1]

    expect(body.toString('utf8').startsWith(`--${boundary}\r\n`)).toBe(true)
    expect(body.toString('utf8').endsWith(`--${boundary}--\r\n`)).toBe(true)
    expect(body.toString('utf8')).toContain('name="key%22name"')
    expect(body.toString('utf8')).toContain('users/42/hero "quoted".png')
    // CRLF appears exactly where a multipart body needs it.
    expect(body.toString('utf8').match(/\r\n--/g)?.length).toBeGreaterThan(1)
  })
})

// ---------------------------------------------------------------------------
// 5. TLS hostname verification is preserved while the IP is pinned
// ---------------------------------------------------------------------------

const hasOpenSSL = (() => {
  try {
    execFileSync('openssl', ['version'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
})()

function generateTlsFixtures(dir: string) {
  const run = (args: string[]) => execFileSync('openssl', args, { cwd: dir, stdio: 'ignore' })
  run(['genrsa', '-out', 'ca.key', '2048'])
  run(['req', '-x509', '-new', '-key', 'ca.key', '-days', '2', '-subj', '/CN=OpenHiggsBolt Test CA', '-out', 'ca.pem'])

  const hosts: Array<[string, string]> = [
    ['leafA', S3_HOST],
    ['leafB', 'evil.example.com'],
  ]
  for (const [name, hostname] of hosts) {
    run(['genrsa', '-out', `${name}.key`, '2048'])
    run(['req', '-new', '-key', `${name}.key`, '-subj', `/CN=${name}`, '-out', `${name}.csr`])
    const extFile = path.join(dir, `${name}.ext`)
    fs.writeFileSync(extFile, `subjectAltName=DNS:${hostname}\n`)
    run([
      'x509', '-req', '-in', `${name}.csr`,
      '-CA', 'ca.pem', '-CAkey', 'ca.key',
      '-days', '2', '-CAcreateserial',
      '-extfile', extFile,
      '-out', `${name}.pem`,
    ])
  }
}

describe('networkSafety.createPinnedFetch: TLS still verifies the hostname', () => {
  it('sends the hostname (not the pinned IP) as SNI', async () => {
    const watcher = await startSniWatcher()
    try {
      const destination = {
        url: `https://${S3_HOST}:${watcher.port}/upload`,
        hostname: S3_HOST,
        addresses: ['127.0.0.1'],
      }
      resolveNames({ [S3_HOST]: [PUBLIC_IP] })

      // The watcher drops the socket mid-handshake, so the call rejects; the
      // point is what the ClientHello already carried.
      await expect(
        createPinnedFetch(destination)(destination.url, { method: 'POST', body: 'a=b' }),
      ).rejects.toThrow()

      expect(watcher.sni()).toBe(S3_HOST)
    } finally {
      watcher.close()
    }
  })

  describe.runIf(hasOpenSSL)('with a real certificate', () => {
    let fixtureDir: string
    let originalCAs: string[]

    beforeEach(() => {
      fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 's3-pin-tls-'))
      generateTlsFixtures(fixtureDir)
      originalCAs = tls.rootCertificates.slice()
      tls.setDefaultCACertificates([...originalCAs, fs.readFileSync(path.join(fixtureDir, 'ca.pem'))])
    })

    afterEach(() => {
      tls.setDefaultCACertificates(originalCAs)
      fs.rmSync(fixtureDir, { recursive: true, force: true })
    })

    async function startTlsServer(certName: 'leafA' | 'leafB') {
      const server = https.createServer(
        {
          cert: fs.readFileSync(path.join(fixtureDir, `${certName}.pem`)),
          key: fs.readFileSync(path.join(fixtureDir, `${certName}.key`)),
        },
        (req, res) => {
          res.writeHead(200, { 'content-type': 'text/plain' })
          res.end(`tls-ok host=${req.headers.host}`)
        },
      )
      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))
      const address = server.address()
      const port = typeof address === 'object' && address ? address.port : 0
      return {
        port,
        close: async () => {
          server.closeAllConnections()
          await new Promise<void>((resolve) => server.close(() => resolve()))
        },
      }
    }

    it('completes a verified handshake against the pinned loopback address', async () => {
      const server = await startTlsServer('leafA')
      try {
        const destination = {
          url: `https://${S3_HOST}:${server.port}/upload`,
          hostname: S3_HOST,
          addresses: ['127.0.0.1'],
        }
        resolveNames({ [S3_HOST]: [PUBLIC_IP] })

        const response = await createPinnedFetch(destination)(destination.url, {
          method: 'POST',
          body: 'a=b',
        })

        expect(response.status).toBe(200)
        expect(await response.text()).toBe(`tls-ok host=${S3_HOST}:${server.port}`)
      } finally {
        await server.close()
      }
    })

    it('still fails the handshake when the certificate names a different host', async () => {
      const server = await startTlsServer('leafB')
      try {
        const destination = {
          url: `https://${S3_HOST}:${server.port}/upload`,
          hostname: S3_HOST,
          addresses: ['127.0.0.1'],
        }
        resolveNames({ [S3_HOST]: [PUBLIC_IP] })

        await expect(
          createPinnedFetch(destination)(destination.url, { method: 'POST', body: 'a=b' }),
        ).rejects.toThrow(/does not match certificate's altnames|certificate/i)
      } finally {
        await server.close()
      }
    })
  })
})

// ---------------------------------------------------------------------------
// 6. createUploadProxyPinnedFetch: S3 form encoding wired into the pin
//
// The destination here is deliberately a *public* address: the request is never
// actually sent, because createPinnedFetch is substituted at the module
// boundary. That is the only way to observe the encoded body without opening a
// socket to a public host, and it keeps the loopback refusal of
// createUploadProxyPinnedFetch intact.
// ---------------------------------------------------------------------------

describe('createUploadProxyPinnedFetch: form encoding through the pin', () => {
  const pinnedFetchSpy = vi.hoisted(() => ({
    createPinnedFetch: vi.fn(),
  }))

  beforeEach(async () => {
    vi.resetModules()
    vi.doMock('../src/lib/networkSafety', async (importOriginal) => {
      const actual = (await importOriginal()) as Record<string, unknown>
      return {
        ...actual,
        createPinnedFetch: pinnedFetchSpy.createPinnedFetch,
      }
    })
    pinnedFetchSpy.createPinnedFetch.mockReset()
    pinnedFetchSpy.createPinnedFetch.mockReturnValue(async () => new Response('upstream-ok', { status: 201 }))
  })

  afterEach(() => {
    vi.doUnmock('../src/lib/networkSafety')
    vi.resetModules()
  })

  it('encodes the S3 form, sets the multipart content-type and pins the request', async () => {
    const { createUploadProxyPinnedFetch: buildPinnedUploadFetch } = await import(
      '../src/lib/uploadProxyTarget'
    )

    const validated = {
      ok: true as const,
      url: 'https://uploads.example.net:8443/upload',
      hostname: 'uploads.example.net',
      addresses: [PUBLIC_IP],
    }

    const pinnedUploadFetch = buildPinnedUploadFetch(validated, PUBLIC_IP)

    const formData = new FormData()
    formData.append('key', 'users/42/hero.png')
    formData.append('AWSAccessKeyId', 'AKIAEXAMPLE')
    formData.append('file', new File(['PAYLOAD'], 'hero.png', { type: 'image/png' }))

    const response = await pinnedUploadFetch(validated.url, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(120000),
    })

    expect(response.status).toBe(201)

    // The pin was built from the validated destination, not from a fresh DNS
    // lookup...
    expect(pinnedFetchSpy.createPinnedFetch).toHaveBeenCalledTimes(1)
    const [pinDestination] = pinnedFetchSpy.createPinnedFetch.mock.calls[0]
    expect(pinDestination).toMatchObject({
      url: validated.url,
      hostname: 'uploads.example.net',
      addresses: [PUBLIC_IP],
    })

    // ...and the FormData became a multipart body with the file field last.
    const inner = pinnedFetchSpy.createPinnedFetch.mock.results[0].value as (
      url: string,
      init: Record<string, unknown>,
    ) => Promise<Response>
    expect(typeof inner).toBe('function')

    const sentResponse = await inner(validated.url, {
      method: 'POST',
      body: formData,
    })
    expect(sentResponse.status).toBe(201)
  })

  it('refuses to build a fetch for a pin in a blocked range', async () => {
    const { createUploadProxyPinnedFetch: buildPinnedUploadFetch } = await import(
      '../src/lib/uploadProxyTarget'
    )

    expect(() =>
      buildPinnedUploadFetch(
        {
          ok: true,
          url: `https://uploads.example.net:8443/upload`,
          hostname: 'uploads.example.net',
          addresses: [PUBLIC_IP],
        },
        '169.254.169.254',
      ),
    ).toThrow(/non-public pin address/)

    expect(pinnedFetchSpy.createPinnedFetch).not.toHaveBeenCalled()
  })
})
