/**
 * Local-only Playwright auth bypass (E2E harness).
 *
 * Lets the browser test harness load a few explicitly listed PAGE routes on a
 * developer machine without a live Clerk instance. It is a pure decision
 * function so every condition can be unit-tested (see
 * tests/e2e-auth-bypass.vitest.test.ts) and so production can never reach it.
 *
 * ALL of these must hold, otherwise the bypass is off:
 *   1. NODE_ENV === 'development'            (never 'production' or 'test')
 *   2. E2E_TEST_AUTH_BYPASS === 'true'        (explicit opt-in env flag)
 *   3. the `__e2e_auth_bypass` cookie === '1' (value checked, not just present)
 *   4. the request hostname is localhost / 127.0.0.1 / [::1]
 *   5. forwarding headers never prove locality. The Next dev server itself
 *      stamps x-forwarded-for/-host/-proto on every request, so those are only
 *      tolerated when every value is loopback/local; `forwarded`, `x-real-ip`
 *      and `x-original-host` (never set by the dev server) reject outright, and
 *      any non-loopback x-forwarded-for entry or non-local x-forwarded-host
 *      rejects. Run the server with `-H 127.0.0.1` so non-local clients cannot
 *      connect at all.
 *   6. the pathname is in E2E_BYPASS_ROUTES (exact match)
 *
 * It does NOT authenticate anyone and does NOT touch API routes: protected
 * APIs keep calling Clerk. Tests mock API responses inside the harness.
 */

export const E2E_BYPASS_COOKIE = '__e2e_auth_bypass'

/** Exact page paths the harness may load without Clerk. No API routes. */
export const E2E_BYPASS_ROUTES = Object.freeze(['/personalization-demo'])

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]', '::1'])

// Never emitted by the Next dev server: their presence means a proxy.
const PROXY_ONLY_HEADERS = ['forwarded', 'x-real-ip', 'x-original-host']

const LOOPBACK_ADDRS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1'])

function hostOnly(value) {
  const v = value.trim().toLowerCase()
  return v.startsWith('[') ? v.slice(0, v.indexOf(']') + 1) : v.split(':')[0]
}

/**
 * @param {{
 *   nodeEnv?: string,
 *   flag?: string,
 *   cookieValue?: string,
 *   hostname?: string,
 *   pathname?: string,
 *   headers?: { get(name: string): string | null },
 * }} input
 * @returns {boolean}
 */
export function isE2eAuthBypassAllowed(input) {
  const { nodeEnv, flag, cookieValue, hostname, pathname, headers } = input || {}

  if (nodeEnv !== 'development') return false
  if (flag !== 'true') return false
  if (cookieValue !== '1') return false
  if (typeof hostname !== 'string' || !LOCAL_HOSTNAMES.has(hostname.toLowerCase())) return false
  if (typeof pathname !== 'string' || !E2E_BYPASS_ROUTES.includes(pathname)) return false

  if (headers) {
    for (const name of PROXY_ONLY_HEADERS) {
      if (headers.get(name)) return false
    }
    const xff = headers.get('x-forwarded-for')
    if (xff && !xff.split(',').every((a) => LOOPBACK_ADDRS.has(a.trim().toLowerCase()))) return false
    const xfh = headers.get('x-forwarded-host')
    if (xfh && !xfh.split(',').every((h) => LOCAL_HOSTNAMES.has(hostOnly(h)))) return false
    // The Host header itself must also be local (nextUrl.hostname is derived
    // from it, but check it explicitly so a mismatch is rejected).
    const hostHeader = headers.get('host')
    if (hostHeader) {
      if (!LOCAL_HOSTNAMES.has(hostOnly(hostHeader))) return false
    }
  }
  return true
}

/** Convenience wrapper for a Next.js middleware request. */
export function shouldBypassClerkForE2e(request) {
  return isE2eAuthBypassAllowed({
    nodeEnv: process.env.NODE_ENV,
    flag: process.env.E2E_TEST_AUTH_BYPASS,
    cookieValue: request.cookies.get(E2E_BYPASS_COOKIE)?.value,
    hostname: request.nextUrl.hostname,
    pathname: request.nextUrl.pathname,
    headers: request.headers,
  })
}
