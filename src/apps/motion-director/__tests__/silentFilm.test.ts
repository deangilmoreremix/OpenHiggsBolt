import { describe, expect, it } from 'vitest';
import { silentFilm } from '../lib/silentFilm';
import type { ProjectData } from '../types';

const clip = (id: string, cardId: string, props: Record<string, unknown> = {}) => ({ id, cardId, start: 0, duration: 30, inOffset: 0, speed: 1, opacity: 1, scale: 1, x: 0, y: 0, props });

describe('a silent film', () => {
  it('drops sound clips and mutes attached videos', () => {
    const p = { tracks: [{ id: 't', name: 'x', clips: [clip('a', 'audio-clip'), clip('v', 'video-clip', { muted: false, file: 'u' }), clip('s', 'demo:RowEmbed')] }] } as unknown as ProjectData;
    const out = silentFilm(p).tracks[0].clips;
    expect(out.map((c) => c.id)).toEqual(['v', 's']);
    expect(out[0].props.muted).toBe(true);
    expect(out[0].props.file).toBe('u');
  });
});
