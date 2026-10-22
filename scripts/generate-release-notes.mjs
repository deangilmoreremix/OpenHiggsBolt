/**
 * generate-release-notes.mjs — automatic release-notes generator for the
 * Netlify release workflow.
 *
 * WHY THIS EXISTS
 * ---------------
 * `scripts/release.mjs` calls `netlify deploy --build` without `--message`,
 * so every deploy record shows an empty title / commit message. This module
 * generates release notes from the REAL change set (git diff + git log between
 * the last deployed sha and the release head) — never invented — and derives
 * a single-line deploy message for `netlify deploy --message`.
 *
 * PUBLIC API
 * ----------
 *   generateReleaseNotes({ repoRoot, baseSha, headSha, deployId, deployUrl,
 *                          stage, status, verification, knownIssues,
 *                          rollback, testResults, ... }) -> markdown string
 *     (also written to docs/releases/<YYYY-MM-DD>-<short-sha>.md unless
 *      writeFile: false)
 *   buildDeployMessage(notes, { stage, sha, deployId }) -> one line < 120 chars
 *   categorizeChanges(changedFiles, commitSubjects, mentions?) ->
 *     { features, fixes, personalization, businessAssets, videoMotion,
 *       apiBackend, other }
 *
 * CLI
 * ---
 *   node scripts/generate-release-notes.mjs --repoRoot . --baseSha <sha> \
 *     --headSha <sha> [--stage PROD] [--deployId id] [--deployUrl url] \
 *     [--status ready] [--branch b]
 *   Prints the generated markdown to stdout and writes the docs/releases file.
 */

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

// ---------------------------------------------------------------------------
// git helpers
// ---------------------------------------------------------------------------

function git(repoRoot, args) {
  return execFileSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
}

/** Base sha resolution order: explicit arg -> release/last-deploy.json ->
 *  merge-base with the default branch. */
export function resolveBaseSha(repoRoot) {
  const lastDeployPath = join(repoRoot, 'release', 'last-deploy.json')
  if (existsSync(lastDeployPath)) {
    try {
      const data = JSON.parse(readFileSync(lastDeployPath, 'utf8'))
      const base = data.baseSha || data.base || data.lastDeployedSha || data.sha
      if (base) return base
    } catch {
      /* fall through to merge-base */
    }
  }
  try {
    const defaultBranch = git(repoRoot, [
      'symbolic-ref',
      '--short',
      'refs/remotes/origin/HEAD',
    ]).trim()
    return git(repoRoot, ['merge-base', defaultBranch, 'HEAD']).trim()
  } catch {
    for (const candidate of ['main', 'master']) {
      try {
        return git(repoRoot, ['merge-base', candidate, 'HEAD']).trim()
      } catch {
        /* try next */
      }
    }
  }
  throw new Error(
    'Unable to resolve base sha: no release/last-deploy.json and no default branch found',
  )
}

function changedFilesWithStatus(repoRoot, baseSha, headSha) {
  const out = git(repoRoot, ['diff', '--name-status', `${baseSha}..${headSha}`])
  const files = []
  for (const line of out.split('\n')) {
    if (!line.trim()) continue
    const [status, ...paths] = line.split('\t')
    for (const p of paths) files.push({ status, path: p })
  }
  return files
}

function commitSubjects(repoRoot, baseSha, headSha) {
  const out = git(repoRoot, [
    'log',
    '--no-merges',
    '--pretty=format:%s',
    `${baseSha}..${headSha}`,
  ])
  return out.split('\n').map((s) => s.trim()).filter(Boolean)
}

function headCommitDate(repoRoot, headSha) {
  try {
    return git(repoRoot, ['show', '-s', '--format=%cd', '--date=short', headSha]).trim()
  } catch {
    return new Date().toISOString().slice(0, 10)
  }
}

function shortSha(repoRoot, sha) {
  try {
    return git(repoRoot, ['rev-parse', '--short=9', sha]).trim()
  } catch {
    return String(sha).slice(0, 9)
  }
}

function currentBranch(repoRoot) {
  try {
    return git(repoRoot, ['rev-parse', '--abbrev-ref', 'HEAD']).trim()
  } catch {
    return 'unknown'
  }
}

// ---------------------------------------------------------------------------
// Categorization
// ---------------------------------------------------------------------------

const FEATURE_RE = /^(feat|feature|add|implement|support)\b/i
const FIX_RE = /^(fix|fix\(|bug|hotfix|revert|repair)\b/i

const PERSONALIZATION_PATH_RULES = [
  /(^|\/)src\/shared\/personalization\//,
  /(^|\/)components\/PersonalizationModal/,
  /(^|\/)components\/DemoPersonalizeProvider/,
  /(^|\/)src\/apps\/[^/]+\/Personalization/,
  /(^|\/)app\/personalization-demo\//,
]
const BUSINESS_ASSETS_PATH_RULES = [
  /(^|\/)app\/api\/personalization\/discover-assets\//,
  /(^|\/)app\/api\/personalization\/find-businesses\//,
  /(^|\/)app\/api\/personalization\/research-business\//,
  /(^|\/)src\/shared\/personalization\/[^/]*business[^/]*\//i,
  /(^|\/)(BusinessFinder|BusinessAsset)[^/]*$/i,
]
const VIDEO_MOTION_PATH_RULES = [
  /(^|\/)packages\/studio\/src\/components\/(VideoStudio\.jsx|MotionControlStudio\.jsx|MotionStudio[^/]*|VibeMotionStudio\.jsx)$/,
  /(^|\/)src\/apps\/(video-studio|motion-studio)\//,
  /(^|\/)packages\/studio\/src\/(models\.js|modelFamilies\.js|groupedVideoModels\.js|videoWorkflows\.js|videoToolCapabilities\.js|videoModelCopy\.js|seedanceModels\.js|veoModels\.js)$/,
]
const API_BACKEND_PATH_RULES = [
  /(^|\/)app\/api\//,
  /(^|\/)packages\/studio\/src\/muapi\.js$/,
  /(^|\/)packages\/studio\/src\/lib\//,
  /(^|\/)netlify\/functions\//,
  /(^|\/)supabase\//,
]

const matchesAny = (path, rules) => rules.some((re) => re.test(path))

/**
 * Pure categorization of a change set.
 *
 * @param {string[]} changedFiles  changed paths
 * @param {string[]} commitSubjects  commit subjects (git log --no-merges %s)
 * @param {{ personalization?: string[], businessAssets?: string[] }} [mentions]
 *   Optional: files whose diff CONTENT mentions personalization
 *   (openPersonalize/PersonalizationModal/buildStudioMediaSource/
 *   useDemoPersonalize) or business-asset-finder
 *   (find-businesses/discover-assets/research-business) identifiers.
 */
export function categorizeChanges(changedFiles, commitSubjects, mentions = {}) {
  const files = changedFiles || []
  const subjects = commitSubjects || []

  const inBucket = (path, rules, mentionKey) =>
    matchesAny(path, rules) || (mentions[mentionKey] || []).includes(path)

  const pathCategorized = (f) =>
    matchesAny(f, PERSONALIZATION_PATH_RULES) ||
    matchesAny(f, BUSINESS_ASSETS_PATH_RULES) ||
    matchesAny(f, VIDEO_MOTION_PATH_RULES) ||
    matchesAny(f, API_BACKEND_PATH_RULES)

  return {
    features: subjects.filter((s) => FEATURE_RE.test(s)),
    fixes: subjects.filter((s) => FIX_RE.test(s)),
    personalization: files.filter((f) => inBucket(f, PERSONALIZATION_PATH_RULES, 'personalization')),
    businessAssets: files.filter((f) => inBucket(f, BUSINESS_ASSETS_PATH_RULES, 'businessAssets')),
    videoMotion: files.filter((f) => matchesAny(f, VIDEO_MOTION_PATH_RULES)),
    apiBackend: files.filter((f) => matchesAny(f, API_BACKEND_PATH_RULES)),
    other: [
      ...subjects.filter((s) => !FEATURE_RE.test(s) && !FIX_RE.test(s)),
      ...files.filter((f) => !pathCategorized(f)),
    ],
  }
}

// ---------------------------------------------------------------------------
// Redaction
// ---------------------------------------------------------------------------

const SECRET_ENV_NAME_RE = /\b([A-Z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD|CREDENTIALS?)[A-Z0-9_]*)\s*[=:]\s*\S+/gi

/** Redact secret-looking values. Metadata (git shas, deploy ids) is appended
 *  AFTER redaction so shas survive; this only scrubs change-derived text. */
export function redactSecrets(text) {
  if (!text) return text
  return String(text)
    .replace(/sk-[A-Za-z0-9_-]{16,}/g, '[REDACTED_KEY]')
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/gi, 'Bearer [REDACTED]')
    .replace(/\b[0-9a-f]{40,}\b/gi, '[REDACTED_HEX]')
    // shortcut: base64 rule avoids '/' so it cannot eat real file paths; tokens
    // containing '/' plus padding are not redacted, upgrade if that ever leaks.
    .replace(/\b[A-Za-z0-9+_-]{44,}={0,2}\b/g, '[REDACTED_B64]')
    .replace(SECRET_ENV_NAME_RE, '$1=[REDACTED]')
}

// ---------------------------------------------------------------------------
// Notes generation
// ---------------------------------------------------------------------------

const REQUIRED_SECTIONS = {
  summary: '## Summary',
  features: '## Features added or updated',
  fixes: '## Bugs fixed',
  personalization: '## Personalization Modal changes',
  businessAssets: '## Business Asset Finder changes',
  videoMotion: '## Video Studio and Motion Studio changes',
  apiBackend: '## API and backend changes',
  tests: '## Tests passed or failed',
  metadata: '## Release metadata',
  knownIssues: '## Known issues',
  rollback: '## Rollback information',
}

function bullets(items, { code = false } = {}) {
  if (!items || items.length === 0) return 'No changes'
  return items
    .map((item) => `- ${code ? '`' + item + '`' : item}`)
    .join('\n')
}

function formatTestResults(testResults) {
  if (!testResults) return 'No changes'
  if (typeof testResults === 'string') return testResults
  const parts = []
  if (typeof testResults.total === 'number') {
    parts.push(
      `${testResults.passed ?? 0} passed, ${testResults.failed ?? 0} failed of ${testResults.total}`,
    )
  }
  if (testResults.summary) parts.push(testResults.summary)
  if (Array.isArray(testResults.details) && testResults.details.length > 0) {
    parts.push(...testResults.details.map((d) => `- ${d}`))
  }
  return parts.length > 0 ? parts.join('\n') : 'No changes'
}

function formatRollback(rollback) {
  if (!rollback) return 'No changes'
  if (typeof rollback === 'string') return rollback
  const parts = []
  if (rollback.previousDeployId) parts.push(`- Previous deploy id: ${rollback.previousDeployId}`)
  if (rollback.previousDeployUrl) parts.push(`- Previous deploy url: ${rollback.previousDeployUrl}`)
  if (rollback.restorePath) parts.push(`- Restore path: ${rollback.restorePath}`)
  if (rollback.restoreCommand) parts.push(`- Restore: \`${rollback.restoreCommand}\``)
  return parts.length > 0 ? parts.join('\n') : 'No changes'
}

function summaryBullets(cats, subjects, fileCount) {
  const source = subjects.slice(0, 5).map((s) => s)
  if (source.length >= 2) return source
  const bulletsOut = [...source]
  if (bulletsOut.length < 2 && fileCount > 0) {
    const areas = [
      cats.personalization.length > 0 && 'Personalization',
      cats.businessAssets.length > 0 && 'Business Asset Finder',
      cats.videoMotion.length > 0 && 'Video/Motion Studio',
      cats.apiBackend.length > 0 && 'API/backend',
    ].filter(Boolean)
    bulletsOut.push(
      `${fileCount} file${fileCount === 1 ? '' : 's'} changed` +
        (areas.length > 0 ? ` across ${areas.join(', ')}` : ''),
    )
  }
  return bulletsOut.sort((a, b) => source.indexOf(a) - source.indexOf(b)).slice(0, 5)
}

/**
 * Generate release notes markdown for the range baseSha..headSha and write it
 * to docs/releases/<YYYY-MM-DD>-<short-sha>.md (unless writeFile: false).
 */
export function generateReleaseNotes({
  repoRoot,
  baseSha,
  headSha = 'HEAD',
  deployId,
  deployUrl,
  stage,
  status,
  verification,
  knownIssues,
  rollback,
  testResults,
  branch,
  timestamp,
  writeFile = true,
} = {}) {
  if (!repoRoot) throw new Error('repoRoot is required')
  const base = baseSha || resolveBaseSha(repoRoot)

  const files = changedFilesWithStatus(repoRoot, base, headSha)
  const subjects = commitSubjects(repoRoot, base, headSha)

  const mentions = {
    personalization: git(repoRoot, [
      'diff',
      '--name-only',
      '-G',
      'openPersonalize|PersonalizationModal|buildStudioMediaSource|useDemoPersonalize',
      `${base}..${headSha}`,
    ])
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean),
    businessAssets: git(repoRoot, [
      'diff',
      '--name-only',
      '-G',
      'find-businesses|discover-assets|research-business',
      `${base}..${headSha}`,
    ])
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean),
  }

  const cats = categorizeChanges(
    files.map((f) => f.path),
    subjects,
    mentions,
  )

  const featureCount = cats.features.length
  const fixCount = cats.fixes.length
  const fileCount = files.length
  const headShort = shortSha(repoRoot, headSha)
  const branchName = branch || currentBranch(repoRoot)
  const generatedAt = timestamp || new Date().toISOString()

  const sections = []

  sections.push(`${REQUIRED_SECTIONS.summary}\n${bullets(summaryBullets(cats, subjects, fileCount))}`)
  sections.push(`${REQUIRED_SECTIONS.features}\n${bullets(cats.features)}`)
  sections.push(`${REQUIRED_SECTIONS.fixes}\n${bullets(cats.fixes)}`)
  sections.push(
    `${REQUIRED_SECTIONS.personalization}\n${bullets(cats.personalization, { code: true })}`,
  )
  sections.push(
    `${REQUIRED_SECTIONS.businessAssets}\n${bullets(cats.businessAssets, { code: true })}`,
  )
  sections.push(
    `${REQUIRED_SECTIONS.videoMotion}\n${bullets(cats.videoMotion, { code: true })}`,
  )
  sections.push(
    `${REQUIRED_SECTIONS.apiBackend}\n${bullets(cats.apiBackend, { code: true })}`,
  )
  sections.push(`## Other changes\n${bullets(cats.other)}`)
  sections.push(`${REQUIRED_SECTIONS.tests}\n${redactSecrets(formatTestResults(testResults))}`)
  sections.push(
    [
      REQUIRED_SECTIONS.metadata,
      `- Commit sha: ${headSha} (${headShort})`,
      `- Branch: ${branchName}`,
      `- Netlify deployment id: ${deployId || 'not available'}`,
      `- Deploy url: ${deployUrl || 'not available'}`,
      `- Deployment status: ${status || 'unknown'}`,
      `- Production verification: ${redactSecrets(verification) || 'not verified'}`,
      `- Timestamp: ${generatedAt}`,
      `- Change size: ${fileCount} files, ${featureCount} features, ${fixCount} fixes`,
      `- Base sha: ${base}`,
    ].join('\n'),
  )
  sections.push(
    `${REQUIRED_SECTIONS.knownIssues}\n${redactSecrets(bullets(knownIssues))}`,
  )
  sections.push(`${REQUIRED_SECTIONS.rollback}\n${redactSecrets(formatRollback(rollback))}`)

  const markdown = `# Release notes — ${headShort}\n\n${sections.join('\n\n')}\n`

  if (writeFile) {
    const date = headCommitDate(repoRoot, headSha)
    const dir = join(repoRoot, 'docs', 'releases')
    mkdirSync(dir, { recursive: true })
    const outPath = join(dir, `${date}-${headShort}.md`)
    writeFileSync(outPath, markdown, 'utf8')
  }

  return markdown
}

// ---------------------------------------------------------------------------
// Deploy message
// ---------------------------------------------------------------------------

const STAGE_PREFIXES = { PROD: '[PROD]', PREVIEW: '[PREVIEW]', DRAFT: '[DRAFT]' }

function parseCounts(notes) {
  const m = notes.match(/(\d+) files?, (\d+) features?, (\d+) fixes?/)
  if (!m) return { files: 0, features: 0, fixes: 0 }
  return { files: Number(m[1]), features: Number(m[2]), fixes: Number(m[3]) }
}

function deriveSummaryText(notes) {
  const section = notes.split('## Summary')[1] || ''
  const bulletLines = (section.match(/^- (.+)$/gm) || []).map((l) => l.replace(/^- /, ''))
  // Prefer a feature headline, fall back to the newest commit subject.
  const feature = bulletLines.find((l) => /^(feat|feature|add|implement|support)\b/i.test(l))
  const first = feature || bulletLines[0] || ''
  return first
    .replace(/^(feat|feature|add|implement|support|fix|bug|hotfix|revert|repair|chore|docs|build|refactor|test|perf)(\([^)]*\))?:\s*/i, '')
    .trim()
}

/** One-line deploy message for `netlify deploy --message`, < 120 chars. */
export function buildDeployMessage(notes, { stage, sha, deployId } = {}) {
  const prefix = STAGE_PREFIXES[String(stage || '').toUpperCase()] || '[RELEASE]'
  const sha7 = String(sha || '').slice(0, 7) || 'unknown'
  const { files, features, fixes } = parseCounts(notes)
  const tail = ` (${files} files, ${features} features, ${fixes} fixes)`
  const baseLength = `${prefix} ${sha7} — ${tail}`.length
  let summary = deriveSummaryText(notes)
  const maxSummary = 120 - baseLength - 2 // room for '…' and the joining space
  if (summary.length > maxSummary) {
    summary = summary.slice(0, Math.max(1, maxSummary - 1)) + '…'
  }
  const message = `${prefix} ${sha7} — ${summary}${tail}`.slice(0, 120)
  return message
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {}
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, '')
    args[key] = argv[i + 1]
  }
  return args
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const args = parseArgs(process.argv.slice(2))
  const markdown = generateReleaseNotes({
    repoRoot: args.repoRoot || process.cwd(),
    baseSha: args.baseSha,
    headSha: args.headSha || 'HEAD',
    deployId: args.deployId,
    deployUrl: args.deployUrl,
    stage: args.stage,
    status: args.status,
    verification: args.verification,
    branch: args.branch,
    writeFile: args.writeFile !== 'false',
  })
  process.stdout.write(markdown)
}
