/**
 * Retrieval for the "Ask SmartVideo" help agent: pure BM25 over the prebuilt
 * chunk index (src/data/helpIndex.json). No network, no embeddings; the
 * `search` signature is the seam where embeddings could be swapped in later.
 */
export interface HelpChunk {
  id: string;
  kind: 'studio' | 'academy' | 'reseller' | 'app';
  studioId: string | null;
  title: string;
  url: string;
  /** Studio chunks: the Academy "Create with <studio>" guide. */
  guideUrl?: string;
  text: string;
}

export interface SearchOptions {
  /** Studio id the user is currently in (boosts that studio's chunks). */
  studioId?: string | null;
  limit?: number;
}

const STOP = new Set('a an the and or of to in on for with is are was were be been it its this that these those how do does did i you my me we our your can could should would will what when where why which who whom from at by as if then than so not no yes into out up about into over under again just also have has had'.split(' '));

export function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter((t) => t.length > 1 && !STOP.has(t))
    .map(stem);
}

/** Tiny suffix stemmer (plural / -ing / -ed). Good enough for how-to questions. */
function stem(t: string): string {
  if (t.length > 4 && t.endsWith('ies')) return t.slice(0, -3) + 'y';
  if (t.length > 5 && t.endsWith('ing')) return t.slice(0, -3);
  if (t.length > 4 && t.endsWith('ed')) return t.slice(0, -2);
  if (t.length > 3 && t.endsWith('s') && !t.endsWith('ss')) return t.slice(0, -1);
  return t;
}

interface Prepared {
  chunk: HelpChunk;
  tf: Map<string, number>;
  len: number;
  titleTokens: Set<string>;
}

export interface Index {
  docs: Prepared[];
  df: Map<string, number>;
  avgLen: number;
}

export function buildIndex(chunks: HelpChunk[]): Index {
  const df = new Map<string, number>();
  let total = 0;
  const docs = chunks.map((chunk) => {
    const toks = tokenize(`${chunk.title} ${chunk.text}`);
    const tf = new Map<string, number>();
    for (const t of toks) tf.set(t, (tf.get(t) ?? 0) + 1);
    for (const t of tf.keys()) df.set(t, (df.get(t) ?? 0) + 1);
    total += toks.length;
    return { chunk, tf, len: toks.length, titleTokens: new Set(tokenize(chunk.title)) };
  });
  return { docs, df, avgLen: docs.length ? total / docs.length : 1 };
}

const K1 = 1.4;
const B = 0.75;

export function search(index: Index, query: string, opts: SearchOptions = {}): { chunk: HelpChunk; score: number }[] {
  const q = [...new Set(tokenize(query))];
  if (!q.length) return [];
  const N = index.docs.length;
  const scored: { chunk: HelpChunk; score: number }[] = [];
  for (const d of index.docs) {
    let score = 0;
    let matched = 0;
    for (const t of q) {
      const f = d.tf.get(t);
      if (!f) continue;
      matched++;
      const n = index.df.get(t) ?? 0;
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      score += idf * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * d.len) / index.avgLen)));
      if (d.titleTokens.has(t)) score += idf * 1.3;
    }
    if (!matched) continue;
    score *= 0.6 + 0.4 * (matched / q.length); // reward covering more of the question
    if (opts.studioId && d.chunk.studioId === opts.studioId) score *= 1.35;
    scored.push({ chunk: d.chunk, score });
  }
  scored.sort((a, b) => b.score - a.score);
  // at most 3 chunks from the same page so sources stay varied
  const perUrl = new Map<string, number>();
  const out: { chunk: HelpChunk; score: number }[] = [];
  for (const s of scored) {
    const c = perUrl.get(s.chunk.url) ?? 0;
    if (c >= 3) continue;
    // the 38 per-app chunks look alike; keep them from crowding out lessons
    if (s.chunk.kind === 'app' && out.filter((o) => o.chunk.kind === 'app').length >= 2) continue;
    perUrl.set(s.chunk.url, c + 1);
    out.push(s);
    if (out.length >= (opts.limit ?? 6)) break;
  }
  return out;
}

let cached: Index | null = null;
/** Lazily builds the index from the committed JSON (server-side only). */
export async function getIndex(): Promise<Index> {
  if (!cached) {
    const mod = await import('@/data/helpIndex.json');
    cached = buildIndex(((mod as unknown as { default?: { chunks: HelpChunk[] }; chunks?: HelpChunk[] }).default ?? (mod as unknown as { chunks: HelpChunk[] })).chunks);
  }
  return cached;
}

/** Studio id for a pathname like /studio/image, /photo-studio, /academy/reseller/... */
export function studioIdFromPath(pathname: string | null | undefined): string | null {
  if (!pathname) return null;
  if (pathname.startsWith('/academy/reseller') || pathname.startsWith('/studio/apps') || pathname.startsWith('/reseller')) return 'apps';
  if (pathname.startsWith('/photo-studio')) return 'photo-studio';
  if (pathname.startsWith('/brand-studio')) return 'brand-studio';
  const m = pathname.match(/^\/studio\/([^/?#]+)/);
  return m ? m[1] : null;
}
