import { describe, expect, it } from 'vitest';
import { completeStage, failStage, finalStatus, finalStatusLine, newRun, needInput, recoverRun, resumePoint, scenesToBuild, startStage, stepsOf, type SceneRecord } from '../lib/productionRun';

const scene = (n: number, over: Partial<SceneRecord> = {}): SceneRecord => ({ n, recipeId: `r${n}`, component: 'SpotlightHeroCard', needs: 'page', assets: { state: 'satisfied', refs: ['a'] }, personalization: 'parameterized', validation: { state: 'passed' }, ...over });
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
    expect(completeStage(newRun('x', 'autonomous'), { stage: 'qa', issues: ['Frame 12'], framesChecked: 5 }).stages.qa.status).toBe('needs-review');
  });
  it('review is completed only if the reviewer ran', () => {
    const r = newRun('x', 'autonomous');
    expect(completeStage(r, { stage: 'review', review: { ran: false, state: 'unavailable', findings: [] } }).stages.review.status).toBe('failed');
    expect(completeStage(r, { stage: 'review', review: { ran: true, state: 'passed', findings: [] } }).stages.review.status).toBe('completed');
  });
});

describe('the film status is derived from the stages', () => {
  it('is ready only when QA completed AND the review ran and passed', () => {
    let r = done();
    expect(finalStatus(r)).toBe('draft');
    r = startStage(r, 'qa');
    expect(finalStatus(r)).toBe('qa-running');
    r = completeStage(r, { stage: 'qa', issues: [], framesChecked: 6 });
    expect(finalStatus(r)).toBe('review-pending');
    r = completeStage(r, { stage: 'review', review: { ran: false, state: 'unavailable', findings: [], note: 'no key' } });
    expect(finalStatus(r)).toBe('review-pending'); // a review that did not run is not a passed review
    expect(finalStatusLine(r)).toContain('independent review');
    r = completeStage(r, { stage: 'review', review: { ran: true, state: 'passed', findings: [] } });
    expect(finalStatus(r)).toBe('ready');
  });
  it('unresolved review findings block ready; a failed review is reported', () => {
    let r = completeStage(done(), { stage: 'qa', issues: [], framesChecked: 6 });
    r = completeStage(r, { stage: 'review', review: { ran: true, state: 'passed', findings: [{ scene: 2, frame: 40, text: 'sample UI visible', severity: 'fix' }] } });
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
