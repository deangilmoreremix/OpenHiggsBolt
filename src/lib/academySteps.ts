/**
 * Turns one Academy lesson (markdown) into steps a learner can go through one
 * screen at a time. Pure and content-agnostic: no lesson needs rewriting.
 *
 * Rules
 *  - the H1 is the lesson title; a `> **Time:** about N minutes. **You will finish with:** ...`
 *    line is read for minutes / outcome and removed from the body;
 *  - every `##` section is one step;
 *  - `## Step by step` and `## Do It` expand: each `###` inside becomes its own step;
 *  - `## Check yourself` becomes a checklist step (`* [ ]` / `- [ ]` items, saved by index);
 *  - headings inside fenced code are ignored; a lesson with no `##` is a single step.
 * Step ids come from the heading text so saved progress survives edits elsewhere.
 */

export interface LessonStep {
  id: string;
  title: string;
  kind: 'read' | 'checklist';
  /** The section this step belongs to when a section was expanded (for example "Step by step"). */
  group?: string;
  /** Body markdown for this step (without its own heading). */
  markdown: string;
  /** Checklist items, in order, for kind === 'checklist'. */
  checklist?: string[];
}

export interface ParsedLesson {
  title: string;
  minutes?: number;
  outcome?: string;
  steps: LessonStep[];
}

const FENCE = /^\s*(```|~~~)/;
const TASK = /^\s*[*-]\s+\[[ xX]\]\s+(.*\S)\s*$/;
const EXPANDING = /^(step by step|do it)$/i;
const CHECKLIST = /^check (yourself|your work)$/i;

const clean = (t: string) => t.replace(/[*_`]/g, '').replace(/\s+/g, ' ').trim();
const slug = (t: string) =>
  clean(t).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'step';

interface Block { level: 2 | 3; title: string; lines: string[] }

/** Split into heading blocks, ignoring headings inside fenced code. */
function blocks(lines: string[], level: 2 | 3): { preamble: string[]; blocks: Block[] } {
  const marker = level === 2 ? '## ' : '### ';
  const out: Block[] = [];
  const preamble: string[] = [];
  let fenced = false;
  let cur: Block | null = null;
  for (const line of lines) {
    if (FENCE.test(line)) fenced = !fenced;
    if (!fenced && line.startsWith(marker)) {
      cur = { level, title: clean(line.slice(marker.length)), lines: [] };
      out.push(cur);
      continue;
    }
    (cur ? cur.lines : preamble).push(line);
  }
  return { preamble, blocks: out };
}

const trimBlank = (lines: string[]) => {
  let a = 0;
  let b = lines.length;
  while (a < b && !lines[a].trim()) a++;
  while (b > a && !lines[b - 1].trim()) b--;
  return lines.slice(a, b);
};
const text = (lines: string[]) => trimBlank(lines).join('\n');

export function parseLesson(markdown: string): ParsedLesson {
  const all = markdown.replace(/\r\n?/g, '\n').split('\n');

  // title (first H1 outside code)
  let fenced = false;
  let title = '';
  const body: string[] = [];
  for (const line of all) {
    if (FENCE.test(line)) fenced = !fenced;
    if (!fenced && !title && /^#\s+/.test(line)) {
      title = clean(line.replace(/^#\s+/, '')).replace(/^(Track|Lesson)\s+\d+\s*[:—-]\s*/i, '');
      continue;
    }
    body.push(line);
  }

  // metadata line + horizontal rules (outside code)
  let minutes: number | undefined;
  let outcome: string | undefined;
  fenced = false;
  const lines: string[] = [];
  for (const line of body) {
    if (FENCE.test(line)) fenced = !fenced;
    if (!fenced) {
      if (/^\s*>.*\*\*Time:\*\*/.test(line)) {
        const m = line.match(/\*\*Time:\*\*\s*(?:about|~)?\s*(\d+)/i);
        if (m) minutes = Number(m[1]);
        const f = line.match(/\*\*You will finish with:\*\*\s*(.+?)\s*$/i);
        if (f) outcome = clean(f[1]);
        continue;
      }
      if (/^\s*---+\s*$/.test(line)) continue;
    }
    lines.push(line);
  }

  const top = blocks(lines, 2);
  const steps: LessonStep[] = [];
  const used = new Set<string>();
  const uniq = (base: string) => {
    let id = base;
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
    used.add(id);
    return id;
  };
  const push = (stepTitle: string, bodyLines: string[], kind: LessonStep['kind'] = 'read', checklist?: string[], group?: string) => {
    const md = text(bodyLines);
    if (!md && !(checklist && checklist.length)) return;
    steps.push({ id: uniq(slug(stepTitle)), title: stepTitle, kind, markdown: md, ...(group ? { group } : {}), ...(checklist ? { checklist } : {}) });
  };

  push('Overview', top.preamble);

  for (const sec of top.blocks) {
    if (EXPANDING.test(sec.title)) {
      const sub = blocks(sec.lines, 3);
      if (sub.blocks.length) {
        // text before the first ### belongs with step 1
        sub.blocks.forEach((b, i) => push(b.title, i === 0 ? [...sub.preamble, '', ...b.lines] : b.lines, 'read', undefined, sec.title));
        continue;
      }
    }
    if (CHECKLIST.test(sec.title)) {
      const items: string[] = [];
      const rest: string[] = [];
      let f = false;
      for (const l of sec.lines) {
        if (FENCE.test(l)) f = !f;
        const m = !f ? l.match(TASK) : null;
        if (m) items.push(clean(m[1]));
        else rest.push(l);
      }
      if (items.length) {
        push(sec.title, rest, 'checklist', items);
        continue;
      }
    }
    push(sec.title, sec.lines);
  }

  if (steps.length === 0) {
    steps.push({ id: 'lesson', title: title || 'Lesson', kind: 'read', markdown: text(lines) });
  }
  return { title, ...(minutes ? { minutes } : {}), ...(outcome ? { outcome } : {}), steps };
}
