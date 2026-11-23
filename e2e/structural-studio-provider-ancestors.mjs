#!/usr/bin/env node
/**
 * P3-F structural check — exactly-one-`DemoPersonalizeProvider`-ancestor per
 * Personalize trigger.
 *
 * The invariant: every studio that renders a Personalize trigger must have
 * exactly ONE `DemoPersonalizeProvider` render-tree ancestor — not zero
 * (`useDemoPersonalize` throws: "must be used within DemoPersonalizeProvider"),
 * not two (a nested second provider breaks the context).
 *
 * For each trigger the script walks its hand-verified ancestor chain
 * (trigger file -> layout/shell nodes, each verified against the filesystem)
 * and counts the `<DemoPersonalizeProvider` mounts after stripping comments.
 *
 * Also proves:
 *   - the newly-wired studios actually accept the render prop,
 *   - StandaloneShell.js really passes `renderPersonalizeAction` to
 *     VFX Studio and Thumbnail Studio (the additive app-root wiring),
 *   - no cross-package import: `packages/studio/src` never imports
 *     `@/shared/personalization` (the package is published standalone),
 *   - P3-B's z-index edits in `src/apps/vfx-studio/**` are preserved exactly
 *     (MotionControlStudio z-[240], ImageUrlModal 240, VFXGenerate 240).
 *
 * Usage: node e2e/structural-studio-provider-ancestors.mjs   (exit 0 = pass)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..');

let FAIL = 0;
const pass = (msg) => console.log(`  PASS  ${msg}`);
const fail = (msg) => { console.log(`  FAIL  ${msg}`); FAIL = 1; };

/** Strips block comments and line comments, then returns the source. */
function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:'"])\/\/.*$/gm, '$1');
}

function readIfExists(rel) {
  const abs = path.join(REPO_ROOT, rel);
  if (!fs.existsSync(abs)) return null;
  return fs.readFileSync(abs, 'utf8');
}

function countMounts(rel) {
  const source = readIfExists(rel);
  if (source === null) return null;
  return (stripComments(source).match(/<DemoPersonalizeProvider\b/g) || []).length;
}

// ── The five newly-wired triggers and their ancestor chains ──────────────────
const TRIGGERS = [
  {
    name: 'Brand Studio (Brand DNA, /brand/[id])',
    file: 'app/(brand-studio)/brand/[id]/page.tsx',
    ancestors: ['app/(brand-studio)/layout.tsx'],
    triggerMarker: 'PersonalizeVideoAction',
  },
  {
    name: 'Photo Studio (/photo-studio)',
    file: 'app/(brand-studio)/photo-studio/page.tsx',
    ancestors: ['app/(brand-studio)/layout.tsx'],
    triggerMarker: 'PersonalizeVideoAction',
  },
  {
    name: 'Academy (/academy)',
    file: 'app/academy/page.tsx',
    ancestors: [],
    triggerMarker: 'PersonalizeVideoAction',
  },
  {
    name: 'VFX Studio (/studio/vfx-studio, BottomInputBar page)',
    file: 'src/apps/vfx-studio/pages/VFXGenerate.tsx',
    ancestors: ['src/apps/vfx-studio/VFXStudio.tsx', 'components/StandaloneShell.js'],
    triggerMarker: 'renderPersonalizeAction',
  },
  {
    name: 'Thumbnail Studio (/studio/thumbnail-studio)',
    file: 'src/apps/thumbnail-studio/ThumbnailStudio.tsx',
    ancestors: ['components/StandaloneShell.js'],
    triggerMarker: 'renderPersonalizeAction',
  },
];

console.log('== P3-F structural check: exactly one DemoPersonalizeProvider ancestor per trigger ==');

for (const trigger of TRIGGERS) {
  const chain = [trigger.file, ...trigger.ancestors];
  const missing = chain.filter((rel) => !fs.existsSync(path.join(REPO_ROOT, rel)));
  if (missing.length > 0) {
    fail(`${trigger.name}: ancestor chain file(s) missing: ${missing.join(', ')}`);
    continue;
  }

  const counts = chain.map((rel) => ({ rel, mounts: countMounts(rel) }));
  const total = counts.reduce((sum, node) => sum + node.mounts, 0);

  const breakdown = counts
    .map((node) => `${node.rel}=${node.mounts}`)
    .join(', ');
  if (total === 1) {
    pass(`${trigger.name}: exactly ONE provider ancestor (${breakdown})`);
  } else {
    fail(`${trigger.name}: expected exactly 1 provider ancestor, found ${total} (${breakdown})`);
  }

  const source = readIfExists(trigger.file);
  if (!source.includes(trigger.triggerMarker)) {
    fail(`${trigger.name}: ${trigger.file} does not render a Personalize trigger (${trigger.triggerMarker})`);
  } else {
    pass(`${trigger.name}: trigger present in ${trigger.file}`);
  }
}

// ── StandaloneShell passes the render prop to the two shell-wired studios ────
console.log('== StandaloneShell.js app-root wiring ==');
const shell = readIfExists('components/StandaloneShell.js') ?? '';
// Each studio call site sits on its own line in StandaloneShell.js, so the
// check is line-based: the line that opens the component's JSX tag must also
// pass the render prop.
for (const component of ['VFXStudio', 'ThumbnailStudio']) {
  const callSite = shell
    .split('\n')
    .find((line) => line.includes(`<${component}`));
  if (callSite && callSite.includes('renderPersonalizeAction=')) {
    pass(`${component} receives renderPersonalizeAction from StandaloneShell.js`);
  } else {
    fail(`${component} does not receive renderPersonalizeAction from StandaloneShell.js`);
  }
}

// ── Cross-package import invariant ───────────────────────────────────────────
console.log('== Cross-package import invariant ==');
const studioDir = path.join(REPO_ROOT, 'packages', 'studio', 'src');
const offenders = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(abs);
    else if (/\.(js|jsx|ts|tsx|mjs)$/.test(entry.name)) {
      const source = fs.readFileSync(abs, 'utf8');
      if (source.includes('@/shared/personalization') || source.includes('@/components/PersonalizeVideoAction')) {
        offenders.push(path.relative(REPO_ROOT, abs));
      }
    }
  }
})(studioDir);
if (offenders.length === 0) {
  pass('packages/studio/src has ZERO app-root personalization imports');
} else {
  fail(`cross-package personalization import(s) found: ${offenders.join(', ')}`);
}

// ── P3-B z-index edits preserved exactly ─────────────────────────────────────
console.log('== P3-B z-index preservation ==');
const Z_CHECKS = [
  { file: 'packages/studio/src/components/MotionControlStudio.jsx', marker: 'z-[240]' },
  { file: 'src/apps/vfx-studio/components/ImageUrlModal.tsx', marker: 'zIndex: 240' },
  { file: 'src/apps/vfx-studio/pages/VFXGenerate.tsx', marker: 'zIndex: 240' },
];
for (const check of Z_CHECKS) {
  const source = readIfExists(check.file);
  if (source !== null && source.includes(check.marker)) {
    pass(`${check.file}: P3-B z-index (${check.marker}) preserved`);
  } else {
    fail(`${check.file}: P3-B z-index (${check.marker}) NOT found`);
  }
}

console.log(FAIL === 0 ? '\nALL CHECKS PASSED' : '\nCHECKS FAILED');
process.exit(FAIL);
