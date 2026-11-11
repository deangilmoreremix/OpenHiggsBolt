import { describe, expect, it, vi } from 'vitest';
import {
  PLATFORM_SPECS, PLATFORM_ORDER, buildPublishPayload, isPublicMediaUrl, estimateCostUsd, describePublishError, type PlatformId,
} from '@/shared/api/socialPayloads';
import { publishOne, publishOrchestrator, type PublishDeps } from '@/shared/api/publishOrchestrator';

const URL_OK = 'https://cdn.muapi.ai/out/video.mp4';
const copy = { master: 'Master post #launch', title: 'My title', description: 'Long description', tags: '#ai, video', platforms: { instagram: { caption: 'IG caption' }, tiktok: { title: 'TT title' } } };
const build = (platform: PlatformId, over: any = {}) =>
  buildPublishPayload({ platform, accountId: '12', mediaUrl: URL_OK, mediaType: 'video', copy, ...over });

describe('media URLs', () => {
  it('accepts only public https', () => {
    expect(isPublicMediaUrl(URL_OK)).toBe(true);
    for (const u of ['blob:https://x/abc', 'data:image/png;base64,AAA', 'http://x.com/a.mp4', 'https://localhost/a', 'https://127.0.0.1/a', 'https://192.168.1.5/a', 'https://10.0.0.2/a', '', 'not a url']) expect(isPublicMediaUrl(u), u).toBe(false);
  });
});

describe('documented payloads (YouTube, Instagram, TikTok)', () => {
  it('YouTube: exact documented fields, tags cleaned, defaults per docs', () => {
    const { payload, errors } = build('youtube');
    expect(errors).toEqual([]);
    expect(payload).toEqual({ account_id: 12, media_url: URL_OK, title: 'My title', description: 'Long description', tags: ['ai', 'video'], privacy: 'public', category_id: '22', made_for_kids: false });
  });
  it('YouTube: requires a title (no more "Untitled") and enforces 100 chars', () => {
    expect(build('youtube', { copy: { master: 'x' } }).errors.join()).toMatch(/needs a title/);
    expect(build('youtube', { copy: { title: 'x'.repeat(101) } }).errors.join()).toMatch(/limit is 100/);
  });
  it('YouTube: privacy validated, kids flag honoured', () => {
    expect(build('youtube', { settings: { privacy: 'unlisted', made_for_kids: true } }).payload).toMatchObject({ privacy: 'unlisted', made_for_kids: true });
    expect(build('youtube', { settings: { privacy: 'weird' } }).payload).toMatchObject({ privacy: 'public' });
  });
  it('Instagram video: caption, VIDEO, placement reels, share_to_feed, cover_url from the thumbnail', () => {
    const { payload } = build('instagram', { thumbnailUrl: 'https://cdn.muapi.ai/t.png' });
    expect(payload).toEqual({ account_id: 12, media_url: URL_OK, caption: 'IG caption', media_type: 'VIDEO', placement: 'reels', share_to_feed: true, cover_url: 'https://cdn.muapi.ai/t.png' });
  });
  it('Instagram image: IMAGE, no reels-only fields', () => {
    const { payload } = build('instagram', { mediaType: 'image', mediaUrl: 'https://cdn.muapi.ai/a.png' });
    expect(payload).toEqual({ account_id: 12, media_url: 'https://cdn.muapi.ai/a.png', caption: 'IG caption', media_type: 'IMAGE' });
  });
  it('TikTok: title ≤150, privacy_level enum, toggles; video only', () => {
    expect(build('tiktok').payload).toEqual({ account_id: 12, media_url: URL_OK, title: 'TT title', privacy_level: 'PUBLIC_TO_EVERYONE', disable_comment: false, disable_duet: false, disable_stitch: false });
    expect(build('tiktok', { settings: { privacy_level: 'SELF_ONLY', disable_duet: true } }).payload).toMatchObject({ privacy_level: 'SELF_ONLY', disable_duet: true });
    expect(build('tiktok', { copy: { title: 'x'.repeat(151) } }).errors.join()).toMatch(/limit is 150/);
    expect(build('tiktok', { mediaType: 'image', mediaUrl: 'https://cdn.muapi.ai/a.png' }).errors.join()).toMatch(/does not accept images/);
  });
});

describe('basic payloads (platforms MuAPI documents only partially)', () => {
  it('send only account_id, media_url and the text/placement fields MuAPI names', () => {
    expect(build('facebook').payload).toEqual({ account_id: 12, media_url: URL_OK, caption: 'Master post #launch', placement: 'timeline' });
    expect(build('linkedin').payload).toEqual({ account_id: 12, media_url: URL_OK, caption: 'Master post #launch' });
    expect(build('threads').payload).toEqual({ account_id: 12, media_url: URL_OK, caption: 'Master post #launch' });
    expect(build('threads', { settings: { placement: 'reels' } }).payload).toMatchObject({ placement: 'reels' });
    expect(build('x').payload).toEqual({ account_id: 12, media_url: URL_OK, caption: 'Master post #launch' });
    expect(build('x', { settings: { reply_settings: 'followers_only' } }).payload).toMatchObject({ reply_settings: 'followers_only' });
    expect(build('pinterest', { settings: { board_id: 'b1', link: 'https://example.com' } }).payload).toEqual({ account_id: 12, media_url: URL_OK, title: 'My title', caption: 'Master post #launch', link: 'https://example.com', board_id: 'b1' });
  });
  it('X enforces 280 characters', () => {
    expect(build('x', { copy: { master: 'a'.repeat(281) } }).errors.join()).toMatch(/limit is 280/);
  });
  it('marks exactly the five partially-documented platforms as basic', () => {
    expect(PLATFORM_ORDER.filter((p) => PLATFORM_SPECS[p].confidence === 'basic')).toEqual(['facebook', 'linkedin', 'pinterest', 'threads', 'x']);
  });
  it('never sends undocumented fields (schedule, location, altText, tags on non-YouTube)', () => {
    for (const p of PLATFORM_ORDER) {
      const { payload } = build(p, { settings: { schedule: '2026-01-01T10:00', location: 'Paris', altText: 'x', tags: 'a,b', privacy: 'private' } });
      expect(Object.keys(payload || {}), p).not.toEqual(expect.arrayContaining(['schedule']));
      for (const k of ['schedule', 'location', 'altText']) expect(payload, p).not.toHaveProperty(k);
      if (p !== 'youtube') expect(payload, p).not.toHaveProperty('tags');
    }
  });
});

describe('validation', () => {
  it('blocks non-public media and missing accounts', () => {
    expect(build('youtube', { mediaUrl: 'blob:https://x/1' }).errors.join()).toMatch(/public https link/);
    expect(build('youtube', { accountId: '' }).errors.join()).toMatch(/Choose a connected YouTube account/);
  });
  it('estimates cost per publish from the platform list', () => {
    expect(estimateCostUsd(['youtube', 'instagram', 'x'])).toBe(0.05);
  });
  it('turns MuAPI errors into plain language without leaking keys', () => {
    expect(describePublishError({ response: { status: 409 } }, 'TikTok')).toMatch(/disconnected/);
    expect(describePublishError({ response: { status: 401 } })).toMatch(/API key/);
    expect(describePublishError({ response: { status: 402 } })).toMatch(/balance/);
    expect(describePublishError({ response: { status: 500, data: { detail: 'boom' } } }, 'X')).toContain('boom');
  });
});

const KEY = 'muapi-secret-key-123';
const dest = (platform: any, accountId = '5', enabled = true) => ({ id: `${platform}:${accountId}`, platform, accountId, enabled, settings: {} });
const asset = { type: 'video' as const, url: URL_OK };
function deps(over: Partial<PublishDeps> & { submit?: any } = {}): PublishDeps {
  const submit = over.submit ?? (async () => ({ request_id: 'req-1', status: 'processing' }));
  const fn = vi.fn(submit);
  return {
    publish: { youtube: fn, instagram: fn, tiktok: fn, facebook: fn, linkedin: fn, pinterest: fn, threads: fn, x: fn } as any,
    poll: over.poll ?? (async () => ({ status: 'completed', output: { platform: 'x', url: 'https://x.com/post/1' } })),
  };
}

describe('publishing orchestrator', () => {
  it('publishes the Write-step copy (not "Untitled") and reports the live URL', async () => {
    const d = deps();
    const r = await publishOne(dest('youtube') as any, asset, copy as any, undefined, KEY, d);
    expect(r).toMatchObject({ status: 'published', url: 'https://x.com/post/1', requestId: 'req-1' });
    const sent = (d.publish.youtube as any).mock.calls[0];
    expect(sent[0]).toBe(KEY);
    expect(sent[1].title).toBe('My title');
  });
  it('fails (and does not call MuAPI) when validation fails', async () => {
    const d = deps();
    const r = await publishOne(dest('youtube') as any, asset, { master: 'no title' } as any, undefined, KEY, d);
    expect(r.status).toBe('failed');
    expect(r.error).toMatch(/needs a title/);
    expect(d.publish.youtube).not.toHaveBeenCalled();
  });
  it('treats a response without request_id as NOT published', async () => {
    const r = await publishOne(dest('tiktok') as any, asset, copy as any, undefined, KEY, deps({ submit: async () => ({ message: 'ok?' }) }));
    expect(r.status).toBe('failed');
    expect(r.error).toMatch(/Nothing was published/);
  });
  it('accepts an immediate completed response', async () => {
    const r = await publishOne(dest('tiktok') as any, asset, copy as any, undefined, KEY, deps({ submit: async () => ({ status: 'completed', output: { url: 'https://tiktok.com/v/1' } }) }));
    expect(r).toMatchObject({ status: 'published', url: 'https://tiktok.com/v/1' });
  });
  it('maps 409 disconnected and platform failures to readable errors, never leaking the key', async () => {
    const r409 = await publishOne(dest('instagram') as any, asset, copy as any, undefined, KEY, deps({ submit: async () => { throw { response: { status: 409 } }; } }));
    expect(r409.error).toMatch(/disconnected/);
    const rFail = await publishOne(dest('instagram') as any, asset, copy as any, undefined, KEY, deps({ poll: async () => { throw new Error('The platform rejected the post.'); } }));
    expect(rFail).toMatchObject({ status: 'failed', requestId: 'req-1' });
    expect(JSON.stringify([r409, rFail])).not.toContain(KEY);
  });
  it('publishes sequentially, reports progress, and keeps going after a failure', async () => {
    let n = 0;
    const d = deps({ submit: async () => { n++; if (n === 2) throw { response: { status: 409 } }; return { request_id: `r${n}` }; } });
    const progress: string[][] = [];
    const out = await publishOrchestrator({
      destinations: [dest('youtube', '1'), dest('instagram', '2'), dest('x', '3'), dest('linkedin', '4', false)] as any,
      asset, copy: copy as any, apiKey: KEY, deps: d, onProgress: (r) => progress.push(r.map((x) => x.status)),
    });
    expect(out.map((r) => r.status)).toEqual(['published', 'failed', 'published']); // disabled destination skipped
    expect(progress[0]).toEqual(['queued', 'queued', 'queued']);
    expect(progress.some((p) => p.includes('processing'))).toBe(true);
    expect(progress[progress.length - 1]).toEqual(['published', 'failed', 'published']);
  });
  it('sends the generated thumbnail to Instagram as cover_url', async () => {
    const d = deps();
    await publishOne(dest('instagram') as any, asset, copy as any, { imageUrl: 'https://cdn.muapi.ai/thumb.png' }, KEY, d);
    expect((d.publish.instagram as any).mock.calls[0][1].cover_url).toBe('https://cdn.muapi.ai/thumb.png');
  });
});
