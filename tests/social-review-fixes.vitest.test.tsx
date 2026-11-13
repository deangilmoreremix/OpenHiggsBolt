// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { mergeCopy } from '@/components/social-publishing/mergeCopy';
import { buildPublishPayload } from '@/shared/api/socialPayloads';
import { publishOne, type PublishDeps } from '@/shared/api/publishOrchestrator';
import { WriteStep } from '@/components/social-publishing/steps/WriteStep';
import { SocialPublishProvider, useSocialPublish } from '@/components/SocialPublishProvider';

vi.mock('@/lib/muapi', () => ({
  listExternalSocialAccounts: vi.fn(async () => []), connectSocialAccount: vi.fn(), disconnectExternalSocialAccount: vi.fn(),
  publishToYouTube: vi.fn(), publishToInstagram: vi.fn(), publishToTikTok: vi.fn(), publishToFacebook: vi.fn(),
  publishToLinkedIn: vi.fn(), publishToPinterest: vi.fn(), publishToThreads: vi.fn(), publishToX: vi.fn(),
  pollSocialResult: vi.fn(), uploadPublishMedia: vi.fn(), setYouTubeThumbnail: vi.fn(),
}));

let modalProps: any = {};
vi.mock('@/components/SocialPublishModal', () => ({ default: (props: any) => { modalProps = props; return null; } }));

afterEach(cleanup);
const empty = { master: '', platforms: {}, variants: [] } as any;
const payloadFor = (platform: any, copy: any) => buildPublishPayload({ platform, accountId: 1, mediaUrl: 'https://cdn.muapi.ai/v.mp4', mediaType: 'video', copy }).payload as any;

describe('merged copy: what the learner edited wins', () => {
  it('a cleared title does not bring the studio title back', () => {
    const copy = mergeCopy({ ...empty, title: '', edited: { title: true }, platforms: { youtube: { title: '' } } }, { ...empty, title: 'Studio title', platforms: { youtube: { title: 'Studio YT' } } });
    expect(copy.title).toBe('');
    expect(copy.platforms.youtube.title).toBe('');
    expect(buildPublishPayload({ platform: 'youtube', accountId: 1, mediaUrl: 'https://cdn.muapi.ai/v.mp4', mediaType: 'video', copy }).errors.join(' ')).toMatch(/needs a title/);
  });
  it('an untouched title still falls back to the studio title', () => {
    expect(mergeCopy({ ...empty }, { ...empty, title: 'Studio title' }).title).toBe('Studio title');
  });
  it('an edited master beats the studio caption in the published payload', () => {
    const copy = mergeCopy({ ...empty, master: 'My edited post', edited: { master: true } }, { ...empty, caption: 'Studio caption' });
    expect(payloadFor('x', copy).caption).toBe('My edited post');
  });
  it('an unedited master leaves the studio caption in place', () => {
    const copy = mergeCopy({ ...empty, master: 'prefilled' }, { ...empty, caption: 'Studio caption' });
    expect(payloadFor('x', copy).caption).toBe('Studio caption');
  });
  it('an edited title beats the studio TikTok title', () => {
    const copy = mergeCopy({ ...empty, master: 'm', title: 'My edited title', edited: { title: true } }, { ...empty, tiktokTitle: 'Studio TikTok title' });
    expect(payloadFor('tiktok', copy).title).toBe('My edited title');
  });
});

describe('Write step: generated copy can be edited', () => {
  const asset = { type: 'video', url: 'https://cdn.muapi.ai/v.mp4' } as any;
  const generated = { ...empty, master: 'Generated post', title: 'Generated title', platforms: { youtube: { title: 'Generated title', description: 'Generated description' } }, variants: [{ id: 'v1', label: 'A', text: 'x' }] };

  it('editing the visible Title also changes the title YouTube publishes', () => {
    const updates: any[] = [];
    render(<WriteStep asset={asset} copy={generated} onUpdateCopy={(c: any) => updates.push(c)} />);
    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: 'My edited title' } });
    const last = updates.at(-1);
    expect(last.title).toBe('My edited title');
    expect(last.platforms.youtube.title).toBe('My edited title');
    expect(last.edited.title).toBe(true);
    expect(payloadFor('youtube', mergeCopy(last, empty)).title).toBe('My edited title');
  });

  it('editing the YouTube tab changes the description YouTube publishes', () => {
    const updates: any[] = [];
    render(<WriteStep asset={asset} copy={generated} onUpdateCopy={(c: any) => updates.push(c)} />);
    fireEvent.click(screen.getByRole('tab', { name: /youtube/i }));
    const box = screen.getByDisplayValue('Generated description');
    fireEvent.change(box, { target: { value: 'My edited description' } });
    const last = updates.at(-1);
    expect(last.platforms.youtube.description).toBe('My edited description');
    expect(payloadFor('youtube', mergeCopy(last, empty)).description).toBe('My edited description');
  });
});

describe('YouTube thumbnail follow-up runs on every success path', () => {
  const deps = (submit: any, set: any): PublishDeps => ({
    publish: new Proxy({}, { get: () => async () => submit }) as any,
    poll: async () => ({ status: 'completed', output: { video_id: 'vid1', url: 'https://youtube.com/watch?v=vid1' } }),
    setYouTubeThumbnail: set,
  } as any);
  const copy = { ...empty, master: 'm', title: 'T' } as any;
  const asset = { type: 'video', url: 'https://cdn.muapi.ai/v.mp4' } as any;
  it('an immediate completion (no request id) still sets the thumbnail', async () => {
    const set = vi.fn(async () => ({}));
    const r = await publishOne({ platform: 'youtube', accountId: '12', enabled: true, settings: {} } as any, asset, copy, { imageUrl: 'https://cdn.muapi.ai/t.jpg' }, 'key',
      deps({ status: 'completed', output: { video_id: 'vid1', url: 'https://youtube.com/watch?v=vid1' } }, set));
    expect(r.status).toBe('published');
    expect(set).toHaveBeenCalledWith('key', { account_id: 12, video_id: 'vid1', thumbnail_url: 'https://cdn.muapi.ai/t.jpg' });
  });
  it('an immediate completion whose thumbnail fails keeps a note', async () => {
    const set = vi.fn(async () => { throw new Error('nope'); });
    const r = await publishOne({ platform: 'youtube', accountId: '12', enabled: true, settings: {} } as any, asset, copy, { imageUrl: 'https://cdn.muapi.ai/t.jpg' }, 'key',
      deps({ status: 'completed', output: { video_id: 'vid1' } }, set));
    expect(r.status).toBe('published');
    expect(r.note).toMatch(/thumbnail could not be set/);
  });
});

describe('results from an older publishing session are ignored', () => {
  it('a late result for asset A never lands in asset B', () => {
    let seen: any = null;
    function Probe() { seen = useSocialPublish(); return null; }
    render(<SocialPublishProvider apiKey="k"><Probe /></SocialPublishProvider>);

    act(() => seen.openPublish({ mediaUrl: 'https://cdn.muapi.ai/a.mp4', mediaType: 'video', title: 'A' }));
    const sessionA = modalProps.sessionId;
    act(() => seen.openPublish({ mediaUrl: 'https://cdn.muapi.ai/b.mp4', mediaType: 'video', title: 'B' }));
    const sessionB = modalProps.sessionId;
    expect(sessionB).not.toBe(sessionA);
    expect(modalProps.publishResults).toEqual([]);

    // A's publish finishes late and reports under A's session: dropped
    act(() => modalProps.updatePublishResults([{ platform: 'youtube', accountId: '1', status: 'published', requestId: 'r-a' }], sessionA));
    expect(modalProps.publishResults).toEqual([]);

    // B's own results are applied
    act(() => modalProps.updatePublishResults([{ platform: 'youtube', accountId: '1', status: 'published', requestId: 'r-b' }], sessionB));
    expect(modalProps.publishResults).toHaveLength(1);
    expect(modalProps.publishResults[0].requestId).toBe('r-b');

    // callers that pass no session (existing behaviour) still work
    act(() => modalProps.updatePublishResults([]));
    expect(modalProps.publishResults).toEqual([]);
  });
});
