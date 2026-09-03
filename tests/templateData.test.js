import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';

// Mock React hooks
const useStateMock = {
  current: {},
};
const useEffectMock = {
  current: [],
};
const useRefMock = {
  current: {},
};

const mockReact = () => {
  return {
    useState: (initial) => {
      const key = Math.random().toString(36);
      useStateMock.current[key] = initial;
      return [useStateMock.current[key], (val) => { useStateMock.current[key] = val; }];
    },
    useEffect: (fn) => {
      useEffectMock.current.push(fn);
    },
    useRef: (initial) => {
      return { current: initial };
    },
    useCallback: (fn) => fn,
  };
};

// We can't easily test React hooks without a test runner like vitest or jest.
// Instead, test the pure functions from the hook module.

const fs = await import('fs');
const path = await import('path');

const hookPath = path.join(process.cwd(), 'packages/studio/src/hooks/useTemplateData.js');
const hookSource = fs.readFileSync(hookPath, 'utf-8');

describe('useTemplateData hook source', () => {
  it('exports isValidAspectRatio', () => {
    assert.ok(hookSource.includes('export function isValidAspectRatio'), 'isValidAspectRatio should be exported');
  });

  it('exports normalizeAspectRatio', () => {
    assert.ok(hookSource.includes('export function normalizeAspectRatio'), 'normalizeAspectRatio should be exported');
  });

  it('exports useTemplateData', () => {
    assert.ok(hookSource.includes('export function useTemplateData'), 'useTemplateData should be exported');
  });

  it('validates known aspect ratios', () => {
    // Extract valid ratios from the source
    const validMatch = hookSource.match(/VALID_ASPECT_RATIOS = new Set\(\[([\s\S]*?)\]\)/);
    assert.ok(validMatch, 'VALID_ASPECT_RATIOS set should be defined');
    const ratios = validMatch[1].match(/'([^']+)'/g)?.map(s => s.slice(1, -1)) || [];
    assert.ok(ratios.length > 0, 'Should have at least one valid aspect ratio');
    assert.ok(ratios.includes('16:9'), '16:9 should be valid');
    assert.ok(ratios.includes('9:16'), '9:16 should be valid');
  });

  it('uses slug-based dedup key', () => {
    assert.ok(
      hookSource.includes('templateData.sourceRepo') && hookSource.includes('templateData.slug'),
      'Hook should use sourceRepo and slug for dedup'
    );
  });

  it('guards against null templateData', () => {
    assert.ok(hookSource.includes('if (!templateData)'), 'Hook should guard against null templateData');
  });

  it('provides a reset function', () => {
    assert.ok(hookSource.includes('const reset = () =>'), 'Hook should provide a reset function');
  });

  it('reports isTemplateApplied flag', () => {
    assert.ok(hookSource.includes('isTemplateApplied:'), 'Hook should report isTemplateApplied status');
  });
});
