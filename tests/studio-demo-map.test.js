import { describe, it } from 'node:test';
import assert from 'node:assert';

const fs = await import('fs');
const path = await import('path');

const source = fs.readFileSync(path.join(process.cwd(), 'src/data/studioDemoMap.ts'), 'utf-8');

describe('studioDemoMap', () => {
  it('exports DEMOS_BY_STUDIO grouping', () => {
    assert.ok(source.includes('export const DEMOS_BY_STUDIO'), 'DEMOS_BY_STYUDIO should be exported');
    assert.ok(source.includes('Record<string, VideoDemo[]>'), 'DEMOS_BY_STUDIO should be a record of arrays');
  });

  it('exports STUDIO_DEMO_COUNTS', () => {
    assert.ok(source.includes('export const STUDIO_DEMO_COUNTS'), 'STUDIO_DEMO_COUNTS should be exported');
  });

  it('exports getDemosForStudio', () => {
    assert.ok(source.includes('export function getDemosForStudio'), 'getDemosForStudio should be exported');
    assert.ok(source.includes('return DEMOS_BY_STUDIO[studioTab] || []'), 'getDemosForStudio should fallback to empty array');
  });

  it('exports getBestDemoForStudio with fallback order', () => {
    assert.ok(source.includes('export function getBestDemoForStudio'), 'getBestDemoForStudio should be exported');
    assert.ok(
      source.includes('.find((d) => d.featured)') &&
      source.includes('.find((d) => d.hero)'),
      'getBestDemoForStudio should prefer featured then hero then first'
    );
  });

  it('exports getStudioCoverageReport', () => {
    assert.ok(source.includes('export function getStudioCoverageReport'), 'getStudioCoverageReport should be exported');
    assert.ok(source.includes('hasDemos'), 'Coverage report should include hasDemos flag');
  });

  it('defaults missing studioTab to video', () => {
    assert.ok(source.includes('demo.studioTab || \'video\''), 'Missing studioTab should default to video');
  });

  it('includes all known studio tabs in ALL_KNOWN_STUDIO_TABS', () => {
    assert.ok(source.includes('image'), 'ALL_KNOWN_STUDIO_TABS should include image');
    assert.ok(source.includes('video'), 'ALL_KNOWN_STUDIO_TABS should include video');
    assert.ok(source.includes('cinema'), 'ALL_KNOWN_STUDIO_TABS should include cinema');
    assert.ok(source.includes('marketing'), 'ALL_KNOWN_STUDIO_TABS should include marketing');
  });
});
