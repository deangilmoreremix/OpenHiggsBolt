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
  it('a post the platform rejected (terminal failure) drops the request id so it can be submitted again', async () => {
    const rejected = Object.assign(new Error('Generation failed: rejected by the platform'), { isFatal: true, isRejected: true });
    const r = await publishOne(dest('instagram') as any, asset, copy as any, undefined, KEY, deps({ poll: async () => { throw rejected; } }));
    expect(r.status).toBe('failed');
    expect(r.requestId).toBe('');
    expect(r.error).not.toMatch(/already sent/);
  });
  it('an inconclusive poll keeps the request id and says the post may still go live', async () => {
    const r = await publishOne(dest('instagram') as any, asset, copy as any, undefined, KEY, deps({ poll: async () => { throw new Error('network down'); } }));
    expect(r).toMatchObject({ status: 'failed', requestId: 'req-1' });
    expect(r.error).toMatch(/already sent/);
  });
  it('re-checks an accepted post without re-validating the copy, so invalid edits cannot cause a second post', async () => {
    const d = deps({ poll: async () => ({ status: 'completed', output: { url: 'https://youtube.com/watch?v=abc12345678' } }) });
    const r = await publishOne(dest('youtube') as any, asset, { master: 'no title' } as any, undefined, KEY, d, undefined, 'req-9');
    expect(r).toMatchObject({ status: 'published', requestId: 'req-9' });
    expect((d.publish as any).youtube).not.toHaveBeenCalled(); // never submitted again
  });
  it('keeps the accepted request id when a resumed check has no API key', async () => {
    const noKey = await publishOne(dest('youtube') as any, asset, copy as any, undefined, '', deps(), undefined, 'req-9');
    expect(noKey).toMatchObject({ status: 'failed', requestId: 'req-9' });
  });
  it('a first attempt with invalid copy fails without a request id (nothing was sent)', async () => {
    const r = await publishOne(dest('youtube') as any, asset, { master: 'no title' } as any, undefined, KEY, deps());
    expect(r).toMatchObject({ status: 'failed', requestId: '' });
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

describe('YouTube thumbnail (MuAPI youtube-set-thumbnail)', () => {
  const thumb = { imageUrl: 'https://cdn.muapi.ai/thumb.jpg' };
  const withThumb = (set: any, out: any = { url: 'https://www.youtube.com/watch?v=abc123XYZ_-' }) => {
    const d = deps({ poll: async () => ({ status: 'completed', output: out }) });
    d.setYouTubeThumbnail = set;
    return d;
  };
  it('sets the thumbnail on the published video using account_id, video_id, thumbnail_url', async () => {
    const set = vi.fn().mockResolvedValue({ request_id: 'th-1' });
    const r = await publishOne(dest('youtube', '12') as any, asset, copy as any, thumb, KEY, withThumb(set));
    expect(r.status).toBe('published');
    expect(set).toHaveBeenCalledWith(KEY, { account_id: 12, video_id: 'abc123XYZ_-', thumbnail_url: 'https://cdn.muapi.ai/thumb.jpg' });
    expect(r.note).toBe('Thumbnail set on YouTube.');
  });
  it('a thumbnail failure never fails the publish; it becomes a note', async () => {
    const set = vi.fn().mockRejectedValue({ response: { status: 403 } });
    const r = await publishOne(dest('youtube') as any, asset, copy as any, thumb, KEY, withThumb(set));
    expect(r.status).toBe('published');
    expect(r.note).toMatch(/thumbnail could not be set/);
  });
  it('explains when the video id is unknown or the image is not public, without calling MuAPI', async () => {
    const set = vi.fn();
    const noId = await publishOne(dest('youtube') as any, asset, copy as any, thumb, KEY, withThumb(set, { platform: 'youtube' }));
    expect(noId.note).toMatch(/video ID/);
    const local = await publishOne(dest('youtube') as any, asset, copy as any, { imageUrl: 'blob:http://x/1' }, KEY, withThumb(set));
    expect(local.note).toMatch(/not a public image link/);
    expect(set).not.toHaveBeenCalled();
  });
  it('does nothing for other platforms or when no thumbnail was made', async () => {
    const set = vi.fn();
    await publishOne(dest('x') as any, asset, copy as any, thumb, KEY, withThumb(set));
    await publishOne(dest('youtube') as any, asset, copy as any, undefined, KEY, withThumb(set));
    expect(set).not.toHaveBeenCalled();
  });
});

import { extractYouTubeVideoId } from '@/shared/api/publishOrchestrator';
describe('extractYouTubeVideoId', () => {
  it('reads watch, youtu.be, shorts urls and explicit ids', () => {
    expect(extractYouTubeVideoId({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })).toBe('dQw4w9WgXcQ');
    expect(extractYouTubeVideoId({ url: 'https://youtu.be/dQw4w9WgXcQ' })).toBe('dQw4w9WgXcQ');
    expect(extractYouTubeVideoId({ url: 'https://www.youtube.com/shorts/dQw4w9WgXcQ' })).toBe('dQw4w9WgXcQ');
    expect(extractYouTubeVideoId({ video_id: 'abc' })).toBe('abc');
    expect(extractYouTubeVideoId({ url: 'https://example.com/post/1' })).toBeNull();
    expect(extractYouTubeVideoId(null)).toBeNull();
  });
});
