/**
 * Checkpoints of a production run (Round 9, P6).
 *
 * The run record is written after every stage and after each adapted shot, so a reload (or a crash) in the middle of a
 * production does not lose the work already done. On the next visit the run is recovered (anything that was `running` did
 * not finish), the first unfinished stage is found, and the person is offered "Resume" or "Start over". Resume continues
 * with what is still valid and says plainly what is not (pictures that only lived in the old tab, a missing key).
 *
 * Browser storage holds one slot. Nothing secret is written: no API key, only the run, the request, the storyboard and the
 * adapted source of shots that already passed the sandbox + acceptance gate.
 */
import type { DirectorPlan } from './directorPlan';
import type { StoryboardResult } from './filmPipeline';
import { STAGE_ORDER, recoverRun, resumePoint, scenesToBuild, type ProductionRun, type StageId } from './productionRun';

export const RUN_STORE_KEY = 'motion-director:run-v1';
const VERSION = 1;

/** The adapted source of a shot that already passed, keyed by its recipe and its nth occurrence in the film. */
export interface AdaptedShot { cardId: string; nth: number; adaptedCode: string; adaptedStem?: string }

export interface RunCheckpoint {
  v: number;
  savedAt: number;
  run: ProductionRun;
  request: { prompt: string; aspectRatio: string; template: 'inkpress' | 'director' | 'local' };
  storyboard?: Pick<StoryboardResult, 'plan' | 'capture' | 'source' | 'note' | 'videos' | 'media' | 'mapping' | 'release' | 'direction' | 'brief' | 'decisions' | 'gate'>;
  adapted: AdaptedShot[];
  /** True when the storyboard was too large for browser storage and was left out: a resume then re-plans. */
  storyboardDropped?: boolean;
}

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
const defaultStore = (): Store | null => { try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; } };

export function saveCheckpoint(cp: Omit<RunCheckpoint, 'v' | 'savedAt'>, store: Store | null = defaultStore(), now = Date.now()): boolean {
  if (!store) return false;
  const full: RunCheckpoint = { ...cp, v: VERSION, savedAt: now };
  try { store.setItem(RUN_STORE_KEY, JSON.stringify(full)); return true; } catch { /* quota: retry without the (large) storyboard captures */ }
  try {
    const slim: RunCheckpoint = { ...full, storyboard: cp.storyboard ? { ...cp.storyboard, capture: null, media: undefined } : undefined, storyboardDropped: true };
    store.setItem(RUN_STORE_KEY, JSON.stringify(slim));
    return true;
  } catch { return false; }
}

export function loadCheckpoint(store: Store | null = defaultStore()): RunCheckpoint | null {
  if (!store) return null;
  try {
    const raw = store.getItem(RUN_STORE_KEY);
    if (!raw) return null;
    const cp = JSON.parse(raw) as RunCheckpoint;
    if (!cp || cp.v !== VERSION || !cp.run || !cp.run.stages || !cp.request) return null;
    return cp;
  } catch { return null; }
}

export function clearCheckpoint(store: Store | null = defaultStore()): void { try { store?.removeItem(RUN_STORE_KEY); } catch { /* nothing to clear */ } }

export type ResumeAction =
  | { kind: 'none'; why: string }
  /** Resume: continue at `from`; `scenes` shots still to build; `reuse` adapted shots keep their source. */
  | { kind: 'resume'; from: StageId; scenes: number; kept: number; notes: string[] }
  /** The inputs the run needs are gone: ask the person for them (or start over). */
  | { kind: 'needs-input'; from: StageId; needs: string[] }
  /** The earlier work cannot be continued (no storyboard to build from): start over, from the request. */
  | { kind: 'restart'; why: string };

/** Stages that are worth resuming: an interrupted run before the film is built. */
const RESUMABLE = new Set<StageId>(STAGE_ORDER.slice(0, STAGE_ORDER.indexOf('build') + 1));

/** What to do with a stored checkpoint, as a pure decision (the hook acts on it; tests pin the table). */
export function decideResume(cp: RunCheckpoint | null, env: { hasKey?: boolean; now?: number } = {}): ResumeAction {
  if (!cp) return { kind: 'none', why: 'no stored run' };
  const run = recoverRun(cp.run, env.now);
  const from = resumePoint(run);
  if (!from) return { kind: 'none', why: 'the run finished' };
  if (!RESUMABLE.has(from)) return { kind: 'none', why: 'the film was built; its later stages run from the Workbench' };
  // Nothing was done yet: there is nothing to resume.
  if (STAGE_ORDER.every((id) => ['pending'].includes(run.stages[id].status))) return { kind: 'none', why: 'the run had not started' };
  const sb = cp.storyboard;
  if (run.stages.storyboard.status !== 'completed' || !sb || !sb.plan?.scenes?.length) return { kind: 'restart', why: `it stopped at the ${from} stage, before a storyboard was approved` };
  const needs: string[] = [];
  const dead = (sb.media ?? []).filter((m) => typeof m.url === 'string' && m.url.startsWith('blob:'));
  if (dead.length) needs.push(`re-attach ${dead.length === 1 ? 'the picture' : `the ${dead.length} pictures`} (${dead.slice(0, 3).map((m) => m.name).join(', ')}): they only lived in the tab that was closed`);
  if (cp.storyboardDropped) needs.push('the captured pages were too large to keep: send the address again');
  if (env.hasKey === false) needs.push('add your OpenAI key in Settings so the shots can be adapted');
  if (needs.length) return { kind: 'needs-input', from, needs };
  const todo = scenesToBuild(run).length;
  return { kind: 'resume', from, scenes: todo, kept: cp.adapted.length, notes: [] };
}

/** A project stub holding the adapted shots, in the shape `transplantAdaptation` reads, so a resumed build keeps them. */
export function adaptedStub(adapted: readonly AdaptedShot[]): { tracks: Array<{ clips: Array<{ id: string; cardId: string; start: number; props: Record<string, unknown> }> }> } {
  return { tracks: [{ clips: adapted.map((a, i) => ({ id: `kept-${i}`, cardId: a.cardId, start: i, props: { adaptedCode: a.adaptedCode, ...(a.adaptedStem ? { adaptedStem: a.adaptedStem } : {}) } })) }] };
}

/** Collect the adapted shots of a project (in film order, nth per recipe), for the checkpoint. */
export function adaptedOf(project: { tracks: Array<{ clips: Array<{ cardId: string; start: number; props?: Record<string, unknown> }> }> }): AdaptedShot[] {
  const clips = project.tracks.flatMap((t) => t.clips).filter((c) => c.cardId.startsWith('demo:')).sort((a, b) => a.start - b.start);
  const seen = new Map<string, number>();
  const out: AdaptedShot[] = [];
  for (const c of clips) {
    const nth = seen.get(c.cardId) ?? 0;
    seen.set(c.cardId, nth + 1);
    if (typeof c.props?.adaptedCode === 'string') out.push({ cardId: c.cardId, nth, adaptedCode: c.props.adaptedCode, ...(typeof c.props.adaptedStem === 'string' ? { adaptedStem: c.props.adaptedStem } : {}) });
  }
  return out;
}
export type { DirectorPlan };
