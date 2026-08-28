#!/usr/bin/env node
/**
 * MUAPI Catalog Sync & Diff Detection
 * 
 * Fetches the MUAPI catalog, compares with the previous version,
 * and generates a detailed diff report. Can auto-update models.js.
 * 
 * Usage:
 *   node scripts/muapi-catalog-sync.mjs                    # Fetch & report
 *   node scripts/muapi-catalog-sync.mjs --emit             # Fetch, diff, update models.js
 *   node scripts/muapi-catalog-sync.mjs --health-check     # Check all endpoints
 *   node scripts/muapi-catalog-sync.mjs --notify           # Send notifications
 *   node scripts/muapi-catalog-sync.mjs --source upstream  # Use upstream git models_dump.json
 *   node scripts/muapi-catalog-sync.mjs --compare-upstream # Diff local vs upstream
 *   node scripts/muapi-catalog-sync.mjs --validate         # Validate endpoints against live API
 * 
 * Environment Variables:
 *   MUAPI_API_KEY - API key for authenticated endpoints
 *   SLACK_WEBHOOK_URL - Slack webhook for notifications
 *   GITHUB_TOKEN - GitHub token for PR creation
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'fs'
import { pathToFileURL } from 'url'
import { tmpdir } from 'os'
import { join, dirname } from 'path'
import { createHash } from 'crypto'
import { execSync } from 'child_process'

const MUAPI_CATALOG_URL = 'https://api.muapi.ai/api/v1/models'
const MUAPI_BASE = 'https://api.muapi.ai/api/v1'
const MODELS_SRC = 'packages/studio/src/models.js'
const CATALOG_DIR = 'catalogs'
const DIFF_DIR = 'catalogs/diffs'
const LATEST_CATALOG = join(CATALOG_DIR, 'muapi-catalog-latest.json')
const MODELS_DUMP = 'models_dump.json'

// ─── Utilities ─────────────────────────────────────────────────────────────

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

function hashContent(content) {
  return createHash('sha256').update(content).digest('hex').slice(0, 12)
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

// ─── Catalog Fetching ──────────────────────────────────────────────────────

async function fetchCatalog() {
  console.log(`\n📡 Fetching MUAPI catalog from ${MUAPI_CATALOG_URL}...`)
  
  const headers = { 'Content-Type': 'application/json' }
  if (process.env.MUAPI_API_KEY) {
    headers['x-api-key'] = process.env.MUAPI_API_KEY
  }

  const res = await fetch(MUAPI_CATALOG_URL, { headers })
  if (!res.ok) {
    throw new Error(`Catalog request failed: HTTP ${res.status}`)
  }

  const json = await res.json()
  const models = Array.isArray(json) ? json : json.models
  
  console.log(`   ✓ Fetched ${models.length} models`)
  return { models, raw: json }
}

// ─── Upstream Source ───────────────────────────────────────────────────────

function fetchUpstreamModelsDump() {
  console.log(`\n📦 Fetching models_dump.json from upstream remote...`)
  
  try {
    const content = execSync(`git show upstream/main:${MODELS_DUMP}`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    const parsed = JSON.parse(content)
    console.log(`   ✓ Loaded upstream models_dump.json (${Object.keys(parsed).length} categories)`)
    return parsed
  } catch (err) {
    throw new Error(`Failed to fetch upstream models_dump.json: ${err.message}`)
  }
}

function loadLocalModelsDump() {
  if (!existsSync(MODELS_DUMP)) {
    throw new Error(`Local ${MODELS_DUMP} not found`)
  }
  return JSON.parse(readFileSync(MODELS_DUMP, 'utf8'))
}

function flattenModelsDump(dump) {
  const models = []
  for (const [category, entries] of Object.entries(dump)) {
    if (!Array.isArray(entries)) continue
    for (const entry of entries) {
      models.push({
        ...entry,
        _category: category,
      })
    }
  }
  return models
}

// ─── Catalog Storage ───────────────────────────────────────────────────────

function saveCatalog(catalog) {
  ensureDir(CATALOG_DIR)
  
  const content = JSON.stringify(catalog, null, 2)
  const hash = hashContent(content)
  const dateStr = today()
  
  // Save timestamped version
  const filename = `muapi-catalog-${dateStr}-${hash}.json`
  const filepath = join(CATALOG_DIR, filename)
  writeFileSync(filepath, content)
  
  // Update latest symlink/file
  writeFileSync(LATEST_CATALOG, content)
  
  console.log(`   ✓ Catalog saved: ${filename}`)
  return { filepath, hash, content }
}

function loadLatestCatalog() {
  if (!existsSync(LATEST_CATALOG)) return null
  try {
    return JSON.parse(readFileSync(LATEST_CATALOG, 'utf8'))
  } catch {
    return null
  }
}

// ─── Diff Detection ────────────────────────────────────────────────────────

function detectChanges(previous, current) {
  const prevById = new Map()
  const currById = new Map()
  
  if (previous) {
    const models = Array.isArray(previous) ? previous : previous.models
    for (const m of models) prevById.set(m.name, m)
  }
  
  const models = Array.isArray(current) ? current : current.models
  for (const m of models) currById.set(m.name, m)

  const changes = {
    added: [],
    removed: [],
    modified: [],
    unchanged: 0,
    timestamp: new Date().toISOString(),
  }

  // Find added and modified
  for (const [id, curr] of currById) {
    const prev = prevById.get(id)
    if (!prev) {
      changes.added.push({
        id,
        name: curr.name,
        endpoint: curr.endpoint,
        category: curr.category,
        description: curr.description?.slice(0, 100),
      })
    } else if (JSON.stringify(prev) !== JSON.stringify(curr)) {
      changes.modified.push({
        id,
        name: curr.name,
        changes: deepDiff(prev, curr),
      })
    } else {
      changes.unchanged++
    }
  }

  // Find removed
  for (const [id, prev] of prevById) {
    if (!currById.has(id)) {
      changes.removed.push({
        id,
        name: prev.name,
        endpoint: prev.endpoint,
        category: prev.category,
      })
    }
  }

  return changes
}

function deepDiff(obj1, obj2, path = '') {
  const diffs = []
  const allKeys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})])
  
  for (const key of allKeys) {
    const val1 = obj1?.[key]
    const val2 = obj2?.[key]
    const currentPath = path ? `${path}.${key}` : key
    
    if (JSON.stringify(val1) !== JSON.stringify(val2)) {
      if (typeof val1 === 'object' && typeof val2 === 'object') {
        diffs.push(...deepDiff(val1, val2, currentPath))
      } else {
        diffs.push({
          field: currentPath,
          before: val1,
          after: val2,
        })
      }
    }
  }
  
  return diffs
}

// ─── Upstream Comparison ───────────────────────────────────────────────────

function compareUpstreamVsLocal(localDump, upstreamDump) {
  console.log('\n🔄 Comparing local vs upstream models_dump.json...')
  
  const localModels = flattenModelsDump(localDump)
  const upstreamModels = flattenModelsDump(upstreamDump)
  
  const localById = new Map(localModels.map(m => [m.id, m]))
  const upstreamById = new Map(upstreamModels.map(m => [m.id, m]))
  
  const comparison = {
    timestamp: new Date().toISOString(),
    summary: {
      local: localModels.length,
      upstream: upstreamModels.length,
      addedLocally: 0,
      addedUpstream: 0,
      modified: 0,
      unchanged: 0,
    },
    addedLocally: [],
    addedUpstream: [],
    modified: [],
    removedLocally: [],
    removedUpstream: [],
  }
  
  // Find models added upstream and modified
  for (const [id, upstream] of upstreamById) {
    const local = localById.get(id)
    if (!local) {
      comparison.addedUpstream.push({
        id,
        name: upstream.name,
        category: upstream._category,
        endpoint: upstream.endpoint,
      })
      comparison.summary.addedUpstream++
    } else {
      const diffs = deepDiff(local, upstream)
      if (diffs.length > 0) {
        comparison.modified.push({
          id,
          name: upstream.name,
          changes: diffs,
        })
        comparison.summary.modified++
      } else {
        comparison.summary.unchanged++
      }
    }
  }
  
  // Find models removed upstream (exist locally but not upstream)
  for (const [id, local] of localById) {
    if (!upstreamById.has(id)) {
      comparison.removedUpstream.push({
        id,
        name: local.name,
        category: local._category,
        endpoint: local.endpoint,
      })
      comparison.summary.addedLocally++
    }
  }
  
  return comparison
}

function printUpstreamComparison(comparison) {
  const s = comparison.summary
  
  console.log('\n' + '═'.repeat(60))
  console.log('  Upstream vs Local Comparison')
  console.log('═'.repeat(60))
  console.log(`\n  Local models: ${s.local}`)
  console.log(`  Upstream models: ${s.upstream}`)
  console.log(`\n  🟢 Added upstream (new): ${s.addedUpstream}`)
  console.log(`  🔴 Removed upstream (deleted): ${s.removedUpstream}`)
  console.log(`  🟡 Modified: ${s.modified}`)
  console.log(`  ⚪ Unchanged: ${s.unchanged}`)
  
  if (comparison.addedUpstream.length > 0) {
    console.log('\n  ── New Models (in upstream, not local) ──')
    for (const m of comparison.addedUpstream) {
      console.log(`  + ${m.name} (${m.id}) [${m.category}]`)
    }
  }
  
  if (comparison.removedUpstream.length > 0) {
    console.log('\n  ── Removed Models (in local, not upstream) ──')
    for (const m of comparison.removedUpstream) {
      console.log(`  - ${m.name} (${m.id}) [${m.category}]`)
    }
  }
  
  if (comparison.modified.length > 0) {
    console.log('\n  ── Modified Models ──')
    for (const m of comparison.modified) {
      console.log(`  ~ ${m.name} (${m.id}): ${m.changes.length} field(s) changed`)
      for (const c of m.changes.slice(0, 5)) {
        console.log(`      ${c.field}: ${JSON.stringify(c.before)} → ${JSON.stringify(c.after)}`)
      }
      if (m.changes.length > 5) {
        console.log(`      ... and ${m.changes.length - 5} more changes`)
      }
    }
  }
  
  console.log('\n' + '═'.repeat(60))
}

// ─── Endpoint Validation ───────────────────────────────────────────────────

async function validateEndpoints(models) {
  console.log(`\n🔍 Validating ${models.length} endpoints against live MuAPI API...`)
  
  const results = {
    valid: [],
    invalid: [],
    unreachable: [],
    timestamp: new Date().toISOString(),
  }
  
  const batchSize = 5
  let processed = 0
  
  for (let i = 0; i < models.length; i += batchSize) {
    const batch = models.slice(i, i + batchSize)
    const promises = batch.map(async (model) => {
      const endpoint = model.endpoint || model.id
      if (!endpoint) {
        results.invalid.push({
          id: model.id,
          name: model.name,
          reason: 'No endpoint defined',
        })
        return
      }
      
      const url = `${MUAPI_BASE}/${endpoint.replace(/^\/api\/v1\//, '')}`
      const start = Date.now()
      
      try {
        const headers = { 'Content-Type': 'application/json' }
        if (process.env.MUAPI_API_KEY) {
          headers['x-api-key'] = process.env.MUAPI_API_KEY
        }
        
        const res = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({ prompt: 'test' }),
          signal: AbortSignal.timeout(15000),
        })
        
        const elapsed = Date.now() - start
        
        if (res.ok || res.status === 400 || res.status === 422 || res.status === 401 || res.status === 403) {
          // Endpoint exists and responds (400/422 = bad payload, 401/403 = auth required)
          results.valid.push({
            id: model.id,
            name: model.name,
            endpoint,
            status: res.status,
            responseTime: elapsed,
          })
        } else if (res.status === 404) {
          results.invalid.push({
            id: model.id,
            name: model.name,
            endpoint,
            status: res.status,
            reason: 'Endpoint not found (404)',
          })
        } else {
          results.invalid.push({
            id: model.id,
            name: model.name,
            endpoint,
            status: res.status,
            reason: `Unexpected status: ${res.status}`,
          })
        }
      } catch (err) {
        const elapsed = Date.now() - start
        results.unreachable.push({
          id: model.id,
          name: model.name,
          endpoint,
          error: err.message,
          responseTime: elapsed,
        })
      }
    })
    
    await Promise.all(promises)
    processed += batch.length
    const progress = Math.min((processed / models.length) * 100, 100)
    process.stdout.write(`\r   Progress: ${progress.toFixed(0)}% (${processed}/${models.length})`)
  }
  
  console.log('\n')
  return results
}

function printValidationResults(results) {
  console.log('\n' + '═'.repeat(60))
  console.log('  Endpoint Validation Results')
  console.log('═'.repeat(60))
  console.log(`\n  ✅ Valid: ${results.valid.length}`)
  console.log(`  ❌ Invalid: ${results.invalid.length}`)
  console.log(`  🔌 Unreachable: ${results.unreachable.length}`)
  
  if (results.invalid.length > 0) {
    console.log('\n  ── Invalid Endpoints ──')
    for (const r of results.invalid) {
      console.log(`  ✗ ${r.name} (${r.endpoint}): ${r.reason}`)
    }
  }
  
  if (results.unreachable.length > 0) {
    console.log('\n  ── Unreachable Endpoints ──')
    for (const r of results.unreachable) {
      console.log(`  ✗ ${r.name} (${r.endpoint}): ${r.error}`)
    }
  }
  
  console.log('\n' + '═'.repeat(60))
}

// ─── Change Classification ─────────────────────────────────────────────────

function classifyChange(change) {
  const highPriorityCategories = ['Text to Video', 'Image to Video', 'Video to Video']
  const highPriorityModels = ['seedance', 'kling', 'sora', 'runway', 'pika']
  
  const id = change.id?.toLowerCase() || ''
  const category = change.category?.toLowerCase() || ''
  
  if (highPriorityModels.some(m => id.includes(m))) return 'CRITICAL'
  if (highPriorityCategories.some(c => category.includes(c.toLowerCase()))) return 'HIGH'
  if (change.added?.length > 0 || change.removed?.length > 0) return 'MEDIUM'
  return 'LOW'
}

// ─── Report Generation ─────────────────────────────────────────────────────

function generateReport(changes, catalogInfo) {
  ensureDir(DIFF_DIR)
  
  const report = {
    generatedAt: new Date().toISOString(),
    catalog: {
      totalModels: catalogInfo.totalModels,
      hash: catalogInfo.hash,
    },
    summary: {
      added: changes.added.length,
      removed: changes.removed.length,
      modified: changes.modified.length,
      unchanged: changes.unchanged,
    },
    changes,
    severity: {
      critical: changes.added.filter(c => classifyChange(c) === 'CRITICAL').length,
      high: changes.added.filter(c => classifyChange(c) === 'HIGH').length,
      medium: changes.added.filter(c => classifyChange(c) === 'MEDIUM').length,
      low: changes.added.filter(c => classifyChange(c) === 'LOW').length,
    },
  }

  // Save JSON report
  const reportPath = join(DIFF_DIR, `diff-${today()}-${catalogInfo.hash}.json`)
  writeFileSync(reportPath, JSON.stringify(report, null, 2))

  // Generate markdown summary
  const md = generateMarkdownReport(report)
  const mdPath = join(DIFF_DIR, `diff-${today()}-${catalogInfo.hash}.md`)
  writeFileSync(mdPath, md)

  console.log(`\n📊 Report generated:`)
  console.log(`   JSON: ${reportPath}`)
  console.log(`   Markdown: ${mdPath}`)

  return { report, reportPath, mdPath, markdown: md }
}

function generateMarkdownReport(report) {
  const s = report.summary
  const sev = report.severity
  
  let md = `# MUAPI Catalog Sync Report\n\n`
  md += `**Generated:** ${report.generatedAt}\n`
  md += `**Catalog Hash:** ${report.catalog.hash}\n`
  md += `**Total Models:** ${report.catalog.totalModels}\n\n`
  
  md += `## Summary\n\n`
  md += `| Metric | Count |\n`
  md += `|--------|-------|\n`
  md += `| 🟢 Added | ${s.added} |\n`
  md += `| 🔴 Removed | ${s.removed} |\n`
  md += `| 🟡 Modified | ${s.modified} |\n`
  md += `| ⚪ Unchanged | ${s.unchanged} |\n\n`
  
  md += `## Severity Breakdown\n\n`
  md += `| Level | Count |\n`
  md += `|-------|-------|\n`
  md += `| 🔴 CRITICAL | ${sev.critical} |\n`
  md += `| 🟠 HIGH | ${sev.high} |\n`
  md += `| 🟡 MEDIUM | ${sev.medium} |\n`
  md += `| 🟢 LOW | ${sev.low} |\n\n`

  if (report.changes.added.length > 0) {
    md += `## New Models (${report.changes.added.length})\n\n`
    md += `| Model | Endpoint | Category | Severity |\n`
    md += `|-------|----------|----------|----------|\n`
    for (const m of report.changes.added) {
      const sev = classifyChange(m)
      const emoji = sev === 'CRITICAL' ? '🔴' : sev === 'HIGH' ? '🟠' : sev === 'MEDIUM' ? '🟡' : '🟢'
      md += `| ${m.name} | \`${m.endpoint}\` | ${m.category || '?'} | ${emoji} ${sev} |\n`
    }
    md += `\n`
  }

  if (report.changes.removed.length > 0) {
    md += `## Removed Models (${report.changes.removed.length})\n\n`
    md += `| Model | Endpoint | Category |\n`
    md += `|-------|----------|----------|\n`
    for (const m of report.changes.removed) {
      md += `| ${m.name} | \`${m.endpoint}\` | ${m.category || '?'} |\n`
    }
    md += `\n`
  }

  if (report.changes.modified.length > 0) {
    md += `## Modified Models (${report.changes.modified.length})\n\n`
    for (const m of report.changes.modified) {
      md += `### ${m.name}\n\n`
      for (const c of m.changes) {
        md += `- **${c.field}**: \`${JSON.stringify(c.before)}\` → \`${JSON.stringify(c.after)}\`\n`
      }
      md += `\n`
    }
  }

  return md
}

// ─── Health Check ───────────────────────────────────────────────────────────

async function healthCheck(models) {
  console.log(`\n🏥 Running health check on ${models.length} endpoints...`)
  
  const results = {
    passed: [],
    failed: [],
    slow: [],
    timestamp: new Date().toISOString(),
  }

  // Check a sample of endpoints (to avoid rate limiting)
  const sampleSize = Math.min(20, models.length)
  const sample = models.filter((_, i) => i % Math.ceil(models.length / sampleSize) === 0)
  
  for (const model of sample) {
    const endpoint = model.endpoint?.replace(/^\/api\/v1\//, '')
    if (!endpoint) continue
    
    const start = Date.now()
    try {
      const res = await fetch(`${MUAPI_BASE}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'test' }),
        signal: AbortSignal.timeout(10000),
      })
      const elapsed = Date.now() - start
      
      if (res.ok || res.status === 400 || res.status === 422) {
        // 400/422 means endpoint exists but our test payload was invalid
        results.passed.push({ endpoint, status: res.status, elapsed })
      } else if (res.status === 404) {
        results.failed.push({ endpoint, status: res.status, error: 'Not found' })
      } else {
        results.failed.push({ endpoint, status: res.status, error: `HTTP ${res.status}` })
      }
      
      if (elapsed > 5000) {
        results.slow.push({ endpoint, elapsed })
      }
    } catch (err) {
      results.failed.push({ endpoint, error: err.message })
    }
  }

  console.log(`   ✓ Passed: ${results.passed.length}`)
  console.log(`   ✗ Failed: ${results.failed.length}`)
  console.log(`   🐌 Slow: ${results.slow.length}`)
  
  return results
}

// ─── Notification ──────────────────────────────────────────────────────────

async function sendNotification(report, webhookUrl) {
  if (!webhookUrl) {
    console.log('\n⚠️  No SLACK_WEBHOOK_URL set, skipping notification')
    return
  }

  const s = report.summary
  const sev = report.severity
  
  const payload = {
    text: 'MUAPI Catalog Sync Report',
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: '🔄 MUAPI Catalog Sync' },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Added:*\n${s.added}` },
          { type: 'mrkdwn', text: `*Removed:*\n${s.removed}` },
          { type: 'mrkdwn', text: `*Modified:*\n${s.modified}` },
          { type: 'mrkdwn', text: `*Unchanged:*\n${s.unchanged}` },
        ],
      },
    ],
  }

  if (sev.critical > 0) {
    payload.blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `🚨 *${sev.critical} CRITICAL* changes detected!` },
    })
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    console.log('\n📨 Notification sent')
  } catch (err) {
    console.error('\n❌ Failed to send notification:', err.message)
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const shouldEmit = args.includes('--emit')
  const shouldHealthCheck = args.includes('--health-check')
  const shouldNotify = args.includes('--notify')
  const sourceMode = args.find(a => a.startsWith('--source='))?.split('=')[1] || 'live'
  const shouldCompareUpstream = args.includes('--compare-upstream')
  const shouldValidate = args.includes('--validate')

  console.log('═'.repeat(60))
  console.log('  MUAPI Catalog Sync & Diff Detection')
  console.log('═'.repeat(60))

  // Handle --compare-upstream mode
  if (shouldCompareUpstream) {
    const localDump = loadLocalModelsDump()
    const upstreamDump = fetchUpstreamModelsDump()
    const comparison = compareUpstreamVsLocal(localDump, upstreamDump)
    printUpstreamComparison(comparison)
    
    // Save comparison report
    ensureDir(DIFF_DIR)
    const reportPath = join(DIFF_DIR, `upstream-comparison-${today()}.json`)
    writeFileSync(reportPath, JSON.stringify(comparison, null, 2))
    console.log(`\n📊 Comparison saved: ${reportPath}`)
    
    // Exit with code 1 if there are differences
    const hasChanges = comparison.summary.addedUpstream > 0 || 
                       comparison.summary.removedUpstream > 0 || 
                       comparison.summary.modified > 0
    process.exit(hasChanges ? 1 : 0)
  }

  // Determine catalog source
  let catalog
  let models
  
  if (sourceMode === 'upstream') {
    const upstreamDump = fetchUpstreamModelsDump()
    models = flattenModelsDump(upstreamDump)
    catalog = { models, raw: upstreamDump }
    console.log(`\n📦 Using upstream source: ${models.length} models`)
  } else {
    catalog = await fetchCatalog()
    models = catalog.models
  }

  // Save catalog
  const catalogInfo = {
    totalModels: models.length,
    hash: hashContent(JSON.stringify(catalog)),
  }
  saveCatalog(catalog.raw)

  // Load previous catalog
  const previous = loadLatestCatalog()

  // Detect changes
  const changes = detectChanges(previous, catalog.raw)
  
  console.log(`\n📊 Changes detected:`)
  console.log(`   🟢 Added: ${changes.added.length}`)
  console.log(`   🔴 Removed: ${changes.removed.length}`)
  console.log(`   🟡 Modified: ${changes.modified.length}`)
  console.log(`   ⚪ Unchanged: ${changes.unchanged}`)

  // Generate report
  const { report, markdown } = generateReport(changes, catalogInfo)

  // Endpoint validation
  if (shouldValidate) {
    const validationResults = await validateEndpoints(models)
    printValidationResults(validationResults)
    report.validation = validationResults
    
    // Save updated report with validation
    ensureDir(DIFF_DIR)
    const reportPath = join(DIFF_DIR, `diff-${today()}-${catalogInfo.hash}.json`)
    writeFileSync(reportPath, JSON.stringify(report, null, 2))
  }

  // Health check
  if (shouldHealthCheck) {
    const health = await healthCheck(models)
    report.health = health
  }

  // Notification
  if (shouldNotify) {
    await sendNotification(report, process.env.SLACK_WEBHOOK_URL)
  }

  // Emit mode: update models.js
  if (shouldEmit) {
    console.log('\n📝 Emit mode: updating models.js...')
    // Import and run the existing emit logic
    const { emitModels } = await import('./verify-muapi-apis.mjs')
    await emitModels()
  }

  // Exit with appropriate code
  if (changes.added.length > 0 || changes.removed.length > 0 || changes.modified.length > 0) {
    console.log('\n✅ Changes detected and reported')
    process.exit(0)
  } else {
    console.log('\n✅ No changes detected - catalog is up to date')
    process.exit(0)
  }
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err)
  process.exit(1)
})
