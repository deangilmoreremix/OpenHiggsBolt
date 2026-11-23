import { describe, expect, it } from 'vitest';
import { modeRecommendation } from '../lib/filmChat';

describe('mode recommendation (upstream: say which mode fits and why)', () => {
  it('software products: Ink Press, with the evidence', () => {
    const t = modeRecommendation('Make a launch film for our SaaS dashboard app', true);
    expect(t).toMatch(/recommendation: Ink Press/);
    expect(t).toMatch(/real site first/);
  });
  it('other businesses: the director, not Ink Press', () => {
    const t = modeRecommendation('A video for my beachfront villa rentals and listings', false);
    expect(t).toMatch(/recommendation: let the director pick/);
    expect(t).toMatch(/real estate/);
  });
  it('unknown: the director, and it says why', () => {
    expect(modeRecommendation('make me a video', false)).toMatch(/cannot tell what kind of business/);
  });
});
