// @vitest-environment jsdom
//
// Tooltip coverage audit for the OpenHiggsBolt studios.
//
// /studio is Clerk-protected and Clerk 7 will not run without keys, so instead of driving a browser this mounts each studio component
// directly in jsdom and runs the real resolver (components/studio-tooltips/tooltipLayer.js findHelp) on what it renders. A control is
//   covered : resolves to written copy in components/studio-tooltips/studioHelp.js
//   plain   : only has its own native title (the layer themes it, but there is no copy)
//   none    : has no label at all
//
//   npm run audit:tooltips                       # all studios
//   AUDIT_ONLY=ImageStudio,VideoStudio npm run audit:tooltips
//   AUDIT_VERBOSE=1 AUDIT_OUT=/tmp/coverage.json npm run audit:tooltips
//   AUDIT_STATES=1 npm run audit:tooltips        # also click each tab / toggle (never run/delete/pay/sign-out) and add the controls it reveals
//   AUDIT_MIN=0.85 npm run audit:tooltips        # fail when any studio is below this ratio (default: report only)
//
// Caveats of the jsdom approach: no CSS is applied, so only the Tailwind `hidden` class (with no sm:/md:/lg: display override) and the
// hidden attribute / inline display:none are treated as hidden; other responsive or layout-dependent visibility is over-counted. Studios
// that need a live backend or a context this harness does not provide are reported as "not auditable" with the error, never dropped.
// Not audited: generated results, example galleries and their filter chips (content, not controls).

import React from 'react';
import { describe, it, afterAll, vi } from 'vitest';
import { render, cleanup, act, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { writeFileSync } from 'node:fs';
import { findHelp } from '../components/studio-tooltips/tooltipLayer.js';

// ── jsdom gaps the studios expect ─────────────────────────────────────────────
if (!window.matchMedia) window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false });
for (const name of ['ResizeObserver', 'IntersectionObserver']) {
  if (!window[name]) window[name] = class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } };
}
if (!URL.createObjectURL) URL.createObjectURL = () => 'blob:audit';
if (!URL.revokeObjectURL) URL.revokeObjectURL = () => {};
if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};
HTMLCanvasElement.prototype.getContext = () => null;
// No network: every request fails fast, so studios show their offline state instead of hanging.
vi.stubGlobal('fetch', async () => ({ ok: false, status: 503, json: async () => ({}), text: async () => '', blob: async () => new Blob(), headers: new Headers() }));
const state = vi.hoisted(() => ({ path: '/studio/image' }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push() {}, replace() {}, back() {}, forward() {}, refresh() {}, prefetch: async () => {} }),
  usePathname: () => state.path,
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));
vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({ isLoaded: true, isSignedIn: true, userId: 'audit_user', getToken: async () => null }),
  useClerk: () => ({ signOut: async () => {}, openSignIn: () => {} }),
  useUser: () => ({ isLoaded: true, isSignedIn: true, user: { id: 'audit_user', primaryEmailAddress: { emailAddress: 'audit@example.com' } } }),
  ClerkProvider: ({ children }) => children,
  SignedIn: ({ children }) => children,
  SignedOut: () => null,
}));
vi.mock('@/components/SocialPublishProvider', async () => {
  const { createContext } = await import('react');
  return {
    useSocialPublish: () => ({ openPublish: () => {}, closePublish: () => {}, openSocialPublisher: () => {} }),
    PublishStep: () => null,
    SocialPublishProvider: ({ children }) => children,
    SocialPublishContext: createContext(null),
  };
});

const KEY = 'mu_test_key_0123456789';
const noop = () => {};
const common = { apiKey: KEY, locale: 'en', onGenerationStart: noop, onGenerationEnd: noop, onGenerationComplete: noop, onGenerationError: noop, onFilesHandled: noop, droppedFiles: null, templateData: null, active: true, isHeaderVisible: true, onToggleHeader: noop, onRequestApiKey: noop, onDismissApiKey: noop };

const pkg = (file) => () => import(/* @vite-ignore */ `studio/src/components/${file}`);
const app = (file) => () => import(/* @vite-ignore */ `../src/apps/${file}`);
const pair = (layout, page) => async () => {
  const [L, P] = await Promise.all([import(/* @vite-ignore */ layout), import(/* @vite-ignore */ page)]);
  return { default: (props) => <L.default><P.default {...props} /></L.default> };
};
const STUDIOS = [
  ['ImageStudio', pkg('ImageStudio')], ['VideoStudio', pkg('VideoStudio')], ['EditStudio', pkg('edit/EditStudio')],
  ['ClippingStudio', pkg('ClippingStudio')], ['VibeMotionStudio', pkg('VibeMotionStudio')], ['MotionControlStudio', pkg('MotionControlStudio')],
  ['LipSyncStudio', pkg('LipSyncStudio')], ['CinemaStudio', pkg('CinemaStudio')], ['AudioStudio', pkg('AudioStudio')],
  ['MarketingStudio', pkg('MarketingStudio')], ['RecastStudio', pkg('RecastStudio')], ['LayersStudio', pkg('LayersStudio')],
  ['AiInfluencerStudio', pkg('AiInfluencerStudio')], ['WorkflowStudio', pkg('WorkflowStudio')], ['AgentStudio', pkg('AgentStudio')],
  ['AppsStudio', pkg('AppsStudio')],
  ['ZackD', app('zackd/ZackD')], ['DesignAgent', app('design-agent/DesignAgent')], ['VFXStudio', app('vfx-studio/VFXStudio')],
  ['Storyboard', app('storyboard/Storyboard')], ['ThumbnailStudio', app('thumbnail-studio/ThumbnailStudio')],
  ['VideoPagesStudio', app('video-pages/VideoPagesStudio')], ['GoAiViralStudio', app('go-ai-viral/GoAiViralStudio')],
  ['MotionDirector', app('motion-director/MotionStudio'), { ownRouter: true, personalize: true }],
  ['SkillsBrowser', pkg('SkillsBrowser')],
  // The shell's own tab bar + header (the studio-level tooltips), with a studio mounted under it in demo mode.
  ['Shell (tab bar)', async () => ({ default: (await import('../components/StandaloneShell')).default }), { shell: true, ownRouter: true, props: { demoMode: true, initialTab: 'image' } }],
  // Brand Studio and Photo Studio live in their own layout (outside the shell), so audit layout + page together.
  ['BrandStudio (layout+page)', pair('../app/(brand-studio)/layout', '../app/(brand-studio)/brand-studio/page'), { path: '/brand-studio', ownRouter: true }],
  ['PhotoStudio (layout+page)', pair('../app/(brand-studio)/layout', '../app/(brand-studio)/photo-studio/page'), { path: '/photo-studio', ownRouter: true }],
];

const SELECTOR = 'button, a[href], select, input:not([type=hidden]), textarea, [role=button], [role=tab], [title], [data-tooltip], [data-help]';
const CONTENT = '[class*="gallery"], [class*="example-"], [data-example], [aria-hidden="true"]';
const SHOWN_ON_DESKTOP = /^(sm|md|lg|xl):(flex|block|inline|grid|inline-flex|inline-block)$/;

function isHidden(el) {
  for (let n = el; n && n !== document.body; n = n.parentElement) {
    if (n.hidden || n.style?.display === 'none') return true;
    const cls = (n.getAttribute('class') || '').split(/\s+/);
    if (cls.includes('hidden') && !cls.some((c) => SHOWN_ON_DESKTOP.test(c))) return true;
  }
  return false;
}

const labelOf = (el) => ((el.dataset.help || (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60)
  || el.getAttribute('aria-label') || el.getAttribute('title') || el.getAttribute('placeholder') || '').trim())
  || `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}`;
const statusOf = (el) => { const hit = findHelp(el); return hit ? (hit.entry.summary ? 'covered' : 'plain') : 'none'; };

// Never clicked by the states sweep: they run jobs, delete, spend credits or end the session.
const DANGEROUS = /generate|run\b|delete|remove|publish|pay|buy|checkout|upgrade|subscribe|sign ?out|log ?out|submit|send|export|render|clear|reset/i;
const togglerLabel = (el) => (el.textContent || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ');
const nextToggler = (done, within) => [...document.body.querySelectorAll('[role=tab], button[aria-pressed]')].find((el) => !isHidden(el) && !el.disabled
  && !(within && !el.closest(within)) && el.getAttribute('aria-selected') !== 'true' && el.getAttribute('aria-pressed') !== 'true'
  && togglerLabel(el) && !DANGEROUS.test(togglerLabel(el)) && !done.includes(togglerLabel(el)));

/** One record per control. A row of 6+ id-less sibling buttons (option list, card grid) is one record, covered only if every option is. */
function collect(within) {
  const INTERACTIVE = 'button, a, input, select, textarea, [role=button], [role=tab]';
  // A heading or label whose title only repeats its own visible text (an app card's <h3 title={name}>) is content, not a control.
  const echoesItself = (el) => !el.matches(INTERACTIVE) && !!el.getAttribute('title') && el.getAttribute('title').trim() === (el.textContent || '').trim();
  const visible = [...document.body.querySelectorAll(SELECTOR)].filter((el) => !isHidden(el) && !el.closest(CONTENT) && !echoesItself(el) && (!within || el.closest(within)));
  const siblings = new Map();
  visible.forEach((el) => { if (el.tagName === 'BUTTON' && !el.id) siblings.set(el.parentElement, (siblings.get(el.parentElement) || 0) + 1); });
  const groupDone = new Set();
  const seen = new Set();
  const records = [];
  for (const el of visible) {
    const group = el.tagName === 'BUTTON' && !el.id && siblings.get(el.parentElement) >= 6;
    let target = el; let status; let label;
    if (group) {
      if (groupDone.has(el.parentElement)) continue;
      groupDone.add(el.parentElement);
      const members = visible.filter((m) => m.parentElement === el.parentElement && m.tagName === 'BUTTON' && !m.id);
      const bad = members.filter((m) => statusOf(m) !== 'covered');
      target = bad[0] || el;
      status = bad.length ? statusOf(target) : 'covered';
      label = `[${members.length} options${bad.length ? `, ${bad.length} uncovered` : ''}] ${labelOf(target)}`;
    } else { label = labelOf(el); status = statusOf(el); }
    const key = `${target.tagName}|${label}`;
    if (seen.has(key)) continue;
    seen.add(key);
    records.push({ label, tag: target.tagName.toLowerCase(), id: target.id || '', status });
  }
  return records;
}

const report = {};
const only = process.env.AUDIT_ONLY ? process.env.AUDIT_ONLY.split(',') : null;

describe('tooltip coverage audit', () => {
  for (const [name, load, opts = {}] of STUDIOS) {
    if (only && !only.includes(name)) continue;
    it(name, async () => {
      cleanup(); localStorage.clear(); state.path = opts.path || '/studio/image';
      const quiet = ['error', 'warn', 'log', 'info'].map((k) => vi.spyOn(console, k).mockImplementation(() => {}));
      try {
        const mod = await load();
        const Studio = mod.default;
        const body = opts.ownRouter ? <Studio {...common} {...(opts.props || {})} /> : <MemoryRouter initialEntries={['/']}><Studio {...common} {...(opts.props || {})} /></MemoryRouter>;
        // The shell wraps every studio in DemoPersonalizeProvider; Motion Director reads it, so give it the same.
        const Provider = opts.personalize ? (await import('@/shared/personalization')).DemoPersonalizeProvider : null;
        await act(async () => { render(Provider ? <Provider apiKey={KEY}>{body}</Provider> : body); });
        await act(async () => { await new Promise((r) => setTimeout(r, 900)); });
        const within = opts.shell ? 'nav, header' : null;   // the shell entry audits only its own chrome, not the studio under it
        const merged = new Map();
        const add = (rs) => rs.forEach((r) => { const k = `${r.tag}|${r.label}`; if (!merged.has(k) || (merged.get(k).status !== 'covered' && r.status === 'covered')) merged.set(k, r); });
        add(collect(within));
        let states = 0;
        if (process.env.AUDIT_STATES) {
          const done = [];
          for (let i = 0; i < 12; i++) {
            const el = nextToggler(done, within);
            if (!el) break;
            done.push(togglerLabel(el)); states++;
            fireEvent.click(el);
            await act(async () => { await new Promise((r) => setTimeout(r, 250)); });
            add(collect(within));
          }
        }
        const records = [...merged.values()];
        if (!records.length) throw new Error('mounted but rendered no visible controls (needs live data or renders outside the document)');
        const covered = records.filter((r) => r.status === 'covered').length;
        report[name] = { states, total: records.length, covered, ratio: records.length ? Number((covered / records.length).toFixed(3)) : null, gaps: records.filter((r) => r.status !== 'covered') };
      } catch (e) {
        report[name] = { notAuditable: String(e?.message || e).split('\n')[0].slice(0, 200) };
      } finally { quiet.forEach((s) => s.mockRestore()); cleanup(); }
    });
  }

  afterAll(() => {
    const lines = Object.entries(report).map(([name, r]) => (r.notAuditable
      ? `${name.padEnd(22)} NOT AUDITABLE  ${r.notAuditable}`
      : `${name.padEnd(22)} ${String(r.covered).padStart(3)}/${String(r.total).padEnd(3)} ${r.ratio == null ? '  -' : `${(r.ratio * 100).toFixed(0).padStart(3)}%`}${r.states ? `  (+${r.states} states)` : ''}`));
    process.stdout.write(`\nTOOLTIP COVERAGE (OpenHiggsBolt, jsdom)\n${lines.join('\n')}\n`);
    if (process.env.AUDIT_VERBOSE) for (const [name, r] of Object.entries(report)) if (r.gaps?.length) process.stdout.write(`\n== ${name}\n${r.gaps.map((g) => `  ${g.status.padEnd(5)} ${g.tag.padEnd(8)} ${g.id ? `#${g.id} ` : ''}${g.label}`).join('\n')}\n`);
    if (process.env.AUDIT_OUT) writeFileSync(process.env.AUDIT_OUT, JSON.stringify(report, null, 2));
    const min = Number(process.env.AUDIT_MIN || 0);
    const below = min ? Object.entries(report).filter(([, r]) => !r.notAuditable && r.ratio != null && r.ratio < min).map(([n, r]) => `${n} ${(r.ratio * 100).toFixed(0)}%`) : [];
    if (below.length) throw new Error(`below AUDIT_MIN=${min}: ${below.join(', ')}`);
  });
});
