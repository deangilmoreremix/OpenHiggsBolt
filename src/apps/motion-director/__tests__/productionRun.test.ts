import { describe, expect, it } from 'vitest';
import { completeStage, failStage, finalStatus, finalStatusLine, newRun, needInput, readinessBlockers, recoverRun, resumePoint, reviewCoverage, scenesToBuild, skipStage, startStage, stepsOf, type ReviewRecord, type SceneRecord } from '../lib/productionRun';

const scene = (n: number, over: Partial<SceneRecord> = {}): SceneRecord => ({ n, recipeId: `r${n}`, component: 'SpotlightHeroCard', needs: 'page', assets: { state: 'satisfied', refs: ['a'] }, personalization: 'parameterized', validation: { state: 'passed' }, ...over });
const goodReview = (fp = 'fp1'): ReviewRecord => ({ ran: true, state: 'passed', findings: [], schemaValid: true, criteria: ['P1', 'F1', 'V1', 'S1', 'B1', 'D1', 'Q1'].map((id) => ({ id, ok: true })), coversRequired: true, filmFingerprint: fp });
const done = () => {
  let r = newRun('make a film', 'autonomous', 1000);
  r = completeStage(r, { stage: 'brief', productName: 'Acme', kind: 'software', features: ['x'], objective: 'sell' });
  r = completeStage(r, { stage: 'direction', chosen: 'Ink' });
  r = completeStage(r, { stage: 'mapping', rows: [{ feature: 'f', firstShot: 's' }] });
  r = completeStage(r, { stage: 'storyboard', scenes: 3, failedChecks: [] });
  r = completeStage(r, { stage: 'assets', scenes: [scene(1)] });
  r = completeStage(r, { stage: 'build', scenes: [scene(1)] });
  r = completeStage(r, { stage: 'sound', cues: 4, track: 'bgm' });
  return r;
};

describe('a stage completes only with its mandatory output', () => {
  it('a brief with no product name needs the person; one with no classification fails', () => {
    const r = newRun('x', 'autonomous');
    expect(completeStage(r, { stage: 'brief', productName: '', kind: 'software', features: [], objective: '' }).stages.brief.status).toBe('needs-input');
    expect(completeStage(r, { stage: 'brief', productName: 'Acme', kind: '', features: [], objective: '' }).stages.brief.status).toBe('failed');
  });
  it('direction without a chosen direction is not completed (no silent null)', () => {
    const r = newRun('x', 'autonomous');
    expect(completeStage(r, { stage: 'direction', chosen: null }).stages.direction.status).toBe('failed');
    expect(completeStage(r, { stage: 'direction', chosen: null, userSupplied: true }).stages.direction.status).toBe('completed');
  });
  it('mapping needs at least one feature with a shot', () => {
    const r = newRun('x', 'autonomous');
    expect(completeStage(r, { stage: 'mapping', rows: [] }).stages.mapping.status).toBe('failed');
    expect(completeStage(r, { stage: 'mapping', rows: [{ feature: 'f', firstShot: '' }] }).stages.mapping.status).toBe('failed');
  });
  it('assets: a scene without its material needs the person, and is named', () => {
    const r = completeStage(newRun('x', 'autonomous'), { stage: 'assets', scenes: [scene(1), scene(2, { assets: { state: 'missing', refs: [], why: 'no page screenshot' } })] });
    expect(r.stages.assets.status).toBe('needs-input');
    expect(r.stages.assets.note).toContain('scene 2');
  });
  it('build: a scene still showing the sample is not completed; an abstract recipe has nothing to replace', () => {
    const sample = completeStage(newRun('x', 'autonomous'), { stage: 'build', scenes: [scene(1, { personalization: 'unmodified' })] });
    expect(sample.stages.build.status).toBe('needs-review');
    expect(sample.stages.build.note).toContain('sample content');
    const abstract = completeStage(newRun('x', 'autonomous'), { stage: 'build', scenes: [scene(1, { personalization: 'unmodified', needs: 'abstract' })] });
    expect(abstract.stages.build.status).toBe('completed');
    expect(completeStage(newRun('x', 'autonomous'), { stage: 'build', scenes: [scene(1, { validation: { state: 'failed' } })] }).stages.build.status).toBe('needs-review');
  });
  it('qa with unresolved issues is not completed', () => {
    expect(completeStage(newRun('x', 'autonomous'), { stage: 'qa', issues: ['Frame 12'], framesChecked: 5, required: 5, done: 5 }).stages.qa.status).toBe('needs-review');
  });
  it('qa that inspected nothing, or fewer frames than required, is partial and says so', () => {
    const none = completeStage(newRun('x', 'autonomous'), { stage: 'qa', issues: [], framesChecked: 0, required: 8, done: 0 });
    expect(none.stages.qa.status).toBe('partial');
    expect(none.stages.qa.note).toMatch(/no frame was inspected/);
    const some = completeStage(newRun('x', 'autonomous'), { stage: 'qa', issues: [], framesChecked: 5, required: 8, done: 5 });
    expect(some.stages.qa.status).toBe('partial');
    expect(some.stages.qa.note).toMatch(/5 of 8/);
    expect(completeStage(newRun('x', 'autonomous'), { stage: 'qa', issues: [], framesChecked: 8, required: 8, done: 8 }).stages.qa.status).toBe('completed');
  });
  it('review is completed only if the reviewer ran (an unavailable reviewer is a warning, never a pass and never a crash)', () => {
    const r = newRun('x', 'autonomous');
    expect(completeStage(r, { stage: 'review', review: { ran: false, state: 'unavailable', findings: [] } }).stages.review.status).toBe('needs-review');
    expect(completeStage(r, { stage: 'review', review: goodReview() }).stages.review.status).toBe('completed');
  });
});

describe('the film status is derived from the stages', () => {
  it('is ready only when QA completed AND the review ran and passed', () => {
    let r = done();
    expect(finalStatus(r)).toBe('draft');
    r = startStage(r, 'qa');
    expect(finalStatus(r)).toBe('qa-running');
    r = completeStage(r, { stage: 'qa', issues: [], framesChecked: 6, required: 6, done: 6 });
    expect(finalStatus(r)).toBe('review-pending');
    r = completeStage(r, { stage: 'review', review: { ran: false, state: 'unavailable', findings: [], note: 'no key' } });
    expect(finalStatus(r)).toBe('review-pending'); // a review that did not run is not a passed review
    expect(finalStatusLine(r)).toContain('independent review');
    r = completeStage(r, { stage: 'review', review: goodReview() });
    expect(finalStatus(r, 'fp1')).toBe('ready');
  });
  it('unresolved review findings block ready; a failed review is reported', () => {
    let r = completeStage(done(), { stage: 'qa', issues: [], framesChecked: 6, required: 6, done: 6 });
    r = completeStage(r, { stage: 'review', review: { ...goodReview(), findings: [{ scene: 2, frame: 40, text: 'sample UI visible', severity: 'fix' }] } });
    expect(finalStatus(r)).toBe('corrections-required');
    r = completeStage(r, { stage: 'review', review: { ran: true, state: 'failed', findings: [] } });
    expect(finalStatus(r)).toBe('review-failed');
  });
});

describe('resume', () => {
  it('an interrupted stage is recorded failed and resumes there; passed scenes are kept', () => {
    let r = done();
    r = completeStage(r, { stage: 'build', scenes: [scene(1), scene(2, { validation: { state: 'pending' }, personalization: 'pending' })] });
    r = startStage(r, 'qa');
    const back = recoverRun(JSON.parse(JSON.stringify(r)));
    expect(back.stages.qa.status).toBe('failed');
    expect(resumePoint(back)).toBe('build'); // build was needs-review: first non-completed stage
    expect(scenesToBuild(back).map((s) => s.n)).toEqual([2]);
  });
  it('failing and needing input are recorded with their reasons', () => {
    let r = failStage(newRun('x', 'cocreate'), 'mapping', 'the director did not answer');
    expect(r.stages.mapping).toMatchObject({ status: 'failed', note: 'the director did not answer' });
    r = needInput(r, 'brief', 'what is the business called?');
    expect(stepsOf(r).find((s) => s.id === 'product')?.state).toBe('warning');
  });
});

describe('the step strip is derived from the run', () => {
  it('shows each step from its stages and delivers only when told an MP4 exists', () => {
    const r = done();
    const steps = stepsOf(r);
    expect(steps.find((s) => s.id === 'storyboard')?.state).toBe('done');
    expect(steps.find((s) => s.id === 'animate')?.state).toBe('done');
    expect(steps.find((s) => s.id === 'qa')?.state).toBe('todo');
    expect(steps.find((s) => s.id === 'deliver')?.state).toBe('todo');
    expect(stepsOf(r, true).find((s) => s.id === 'deliver')?.state).toBe('done');
  });
});


describe('the readiness contract: every required stage, a real review of THIS film', () => {
  const readyRun = () => {
    let r = done();
    r = completeStage(startStage(r, 'qa'), { stage: 'qa', issues: [], framesChecked: 6, required: 6, done: 6 });
    return completeStage(startStage(r, 'review'), { stage: 'review', review: goodReview('fpA') });
  };
  it('is ready only with every stage completed and a covering passed review for the same film', () => {
    const r = readyRun();
    expect(readinessBlockers(r, 'fpA')).toEqual([]);
    expect(finalStatus(r, 'fpA')).toBe('ready');
  });
  it('a required stage that is pending, failed, needs input or skipped without a waiver blocks readiness', () => {
    for (const stage of ['brief', 'direction', 'mapping', 'storyboard', 'assets', 'build', 'sound'] as const) {
      const r = { ...readyRun(), stages: { ...readyRun().stages, [stage]: { status: 'failed' as const, attempts: 1, note: 'broke' } } };
      expect(finalStatus(r, 'fpA'), stage).not.toBe('ready');
      expect(readinessBlockers(r, 'fpA').join(' ')).toContain(stage);
    }
    const skipped = skipStage(readyRun(), 'direction', 'not needed');
    expect(finalStatus(skipped, 'fpA')).not.toBe('ready'); // an autonomous film may not skip its direction
  });
  it('waivers are legitimate only for the mode: Ink Press and single shots skip direction and mapping, a silent film skips sound', () => {
    let ink = newRun('x', 'inkpress');
    ink = skipStage(skipStage(ink, 'direction', 'the template fixes its look'), 'mapping', 'the template scenes are the map');
    expect(ink.stages.direction.waiver?.legit).toBe(true);
    const silent = skipStage({ ...newRun('x', 'autonomous'), silent: true }, 'sound', 'the person asked for silence');
    expect(silent.stages.sound.waiver?.legit).toBe(true);
    expect(skipStage(newRun('x', 'autonomous'), 'sound', 'no sound').stages.sound.waiver?.legit).toBe(false);
    expect(skipStage(newRun('x', 'cocreate'), 'mapping', 'skipped').stages.mapping.waiver?.legit).toBe(false);
    // brief / storyboard / assets / build / qa / review can never be waived
    for (const id of ['brief', 'storyboard', 'assets', 'build', 'qa', 'review'] as const) expect(skipStage({ ...newRun('x', 'inkpress'), silent: true }, id, 'no').stages[id].waiver?.legit).toBe(false);
  });
  it('QA that is only partial blocks readiness; the draft stays previewable', () => {
    let r = done();
    r = completeStage(startStage(r, 'qa'), { stage: 'qa', issues: [], framesChecked: 3, required: 8, done: 3 });
    r = completeStage(r, { stage: 'review', review: goodReview('fpA') });
    expect(r.stages.qa.status).toBe('partial');
    expect(finalStatus(r, 'fpA')).not.toBe('ready');
    expect(finalStatusLine(r, 'fpA')).not.toMatch(/Ready/);
  });
  it('an empty, malformed, incomplete or unavailable review never counts as passed', () => {
    const base = completeStage(done(), { stage: 'qa', issues: [], framesChecked: 6, required: 6, done: 6 });
    const cases: Array<[string, ReviewRecord]> = [
      ['not run', { ran: false, state: 'not-run', findings: [] }],
      ['unavailable', { ran: false, state: 'unavailable', findings: [], note: 'timeout' }],
      ['malformed', { ...goodReview(), schemaValid: false }],
      ['one generic positive item', { ...goodReview(), criteria: [{ id: 'P1', ok: true }], ...reviewCoverage([{ id: 'P1', ok: true }]) }],
      ['no film version', { ...goodReview(), filmFingerprint: undefined }],
    ];
    for (const [label, review] of cases) {
      const r = completeStage(base, { stage: 'review', review });
      expect(finalStatus(r, 'fp1'), label).not.toBe('ready');
    }
  });
  it('review coverage needs at least one answer in each required group', () => {
    expect(reviewCoverage([{ id: 'P1', ok: true }]).missingGroups).toEqual(['F', 'V', 'S', 'B', 'D', 'Q']);
    expect(reviewCoverage(['P1', 'F2', 'V3', 'S1', 'B2', 'D1', 'Q11'].map((id) => ({ id, ok: true }))).coversRequired).toBe(true);
  });
  it('a stale review cannot approve a changed film: the fingerprint must match the film that can be exported', () => {
    const r = readyRun();
    expect(finalStatus(r, 'fpA')).toBe('ready');
    expect(finalStatus(r, 'fpB')).toBe('review-pending');
    expect(readinessBlockers(r, 'fpB').join(' ')).toMatch(/changed after it was reviewed/);
  });
  it('a failed verdict or unresolved blocking finding is review-failed / corrections-required', () => {
    const base = completeStage(done(), { stage: 'qa', issues: [], framesChecked: 6, required: 6, done: 6 });
    expect(finalStatus(completeStage(base, { stage: 'review', review: { ...goodReview(), state: 'failed' } }), 'fp1')).toBe('review-failed');
    expect(finalStatus(completeStage(base, { stage: 'review', review: { ...goodReview(), findings: [{ text: 'sample UI', severity: 'fix' }] } }), 'fp1')).toBe('corrections-required');
  });
});
