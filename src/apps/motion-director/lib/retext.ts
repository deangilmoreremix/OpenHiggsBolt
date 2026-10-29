/**
 * Fill a recipe's template words from what the site says, with no model call: the
 * fallback when no OpenAI key is on file or the director could not be reached.
 */
import type { SiteContent } from './filmChat';
import type { TextMap } from './textOverrides';

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/**
 * Sentences (3+ words) take the site's headline, description and headings; short labels take
 * its menu entries and calls to action; each replacement is about as long as the line it
 * replaces so the layout holds. Lines nothing fits keep the template's words.
 */
export function fallbackTexts(strings: readonly string[], content: SiteContent | null | undefined, name: string): TextMap {
  if (!content) return {};
  const clean = (v: string | undefined) => (v ?? '').replace(/\s+/g, ' ').trim();
  const sentences = [content.headline, content.description, ...(content.headings ?? [])].map(clean).filter(Boolean);
  const labels = [...(content.nav ?? []), ...(content.ctas ?? []), ...(content.headings ?? [])].map(clean).filter((v) => v && words(v) <= 3);
  const used = new Set<string>();
  const take = (pool: string[], max: number): string | undefined => {
    const hit = pool.find((c) => !used.has(c) && c.length <= max);
    if (hit) used.add(hit);
    return hit;
  };
  const out: TextMap = {};
  for (const line of strings) {
    if (name && line.toLowerCase().includes(name.toLowerCase())) continue;
    const long = words(line) >= 3;
    const to = long ? take(sentences, Math.max(18, Math.round(line.length * 1.25))) : take(labels, Math.max(14, Math.round(line.length * 1.4)));
    if (to) out[line] = to;
  }
  return out;
}
