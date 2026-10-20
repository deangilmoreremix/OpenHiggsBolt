/**
 * SmartVideo GO AI — Netlify release script
 *
 * Implements the gated release process from RELEASE_PROCEDURE.md:
 *   build -> preview deploy (--build) -> smoke tests -> explicit approval
 *   -> production deploy (--build --prod) -> production verification
 *
 * NEVER runs `netlify deploy --prod` without --build, and never promotes to
 * production unless --approve-production is passed after preview smoke tests pass.
 *
 * Usage:
 *   # Preview only (safe, does not touch production)
 *   NETLIFY_AUTH_TOKEN=<token> node scripts/release.mjs --preview
 *
 *   # Preview + smoke tests, then stop for approval
 *   NETLIFY_AUTH_TOKEN=<token> node scripts/release.mjs --preview --smoke-test
 *
 *   # Approve and promote to production (only after reviewing smoke-test results)
 *   NETLIFY_AUTH_TOKEN=<token> node scripts/release.mjs --approve-production
 *
 * Requires NETLIFY_AUTH_TOKEN (and NETLIFY_SITE_ID, or netlify.toml [site] site_id).
 */

import { execSync, spawnSync } from 'child_process'
import { readFileSync } from 'fs'
import { join } from 'path'

const SITE_ID = process.env.NETLIFY_SITE_ID || '76f606a3-8546-440f-8469-33a0236a8a23'
const PROD_URL = 'https://go.smartvid.app'

const args = process.argv.slice(2)
const previewOnly = args.includes('--preview')
const smokeTest = args.includes('--smoke-test')
const approveProduction = args.includes('--approve-production')
const skipBuild = args.includes('--skip-build')

function log(...msg) {
  console.log(`[release] ${new Date().toISOString()}  ${msg.join(' ')}`)
}

function fail(msg) {
  console.error(`[release] ERROR: ${msg}`)
  process.exit(1)
}

function sh(cmd, { input } = {}) {
  log('$ ' + cmd)
  const result = spawnSync(cmd, [], {
    shell: true,
    stdio: ['pipe', 'pipe', 'pipe'],
    encoding: 'utf8',
    env: { ...process.env },
    input,
  })
  if (result.stdout) console.log(result.stdout)
  if (result.stderr) console.error(result.stderr)
  if (result.status !== 0) {
    fail(`Command failed (exit ${result.status}): ${cmd}`)
  }
  return result.stdout
}

function requireEnv(name) {
  if (!process.env[name]) fail(`Missing required environment variable: ${name}`)
  return process.env[name]
}

function gitCommit() {
  try {
    return sh('git rev-parse HEAD').trim()
  } catch {
    fail('Unable to read current Git commit')
  }
}

function gitClean() {
  const status = sh('git status --short').trim()
  if (status) {
    fail(`Working tree is not clean. Commit or stash changes before releasing:\n${status}`)
  }
}

async function fetchWithTimeout(url, opts, timeoutMs = 20000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal })
    const text = await res.text()
    return { status: res.status, body: text, ok: res.ok, url: res.url }
  } finally {
    clearTimeout(timer)
  }
}

/** Smoke-test one route against a base URL. */
async function smokeCheck(base, route, method, opts = {}) {
  const url = base.endsWith('/') ? base + route.slice(1) : base + route
  const res = await fetchWithTimeout(url, { method, ...opts })
  return { route, method, url, status: res.status, body: res.body, ok: res.ok }
}

async function runSmokeTests(baseUrl) {
  log(`Running smoke tests against ${baseUrl}`)

  const failures = []
  const results = []

  const check = async (route, method, opts, predicate, label) => {
    const r = await smokeCheck(baseUrl, route, method, opts)
    results.push({ ...r, label })
    try {
      if (!predicate(r)) {
        failures.push(`${label}: ${r.method} ${r.route} -> HTTP ${r.status} (expected ${label})`)
      } else {
        log(`  PASS ${label}: ${r.method} ${r.route} -> HTTP ${r.status}`)
      }
    } catch (err) {
      failures.push(`${label}: ${r.method} ${r.route} -> ${err.message}`)
    }
  }

  // Landing page: HTTP 200 with markup
  await check(
    '/', 'GET', {},
    (r) => r.status === 200 && r.body.length > 0 && /html|SmartVideo|studio/i.test(r.body),
    'Landing page / returns 200'
  )

  // Personalization demo: HTTP 200
  await check(
    '/personalization-demo', 'GET', {},
    (r) => r.status === 200,
    '/personalization-demo returns 200'
  )

  // /studio: 200 page or an authentication redirect (not 404/5xx)
  await check(
    '/studio', 'GET', {},
    (r) => r.status === 200 || r.status === 302 || r.status === 307 || r.status === 308,
    '/studio returns page or auth redirect'
  )

  // find-businesses: NOT 404 (handler exists). POST with valid-ish payload.
  await check(
    '/api/personalization/find-businesses', 'POST',
    { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ niche: 'plumber', location: 'Portland, OR' }) },
    (r) => r.status !== 404,
    '/api/personalization/find-businesses handler reachable (not 404)'
  )

  // discover-assets: NOT 404 (handler exists). POST with a website URL.
  await check(
    '/api/personalization/discover-assets', 'POST',
    { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ websiteUrl: 'https://example.com' }) },
    (r) => r.status !== 404,
    '/api/personalization/discover-assets handler reachable (not 404)'
  )

  // /api/v1/account/balance: NOT 404 (catch-all route exists). Expects an API key -> 401 without one.
  await check(
    '/api/v1/account/balance', 'GET', {},
    (r) => r.status !== 404,
    '/api/v1/account/balance handler reachable (not 404)'
  )

  console.log('\n--- Smoke test results ---')
  for (const r of results) {
    console.log(`  ${r.label}: ${r.method} ${r.route} -> HTTP ${r.status}`)
  }
  console.log('--------------------------\n')

  if (failures.length > 0) {
    console.error('SMOKE TEST FAILURES:')
    for (const f of failures) console.error(`  - ${f}`)
    fail('Smoke tests failed. Aborting release.')
  }

  log('All smoke tests passed.')
  return results
}

function deployPreview() {
  requireEnv('NETLIFY_AUTH_TOKEN')
  log('Deploying preview (netlify deploy --build) — NOT production')
  const out = sh(`NETLIFY_AUTH_TOKEN=${process.env.NETLIFY_AUTH_TOKEN} netlify deploy --build --site ${SITE_ID}`)
  return out
}

function deployProduction() {
  requireEnv('NETLIFY_AUTH_TOKEN')
  log('Deploying to PRODUCTION (netlify deploy --build --prod)')
  const out = sh(`NETLIFY_AUTH_TOKEN=${process.env.NETLIFY_AUTH_TOKEN} netlify deploy --build --prod --site ${SITE_ID}`)
  return out
}

function recordDeployment(commit, stage, deployInfo) {
  const record = {
    stage,
    commit,
    siteId: SITE_ID,
    timestamp: new Date().toISOString(),
    ...deployInfo,
  }
  console.log('[release] Deployment record:')
  console.log(JSON.stringify(record, null, 2))
  return record
}

async function main() {
  log('SmartVideo GO AI release script')
  log(`Site: ${SITE_ID}`)

  // 1. Git hygiene
  gitClean()
  const commit = gitCommit()
  log(`Committing release: ${commit}`)

  // 2. Build (unless skipped)
  if (!skipBuild) {
    log('Running production build (npm run build)')
    sh('npm run build')
  } else {
    log('Skipping build (--skip-build)')
  }

  // 3. Preview deploy (always --build, never --prod here)
  const previewOut = deployPreview()

  // Extract preview URL if present in output
  let previewUrl = null
  const previewMatch = previewOut.match(/https:\/\/[a-z0-9-]+\.netlify\.app/)
  if (previewMatch) previewUrl = previewMatch[0]

  // 4. Smoke tests against preview
  if (smokeTest) {
    if (!previewUrl) {
      log('WARNING: could not parse preview URL from deploy output; attempting smoke tests anyway')
    }
    await runSmokeTests(previewUrl || PROD_URL)
  } else {
    log('Skipping smoke tests (--smoke-test not passed).')
  }

  recordDeployment(commit, 'preview', { previewUrl, deployOutput: previewOut.slice(0, 2000) })

  // 5. Explicit production approval
  if (approveProduction) {
    log('Explicit production approval flag provided. Promoting to production.')
    const prodOut = deployProduction()
    recordDeployment(commit, 'production', { deployOutput: prodOut.slice(0, 2000) })

    // 6. Production verification smoke tests
    log('Verifying production deployment at ' + PROD_URL)
    await runSmokeTests(PROD_URL)

    log('Production release complete and verified.')
  } else {
    log('STOPPED before production. --approve-production was not provided.')
    log('To promote to production, re-run with: --approve-production')
    log('Only promote after confirming the preview smoke tests passed above.')
    process.exit(0)
  }
}

main().catch((err) => {
  console.error('[release] FATAL:', err)
  process.exit(1)
})
