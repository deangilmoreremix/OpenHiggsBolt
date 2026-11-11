import { createContext, use } from 'react';


export interface DocumentSection { heading: string; items: string[] }
export interface DocumentContent {
  title: string;
  sections: DocumentSection[];
  /** Left rail (navigation-like short labels) and right rail (calls to action / facts). */
  sideLeft: string[];
  sideRight: string[];
  /** The column of earlier entries that drop in at the end. */
  history: Array<{ label: string; date?: string; title: string }>;
  meta: { brand?: string; tagline?: string };
}


/** The document a DocumentTypewriterReveal clip types out. Absent = the recipe's own sample document (unchanged). */
export const DocumentContentContext = createContext<DocumentContent | null>(null);
export const useDocumentContent = (): DocumentContent | null => use(DocumentContentContext);

/** One slot of the recipe's layout filled from the content: slots take the content's blocks in order, by tag. */
export function fillSlots(doc: DocumentContent, tags: readonly string[]): Array<string | null> {
  const q = { h1: [doc.title].filter(Boolean), h2: doc.sections.map((s) => s.heading).filter(Boolean), li: doc.sections.flatMap((s) => s.items) } as Record<string, string[]>;
  // List items follow their own section: the nth h2 slot opens the nth section, so each section's items fill the li slots under it.
  const out: Array<string | null> = [];
  let sec = -1, li = 0;
  for (const tag of tags) {
    if (tag === 'h1') out.push(q.h1.shift() ?? null);
    else if (tag === 'h2') { sec++; li = 0; out.push(q.h2[sec] ?? null); }
    else { const s = doc.sections[Math.max(0, sec)]; out.push(s?.items[li++] ?? null); }
  }
  return out;
}
