/**
 * Static contract test for the API entitlement-gate surface.
 *
 * This walks every route.(ts|js) file under app/api and asserts that the
 * entitlement gate (`requireApiEntitlement`) is applied to EXACTLY the paid
 * surface and to nothing else. It is a regression guard: when someone adds a
 * new route that should be gated (or forgets to gate one, or accidentally
 * gates a read-only route), the diff below fails loudly and lists the
 * offenders instead of drifting silently.
 *
 * (a) PAID SURFACE - every file below MUST import/contain `requireApiEntitlement`.
 * (b) READ-ONLY ALLOWLIST - every file below MUST NOT reference it.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative, sep } from 'path'

const repoRoot = process.cwd()
const API_ROOT = join(repoRoot, 'app', 'api')

const GATE_SYMBOL = 'requireApiEntitlement'

// ---------------------------------------------------------------------------
// The paid surface — routes that use server-side resources (not pure BYOK)
// and therefore remain gated for quota/monetization protection.
//
// BYOK routes (VFX, proxy/*, photo-studio, design-agent/*, upload routes,
// personalization image-* and project) have been moved OUT of this list
// because they validate the user's own API key and must remain free.
// ---------------------------------------------------------------------------
const PAID_PATHS: string[] = [
  // storyboard / agents / workflow / app catch-alls
  'app/api/storyboard/[[...path]]/route.ts',
  'app/api/agents/[[...path]]/route.js',
  'app/api/workflow/[[...path]]/route.js',
  'app/api/app/[[...path]]/route.js',
  // v1 surface (server-side proxy routes that are not pure BYOK)
  'app/api/api/v1/[[...path]]/route.js',
  'app/api/v1/creative-agent/[[...path]]/route.js',
  // personalization (server-side resource routes; gated for quota protection)
  'app/api/personalization/find-businesses/route.ts',
  'app/api/personalization/research-business/route.ts',
  'app/api/personalization/download-image/route.ts',
  'app/api/personalization/discover-assets/route.ts',
]

// ---------------------------------------------------------------------------
// Read-only / public surface. EXPLICIT paths (with extensions).
// ---------------------------------------------------------------------------
const ALLOWLIST_PATHS: string[] = [
  'app/api/go-ai-viral/seedance/route.ts',
  'app/api/thumbnail/route.js',
  'app/api/brand/route.ts',
  'app/api/brands/route.ts',
  'app/api/access/resolve/route.ts',
  'app/api/access/restore/route.ts',
  'app/api/version/route.ts',
  'app/api/academy/content/route.ts',
  'app/api/go-ai-viral/health/route.ts',
  'app/api/go-ai-viral/prompts/route.ts',
  'app/api/go-ai-viral/stats/route.ts',
  'app/api/stripe/checkout/route.ts',
  'app/api/workspace/provision/route.ts',
  'app/api/dev-login/route.ts',
  // auth/*
  'app/api/auth/muapi-key/route.ts',
  'app/api/auth/openai-key/route.ts',
  'app/api/auth/whoami/route.ts',
  // webhooks/*
  'app/api/webhooks/clerk/route.ts',
  'app/api/webhooks/stripe/route.ts',
]

function walkRouteFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...walkRouteFiles(full))
      continue
    }
    if (/^route\.(ts|js)$/.test(entry.name) && statSync(full).isFile()) {
      out.push(full)
    }
  }
  return out
}

function toPosix(p: string): string {
  return relative(repoRoot, p).split(sep).join('/')
}

function readSafe(absPath: string): string {
  return readFileSync(join(repoRoot, absPath), 'utf-8')
}

describe('api entitlement-gate contract (static walk of app/api/**/route.*)', () => {
  const allRouteFiles = walkRouteFiles(API_ROOT)
  const gatedActual = allRouteFiles
    .filter((abs) => readFileSync(abs, 'utf-8').includes(GATE_SYMBOL))
    .map(toPosix)
    .sort()
  const expectedGated = [...PAID_PATHS].sort()

  it('found a non-trivial number of route files (walk sanity)', () => {
    expect(allRouteFiles.length).toBeGreaterThan(20)
  })

  it('(a) every paid-surface route imports the entitlement gate', () => {
    const missing: string[] = []
    for (const rel of PAID_PATHS) {
      let source: string
      try {
        source = readSafe(rel)
      } catch {
        throw new Error(`PAID_PATHS entry does not exist on disk: ${rel}`)
      }
      if (!source.includes(GATE_SYMBOL)) missing.push(rel)
    }
    expect(missing, `paid routes missing ${GATE_SYMBOL}:\n  ${missing.join('\n  ')}`).toEqual([])
  })

  it('(a) the on-disk set of gated routes exactly matches the paid-surface list (regression guard)', () => {
    const addedGated = gatedActual.filter((f) => !expectedGated.includes(f))
    const droppedGated = expectedGated.filter((f) => !gatedActual.includes(f))
    expect(
      addedGated,
      `NEW gated route(s) not listed in PAID_PATHS — add them to the contract:\n  ${addedGated.join('\n  ')}`,
    ).toEqual([])
    expect(
      droppedGated,
      `paid-surface entries that no longer import the gate (removed gate?):\n  ${droppedGated.join('\n  ')}`,
    ).toEqual([])
  })

  it('(b) no read-only allowlist route imports the entitlement gate', () => {
    const violations: string[] = []
    for (const rel of ALLOWLIST_PATHS) {
      let source: string
      try {
        source = readSafe(rel)
      } catch {
        throw new Error(`ALLOWLIST_PATHS entry does not exist on disk: ${rel}`)
      }
      if (source.includes(GATE_SYMBOL)) violations.push(rel)
    }
    expect(
      violations,
      `read-only routes unexpectedly gated:\n  ${violations.join('\n  ')}`,
    ).toEqual([])
  })

  it('(b) the paid and read-only lists do not overlap', () => {
    const overlap = ALLOWLIST_PATHS.filter((f) => PAID_PATHS.includes(f))
    expect(overlap, `overlapping paid/allowlist entries:\n  ${overlap.join('\n  ')}`).toEqual([])
  })
})
