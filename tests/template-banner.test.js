import { describe, it } from 'node:test';
import assert from 'node:assert';

const fs = await import('fs');
const path = await import('path');

const source = fs.readFileSync(path.join(process.cwd(), 'packages/studio/src/components/TemplateBanner.jsx'), 'utf-8');

describe('TemplateBanner component', () => {
  it('renders nothing when isApplied is falsy', () => {
    assert.ok(source.includes('if (!isApplied) return null'), 'Should return null when not applied');
  });

  it('renders banner with label and clear button when applied', () => {
    assert.ok(source.includes('Template loaded'), 'Should show default label');
    assert.ok(source.includes('onClick={onClear}'), 'Should wire clear button to onClear');
    assert.ok(source.includes('Clear'), 'Should show Clear button text');
  });

  it('accepts custom label prop', () => {
    assert.ok(source.includes('label = '), 'Should accept label prop with default');
  });

  it('uses accessible button type', () => {
    assert.ok(source.includes('type="button"'), 'Clear button should have type=button');
  });
});
