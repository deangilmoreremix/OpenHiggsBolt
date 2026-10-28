const { createClient } = require('@supabase/supabase-js')
const { timingSafeEqual } = require('node:crypto')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
const BUCKET = 'personalization-assets'

// Internal dispatch secret: the capture route forwards `x-internal-service-token`; this worker rejects calls
// that lack it. Fail closed: with no secret configured nothing can prove a call came from the route.
const INTERNAL_FUNCTION_SECRET = process.env.INTERNAL_FUNCTION_SECRET || ''

function internalSecretOk(event) {
  if (!INTERNAL_FUNCTION_SECRET) return false
  const provided = (event.headers || {})['x-internal-service-token']
  if (typeof provided !== 'string' || !provided) return false
  const a = Buffer.from(provided, 'utf8')
  const b = Buffer.from(INTERNAL_FUNCTION_SECRET, 'utf8')
  return a.length === b.length && timingSafeEqual(a, b)
}

/**
 * Motion Studio page capture, run as a background function (the `-background` suffix: the caller gets 202 at
 * once and this keeps running for up to 15 minutes). The capture itself is TypeScript compiled to CommonJS by
 * `scripts/build-motion-capture.mjs` (the literal `require` lets the bundler trace it and its dependencies).
 */
exports.handler = async (event) => {
  if (!internalSecretOk(event)) return { statusCode: 401, body: 'unauthorized' }
  // eslint-disable-next-line global-require
  const worker = require('../lib/motion-capture.cjs')
  let job = null
  try {
    job = worker.parseJobRequest(JSON.parse(event.body || '{}'))
  } catch {
    job = null
  }
  if (!job) return { statusCode: 400, body: 'bad request' }
  const storage = createClient(supabaseUrl, serviceRole).storage.from(BUCKET)
  await worker.runMotionCapture(job, storage)
  return { statusCode: 202 }
}
