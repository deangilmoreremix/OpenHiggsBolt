/**
 * release-log.mjs — staged release logging / failure-report harness.
 *
 * WHY THIS EXISTS
 * ---------------
 * Netlify deploys from this repo used to fail invisibly: the deploy record had
 * no build id, an empty title and an empty commit message, and Netlify showed
 * NO build logs. Locally, `scripts/release.mjs` ran every command through a
 * `sh()` helper that only echoed stdout/stderr to the console and, on failure,
 * called `fail('Command failed (exit N): <cmd>')` — it discarded the stage
 * context, kept no artifact and produced no report.
 *
 * This module makes every failure diagnosable AFTER THE FACT from local
 * artifacts alone, with no Netlify build log required.
 *
 * GUARANTEES
 * ----------
 * 1. Every stage's stdout and stderr are captured SEPARATELY to disk.
 * 2. The real exit code is preserved. The harness never pipes, never appends
 *    `|| true`, and never masks a failure. When the caller's command string
 *    contains a shell pipeline, the harness runs it with `pipefail` so the
 *    reported status is the pipeline's own failing status, not the status of
 *    the trailing filter (`| cat`, `| tail`).
 * 3. Logs and `run.json` are written BEFORE a failure is surfaced, so a hard
 *    crash still leaves a usable artifact.
 * 4. Secret values are never written to any artifact.
 *
 * PUBLIC API
 * ----------
 *   createReleaseRun({ dir, stage, sha, branch, siteId })      -> run
 *   runStage(run, { name, cmd, args, cwd, env, timeoutMs })    -> stage record
 *   runDeployStage(run, { ... })                                -> stage record
 *   finalizeReleaseRun(run, { status, summary, ... })            -> { jsonPath, mdPath, report }
 *   diagnose(runOrText)                                         -> { rootCause, correctiveAction, ... } | null
 *   redact(text, { env, protect })                              -> string
 *
 * FAILURE SEMANTICS (documented contract)
 * ----------------------------------------
 * `runStage` / `runDeployStage` THROW a `ReleaseStageError` when the stage
 * fails (non-zero exit, signal, or timeout). The thrown error carries
 * `.stage` (the stage record), `.exitCode`, `.signal`, `.timedOut` and `.run`.
 * The stage logs and `run.json` are ALWAYS written before the throw.
 *
 * Callers that prefer a non-throwing flow can pass `throwOnFailure: false`,
 * in which case the stage record is returned with `ok: false` and the run's
 * status is set to 'failed'. The exit code is identical either way — a
 * failure is never reported as a success.
 *
 * Typical orchestrator wiring:
 *
 *   import { createReleaseRun, runStage, runDeployStage, finalizeReleaseRun }
 *     from './release-log.mjs'
 *
 *   const run = createReleaseRun({ dir: repoRoot, stage: 'preview', sha, branch, siteId })
 *   try {
 *     runStage(run, { name: 'build', cmd: 'npm run build' })
 *     runDeployStage(run, { name: 'deploy', cmd: 'netlify', args: ['deploy','--build','--site',siteId] })
 *     finalizeReleaseRun(run, { status: 'SUCCEEDED', summary: 'preview deployed' })
 *   } catch (err) {
 *     finalizeReleaseRun(run, {
 *       status: 'FAILED',
 *       summary: err.message,
 *       errorStage: err.stage,
 *       rootCause: err.stage ? diagnose(run)?.rootCause : undefined,
 *     })
 *     throw err
 *   }
 */

import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, realpathSync, renameSync, writeFileSync } from 'node:fs'
import { isAbsolute, join, relative, resolve } from 'node:path'

/* ------------------------------------------------------------------------- */
/* Constants                                                                  */
/* ------------------------------------------------------------------------- */

const REDACTION = '***REDACTED***'

/** Env var names that always indicate a secret value. */
const STRONG_SECRET_NAME = /(TOKEN|SECRET|PASSWORD|PASSWD|CREDENTIAL|DSN|AUTH|PRIVATE)/i
/** Env var names that indicate a secret only when the value looks random. */
const WEAK_SECRET_NAME = /KEY/i

/** Minimum length for a value to be worth masking at all. */
const MIN_SECRET_VALUE_LENGTH = 6

/** Tail sizes used when embedding error output into a report. */
const ERROR_TAIL_LINES = 200
const ERROR_TAIL_CHARS = 8000

/* ------------------------------------------------------------------------- */
/* Redaction                                                                  */
/* ------------------------------------------------------------------------- */

/**
 * Decide whether an env var value should be masked.
 *
 * Strong names (TOKEN/SECRET/PASSWORD/...) are masked at >= 6 chars.
 * Weak names (KEY) are masked only when the value looks random (long, or
 * containing upper-case/digits/symbols) so that ordinary words such as
 * "production" in a `NODE_ENV`-like variable do not shred the report.
 */
function shouldMaskEnvValue(name, value) {
  if (!value) return false
  const v = String(value)
  if (v.length < MIN_SECRET_VALUE_LENGTH) return false
  if (STRONG_SECRET_NAME.test(name)) return true
  if (!WEAK_SECRET_NAME.test(name)) return false
  if (v.length >= 12) return true
  return /[^a-z]/.test(v)
}

/**
 * Redact secret material from a string.
 *
 * Rules:
 *  - env var values whose name matches KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|DSN|AUTH
 *  - "Bearer <token>" / "Basic <token>" / "Token <token>" headers
 *  - "sk-..." keys (>= 12 trailing chars)
 *  - Netlify personal access tokens ("nfp_...")
 *  - Clerk keys ("pk_live_", "pk_test_", "sk_live_", "sk_test_")
 *  - Supabase keys ("sb_secret_", "sb_publishable_")
 *  - JWTs ("eyJ....")
 *  - KEY=/TOKEN=/SECRET=/... assignments
 *  - long hex blobs (> 40 chars) and long base64 blobs (> 40 chars)
 *
 * `options.protect` lists values that MUST survive redaction (git sha, branch,
 * site id, deploy id, deploy url, stage names).
 *
 * @param {unknown} input
 * @param {{ env?: NodeJS.ProcessEnv, protect?: string[] }} [options]
 * @returns {string}
 */
export function redact(input, options = {}) {
  if (input === null || input === undefined) return ''
  let text = typeof input === 'string' ? input : String(input)

  const env = options.env || process.env
  const protectedValues = (options.protect || []).filter((v) => v !== null && v !== undefined && String(v).length >= 6)

  // 1. Protect safe identifiers so a 40-char sha or a deploy id is never masked.
  const placeholders = []
  protectedValues.forEach((value, index) => {
    const v = String(value)
    const placeholder = `__RL_PROTECTED_${index}__`
    placeholders.push({ placeholder, value: v })
    text = text.split(v).join(placeholder)
  })

  // 2. Env var values that look like secrets.
  for (const [name, value] of Object.entries(env || {})) {
    if (!shouldMaskEnvValue(name, value)) continue
    text = text.split(String(value)).join(REDACTION)
  }

  // 3. Shape-based rules.
  text = text.replace(/\b(Bearer|Basic|Token)\s+[A-Za-z0-9._~+/=-]{8,}/gi, (_m, scheme) => `${scheme} ${REDACTION}`)
  text = text.replace(/\bsk-(?:live|test|proj)?[_-]?[A-Za-z0-9_-]{12,}/gi, REDACTION)
  text = text.replace(/\bnfp_[A-Za-z0-9_-]{10,}/g, REDACTION)
  text = text.replace(/\bsb_(?:secret|publishable)_[A-Za-z0-9_-]{10,}/g, REDACTION)
  text = text.replace(/\b(?:pk|sk)_(?:live|test)_[A-Za-z0-9_-]{10,}/g, REDACTION)
  text = text.replace(/\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g, REDACTION)
  text = text.replace(
    /((?:[A-Z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|DSN|AUTH)[A-Z0-9_]*)\s*[=:]\s*)("?)([^\s"',;]{6,})\2/gi,
    (_m, prefix, quote) => `${prefix}${quote}${REDACTION}${quote}`,
  )
  text = text.replace(/\b[0-9a-fA-F]{41,}\b/g, REDACTION)
  text = text.replace(/\b[A-Za-z0-9+/]{41,}={0,2}\b/g, REDACTION)

  // 4. Restore protected identifiers.
  for (const { placeholder, value } of placeholders) {
    text = text.split(placeholder).join(value)
  }

  return text
}

/* ------------------------------------------------------------------------- */
/* Shell helpers                                                              */
/* ------------------------------------------------------------------------- */

const BASH_CANDIDATES = ['/bin/bash', '/usr/bin/bash', '/usr/local/bin/bash']

function findBash() {
  for (const candidate of BASH_CANDIDATES) {
    try {
      if (existsSync(candidate)) return candidate
    } catch {
      /* ignore */
    }
  }
  return null
}

/**
 * True when `/bin/sh` is bash. Only bash honours an inherited
 * `SHELLOPTS=pipefail`; dash (the `/bin/sh` on Debian/Ubuntu hosts and build
 * images) ignores it, so a pipeline inside a nested `sh -c '...'` still
 * reports its trailing filter's status there.
 */
function binShIsBash() {
  try {
    return /bash/.test(realpathSync('/bin/sh'))
  } catch {
    return false
  }
}

/** A nested `sh -c` / `dash -c` invocation inside the command string. */
function hasNestedPosixShell(cmd) {
  return typeof cmd === 'string' && /(^|[\s;&|(])(\/bin\/)?(sh|dash)\s+-c\b/.test(cmd)
}

/**
 * Detect a shell pipeline operator in a command string. Quote-blind on
 * purpose: a `|` inside quotes is usually a pipeline handed to a nested
 * `sh -c '...'`, whose exit status is exactly what must not be masked, and
 * running a genuinely quoted `|` through `pipefail` is harmless. Ignores
 * `||` (logical OR, not a pipe).
 */
export function hasPipeline(cmd) {
  if (typeof cmd !== 'string') return false
  for (let i = 0; i < cmd.length; i += 1) {
    if (cmd[i] === '|') {
      if (cmd[i + 1] === '|') continue // logical OR, not a pipeline
      return true
    }
  }
  return false
}

/**
 * Build the child environment for a shell-mode command.
 * When the command contains a pipeline we ask the shell for `pipefail` so the
 * exit status is the pipeline's own failing status instead of the trailing
 * filter's status. `SHELLOPTS` is exported as well so a nested `sh -c '...'`
 * (bash-family) inherits the same semantics.
 */
function buildShellEnv(baseEnv, piped) {
  const env = { ...baseEnv }
  if (!piped) return env
  const existing = typeof env.SHELLOPTS === 'string' ? env.SHELLOPTS.split(':').filter(Boolean) : []
  if (!existing.includes('pipefail')) existing.push('pipefail')
  env.SHELLOPTS = existing.join(':')
  return env
}

/* ------------------------------------------------------------------------- */
/* Filesystem helpers                                                         */
/* ------------------------------------------------------------------------- */

function pad2(n) {
  return String(n).padStart(2, '0')
}

function sanitizeName(name) {
  return String(name)
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'stage'
}

function utcTimestamp(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, '-')
}

function writeFileAtomic(filePath, contents) {
  const tmp = `${filePath}.tmp-${process.pid}-${Date.now()}`
  writeFileSync(tmp, contents)
  renameSync(tmp, filePath)
}

/* ------------------------------------------------------------------------- */
/* Run creation                                                               */
/* ------------------------------------------------------------------------- */

/**
 * Create a release run directory and the initial `run.json`.
 *
 * Creates `<dir>/release/<UTC-timestamp>-<stage>/` (the repo's .gitignore
 * already ignores `release/`, so these are local diagnostic artifacts and are
 * never committed).
 *
 * @param {{ dir?: string, stage?: string, sha?: string, branch?: string, siteId?: string }} options
 * @returns {object} run
 */
export function createReleaseRun(options = {}) {
  const baseDir = resolve(options.dir || process.cwd())
  const stage = options.stage || 'release'
  const sha = options.sha || null
  const branch = options.branch || null
  const siteId = options.siteId || null

  const releaseRoot = join(baseDir, 'release')
  const stageSlug = sanitizeName(stage)
  let runDir = join(releaseRoot, `${utcTimestamp()}-${stageSlug}`)
  let suffix = 1
  while (existsSync(runDir)) {
    suffix += 1
    runDir = join(releaseRoot, `${utcTimestamp()}-${stageSlug}-${suffix}`)
  }

  const logDir = join(runDir, 'logs')
  mkdirSync(logDir, { recursive: true })

  const run = {
    dir: runDir,
    baseDir,
    logDir,
    runId: runDir.slice(runDir.lastIndexOf('/') + 1),
    stage,
    sha,
    branch,
    siteId,
    startedAt: new Date().toISOString(),
    stages: [],
    deployId: null,
    deployUrl: null,
    status: 'running',
  }

  writeRunJson(run)
  return run
}

/** Serialize a run to `run.json` (atomically, so a crash never leaves a half file). */
export function writeRunJson(run) {
  const payload = {
    schema: 'release-run/1',
    runId: run.runId,
    dir: run.dir,
    stage: run.stage,
    sha: run.sha,
    branch: run.branch,
    siteId: run.siteId,
    startedAt: run.startedAt,
    updatedAt: new Date().toISOString(),
    status: run.status,
    deployId: run.deployId,
    deployUrl: run.deployUrl,
    stages: run.stages.map((s) => ({
      index: s.index,
      name: s.name,
      cmd: s.cmd,
      cwd: s.cwd,
      exitCode: s.exitCode,
      signal: s.signal,
      timedOut: s.timedOut,
      ok: s.ok,
      durationMs: s.durationMs,
      startedAt: s.startedAt,
      finishedAt: s.finishedAt,
      stdoutPath: s.stdoutPath,
      stderrPath: s.stderrPath,
      deployId: s.deployId ?? null,
      deployUrl: s.deployUrl ?? null,
      staleFunctionsCache: s.staleFunctionsCache ?? null,
    })),
  }
  writeFileAtomic(join(run.dir, 'run.json'), `${JSON.stringify(payload, null, 2)}\n`)
  return payload
}

/* ------------------------------------------------------------------------- */
/* Stage execution                                                            */
/* ------------------------------------------------------------------------- */

/** Error thrown when a stage fails. Carries the stage record for reporting. */
export class ReleaseStageError extends Error {
  constructor(message, details = {}) {
    super(message)
    this.name = 'ReleaseStageError'
    this.stage = details.stage || null
    this.run = details.run || null
    this.exitCode = details.exitCode ?? null
    this.signal = details.signal ?? null
    this.timedOut = details.timedOut ?? false
  }
}

function tailText(text, maxLines = ERROR_TAIL_LINES, maxChars = ERROR_TAIL_CHARS) {
  if (!text) return ''
  const lines = text.split('\n')
  const trimmed = lines.length > maxLines ? lines.slice(lines.length - maxLines) : lines
  let out = trimmed.join('\n')
  if (out.length > maxChars) out = `…[truncated]…\n${out.slice(out.length - maxChars)}`
  return out
}

/**
 * Run one stage, capturing stdout and stderr separately.
 *
 * @param {object} run             run object from createReleaseRun()
 * @param {object} options
 * @param {string} options.name    stage name (used for the log file names)
 * @param {string} options.cmd     command (full string when `args` is omitted)
 * @param {string[]} [options.args] argv array; when present the command is run
 *                                 with shell:false (no shell interpretation)
 * @param {string} [options.cwd]   working directory
 * @param {object} [options.env]   extra environment variables (merged over
 *                                 process.env unless inheritEnv is false)
 * @param {boolean} [options.inheritEnv=true]
 * @param {number} [options.timeoutMs]
 * @param {boolean} [options.echo=false]   print captured output to the console
 * @param {boolean} [options.throwOnFailure=true]
 * @param {boolean} [options.strictPipelines=true] refuse to certify a piped
 *                                 command as successful when the exit status
 *                                 cannot be trusted
 * @returns {object} stage record
 */
export function runStage(run, options = {}) {
  if (!run || !run.dir) throw new TypeError('runStage requires a run object created by createReleaseRun()')
  const { name, cmd } = options
  if (!name) throw new TypeError('runStage requires a stage name')
  if (!cmd) throw new TypeError('runStage requires a command')

  const {
    args,
    cwd = process.cwd(),
    env: envOverride = {},
    inheritEnv = true,
    timeoutMs,
    echo = false,
    throwOnFailure = true,
    strictPipelines = true,
  } = options

  const childEnv = {
    ...(inheritEnv ? process.env : {}),
    ...(envOverride || {}),
  }

  const shellMode = !Array.isArray(args)
  const piped = shellMode && hasPipeline(cmd)

  const index = run.stages.length + 1
  const fileBase = `${pad2(index)}-${sanitizeName(name)}`
  const stdoutPath = join(run.logDir, `${fileBase}.stdout.log`)
  const stderrPath = join(run.logDir, `${fileBase}.stderr.log`)

  const startedAtMs = Date.now()
  const startedAt = new Date(startedAtMs).toISOString()

  let result
  let usedBashPipefail = false
  try {
    if (shellMode) {
      const bash = piped ? findBash() : null
      const spawnEnv = buildShellEnv(childEnv, piped)
      if (bash) {
        usedBashPipefail = true
        result = spawnSync(bash, ['-o', 'pipefail', '-c', cmd], {
          cwd,
          env: spawnEnv,
          encoding: 'utf8',
          maxBuffer: 64 * 1024 * 1024,
          timeout: timeoutMs,
          killSignal: 'SIGTERM',
        })
      } else {
        result = spawnSync(cmd, [], {
          cwd,
          env: spawnEnv,
          shell: true,
          encoding: 'utf8',
          maxBuffer: 64 * 1024 * 1024,
          timeout: timeoutMs,
          killSignal: 'SIGTERM',
        })
      }
    } else {
      result = spawnSync(cmd, args, {
        cwd,
        env: childEnv,
        shell: false,
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
        timeout: timeoutMs,
        killSignal: 'SIGTERM',
      })
    }
  } catch (error) {
    result = { status: null, signal: null, stdout: '', stderr: String(error?.message || error), error }
  }

  const finishedAtMs = Date.now()
  const finishedAt = new Date(finishedAtMs).toISOString()
  const durationMs = finishedAtMs - startedAtMs

  const exitCode = typeof result.status === 'number' ? result.status : null
  const signal = result.signal || null
  const timedOut = Boolean(result.error && result.error.code === 'ETIMEDOUT') || (timeoutMs != null && exitCode === null && signal != null)

  const rawStdout = typeof result.stdout === 'string' ? result.stdout : ''
  const rawStderr = typeof result.stderr === 'string' ? result.stderr : ''
  const spawnError = result.error ? String(result.error.message || result.error) : ''

  const protect = [run.sha, run.branch, run.siteId, run.deployId, run.deployUrl, name].filter(Boolean)
  const redactOptions = { env: childEnv, protect }
  const stdout = redact(rawStdout, redactOptions)
  const stderr = redact(rawStderr, redactOptions)
  const stderrWithError = spawnError ? (stderr ? `${stderr}\n${redact(spawnError, redactOptions)}` : redact(spawnError, redactOptions)) : stderr

  writeFileAtomic(stdoutPath, stdout)
  writeFileAtomic(stderrPath, stderrWithError)

  // Exit-status trustworthiness. When bash ran the command with `pipefail`,
  // a zero status IS trustworthy (the pipeline's own failure would surface).
  // Only the fallback shell (no bash available, no pipefail guarantee) can
  // report a trailing filter's status, so only that path is refused.
  let exitCodeTrusted = true
  let unverifiable = false
  if (piped && exitCode === 0 && !usedBashPipefail && strictPipelines) {
    exitCodeTrusted = false
    unverifiable = true
  }
  // Outer bash pipefail does not reach a pipeline inside a nested `sh -c`
  // when /bin/sh is not bash, so that zero status cannot be certified either.
  if (piped && exitCode === 0 && strictPipelines && hasNestedPosixShell(cmd) && !binShIsBash()) {
    exitCodeTrusted = false
    unverifiable = true
  }

  const ok = exitCode === 0 && !timedOut && !unverifiable && !result.error

  const stage = {
    index,
    name,
    cmd: redact(shellMode ? cmd : `${cmd} ${(args || []).join(' ')}`, redactOptions),
    args: Array.isArray(args) ? (args || []).map((a) => redact(a, redactOptions)) : null,
    cwd,
    envKeys: Object.keys(envOverride || {}),
    startedAt,
    finishedAt,
    durationMs,
    exitCode,
    signal,
    timedOut,
    ok,
    piped,
    exitCodeTrusted,
    unverifiableExitStatus: unverifiable,
    spawnError: spawnError || null,
    stdoutPath,
    stderrPath,
    stdoutBytes: Buffer.byteLength(stdout, 'utf8'),
    stderrBytes: Buffer.byteLength(stderrWithError, 'utf8'),
  }

  run.stages.push(stage)
  if (!ok) run.status = 'failed'
  writeRunJson(run)

  if (echo) {
    if (stdout) process.stdout.write(stdout)
    if (stderrWithError) process.stderr.write(stderrWithError)
  }

  if (!ok) {
    const reason = unverifiable
      ? 'exit status could not be verified (piped command without a trustworthy status)'
      : timedOut
        ? 'timed out'
        : signal
          ? `killed by ${signal}`
          : `exit ${exitCode}`
    process.stderr.write(`stage ${name} failed (${reason}) — logs: ${run.dir}\n`)
    if (throwOnFailure) {
      throw new ReleaseStageError(`stage ${name} failed (${reason})`, {
        stage,
        run,
        exitCode,
        signal,
        timedOut,
      })
    }
  } else {
    process.stdout.write(`stage ${name} ok (exit 0, ${durationMs}ms) — logs: ${run.dir}\n`)
  }

  return stage
}

/* ------------------------------------------------------------------------- */
/* Netlify deploy stage                                                       */
/* ------------------------------------------------------------------------- */

const DEPLOY_ID_PATTERNS = [
  /(?:deploy(?:ment)?\s*id)\s*[:=]\s*([0-9a-f]{32})/i,
  /https:\/\/api\.netlify\.com\/api\/v1\/deploys\/([0-9a-f]{32})/i,
  /https:\/\/app\.netlify\.com\/sites\/[^/\s]*\/deploys\/([0-9a-f]{32})/i,
  /https:\/\/[a-z0-9-]*--([0-9a-f]{32})\.netlify\.app/i,
  /\b([0-9a-f]{32})\b/,
]

const DEPLOY_URL_PATTERNS = [
  /website\s*url\s*[:=]\s*(https:\/\/[^\s"']+)/i,
  /draft\s*url\s*[:=]\s*(https:\/\/[^\s"']+)/i,
  /deploy(?:ment)?\s*(?:preview|url)\s*[:=]\s*(https:\/\/[^\s"']+)/i,
  /(https:\/\/[a-z0-9-]+\.netlify\.app[^\s"']*)/i,
]

/**
 * Extract the Netlify deployment id and deploy URL from CLI output.
 * @param {string} text
 * @returns {{ deployId: string|null, deployUrl: string|null }}
 */
export function parseNetlifyDeployOutput(text) {
  const source = typeof text === 'string' ? text : ''
  let deployId = null
  for (const pattern of DEPLOY_ID_PATTERNS) {
    const match = source.match(pattern)
    if (match && match[1]) {
      deployId = match[1]
      break
    }
  }

  let deployUrl = null
  for (const pattern of DEPLOY_URL_PATTERNS) {
    const match = source.match(pattern)
    if (match && match[1]) {
      deployUrl = match[1]
      break
    }
  }

  return { deployId, deployUrl }
}

/**
 * Run a Netlify deploy stage: same contract as runStage, plus deployment
 * id / URL extraction and stale-functions-cache detection.
 *
 * @param {object} run
 * @param {object} options same options as runStage
 * @returns {object} stage record
 */
export function runDeployStage(run, options = {}) {
  const stage = runStage(run, options)

  const raw = [readFileSafe(stage.stdoutPath), readFileSafe(stage.stderrPath)].join('\n')
  const { deployId, deployUrl } = parseNetlifyDeployOutput(raw)
  const staleFunctionsCache = /Deploying functions from cache/i.test(raw)
  const functionsCacheLine = (raw.match(/.*Deploying functions from cache.*/i) || [null])[0]

  stage.deployId = deployId
  stage.deployUrl = deployUrl
  stage.staleFunctionsCache = staleFunctionsCache
  stage.functionsCacheLine = functionsCacheLine

  if (deployId) run.deployId = deployId
  if (deployUrl) run.deployUrl = deployUrl

  writeRunJson(run)
  return stage
}

function readFileSafe(filePath) {
  try {
    return readFileSync(filePath, 'utf8')
  } catch {
    return ''
  }
}

/* ------------------------------------------------------------------------- */
/* Diagnosis                                                                  */
/* ------------------------------------------------------------------------- */

/**
 * Known failure signatures -> { rootCause, correctiveAction }.
 * Order matters: the first match wins.
 */
export const KNOWN_SIGNATURES = [
  {
    id: 'netlify-monorepo-project-picker',
    patterns: [/Detected unsettled top-level await/i, /Select the project you want to work with/i],
    rootCause:
      'The Netlify CLI entered its interactive monorepo project-picker because a workspace file (pnpm-workspace.yaml) was visible, then aborted with "Detected unsettled top-level await" (netlify-cli run.js:86). The CLI never created a deploy, so the deploy record has no build id, an empty title and an empty commit message.',
    correctiveAction:
      'Re-run the deploy non-interactively so the CLI never prompts: pass --site <id> (and --dir <repo>) from a directory whose pnpm-workspace.yaml is not visible, or temporarily hide/rename pnpm-workspace.yaml for the duration of the deploy. Do not rely on the interactive picker in CI.',
  },
  {
    id: 'stale-cached-functions-bundle',
    patterns: [/Cannot find module ['"]next\/dist\/server\/lib\/start-server\.js['"]/i, /Deploying functions from cache/i],
    rootCause:
      'The deployed functions bundle was stale: the Netlify CLI reused a cached functions bundle ("Deploying functions from cache") that still referenced next/dist/server/lib/start-server.js, so every page of the created deploy returned HTTP 502.',
    correctiveAction:
      'Re-run the deploy with --skip-functions-cache so the CLI rebuilds the functions bundle instead of reusing the stale cache.',
  },
  {
    id: 'missing-nextjs-standalone-output',
    patterns: [/does not contain expected Next\.js build output/i],
    rootCause:
      '@netlify/plugin-nextjs could not find the expected Next.js build output: .next/standalone was absent, so the publish directory was rejected.',
    correctiveAction:
      'Produce the standalone output before deploying: next.config.mjs must set output: "standalone" and the build must complete (npm run build) so .next/standalone exists. Confirm with `ls .next/standalone` before running the deploy.',
  },
  {
    id: 'netlify-side-build-exit-2',
    patterns: [/Build script returned non-zero exit code:\s*2/i],
    rootCause:
      'The Netlify-side CI build failed with exit code 2 while building the site; the deploy record therefore carries no build id, an empty title and an empty commit message, and Netlify shows no usable build log.',
    correctiveAction:
      'Reproduce the remote build locally with the same command netlify.toml runs (npm run build:metadata && npm run build:packages && npm run build) and read the local build log, or download the deploy build log from the Netlify API for the deploy id.',
  },
  {
    id: 'production-deploy-locked',
    patterns: [/Deployments are ["“]?locked["”]? for production context/i],
    rootCause:
      'The production deploy context was locked by another in-progress deploy, so the production deploy was refused.',
    correctiveAction:
      'Wait for the in-progress production deploy to finish (or unlock it with `netlify unlock-deploy`) and re-run the release; never force a second production deploy over a locked context.',
  },
]

/**
 * Map known failure signatures in a run (or raw text) to a likely root cause.
 *
 * @param {object|string} input a run object or raw captured text
 * @returns {{ id: string, signature: string, stage: string|null, rootCause: string, correctiveAction: string, evidence: string }|null}
 */
export function diagnose(input) {
  const { text, stageName } = collectDiagnosticText(input)
  if (!text) return null

  for (const signature of KNOWN_SIGNATURES) {
    for (const pattern of signature.patterns) {
      const match = text.match(pattern)
      if (match) {
        return {
          id: signature.id,
          signature: match[0],
          stage: stageName,
          rootCause: signature.rootCause,
          correctiveAction: signature.correctiveAction,
          evidence: tailText(text, 20, 1200),
        }
      }
    }
  }
  return null
}

function collectDiagnosticText(input) {
  if (typeof input === 'string') return { text: input, stageName: null }
  if (!input || !Array.isArray(input.stages)) return { text: '', stageName: null }
  const chunks = []
  let stageName = null
  for (const stage of input.stages) {
    const body = [readFileSafe(stage.stdoutPath), readFileSafe(stage.stderrPath)].filter(Boolean).join('\n')
    if (!body) continue
    chunks.push(`--- stage ${stage.name} (exit ${stage.exitCode}) ---\n${body}`)
    if (!stageName && stage.ok === false) stageName = stage.name
  }
  return { text: chunks.join('\n'), stageName }
}

/* ------------------------------------------------------------------------- */
/* Finalization                                                               */
/* ------------------------------------------------------------------------- */

function relativeToBase(baseDir, filePath) {
  try {
    const rel = relative(baseDir, filePath)
    return rel.startsWith('..') ? filePath : rel
  } catch {
    return filePath
  }
}

/**
 * Write release-report.json and release-report.md for a run.
 *
 * The report NEVER claims success when a stage failed: if any stage has
 * `ok === false`, the status is forced to 'FAILED' regardless of what the
 * caller asked for (`statusOverridden` records that this happened).
 *
 * @param {object} run
 * @param {object} [options]
 * @param {string} [options.status]        'SUCCEEDED' | 'FAILED' | ...
 * @param {string} [options.summary]
 * @param {object|string} [options.errorStage] stage record or stage name
 * @param {string} [options.rootCause]
 * @param {string} [options.correctiveAction]
 * @param {string} [options.verification]
 * @param {string} [options.notes]
 * @returns {{ jsonPath: string, mdPath: string, report: object }}
 */
export function finalizeReleaseRun(run, options = {}) {
  if (!run || !run.dir) throw new TypeError('finalizeReleaseRun requires a run object created by createReleaseRun()')

  const failedStageRecord = run.stages.find((s) => s.ok === false) || null
  const failedStageName =
    (typeof options.errorStage === 'string' ? options.errorStage : options.errorStage?.name) || failedStageRecord?.name || null

  const forcedFailure = Boolean(failedStageRecord)
  let status = (options.status || (forcedFailure ? 'FAILED' : 'SUCCEEDED')).toUpperCase()
  let statusOverridden = false
  if (forcedFailure && status === 'SUCCEEDED') {
    status = 'FAILED'
    statusOverridden = true
  }

  const diagnosis = diagnose(run)
  const rootCause = options.rootCause || (failedStageRecord ? diagnosis?.rootCause : null) || null
  const correctiveAction = options.correctiveAction || (failedStageRecord ? diagnosis?.correctiveAction : null) || null

  const targetStage =
    (options.errorStage && typeof options.errorStage !== 'string' ? options.errorStage : null) ||
    failedStageRecord ||
    run.stages.find((s) => s.name === failedStageName) ||
    null

  const errorOutput = targetStage
    ? {
        stage: targetStage.name,
        exitCode: targetStage.exitCode,
        signal: targetStage.signal,
        timedOut: targetStage.timedOut,
        stream: 'stderr',
        text: tailText(readFileSafe(targetStage.stderrPath) || readFileSafe(targetStage.stdoutPath)),
      }
    : null

  const protect = [run.sha, run.branch, run.siteId, run.deployId, run.deployUrl].filter(Boolean)
  const redactOptions = { env: process.env, protect }

  const report = {
    schema: 'release-report/1',
    timestamp: new Date().toISOString(),
    runId: run.runId,
    stage: run.stage,
    branch: run.branch,
    sha: run.sha,
    siteId: run.siteId,
    deployId: run.deployId,
    deployUrl: run.deployUrl,
    status,
    statusOverridden,
    summary: redact(options.summary || '', redactOptions),
    failedStage: failedStageName,
    failedStageDetail: targetStage
      ? {
          name: targetStage.name,
          exitCode: targetStage.exitCode,
          signal: targetStage.signal,
          timedOut: targetStage.timedOut,
          durationMs: targetStage.durationMs,
          cmd: targetStage.cmd,
          stdoutPath: targetStage.stdoutPath,
          stderrPath: targetStage.stderrPath,
        }
      : null,
    errorOutput,
    rootCause: redact(rootCause || '', redactOptions) || null,
    correctiveAction: redact(correctiveAction || '', redactOptions) || null,
    verification: redact(options.verification || '', redactOptions) || null,
    notes: redact(options.notes || '', redactOptions) || null,
    diagnosis: diagnosis
      ? { id: diagnosis.id, signature: diagnosis.signature, stage: diagnosis.stage }
      : null,
    staleFunctionsCache: run.stages.some((s) => s.staleFunctionsCache) ? true : null,
    stages: run.stages.map((s) => ({
      index: s.index,
      name: s.name,
      cmd: s.cmd,
      cwd: s.cwd,
      exitCode: s.exitCode,
      signal: s.signal,
      timedOut: s.timedOut,
      ok: s.ok,
      piped: s.piped,
      exitCodeTrusted: s.exitCodeTrusted,
      unverifiableExitStatus: s.unverifiableExitStatus ?? false,
      durationMs: s.durationMs,
      startedAt: s.startedAt,
      finishedAt: s.finishedAt,
      stdoutPath: s.stdoutPath,
      stderrPath: s.stderrPath,
      stdoutPathRelative: relativeToBase(run.baseDir, s.stdoutPath),
      stderrPathRelative: relativeToBase(run.baseDir, s.stderrPath),
      deployId: s.deployId ?? null,
      deployUrl: s.deployUrl ?? null,
      staleFunctionsCache: s.staleFunctionsCache ?? null,
    })),
    runDir: run.dir,
  }

  run.status = status
  writeRunJson(run)

  const jsonPath = join(run.dir, 'release-report.json')
  const mdPath = join(run.dir, 'release-report.md')
  writeFileAtomic(jsonPath, `${JSON.stringify(report, null, 2)}\n`)
  writeFileAtomic(mdPath, renderMarkdown(report, run))

  return { jsonPath, mdPath, report }
}

function renderMarkdown(report, run) {
  const lines = []
  const succeeded = report.status === 'SUCCEEDED'

  lines.push(`# Release report — ${report.stage}`)
  lines.push('')
  lines.push(`Status: ${succeeded ? 'SUCCEEDED' : 'FAILED'}`)
  lines.push('')
  lines.push(
    succeeded
      ? '**RESULT: SUCCEEDED** — every stage completed with exit code 0.'
      : `**RESULT: FAILED** — stage \`${report.failedStage}\` did not succeed${
          report.failedStageDetail && report.failedStageDetail.exitCode !== null
            ? ` (exit code ${report.failedStageDetail.exitCode})`
            : ''
        }.`,
  )
  if (report.statusOverridden) {
    lines.push('')
    lines.push('> The requested status was overridden to FAILED because a stage failed. This report never claims success when a stage failed.')
  }
  lines.push('')
  lines.push('## Run')
  lines.push('')
  lines.push('| Field | Value |')
  lines.push('| --- | --- |')
  lines.push(`| Timestamp | ${report.timestamp} |`)
  lines.push(`| Branch | ${report.branch ?? 'n/a'} |`)
  lines.push(`| Git SHA | ${report.sha ?? 'n/a'} |`)
  lines.push(`| Site ID | ${report.siteId ?? 'n/a'} |`)
  lines.push(`| Deploy ID | ${report.deployId ?? 'none'} |`)
  lines.push(`| Deploy URL | ${report.deployUrl ?? 'none'} |`)
  lines.push(`| Run directory | ${report.runDir} |`)
  lines.push(`| Status | ${report.status} |`)
  lines.push(`| Failed stage | ${report.failedStage ?? 'none'} |`)
  lines.push('')

  if (report.summary) {
    lines.push('## Summary')
    lines.push('')
    lines.push(report.summary)
    lines.push('')
  }

  lines.push('## Stages')
  lines.push('')
  lines.push('| # | Stage | Exit code | Duration | Result | stdout log | stderr log |')
  lines.push('| --- | --- | --- | --- | --- | --- | --- |')
  for (const stage of report.stages) {
    const result = stage.ok ? 'ok' : 'FAILED'
    const exit = stage.exitCode === null ? (stage.signal ? `signal ${stage.signal}` : 'n/a') : stage.exitCode
    lines.push(
      `| ${stage.index} | ${stage.name} | ${exit} | ${stage.durationMs}ms | ${result} | \`${stage.stdoutPathRelative}\` | \`${stage.stderrPathRelative}\` |`,
    )
  }
  lines.push('')

  if (report.errorOutput) {
    lines.push('## Error output')
    lines.push('')
    lines.push(`Stage \`${report.errorOutput.stage}\` (exit ${report.errorOutput.exitCode ?? 'n/a'}) — tail of ${report.errorOutput.stream}:`)
    lines.push('')
    lines.push('```')
    lines.push(report.errorOutput.text || '(no output captured)')
    lines.push('```')
    lines.push('')
  }

  lines.push('## Diagnosis')
  lines.push('')
  lines.push(`**Root cause:** ${report.rootCause || 'not diagnosed — inspect the stage logs above'}`)
  lines.push('')
  lines.push(`**Corrective action:** ${report.correctiveAction || 'none recorded'}`)
  lines.push('')
  if (report.diagnosis) {
    lines.push(`Matched signature: \`${report.diagnosis.signature}\` (${report.diagnosis.id})`)
    lines.push('')
  }
  if (report.staleFunctionsCache) {
    lines.push('> Stale functions cache detected: the CLI printed "Deploying functions from cache". Re-run with --skip-functions-cache.')
    lines.push('')
  }

  lines.push('## Verification')
  lines.push('')
  lines.push(report.verification || 'not recorded')
  lines.push('')

  lines.push('## Notes')
  lines.push('')
  lines.push(report.notes || 'none')
  lines.push('')

  return `${lines.join('\n')}\n`
}
