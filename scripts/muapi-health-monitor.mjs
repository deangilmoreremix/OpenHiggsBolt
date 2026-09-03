#!/usr/bin/env node
/**
 * MUAPI Endpoint Health Monitor
 * 
 * Continuously monitors all MUAPI endpoints and reports status.
 * Can run as a standalone service or scheduled job.
 * 
 * Usage:
 *   node scripts/muapi-health-monitor.mjs                  # Run once
 *   node scripts/muapi-health-mjs --continuous --interval=30  # Run every 30 min
 *   node scripts/muapi-health-monitor.mjs --report         # Generate report
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from 'fs'
import { join } from 'path'

const MUAPI_BASE = 'https://api.muapi.ai/api/v1'
const HEALTH_DIR = 'monitoring'
const STATUS_FILE = join(HEALTH_DIR, 'endpoint-status.json')
const LOG_FILE = join(HEALTH_DIR, 'health-log.jsonl')

// Endpoint categories with their typical response characteristics
const ENDPOINT_CATEGORIES = {
  'text-to-image': {
    testPayload: { prompt: 'a red circle' },
    expectedStatus: [200, 400, 422],
    timeout: 10000,
  },
  'image-to-image': {
    testPayload: { prompt: 'modify this image', image_url: 'https://example.com/test.jpg' },
    expectedStatus: [200, 400, 422],
    timeout: 10000,
  },
  'text-to-video': {
    testPayload: { prompt: 'a cat walking', duration: 5 },
    expectedStatus: [200, 400, 422],
    timeout: 15000,
  },
  'image-to-video': {
    testPayload: { prompt: 'animate this', image_url: 'https://example.com/test.jpg' },
    expectedStatus: [200, 400, 422],
    timeout: 15000,
  },
  'video-to-video': {
    testPayload: { prompt: 'transform this video', video_url: 'https://example.com/test.mp4' },
    expectedStatus: [200, 400, 422],
    timeout: 15000,
  },
  'text-to-audio': {
    testPayload: { prompt: 'Hello world', voice_id: 'Friendly_Person' },
    expectedStatus: [200, 400, 422],
    timeout: 10000,
  },
  'lipsync': {
    testPayload: { audio_url: 'https://example.com/test.mp3', video_url: 'https://example.com/test.mp4' },
    expectedStatus: [200, 400, 422],
    timeout: 15000,
  },
}

class HealthMonitor {
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.MUAPI_API_KEY
    this.results = []
    this.startTime = Date.now()
  }

  async checkEndpoint(name, endpoint, category) {
    const config = ENDPOINT_CATEGORIES[category] || ENDPOINT_CATEGORIES['text-to-image']
    const url = `${MUAPI_BASE}/${endpoint}`
    
    const result = {
      name,
      endpoint,
      category,
      url,
      timestamp: new Date().toISOString(),
      status: 'unknown',
      httpStatus: null,
      responseTime: null,
      error: null,
    }

    const start = Date.now()
    
    try {
      const headers = { 'Content-Type': 'application/json' }
      if (this.apiKey) headers['x-api-key'] = this.apiKey

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(config.testPayload),
        signal: AbortSignal.timeout(config.timeout),
      })

      result.responseTime = Date.now() - start
      result.httpStatus = res.status

      if (config.expectedStatus.includes(res.status)) {
        result.status = 'healthy'
      } else if (res.status === 404) {
        result.status = 'not_found'
      } else if (res.status === 403 || res.status === 401) {
        // Endpoint exists but requires auth — this is expected for health checks
        // without a valid API key
        result.status = 'healthy'
      } else if (res.status >= 500) {
        result.status = 'server_error'
      } else {
        result.status = 'unexpected'
      }
    } catch (err) {
      result.responseTime = Date.now() - start
      result.error = err.message
      
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        result.status = 'timeout'
      } else {
        result.status = 'network_error'
      }
    }

    return result
  }

  async checkAll(endpoints) {
    console.log(`\n🏥 Checking ${endpoints.length} endpoints...`)
    
    const batchSize = 5
    for (let i = 0; i < endpoints.length; i += batchSize) {
      const batch = endpoints.slice(i, i + batchSize)
      const promises = batch.map(ep => this.checkEndpoint(ep.name, ep.endpoint, ep.category))
      const results = await Promise.all(promises)
      this.results.push(...results)
      
      // Progress indicator
      const progress = Math.min(((i + batchSize) / endpoints.length) * 100, 100)
      process.stdout.write(`\r   Progress: ${progress.toFixed(0)}%`)
    }
    
    console.log('\n')
    return this.results
  }

  generateReport() {
    const total = this.results.length
    const healthy = this.results.filter(r => r.status === 'healthy').length
    const failed = this.results.filter(r => !['healthy', 'not_found'].includes(r.status)).length
    const notFound = this.results.filter(r => r.status === 'not_found').length
    const timeouts = this.results.filter(r => r.status === 'timeout').length

    const avgResponseTime = this.results
      .filter(r => r.responseTime)
      .reduce((sum, r) => sum + r.responseTime, 0) / this.results.length

    const report = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      summary: {
        total,
        healthy,
        failed,
        notFound,
        timeouts,
        healthyPercent: ((healthy / total) * 100).toFixed(1),
        avgResponseTime: Math.round(avgResponseTime),
      },
      endpoints: this.results,
      failures: this.results.filter(r => !['healthy', 'not_found'].includes(r.status)),
    }

    return report
  }

  saveResults(report) {
    ensureDir(HEALTH_DIR)
    
    // Save latest status
    writeFileSync(STATUS_FILE, JSON.stringify(report, null, 2))
    
    // Append to log
    appendFileSync(LOG_FILE, JSON.stringify({
      timestamp: report.timestamp,
      summary: report.summary,
    }) + '\n')

    console.log(`   ✓ Results saved to ${STATUS_FILE}`)
  }

  printReport(report) {
    const s = report.summary
    
    console.log('\n' + '═'.repeat(60))
    console.log('  MUAPI Endpoint Health Report')
    console.log('═'.repeat(60))
    console.log(`\n  Total Endpoints: ${s.total}`)
    console.log(`  ✅ Healthy: ${s.healthy} (${s.healthyPercent}%)`)
    console.log(`  ❌ Failed: ${s.failed}`)
    console.log(`  🔍 Not Found: ${s.notFound}`)
    console.log(`  ⏱️  Timeouts: ${s.timeouts}`)
    console.log(`  ⚡ Avg Response: ${s.avgResponseTime}ms`)
    
    if (report.failures.length > 0) {
      console.log('\n  ── Failures ──')
      for (const f of report.failures) {
        console.log(`  ✗ ${f.name} (${f.endpoint}): ${f.status} - ${f.error || f.httpStatus}`)
      }
    }
    
    console.log('\n' + '═'.repeat(60))
  }
}

// ─── Load endpoints from models.js ─────────────────────────────────────────

async function loadEndpoints() {
  const { pathToFileURL } = await import('url')
  const { join } = await import('path')

  const MODELS_SRC = join(process.cwd(), 'packages/studio/src/models.js')
  const mod = await import(pathToFileURL(MODELS_SRC).href)
  
  const endpoints = []
  const arrays = [
    { name: 't2i', models: mod.t2iModels, category: 'text-to-image' },
    { name: 't2v', models: mod.t2vModels, category: 'text-to-video' },
    { name: 'i2i', models: mod.i2iModels, category: 'image-to-image' },
    { name: 'i2v', models: mod.i2vModels, category: 'image-to-video' },
    { name: 'v2v', models: mod.v2vModels, category: 'video-to-video' },
    { name: 'audio', models: mod.audioModels, category: 'text-to-audio' },
    { name: 'lipsync', models: mod.lipsyncModels, category: 'lipsync' },
  ]

  for (const { name, models, category } of arrays) {
    if (!Array.isArray(models)) continue
    for (const m of models) {
      const endpoint = m.endpoint?.replace(/^\/api\/v1\//, '')
      if (endpoint) {
        endpoints.push({ name: m.name || m.id, endpoint, category })
      }
    }
  }

  return endpoints
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const continuous = args.includes('--continuous')
  const interval = parseInt(args.find(a => a.startsWith('--interval='))?.split('=')[1] || '30')

  console.log('═'.repeat(60))
  console.log('  MUAPI Endpoint Health Monitor')
  console.log('═'.repeat(60))

  const endpoints = await loadEndpoints()
  console.log(`\n  Loaded ${endpoints.length} endpoints from models.js`)

  const monitor = new HealthMonitor()

  if (continuous) {
    console.log(`\n  Running continuously every ${interval} minutes...`)
    console.log('  Press Ctrl+C to stop\n')
    
    while (true) {
      await runCheck(monitor, endpoints)
      console.log(`\n  Next check in ${interval} minutes...`)
      await new Promise(resolve => setTimeout(resolve, interval * 60 * 1000))
    }
  } else {
    await runCheck(monitor, endpoints)
  }
}

async function runCheck(monitor, endpoints) {
  await monitor.checkAll(endpoints)
  const report = monitor.generateReport()
  monitor.printReport(report)
  monitor.saveResults(report)
  
  // Exit with error code if too many failures
  if (report.summary.failed > report.summary.total * 0.2) {
    console.log('\n  ⚠️  More than 20% of endpoints failed!')
    process.exit(1)
  }
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err)
  process.exit(1)
})

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}
