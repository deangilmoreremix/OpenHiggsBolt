import type { ProjectData } from '../types';

/** A film asked to be silent carries no sound at all: no music or effects clips, and attached videos play muted (their own audio is sound too). */
export function silentFilm(project: ProjectData): ProjectData {
  return {
    ...project,
    tracks: project.tracks.map((t) => ({
      ...t,
      clips: t.clips
        .filter((c) => c.cardId !== 'audio-clip')
        .map((c) => (c.cardId === 'video-clip' ? { ...c, props: { ...c.props, muted: true } } : c)),
    })),
  };
}
