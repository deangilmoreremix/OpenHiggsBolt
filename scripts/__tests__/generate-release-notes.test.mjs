/**
 * generate-release-notes.test.mjs — tests for scripts/generate-release-notes.mjs
 *
 * Run with an explicit vitest config that includes scripts/__tests__/**
 * (the repo vitest.config.ts does not cover scripts/**), e.g.:
 *
 *   npx vitest run --config /tmp/vitest-notes.config.mjs
 */

import { describe, expect, it } from 'vitest'
import { fileURLToPath } from 'node:url'
import {
  buildDeployMessage,
  categorizeChanges,
  generateReleaseNotes,
} from '../generate-release-notes.mjs'

const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url))

// The real parity release range.
const BASE = '7ebc20967c31293d7bc133ac6aed28885b1baefc'
const HEAD = '208b36b2e8b1eb99dd3f21dad9803a163d7299d8'

const REQUIRED_SECTIONS = [
  '## Summary',
  '## Features added or updated',
  '## Bugs fixed',
  '## Personalization Modal changes',
  '## Business Asset Finder changes',
  '## Video Studio and Motion Studio changes',
  '## API and backend changes',
  '## Tests passed or failed',
  '## Release metadata',
  '## Known issues',
  '## Rollback information',
]

function sectionOf(markdown, heading) {
  const index = markdown.indexOf(heading)
  expect(index, `section ${heading} present`).toBeGreaterThanOrEqual(0)
  const rest = markdown.slice(index + heading.length)
  const next = rest.indexOf('\n## ')
  return next === -1 ? rest : rest.slice(0, next)
}

describe('categorizeChanges', () => {
  it('buckets representative Personalization / Business-Asset / Video-Motion / API paths', () => {
    const files = [
      'src/shared/personalization/modelCapabilityResolver.ts',
      'components/PersonalizationModal.jsx',
      'app/personalization-demo/page.tsx',
      'app/api/personalization/discover-assets/route.ts',
      'app/api/personalization/find-businesses/route.ts',
      'src/shared/personalization/business/profile.ts',
      'BusinessAssetFinder.jsx',
      'packages/studio/src/components/VideoStudio.jsx',
      'packages/studio/src/components/MotionControlStudio.jsx',
      'packages/studio/src/models.js',
      'src/apps/video-studio/page.tsx',
      'packages/studio/src/muapi.js',
      'app/api/generate/route.ts',
      'netlify/functions/deploy-snapshot.js',
      'supabase/migrations/0001_init.sql',
      'README.md',
    ]
    const cats = categorizeChanges(files, [])
    expect(cats.personalization).toContain('src/shared/personalization/modelCapabilityResolver.ts')
    expect(cats.personalization).toContain('components/PersonalizationModal.jsx')
    expect(cats.personalization).toContain('app/personalization-demo/page.tsx')
    expect(cats.businessAssets).toContain('app/api/personalization/discover-assets/route.ts')
    expect(cats.businessAssets).toContain('app/api/personalization/find-businesses/route.ts')
    expect(cats.businessAssets).toContain('src/shared/personalization/business/profile.ts')
    expect(cats.businessAssets).toContain('BusinessAssetFinder.jsx')
    expect(cats.videoMotion).toContain('packages/studio/src/components/VideoStudio.jsx')
    expect(cats.videoMotion).toContain('packages/studio/src/components/MotionControlStudio.jsx')
    expect(cats.videoMotion).toContain('packages/studio/src/models.js')
    expect(cats.videoMotion).toContain('src/apps/video-studio/page.tsx')
    expect(cats.apiBackend).toContain('packages/studio/src/muapi.js')
    expect(cats.apiBackend).toContain('app/api/generate/route.ts')
    expect(cats.apiBackend).toContain('netlify/functions/deploy-snapshot.js')
    expect(cats.apiBackend).toContain('supabase/migrations/0001_init.sql')
    expect(cats.other).toEqual(['README.md'])
    // src/shared/personalization/** is Personalization; only its business/**
    // subpath is Business Asset Finder.
    expect(cats.businessAssets).not.toContain('src/shared/personalization/modelCapabilityResolver.ts')
  })

  it('splits feat vs fix vs other commit subjects', () => {
    const subjects = [
      'feat: add motion presets',
      'feature(uploads): multi-file input',
      'add dark mode toggle',
      'fix: aspect ratio fallback',
      'fix(studio): restore social publishing',
      'bug: wrong duration',
      'hotfix: rollback catalog',
      'revert: bad model list',
      'chore: bump deps',
      'docs: update readme',
    ]
    const cats = categorizeChanges([], subjects)
    expect(cats.features).toEqual([
      'feat: add motion presets',
      'feature(uploads): multi-file input',
      'add dark mode toggle',
    ])
    expect(cats.fixes).toEqual([
      'fix: aspect ratio fallback',
      'fix(studio): restore social publishing',
      'bug: wrong duration',
      'hotfix: rollback catalog',
      'revert: bad model list',
    ])
    expect(cats.other).toEqual(['chore: bump deps', 'docs: update readme'])
  })

  it('buckets files whose diff mentions personalization / finder identifiers', () => {
    const cats = categorizeChanges(
      ['src/app/foo.tsx', 'src/app/bar.ts'],
      [],
      { personalization: ['src/app/foo.tsx'], businessAssets: ['src/app/bar.ts'] },
    )
    expect(cats.personalization).toContain('src/app/foo.tsx')
    expect(cats.businessAssets).toContain('src/app/bar.ts')
  })
})

describe('generateReleaseNotes over the real parity range', () => {
  const notes = generateReleaseNotes({
    repoRoot: REPO_ROOT,
    baseSha: BASE,
    headSha: HEAD,
    deployId: 'deploy-test-123',
    deployUrl: 'https://parity-test.netlify.app',
    stage: 'PROD',
    status: 'ready',
    verification: 'Production checks passed (render + auth smoke)',
    testResults: { passed: 4, failed: 0, total: 4, summary: 'vitest run ok' },
    rollback: { previousDeployId: 'deploy-prev-999', restoreCommand: 'git revert && redeploy' },
    writeFile: false,
    timestamp: '2026-10-21T06:45:32.000Z',
  })

  it('contains every required section', () => {
    for (const heading of REQUIRED_SECTIONS) {
      expect(notes).toContain(heading)
    }
  })

  it('traces bullets to real changed files', () => {
    expect(notes).toContain('packages/studio/src/components/VideoStudio.jsx')
    expect(notes).toContain('packages/studio/src/muapi.js')
    expect(notes).toContain('src/shared/personalization/__tests__/modelCapabilityResolver.test.ts')
  })

  it('populates the Personalization and Business Asset Finder sections from the real range', () => {
    const personalization = sectionOf(notes, '## Personalization Modal changes')
    expect(personalization).toContain('src/shared/personalization/__tests__/modelCapabilityResolver.test.ts')
    // The real range's diff (verified: grep for
    // find-businesses|discover-assets|research-business over
    // `git diff 7ebc20967..208b36b2e` returns 0 matches) does not touch the
    // Business Asset Finder; asserting it populated here would require
    // inventing changes. Bucketing for that section is covered by the
    // synthetic categorizeChanges tests above and by the mention test below.
    const cats = categorizeChanges(
      ['app/api/personalization/research-business/route.ts'],
      [],
      {},
    )
    expect(cats.businessAssets).toContain('app/api/personalization/research-business/route.ts')
  })

  it('yields "No changes" in untouched sections for a small unrelated range', () => {
    // Single-commit range touching only EXACT_UPSTREAM_STUDIO_PARITY.md.
    const small = generateReleaseNotes({
      repoRoot: REPO_ROOT,
      baseSha: '2661973ae^',
      headSha: '2661973ae',
      deployId: 'deploy-small',
      status: 'ready',
      writeFile: false,
    })
    expect(sectionOf(small, '## Personalization Modal changes')).toContain('No changes')
    expect(sectionOf(small, '## Business Asset Finder changes')).toContain('No changes')
    expect(sectionOf(small, '## Video Studio and Motion Studio changes')).toContain('No changes')
    expect(sectionOf(small, '## API and backend changes')).toContain('No changes')
    expect(sectionOf(small, '## Features added or updated')).toContain('No changes')
    expect(sectionOf(small, '## Bugs fixed')).toContain('No changes')
    expect(sectionOf(small, '## Release metadata')).toContain('deploy-small')
  })

  it('buildDeployMessage prefixes differ per stage and stays under 120 chars', () => {
    const counts = /Change size: \d+ files, \d+ features, \d+ fixes/
    expect(counts.test(notes)).toBe(true)
    const prod = buildDeployMessage(notes, { stage: 'PROD', sha: HEAD })
    const preview = buildDeployMessage(notes, { stage: 'PREVIEW', sha: HEAD })
    const draft = buildDeployMessage(notes, { stage: 'DRAFT', sha: HEAD })
    const release = buildDeployMessage(notes, { stage: 'mystery', sha: HEAD })
    expect(prod.startsWith('[PROD] ')).toBe(true)
    expect(preview.startsWith('[PREVIEW] ')).toBe(true)
    expect(draft.startsWith('[DRAFT] ')).toBe(true)
    expect(release.startsWith('[RELEASE] ')).toBe(true)
    for (const message of [prod, preview, draft, release]) {
      expect(message.length).toBeLessThan(120)
      expect(message).toContain('208b36b')
      expect(message).toMatch(/\(\d+ files, \d+ features, \d+ fixes\)$/)
    }
    expect(new Set([prod, preview, draft, release]).size).toBe(4)
  })

  it('redacts secret-looking strings', () => {
    const secret = generateReleaseNotes({
      repoRoot: REPO_ROOT,
      baseSha: HEAD,
      headSha: '2661973ae',
      deployId: 'deploy-redact',
      status: 'ready',
      knownIssues: [
        'Leaked key sk-abcdefghijklmnop123456 in logs',
        'Authorization: Bearer abcdef1234567890abcdef',
        'API_TOKEN=supersecretvalue123456',
        'checksum aabbccddeeff00112233445566778899aabbccdd',
      ],
      writeFile: false,
    })
    expect(secret).not.toContain('sk-abcdefghijklmnop123456')
    expect(secret).not.toContain('Bearer abcdef1234567890abcdef')
    expect(secret).not.toContain('supersecretvalue123456')
    expect(secret).not.toContain('aabbccddeeff00112233445566778899aabbccdd')
    expect(secret).toContain('[REDACTED_KEY]')
    expect(secret).toContain('Bearer [REDACTED]')
    expect(secret).toContain('API_TOKEN=[REDACTED]')
    expect(secret).toContain('[REDACTED_HEX]')
  })

  it('report carries git sha, deploy id and deployment status', () => {
    const metadata = sectionOf(notes, '## Release metadata')
    expect(metadata).toContain(HEAD)
    expect(metadata).toContain('deploy-test-123')
    expect(metadata).toContain('Deployment status: ready')
    expect(metadata).toContain('https://parity-test.netlify.app')
    expect(metadata).toContain('2026-10-21T06:45:32.000Z')
  })
})
