/**
 * Structured document content for DocumentTypewriterReveal (Round 9, P7).
 *
 * The recipe's technique is a cursor typing out a real, typeset document: a title, section headings with list items under
 * them, two side rails and a column of earlier issues. A page screenshot has none of that structure, so the recipe is fed a
 * content model instead: text the person's site or message actually says, laid out in the recipe's own slots. Nothing is
 * invented: slots the content does not fill stay blank, and a document with too little text is refused (needs 'document').
 */
import type { DocumentContent, DocumentSection } from '../demosrc/_fixtures/documentContent';
export { fillSlots } from '../demosrc/_fixtures/documentContent';
export type { DocumentContent, DocumentSection } from '../demosrc/_fixtures/documentContent';

/** Fewest text blocks (title + headings + items) a document needs to be composed from. */
export const DOCUMENT_MIN_BLOCKS = 8;

export const documentBlockCount = (d: DocumentContent): number => (d.title ? 1 : 0) + d.sections.reduce((n, s) => n + (s.heading ? 1 : 0) + s.items.length, 0);
export const isDocumentUsable = (d: DocumentContent | null | undefined): d is DocumentContent => Boolean(d) && documentBlockCount(d!) >= DOCUMENT_MIN_BLOCKS;

const clean = (s: unknown): string => (typeof s === 'string' ? s.replace(/\s+/g, ' ').trim() : '');
const sentences = (text: string): string[] => text.split(/(?<=[.!?])\s+(?=[A-Z0-9“"'])/).map(clean).filter((s) => s.length > 2);

interface CaptureText { headline?: string; description?: string; headings?: string[]; ctas?: string[]; nav?: string[] }

/** The document a site's words make: headline = title, headings = sections, the description's sentences, calls to action and menu entries = the items. */
export function documentFromCapture(c: CaptureText | null | undefined, brand?: string): DocumentContent | null {
  if (!c) return null;
  const headings = (c.headings ?? []).map(clean).filter(Boolean).slice(0, 5);
  // The menu stays in the left rail (it is not repeated as list items); calls to action are items as well as the right rail's facts.
  const pool = [...sentences(clean(c.description)), ...(c.ctas ?? []).map(clean)].filter(Boolean);
  const sections: DocumentSection[] = headings.map((heading) => ({ heading, items: [] }));
  if (!sections.length && pool.length) sections.push({ heading: clean(c.headline) || brand || 'Overview', items: [] });
  // Items go to the sections in turn, as many as the recipe's slots show (2, 3, 3, 3, 3).
  const cap = [2, 3, 3, 3, 3];
  let k = 0;
  for (const item of pool) {
    for (let tries = 0; tries < sections.length; tries++) {
      const s = sections[(k + tries) % sections.length];
      if (s.items.length < (cap[(k + tries) % sections.length] ?? 3)) { s.items.push(item); k = (k + tries + 1) % sections.length; break; }
    }
  }
  const title = clean(c.headline) || brand || '';
  const doc: DocumentContent = {
    title,
    sections,
    sideLeft: (c.nav ?? []).map(clean).filter(Boolean).slice(0, 8),
    sideRight: (c.ctas ?? []).map(clean).filter(Boolean).slice(0, 8),
    history: headings.slice(0, 6).map((h, i) => ({ label: h, title: `${brand ?? title}${i ? ` · ${i + 1}` : ''}` })),
    meta: { ...(brand ? { brand } : {}) },
  };
  return doc;
}

/** The document a message makes: its first line is the title, short or `#` lines are headings, `-`/`*` lines and sentences are items. */
export function documentFromText(text: string | null | undefined, brand?: string): DocumentContent | null {
  const lines = String(text ?? '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 3) return null;
  const sections: DocumentSection[] = [];
  let title = '';
  for (const raw of lines) {
    const bullet = /^[-*•]\s+(.*)$/.exec(raw);
    const head = /^#{1,3}\s+(.*)$/.exec(raw);
    if (head && !title && !sections.length) { title = clean(head[1]); continue; }
    if (!title && !sections.length && !bullet) { title = clean(raw); continue; }
    if (head || (!bullet && raw.length <= 48 && !/[.!?]$/.test(raw))) { sections.push({ heading: clean(head ? head[1] : raw), items: [] }); continue; }
    if (!sections.length) sections.push({ heading: brand ?? title, items: [] });
    const cur = sections[sections.length - 1];
    for (const item of bullet ? [clean(bullet[1])] : sentences(raw)) if (item && cur.items.length < 3) cur.items.push(item);
  }
  const doc: DocumentContent = { title, sections: sections.slice(0, 5), sideLeft: [], sideRight: [], history: [], meta: { ...(brand ? { brand } : {}) } };
  return doc;
}
