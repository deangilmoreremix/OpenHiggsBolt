// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import AcademyCourse from '@/components/academy/AcademyCourse';
import { BUILD_WITH_AI_TRACK, academyTrackUrl, academyBuildWithAiUrl } from '@/data/academyStudioGuides';

const LESSON = [
  '# Intro', '', '> **Time:** about 10 minutes. **You will finish with:** a plan.', '', 'Hello there.', '',
  '## Why it matters', 'Because it does.', '',
  '## Step by step', '### 1. One', 'Do one.', '', '### 2. Two', 'Do two.', '',
  '## Check yourself', '', '* [ ] ready', '* [ ] set',
].join('\n');

const tracks = [
  { slug: 'ugc', title: 'AI Video Ads', order: 1, lessons: [{ slug: '01-intro', title: 'Intro' }, { slug: '02-next', title: 'Second lesson' }], templates: [] },
  { slug: BUILD_WITH_AI_TRACK, title: 'Build & Launch Apps', order: 16, lessons: [{ slug: '00-overview', title: 'Overview' }, { slug: '01-start-free-accounts', title: 'Start Free Accounts' }], templates: [] },
] as any;

function stubFetch() {
  const f = vi.fn(async (url: string) => {
    if (String(url).includes('/api/academy/progress')) return new Response(JSON.stringify({ error: 'UNAUTHENTICATED' }), { status: 401 });
    return new Response(JSON.stringify({ markdown: LESSON }), { status: 200 });
  });
  vi.stubGlobal('fetch', f);
  return f;
}

beforeEach(() => { localStorage.clear(); window.history.replaceState(null, '', '/academy'); stubFetch(); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const stepNav = () => screen.getByRole('navigation', { name: 'Lesson steps' });

describe('Learning Paths: a self-paced lesson', () => {
  it('shows one step at a time with Back/Next and a progress bar', async () => {
    render(<AcademyCourse tracks={tracks} initial={{ track: 'ugc', lesson: '01-intro' }} />);
    await screen.findByText(/Step 1 of 5/);
    expect(screen.getByText('About 10 minutes')).toBeTruthy();
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0');
    expect(screen.getByRole('heading', { name: 'Overview' })).toBeTruthy();
    expect(screen.queryByText('Because it does.')).toBeNull(); // not the whole lesson at once
    fireEvent.click(screen.getByRole('button', { name: /Next step/ }));
    expect(await screen.findByText('Because it does.')).toBeTruthy();
    expect(screen.getByText(/Step 2 of 5/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Back/ }));
    await screen.findByText(/Step 1 of 5/);
    expect((screen.getByRole('button', { name: /Back/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('expands Step by step into its own screens and lets the learner jump anywhere', async () => {
    render(<AcademyCourse tracks={tracks} initial={{ track: 'ugc', lesson: '01-intro' }} />);
    await screen.findByText(/Step 1 of 5/);
    fireEvent.click(within(stepNav()).getByRole('button', { name: /2\. Two/ }));
    expect(await screen.findByText('Do two.')).toBeTruthy();
    expect(screen.queryByText('Do one.')).toBeNull();
    expect(screen.getByText(/Step 4 of 5/)).toBeTruthy();
    expect(screen.getByText('Step by step')).toBeTruthy(); // the section label stays visible
  });

  it('remembers where the learner left off and resumes at the same step after a reload', async () => {
    const first = render(<AcademyCourse tracks={tracks} initial={{ track: 'ugc', lesson: '01-intro' }} />);
    await screen.findByText(/Step 1 of 5/);
    fireEvent.click(screen.getByRole('button', { name: /Next step/ }));
    fireEvent.click(screen.getByRole('button', { name: /Next step/ }));
    await screen.findByText(/Step 3 of 5/);
    first.unmount();
    window.history.replaceState(null, '', '/academy');
    // a fresh visit with no deep link: the Continue card brings them back to the exact step
    render(<AcademyCourse tracks={tracks} />);
    const card = await screen.findByTestId('continue-card');
    expect(within(card).getByText('Intro')).toBeTruthy();
    fireEvent.click(within(card).getByRole('button', { name: /Continue/ }));
    expect(await screen.findByText(/Step 3 of 5/)).toBeTruthy();
    expect(screen.getByText('Do one.')).toBeTruthy();
  });

  it('opening a lesson never overwrites the saved step with step 1 on the way in', async () => {
    const first = render(<AcademyCourse tracks={tracks} initial={{ track: 'ugc', lesson: '01-intro', s: '2-two' }} />);
    await screen.findByText(/Step 4 of 5/);
    await waitFor(() => expect(JSON.parse(localStorage.getItem('academy-course-progress:v1')!).lastStepId).toBe('2-two'));
    first.unmount();
    const writes: string[] = [];
    const setItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, k: string, v: string) { if (k === 'academy-course-progress:v1') writes.push(JSON.parse(v).lastStepId); return setItem.call(this, k, v); });
    render(<AcademyCourse tracks={tracks} initial={{ track: 'ugc', lesson: '01-intro' }} />);
    await screen.findByText(/Step 4 of 5/);
    expect(writes).not.toContain('overview');
    vi.restoreAllMocks();
  });

  it('opening the lesson again resumes the saved step even without the Continue card', async () => {
    const first = render(<AcademyCourse tracks={tracks} initial={{ track: 'ugc', lesson: '01-intro' }} />);
    await screen.findByText(/Step 1 of 5/);
    fireEvent.click(screen.getByRole('button', { name: /Next step/ }));
    await screen.findByText(/Step 2 of 5/);
    first.unmount();
    render(<AcademyCourse tracks={tracks} initial={{ track: 'ugc', lesson: '01-intro' }} />);
    expect(await screen.findByText(/Step 2 of 5/)).toBeTruthy();
  });

  it('a deep link to a step beats the saved position', async () => {
    render(<AcademyCourse tracks={tracks} initial={{ track: 'ugc', lesson: '01-intro', s: '2-two' }} />);
    expect(await screen.findByText(/Step 4 of 5/)).toBeTruthy();
    await waitFor(() => expect(window.location.search).toContain('s=2-two'));
  });

  it('checklist boxes can be ticked, are saved, and survive a reload', async () => {
    const first = render(<AcademyCourse tracks={tracks} initial={{ track: 'ugc', lesson: '01-intro', s: 'check-yourself' }} />);
    const ready = (await screen.findByLabelText('ready')) as HTMLInputElement;
    expect(ready.checked).toBe(false);
    fireEvent.click(ready);
    expect((screen.getByLabelText('ready') as HTMLInputElement).checked).toBe(true);
    expect(screen.getByText(/1 of 2 ticked/)).toBeTruthy();
    first.unmount();
    render(<AcademyCourse tracks={tracks} initial={{ track: 'ugc', lesson: '01-intro', s: 'check-yourself' }} />);
    expect(((await screen.findByLabelText('ready')) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByLabelText('set') as HTMLInputElement).checked).toBe(false);
  });

  it('marking a lesson complete shows a tick, moves Continue on, and offers the next lesson', async () => {
    render(<AcademyCourse tracks={tracks} initial={{ track: 'ugc', lesson: '01-intro', s: 'check-yourself' }} />);
    fireEvent.click(await screen.findByRole('button', { name: /Mark lesson complete/ }));
    expect(await screen.findByText('Lesson complete ✓')).toBeTruthy();
    expect(screen.getByText('Completed:')).toBeTruthy(); // sidebar: accessible text for the tick
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('100');
    const next = screen.getByRole('button', { name: /Next lesson: Second lesson/ });
    fireEvent.click(next);
    await screen.findByText(/Step 1 of 5/);
    expect(screen.getByRole('heading', { name: 'Second lesson' })).toBeTruthy();
  });
});

describe('Build with AI is its own tab', () => {
  it('shows a Build with AI tab in the header and keeps that course out of Learning Paths', async () => {
    render(<AcademyCourse tracks={tracks} />);
    const tabs = screen.getByRole('tablist', { name: 'Academy sections' });
    expect(within(tabs).getAllByRole('tab').map((t) => t.textContent)).toEqual(['Learning Paths', 'Studio Reference', 'Build with AI']);
    expect(screen.getByText(/1 course tracks/)).toBeTruthy();
    expect(screen.queryByText(/Build & Launch Apps/)).toBeNull();
    fireEvent.click(within(tabs).getByRole('tab', { name: 'Build with AI' }));
    expect(await screen.findByTestId('build-with-ai')).toBeTruthy();
    expect(window.location.search).toContain('view=build-with-ai');
    expect(screen.getByRole('button', { name: /Start the course/ })).toBeTruthy();
  });

  it('runs the course step by step, saves progress and offers to continue after a reload', async () => {
    const first = render(<AcademyCourse tracks={tracks} initial={{ view: 'build-with-ai' }} />);
    fireEvent.click(await screen.findByRole('button', { name: /Start the course/ }));
    await screen.findByText(/Step 1 of 5/);
    fireEvent.click(screen.getByRole('button', { name: /Next step/ }));
    await screen.findByText(/Step 2 of 5/);
    first.unmount();
    window.history.replaceState(null, '', '/academy?view=build-with-ai');
    render(<AcademyCourse tracks={tracks} initial={{ view: 'build-with-ai' }} />);
    fireEvent.click(await screen.findByRole('button', { name: /Continue where you left off/ }));
    expect(await screen.findByText(/Step 2 of 5/)).toBeTruthy();
  });

  it('an old Track 16 link opens the tab with the same lesson', async () => {
    render(<AcademyCourse tracks={tracks} initial={{ track: BUILD_WITH_AI_TRACK, lesson: '01-start-free-accounts' }} />);
    expect(await screen.findByTestId('build-with-ai')).toBeTruthy();
    expect(await screen.findByRole('heading', { name: 'Start Free Accounts' })).toBeTruthy();
  });

  it('every link to the course goes to the tab', () => {
    expect(academyTrackUrl(BUILD_WITH_AI_TRACK)).toBe('/academy?view=build-with-ai');
    expect(academyTrackUrl(BUILD_WITH_AI_TRACK, '05-x')).toBe('/academy?view=build-with-ai&lesson=05-x');
    expect(academyBuildWithAiUrl('a b')).toBe('/academy?view=build-with-ai&lesson=a%20b');
    expect(academyTrackUrl('ugc', '01-how')).toBe('/academy?track=ugc&lesson=01-how');
  });
});
