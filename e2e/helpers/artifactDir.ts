import path from 'node:path';

/**
 * Where a spec writes its screenshots/artifacts.
 *
 * By default a spec keeps its committed location (so the existing evidence
 * folders stay reproducible on purpose). Set `E2E_ARTIFACT_ROOT` (e.g.
 * `test-results/artifacts`, which is git-ignored) and every spec that uses this
 * helper writes under that root instead, so a routine local run never
 * overwrites tracked files.
 */
export function artifactDir(...committedSegments: string[]): string {
  const committed = path.join(process.cwd(), ...committedSegments);
  const root = process.env.E2E_ARTIFACT_ROOT;
  if (!root) return committed;
  return path.join(path.resolve(process.cwd(), root), ...committedSegments);
}
