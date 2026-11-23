/**
 * studioLayering.test.jsx — lock in the modal z-index ceiling.
 *
 * Phase 2 raised the Personalization Modal to `z-[250]`. The Phase 3 audit
 * (docs/phase3/WAVE1_AUDIT.md §2.2) found three modal-shaped residuals that
 * still layered ABOVE it — `MotionControlStudio.jsx` at `z-[300]`,
 * `vfx-studio/components/ImageUrlModal.tsx` at `zIndex: 1000` and
 * `vfx-studio/pages/VFXGenerate.tsx` at `zIndex: 2000` — and lowered them to
 * 240. This test is the regression guard.
 *
 * THE RULE
 *   The Personalization Modal is the reference layer at `z-[250]`. No other
 *   modal-shaped overlay may sit at or above 250, with exactly two exceptions:
 *
 *     - the UPGRADE GATE (`src/access/UpgradeModal.tsx`, `z-[300]`) — it is
 *       allowed to sit above the personalization modal by design;
 *     - the Personalization Modal itself, at exactly 250.
 *
 *   Two tiers are intentionally TOPMOST and must never be lowered:
 *
 *     - toasts (`zIndex: 99999`) — a toast must be visible over any modal;
 *     - dropdowns (`z-[80]` in `UniversalMediaUploader.jsx`) — the open menu
 *       must stay above the panel it belongs to.
 *
 * The test reads the source tree directly (no rendering): the ceiling is a
 * structural property, and `docs/phase3/validate.sh P3-B` is the
 * orchestrator's check. This test makes the same rule executable inside
 * `npm run test:unit`.
 *
 * The detector is deliberately wider than the first cut, which only matched
 * the Tailwind class `fixed inset-0` and therefore MISSED the vfx-studio
 * modals — they are written as inline style objects (`position: 'fixed'`).
 * It now also detects `inset: 0`, the four-value `top-0 left-0 right-0
 * bottom-0` form, and a `position: fixed` container whose z-index sits on a
 * child element.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

// This file lives at <repo>/packages/studio/src/components/__tests__/ , so the
// repository root is five levels up.
const REPO_ROOT = join(import.meta.dirname, '../../../../..');

/** Every tree the ceiling applies to — the whole app, not just the studios. */
export const SCAN_DIRS = [
  'packages/studio/src/components',
  'src/apps',
  'src/components',
  'src/access',
  'src/shared/personalization',
  'app',
  'components',
];

/** The Personalization Modal — the reference layer. */
const PERSONALIZATION_MODAL_RE = /personalizationmodal/i;
/** The upgrade gate — the one allowed modal above the ceiling. */
const UPGRADE_GATE_RE = /upgrade/i;

/**
 * A layer is MODAL-SHAPED when it is a full-screen fixed overlay. Matched
 * against a context window around the z-index line, because the positioning
 * and the z-index often live on different lines.
 */
const MODAL_SHAPE_RE =
  /fixed\s+inset-0|fixed\s+inset\b|position:\s*['"]fixed['"]|position:\s*['"]?fixed['"]?|inset:\s*0|inset-0|top-0\s+left-0\s+right-0\s+bottom-0/i;

/** Toasts are intentionally topmost. */
const TOAST_RE = /toast/i;
/** Dropdowns are intentionally above their own panel. */
const DROPDOWN_RE = /dropdown/i;

/** The ceiling: a modal at or above this occludes the Personalization Modal. */
export const CEILING = 250;

/**
 * @typedef {{ path: string, text: string }} SourceFile
 * @typedef {{ file: string, line: number, value: number, text: string }} Offender
 */

/** @param {string} dir @param {string[]} out @returns {string[]} */
function listFiles(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    const p = join(dir, name);
    let st;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === 'dist' || name === '.next') continue;
      listFiles(p, out);
    } else if (/\.(jsx?|tsx?)$/.test(name)) {
      // Test files quote the very values this guard forbids (e.g. `z-[250]`
      // in a comment) and are not shipped layers.
      if (/\.(test|spec)\.[jt]sx?$/.test(name)) continue;
      out.push(p);
    }
  }
  return out;
}

/** @param {string[]} lines @param {number} index @param {number} radius */
function readContext(lines, index, radius = 3) {
  const start = Math.max(0, index - radius);
  const end = Math.min(lines.length, index + radius + 1);
  return lines.slice(start, end).join('\n');
}

/**
 * The detector, as a pure function over source files, so it can be exercised
 * against synthetic sources. A detector that cannot fail is worthless.
 */
export function findLayeringOffenders(files) {
  /** @type {Offender[]} */
  const offenders = [];

  for (const file of files) {
    const lines = file.text.split('\n');
    lines.forEach((line, idx) => {
      const tail = line.match(/z-\[(\d{2,5})\]/);
      const inline = line.match(/zIndex:\s*['"]?(\d{2,5})/);
      const value = tail ? Number(tail[1]) : inline ? Number(inline[1]) : null;
      if (value === null || value < CEILING) return;

      const ctx = readContext(lines, idx);

      // Not a full-screen overlay — a sticky header, a badge, a toast.
      if (!MODAL_SHAPE_RE.test(ctx)) return;
      // Intentionally topmost tiers.
      if (TOAST_RE.test(ctx) || DROPDOWN_RE.test(ctx)) return;
      // The two allowed layers, at their exact values.
      if (value === 250 && PERSONALIZATION_MODAL_RE.test(file.path)) return;
      if (value === 300 && UPGRADE_GATE_RE.test(file.path)) return;

      offenders.push({ file: file.path, line: idx + 1, value, text: line.trim() });
    });
  }

  return offenders;
}

function collectSourceFiles() {
  const files = [];
  for (const dir of SCAN_DIRS) {
    const full = join(REPO_ROOT, dir);
    for (const file of listFiles(full)) {
      files.push({ path: relative(REPO_ROOT, file), text: readFileSync(file, 'utf8') });
    }
  }
  return files;
}

describe('z-index ceiling — no modal may layer at or above z-[250] except the upgrade gate', () => {
  it('scans a real tree — the ceiling check is not vacuous', () => {
    const files = collectSourceFiles();
    // A wrong REPO_ROOT, a renamed directory or a broken glob would make the
    // offender scan find nothing and pass silently. Assert the scan really
    // reached the app before trusting its verdict.
    expect(files.length).toBeGreaterThan(100);

    const paths = files.map((f) => f.path);
    expect(paths).toContain('packages/studio/src/components/MotionControlStudio.jsx');
    expect(paths).toContain('src/shared/personalization/PersonalizationModal.tsx');
    expect(paths).toContain('src/access/UpgradeModal.tsx');
    expect(paths.some((p) => p.startsWith('src/apps/vfx-studio/'))).toBe(true);
  });

  it('has zero modal offenders at z >= 250 across the whole app tree', () => {
    const offenders = findLayeringOffenders(collectSourceFiles());
    if (offenders.length > 0) {
      const msg = offenders.map((o) => `  ${o.file}:${o.line}  z=${o.value}  ${o.text}`).join('\n');
      throw new Error(`Unexpected high-z modals:\n${msg}`);
    }
    expect(offenders).toEqual([]);
  });

  it('finds the two allowed layers and does not count them as offenders', () => {
    const files = collectSourceFiles();
    const seen = files
      .map((f) => ({ path: f.path, values: [...f.text.matchAll(/z-\[(\d{2,5})\]/g)].map((m) => Number(m[1])) }))
      .filter((f) => f.values.includes(250) || f.values.includes(300));
    const paths = seen.map((f) => f.path);

    // The reference layer and the one allowed exception must actually be in
    // the scanned tree, or the "no offenders" verdict above means nothing.
    expect(paths.some((p) => PERSONALIZATION_MODAL_RE.test(p))).toBe(true);
    expect(paths.some((p) => UPGRADE_GATE_RE.test(p))).toBe(true);
  });

  it('detects a synthetic inline-style modal at zIndex 2000', () => {
    const offenders = findLayeringOffenders([
      {
        path: 'src/apps/example/SomeModal.tsx',
        text: "const overlay = { position: 'fixed', inset: 0, zIndex: 2000 };",
      },
    ]);
    expect(offenders).toHaveLength(1);
    expect(offenders[0].value).toBe(2000);
  });

  it('detects a synthetic Tailwind modal at z-[300] that is not the upgrade gate', () => {
    const offenders = findLayeringOffenders([
      {
        path: 'src/apps/example/SomeModal.tsx',
        text: '<div className="fixed inset-0 z-[300] bg-black/80" />',
      },
    ]);
    expect(offenders).toHaveLength(1);
    expect(offenders[0].value).toBe(300);
  });

  it('detects the four-value inset form (top-0 left-0 right-0 bottom-0)', () => {
    const offenders = findLayeringOffenders([
      {
        path: 'src/apps/example/SomeModal.tsx',
        text: '<div className="fixed top-0 left-0 right-0 bottom-0 z-[400]" />',
      },
    ]);
    expect(offenders).toHaveLength(1);
    expect(offenders[0].value).toBe(400);
  });

  it('allows the upgrade gate at z-[300]', () => {
    const offenders = findLayeringOffenders([
      {
        path: 'src/access/UpgradeModal.tsx',
        text: '<div className="fixed inset-0 z-[300] bg-black/80" />',
      },
    ]);
    expect(offenders).toEqual([]);
  });

  it('allows the Personalization Modal at exactly z-[250] but not above it', () => {
    expect(
      findLayeringOffenders([
        {
          path: 'src/shared/personalization/PersonalizationModal.tsx',
          text: '<div className="fixed inset-0 z-[250] flex items-center" />',
        },
      ]),
    ).toEqual([]);

    const raised = findLayeringOffenders([
      {
        path: 'src/shared/personalization/PersonalizationModal.tsx',
        text: '<div className="fixed inset-0 z-[400] flex items-center" />',
      },
    ]);
    expect(raised).toHaveLength(1);
  });

  it('does not lower toast containers (zIndex: 99999 must remain above all modals)', () => {
    const files = listFiles(join(REPO_ROOT, 'packages/studio/src/components'));
    let toastCount = 0;
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      const matches = text.match(/zIndex:\s*99999/g);
      if (matches) toastCount += matches.length;
    }
    expect(toastCount).toBeGreaterThan(0);
  });

  it('does not lower the UniversalMediaUploader dropdown (z-[80] must remain)', () => {
    const text = readFileSync(
      join(REPO_ROOT, 'packages/studio/src/components/UniversalMediaUploader.jsx'),
      'utf8',
    );
    expect(text).toContain('z-[80]');
  });
});
