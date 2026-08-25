#!/usr/bin/env node
/**
 * Upstream Sync Script
 *
 * Fetches latest from upstream (Anil-matcha/Open-Generative-AI), compares
 * models_dump.json for changes, and syncs critical studio files while
 * preserving local-only features.
 *
 * Usage:
 *   node scripts/sync-upstream.mjs                    # Sync & report
 *   node scripts/sync-upstream.mjs --dry-run          # Preview changes only
 *   node scripts/sync-upstream.mjs --force            # Skip confirmation prompts
 *   node scripts/sync-upstream.mjs --verbose          # Show detailed diff output
 *   node scripts/sync-upstream.mjs --help             # Show this help
 *   node scripts/sync-upstream.mjs --no-backup        # Skip creating backups
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, rmSync } from 'fs'
import { join, dirname } from 'path'
import { createHash } from 'crypto'
import { execSync } from 'child_process'
import { createInterface } from 'readline'

// ─── Configuration ──────────────────────────────────────────────────────────

const UPSTREAM_URL = 'https://github.com/Anil-matcha/Open-Generative-AI.git'
const UPSTREAM_REMOTE = 'upstream'
const UPSTREAM_BRANCH = 'main'

const FILES_TO_SYNC = [
  { src: 'models_dump.json', dst: 'models_dump.json' },
  { src: 'packages/studio/src/models.js', dst: 'packages/studio/src/models.js' },
  { src: 'packages/studio/src/modelFamilies.js', dst: 'packages/studio/src/modelFamilies.js' },
  { src: 'packages/studio/src/modelCapabilities.js', dst: 'packages/studio/src/modelCapabilities.js' },
  { src: 'packages/studio/src/modelParameters.js', dst: 'packages/studio/src/modelParameters.js' },
  { src: 'packages/studio/src/imageInputContracts.js', dst: 'packages/studio/src/imageInputContracts.js' },
  { src: 'packages/studio/src/imageSizing.js', dst: 'packages/studio/src/imageSizing.js' },
  { src: 'packages/studio/src/videoMediaInputs.js', dst: 'packages/studio/src/videoMediaInputs.js' },
  { src: 'packages/studio/src/videoToolCapabilities.js', dst: 'packages/studio/src/videoToolCapabilities.js' },
  { src: 'packages/studio/src/videoWorkflows.js', dst: 'packages/studio/src/videoWorkflows.js' },
  { src: 'packages/studio/src/muapi.js', dst: 'packages/studio/src/muapi.js' },
  { src: 'packages/studio/src/persistKey.js', dst: 'packages/studio/src/persistKey.js' },
]

const EXCLUDE_PATTERNS = [
  /Open-AI-Design-Agent/i,
  /DesignAgentStudio\.jsx$/,
]

const MAX_BACKUP_AGE_DAYS = 30
const MAX_BACKUP_COUNT = 50

const PROJECT_ROOT = process.cwd()
const BACKUP_DIR = join(PROJECT_ROOT, '.sync-backups')

// ─── Exit Codes ─────────────────────────────────────────────────────────────

const EXIT = {
  SUCCESS: 0,
  ERROR: 1,
  NO_CHANGES: 2,
  VALIDATION_FAILED: 3,
  USER_ABORT: 4,
}

// ─── CLI Arguments ──────────────────────────────────────────────────────────

const args = process.argv.slice(2)

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Upstream Sync Script
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Syncs critical files from upstream (Anil-matcha/Open-Generative-AI)
while preserving local-only features.

USAGE:
  node scripts/sync-upstream.mjs [FLAGS]

FLAGS:
  --dry-run       Preview changes without modifying any files
  --force         Skip all confirmation prompts
  --verbose       Show detailed diff output (model lists, hashes)
  --no-backup     Skip creating backup files before overwriting
  --help, -h      Show this help message

EXAMPLES:
  node scripts/sync-upstream.mjs                    # Interactive sync
  node scripts/sync-upstream.mjs --dry-run          # Preview only
  node scripts/sync-upstream.mjs --force            # Non-interactive sync
  node scripts/sync-upstream.mjs --dry-run --verbose

FILES SYNCED:
  models_dump.json
  packages/studio/src/models.js
  packages/studio/src/modelFamilies.js
  packages/studio/src/modelCapabilities.js
  packages/studio/src/modelParameters.js
  packages/studio/src/imageInputContracts.js
  packages/studio/src/imageSizing.js
  packages/studio/src/videoMediaInputs.js
  packages/studio/src/videoToolCapabilities.js
  packages/studio/src/videoWorkflows.js
  packages/studio/src/muapi.js
  packages/studio/src/persistKey.js

EXCLUDED:
  Open-AI-Design-Agent package
  DesignAgentStudio.jsx component
`)
  process.exit(EXIT.SUCCESS)
}

const DRY_RUN = args.includes('--dry-run')
const FORCE = args.includes('--force')
const VERBOSE = args.includes('--verbose')
const NO_BACKUP = args.includes('--no-backup')

const UNKNOWN_ARGS = args.filter(a => !['--dry-run', '--force', '--verbose', '--no-backup', '--help', '-h'].includes(a))
if (UNKNOWN_ARGS.length > 0) {
  console.error(`Unknown arguments: ${UNKNOWN_ARGS.join(', ')}`)
  console.error('Use --help for usage information.')
  process.exit(EXIT.VALIDATION_FAILED)
}

// ─── Logging ────────────────────────────────────────────────────────────────

const LOG_LEVELS = { error: 0, warn: 1, info: 2, success: 2, debug: 3 }
const MIN_LOG_LEVEL = VERBOSE ? 3 : 2

function log(msg, level = 'info') {
  if (LOG_LEVELS[level] > MIN_LOG_LEVEL) return
  const prefix = { error: '✖', warn: '⚠', info: 'ℹ', success: '✔', debug: '→' }
  const fn = level === 'error' ? console.error : console.log
  fn(`${prefix[level] || '  '} ${msg}`)
}

// ─── Validation ─────────────────────────────────────────────────────────────

function assertGitRepo() {
  try {
    execSync('git rev-parse --git-dir', { cwd: PROJECT_ROOT, stdio: 'ignore' })
  } catch {
    log('Not a git repository. Run this from the project root.', 'error')
    process.exit(EXIT.VALIDATION_FAILED)
  }
}

function assertWorkingTreeClean() {
  try {
    const status = execSync('git status --porcelain', { cwd: PROJECT_ROOT, encoding: 'utf8' }).trim()
    if (status.length > 0) {
      log('Working tree has uncommitted changes.', 'warn')
      log('Commit or stash changes before syncing to avoid conflicts.', 'warn')
      if (!FORCE) {
        log('Use --force to override this check.', 'warn')
        process.exit(EXIT.VALIDATION_FAILED)
      }
      log('Proceeding anyway (--force)', 'warn')
    }
  } catch (err) {
    log(`Could not check working tree status: ${err.message}`, 'error')
    process.exit(EXIT.VALIDATION_FAILED)
  }
}

function ensureRemote() {
  try {
    const url = execSync(`git remote get-url ${UPSTREAM_REMOTE}`, {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
    }).trim()
    if (!url.includes('Anil-matcha/Open-Generative-AI')) {
      log(`Upstream remote URL mismatch: ${url}`, 'warn')
    }
  } catch {
    log(`Upstream remote '${UPSTREAM_REMOTE}' not found. Adding...`, 'warn')
    if (DRY_RUN) return
    try {
      execSync(`git remote add ${UPSTREAM_REMOTE} ${UPSTREAM_URL}`, { cwd: PROJECT_ROOT, stdio: 'pipe' })
      log(`Added upstream remote: ${UPSTREAM_URL}`, 'success')
    } catch (err) {
      log(`Failed to add upstream remote: ${err.message}`, 'error')
      process.exit(EXIT.ERROR)
    }
  }
}

// ─── Utilities ──────────────────────────────────────────────────────────────

function hashContent(content) {
  return createHash('sha256').update(content).digest('hex').slice(0, 12)
}

function timestamp() {
  return new Date().toISOString().replace(/[:\.]/g, '-').slice(0, 19)
}

function sanitizeFilename(filePath) {
  return filePath.replace(/\//g, '__')
}

function execGit(command, { optional = false, stderr = false } = {}) {
  try {
    return execSync(command, {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      stdio: stderr ? 'pipe' : ['pipe', 'pipe', 'ignore'],
    })?.trim() || ''
  } catch (err) {
    if (optional) return ''
    const msg = err.stderr?.toString().trim() || err.message
    throw new Error(`git command failed: ${command}\n  ${msg}`)
  }
}

function fetchUpstream() {
  log(`Fetching from ${UPSTREAM_REMOTE}/${UPSTREAM_BRANCH}...`)
  execGit(`git fetch ${UPSTREAM_REMOTE} ${UPSTREAM_BRANCH} --quiet`)
  log('Fetch complete', 'success')
}

function readUpstreamFile(relativePath) {
  try {
    return execGit(`git show ${UPSTREAM_REMOTE}/${UPSTREAM_BRANCH}:${relativePath}`)
  } catch {
    return null
  }
}

function readLocalFile(relativePath) {
  const fullPath = join(PROJECT_ROOT, relativePath)
  if (!existsSync(fullPath)) return null
  return readFileSync(fullPath, 'utf8')
}

function shouldExclude(filePath) {
  return EXCLUDE_PATTERNS.some(pattern => pattern.test(filePath))
}

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

// ─── Backup Management ──────────────────────────────────────────────────────

function createBackup(relativePath) {
  if (NO_BACKUP) return null

  const localContent = readLocalFile(relativePath)
  if (localContent === null) return null

  const backupName = `${sanitizeFilename(relativePath)}.${timestamp()}.bak`
  const backupPath = join(BACKUP_DIR, backupName)
  ensureDir(dirname(backupPath))
  writeFileSync(backupPath, localContent)

  return backupPath
}

function pruneOldBackups() {
  if (!existsSync(BACKUP_DIR)) return

  try {
    const files = readdirSync(BACKUP_DIR)
      .filter(f => f.endsWith('.bak'))
      .map(f => {
        const filePath = join(BACKUP_DIR, f)
        return { path: filePath, stat: statSync(filePath) }
      })
      .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs)

    const now = Date.now()
    const maxAge = MAX_BACKUP_AGE_DAYS * 24 * 60 * 60 * 1000

    let pruned = 0
    for (let i = 0; i < files.length; i++) {
      const { path, stat } = files[i]
      const age = now - stat.mtimeMs
      if (i >= MAX_BACKUP_COUNT || age > maxAge) {
        rmSync(path)
        pruned++
      }
    }

    if (pruned > 0) {
      log(`Pruned ${pruned} old backup(s)`, 'debug')
    }

    // Remove empty backup directory
    const remaining = readdirSync(BACKUP_DIR)
    if (remaining.length === 0) {
      rmSync(BACKUP_DIR, { recursive: true })
    }
  } catch (err) {
    log(`Backup pruning skipped: ${err.message}`, 'debug')
  }
}

function rollbackBackups(backedUpFiles) {
  log('Rolling back changes...', 'error')
  for (const { dst, backupPath } of backedUpFiles) {
    if (backupPath && existsSync(backupPath)) {
      try {
        const backupContent = readFileSync(backupPath, 'utf8')
        writeFileSync(join(PROJECT_ROOT, dst), backupContent)
        log(`Rolled back: ${dst}`, 'info')
      } catch (err) {
        log(`Rollback failed for ${dst}: ${err.message}`, 'error')
      }
    }
  }
}

// ─── Model Comparison ───────────────────────────────────────────────────────

function parseModels(dumpContent) {
  try {
    const data = JSON.parse(dumpContent)
    const models = []

    if (typeof data === 'object' && !Array.isArray(data)) {
      for (const [category, items] of Object.entries(data)) {
        if (Array.isArray(items)) {
          for (const item of items) {
            models.push({ ...item, __category: category })
          }
        }
      }
    } else if (Array.isArray(data)) {
      models.push(...data)
    }

    return models
  } catch {
    return []
  }
}

function compareModelsDump(upstreamContent, localContent) {
  const result = {
    newModels: [],
    removedModels: [],
    changedModels: [],
    totalUpstream: 0,
    totalLocal: 0,
    upstreamHash: null,
    localHash: null,
    hasChanges: false,
  }

  result.upstreamHash = hashContent(upstreamContent)
  result.localHash = hashContent(localContent)

  if (result.upstreamHash === result.localHash) {
    return result
  }

  const upstreamModels = parseModels(upstreamContent)
  const localModels = parseModels(localContent)

  result.totalUpstream = upstreamModels.length
  result.totalLocal = localModels.length

  const localMap = new Map()
  for (const m of localModels) {
    const id = m.id || m.name || m.model || JSON.stringify(m).slice(0, 32)
    localMap.set(id, m)
  }

  const upstreamMap = new Map()
  for (const m of upstreamModels) {
    const id = m.id || m.name || m.model || JSON.stringify(m).slice(0, 32)
    upstreamMap.set(id, m)
  }

  for (const [id, model] of upstreamMap) {
    if (!localMap.has(id)) {
      result.newModels.push({ id, name: model.name || model.id || id })
    } else {
      const local = localMap.get(id)
      if (JSON.stringify(model) !== JSON.stringify(local)) {
        result.changedModels.push({ id, name: model.name || model.id || id })
      }
    }
  }

  for (const [id, model] of localMap) {
    if (!upstreamMap.has(id)) {
      result.removedModels.push({ id, name: model.name || model.id || id })
    }
  }

  result.hasChanges = true
  return result
}

// ─── File Sync ──────────────────────────────────────────────────────────────

function syncFile(fileEntry) {
  const { src, dst } = fileEntry

  if (shouldExclude(src)) {
    log(`Skipping excluded: ${src}`, 'debug')
    return { status: 'excluded', src, dst }
  }

  const upstreamContent = readUpstreamFile(src)
  if (upstreamContent === null) {
    return { status: 'missing-upstream', src, dst }
  }

  const localContent = readLocalFile(dst)
  const upstreamHash = hashContent(upstreamContent)

  if (localContent !== null && hashContent(localContent) === upstreamHash) {
    return { status: 'unchanged', src, dst, hash: upstreamHash }
  }

  const action = localContent === null ? 'create' : 'update'

  if (DRY_RUN) {
    return { status: 'dry-run', src, dst, action, hash: upstreamHash }
  }

  const backupPath = createBackup(dst)
  const destPath = join(PROJECT_ROOT, dst)
  ensureDir(dirname(destPath))
  writeFileSync(destPath, upstreamContent)

  return {
    status: 'synced',
    src,
    dst,
    action,
    hash: upstreamHash,
    backupPath,
  }
}

// ─── Confirmation ───────────────────────────────────────────────────────────

function promptConfirm(question) {
  return new Promise(resolve => {
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    rl.question(`${question} [y/N] `, answer => {
      rl.close()
      resolve(answer.trim().toLowerCase() === 'y')
    })
  })
}

// ─── Report ─────────────────────────────────────────────────────────────────

function printReport(fileResults, modelComparison) {
  console.log('\n' + '═'.repeat(60))
  console.log('  UPSTREAM SYNC REPORT')
  console.log('═'.repeat(60))

  const synced = fileResults.filter(r => r.status === 'synced')
  const unchanged = fileResults.filter(r => r.status === 'unchanged')
  const dryRun = fileResults.filter(r => r.status === 'dry-run')
  const missing = fileResults.filter(r => r.status === 'missing-upstream')
  const excluded = fileResults.filter(r => r.status === 'excluded')

  console.log(`\n  File Sync Summary:`)
  console.log(`   Synced:     ${synced.length}`)
  console.log(`   Unchanged:  ${unchanged.length}`)
  console.log(`   Missing:    ${missing.length}`)
  console.log(`   Excluded:   ${excluded.length}`)
  if (DRY_RUN) console.log(`   Dry-run:    ${dryRun.length}`)

  const displayItems = DRY_RUN ? dryRun : synced
  if (displayItems.length > 0) {
    console.log(`\n   ${DRY_RUN ? 'Would sync:' : 'Synced files:'}`)
    for (const r of displayItems) {
      const icon = r.action === 'create' ? '+' : '~'
      console.log(`   ${icon} ${r.dst}${VERBOSE ? ` (${r.hash})` : ''}`)
      if (r.backupPath) {
        console.log(`      backup: ${r.backupPath}`)
      }
    }
  }

  if (missing.length > 0 && VERBOSE) {
    console.log(`\n   Missing in upstream:`)
    for (const r of missing) {
      console.log(`   ? ${r.src}`)
    }
  }

  if (modelComparison) {
    console.log(`\n  Models Dump Comparison:`)
    console.log(`   Upstream hash: ${modelComparison.upstreamHash}`)
    console.log(`   Local hash:    ${modelComparison.localHash}`)

    if (!modelComparison.hasChanges) {
      console.log(`   Status: identical`)
    } else {
      console.log(`   Status: CHANGED`)
      console.log(`   Upstream models: ${modelComparison.totalUpstream}`)
      console.log(`   Local models:    ${modelComparison.totalLocal}`)
      console.log(`   New:             ${modelComparison.newModels.length}`)
      console.log(`   Removed:         ${modelComparison.removedModels.length}`)
      console.log(`   Modified:        ${modelComparison.changedModels.length}`)

      if (VERBOSE) {
        if (modelComparison.newModels.length > 0) {
          console.log(`\n   New models:`)
          for (const m of modelComparison.newModels) {
            console.log(`     + ${m.name}`)
          }
        }
        if (modelComparison.removedModels.length > 0) {
          console.log(`\n   Removed models:`)
          for (const m of modelComparison.removedModels) {
            console.log(`     - ${m.name}`)
          }
        }
        if (modelComparison.changedModels.length > 0) {
          console.log(`\n   Modified models:`)
          const shown = modelComparison.changedModels.slice(0, 20)
          for (const m of shown) {
            console.log(`     ~ ${m.name}`)
          }
          if (modelComparison.changedModels.length > 20) {
            console.log(`     ... and ${modelComparison.changedModels.length - 20} more`)
          }
        }
      }
    }
  }

  console.log('\n' + '═'.repeat(60))
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nUpstream Sync${DRY_RUN ? ' (DRY RUN)' : ''}`)
  console.log(`  Remote: ${UPSTREAM_REMOTE}/${UPSTREAM_BRANCH}`)
  console.log(`  URL: ${UPSTREAM_URL}\n`)

  // Pre-flight checks
  assertGitRepo()
  ensureRemote()

  if (!DRY_RUN) {
    assertWorkingTreeClean()
  }

  // Fetch latest
  fetchUpstream()

  // Compare models_dump.json
  log('Comparing models_dump.json...', 'debug')
  const upstreamModelsDump = readUpstreamFile('models_dump.json')
  const localModelsDump = readLocalFile('models_dump.json')

  let modelComparison = null
  if (upstreamModelsDump && localModelsDump) {
    modelComparison = compareModelsDump(upstreamModelsDump, localModelsDump)
    if (modelComparison.hasChanges) {
      log(`Models changed: +${modelComparison.newModels.length} ~${modelComparison.changedModels.length} -${modelComparison.removedModels.length}`, 'warn')
    } else {
      log('models_dump.json unchanged', 'success')
    }
  } else if (upstreamModelsDump && !localModelsDump) {
    log('models_dump.json not present locally, will create', 'warn')
  }

  // Determine which files need syncing
  const pendingSyncs = []
  for (const fileEntry of FILES_TO_SYNC) {
    if (shouldExclude(fileEntry.src)) continue

    const upstreamContent = readUpstreamFile(fileEntry.src)
    if (upstreamContent === null) continue

    const localContent = readLocalFile(fileEntry.dst)
    if (localContent !== null && hashContent(localContent) === hashContent(upstreamContent)) {
      continue
    }

    pendingSyncs.push({
      ...fileEntry,
      action: localContent === null ? 'create' : 'update',
      upstreamHash: hashContent(upstreamContent),
    })
  }

  // Prompt for confirmation (unless --force or --dry-run)
  if (!DRY_RUN && !FORCE && pendingSyncs.length > 0) {
    console.log(`\n${pendingSyncs.length} file(s) to sync:`)
    for (const p of pendingSyncs) {
      console.log(`  ${p.action === 'create' ? '+' : '~'} ${p.dst}`)
    }
    console.log()

    const confirmed = await promptConfirm('Proceed with sync?')
    if (!confirmed) {
      log('Sync cancelled by user.', 'warn')
      process.exit(EXIT.USER_ABORT)
    }
  }

  // Execute sync
  log('Syncing files...', 'debug')
  const results = []
  const backedUpFiles = []

  try {
    // First pass: sync all non-excluded files from FILES_TO_SYNC
    for (const fileEntry of FILES_TO_SYNC) {
      if (shouldExclude(fileEntry.src)) {
        results.push({ status: 'excluded', src: fileEntry.src, dst: fileEntry.dst })
        continue
      }

      const result = syncFile(fileEntry)
      results.push(result)

      if (result.status === 'synced' && result.backupPath) {
        backedUpFiles.push({ dst: result.dst, backupPath: result.backupPath })
      }

      if (VERBOSE || result.status === 'synced') {
        const icons = { synced: '✔', unchanged: ' ', 'dry-run': '◌', 'missing-upstream': '?', excluded: '⊘' }
        log(`${icons[result.status] || ' '} ${result.dst} (${result.status})`,
            result.status === 'synced' ? 'success' : 'debug')
      }
    }
  } catch (err) {
    log(`Sync failed: ${err.message}`, 'error')
    if (backedUpFiles.length > 0) {
      rollbackBackups(backedUpFiles)
    }
    process.exit(EXIT.ERROR)
  }

  // Clean up old backups
  if (!DRY_RUN && !NO_BACKUP) {
    pruneOldBackups()
  }

  // Print report
  printReport(results, modelComparison)

  // Final status
  if (DRY_RUN) {
    const wouldSync = results.filter(r => r.status === 'dry-run').length
    if (wouldSync > 0) {
      log(`${wouldSync} file(s) would be synced. Run without --dry-run to apply.`, 'warn')
    } else {
      log('All files already up to date.', 'success')
      process.exit(EXIT.NO_CHANGES)
    }
  } else {
    const syncedCount = results.filter(r => r.status === 'synced').length
    if (syncedCount > 0) {
      log(`${syncedCount} file(s) synced. Backups in .sync-backups/`, 'success')
    } else {
      log('All files already up to date.', 'success')
      process.exit(EXIT.NO_CHANGES)
    }
  }
}

main().catch(err => {
  log(err.message, 'error')
  process.exit(EXIT.ERROR)
})
