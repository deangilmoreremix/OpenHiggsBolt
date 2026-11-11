// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Motion Studio was removed. Work it saved (same project/session format, its own
 * localStorage keys) must reopen in Motion Director, but never over Motion
 * Director's own saved work.
 */
const loadStore = async () => {
  vi.resetModules();
  return (await import('../store')).useStore;
};

const projectWithName = (name: string) => ({
  name,
  fps: 30,
  width: 1920,
  height: 1080,
  tracks: [{ id: `track-${name}`, name, clips: [] }],
});

describe('saved work from the removed Motion Studio', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('opens the Motion Studio project and sessions when Motion Director has none', async () => {
    localStorage.setItem('shotcraft-workbench-project-v1', JSON.stringify(projectWithName('legacy')));
    localStorage.setItem(
      'shotcraft-motion-sessions-v1',
      JSON.stringify([{ id: 'legacy-session', title: 'Old session', createdAt: 1, updatedAt: 1, messageCount: 0 }]),
    );
    const state = (await loadStore()).getState();
    expect(state.project.tracks[0].name).toBe('legacy');
    expect(state.sessions.map((s) => s.id)).toContain('legacy-session');
  });

  it("keeps Motion Director's own saved work when both exist", async () => {
    localStorage.setItem('shotcraft-workbench-project-v1', JSON.stringify(projectWithName('legacy')));
    localStorage.setItem('motion-director:project-v1', JSON.stringify(projectWithName('director')));
    const state = (await loadStore()).getState();
    expect(state.project.tracks[0].name).toBe('director');
  });
});
