import { describe, expect, it } from 'vitest';
import { explainExportProblem } from '../lib/exportErrors';

describe('export errors say the cause and the remedy', () => {
  it('missing WebCodecs', () => {
    expect(explainExportProblem(['VideoEncoder is not supported'])).toMatch(/no WebCodecs support.*desktop Chrome or Edge/);
  });
  it('no WebGL', () => {
    expect(explainExportProblem(new Error('WebGL is unavailable'))).toMatch(/WebGL.*hardware acceleration/);
  });
  it('no h264 at this size suggests the draft option', () => {
    expect(explainExportProblem('Cannot encode h264 at 1920x1080')).toMatch(/H\.264 MP4.*Fast draft/);
  });
  it('a stalled export', () => {
    expect(explainExportProblem(new Error('The export stopped making progress for 120 seconds and was ended.'))).toMatch(/stopped making progress/);
  });
  it('anything else keeps its own words and still offers a next step', () => {
    const m = explainExportProblem(new Error('Something odd.'));
    expect(m).toContain('Something odd');
    expect(m).toMatch(/Try again/);
  });
  it('is never empty', () => {
    expect(explainExportProblem(undefined).length).toBeGreaterThan(10);
  });
});
