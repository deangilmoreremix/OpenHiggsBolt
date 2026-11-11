import type { FilmStep, FilmStepId, FilmStepState } from './filmSteps';
import { FILM_STEPS } from './filmSteps';

/**
 * The production run: ONE authoritative record of how a film was made, stage by stage (upstream's eight stages), so the
 * chat, the step strip and the saved project all read the same thing, and so an interrupted run can resume.
 *
 * Rules the module enforces (they are the point of it):
 *  - A stage becomes `completed` only through `completeStage`, which checks that the stage's MANDATORY OUTPUT exists.
 *    No exception is not success: a missing output makes the stage `failed` (or `needs-input` when only the person can supply it).
 *  - The film's final status is derived from the stages, never set: a review that did not run is never a passed review.
 *  - The record is plain JSON (it rides on `ProjectData.run`), small (references and summaries, never frames or code).
 */

export type StageId = 'brief' | 'direction' | 'mapping' | 'storyboard' | 'assets' | 'build' | 'sound' | 'qa' | 'review';
export const STAGE_ORDER: readonly StageId[] = ['brief', 'direction', 'mapping', 'storyboard', 'assets', 'build', 'sound', 'qa', 'review'];

export type StageStatus = 'pending' | 'running' | 'completed' | 'partial' | 'needs-input' | 'failed' | 'needs-review' | 'skipped';
export type CreationMode = 'inkpress' | 'autonomous' | 'cocreate' | 'single' | 'local';

/** What the film is, from the person's point of view. */
export type FinalStatus = 'building' | 'draft' | 'qa-running' | 'review-pending' | 'review-failed' | 'corrections-required' | 'ready';

export interface StageRecord {
  status: StageStatus;
  attempts: number;
  startedAt?: number;
  endedAt?: number;
  /** One human-readable line: what happened, or why it stopped. */
  note?: string;
  /** Small summary of the stage's output (never the output itself). */
  summary?: Record<string, unknown>;
  /** A skipped stage records why, and whether that waiver is legitimate for the mode (only legitimate waivers keep a film releasable). */
  waiver?: { reason: string; legit: boolean };
}

/** What a scene needs and what it got (stage 4/5), the unit of resume. */
export interface SceneRecord {
  n: number;
  recipeId: string;
  /** Upstream component name (`SpotlightHeroCard`), or '' for title and brand scenes. */
  component: string;
  /** The kind of customer material the recipe reads. */
  needs: 'page' | 'images' | 'text' | 'document' | 'logo' | 'abstract' | 'none';
  /** `satisfied`: the material it needs is in hand; `missing`: it is not (and why). */
  assets: { state: 'satisfied' | 'missing'; refs: string[]; why?: string };
  /** What became of the shot: its original motion with the person's content, or still the sample. */
  personalization: 'adapted' | 'parameterized' | 'unmodified' | 'pending';
  /** Scene QA: stills rendered at entry / peak / settled and the person's content seen (or not). */
  validation: { state: 'pending' | 'passed' | 'failed'; frames?: number[]; note?: string };
  /** The properties checked at entering / peak / settled, each tagged mechanical or needs-visual-judgement (lib/sceneChecks). */
  checks?: Array<{ frame: string; property: string; kind: 'mechanical' | 'needs-visual-judgement'; ok: boolean; detail: string }>;
  /** What a program cannot decide about this shot: left to a model-assisted review or a person, never counted as verified. */
  judgement?: string[];
  /** Fingerprint of the shot clip that was validated (all its props, timing and source): the approval is for exactly this shot. */
  fingerprint?: string;
}

export interface ReviewRecord {
  /** Did an independent reviewer actually look at the film? */
  ran: boolean;
  /** `unavailable`: no reviewer could be reached (no key, no answer). `incomplete`: it answered but did not cover what a review must. */
  state: 'not-run' | 'running' | 'passed' | 'failed' | 'unavailable' | 'incomplete';
  findings: Array<{ scene?: number; frame?: number; text: string; severity: 'fix' | 'note'; resolved?: boolean }>;
  note?: string;
  /** The answer was a well-formed structured response. */
  schemaValid?: boolean;
  /** Every check the reviewer answered (id of the checklist, and whether it held). */
  criteria?: Array<{ id: string; ok: boolean }>;
  /** The answers cover every required group of the checklists (see REQUIRED_REVIEW_GROUPS). */
  coversRequired?: boolean;
  missingGroups?: string[];
  /** Fingerprint of the exact film the reviewer was shown (lib/filmFingerprint). */
  filmFingerprint?: string;
}

/**
 * The checklist groups a review must answer at least once each (final-review.md): product goals, features, visual direction,
 * shot cards, storyboard, data safety and visual quality. Audio (A) is judged from the sound record and the rendered audio
 * checks, not from stills, so a still-based reviewer is not required to answer it. One generic positive item cannot certify a film.
 */
export const REQUIRED_REVIEW_GROUPS = ['P', 'F', 'V', 'S', 'B', 'D', 'Q'] as const;

export function reviewCoverage(items: ReadonlyArray<{ id: string; ok: boolean }>): { coversRequired: boolean; missingGroups: string[] } {
  const answered = new Set(items.map((i) => i.id.trim().toUpperCase().charAt(0)));
  const missingGroups = REQUIRED_REVIEW_GROUPS.filter((g) => !answered.has(g));
  return { coversRequired: missingGroups.length === 0, missingGroups };
}

export interface ProductionRun {
  version: 1;
  id: string;
  mode: CreationMode;
  /** The person's original request. */
  request: string;
  createdAt: number;
  updatedAt: number;
  stages: Record<StageId, StageRecord>;
  scenes: SceneRecord[];
  review: ReviewRecord;
  /** Unresolved QA problems (a stage cannot complete while any is critical). */
  qaIssues: string[];
  /** The person asked for a silent film (no music, no sound effects): the sound stage may then be waived. */
  silent?: boolean;
  /** Fingerprint of the film at its last build (lib/filmFingerprint); a later change is detected against it. */
  fingerprints?: { build?: string };
}

const blank = (): StageRecord => ({ status: 'pending', attempts: 0 });

export function newRun(request: string, mode: CreationMode, now = Date.now(), id = `run_${now.toString(36)}`): ProductionRun {
  return {
    version: 1,
    id,
    mode,
    request: request.trim().slice(0, 600),
    createdAt: now,
    updatedAt: now,
    stages: Object.fromEntries(STAGE_ORDER.map((s) => [s, blank()])) as Record<StageId, StageRecord>,
    scenes: [],
    review: { ran: false, state: 'not-run', findings: [] },
    qaIssues: [],
  };
}

const touch = (run: ProductionRun, id: StageId, patch: Partial<StageRecord>, now = Date.now()): ProductionRun => ({
  ...run,
  updatedAt: now,
  stages: { ...run.stages, [id]: { ...run.stages[id], ...patch } },
});

export const startStage = (run: ProductionRun, id: StageId, now = Date.now()): ProductionRun =>
  touch(run, id, { status: 'running', attempts: run.stages[id].attempts + 1, startedAt: now, endedAt: undefined, note: undefined }, now);

export const failStage = (run: ProductionRun, id: StageId, why: string, now = Date.now()): ProductionRun => touch(run, id, { status: 'failed', note: why, endedAt: now }, now);
export const needInput = (run: ProductionRun, id: StageId, what: string, now = Date.now()): ProductionRun => touch(run, id, { status: 'needs-input', note: what, endedAt: now }, now);
/** Stages a mode may legitimately leave out: the Ink Press template and a single shot fix their own look and shots; sound only for a silent film. */
export const waiverIsLegit = (run: ProductionRun, id: StageId): boolean => {
  if (id === 'direction' || id === 'mapping') return run.mode === 'inkpress' || run.mode === 'single' || run.mode === 'local';
  if (id === 'sound') return Boolean(run.silent);
  return false;
};
export const skipStage = (run: ProductionRun, id: StageId, why: string, now = Date.now()): ProductionRun => touch(run, id, { status: 'skipped', note: why, waiver: { reason: why, legit: waiverIsLegit(run, id) }, endedAt: now }, now);

/** What each stage must have produced before it may be called completed. Returns the reason it is not, or null. */
export type Output =
  | { stage: 'brief'; productName: string; kind: string; features: string[]; objective: string }
  | { stage: 'direction'; chosen: string | null; userSupplied?: boolean }
  | { stage: 'mapping'; rows: Array<{ feature: string; firstShot: string }> }
  | { stage: 'storyboard'; scenes: number; failedChecks: string[] }
  | { stage: 'assets'; scenes: SceneRecord[] }
  | { stage: 'build'; scenes: SceneRecord[] }
  | { stage: 'sound'; cues: number; track: string | null; /** Planned actions without their sound, sounds off their frame, or sound in a silent film (lib/soundRecord `problems`). */ problems?: number }
  | { stage: 'qa'; issues: string[]; framesChecked: number; /** Checks the QA planned (frames to inspect) and how many were really done. */ required?: number; done?: number }
  | { stage: 'review'; review: ReviewRecord };

export function missingOutput(o: Output): { reason: string; whoCanFix: 'program' | 'person' } | null {
  switch (o.stage) {
    case 'brief':
      if (!o.productName.trim()) return { reason: 'the brief has no product or business name', whoCanFix: 'person' };
      if (!o.kind.trim()) return { reason: 'the business was not classified', whoCanFix: 'program' };
      return null;
    case 'direction':
      return o.chosen || o.userSupplied ? null : { reason: 'no visual direction was chosen', whoCanFix: 'program' };
    case 'mapping':
      return o.rows.some((r) => r.feature.trim() && r.firstShot.trim()) ? null : { reason: 'no feature was mapped to a shot', whoCanFix: 'program' };
    case 'storyboard':
      if (o.scenes < 1) return { reason: 'the storyboard has no scenes', whoCanFix: 'program' };
      return o.failedChecks.length ? { reason: `the storyboard check failed: ${o.failedChecks.join('; ')}`, whoCanFix: 'program' } : null;
    case 'assets': {
      const missing = o.scenes.filter((s) => s.assets.state === 'missing');
      return missing.length ? { reason: `scene ${missing.map((s) => s.n).join(', ')} lack${missing.length === 1 ? 's' : ''} the material they need (${missing.map((s) => s.assets.why ?? s.needs).join('; ')})`, whoCanFix: 'person' } : null;
    }
    case 'build': {
      const open = o.scenes.filter((s) => s.personalization === 'unmodified' && s.needs !== 'abstract' && s.needs !== 'none');
      const bad = o.scenes.filter((s) => s.validation.state === 'failed');
      const unbuilt = o.scenes.filter((s) => s.validation.state === 'pending');
      if (unbuilt.length) return { reason: `scene ${unbuilt.map((s) => s.n).join(', ')} not built or not yet checked`, whoCanFix: 'program' };
      if (bad.length) return { reason: `scene ${bad.map((s) => s.n).join(', ')} failed its frame check`, whoCanFix: 'program' };
      return open.length ? { reason: `scene ${open.map((s) => s.n).join(', ')} still show${open.length === 1 ? 's' : ''} the sample content`, whoCanFix: 'program' } : null;
    }
    case 'sound':
      if (!(o.cues > 0 || o.track)) return { reason: 'the film has no sound cues and no music', whoCanFix: 'program' };
      return o.problems ? { reason: `${o.problems} sound problem${o.problems === 1 ? '' : 's'}: a planned action without its sound, a sound off its frame, or sound in a silent film`, whoCanFix: 'program' } : null;
    case 'qa': {
      if (o.issues.length) return { reason: `${o.issues.length} unresolved problem${o.issues.length === 1 ? '' : 's'}: ${o.issues.slice(0, 3).join('; ')}`, whoCanFix: 'program' };
      const required = o.required ?? 0;
      const done = o.done ?? o.framesChecked;
      // No frame inspected, or fewer than planned: the check is partial, never a pass.
      if (done <= 0 || (required > 0 && done < required)) return { reason: done <= 0 ? 'partial: no frame was inspected' : `partial: only ${done} of ${required} required frames were inspected`, whoCanFix: 'program' };
      return null;
    }
    case 'review': {
      const r = o.review;
      if (!r.ran) return { reason: 'the independent reviewer did not run', whoCanFix: 'program' };
      if (r.state === 'failed') return null; // it ran and its verdict (the findings) is recorded: an outcome, not a missing output
      if (r.schemaValid === false) return { reason: 'the reviewer\'s answer was not a valid structured response', whoCanFix: 'program' };
      if (r.coversRequired === false) return { reason: `the review did not cover ${(r.missingGroups ?? []).join(', ') || 'the required checks'}`, whoCanFix: 'program' };
      return null;
    }
  }
}

/**
 * Record a stage as completed only when its mandatory output exists. Anything else is recorded as what it really is:
 * `needs-input` (the person can supply it), `needs-review` (output exists but is not clean) or `failed`.
 */
export function completeStage(run: ProductionRun, output: Output, summary?: Record<string, unknown>, now = Date.now()): ProductionRun {
  const id = output.stage;
  const miss = missingOutput(output);
  let next = run;
  if (output.stage === 'assets' || output.stage === 'build') next = { ...next, scenes: output.scenes };
  if (output.stage === 'qa') next = { ...next, qaIssues: output.issues };
  if (output.stage === 'review') next = { ...next, review: output.review };
  if (!miss) return touch(next, id, { status: 'completed', note: undefined, summary, endedAt: now }, now);
  // Output exists but is not clean: it can be shown, it cannot be called done.
  const showable = id === 'build' || id === 'qa' || id === 'storyboard' || id === 'sound';
  if (id === 'qa' && /^partial:/.test(miss.reason)) return touch(next, id, { status: 'partial', note: miss.reason, summary, endedAt: now }, now);
  // A reviewer that was unavailable did not fail anything: the film simply has not been reviewed yet (shown as a warning, never as passed).
  if (output.stage === 'review' && !output.review.ran) return touch(next, id, { status: 'needs-review', note: miss.reason, summary, endedAt: now }, now);
  if (showable && miss.whoCanFix === 'program') return touch(next, id, { status: 'needs-review', note: miss.reason, summary, endedAt: now }, now);
  return touch(next, id, { status: miss.whoCanFix === 'person' ? 'needs-input' : 'failed', note: miss.reason, summary, endedAt: now }, now);
}

/**
 * Everything standing between this film and "ready for final export": every required stage completed (or legitimately waived
 * for the mode), a passed review that covers what a review must, answered for THIS exact film (`currentFingerprint`).
 */
export function readinessBlockers(run: ProductionRun, currentFingerprint?: string): string[] {
  const out: string[] = [];
  for (const id of STAGE_ORDER) {
    const st = run.stages[id];
    if (st.status === 'completed') continue;
    if (st.status === 'skipped' && (st.waiver?.legit ?? waiverIsLegit(run, id))) continue;
    out.push(`${id}: ${st.status === 'skipped' ? `skipped without a legitimate waiver${st.note ? ` (${st.note})` : ''}` : st.note ?? st.status}`);
  }
  const r = run.review;
  if (run.stages.review.status === 'completed') {
    if (r.state !== 'passed') out.push(`review: its verdict is ${r.state}`);
    if (r.schemaValid === false) out.push('review: not a valid structured response');
    if (r.coversRequired !== true) out.push(`review: did not cover ${(r.missingGroups ?? ['the required checks']).join(', ')}`);
    const open = r.findings.filter((f) => f.severity === 'fix' && !f.resolved);
    if (open.length) out.push(`review: ${open.length} blocking finding${open.length === 1 ? '' : 's'} unresolved`);
    if (!r.filmFingerprint) out.push('review: it is not tied to a film version');
    else if (currentFingerprint && r.filmFingerprint !== currentFingerprint) out.push('review: the film changed after it was reviewed');
  }
  return out;
}

/** The state of the film as the person should be told it. Derived, never stored. */
export function finalStatus(run: ProductionRun, currentFingerprint?: string): FinalStatus {
  const s = run.stages;
  if (s.build.status === 'running' || s.build.status === 'pending' || s.assets.status === 'running') return 'building';
  if (s.qa.status === 'running') return 'qa-running';
  if (s.qa.status === 'pending') return 'draft';
  if (readinessBlockers(run, currentFingerprint).length === 0) return 'ready';
  // Not ready: say which kind of not ready.
  const early = (['brief', 'direction', 'mapping', 'storyboard', 'assets', 'build', 'sound', 'qa'] as const).some((id) => !['completed', 'skipped'].includes(s[id].status) || (s[id].status === 'skipped' && !(s[id].waiver?.legit ?? waiverIsLegit(run, id))));
  if (early) return 'corrections-required';
  if (run.review.state === 'failed') return 'review-failed';
  if (run.review.findings.some((f) => f.severity === 'fix' && !f.resolved)) return 'corrections-required';
  return 'review-pending';
}

export const finalStatusLine = (run: ProductionRun, currentFingerprint?: string): string => {
  switch (finalStatus(run, currentFingerprint)) {
    case 'building': return 'Building the film';
    case 'draft': return 'Draft: assembled, checks not finished';
    case 'qa-running': return 'Draft ready to preview · technical checks running';
    case 'review-pending': return run.review.state === 'incomplete' ? 'Draft passed the technical checks · the independent review was incomplete' : run.review.ran && currentFingerprint && run.review.filmFingerprint !== currentFingerprint ? 'The film changed after its review · independent review pending' : run.review.state === 'unavailable' ? `Draft passed the technical checks · independent review unavailable${run.review.note ? ` (${run.review.note})` : ''}` : 'Draft passed the technical checks · independent review pending';
    case 'review-failed': return 'The independent review found problems';
    case 'corrections-required': return 'Corrections are needed before this film is final';
    case 'ready': return 'Ready for final export';
  }
};

/** First stage that is not completed (or skipped): where an interrupted run resumes. Null when every stage is done. */
export const resumePoint = (run: ProductionRun): StageId | null => STAGE_ORDER.find((id) => !['completed', 'skipped'].includes(run.stages[id].status)) ?? null;

/** Scenes a resumed build must still make: not yet validated (completed scenes are kept). */
export const scenesToBuild = (run: ProductionRun): SceneRecord[] => run.scenes.filter((s) => s.validation.state !== 'passed');

/** An interrupted run: anything that was `running` when it was saved did not finish. */
export const recoverRun = (run: ProductionRun, now = Date.now()): ProductionRun => {
  const stages = { ...run.stages };
  for (const id of STAGE_ORDER) if (stages[id].status === 'running') stages[id] = { ...stages[id], status: 'failed', note: 'interrupted before it finished', endedAt: now };
  return { ...run, updatedAt: now, stages, review: run.review.state === 'running' ? { ...run.review, state: 'not-run' } : run.review };
};

/** The seven steps the chat shows, derived from the run (no log-text parsing). */
const STEP_STAGES: Record<FilmStepId, StageId[]> = {
  product: ['brief'],
  capture: ['assets'],
  storyboard: ['direction', 'mapping', 'storyboard'],
  animate: ['build'],
  beat: ['sound'],
  qa: ['qa', 'review'],
  deliver: [],
};
const toStep = (s: StageStatus): FilmStepState => (s === 'completed' ? 'done' : s === 'running' ? 'active' : s === 'failed' ? 'error' : s === 'needs-input' || s === 'needs-review' || s === 'partial' ? 'warning' : s === 'skipped' ? 'skipped' : 'todo');
const worst = (list: FilmStepState[]): FilmStepState => (['error', 'warning', 'active'] as FilmStepState[]).find((w) => list.includes(w)) ?? (list.every((x) => x === 'done' || x === 'skipped') && list.some((x) => x === 'done') ? 'done' : list.every((x) => x === 'skipped') && list.length ? 'skipped' : 'todo');

export function stepsOf(run: ProductionRun, delivered = false): FilmStep[] {
  return FILM_STEPS.map((def) => {
    const ids = STEP_STAGES[def.id];
    if (def.id === 'deliver') return { ...def, state: delivered ? 'done' : finalStatus(run) === 'ready' ? 'active' : 'todo', detail: delivered ? 'MP4 rendered' : finalStatusLine(run) };
    const recs = ids.map((i) => run.stages[i]);
    const state = worst(recs.map((r) => toStep(r.status)));
    const note = recs.find((r) => r.note)?.note;
    return { ...def, state, ...(note ? { detail: note } : {}) };
  });
}
