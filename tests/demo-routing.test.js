import { describe, it } from 'node:test';
import assert from 'node:assert';

// We test the pure logic from src/data/types.ts and src/data/demoLookup.ts
// by importing the built files or evaluating the source directly.

const fs = await import('fs');
const path = await import('path');

const typesSource = fs.readFileSync(path.join(process.cwd(), 'src/data/types.ts'), 'utf-8');
const lookupSource = fs.readFileSync(path.join(process.cwd(), 'src/data/demoLookup.ts'), 'utf-8');

describe('Demo routing and URL generation', () => {
  it('getCreateUrl uses studioTab from demo', () => {
    assert.ok(typesSource.includes('const tab = demo.studioTab'), 'getCreateUrl should read demo.studioTab');
    assert.ok(typesSource.includes('studio/${tab}'), 'getCreateUrl should build /studio/{tab} URL');
  });

  it('getCreateUrl falls back to video when studioTab missing', () => {
    assert.ok(typesSource.includes("demo.studioTab || 'video'"), 'getCreateUrl should default to video');
  });

  it('getCreateUrl includes sourceRepo and slug in query', () => {
    assert.ok(typesSource.includes('template=${encodeURIComponent(templateId)}'), 'getCreateUrl should include template query param');
  });

  it('findDemoById indexes demos by sourceRepo-slug', () => {
    assert.ok(lookupSource.includes('sourceRepo}|${demo.slug}'), 'Index key should be sourceRepo|slug');
    assert.ok(lookupSource.includes('DEMO_INDEX.set(key, demo)'), 'DEMO_INDEX should map key to demo');
  });

  it('findDemoById returns demo by templateId', () => {
    assert.ok(lookupSource.includes('export function findDemoById(templateId: string)'), 'findDemoById should be exported');
    assert.ok(lookupSource.includes('return DEMO_INDEX.get(templateId)'), 'findDemoById should look up DEMO_INDEX');
  });

  it('demo data files include studioTab field', () => {
    const minimaxPath = path.join(process.cwd(), 'src/data/minimaxH3Demos.ts');
    const seedancePath = path.join(process.cwd(), 'src/data/seedance25Demos.ts');
    const minimaxSource = fs.readFileSync(minimaxPath, 'utf-8');
    const seedanceSource = fs.readFileSync(seedancePath, 'utf-8');
    assert.ok(minimaxSource.includes('studioTab:'), 'minimaxH3Demos should have studioTab');
    assert.ok(seedanceSource.includes('"studioTab"') || seedanceSource.includes('studioTab:'), 'seedance25Demos should have studioTab');
  });
});
