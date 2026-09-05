import { describe, it, expect } from 'vitest';
import { getDemosForNiche } from '../nicheDemos';

describe('nicheDemos', () => {
  it('returns demos for real-estate', () => {
    const demos = getDemosForNiche('real-estate');
    console.log('Real estate demos:', demos.map(d => d.slug));
    expect(demos.length).toBeGreaterThan(0);
    // Should not contain obviously miscategorized content
    expect(demos.map(d => d.slug)).not.toContain('greenhouse-tea-isekai-anime');
    expect(demos.map(d => d.slug)).not.toContain('flooded-village-survival-thriller');
    expect(demos.map(d => d.slug)).not.toContain('secret-agent-vfx-story');
  });

  it('returns demos for beauty', () => {
    const demos = getDemosForNiche('beauty');
    expect(demos.length).toBeGreaterThan(0);
  });
});
