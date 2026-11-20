// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import AcademyCourse from '@/components/academy/AcademyCourse';
import { parseLesson } from '@/lib/academySteps';
import { BUILD_WITH_AI_TRACK } from '@/data/academyStudioGuides';

const FILE = path.join(process.cwd(), 'src/content/academy', BUILD_WITH_AI_TRACK, 'lessons/03-connect-chatgpt.md');
const md = fs.readFileSync(FILE, 'utf8');
const PROMPT = 'Using your Netlify, Stripe and Clerk connectors, list my Netlify sites, my Clerk application name, and my five most recent Stripe test payments. Do not change anything.';

const tracks = [
  { slug: 'ugc', title: 'AI Video Ads', order: 1, lessons: [{ slug: '01-a', title: 'A' }], templates: [] },
  { slug: BUILD_WITH_AI_TRACK, title: 'Build & Launch Apps', order: 16, lessons: [{ slug: '00-overview', title: 'Overview' }, { slug: '03-connect-chatgpt', title: 'Connect ChatGPT to Netlify, Clerk and Stripe' }], templates: [] },
] as any;

describe('Connect ChatGPT lesson: structure', () => {
  const p = parseLesson(md);
  it('reads the time and the outcome', () => {
    expect(p.minutes).toBe(15);
    expect(p.outcome).toMatch(/ChatGPT connected to Netlify, Clerk and Stripe/);
  });
  it('makes every action its own step, in order', () => {
    const titles = p.steps.map((s) => s.title);
    expect(titles).toEqual([
      'Before you start', 'Do you need both assistants?',
      '1. Check whether your plan allows connectors', '2. Add Netlify', '3. Add Stripe (test mode only)', '4. Add Clerk',
      '5. Run the read-only test', '6. Compare the answer with your dashboards', '7. If your plan does not allow connectors',
      'Check yourself', 'Differences worth knowing', 'Common mistakes',
    ]);
    expect(p.steps.filter((s) => s.group === 'Step by step')).toHaveLength(7);
  });
  it('every action step says what you should see and what to do if not (except the fallback path)', () => {
    for (const s of p.steps.filter((x) => x.group === 'Step by step' && !x.title.startsWith('7.'))) {
      expect(s.markdown, s.title).toMatch(/\*\*You should see:\*\*/);
      expect(s.markdown, s.title).toMatch(/\*\*If not:\*\*|\*\*If you do not:\*\*/);
    }
  });
  it('keeps the prompt as a copyable block and has a 4-item checklist', () => {
    const step5 = p.steps.find((s) => s.title.startsWith('5.'))!;
    expect(step5.markdown).toContain('```text');
    expect(step5.markdown).toContain(PROMPT);
    const check = p.steps.find((s) => s.kind === 'checklist')!;
    expect(check.checklist).toHaveLength(4);
  });
  it('never asks the learner to paste a secret and stays hedged about menus', () => {
    expect(md).toMatch(/never paste a secret key/i);
    expect(md).toMatch(/follow OpenAI's current help page/i);
    expect(md).not.toMatch(/sk_(live|test)_|whsec_/);
  });
});

describe('Connect ChatGPT lesson: in the player', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState(null, '', '/academy');
    vi.stubGlobal('fetch', vi.fn(async (url: string) => String(url).includes('/api/academy/progress') ? new Response('{}', { status: 401 }) : new Response(JSON.stringify({ markdown: md }), { status: 200 })));
  });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it('opens on the first step and moves through the numbered steps one screen at a time', async () => {
    render(<AcademyCourse tracks={tracks} initial={{ view: 'build-with-ai', lesson: '03-connect-chatgpt' }} />);
    await screen.findByText(/Step 1 of 12/);
    expect(screen.getByText('About 15 minutes')).toBeTruthy();
    const nav = screen.getByRole('navigation', { name: 'Lesson steps' });
    fireEvent.click(within(nav).getByRole('button', { name: /2\. Add Netlify/ }));
    expect(await screen.findByText('Netlify listed as connected in ChatGPT.', { exact: false })).toBeTruthy();
    expect(screen.getByText('You should see:')).toBeTruthy();
    expect(screen.getByText('If not:')).toBeTruthy();
    expect(screen.queryByText(/Choose to add or connect Stripe/)).toBeNull(); // the next step is not on this screen
  });

  it('the prompt has a Copy button that copies it exactly, with no extra whitespace', async () => {
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(<AcademyCourse tracks={tracks} initial={{ view: 'build-with-ai', lesson: '03-connect-chatgpt', s: '5-run-the-read-only-test' }} />);
    const block = await screen.findByTestId('code-block');
    expect(block.textContent).toContain(PROMPT);
    fireEvent.click(within(block).getByRole('button', { name: 'Copy' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(PROMPT));
    expect(await within(block).findByRole('button', { name: 'Copied' })).toBeTruthy();
  });

  it('the checklist can be ticked and the lesson completed from it', async () => {
    render(<AcademyCourse tracks={tracks} initial={{ view: 'build-with-ai', lesson: '03-connect-chatgpt', s: 'check-yourself' }} />);
    const boxes = (await screen.findAllByRole('checkbox')) as HTMLInputElement[];
    expect(boxes).toHaveLength(4);
    fireEvent.click(boxes[0]);
    expect((screen.getAllByRole('checkbox')[0] as HTMLInputElement).checked).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: /Mark lesson complete/ }));
    expect(await screen.findByText('Lesson complete ✓')).toBeTruthy();
  });
});
