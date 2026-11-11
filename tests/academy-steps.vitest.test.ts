import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parseLesson } from '@/lib/academySteps';

const ACADEMY = path.join(process.cwd(), 'src/content/academy');
const lessonFiles: { track: string; slug: string; file: string }[] = [];
for (const track of fs.readdirSync(ACADEMY)) {
  const dir = path.join(ACADEMY, track, 'lessons');
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.md'))) lessonFiles.push({ track, slug: f.replace(/\.md$/, ''), file: path.join(dir, f) });
}

describe('parseLesson: structure', () => {
  const md = [
    '# Lesson 1: Demo',
    '',
    '> **Time:** about 15 minutes. **You will finish with:** a working thing.',
    '',
    '---',
    '',
    'Intro text.',
    '',
    '## Why it matters',
    'Because.',
    '',
    '## Step by step',
    'Before you start.',
    '',
    '### 1. First',
    'Do A.',
    '',
    '```bash',
    '## not a heading',
    '```',
    '',
    '### 2. Second',
    'Do B.',
    '',
    '## Check yourself',
    '',
    '* [ ] I did A',
    '- [ ] I did B',
    '',
    '## Common mistakes',
    '* Skipping A.',
  ].join('\n');
  const p = parseLesson(md);
  it('reads title, minutes and outcome and removes the metadata line', () => {
    expect(p.title).toBe('Demo');
    expect(p.minutes).toBe(15);
    expect(p.outcome).toBe('a working thing.');
    expect(JSON.stringify(p.steps)).not.toMatch(/\*\*Time/);
  });
  it('makes one step per section and expands Step by step', () => {
    expect(p.steps.map((s) => s.title)).toEqual(['Overview', 'Why it matters', '1. First', '2. Second', 'Check yourself', 'Common mistakes']);
  });
  it('keeps text before the first ### with step 1 and ignores headings inside code', () => {
    const first = p.steps[2];
    expect(first.markdown).toContain('Before you start.');
    expect(first.markdown).toContain('## not a heading');
    expect(p.steps).toHaveLength(6);
  });
  it('labels expanded steps with their section', () => {
    expect(p.steps[2].group).toBe('Step by step');
    expect(p.steps[3].group).toBe('Step by step');
    expect(p.steps[1].group).toBeUndefined();
  });
  it('turns Check yourself into a checklist (both bullet styles)', () => {
    const c = p.steps[4];
    expect(c.kind).toBe('checklist');
    expect(c.checklist).toEqual(['I did A', 'I did B']);
  });
  it('has unique, stable ids derived from headings', () => {
    expect(new Set(p.steps.map((s) => s.id)).size).toBe(p.steps.length);
    expect(p.steps[2].id).toBe('1-first');
    expect(parseLesson(md).steps.map((s) => s.id)).toEqual(p.steps.map((s) => s.id));
  });
  it('dedupes repeated headings', () => {
    const q = parseLesson('# T\n\n## Same\na\n\n## Same\nb');
    expect(q.steps.map((s) => s.id)).toEqual(['same', 'same-2']);
  });
  it('falls back to a single step when there are no sections', () => {
    const q = parseLesson('# Only\n\nJust text.');
    expect(q.steps).toHaveLength(1);
    expect(q.steps[0].markdown).toBe('Just text.');
  });
});

describe('parseLesson: every real lesson in src/content/academy', () => {
  it('finds all lesson files', () => {
    expect(lessonFiles.length).toBeGreaterThan(80);
  });
  it('every lesson yields at least one step with unique ids and no lost content', () => {
    const problems: string[] = [];
    for (const { track, slug, file } of lessonFiles) {
      const src = fs.readFileSync(file, 'utf8');
      const p = parseLesson(src);
      const id = `${track}/${slug}`;
      if (p.steps.length < 1) problems.push(`${id}: no steps`);
      if (new Set(p.steps.map((s) => s.id)).size !== p.steps.length) problems.push(`${id}: duplicate step ids`);
      // lossless: every non-trivial source line is a heading we used as a title, or appears in a step
      const hay = p.steps.map((s) => `${s.group ?? ''}\n${s.title}\n${s.markdown}\n${(s.checklist ?? []).join('\n')}`).join('\n');
      let fenced = false;
      for (const raw of src.split(/\r?\n/)) {
        if (/^\s*(```|~~~)/.test(raw)) fenced = !fenced;
        const line = raw.trim();
        if (!line || /^---+$/.test(line) || /\*\*Time:\*\*/.test(line)) continue;
        if (/^#\s/.test(line) && !fenced) continue; // the H1 is the lesson title
        const plain = line.replace(/^#{2,3}\s+/, '').replace(/^[*-]\s+\[[ xX]\]\s+/, '').replace(/[*_`]/g, '').replace(/\s+/g, ' ').trim();
        if (!plain) continue;
        const flat = hay.replace(/[*_`]/g, '').replace(/\s+/g, ' ');
        if (!flat.includes(plain)) { problems.push(`${id}: lost line "${plain.slice(0, 60)}"`); break; }
      }
    }
    expect(problems, problems.slice(0, 10).join('\n')).toEqual([]);
  });
  it('Track 16 lessons with numbered steps expand into several steps and every lesson has a Check yourself checklist', () => {
    const t16 = lessonFiles.filter((l) => l.track.startsWith('16-') && !l.slug.startsWith('00-'));
    expect(t16).toHaveLength(13);
    for (const l of t16) {
      const p = parseLesson(fs.readFileSync(l.file, 'utf8'));
      expect(p.minutes, l.slug).toBeLessThan(20);
      expect(p.steps.some((s) => s.kind === 'checklist' && (s.checklist?.length ?? 0) > 0), l.slug).toBe(true);
    }
    const hosting = parseLesson(fs.readFileSync(t16.find((l) => l.slug.startsWith('05-'))!.file, 'utf8'));
    expect(hosting.steps.length).toBeGreaterThanOrEqual(6);
  });
});
