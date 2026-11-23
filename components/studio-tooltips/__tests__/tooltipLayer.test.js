// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { findHelp, place, mountStudioTooltips, TIP_CSS } from '../tooltipLayer.js';
import { STUDIO_HELP, ALIASES, helpKey, idLabels, resolveStudioHelp, studioEntry } from '../studioHelp.js';

describe('studioHelp', () => {
  it('normalizes labels (case, shortcut suffix, icons, counts, ellipsis)', () => {
    expect(helpKey('Generate (Ctrl+Enter)')).toBe('generate');
    expect(helpKey('  Advanced… ')).toBe('advanced');
    expect(helpKey('↻ Regenerate')).toBe('regenerate');
    expect(helpKey('Generate ✨')).toBe('generate');
    expect(helpKey('Image Effects (18)')).toBe('image effects');
  });
  it('every entry has a name and keys are already normalized', () => {
    for (const [key, entry] of Object.entries(STUDIO_HELP)) {
      expect(entry.name, key).toBeTruthy();
      if (key !== 'captions (.srt)') expect(helpKey(key), key).toBe(key); // the one label whose parentheses are part of its name
    }
  });
  it('every alias points at a real entry', () => {
    for (const [from, to] of Object.entries(ALIASES)) expect(STUDIO_HELP[to], `${from} -> ${to}`).toBeTruthy();
  });
  it('resolves descriptive sentences and unknown labels', () => {
    expect(resolveStudioHelp('Change aspect ratio')?.name).toBe('Aspect Ratio');
    expect(resolveStudioHelp('Show model options')?.name).toBe('Model');
    expect(resolveStudioHelp('Totally unknown control')).toBeNull();
  });
  it('derives labels from control ids', () => {
    expect(idLabels('v-duration-btn')).toContain('duration');
    expect(idLabels('')).toEqual([]);
  });
});

describe('findHelp', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  it('data-help wins over the title, and a long title sentence does not shadow the visible name', () => {
    document.body.innerHTML = '<button data-help="seed" title="Something else entirely">?</button><button title="Show advanced options">Seed</button>';
    const [a, b] = document.querySelectorAll('button');
    expect(findHelp(a)?.entry.name).toBe('Seed');
    expect(findHelp(b)?.entry.name).toBe('Seed');
  });
  it('names a value-showing button from its id', () => {
    document.body.innerHTML = '<button id="v-duration-btn" title="Set video duration">5s</button>';
    expect(findHelp(document.querySelector('button'))?.entry.name).toBe('Duration');
  });
  it('options inherit a group-level data-help, but keep their own copy when they have one', () => {
    document.body.innerHTML = '<div data-help="model"><div><button>Some Model v3</button></div></div><div data-help="model"><button>Generate</button></div>';
    const [a, b] = document.querySelectorAll('button');
    expect(findHelp(a)?.entry.name).toBe('Model');
    expect(findHelp(b)?.entry.name).toBe('Generate');
  });
  it('names a bare select from the caption beside it', () => {
    document.body.innerHTML = '<label><span>Duration</span><select><option>3s</option></select></label>';
    expect(findHelp(document.querySelector('select'))?.entry.name).toBe('Duration');
  });
  it('themes a control\'s own title when there is no copy', () => {
    document.body.innerHTML = '<button title="Custom hint">?</button>';
    expect(findHelp(document.querySelector('button'))?.entry).toEqual({ name: 'Custom hint' });
  });
  it('ignores the card itself', () => {
    document.body.innerHTML = '<div class="studio-tip"><button aria-label="Seed">s</button></div>';
    expect(findHelp(document.querySelector('button'))).toBeNull();
  });
});

describe('place', () => {
  const rect = (o) => ({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, ...o });
  it('opens below, flips above near the bottom, beside small icons, and clamps horizontally', () => {
    expect(place(rect({ left: 100, right: 300, top: 50, bottom: 90, width: 200, height: 40 }), 200, 60, 1000, 800).top).toBe(100);
    expect(place(rect({ left: 100, right: 300, top: 740, bottom: 780, width: 200, height: 40 }), 200, 60, 1000, 800).top).toBe(670);
    expect(place(rect({ left: 10, right: 42, top: 100, bottom: 132, width: 32, height: 32 }), 200, 60, 1000, 800).left).toBe(52);
    const c = place(rect({ left: 950, right: 1000, top: 50, bottom: 90, width: 50, height: 40 }), 300, 60, 1000, 800);
    expect(c.left + 300).toBeLessThanOrEqual(990);
  });
});

describe('tooltip colors match this repo (cyan / purple), never the other repo (lime)', () => {
  const css = TIP_CSS.toLowerCase();
  it('uses the app\'s cyan primary and purple accent', () => {
    expect(css).toContain('var(--color-primary, #22d3ee)');
    expect(css).toContain('var(--color-accent, #a855f7)');
    expect(css).toContain('#0a0a0a');
  });
  it('contains none of remix-new-editor\'s lime', () => {
    for (const hex of ['#d9ff00', '#c4e600', '#a8e000']) expect(css, hex).not.toContain(hex);
  });
  it('a plain title card gets the light text style, not the accent title', () => {
    expect(css).toMatch(/\.studio-tip--plain \.studio-tip__name\s*\{[^}]*var\(--tip-text\)/);
  });
  it('the shell mounts the layer', () => {
    const shell = readFileSync(join(process.cwd(), 'components/StandaloneShell.js'), 'utf8');
    expect(shell).toContain('<StudioTooltips />');
  });
});

describe('mountStudioTooltips', () => {
  let unmount;
  beforeEach(() => { document.body.innerHTML = ''; unmount = mountStudioTooltips(); });
  afterEach(() => unmount());
  it('injects its stylesheet once and removes it on unmount', () => {
    expect(document.querySelectorAll('#studio-tip-style')).toHaveLength(1);
    unmount();
    expect(document.getElementById('studio-tip-style')).toBeNull();
  });
  it('shows a themed card on hover and removes the native title while it is open', async () => {
    document.body.innerHTML = '<button id="b" title="Pick one">Seed</button>';
    const b = document.getElementById('b');
    b.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, pointerType: 'mouse' }));
    expect(b.getAttribute('title')).toBeNull();
    await new Promise((r) => setTimeout(r, 420));
    const card = document.getElementById('studio-tip-card');
    expect(card?.getAttribute('role')).toBe('tooltip');
    expect(card.textContent).toContain('Seed');
    expect(b.getAttribute('aria-describedby')).toBe('studio-tip-card');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(document.getElementById('studio-tip-card')).toBeNull();
    expect(b.getAttribute('title')).toBe('Pick one');
  });
});

describe('value, placeholder and label patterns found by the coverage audit', () => {
  it('names value-showing buttons by their shape', () => {
    expect(resolveStudioHelp('16:9')?.name).toBe('Aspect Ratio');
    expect(resolveStudioHelp('9:16')?.name).toBe('Aspect Ratio');
    expect(resolveStudioHelp('5s')?.name).toBe('Duration');
    expect(resolveStudioHelp('10s')?.name).toBe('Duration');
    expect(resolveStudioHelp('480p')?.name).toBe('Resolution');
    expect(resolveStudioHelp('1080p')?.name).toBe('Resolution');
    expect(resolveStudioHelp('2K')?.name).toBe('Resolution');
    expect(resolveStudioHelp('1.5K')?.name).toBe('Resolution');
    expect(resolveStudioHelp('3 Highlights')?.name).toBe('Max Highlights');
    expect(resolveStudioHelp('Orientation:image')?.name).toBe('Orientation');
  });
  it('does not give value copy to things that only look similar', () => {
    for (const label of ['10:30 AM', '5 seconds', 'Plan: 5s', '4K video', 'Top 5s', '16:9 HD', 'Version 2K']) expect(resolveStudioHelp(label), label).toBeNull();
  });
  it('names text fields by their placeholder', () => {
    expect(resolveStudioHelp('Describe the image you want to create')?.name).toBe('Prompt');
    expect(resolveStudioHelp('Describe the video you want to create')?.name).toBe('Prompt');
    expect(resolveStudioHelp('Optional — describe additional scene details, lighting, or motion nuances...')?.name).toBe('Prompt');
    expect(resolveStudioHelp('Describe speech style...')?.name).toBe('Speech style');
    expect(resolveStudioHelp('Search SmartVideo GO AI Apps...')?.name).toBe('Search');
    expect(resolveStudioHelp('Describe your motion video')?.name).toBe('Prompt');
  });
  it('shared labels are not described as something else (Community, Generate tab)', () => {
    expect(resolveStudioHelp('Community')?.summary).not.toMatch(/workflow/i);
    document.body.innerHTML = '<button data-help="thumbnail view">generate</button><button>generate</button>';
    const [tab, run] = document.querySelectorAll('button');
    expect(findHelp(tab)?.entry.name).toBe('View');       // the tab is tagged at the source, so it is not "Run the job"
    expect(findHelp(run)?.entry.name).toBe('Generate');   // an untagged Generate button still is
  });
  it('the model button tag resolves to the Model copy', () => {
    document.body.innerHTML = '<button data-help="model"><span>Nano Banana</span></button>';
    expect(findHelp(document.querySelector('button'))?.entry.name).toBe('Model');
  });
});

describe('data-help keys written in the studio source', () => {
  const { readdirSync, readFileSync, statSync } = require('node:fs');
  const walk = (dir) => readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return ['node_modules', '__tests__', 'dist', '.next', 'studio-tooltips'].includes(n) ? [] : walk(p);
    return /\.(js|jsx|ts|tsx)$/.test(n) ? [p] : [];
  });
  it('every literal key resolves to copy (dynamic keys are checked by the live audit)', () => {
    const bad = [];
    let found = 0;
    for (const dir of ['components', 'packages/studio/src', 'src/apps']) {
      for (const file of walk(join(process.cwd(), dir))) {
        const text = readFileSync(file, 'utf8');
        for (const m of text.matchAll(/data-help="([^"{}$]+)"/g)) { found++; if (!resolveStudioHelp(m[1])) bad.push(`${file.replace(process.cwd() + '/', '')}: ${m[1]}`); }
      }
    }
    expect(found).toBeGreaterThan(15);   // the tags exist; this is not vacuously true
    expect(bad).toEqual([]);
  });
});

describe('studio-level tooltips (shell tabs, chrome, mounts)', () => {
  const { readFileSync: read } = require('node:fs');
  const shell = read(join(process.cwd(), 'components/StandaloneShell.js'), 'utf8');
  const tabIds = [...shell.slice(shell.indexOf('const TABS = ['), shell.indexOf('];', shell.indexOf('const TABS = [')))
    .matchAll(/id:\s*'([^']+)'/g)].map((m) => m[1]);

  it('found the shell tabs (so the checks below are not vacuous)', () => { expect(tabIds.length).toBeGreaterThan(20); });
  it('every shell tab has studio-level copy: the owner\'s label and tagline from the Academy guides', () => {
    for (const id of tabIds) {
      const entry = studioEntry(id);
      expect(entry, `tab "${id}" has no studio guide`).toBeTruthy();
      expect(entry.summary.length, id).toBeGreaterThan(10);
    }
  });
  it('a tab button resolves to its studio, ahead of any plain text', () => {
    document.body.innerHTML = '<nav><button data-tab="image">Image Studio</button><button data-tab="lipsync">Lip Sync</button></nav>';
    const [img, lip] = document.querySelectorAll('button');
    expect(findHelp(img)?.entry).toEqual({ name: 'Image Studio', summary: expect.stringMatching(/image/i) });
    expect(findHelp(lip)?.entry.name).toBe('Lip Sync');
  });
  it('an unknown tab id falls back to the normal label lookup instead of failing', () => {
    document.body.innerHTML = '<button data-tab="nope" title="Hello">x</button>';
    expect(findHelp(document.querySelector('button'))?.entry).toEqual({ name: 'Hello' });
  });
  it('shell chrome has written copy', () => {
    expect(resolveStudioHelp('Settings — API key, local models, preferences')?.name).toBe('Settings');
    expect(resolveStudioHelp('Sign out of your account')?.name).toBe('Sign out');
    expect(resolveStudioHelp('Step-by-step guide for Image Studio')?.name).toBe('Studio guide');
    expect(resolveStudioHelp('Academy')?.name).toBe('Academy');
  });
  it('every layout or page that renders studio UI outside the shell mounts the tooltip layer', () => {
    for (const file of ['app/(brand-studio)/layout.tsx', 'app/academy/page.tsx', 'components/StandaloneShell.js']) {
      expect(read(join(process.cwd(), file), 'utf8'), file).toContain('<StudioTooltips />');
    }
  });
});

describe('render-time copy and long placeholders', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  it('data-help-text carries copy supplied by the studio (schema-driven fields)', () => {
    document.body.innerHTML = '<input placeholder="Persona ID" data-help-text="The voice to apply to the generated music.">';
    expect(findHelp(document.querySelector('input'))?.entry).toEqual({ name: 'Persona ID', summary: 'The voice to apply to the generated music.' });
  });
  it('data-help-name overrides the heading, and the text counts as written copy (has a summary)', () => {
    document.body.innerHTML = '<select data-help-name="Voice" data-help-text="Pick one."><option>a</option></select>';
    expect(findHelp(document.querySelector('select'))?.entry).toEqual({ name: 'Voice', summary: 'Pick one.' });
  });
  it('a long placeholder is still matched by its prefix', () => {
    const long = "Describe the motion graphic — 'Animated sales dashboard with glowing bar charts and rising numbers, neon cyan on black'";
    expect(long.length).toBeGreaterThan(80);
    document.body.innerHTML = `<textarea placeholder="${long}"></textarea>`;
    expect(findHelp(document.querySelector('textarea'))?.entry.name).toBe('Prompt');
  });
  it('anchors with an href read their text, so nav links resolve', () => {
    document.body.innerHTML = '<a href="/academy">Academy</a><a>Academy</a>';
    const [link, bare] = document.querySelectorAll('a');
    expect(findHelp(link)?.entry.name).toBe('Academy');
    expect(findHelp(bare)).toBeNull();
  });
});
