// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import HelpAgent, { citedSources, linkCitations, STUDIO_SUGGESTIONS } from '@/components/help/HelpAgent';
import { STUDIO_GUIDE_IDS } from '@/data/academyStudioGuides';

const enc = new TextEncoder();
function sseResponse(events: [string, unknown][]) {
  const body = new ReadableStream({
    start(c) { for (const [e, d] of events) c.enqueue(enc.encode(`event: ${e}\ndata: ${JSON.stringify(d)}\n\n`)); c.close(); },
  });
  return new Response(body, { status: 200, headers: { 'content-type': 'text/event-stream' } });
}
const sources = [
  { id: 'S1', title: 'Reseller Setup Walkthrough 8.3 — Create the webhook', url: '/academy/reseller/launch?lesson=8.3', kind: 'reseller' },
  { id: 'S2', title: 'Blogger CMS — launch workshop', url: '/academy/reseller/apps/blogger-cms', kind: 'app' },
];

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => { fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('suggested questions', () => {
  it('every studio has its own three suggestions', () => {
    for (const id of STUDIO_GUIDE_IDS) expect(STUDIO_SUGGESTIONS[id]?.length, id).toBe(3);
  });
});

describe('citation helpers', () => {
  it('turns [S1] into numbered links and lists cited sources once', () => {
    expect(linkCitations('Do this [S1] and that [S2][S1].', sources)).toBe('Do this [1](/academy/reseller/launch?lesson=8.3) and that [2](/academy/reseller/apps/blogger-cms) [1](/academy/reseller/launch?lesson=8.3).');
    expect(linkCitations('Unknown [S9]', sources)).toBe('Unknown');
    expect(citedSources('a [S2] b [S2] c [S1]', sources).map((s) => s.id)).toEqual(['S2', 'S1']);
  });
});

describe('HelpAgent popup', () => {
  it('renders nothing when signed out / unavailable', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ available: false, hasKey: false }), { status: 401 }));
    const { container } = render(<HelpAgent />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(container.textContent).toBe('');
  });

  it('does NOT mention the key until the customer tries to ask; then shows the add-key message with a link to the modal', async () => {
    fetchMock.mockImplementation(async (_u: string, init?: RequestInit) =>
      !init || init.method !== 'POST' ? new Response(JSON.stringify({ available: true, hasKey: false }), { status: 200 }) : new Response('{"error":"OPENAI_KEY_REQUIRED"}', { status: 409 }));
    const onKey = vi.fn();
    render(<HelpAgent onRequestApiKey={onKey} />);
    fireEvent.click(await screen.findByRole('button', { name: /Ask SmartVideo/ }));
    // before any question: normal suggestions, no key prompt, Send works
    expect(screen.queryByTestId('help-needs-key')).toBeNull();
    expect(screen.getByRole('button', { name: /What can I do in this studio/ })).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Your question'), { target: { value: 'How do I generate an image?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect((await screen.findByTestId('help-needs-key')).textContent).toMatch(/Add your OpenAI key/);
    expect(screen.getByText('How do I generate an image?')).toBeTruthy(); // the question is kept
    fireEvent.click(screen.getByRole('button', { name: 'Open API keys' }));
    expect(onKey).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
  it('without a modal (academy pages) the add-key message links to the studio', async () => {
    fetchMock.mockImplementation(async (_u: string, init?: RequestInit) =>
      !init || init.method !== 'POST' ? new Response(JSON.stringify({ available: true, hasKey: false }), { status: 200 }) : new Response('{}', { status: 409 }));
    render(<HelpAgent />);
    fireEvent.click(await screen.findByRole('button', { name: /Ask SmartVideo/ }));
    fireEvent.click(screen.getByRole('button', { name: /What can I do in this studio/ }));
    expect((await screen.findByRole('link', { name: /add your key/ })).getAttribute('href')).toBe('/studio');
  });
  it('a rejected key (error event) shows the update-your-key message', async () => {
    fetchMock.mockImplementation(async (_u: string, init?: RequestInit) =>
      !init || init.method !== 'POST' ? new Response(JSON.stringify({ available: true, hasKey: true }), { status: 200 }) : sseResponse([['sources', sources], ['error', { code: 'OPENAI_KEY_INVALID', message: 'x' }]]));
    render(<HelpAgent onRequestApiKey={() => {}} />);
    fireEvent.click(await screen.findByRole('button', { name: /Ask SmartVideo/ }));
    fireEvent.click(screen.getByRole('button', { name: /What can I do in this studio/ }));
    expect((await screen.findByTestId('help-needs-key')).textContent).toMatch(/rejected/);
  });
  it('opens, asks, streams an answer with source links, and sends studio context', async () => {
    fetchMock.mockImplementation(async (_u: string, init?: RequestInit) => {
      if (!init || init.method !== 'POST') return new Response(JSON.stringify({ available: true }), { status: 200 });
      return sseResponse([['sources', sources], ['delta', { text: 'Register the endpoint ' }], ['delta', { text: 'in Stripe [S1].' }], ['done', { grounded: true }]]);
    });
    render(<HelpAgent studioId="apps" studioLabel="the Reseller Setup Walkthrough" />);
    fireEvent.click(await screen.findByRole('button', { name: /Ask SmartVideo/ }));
    expect(screen.getByRole('dialog')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Your question'), { target: { value: 'How do I set up the webhook?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await screen.findByText(/Register the endpoint in Stripe/);
    const inline = screen.getAllByRole('link').find((a) => a.getAttribute('href') === '/academy/reseller/launch?lesson=8.3');
    expect(inline).toBeTruthy();
    expect(screen.getByText('Sources')).toBeTruthy();
    expect(screen.getByRole('link', { name: /8\.3 — Create the webhook/ }).getAttribute('href')).toBe('/academy/reseller/launch?lesson=8.3');
    const post = fetchMock.mock.calls.find((c) => (c[1] as RequestInit | undefined)?.method === 'POST')!;
    const sent = JSON.parse((post[1] as RequestInit).body as string);
    expect(sent.studioId).toBe('apps');
    expect(sent.messages.at(-1)).toEqual({ role: 'user', content: 'How do I set up the webhook?' });
  });

  it('shows friendly errors (429) and closes with Escape', async () => {
    fetchMock.mockImplementation(async (_u: string, init?: RequestInit) =>
      !init || init.method !== 'POST' ? new Response(JSON.stringify({ available: true }), { status: 200 }) : new Response('{}', { status: 429 }));
    render(<HelpAgent />);
    fireEvent.click(await screen.findByRole('button', { name: /Ask SmartVideo/ }));
    fireEvent.click(screen.getByRole('button', { name: /What can I do in this studio/ }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/wait a moment/);
    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});
