// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import kb from '@/data/studioKnowledgeBase.json';
import { ACADEMY_STUDIO_GUIDES, STUDIO_GUIDE_IDS, academyStudioUrl, academyTrackUrl, getStudioGuide } from '@/data/academyStudioGuides';
import AcademyCourse from '@/components/academy/AcademyCourse';

const root = process.cwd();
const shell = fs.readFileSync(path.join(root, 'components/StandaloneShell.js'), 'utf8');
const tabIds = [...shell.slice(shell.indexOf('const TABS'), shell.indexOf('function SignOutButton')).matchAll(/id: '([^']+)'/g)].map((m) => m[1]);
const trackDirs = fs.readdirSync(path.join(root, 'src/content/academy'));
const studios = (kb as unknown as { studios: { id: string; route: string; howToSteps?: string[] }[] }).studios;

describe('Academy studio guide manifest', () => {
  it('covers every studio tab in the app shell', () => {
    expect(tabIds.length).toBeGreaterThanOrEqual(24);
    for (const id of tabIds) expect(STUDIO_GUIDE_IDS, id).toContain(id);
  });
  it('has unique ids, real routes and existing Academy tracks', () => {
    expect(new Set(STUDIO_GUIDE_IDS).size).toBe(STUDIO_GUIDE_IDS.length);
    for (const g of ACADEMY_STUDIO_GUIDES) {
      expect(g.route, g.id).toMatch(/^\/(studio\/[a-z-]+|photo-studio|brand-studio)$/);
      for (const t of g.tracks) expect(trackDirs, `${g.id}:${t}`).toContain(t);
    }
  });
  it('every guide has a knowledge-base entry with step-by-step instructions', () => {
    for (const g of ACADEMY_STUDIO_GUIDES) {
      const s = studios.find((x) => x.id === g.id);
      expect(s, `KB entry for ${g.id}`).toBeTruthy();
      expect((s?.howToSteps ?? []).length, `howToSteps for ${g.id}`).toBeGreaterThan(2);
    }
  });
  it('every studio recommends 2-4 specific lessons that exist (apps uses the Reseller Walkthrough)', () => {
    for (const g of ACADEMY_STUDIO_GUIDES) {
      if (g.id === 'apps') {
        expect((g.resellerLessons ?? []).length, 'apps reseller lessons').toBeGreaterThanOrEqual(2);
        continue;
      }
      expect(g.lessons.length, `lessons for ${g.id}`).toBeGreaterThanOrEqual(2);
      expect(g.lessons.length, `lessons for ${g.id}`).toBeLessThanOrEqual(4);
      for (const l of g.lessons) {
        expect(fs.existsSync(path.join(root, 'src/content/academy', l.track, 'lessons', `${l.lesson}.md`)), `${g.id}: ${l.track}/${l.lesson}`).toBe(true);
        expect(l.why.length, `${g.id} why`).toBeGreaterThan(5);
      }
    }
  });
  it('builds deep links', () => {
    expect(academyStudioUrl('image')).toBe('/academy?view=studio-reference&studio=image&tab=create');
    expect(academyTrackUrl('ugc', '01-how-ugc-works')).toBe('/academy?track=ugc&lesson=01-how-ugc-works');
    expect(getStudioGuide('nope')).toBeNull();
  });
});

const tracks = [
  { slug: 'ugc', title: 'AI Video Ads & UGC', order: 1, lessons: [{ slug: '00-a', title: 'A' }, { slug: '01-b', title: 'B' }], templates: [] },
  { slug: '02-ai-filmmaking', title: 'AI Filmmaking', order: 2, lessons: [{ slug: '01-x', title: 'X' }, { slug: '02-y', title: 'Y' }], templates: [] },
];

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ markdown: '# Lesson body' }), { status: 200 })));
  window.history.replaceState(null, '', '/academy');
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('Academy deep links', () => {
  it('?view=studio-reference&studio=<id> opens that studio on the Create tab with steps and the real studio link', () => {
    render(<AcademyCourse tracks={tracks as never} initial={{ view: 'studio-reference', studio: 'video', tab: 'create' }} />);
    const guide = screen.getByTestId('studio-create-guide');
    expect(guide.textContent).toMatch(/Step by step/);
    const open = screen.getByRole('link', { name: /Open Video Studio/ });
    expect(open.getAttribute('href')).toBe('/studio/video');
    expect(screen.getByRole('link', { name: 'AI Video Ads & UGC' }).getAttribute('href')).toBe('/academy?track=ugc');
  });
  it('selecting a studio writes the deep link to the address bar; closing keeps the view', () => {
    render(<AcademyCourse tracks={tracks as never} initial={{ view: 'studio-reference' }} />);
    fireEvent.click(screen.getByText('Image Studio'));
    expect(window.location.search).toContain('studio=image');
    expect(window.location.search).toContain('tab=create');
    fireEvent.click(screen.getByRole('button', { name: /Overview/ }));
    expect(window.location.search).toContain('tab=overview');
  });
  it('?track=&lesson= opens that lesson', async () => {
    render(<AcademyCourse tracks={tracks as never} initial={{ track: '02-ai-filmmaking', lesson: '02-y' }} />);
    await waitFor(() => expect((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.some((c) => String(c[0]).includes('track=02-ai-filmmaking') && String(c[0]).includes('slug=02-y'))).toBe(true));
  });
  it('ignores unknown studio/track values and falls back safely', () => {
    render(<AcademyCourse tracks={tracks as never} initial={{ view: 'studio-reference', studio: 'does-not-exist', track: 'nope' }} />);
    expect(screen.queryByTestId('studio-create-guide')).toBeNull();
    expect(screen.getAllByText('Studio Reference').length).toBeGreaterThan(0);
  });
  it('Studio Reference search finds a studio by its label', () => {
    render(<AcademyCourse tracks={tracks as never} initial={{ view: 'studio-reference' }} />);
    fireEvent.change(screen.getByPlaceholderText(/Search studios/), { target: { value: 'lip sync' } });
    expect(screen.getAllByText(/Lip Sync/).length).toBeGreaterThan(0);
  });
});
