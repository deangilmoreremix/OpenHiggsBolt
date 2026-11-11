import type { ClipData, ProjectData } from '../types';

/**
 * A stable content fingerprint of a film, for version integrity: a review (or a scene check) approves exactly the film
 * it saw. It covers everything that changes what is exported: every clip's card, timing, label and ALL its props (adapted
 * source in full, texts, picture references, volumes, offsets), the track order, size, fps, brand, theme and background.
 * Key order never matters (props are canonicalised), and the hash is synchronous so it can be taken anywhere.
 * (128-bit cyrb128-style mix: not cryptographic, collision-resistant enough to tell two edits of one film apart.)
 */
function canon(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return `[${value.map(canon).join(',')}]`;
  if (typeof value === 'object') {
    const o = value as Record<string, unknown>;
    return `{${Object.keys(o).filter((k) => o[k] !== undefined).sort().map((k) => `${JSON.stringify(k)}:${canon(o[k])}`).join(',')}}`;
  }
  return 'null';
}

export function hash128(text: string): string {
  let h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
  for (let i = 0; i < text.length; i++) {
    const k = text.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  const hex = (n: number) => ((n ^ h1 ^ h2 ^ h3 ^ h4) >>> 0).toString(16).padStart(8, '0');
  return `${hex(h1)}${hex(h2)}${hex(h3)}${hex(h4)}`;
}

/** One clip: what it is, when it plays, and everything it is given. */
export const clipFingerprint = (c: ClipData): string => hash128(canon({ cardId: c.cardId, start: c.start, duration: c.duration, label: (c as { label?: string }).label ?? null, props: c.props ?? {}, inOffset: (c as { inOffset?: number }).inOffset ?? 0 }));

/** Everything about the film except the production record itself (the record is about the film, not part of it). */
export function filmFingerprint(project: ProjectData): string {
  const { run: _run, spec: _spec, ...film } = project as ProjectData & { run?: unknown };
  void _run; void _spec;
  return hash128(canon({
    film: { name: film.name, fps: film.fps, width: film.width, height: film.height, background: film.background ?? null, themeId: film.themeId ?? null, themeColors: film.themeColors ?? null, brand: film.brand ?? null },
    tracks: film.tracks.map((t) => ({ id: t.id, name: t.name, clips: t.clips.map(clipFingerprint) })),
  }));
}

/** Fingerprints of the shot clips alone, by clip id: a scene approval is tied to its own clip. */
export function shotFingerprints(project: ProjectData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const t of project.tracks) for (const c of t.clips) if (c.cardId.startsWith('demo:')) out[c.id] = clipFingerprint(c);
  return out;
}
