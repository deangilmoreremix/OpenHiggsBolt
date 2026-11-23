/**
 * release-log.test.mjs — tests for the staged release logging / failure-report
 * harness (scripts/release-log.mjs).
 *
 * Run with vitest. NOTE: the repository's vitest.config.ts `include` list does
 * not currently cover files under scripts, so this file must be run with an
 * explicit config, e.g.
 *
 *   npx vitest run --config /tmp/vitest-scripts.config.mjs
 *
 * where that config's test.include covers scripts/__tests__.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  createReleaseRun,
  diagnose,
  finalizeReleaseRun,
  parseNetlifyDeployOutput,
  redact,
  runDeployStage,
  runStage,
} from '../release-log.mjs'

let workDir

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), 'release-log-test-'))
})

afterEach(() => {
  try {
    rmSync(workDir, { recursive: true, force: true })
  } catch {
    /* best effort */
  }
})

function makeRun(stage = 'test') {
  return createReleaseRun({
    dir: workDir,
    stage,
    sha: 'a'.repeat(40),
    branch: 'chore/release-harness',
    siteId: '76f606a3-8546-440f-8469-33a0236a8a23',
  })
}

/** Write a small node script into the temp workdir and return its path. */
function script(name, body) {
  const file = join(workDir, name)
  writeFileSync(file, body, 'utf8')
  return file
}

function read(path) {
  return readFileSync(path, 'utf8')
}

describe('createReleaseRun', () => {
  it('creates <dir>/release/<timestamp>-<stage> and writes run.json immediately', () => {
    const run = makeRun('verification')

    expect(existsSync(join(workDir, 'release'))).toBe(true)
    expect(run.dir.startsWith(join(workDir, 'release'))).toBe(true)
    expect(run.dir).toMatch(/release\/\d{4}-\d{2}-\d{2}T[\d-]+Z-verification/)
    expect(run.stage).toBe('verification')
    expect(run.sha).toBe('a'.repeat(40))
    expect(run.branch).toBe('chore/release-harness')
    expect(run.siteId).toBe('76f606a3-8546-440f-8469-33a0236a8a23')
    expect(run.status).toBe('running')
    expect(run.deployId).toBeNull()
    expect(run.stages).toEqual([])

    // A hard crash right after creation still leaves a usable artifact.
    expect(existsSync(join(run.dir, 'run.json'))).toBe(true)
    const runJson = JSON.parse(read(join(run.dir, 'run.json')))
    expect(runJson.status).toBe('running')
    expect(runJson.sha).toBe('a'.repeat(40))
  })
})

describe('runStage failure reporting', () => {
  it('(a) reports FAILED, names the failed stage and exit code, and keeps the real stderr', () => {
    const run = makeRun('verification')
    const failing = script('fail.js', "process.stderr.write('ERROR: next build blew up\\n'); process.exit(3)\n")

    let thrown = null
    try {
      runStage(run, { name: 'build', cmd: `node ${failing}` })
    } catch (err) {
      thrown = err
    }

    expect(thrown).toBeTruthy()
    expect(thrown.name).toBe('ReleaseStageError')
    expect(thrown.stage.exitCode).toBe(3)

    const { jsonPath, mdPath, report } = finalizeReleaseRun(run, {
      status: 'FAILED',
      summary: 'build stage failed',
    })

    expect(report.status).toBe('FAILED')
    expect(report.failedStage).toBe('build')
    expect(report.failedStageDetail.exitCode).toBe(3)
    expect(read(jsonPath)).toContain('ERROR: next build blew up')
    expect(read(mdPath)).toContain('Status: FAILED')
    expect(read(mdPath)).toContain('RESULT: FAILED')
    expect(read(mdPath)).toContain('`build`')
    expect(read(mdPath)).toContain('exit code 3')
    expect(read(mdPath)).toContain('ERROR: next build blew up')
  })

  it('(b) reports SUCCEEDED for a successful command', () => {
    const run = makeRun('verification')
    const ok = script('ok.js', "process.stdout.write('all good\\n'); process.exit(0)\n")

    const stage = runStage(run, { name: 'build', cmd: `node ${ok}` })
    expect(stage.ok).toBe(true)
    expect(stage.exitCode).toBe(0)

    const { jsonPath, mdPath, report } = finalizeReleaseRun(run, { status: 'SUCCEEDED', summary: 'all good' })
    expect(report.status).toBe('SUCCEEDED')
    expect(report.failedStage).toBeNull()
    expect(read(mdPath)).toContain('Status: SUCCEEDED')
    expect(read(mdPath)).toContain('RESULT: SUCCEEDED')
    expect(read(jsonPath)).toContain('"status": "SUCCEEDED"')
  })

  it('(c) preserves the exact exit code of a failing command (exit 7)', () => {
    const run = makeRun('verification')
    const exit7 = script('exit7.js', 'process.exit(7)\n')

    let thrown = null
    try {
      runStage(run, { name: 'verify', cmd: `node ${exit7}` })
    } catch (err) {
      thrown = err
    }

    expect(thrown).toBeTruthy()
    expect(thrown.exitCode).toBe(7)
    expect(thrown.stage.exitCode).toBe(7)

    const { report } = finalizeReleaseRun(run, { status: 'FAILED' })
    expect(report.failedStageDetail.exitCode).toBe(7)
    expect(report.status).toBe('FAILED')
  })

  it('(d) does not report success for a masked pipeline exit status', () => {
    const run = makeRun('verification')

    let thrown = null
    try {
      runStage(run, { name: 'piped', cmd: "sh -c 'exit 3 | cat'" })
    } catch (err) {
      thrown = err
    }

    expect(thrown).toBeTruthy()
    const stage = thrown.stage
    expect(stage.piped).toBe(true)
    expect(stage.ok).toBe(false)

    // Either the harness surfaced the inner failure (pipefail -> exit 3) or it
    // refused to certify the unverifiable status. Both are "not a success".
    expect(stage.exitCode === 3 || stage.unverifiableExitStatus === true).toBe(true)

    const { mdPath, report } = finalizeReleaseRun(run, { status: 'FAILED' })
    expect(report.status).toBe('FAILED')
    expect(report.failedStage).toBe('piped')
    expect(read(mdPath)).toContain('Status: FAILED')
    expect(read(mdPath)).not.toContain('RESULT: SUCCEEDED')
  })

  it('(d2) surfaces a directly piped failure as exit 3, not the trailing filter status', () => {
    const run = makeRun('verification')

    let thrown = null
    try {
      runStage(run, { name: 'piped-direct', cmd: 'exit 3 | cat' })
    } catch (err) {
      thrown = err
    }

    expect(thrown).toBeTruthy()
    expect(thrown.exitCode).toBe(3)
  })

  it('(e) redacts secret values in the log file and in the report', () => {
    const run = makeRun('verification')
    const secret = 'supersecrettoken9182736455'
    const leaky = script(
      'leak.js',
      [
        "process.stderr.write('using NETLIFY_AUTH_TOKEN=' + process.env.NETLIFY_AUTH_TOKEN + '\\n')",
        "process.stderr.write('Authorization: Bearer abcdefghijklmnopqrstuvwxyz012345\\n')",
        "process.stderr.write('key sk-ABCDEFGHIJKLMNOPQRSTUVWXYZ012345\\n')",
        'process.exit(1)',
      ].join('\n'),
    )

    try {
      runStage(run, { name: 'deploy', cmd: `node ${leaky}`, env: { NETLIFY_AUTH_TOKEN: secret } })
    } catch {
      /* expected */
    }

    const stderrLog = read(join(run.dir, 'logs', '01-deploy.stderr.log'))
    expect(stderrLog).not.toContain(secret)
    expect(stderrLog).toContain('***REDACTED***')
    expect(stderrLog).not.toContain('abcdefghijklmnopqrstuvwxyz012345')
    expect(stderrLog).not.toContain('sk-ABCDEFGHIJKLMNOPQRSTUVWXYZ012345')

    const { jsonPath, mdPath } = finalizeReleaseRun(run, { status: 'FAILED' })
    for (const artifact of [read(jsonPath), read(mdPath), read(join(run.dir, 'run.json'))]) {
      expect(artifact).not.toContain(secret)
      expect(artifact).not.toContain('abcdefghijklmnopqrstuvwxyz012345')
    }
    expect(read(jsonPath)).toContain('***REDACTED***')
  })

  it('never claims success when a stage failed, even if SUCCEEDED was requested', () => {
    const run = makeRun('verification')
    const fail = script('fail2.js', 'process.exit(4)\n')
    try {
      runStage(run, { name: 'build', cmd: `node ${fail}` })
    } catch {
      /* expected */
    }

    const { mdPath, report } = finalizeReleaseRun(run, { status: 'SUCCEEDED' })
    expect(report.status).toBe('FAILED')
    expect(report.statusOverridden).toBe(true)
    expect(read(mdPath)).toContain('Status: FAILED')
    expect(read(mdPath)).not.toContain('RESULT: SUCCEEDED')
  })
})

describe('diagnose', () => {
  it('(f) maps the monorepo project-picker signature', () => {
    const run = makeRun('verification')
    const picker = script(
      'picker.js',
      [
        "process.stderr.write('Select the project you want to work with\\n')",
        "process.stderr.write('Error: Detected unsettled top-level await\\n')",
        'process.exit(13)',
      ].join('\n'),
    )
    try {
      runStage(run, { name: 'deploy', cmd: `node ${picker}` })
    } catch {
      /* expected */
    }

    const diagnosis = diagnose(run)
    expect(diagnosis).toBeTruthy()
    expect(diagnosis.id).toBe('netlify-monorepo-project-picker')
    expect(diagnosis.rootCause).toMatch(/monorepo/i)
    expect(diagnosis.correctiveAction).toMatch(/--site/)
    expect(diagnosis.correctiveAction).toMatch(/pnpm-workspace/i)

    const { report } = finalizeReleaseRun(run, { status: 'FAILED' })
    expect(report.rootCause).toMatch(/monorepo/i)
    expect(report.correctiveAction).toMatch(/--site/)
  })

  it('(f) maps the stale cached functions bundle signature', () => {
    const run = makeRun('verification')
    const stale = script(
      'stale.js',
      [
        "process.stdout.write('Deploying functions from cache\\n')",
        "process.stderr.write(\"Error: Cannot find module 'next/dist/server/lib/start-server.js'\\n\")",
        'process.exit(1)',
      ].join('\n'),
    )
    try {
      runStage(run, { name: 'deploy', cmd: `node ${stale}` })
    } catch {
      /* expected */
    }

    const diagnosis = diagnose(run)
    expect(diagnosis).toBeTruthy()
    expect(diagnosis.id).toBe('stale-cached-functions-bundle')
    expect(diagnosis.correctiveAction).toMatch(/--skip-functions-cache/)

    const { report } = finalizeReleaseRun(run, { status: 'FAILED' })
    expect(report.rootCause).toMatch(/stale/i)
    expect(report.correctiveAction).toMatch(/--skip-functions-cache/)
  })

  it('maps the remaining known signatures', () => {
    const missing = diagnose("Your publish directory does not contain expected Next.js build output")
    expect(missing.id).toBe('missing-nextjs-standalone-output')
    expect(missing.correctiveAction).toMatch(/standalone/)

    const build2 = diagnose('Build script returned non-zero exit code: 2')
    expect(build2.id).toBe('netlify-side-build-exit-2')
    expect(build2.correctiveAction).toMatch(/build/)

    const locked = diagnose('Deployments are "locked" for production context')
    expect(locked.id).toBe('production-deploy-locked')
    expect(locked.correctiveAction).toMatch(/unlock/i)

    expect(diagnose('nothing recognisable here')).toBeNull()
  })
})

describe('runDeployStage', () => {
  it('(g) extracts a deploy id and deploy url from fake CLI output', () => {
    const run = makeRun('preview')
    const fakeCli = script(
      'netlify.js',
      [
        "process.stdout.write('Netlify CLI v17.20.0\\n')",
        "process.stdout.write('Deploying functions from cache\\n')",
        "process.stdout.write('Deploy ID: 5f3a9b2c1d4e6f708192a3b4c5d6e7f8\\n')",
        "process.stdout.write('Website URL: https://5f3a9b2c1d4e6f708192a3b4c5d6e7f8--smartvid.netlify.app\\n')",
        'process.exit(0)',
      ].join('\n'),
    )

    const stage = runDeployStage(run, { name: 'deploy', cmd: `node ${fakeCli}` })

    expect(stage.deployId).toBe('5f3a9b2c1d4e6f708192a3b4c5d6e7f8')
    expect(stage.deployUrl).toBe('https://5f3a9b2c1d4e6f708192a3b4c5d6e7f8--smartvid.netlify.app')
    expect(stage.staleFunctionsCache).toBe(true)
    expect(run.deployId).toBe('5f3a9b2c1d4e6f708192a3b4c5d6e7f8')
    expect(run.deployUrl).toBe('https://5f3a9b2c1d4e6f708192a3b4c5d6e7f8--smartvid.netlify.app')

    const { report } = finalizeReleaseRun(run, { status: 'SUCCEEDED' })
    expect(report.deployId).toBe('5f3a9b2c1d4e6f708192a3b4c5d6e7f8')
    expect(report.staleFunctionsCache).toBe(true)
  })

  it('parses a deploy id embedded in a deploy-preview URL', () => {
    const parsed = parseNetlifyDeployOutput(
      'Deploy log: https://app.netlify.com/sites/smartvid/deploys/5f3a9b2c1d4e6f708192a3b4c5d6e7f8',
    )
    expect(parsed.deployId).toBe('5f3a9b2c1d4e6f708192a3b4c5d6e7f8')
  })
})

describe('redact', () => {
  it('masks secret-shaped values but keeps the sha, branch and deploy id', () => {
    const sha = 'b'.repeat(40)
    const out = redact(
      [
        `sha=${sha}`,
        'branch=chore/release-harness',
        'deploy=5f3a9b2c1d4e6f708192a3b4c5d6e7f8',
        'token=sk-ABCDEFGHIJKLMNOPQRSTUVWXYZ012345',
        'nfp_0123456789abcdefghijklmnopqrstuvwxyz',
        'bearer Bearer abcdefghijklmnopqrstuvwxyz012345',
      ].join('\n'),
      { env: {}, protect: [sha, 'chore/release-harness', '5f3a9b2c1d4e6f708192a3b4c5d6e7f8'] },
    )

    expect(out).toContain(sha)
    expect(out).toContain('chore/release-harness')
    expect(out).toContain('5f3a9b2c1d4e6f708192a3b4c5d6e7f8')
    expect(out).not.toContain('sk-ABCDEFGHIJKLMNOPQRSTUVWXYZ012345')
    expect(out).not.toContain('nfp_0123456789abcdefghijklmnopqrstuvwxyz')
    expect(out).toContain('***REDACTED***')
  })

  it('masks env var values whose name looks secret', () => {
    const out = redact('value=abc123def456ghi789', { env: { MY_SECRET_TOKEN: 'abc123def456ghi789' } })
    expect(out).not.toContain('abc123def456ghi789')
    expect(out).toContain('***REDACTED***')
  })
})
