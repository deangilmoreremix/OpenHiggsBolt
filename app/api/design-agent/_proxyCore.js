const MUAPI_BASE = 'https://api.muapi.ai'
const TIMEOUT_MS = 30_000
const RETRY_STATUSES = new Set([429, 502, 503, 504])
const BACKOFF_MS = [500, 1000, 2000]
const MAX_ATTEMPTS = 3

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function getApiKey(request) {
  const authHeader = request.headers.get('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  const headerKey = request.headers.get('x-api-key')
  if (headerKey) return headerKey
  const cookieKey = request.cookies.get('muapi_key')?.value
  return cookieKey
}

function cleanHeaders(request) {
  const headers = new Headers(request.headers)
  headers.delete('host')
  headers.delete('connection')
  headers.delete('cookie')
  headers.delete('Authorization')
  headers.delete('x-api-key')
  return headers
}

function buildTargetUrl(pathSegments, queryParams) {
  const path = (pathSegments || []).filter(Boolean).join('/')
  let qs = ''
  if (queryParams && queryParams.length) {
    const u = new URLSearchParams()
    for (const [k, v] of queryParams) u.append(k, v)
    const s = u.toString()
    if (s) qs = `?${s}`
  }
  return `${MUAPI_BASE}/api/v1/creative-agent/${path}${qs}`
}

function backoffDelay(status, response, attemptIdx) {
  if (status === 429 && response) {
    const ra = response.headers.get('Retry-After')
    if (ra) {
      const n = Number(ra)
      if (!Number.isNaN(n)) return n * 1000
      const d = Date.parse(ra)
      if (!Number.isNaN(d)) return Math.max(0, d - Date.now())
    }
  }
  return BACKOFF_MS[Math.min(attemptIdx, BACKOFF_MS.length - 1)]
}

async function runProxy(targetUrl, init, { fetchImpl = fetch } = {}) {
  let res
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    res = await fetchImpl(targetUrl, {
      ...init,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (res.ok) return res
    if (!RETRY_STATUSES.has(res.status) || attempt === MAX_ATTEMPTS) return res
    const wait = backoffDelay(res.status, res, attempt - 1)
    await sleep(wait)
  }
  return res
}

export {
  MUAPI_BASE,
  TIMEOUT_MS,
  RETRY_STATUSES,
  BACKOFF_MS,
  MAX_ATTEMPTS,
  sleep,
  getApiKey,
  cleanHeaders,
  buildTargetUrl,
  backoffDelay,
  runProxy,
}
