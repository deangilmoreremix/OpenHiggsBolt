#!/usr/bin/env node
/**
 * Model Diff Checker
 * 
 * Compares local and upstream models_dump.json files and reports differences.
 * Useful for CI/CD pipelines to detect model catalog changes.
 * 
 * Usage:
 *   node scripts/model-diff-checker.mjs                  # Compare local vs upstream
 *   node scripts/model-diff-checker.mjs --json            # Output JSON for CI
 *   node scripts/model-diff-checker.mjs --local=path     # Specify local file path
 *   node scripts/model-diff-checker.mjs --upstream=branch # Specify upstream branch
 *   node scripts/model-diff-checker.mjs --quiet           # Suppress output, use exit code only
 * 
 * Exit codes:
 *   0 - No changes detected
 *   1 - Changes detected (additions, removals, or modifications)
 *   2 - Error reading files
 * 
 * Environment Variables:
 *   MODELS_DUMP_PATH - Override default models_dump.json path
 */

import { readFileSync, existsSync } from 'fs'
import { execSync } from 'child_process'

const MODELS_DUMP = process.env.MODELS_DUMP_PATH || 'models_dump.json'
const DEFAULT_UPSTREAM = 'upstream/main'

// ─── Argument Parsing ──────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2)
  const options = {
    json: false,
    quiet: false,
    localPath: MODELS_DUMP,
    upstreamBranch: DEFAULT_UPSTREAM,
  }
  
  for (const arg of args) {
    if (arg === '--json') {
      options.json = true
    } else if (arg === '--quiet' || arg === '-q') {
      options.quiet = true
    } else if (arg.startsWith('--local=')) {
      options.localPath = arg.split('=')[1]
    } else if (arg.startsWith('--upstream=')) {
      options.upstreamBranch = arg.split('=')[1]
    } else if (arg === '--help' || arg === '-h') {
      printHelp()
      process.exit(0)
    }
  }
  
  return options
}

function printHelp() {
  console.log(`
Model Diff Checker - Compare local and upstream models_dump.json

Usage:
  node scripts/model-diff-checker.mjs [options]

Options:
  --json              Output machine-readable JSON
  --quiet, -q         Suppress console output, use exit code only
  --local=path        Path to local models_dump.json (default: models_dump.json)
  --upstream=branch   Upstream branch to compare (default: upstream/main)
  --help, -h          Show this help message

Exit codes:
  0  No changes detected
  1  Changes detected
  2  Error reading files
`)
}

// ─── File Loading ──────────────────────────────────────────────────────────

function loadLocalModels(path) {
  if (!existsSync(path)) {
    throw new Error(`Local models file not found: ${path}`)
  }
  
  try {
    const content = readFileSync(path, 'utf8')
    return JSON.parse(content)
  } catch (err) {
    throw new Error(`Failed to parse local models file: ${err.message}`)
  }
}

function loadUpstreamModels(branch) {
  try {
    const content = execSync(`git show ${branch}:models_dump.json`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    return JSON.parse(content)
  } catch (err) {
    throw new Error(`Failed to load upstream models from ${branch}: ${err.message}`)
  }
}

// ─── Flattening ────────────────────────────────────────────────────────────

function flattenModels(dump) {
  const models = []
  const byId = new Map()
  
  for (const [category, entries] of Object.entries(dump)) {
    if (!Array.isArray(entries)) continue
    for (const entry of entries) {
      const model = {
        id: entry.id,
        name: entry.name,
        category: category,
        endpoint: entry.endpoint,
        inputs: entry.inputs,
        provider: entry.provider || entry.family,
      }
      models.push(model)
      byId.set(entry.id, model)
    }
  }
  
  return { models, byId }
}

// ─── Comparison ────────────────────────────────────────────────────────────

function compareModels(localDump, upstreamDump) {
  const local = flattenModels(localDump)
  const upstream = flattenModels(upstreamDump)
  
  const result = {
    timestamp: new Date().toISOString(),
    summary: {
      local: local.models.length,
      upstream: upstream.models.length,
      added: 0,
      removed: 0,
      modified: 0,
      unchanged: 0,
    },
    changes: {
      added: [],
      removed: [],
      modified: [],
    },
  }
  
  // Check for added and modified models
  for (const [id, upstreamModel] of upstream.byId) {
    const localModel = local.byId.get(id)
    
    if (!localModel) {
      // Model exists upstream but not locally
      result.changes.added.push({
        id,
        name: upstreamModel.name,
        category: upstreamModel.category,
        endpoint: upstreamModel.endpoint,
        provider: upstreamModel.provider,
      })
      result.summary.added++
    } else {
      // Model exists in both - check for modifications
      const modifications = compareModelDetails(localModel, upstreamModel)
      if (modifications.length > 0) {
        result.changes.modified.push({
          id,
          name: upstreamModel.name,
          category: upstreamModel.category,
          changes: modifications,
        })
        result.summary.modified++
      } else {
        result.summary.unchanged++
      }
    }
  }
  
  // Check for removed models (exist locally but not upstream)
  for (const [id, localModel] of local.byId) {
    if (!upstream.byId.has(id)) {
      result.changes.removed.push({
        id,
        name: localModel.name,
        category: localModel.category,
        endpoint: localModel.endpoint,
        provider: localModel.provider,
      })
      result.summary.removed++
    }
  }
  
  return result
}

function compareModelDetails(local, upstream) {
  const changes = []
  
  // Compare name
  if (local.name !== upstream.name) {
    changes.push({
      field: 'name',
      local: local.name,
      upstream: upstream.name,
    })
  }
  
  // Compare provider
  if (local.provider !== upstream.provider) {
    changes.push({
      field: 'provider',
      local: local.provider,
      upstream: upstream.provider,
    })
  }
  
  // Compare endpoint
  if (local.endpoint !== upstream.endpoint) {
    changes.push({
      field: 'endpoint',
      local: local.endpoint,
      upstream: upstream.endpoint,
    })
  }
  
  // Compare input schemas
  const inputChanges = compareInputs(local.inputs, upstream.inputs)
  if (inputChanges.length > 0) {
    changes.push({
      field: 'inputs',
      changes: inputChanges,
    })
  }
  
  return changes
}

function compareInputs(localInputs, upstreamInputs) {
  const changes = []
  const localKeys = new Set(Object.keys(localInputs || {}))
  const upstreamKeys = new Set(Object.keys(upstreamInputs || {}))
  const allKeys = new Set([...localKeys, ...upstreamKeys])
  
  for (const key of allKeys) {
    const localInput = localInputs?.[key]
    const upstreamInput = upstreamInputs?.[key]
    
    if (!localInput) {
      changes.push({
        type: 'added',
        field: key,
        value: summarizeInput(upstreamInput),
      })
    } else if (!upstreamInput) {
      changes.push({
        type: 'removed',
        field: key,
        value: summarizeInput(localInput),
      })
    } else if (JSON.stringify(localInput) !== JSON.stringify(upstreamInput)) {
      changes.push({
        type: 'modified',
        field: key,
        local: summarizeInput(localInput),
        upstream: summarizeInput(upstreamInput),
      })
    }
  }
  
  return changes
}

function summarizeInput(input) {
  if (!input) return null
  return {
    type: input.type,
    name: input.name,
    title: input.title,
    default: input.default,
    enum: input.enum,
  }
}

// ─── Output ────────────────────────────────────────────────────────────────

function printTextReport(result) {
  const s = result.summary
  
  console.log('═'.repeat(60))
  console.log('  Model Diff Report')
  console.log('═'.repeat(60))
  console.log(`\n  Timestamp: ${result.timestamp}`)
  console.log(`  Local models: ${s.local}`)
  console.log(`  Upstream models: ${s.upstream}`)
  console.log(`\n  🟢 Added (upstream): ${s.added}`)
  console.log(`  🔴 Removed (upstream): ${s.removed}`)
  console.log(`  🟡 Modified: ${s.modified}`)
  console.log(`  ⚪ Unchanged: ${s.unchanged}`)
  
  if (result.changes.added.length > 0) {
    console.log('\n  ── Added Models (in upstream, not local) ──')
    for (const m of result.changes.added) {
      console.log(`  + ${m.name} (${m.id}) [${m.category}]`)
      if (m.provider) console.log(`    Provider: ${m.provider}`)
      if (m.endpoint) console.log(`    Endpoint: ${m.endpoint}`)
    }
  }
  
  if (result.changes.removed.length > 0) {
    console.log('\n  ── Removed Models (in local, not upstream) ──')
    for (const m of result.changes.removed) {
      console.log(`  - ${m.name} (${m.id}) [${m.category}]`)
      if (m.provider) console.log(`    Provider: ${m.provider}`)
      if (m.endpoint) console.log(`    Endpoint: ${m.endpoint}`)
    }
  }
  
  if (result.changes.modified.length > 0) {
    console.log('\n  ── Modified Models ──')
    for (const m of result.changes.modified) {
      console.log(`  ~ ${m.name} (${m.id}) [${m.category}]`)
      for (const change of m.changes) {
        if (change.field === 'inputs') {
          console.log(`    Inputs changed:`)
          for (const inputChange of change.changes) {
            if (inputChange.type === 'added') {
              console.log(`      + ${inputChange.field} (${inputChange.value?.type})`)
            } else if (inputChange.type === 'removed') {
              console.log(`      - ${inputChange.field} (${inputChange.value?.type})`)
            } else {
              console.log(`      ~ ${inputChange.field}: ${inputChange.local?.type} → ${inputChange.upstream?.type}`)
            }
          }
        } else {
          console.log(`    ${change.field}: ${JSON.stringify(change.local)} → ${JSON.stringify(change.upstream)}`)
        }
      }
    }
  }
  
  const hasChanges = s.added > 0 || s.removed > 0 || s.modified > 0
  console.log('\n' + '═'.repeat(60))
  console.log(`  Result: ${hasChanges ? 'CHANGES DETECTED' : 'NO CHANGES'}`)
  console.log('═'.repeat(60))
}

function printJsonReport(result) {
  const hasChanges = result.summary.added > 0 || 
                     result.summary.removed > 0 || 
                     result.summary.modified > 0
  
  const output = {
    ...result,
    hasChanges,
  }
  
  console.log(JSON.stringify(output, null, 2))
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  const options = parseArgs()
  
  try {
    const localModels = loadLocalModels(options.localPath)
    const upstreamModels = loadUpstreamModels(options.upstreamBranch)
    
    const result = compareModels(localModels, upstreamModels)
    
    if (!options.quiet) {
      if (options.json) {
        printJsonReport(result)
      } else {
        printTextReport(result)
      }
    }
    
    // Exit code: 0 = no changes, 1 = changes detected
    const hasChanges = result.summary.added > 0 || 
                       result.summary.removed > 0 || 
                       result.summary.modified > 0
    process.exit(hasChanges ? 1 : 0)
    
  } catch (err) {
    if (!options.quiet) {
      if (options.json) {
        console.log(JSON.stringify({ error: err.message }, null, 2))
      } else {
        console.error(`\n❌ Error: ${err.message}`)
      }
    }
    process.exit(2)
  }
}

main()
