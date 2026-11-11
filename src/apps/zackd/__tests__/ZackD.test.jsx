// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen, fireEvent, cleanup, waitFor, within } from '@testing-library/react';
import { promptControlClassName } from 'studio/src/components/prompt/PromptComposer';

// react-hot-toast reads matchMedia; jsdom has none.
if (!window.matchMedia) window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });

const calls = [];
const rec = (kind) => vi.fn(async (_k, p) => { calls.push([kind, p]); p.onRequestId?.(`req_${calls.length}`); return { url: `https://cdn.example.com/${kind}-${calls.length}.${kind === 'clip' ? 'mp4' : kind === 'audio' ? 'mp3' : 'png'}` }; });
vi.mock('studio/src/muapi.js', () => ({
  generateImage: rec('image'), generateI2V: rec('clip'), generateAudio: rec('audio'),
  generateCaptions: vi.fn(async (_k, p) => { calls.push(['captions', p]); return { url: 'https://cdn.example.com/captioned.mp4' }; }),
  uploadFile: vi.fn(async () => 'https://muapi.example.com/uploaded-cut.mp4'),
  resumeGeneration: vi.fn(async () => ({ url: 'https://cdn.example.com/resumed.png' })),
}));
const openPublish = vi.fn();
vi.mock('@/components/SocialPublishProvider', () => ({
  useSocialPublish: () => ({ openPublish: (...a) => openPublish(...a), closePublish: () => {}, openSocialPublisher: () => {} }),
  PublishStep: ({ mediaUrl }) => (mediaUrl ? <button type="button" onClick={() => openPublish({ mediaUrl })}>Post captioned to social</button> : null),
}));
const renderFinalCut = vi.fn(async () => ({ ok: true, blob: new Blob(['x'], { type: 'video/mp4' }), extension: 'mp4', warning: null }));
vi.mock('../finalCut.js', () => ({ renderFinalCut: (...a) => renderFinalCut(...a) }));

const ZackD = (await import('../ZackD.jsx')).default;
const muapi = await import('studio/src/muapi.js');
const KEY = 'mu_test_key_0123456789';

const action = (container) => container.querySelector('button[data-step]');
async function step(container, label) { await waitFor(() => { expect(action(container).textContent).toContain(label); expect(action(container).disabled).toBe(false); }, { timeout: 4000 }); }
const type = (v) => fireEvent.change(screen.getByLabelText('Topic'), { target: { value: v } });
const callbacks = () => ({ onGenerationStart: vi.fn(), onGenerationEnd: vi.fn(), onGenerationComplete: vi.fn(), onGenerationError: vi.fn() });

describe('ZackD studio (built like the video studios)', () => {
  beforeEach(() => {
    cleanup(); localStorage.clear(); calls.length = 0; renderFinalCut.mockClear();
    vi.mocked(muapi.generateImage).mockClear(); vi.mocked(muapi.uploadFile).mockClear();
    vi.spyOn(window, 'confirm').mockReturnValue(true); URL.createObjectURL = vi.fn(() => 'blob:x'); URL.revokeObjectURL = vi.fn();
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('has the same shell as VideoStudio: root, gallery scroller, shared 38px controls, PromptComposer + PromptAction', () => {
    const src = readFileSync(resolve(process.cwd(), 'packages/studio/src/components/VideoStudio.jsx'), 'utf8');
    const rootClass = src.match(/className="(w-full h-full flex flex-col items-center justify-center bg-app-bg relative overflow-hidden)"/)[1];
    const scrollerClass = src.match(/className="(flex-1 w-full max-w-7xl mx-auto overflow-y-auto custom-scrollbar pb-40 lg:pb-32 px-2)"/)[1];
    const { container } = render(<ZackD apiKey={KEY} />);
    expect(container.firstElementChild.className).toBe(rootClass);
    expect(container.querySelector(`div[class="${scrollerClass}"]`)).toBeTruthy();
    // the empty-state hero reads like the Video Studio's
    expect(screen.getByText('Start creating with')).toBeTruthy();
    expect(screen.getByText('Zack D Studio').className).toContain('text-[#22d3ee]');
    // controls use the shared contract (idle state), and the action is the shared PromptAction
    expect(container.querySelector('#z-templates-btn').className).toBe(promptControlClassName({ active: false }));
    expect(container.querySelector('#z-look-btn').className).toBe(promptControlClassName({ active: false }));
    expect(container.querySelector('textarea[data-studio-prompt]')).toBeTruthy();
    expect(action(container).className).toContain('rounded'); // PromptAction's primary button
    for (const id of ['z-look-btn', 'z-voice-btn', 'z-ar-btn', 'z-templates-btn', 'z-advanced-btn']) expect(container.querySelector(`#${id}`), id).toBeTruthy();
  });

  it('runs topic -> script gate -> sheets -> keyframes -> clips -> final cut with one action button and cost confirms', async () => {
    const cb = callbacks();
    const { container } = render(<ZackD apiKey={KEY} {...cb} />);
    expect(action(container).textContent).toContain('Write script');
    expect(action(container).disabled).toBe(true); // nothing typed yet
    type('Why do ears pop?');
    await step(container, 'Write script'); fireEvent.click(action(container));
    await step(container, 'Approve script');
    const nar = await screen.findByLabelText('Narration, beat 1');
    fireEvent.change(nar, { target: { value: 'Edited hook?' } });
    fireEvent.click(action(container)); // approving starts the character sheets (after the cost confirm)
    await step(container, 'Generate 5 keyframes');
    expect(calls.filter(([k, p]) => k === 'image' && p.aspect_ratio === '16:9')).toHaveLength(2);
    fireEvent.click(action(container));
    await step(container, 'Animate 5 clips');
    const kf = calls.filter(([k, p]) => k === 'image' && p.aspect_ratio === '9:16');
    expect(kf).toHaveLength(5);
    expect(kf[0][1].prompt).toContain('Anchored on character sheet refs: main_character'); // upstream's anchor sentence
    expect(kf[0][1].prompt.startsWith('Stylized 3D render, Zack D Films visual aesthetic')).toBe(true);
    fireEvent.click(action(container));
    await step(container, 'Render final cut');
    const clips = calls.filter(([k]) => k === 'clip');
    expect(clips).toHaveLength(5);
    expect(clips.every(([, p]) => p.image_url.includes('cdn.example.com/image') && p.model === 'veo3.1-fast-image-to-video' && p.prompt.startsWith('Smooth 3D animation, camera movement '))).toBe(true);
    expect(window.confirm).toHaveBeenCalledTimes(3);
    fireEvent.click(action(container));
    await waitFor(() => expect(renderFinalCut).toHaveBeenCalled());
    const arg = renderFinalCut.mock.calls[0][0];
    expect(arg.shots).toHaveLength(5);
    expect(arg.shots[1]).toMatchObject({ planned: 3, zoom: true });
    expect(arg).toMatchObject({ keepClipAudio: true, mixVoice: false, trimToPlanned: false }); // upstream defaults
    await screen.findByText('Download video');
    // the shell contract: start/end around every run, complete for the final cut
    expect(cb.onGenerationStart).toHaveBeenCalledTimes(4);
    expect(cb.onGenerationEnd).toHaveBeenCalledTimes(4);
    expect(cb.onGenerationComplete).toHaveBeenCalledWith(expect.objectContaining({ type: 'video', url: 'blob:x' }));
  });

  it('a finished template jumps to a final cut with no generation calls, upstream defaults on', async () => {
    const { container } = render(<ZackD apiKey={KEY} />);
    expect(screen.getByText(/Sample from the upstream open-source Zack D project/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Try the demo project' }));
    expect((await screen.findByLabelText('Narration, beat 1')).value).toMatch(/Swallow Gum/);
    expect(screen.getByText(/Template loaded: Swallow gum: finished demo/)).toBeTruthy();
    await step(container, 'Render final cut');
    fireEvent.click(action(container));
    await waitFor(() => expect(renderFinalCut).toHaveBeenCalled());
    const arg = renderFinalCut.mock.calls[0][0];
    expect(arg.shots).toHaveLength(5);
    expect(arg.shots.every((s) => /\/zackd\/templates\/swallow-gum\/clips\/beat_/.test(s.src))).toBe(true);
    expect(arg).toMatchObject({ keepClipAudio: true, mixVoice: false, trimToPlanned: false });
    expect(calls).toHaveLength(0);
    expect(muapi.generateImage).not.toHaveBeenCalled();
  });

  it('extras live in Advanced: off by default, and a generated voice switches mixing on', async () => {
    const { container } = render(<ZackD apiKey={KEY} />);
    fireEvent.click(screen.getByRole('button', { name: 'Try the demo project' }));
    await step(container, 'Render final cut');
    fireEvent.click(container.querySelector('#z-advanced-btn'));
    expect(document.getElementById('zackd-keep-clip-audio').checked).toBe(true);
    for (const id of ['zackd-mix-voice', 'zackd-trim-planned', 'zackd-boost']) expect(document.getElementById(id).checked, id).toBe(false);
    fireEvent.click(document.getElementById('zackd-trim-planned'));
    fireEvent.click(screen.getByRole('button', { name: 'Generate narration' }));
    await waitFor(() => expect(container.querySelector('audio')).toBeTruthy());
    fireEvent.click(container.querySelector('#z-advanced-btn')); // clicking outside closed the popover; reopen it
    expect(document.getElementById('zackd-mix-voice').checked).toBe(true);
    expect(document.getElementById('zackd-trim-planned').checked).toBe(true); // the earlier choice survived
    fireEvent.click(container.querySelector('#z-advanced-btn'));
    await step(container, 'Render final cut'); fireEvent.click(action(container));
    await waitFor(() => expect(renderFinalCut).toHaveBeenCalled());
    expect(renderFinalCut.mock.calls[0][0]).toMatchObject({ mixVoice: true, trimToPlanned: true, narrationUrl: expect.stringContaining('cdn.example.com/audio') });
  });

  it('uploads the in-browser final cut and opens the publish modal (kept from main)', async () => {
    const { container } = render(<ZackD apiKey={KEY} />);
    fireEvent.click(screen.getByRole('button', { name: 'Try the demo project' }));
    await step(container, 'Render final cut'); fireEvent.click(action(container));
    const post = await screen.findByRole('button', { name: 'Post to social' });
    fireEvent.click(post);
    await waitFor(() => expect(openPublish).toHaveBeenCalledWith(expect.objectContaining({ mediaUrl: 'https://muapi.example.com/uploaded-cut.mp4', mediaType: 'video', title: expect.stringMatching(/Swallow Gum/) })));
    expect(muapi.uploadFile).toHaveBeenCalledTimes(1);
  });

  it('keeps keyframe redo available on an animated shot and passes real clip lengths to the .srt', async () => {
    renderFinalCut.mockResolvedValueOnce({ ok: true, blob: new Blob(['x'], { type: 'video/mp4' }), extension: 'mp4', warning: null, durations: [8, 8, 8, 8, 8] });
    const { container } = render(<ZackD apiKey={KEY} />);
    fireEvent.click(screen.getByRole('button', { name: 'Try the demo project' }));
    await step(container, 'Render final cut');
    const clipCard = container.querySelector('[data-result-card="clip:beat_1_a"]');
    expect(within(clipCard).getByRole('button', { name: /Redo keyframe/ })).toBeTruthy();
    fireEvent.click(action(container));
    await screen.findByRole('button', { name: 'Post to social' });
    const created = []; const orig = URL.createObjectURL; URL.createObjectURL = (b) => { created.push(b); return 'blob:x'; };
    fireEvent.click(screen.getByRole('button', { name: /Captions \(\.srt\)/ }));
    URL.createObjectURL = orig;
    const text = await created.at(-1).text();
    expect(text).toMatch(/00:00:\d\d,\d{3} --> 00:00:(1\d|2\d),/); // spans the 8 s clips, not the 3 s plan
  });

  it('burns captions on demand: gated on narration, confirms cost, uploads the cut, shows the result, adds history', async () => {
    const cb = callbacks();
    const { container } = render(<ZackD apiKey={KEY} {...cb} />);
    fireEvent.click(screen.getByRole('button', { name: 'Try the demo project' }));
    await step(container, 'Render final cut'); fireEvent.click(action(container));
    const burn = await screen.findByRole('button', { name: 'Burn captions' });
    expect(burn.disabled).toBe(true); // no narration yet
    fireEvent.click(screen.getByRole('button', { name: 'Generate narration' }));
    await waitFor(() => expect(container.querySelector('audio')).toBeTruthy());
    // narration made after the render is not in the cut: burning would transcribe the clips' own sound, so re-render first
    expect(screen.getByRole('button', { name: 'Burn captions' }).disabled).toBe(true);
    expect(screen.getByText(/This cut does not contain the narration/)).toBeTruthy();
    await step(container, 'Render again'); fireEvent.click(action(container));
    await waitFor(() => expect(renderFinalCut.mock.calls.at(-1)[0]).toMatchObject({ mixVoice: true }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Burn captions' }).disabled).toBe(false));
    fireEvent.change(screen.getByLabelText('Caption language'), { target: { value: 'Spanish (Mexico)' } });
    fireEvent.click(screen.getByRole('button', { name: 'Beast' }));
    window.confirm.mockReturnValueOnce(false);
    fireEvent.click(screen.getByRole('button', { name: 'Burn captions' }));
    expect(muapi.uploadFile).not.toHaveBeenCalled(); // declined the cost prompt: nothing uploaded or charged
    fireEvent.click(screen.getByRole('button', { name: 'Burn captions' }));
    await waitFor(() => expect(muapi.generateCaptions).toHaveBeenCalled());
    expect(muapi.uploadFile).toHaveBeenCalledTimes(1);
    expect(muapi.generateCaptions.mock.calls[0][1]).toEqual({ video_url: 'https://muapi.example.com/uploaded-cut.mp4', language: 'Spanish (Mexico)', theme: 'Beast' });
    await waitFor(() => expect(screen.getByRole('link', { name: /captioned video/ }).getAttribute('href')).toBe('https://cdn.example.com/captioned.mp4'));
    expect(screen.getByText('History')).toBeTruthy();
    expect(cb.onGenerationComplete).toHaveBeenCalledWith(expect.objectContaining({ model: 'ai-captions' }));
  });

  it('a failed batch reports one clean toast (and the shell callback) and keeps Redo available', async () => {
    const cb = callbacks();
    const { container } = render(<ZackD apiKey={KEY} {...cb} />);
    type('Gum'); await step(container, 'Write script'); fireEvent.click(action(container));
    await step(container, 'Approve script');
    // sheet A fails on both models (nano-banana-2, then the flux fallback); sheet B succeeds on the first
    const err = new Error('The generation failed. Try again.');
    vi.mocked(muapi.generateImage).mockRejectedValueOnce(err).mockResolvedValueOnce({ url: 'https://cdn.example.com/ok.png' }).mockRejectedValueOnce(err);
    fireEvent.click(action(container));
    await waitFor(() => expect(cb.onGenerationError).toHaveBeenCalled());
    const msg = cb.onGenerationError.mock.calls[0][0];
    expect(msg).toBe('1 of 2 failed: The generation failed. Try again. Use Redo to retry them.');
    expect(msg).not.toMatch(/\.\./);
    expect(await screen.findByText(msg)).toBeTruthy();
    await step(container, 'Generate 1 character sheet'); // the failed sheet is retried from the same button
    expect([...container.querySelectorAll('button[aria-label]')].some((b) => /^(Generate|Redo) (main character|anatomy cutaway):/.test(b.getAttribute('aria-label')))).toBe(true); // per-card Redo
  });

  it('shows placeholder/sandbox output as an error instead of media', async () => {
    vi.mocked(muapi.generateImage).mockResolvedValue({ url: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/nano-banana-2.0.avif' });
    const cb = callbacks();
    const { container } = render(<ZackD apiKey={KEY} {...cb} />);
    type('Gum'); await step(container, 'Write script'); fireEvent.click(action(container));
    await step(container, 'Approve script'); fireEvent.click(action(container));
    await waitFor(() => expect(cb.onGenerationError).toHaveBeenCalled());
    expect(cb.onGenerationError.mock.calls[0][0]).toMatch(/placeholder/);
    expect(container.querySelector('img[src*="cloudfront"]')).toBeNull();
  });

  it('needs a MuAPI key for paid steps (action disabled with a notice) but not for the script', async () => {
    const { container } = render(<ZackD apiKey="" />);
    type('Gum'); await step(container, 'Write script'); fireEvent.click(action(container));
    await step(container, 'Approve script').catch(() => {});
    expect(action(container).disabled).toBe(true);
    expect(screen.getByText(/Add your MuAPI key in Settings/)).toBeTruthy();
  });

  it('survives a corrupt pending-jobs record and acknowledges dropped files', async () => {
    const { scopedPersistKey } = await import('studio/src/persistKey.js');
    localStorage.setItem(scopedPersistKey('zackd_pending_v1', KEY), '{"not":"an array"}');
    const handled = vi.fn();
    const files = [new File(['x'], 'a.png', { type: 'image/png' })];
    const { container } = render(<ZackD apiKey={KEY} droppedFiles={files} onFilesHandled={handled} />);
    await waitFor(() => expect(handled).toHaveBeenCalled());
    type('What happens when you swallow gum?');
    await step(container, 'Write script'); // renders and is usable: the bad record did not break the resume effect
  });

  it('lets you rewrite an unapproved script after changing the topic', async () => {
    const { container } = render(<ZackD apiKey={KEY} />);
    type('First question');
    await step(container, 'Write script'); fireEvent.click(action(container));
    await screen.findByLabelText('Narration, beat 1');
    expect(screen.getByLabelText('Narration, beat 1').value).toMatch(/First question/);
    type('A different question');
    fireEvent.click(screen.getByRole('button', { name: 'Rewrite script' }));
    await waitFor(() => expect(screen.getByLabelText('Narration, beat 1').value).toMatch(/A different question/));
    await step(container, 'Approve script'); fireEvent.click(action(container));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Rewrite script' })).toBeNull()); // gone once approved
  });

  it('keeps a timed-out request recoverable, and blocks a second request for a slot that is still recovering', async () => {
    const { scopedPersistKey } = await import('studio/src/persistKey.js');
    const key = scopedPersistKey('zackd_pending_v1', KEY);
    // a clip request from an earlier visit is still running at the provider
    localStorage.setItem(key, JSON.stringify([{ rid: 'req_old', slot: 'clip', id: 'beat_1_a', ts: Date.now() }]));
    vi.mocked(muapi.resumeGeneration).mockImplementationOnce(() => new Promise(() => {})); // never settles during the test
    const { container } = render(<ZackD apiKey={KEY} />);
    fireEvent.click(screen.getByRole('button', { name: 'Try the demo project' }));
    await waitFor(() => expect(container.querySelector('[data-result-card="clip:beat_1_a"]')).toBeTruthy());
    const card = container.querySelector('[data-result-card="clip:beat_1_a"]');
    const redo = within(card).getAllByRole('button').filter((b) => /^(Redo|Generate)\b/.test(b.getAttribute('aria-label') || ''));
    expect(redo.length).toBeGreaterThan(0);
    redo.forEach((b) => expect(b.disabled).toBe(true));
    expect(action(container).disabled).toBe(true);
  });

  it('drops a generated voice-over when the narration text it was made from is edited', async () => {
    const { container } = render(<ZackD apiKey={KEY} />);
    fireEvent.click(screen.getByRole('button', { name: 'Try the demo project' }));
    await screen.findByLabelText('Narration, beat 1');
    fireEvent.click(screen.getByRole('button', { name: 'Generate narration' }));
    await waitFor(() => expect(container.querySelector('audio')).toBeTruthy());
    fireEvent.change(screen.getByLabelText('Narration, beat 1'), { target: { value: 'A corrected sentence.' } });
    await waitFor(() => expect(container.querySelector('audio')).toBeNull());
    expect(screen.getByRole('button', { name: 'Generate narration' })).toBeTruthy(); // regenerate offered again
  });

  it('locks the narration text while its voice-over is still being recovered, so old audio cannot land under new text', async () => {
    const { scopedPersistKey } = await import('studio/src/persistKey.js');
    localStorage.setItem(scopedPersistKey('zackd_pending_v1', KEY), JSON.stringify([{ rid: 'req_nar', slot: 'narration', id: 'narration', ts: Date.now() }]));
    vi.mocked(muapi.resumeGeneration).mockImplementationOnce(() => new Promise(() => {}));
    render(<ZackD apiKey={KEY} />);
    fireEvent.click(screen.getByRole('button', { name: 'Try the demo project' }));
    const nar = await screen.findByLabelText('Narration, beat 1');
    await waitFor(() => expect(nar.disabled).toBe(true));
  });

  it('does not offer clip regeneration while that shot\'s keyframe is still being recovered', async () => {
    const { scopedPersistKey } = await import('studio/src/persistKey.js');
    localStorage.setItem(scopedPersistKey('zackd_pending_v1', KEY), JSON.stringify([{ rid: 'req_kf', slot: 'keyframe', id: 'beat_1_a', ts: Date.now() }]));
    vi.mocked(muapi.resumeGeneration).mockImplementationOnce(() => new Promise(() => {}));
    const { container } = render(<ZackD apiKey={KEY} />);
    fireEvent.click(screen.getByRole('button', { name: 'Try the demo project' }));
    await waitFor(() => expect(container.querySelector('[data-result-card="clip:beat_1_a"]')).toBeTruthy());
    const card = container.querySelector('[data-result-card="clip:beat_1_a"]');
    const redo = within(card).getAllByRole('button').filter((b) => /^(Redo|Generate)\b/.test(b.getAttribute('aria-label') || ''));
    expect(redo.length).toBeGreaterThan(0);
    redo.forEach((b) => expect(b.disabled).toBe(true));
  });

  it('a recovered job from an earlier project stops locking the pipeline once another template replaces that project', async () => {
    const { scopedPersistKey } = await import('studio/src/persistKey.js');
    // a job recorded for a project that is not the one that will be shown
    localStorage.setItem(scopedPersistKey('zackd_pending_v1', KEY), JSON.stringify([{ rid: 'req_old', slot: 'clip', id: 'beat_1_a', pid: 'an-older-project', ts: Date.now() }]));
    vi.mocked(muapi.resumeGeneration).mockImplementationOnce(() => new Promise(() => {}));
    const { container } = render(<ZackD apiKey={KEY} />);
    expect(action(container).disabled).toBe(true); // locked while the recovery is pending
    fireEvent.click(screen.getByRole('button', { name: 'Try the demo project' }));
    await waitFor(() => expect(container.querySelector('[data-result-card="clip:beat_1_a"]')).toBeTruthy());
    await waitFor(() => expect(action(container).disabled).toBe(false)); // the new project is free to continue
    const card = container.querySelector('[data-result-card="clip:beat_1_a"]');
    const redo = within(card).getAllByRole('button').filter((b) => /^(Redo|Generate)\b/.test(b.getAttribute('aria-label') || ''));
    redo.forEach((b) => expect(b.disabled).toBe(false));
  });

  it('locks the shown project only for recovered jobs that belong to it', async () => {
    const { scopedPersistKey } = await import('studio/src/persistKey.js');
    const seed = (jobPid) => {
      localStorage.clear();
      localStorage.setItem(scopedPersistKey('zackd_project_v1', KEY), JSON.stringify({ pid: 'shown-project', topic: 'A topic' }));
      localStorage.setItem(scopedPersistKey('zackd_pending_v1', KEY), JSON.stringify([{ rid: 'req_x', slot: 'clip', id: 'beat_1_a', pid: jobPid, ts: Date.now() }]));
      vi.mocked(muapi.resumeGeneration).mockImplementationOnce(() => new Promise(() => {}));
    };
    // the job belongs to the shown project: its action waits for it
    seed('shown-project');
    const first = render(<ZackD apiKey={KEY} />);
    await waitFor(() => expect(first.container.querySelector('button[data-step]')).toBeTruthy());
    await waitFor(() => expect(first.container.querySelector('button[data-step]').disabled).toBe(true));
    first.unmount(); cleanup();
    // the job belongs to another project: it keeps polling but does not lock this one
    seed('another-project');
    const second = render(<ZackD apiKey={KEY} />);
    await step(second.container, 'Write script');
    expect(second.container.querySelector('button[data-step]').disabled).toBe(false);
  });
});
