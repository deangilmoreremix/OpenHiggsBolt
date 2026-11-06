// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';

const calls = [];
vi.mock('studio/src/muapi.js', () => ({
  generateImage: vi.fn(async (_k, p) => { calls.push(['image', p]); return { url: `https://cdn.example.com/img-${calls.length}.png` }; }),
  generateI2V: vi.fn(async (_k, p) => { calls.push(['clip', p]); return { url: `https://cdn.example.com/clip-${calls.length}.mp4` }; }),
  uploadFile: vi.fn(async () => 'https://muapi.example.com/uploaded-cut.mp4'),
  generateCaptions: vi.fn(async (_k, p) => { calls.push(['captions', p]); return { url: 'https://cdn.example.com/captioned.mp4' }; }),
  generateAudio: vi.fn(async (_k, p) => { calls.push(['audio', p]); return { url: `https://cdn.example.com/aud-${calls.length}.mp3` }; }),
}));
const renderFinalCut = vi.fn(async () => ({ ok: true, blob: new Blob(['x'], { type: 'video/mp4' }), extension: 'mp4', warning: null }));
vi.mock('../finalCut.js', () => ({ renderFinalCut: (...a) => renderFinalCut(...a) }));

const ZackD = (await import('../ZackD.jsx')).default;

const click = (name) => fireEvent.click(screen.getByRole('button', { name }));

describe('ZackD studio', () => {
  beforeEach(() => { cleanup(); localStorage.clear(); calls.length = 0; renderFinalCut.mockClear(); vi.spyOn(window, 'confirm').mockReturnValue(true); URL.createObjectURL = vi.fn(() => 'blob:x'); URL.revokeObjectURL = vi.fn(); });
  afterEach(() => vi.restoreAllMocks());

  it('walks topic -> script -> visuals -> clips -> audio -> final cut', async () => {
    render(<ZackD apiKey="mu_test_key_0123456789" />);
    expect(screen.getByRole('button', { name: /Write starter script/ }).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('TOPIC'), { target: { value: 'Why do ears pop?' } });
    click(/Write starter script/);
    // Gate 1: the narration is editable and used downstream
    fireEvent.change(screen.getByLabelText('Narration, beat 1'), { target: { value: 'Edited hook?' } });
    click('Approve script');
    click(/Generate 2 character sheet/);
    await waitFor(() => expect(calls.filter(([k, p]) => k === 'image' && p.aspect_ratio === '16:9')).toHaveLength(2));
    expect(screen.getByRole('button', { name: 'Approve keyframes' }).disabled).toBe(true);
    click(/Generate 5 keyframe/);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Approve keyframes' }).disabled).toBe(false));
    const kf = calls.filter(([k, p]) => k === 'image' && p.aspect_ratio === '9:16');
    expect(kf).toHaveLength(5);
    expect(kf[0][1].prompt).toContain('Friendly stylized 3D character'); // character anchor reaches the keyframe prompt
    click('Approve keyframes');
    click(/Generate 5 clip/);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Continue to audio' }).disabled).toBe(false));
    const clips = calls.filter(([k]) => k === 'clip');
    expect(clips).toHaveLength(5);
    expect(clips.every(([, p]) => p.image_url.startsWith('https://cdn.example.com/img-') && p.model === 'veo3.1-fast-image-to-video')).toBe(true);
    click('Continue to audio');
    click('Generate narration');
    await waitFor(() => expect(calls.some(([k, p]) => k === 'audio' && p._modelId === 'minimax-speech-2.6-turbo')).toBe(true));
    expect(calls.find(([k]) => k === 'audio')[1].text).toMatch(/^Edited hook\?/);
    click('Continue to final cut');
    click('Render video');
    await waitFor(() => expect(renderFinalCut).toHaveBeenCalled());
    const arg = renderFinalCut.mock.calls[0][0];
    expect(arg.shots).toHaveLength(5);
    expect(arg.shots[1]).toMatchObject({ duration: 3, zoom: true });
    expect(arg.narrationUrl).toMatch(/aud-/);
    await waitFor(() => expect(screen.getByRole('button', { name: /Download video/ })).toBeTruthy());
  });

  it('burns captions on demand after the final cut, gated on narration and a cost confirmation', async () => {
    const muapi = await import('studio/src/muapi.js');
    render(<ZackD apiKey="mu_test_key_0123456789" />);
    fireEvent.change(screen.getByLabelText('TOPIC'), { target: { value: 'Gum' } });
    click(/Write starter script/); click('Approve script');
    click(/Generate 2 character sheet/);
    await waitFor(() => expect(calls.filter(([k]) => k === 'image')).toHaveLength(2));
    click(/Generate 5 keyframe/);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Approve keyframes' }).disabled).toBe(false));
    click('Approve keyframes'); click(/Generate 5 clip/);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Continue to audio' }).disabled).toBe(false));
    click('Continue to audio'); click('Continue to final cut'); // skip narration on purpose
    click('Render video');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Burn captions' })).toBeTruthy());
    expect(screen.getByRole('button', { name: 'Burn captions' }).disabled).toBe(true); // no narration
    expect(screen.getByText(/Generate narration first/)).toBeTruthy();

    // add narration, come back to the final cut
    click('Back'); click('Generate narration');
    await waitFor(() => expect(calls.some(([k, p]) => k === 'audio' && p._modelId === 'minimax-speech-2.6-turbo')).toBe(true));
    click('Continue to final cut'); click('Re-render');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Burn captions' }).disabled).toBe(false));
    fireEvent.change(screen.getByLabelText('Caption language'), { target: { value: 'Spanish (Mexico)' } });
    fireEvent.click(screen.getByRole('button', { name: 'Beast' }));
    window.confirm.mockReturnValueOnce(false);
    click('Burn captions');
    expect(muapi.uploadFile).not.toHaveBeenCalled(); // declined the cost prompt: nothing uploaded or charged
    click('Burn captions');
    await waitFor(() => expect(muapi.generateCaptions).toHaveBeenCalled());
    expect(muapi.uploadFile).toHaveBeenCalledTimes(1);
    expect(muapi.generateCaptions.mock.calls[0][1]).toEqual({ video_url: 'https://muapi.example.com/uploaded-cut.mp4', language: 'Spanish (Mexico)', theme: 'Beast' });
    await waitFor(() => expect(screen.getByRole('link', { name: /captioned video/ }).getAttribute('href')).toBe('https://cdn.example.com/captioned.mp4'));
  });

  it('shows placeholder/sandbox output as an error instead of media', async () => {
    const muapi = await import('studio/src/muapi.js');
    muapi.generateImage.mockResolvedValue({ url: 'https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/nano-banana-2.0.avif' });
    render(<ZackD apiKey="mu_test_key_0123456789" />);
    fireEvent.change(screen.getByLabelText('TOPIC'), { target: { value: 'Gum' } });
    click(/Write starter script/); click('Approve script');
    click(/Generate 2 character sheet/);
    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/placeholder/));
    expect(document.querySelector('img')).toBeNull();
  });

  it('asks for a key when none is set and seeds the topic from a template hand-off', () => {
    render(<ZackD apiKey="" templateData={{ prompt: 'Brain freeze' }} />);
    expect(screen.getByLabelText('TOPIC').value).toBe('Brain freeze');
    expect(screen.getByText(/Add your MuAPI key in Settings/)).toBeTruthy();
  });

  it('a finished template reaches the final cut with no generation calls', async () => {
    const muapi = await import('studio/src/muapi.js');
    render(<ZackD apiKey="mu_test_key_0123456789" />);
    expect(screen.getByText(/Sample from the upstream open-source Zack D project/)).toBeTruthy();
    click('Use as template');
    expect(screen.getByLabelText('Narration, beat 1').value).toMatch(/Swallow Gum/);
    click('Approve script');
    click('Approve keyframes'); // the template brought its keyframes
    click('Continue to audio'); click('Continue to final cut');
    click('Render video');
    await waitFor(() => expect(renderFinalCut).toHaveBeenCalled());
    const arg = renderFinalCut.mock.calls.at(-1)[0];
    expect(arg.shots).toHaveLength(5);
    expect(arg.shots.every((s) => /\/zackd\/templates\/swallow-gum\/clips\/beat_/.test(s.src))).toBe(true);
    expect(calls).toHaveLength(0);
    expect(muapi.generateImage).not.toHaveBeenCalled();
  });
});
