/**
 * SmartVideo GO AI — Netlify release script
 *
 * Implements the gated release process from RELEASE_PROCEDURE.md:
 *   build -> preview deploy (--build) -> smoke tests -> explicit approval
 *   -> unlock production -> production deploy (--build --prod)
 *   -> verify prod sha -> re-lock production
 *
 * NEVER runs `netlify deploy --prod` without --build, and never promotes to
 * production unless --approve-production is passed after preview smoke tests pass.
 *
 * Every shell step runs through ./release-log.mjs (runStage / runDeployStage):
 * the real exit code is preserved (no pipes, no `|| true`), stdout/stderr are
 * captured to <repoRoot>/release/<UTC-timestamp>-<stage>/logs/, and a failure
 * produces release-report.json/md plus a persisted FAILED verdict. This kills
 * the historical false-success bug where a failed build printed
 * "[release] ERROR: Command failed (exit 1)" but the invoking shell pipeline
 * (`| tee release.log`) reported the tee filter's exit status 0 — the verdict
 * is now also persisted on disk and printed as a final `[release] RESULT:` line.
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

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { createReleaseRun, runStage, runDeployStage, finalizeReleaseRun, diagnose, redact } from './release-log.mjs'
import { generateReleaseNotes, buildDeployMessage } from './generate-release-notes.mjs'

const SITE_ID = process.env.NETLIFY_SITE_ID || '76f606a3-8546-440f-8469-33a0236a8a23'
const PROD_URL = 'https://go.smartvid.app'
const VERSION_URL = PROD_URL + '/api/version'
const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const RELEASE_DIR = join(REPO_ROOT, 'release')

const args = process.argv.slice(2)
const previewOnly = args.includes('--preview')
const smokeTest = args.includes('--smoke-test')
const approveProduction = args.includes('--approve-production')
const skipBuild = args.includes('--skip-build')

const problems = []

function log(...msg) {
  console.log(`[release] ${new Date().toISOString()}  ${msg.join(' ')}`)
}

/** Non-stage failure (flow invariant, env, smoke test) that must still name its stage. */
function stageError(stageName, msg) {
  const err = new Error(msg)
  err.stageName = stageName
  return err
}

/** Single-quote a value for safe inclusion in a shell command string. */
function shq(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`
}

function requireEnv(name) {
  if (!process.env[name]) throw stageError('env', `Missing required environment variable: ${name}`)
  return process.env[name]
}

function readStageOut(stage) {
  try {
    return readFileSync(stage.stdoutPath, 'utf8')
  } catch {
    return ''
  }
}

function parseJsonLoose(text) {
  try {
    return JSON.parse(text.trim())
  } catch {
    /* fall through to slice */
  }
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end <= start) throw stageError('get-published-deploy', 'No JSON object found in netlify api output')
  return JSON.parse(text.slice(start, end + 1))
}

function clampMessage(message) {
  return String(message || '').replace(/\s+/g, ' ').trim().slice(0, 119)
}

/** Run a git step as a stage and return its trimmed stdout. */
function gitStage(run, name, cmd) {
  return readStageOut(runStage(run, { name, cmd, cwd: REPO_ROOT })).trim()
}

/** Persist the deploy verdict after EVERY deploy attempt (success or failure). */
function writeLastDeploy(record) {
  mkdirSync(RELEASE_DIR, { recursive: true })
  writeFileSync(join(RELEASE_DIR, 'last-deploy.json'), `${JSON.stringify(record, null, 2)}\n`)
}

function readLastDeploy() {
  try {
    return JSON.parse(readFileSync(join(RELEASE_DIR, 'last-deploy.json'), 'utf8'))
  } catch {
    return null
  }
}

function attemptDeploy(run, options, stageLabel) {
  try {
    const stage = runDeployStage(run, options)
    writeLastDeploy({
      deployId: stage.deployId,
      url: stage.deployUrl,
      sha: run.sha,
      branch: run.branch,
      stage: stageLabel,
      status: 'SUCCEEDED',
      timestamp: new Date().toISOString(),
    })
    return stage
  } catch (err) {
    writeLastDeploy({
      deployId: run.deployId,
      url: run.deployUrl,
      sha: run.sha,
      branch: run.branch,
      stage: stageLabel,
      status: 'FAILED',
      timestamp: new Date().toISOString(),
    })
    throw err
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

/** Read the currently published production commit (release-notes base). Best effort. */
async function fetchPublishedSha() {
  try {
    const res = await fetchWithTimeout(VERSION_URL, {}, 10000)
    if (!res.ok) return null
    try {
      const json = JSON.parse(res.body)
      return String(json.commit || json.sha || '') || null
    } catch {
      return (res.body.match(/\b[0-9a-f]{7,40}\b/) || [null])[0]
    }
  } catch {
    return null
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
    throw stageError('smoke-tests', 'Smoke tests failed. Aborting release.')
  }

  log('All smoke tests passed.')
  return results
}

/** Poll the production version endpoint until it reports the released sha (max ~2 min). */
async function pollProdSha(commit) {
  const deadline = Date.now() + 120000
  while (Date.now() < deadline) {
    try {
      const res = await fetchWithTimeout(VERSION_URL, {}, 15000)
      if (res.ok && (res.body.includes(commit) || res.body.includes(commit.slice(0, 7)))) return true
    } catch {
      /* transient — keep polling */
    }
    await new Promise((resolve) => setTimeout(resolve, 10000))
  }
  throw stageError('verify-production-sha', `Production ${VERSION_URL} did not report sha ${commit} within 2 minutes`)
}

async function runRelease(run, ctx) {
  // 1. Git hygiene (fail closed)
  const dirty = gitStage(run, 'git-status', 'git status --porcelain')
  if (dirty) {
    throw stageError('git-status', `Working tree is not clean. Commit or stash changes before releasing:\n${dirty}`)
  }
  const commit = gitStage(run, 'git-head', 'git rev-parse HEAD')
  const branch = gitStage(run, 'git-branch', 'git rev-parse --abbrev-ref HEAD')
  run.sha = commit
  run.branch = branch
  log(`Releasing commit ${commit} (branch ${branch})`)

  // 2. Approval runs must promote the commit that was already staged: fail closed
  //    BEFORE any netlify call if HEAD no longer matches the last deploy attempt.
  if (approveProduction) {
    const last = readLastDeploy()
    if (last && last.sha && last.sha !== commit) {
      throw stageError(
        'verify-approval-state',
        `--approve-production refused: HEAD ${commit} differs from the last deployed commit ${last.sha} (stage: ${last.stage})`
      )
    }
  }

  // 3. Build (unless skipped)
  if (!skipBuild) {
    log('Running production build (npm run build)')
    runStage(run, { name: 'build', cmd: 'npm run build', cwd: REPO_ROOT })
  } else {
    log('Skipping build (--skip-build)')
  }

  // 4. Release notes (base = currently published commit, before any deploy)
  const baseSha = await fetchPublishedSha()
  let notes = ''
  try {
    notes = String(generateReleaseNotes({ repoRoot: REPO_ROOT, baseSha, headSha: commit, branch }))
  } catch (err) {
    notes = `(release notes generation failed: ${err && err.message})`
    log('WARNING: ' + notes)
  }

  // 5. Preview (draft) deploy — always --build, never --prod here
  ctx.hideWorkspace()
  const netlifyEnv = { NETLIFY_AUTH_TOKEN: requireEnv('NETLIFY_AUTH_TOKEN') }
  const previewMsg = clampMessage(buildDeployMessage(notes, { stage: 'preview', sha: commit }))
  log('Deploying preview (netlify deploy --build) — NOT production')
  const previewStage = attemptDeploy(
    run,
    {
      name: 'deploy-preview',
      cwd: REPO_ROOT,
      env: netlifyEnv,
      cmd: `netlify deploy ${skipBuild ? '' : '--build'} --site ${SITE_ID} --message ${shq(previewMsg)} --skip-functions-cache`,
    },
    'preview'
  )
  const previewUrl = previewStage.deployUrl || run.deployUrl
  if (!previewUrl) log('WARNING: could not parse preview URL from deploy output')

  // 6. Smoke tests against preview
  if (smokeTest || approveProduction) {
    await runSmokeTests(previewUrl || PROD_URL)
  } else {
    log('Skipping smoke tests (--smoke-test not passed).')
  }

  if (!approveProduction) {
    log('STOPPED before production. --approve-production was not provided.')
    log('To promote to production, re-run with: --approve-production')
    if (previewOnly) log('(--preview mode: stopping before production is expected)')
    return {
      summary: `Preview deployed for ${commit}; production NOT touched.`,
      verification: `preview deploy ${previewStage.deployId || 'n/a'} at ${previewUrl || 'n/a'}${smokeTest ? '; smoke tests passed' : ''}`,
      notes,
    }
  }

  // 7. Re-verify HEAD + clean tree immediately before promotion (fail closed)
  const dirty2 = gitStage(run, 'git-status-approval', 'git status --porcelain')
  if (dirty2) throw stageError('git-status-approval', `Working tree changed during release; refusing to promote:\n${dirty2}`)
  const commit2 = gitStage(run, 'git-head-approval', 'git rev-parse HEAD')
  if (commit2 !== commit) {
    throw stageError('git-head-approval', `HEAD moved during release (${commit} -> ${commit2}); refusing to promote.`)
  }

  // 8. Currently published deploy id (needed to unlock production context)
  const siteStage = runStage(run, {
    name: 'get-published-deploy',
    cwd: REPO_ROOT,
    env: netlifyEnv,
    cmd: `netlify api getSite --data ${shq(JSON.stringify({ site_id: SITE_ID }))}`,
  })
  const publishedDeployId = parseJsonLoose(readStageOut(siteStage))?.published_deploy?.id || null
  if (!publishedDeployId) {
    throw stageError('get-published-deploy', 'Could not determine the currently published deploy id from getSite output')
  }
  log(`Currently published deploy: ${publishedDeployId}`)

  // 9. Unlock -> production deploy -> verify sha -> re-lock.
  //    If anything after the unlock fails, RE-LOCK production before exiting.
  const prodMsg = clampMessage(buildDeployMessage(notes, { stage: 'production', sha: commit }))
  let lockTarget = publishedDeployId
  let prodDeployId = null
  let unlocked = false
  try {
    log(`Unlocking production deploy ${publishedDeployId} (immediately before promotion)`)
    runStage(run, {
      name: 'unlock-production',
      cwd: REPO_ROOT,
      env: netlifyEnv,
      cmd: `netlify api unlockDeploy --data ${shq(JSON.stringify({ site_id: SITE_ID, deploy_id: publishedDeployId }))}`,
    })
    unlocked = true

    log('Deploying to PRODUCTION (netlify deploy --build --prod)')
    const prodStage = attemptDeploy(
      run,
      {
        name: 'deploy-production',
        cwd: REPO_ROOT,
        env: netlifyEnv,
        cmd: `netlify deploy ${skipBuild ? '--prod' : '--build --prod'} --site ${SITE_ID} --message ${shq(prodMsg)} --skip-functions-cache`,
      },
      'production'
    )
    prodDeployId = prodStage.deployId || run.deployId
    lockTarget = prodDeployId || publishedDeployId

    log(`Verifying production deployment reports the new sha at ${VERSION_URL}`)
    await pollProdSha(commit)

    runStage(run, {
      name: 'lock-production',
      cwd: REPO_ROOT,
      env: netlifyEnv,
      cmd: `netlify api lockDeploy --data ${shq(JSON.stringify({ site_id: SITE_ID, deploy_id: lockTarget }))}`,
    })
    unlocked = false
  } finally {
    if (unlocked) {
      log('Failure after unlock — re-locking production before exit')
      const relock = runStage(run, {
        name: 'relock-production',
        cwd: REPO_ROOT,
        env: netlifyEnv,
        cmd: `netlify api lockDeploy --data ${shq(JSON.stringify({ site_id: SITE_ID, deploy_id: lockTarget }))}`,
        throwOnFailure: false,
      })
      unlocked = false
      if (!relock.ok) {
        ctx.problems.push(`relock-production failed (exit ${relock.exitCode}) — production is UNLOCKED; lock deploy ${lockTarget} manually`)
      }
    }
  }

  return {
    summary: `Production deploy ${prodDeployId || 'n/a'} promoted and verified for ${commit}.`,
    verification: `preview ${previewStage.deployId || 'n/a'} -> production ${prodDeployId || 'n/a'}; smoke tests passed (preview + production); ${VERSION_URL} reported sha ${commit}`,
    notes,
  }
}

async function main() {
  log('SmartVideo GO AI release script')
  log(`Site: ${SITE_ID}`)

  const run = createReleaseRun({ dir: REPO_ROOT, stage: approveProduction ? 'production' : 'preview', siteId: SITE_ID })

  // pnpm-workspace.yaml makes the Netlify CLI open its interactive monorepo
  // project picker (exits 13). Hide it around every netlify invocation and
  // ALWAYS restore it; a failed restore is recorded in the run's notes.
  const pnpmWorkspace = join(REPO_ROOT, 'pnpm-workspace.yaml')
  const pnpmBackup = join(REPO_ROOT, 'pnpm-workspace.yaml.release-bak')
  let pnpmHidden = false
  const hideWorkspace = () => {
    if (!existsSync(pnpmWorkspace)) return
    renameSync(pnpmWorkspace, pnpmBackup)
    pnpmHidden = true
    log('Hid pnpm-workspace.yaml (renamed to pnpm-workspace.yaml.release-bak) for netlify invocations')
  }
  const restoreWorkspace = () => {
    if (!pnpmHidden) return
    try {
      renameSync(pnpmBackup, pnpmWorkspace)
      pnpmHidden = false
    } catch (err) {
      problems.push(`failed to restore pnpm-workspace.yaml from ${pnpmBackup}: ${err && err.message}`)
    }
  }

  let failure = null
  let outcome = null
  try {
    outcome = await runRelease(run, { hideWorkspace, problems })
  } catch (err) {
    failure = err
  }
  restoreWorkspace()

  const combinedNotes = [outcome?.notes, problems.join('; ')].filter(Boolean).join('\n\n') || undefined

  if (failure) {
    const diagnosis = diagnose(run)
    const failedStage = failure.stage?.name || failure.stageName || 'release'
    const { report } = finalizeReleaseRun(run, {
      status: 'FAILED',
      errorStage: failure.stage || failedStage,
      summary: failure.message,
      notes: combinedNotes,
    })
    const exit = report.failedStageDetail && report.failedStageDetail.exitCode !== null ? ` (exit ${report.failedStageDetail.exitCode})` : ''
    log(`RESULT: FAILED — stage: ${report.failedStage}${exit} — full report: ${run.dir}/release-report.md`)
    if (diagnosis) log(`Diagnosis: ${diagnosis.id} — ${diagnosis.correctiveAction}`)
    process.exitCode = 1
    return
  }

  finalizeReleaseRun(run, {
    status: 'SUCCEEDED',
    summary: outcome.summary,
    verification: outcome.verification,
    notes: combinedNotes,
  })
  log(`RESULT: SUCCEEDED — full report: ${run.dir}/release-report.md`)
}

main().catch((err) => {
  console.error('[release] FATAL:', redact(err && err.stack ? err.stack : err))
  process.exit(1)
})
