// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, cleanup } from '@testing-library/react';
import { execFileSync } from 'node:child_process';
import { MODULES, ALL_LESSONS, LESSON_IDS, GLOSSARY } from '@/content/resellerAcademy';
import {
  emptyProgress, sanitizeProgress, toggleCheck, setLessonComplete, markPhase, mergeProgress,
  continueTarget, percentComplete, milestoneStatus, selectApp, PROGRESS_STORAGE_KEY,
} from '@/lib/resellerAcademyProgress';
import { WORKSHOP_APP_IDS, getWorkshop, getAppFacts } from '@/lib/resellerAcademyApps';
import { listResellerAppIds } from '@/lib/resellerAccess';
import { looksSecret, CopyBlock } from '@/components/reseller/academy/CopyBlock';
import { RESELLER_APPS } from '@/packages/studio/src/components/AppsStudio';
import AppWorkshopView from '@/components/reseller/academy/AppWorkshopView';
import ResellerAcademyShell from '@/components/reseller/academy/ResellerAcademyShell';
import facts from '@/data/resellerAppFacts.json';

const SECRET = /(sk|rk)_(live|test)_[A-Za-z0-9]{10,}|whsec_[A-Za-z0-9]{10,}|eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}/;

describe('curriculum', () => {
  it('has 12 modules in order with unique lesson ids', () => {
    expect(MODULES.map((m) => m.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(new Set(LESSON_IDS).size).toBe(LESSON_IDS.length);
  });
  it('Stripe module has lessons 7.1-7.5', () => {
    expect(MODULES[6].lessons.map((l) => l.id)).toEqual(['7.1', '7.2', '7.3', '7.4', '7.5']);
  });
  it('every lesson has learn/follow/complete/verify content and known glossary keys', () => {
    for (const l of ALL_LESSONS) {
      expect(l.learn.length, l.id).toBeGreaterThan(0);
      expect(l.follow.length, l.id).toBeGreaterThan(0);
      expect(l.complete.length, l.id).toBeGreaterThan(0);
      expect(l.verify.length, l.id).toBeGreaterThan(0);
      for (const g of l.glossary) expect(GLOSSARY[g], `${l.id}:${g}`).toBeTruthy();
    }
  });
  it('contains no secret-looking values and no fabricated media', () => {
    const text = JSON.stringify(MODULES);
    expect(SECRET.test(text)).toBe(false);
    expect(looksSecret(text)).toBe(false);
    expect(text).not.toMatch(/youtube\.com|youtu\.be|\.mp4|\.png/);
  });
  it('external links are https official hosts; internal links are rooted', () => {
    for (const l of ALL_LESSONS) for (const r of [...l.resources, ...l.follow.flatMap((f) => (f.link ? [f.link] : []))]) {
      expect(r.url.startsWith('https://') || r.url.startsWith('/'), r.url).toBe(true);
    }
  });
});

describe('progress', () => {
  it('sanitizes untrusted input and drops unknown ids', () => {
    const p = sanitizeProgress({ updatedAt: 5, selectedAppId: 'nope', lastLessonId: '99.9', completedLessons: ['1.1', 'x', '1.1'], checks: { '1.1': [0, 0, -1, 'a'], zz: [1] }, phases: { '1.1': ['learn', 'bad'] } }, LESSON_IDS, WORKSHOP_APP_IDS);
    expect(p.selectedAppId).toBeNull();
    expect(p.lastLessonId).toBeNull();
    expect(p.completedLessons).toEqual(['1.1']);
    expect(p.checks).toEqual({ '1.1': [0] });
    expect(p.phases).toEqual({ '1.1': ['learn'] });
  });
  it('tracks completion, checks, continue target, percent, milestones', () => {
    let p = emptyProgress();
    p = setLessonComplete(p, '1.1', true, 1);
    p = toggleCheck(p, '1.2', 0, 2);
    p = markPhase(p, '1.2', 'learn', 3);
    expect(continueTarget(p, LESSON_IDS)).toBe('1.2');
    expect(percentComplete(p, LESSON_IDS.length)).toBe(Math.round(100 / LESSON_IDS.length));
    p = setLessonComplete(p, '3.2', true, 4);
    expect(milestoneStatus(p).find((m) => m.key === 'source')?.done).toBe(true);
    p = selectApp(p, 'pet-product-studio', 5);
    expect(p.selectedAppId).toBe('pet-product-studio');
  });
  it('merge is last-write-wins', () => {
    const a = { ...emptyProgress(), updatedAt: 10 };
    const b = { ...emptyProgress(), updatedAt: 20, lastLessonId: '2.1' };
    expect(mergeProgress(a, b)).toBe(b);
    expect(mergeProgress(b, a)).toBe(b);
  });
  it('progress module never imports entitlement code', () => {
    const src = execFileSync('cat', ['src/lib/resellerAcademyProgress.ts'], { encoding: 'utf8' });
    expect(src).not.toMatch(/from ['"].*(resellerAccess|entitlements|access\/)/);
  });
});

describe('app facts and workshops (all 38)', () => {
  it('cover exactly the 38 allowlisted apps', () => {
    expect(WORKSHOP_APP_IDS.length).toBe(38);
    expect([...WORKSHOP_APP_IDS].sort()).toEqual([...listResellerAppIds()].sort());
    expect(RESELLER_APPS.length).toBe(38);
  });
  it('facts hold names only, never values', () => {
    expect(SECRET.test(JSON.stringify(facts))).toBe(false);
  });
  it('every app produces a workshop; web apps list Stripe env + a webhook path; the CLI says so', () => {
    for (const id of WORKSHOP_APP_IDS) {
      const w = getWorkshop(id)!;
      expect(w, id).toBeTruthy();
      if (w.readiness === 'cli-only') { expect(id).toBe('ai-youtube-shorts-generator'); continue; }
      const names = w.requiredEnv.map((e) => e.name);
      expect(names, id).toContain('STRIPE_SECRET_KEY');
      expect(w.facts.payment.recommendedWebhookPath, id).toMatch(/^\/api\//);
    }
    expect(getAppFacts('nope')).toBeNull();
  });
  it('renders the workshop for each app without secrets', () => {
    for (const id of WORKSHOP_APP_IDS) {
      const { container, unmount } = render(<AppWorkshopView appId={id} syncRemote={false} />);
      expect(screen.getByTestId('app-workshop')).toBeTruthy();
      expect(container.textContent).toContain('Back to');
      expect(SECRET.test(container.textContent ?? '')).toBe(false);
      unmount();
    }
  });
});

describe('copy block', () => {
  it('hides secret-looking snippets', () => {
    expect(looksSecret('sk_live_' + 'a'.repeat(24))).toBe(true);
    render(<CopyBlock label="x" value={'whsec_' + 'b'.repeat(24)} />);
    expect(screen.getByRole('alert')).toBeTruthy();
    cleanup();
    expect(looksSecret('npx prisma db push')).toBe(false);
  });
});

describe('academy shell journey', () => {
  beforeEach(() => { cleanup(); window.localStorage.clear(); });
  it('select app, complete a lesson, and resume after reload', () => {
    const first = render(<ResellerAcademyShell syncRemote={false} />);
    fireEvent.change(screen.getByLabelText('Selected application'), { target: { value: 'pet-product-studio' } });
    fireEvent.click(screen.getByRole('button', { name: /Start Module 1/ }));
    for (let i = 0; i < 3; i++) fireEvent.click(screen.getByRole('button', { name: /^Next:/ }));
    fireEvent.click(screen.getByRole('button', { name: /Mark complete/ }));
    const saved = JSON.parse(window.localStorage.getItem(PROGRESS_STORAGE_KEY)!);
    expect(saved.completedLessons).toEqual(['1.1']);
    expect(saved.selectedAppId).toBe('pet-product-studio');
    first.unmount();
    render(<ResellerAcademyShell syncRemote={false} />);
    const btn = screen.getByRole('button', { name: /Continue Learning/ });
    expect(btn.textContent).toContain('1.2');
    expect(within(screen.getByRole('progressbar')).queryByText(/x/)).toBeNull();
  });
  it('ticks, unticks, completes and un-completes with every change saved', () => {
    const read = () => JSON.parse(window.localStorage.getItem(PROGRESS_STORAGE_KEY)!);
    render(<ResellerAcademyShell syncRemote={false} />);
    fireEvent.click(screen.getByRole('button', { name: /Start Module 1/ }));
    fireEvent.click(screen.getByRole('button', { name: /^Next:/ }));
    fireEvent.click(screen.getByRole('button', { name: /^Next:/ }));
    const boxes = screen.getAllByRole('checkbox');
    fireEvent.click(boxes[0]);
    fireEvent.click(boxes[1]);
    expect(read().checks['1.1']).toEqual([0, 1]);
    fireEvent.click(boxes[0]);
    expect(read().checks['1.1']).toEqual([1]);
    fireEvent.click(boxes[1]);
    expect(read().checks['1.1']).toBeUndefined();
    fireEvent.click(boxes[0]);
    fireEvent.click(screen.getByRole('button', { name: /^Next:/ }));
    fireEvent.click(screen.getByRole('button', { name: /Mark complete/ }));
    expect(read().completedLessons).toEqual(['1.1']);
    fireEvent.click(screen.getByRole('button', { name: /1\.1 What you are launching/ }));
    for (let i = 0; i < 3; i++) fireEvent.click(screen.getByRole('button', { name: /^Next:/ }));
    fireEvent.click(screen.getByRole('button', { name: /Mark as not complete/ }));
    expect(read().completedLessons).toEqual([]);
    expect(read().checks['1.1']).toEqual([0]);
  });
});
