// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';

const mocks = vi.hoisted(() => ({
  pub: vi.fn(),
  poll: vi.fn(),
  upload: vi.fn(),
  list: vi.fn(),
  thumb: vi.fn(),
}));
vi.mock('@/lib/muapi', () => {
  const p = (platform: string) => (key: string, payload: any) => mocks.pub(platform, key, payload);
  return {
    listExternalSocialAccounts: (...a: unknown[]) => mocks.list(...a),
    connectSocialAccount: vi.fn(),
    disconnectExternalSocialAccount: vi.fn(),
    publishToYouTube: p('youtube'), publishToInstagram: p('instagram'), publishToTikTok: p('tiktok'),
    publishToFacebook: p('facebook'), publishToLinkedIn: p('linkedin'), publishToPinterest: p('pinterest'),
    publishToThreads: p('threads'), publishToX: p('x'),
    pollSocialResult: (...a: unknown[]) => mocks.poll(...a),
    uploadPublishMedia: (...a: unknown[]) => mocks.upload(...a),
    setYouTubeThumbnail: (...a: unknown[]) => mocks.thumb(...a),
  };
});

import SocialPublishModal from '@/components/SocialPublishModal';
import { WriteStep } from '@/components/social-publishing/steps/WriteStep';
import { mergeCopy } from '@/components/social-publishing/mergeCopy';

const KEY = 'muapi-test-key';
const emptyCopy = { master: '', platforms: {}, variants: [] } as any;

function Harness({ initial = {} as any, asset = { type: 'video', url: 'https://cdn.muapi.ai/v.mp4' } as any, startStep = 3 }) {
  const [step, setStep] = React.useState(startStep);
  const [writeCopy, setWrite] = React.useState<any>({ ...emptyCopy, master: 'Hello world #ai', title: 'Launch day', ...initial.write });
  const [social, setSocial] = React.useState<any>({ ...emptyCopy, ...initial.social });
  const [thumb, setThumb] = React.useState<any>({});
  const [dests, setDests] = React.useState<any[]>(initial.dests ?? [
    { id: 'youtube:1', platform: 'youtube', accountId: '1', accountName: 'My channel', enabled: true, settings: {} },
    { id: 'x:2', platform: 'x', accountId: '2', accountName: '@me', enabled: true, settings: {} },
  ]);
  const [results, setResults] = React.useState<any[]>([]);
  return (
    <SocialPublishModal
      open onClose={() => {}} apiKey={KEY} currentStep={step} setCurrentStep={setStep} asset={asset}
      writeCopy={writeCopy} socialCopy={social} thumbnail={thumb} destinations={dests} publishResults={results}
      updateWriteCopy={setWrite} updateSocialCopy={setSocial} updateThumbnail={(t: any) => setThumb((x: any) => ({ ...x, ...t }))}
      updateDestinations={setDests} updatePublishResults={setResults}
    />
  );
}

beforeEach(() => {
  mocks.pub.mockReset(); mocks.poll.mockReset(); mocks.upload.mockReset(); mocks.list.mockReset(); mocks.thumb.mockReset();
  mocks.pub.mockImplementation(async (platform: string) => ({ request_id: `req-${platform}` }));
  mocks.poll.mockResolvedValue({ status: 'completed', output: { url: 'https://example.com/post/1' } });
  mocks.list.mockResolvedValue([]);
});
afterEach(() => cleanup());

describe('merge of Write-step copy into publishing copy', () => {
  it('Write-step text wins over what the studio handed over', () => {
    const merged = mergeCopy(
      { ...emptyCopy, master: 'Edited by user', title: 'My title', platforms: { instagram: { caption: 'IG edit' } } },
      { ...emptyCopy, master: 'Studio caption', title: 'Studio title', caption: 'Studio caption', platforms: { instagram: { caption: 'old' }, x: { caption: 'x old' } } },
    );
    expect(merged.master).toBe('Edited by user');
    expect(merged.title).toBe('My title');
    expect(merged.platforms.instagram?.caption).toBe('IG edit');
    expect(merged.platforms.x?.caption).toBe('x old');
    expect(merged.caption).toBe('Studio caption');
  });
});

describe('Review & Publish', () => {
  it('Publish really posts, once per destination, with the Write-step title (not "Untitled")', async () => {
    render(<Harness />);
    expect(screen.getByText(/Ready to publish/)).toBeTruthy();
    expect(screen.getByText(/MuAPI cost/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /^Publish \(2\)/ }));
    await waitFor(() => expect(mocks.pub).toHaveBeenCalledTimes(2));
    const yt = mocks.pub.mock.calls.find((c) => c[0] === 'youtube')!;
    expect(yt[1]).toBe(KEY);
    expect(yt[2]).toMatchObject({ account_id: 1, media_url: 'https://cdn.muapi.ai/v.mp4', title: 'Launch day', privacy: 'public', category_id: '22', made_for_kids: false });
    expect(yt[2].title).not.toBe('Untitled');
    const x = mocks.pub.mock.calls.find((c) => c[0] === 'x')!;
    expect(x[2]).toMatchObject({ account_id: 2, caption: 'Hello world #ai' });
    await screen.findByText('Published successfully');
  });

  it('a second click never re-posts to a platform that already succeeded; Retry only retries the failure', async () => {
    mocks.pub.mockImplementation(async (platform: string) => {
      if (platform === 'x' && mocks.pub.mock.calls.filter((c) => c[0] === 'x').length === 1) throw { response: { status: 409 } };
      return { request_id: `req-${platform}` };
    });
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: /^Publish \(2\)/ }));
    await screen.findByText(/disconnected/);
    expect(mocks.pub.mock.calls.filter((c) => c[0] === 'youtube')).toHaveLength(1);
    // "Publish remaining" only sends what has not succeeded
    fireEvent.click(await screen.findByRole('button', { name: /Publish remaining \(1\)/ }));
    await screen.findByText('Published successfully');
    expect(mocks.pub.mock.calls.filter((c) => c[0] === 'youtube')).toHaveLength(1);
    expect(mocks.pub.mock.calls.filter((c) => c[0] === 'x')).toHaveLength(2);
  });

  it('per-destination Retry retries only that destination', async () => {
    let xCalls = 0;
    mocks.pub.mockImplementation(async (platform: string) => {
      if (platform === 'x' && ++xCalls === 1) throw { response: { status: 500, data: { detail: 'upstream' } } };
      return { request_id: `req-${platform}` };
    });
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: /^Publish \(2\)/ }));
    fireEvent.click(await screen.findByRole('button', { name: /Retry/ }));
    await screen.findByText('Published successfully');
    expect(mocks.pub.mock.calls.filter((c) => c[0] === 'youtube')).toHaveLength(1);
    expect(xCalls).toBe(2);
  });

  it('blocks publishing with a clear reason when YouTube has no title (no silent "Untitled")', () => {
    render(<Harness initial={{ write: { title: '', master: 'Just text' } }} />);
    expect(screen.getByRole('alert').textContent).toMatch(/YouTube: YouTube needs a title/);
    expect((screen.getByRole('button', { name: /^Publish \(2\)/ }) as HTMLButtonElement).disabled).toBe(true);
    expect(mocks.pub).not.toHaveBeenCalled();
  });

  it('the footer Publish button publishes too (it used to do nothing)', async () => {
    render(<Harness />);
    const footer = screen.getAllByRole('button', { name: /^Publish$/ })[0];
    fireEvent.click(footer);
    await waitFor(() => expect(mocks.pub).toHaveBeenCalledTimes(2));
  });

  it('uploads a local (blob:) file once and publishes its hosted URL', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ blob: async () => new Blob(['x'], { type: 'video/mp4' }) }));
    mocks.upload.mockResolvedValue('https://cdn.muapi.ai/uploaded.mp4');
    render(<Harness asset={{ type: 'video', url: 'blob:http://localhost/abc' }} />);
    fireEvent.click(screen.getByRole('button', { name: /^Publish \(2\)/ }));
    await waitFor(() => expect(mocks.pub).toHaveBeenCalledTimes(2));
    expect(mocks.upload).toHaveBeenCalledTimes(1);
    for (const c of mocks.pub.mock.calls) expect(c[2].media_url).toBe('https://cdn.muapi.ai/uploaded.mp4');
    vi.unstubAllGlobals();
  });

  it('sets the generated thumbnail on the YouTube video after publishing and shows the result', async () => {
    mocks.poll.mockResolvedValue({ status: 'completed', output: { platform: 'youtube', url: 'https://www.youtube.com/watch?v=vid12345678' } });
    mocks.thumb.mockResolvedValue({ request_id: 'th' });
    function WithThumb() {
      const [step, setStep] = React.useState(3);
      const [results, setResults] = React.useState<any[]>([]);
      const [dests, setDests] = React.useState<any[]>([{ id: 'youtube:1', platform: 'youtube', accountId: '1', accountName: 'Ch', enabled: true, settings: {} }]);
      return (
        <SocialPublishModal open onClose={() => {}} apiKey={KEY} currentStep={step} setCurrentStep={setStep}
          asset={{ type: 'video', url: 'https://cdn.muapi.ai/v.mp4' } as any} writeCopy={{ ...emptyCopy, master: 'Hi', title: 'T' }} socialCopy={emptyCopy}
          thumbnail={{ imageUrl: 'https://cdn.muapi.ai/thumb.png' }} destinations={dests} publishResults={results}
          updateWriteCopy={() => {}} updateSocialCopy={() => {}} updateThumbnail={() => {}} updateDestinations={setDests} updatePublishResults={setResults} />
      );
    }
    render(<WithThumb />);
    fireEvent.click(screen.getByRole('button', { name: /^Publish \(1\)/ }));
    await waitFor(() => expect(mocks.thumb).toHaveBeenCalledTimes(1));
    expect(mocks.thumb.mock.calls[0][1]).toEqual({ account_id: 1, video_id: 'vid12345678', thumbnail_url: 'https://cdn.muapi.ai/thumb.png' });
    await screen.findByText('Published successfully');
  });

  it('uploads a generated (data:) thumbnail and sends the public link to YouTube and Instagram', async () => {
    mocks.poll.mockResolvedValue({ status: 'completed', output: { platform: 'youtube', url: 'https://www.youtube.com/watch?v=vid12345678' } });
    mocks.thumb.mockResolvedValue({ request_id: 'th' });
    mocks.upload.mockResolvedValue('https://cdn.muapi.ai/uploaded-thumb.png');
    const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    function WithData() {
      const [step, setStep] = React.useState(3);
      const [results, setResults] = React.useState<any[]>([]);
      const [dests, setDests] = React.useState<any[]>([
        { id: 'youtube:1', platform: 'youtube', accountId: '1', accountName: 'Ch', enabled: true, settings: {} },
        { id: 'instagram:3', platform: 'instagram', accountId: '3', accountName: 'ig', enabled: true, settings: {} },
      ]);
      return (
        <SocialPublishModal open onClose={() => {}} apiKey={KEY} currentStep={step} setCurrentStep={setStep}
          asset={{ type: 'video', url: 'https://cdn.muapi.ai/v.mp4' } as any} writeCopy={{ ...emptyCopy, master: 'Hi', title: 'T' }} socialCopy={emptyCopy}
          thumbnail={{ imageUrl: png }} destinations={dests} publishResults={results}
          updateWriteCopy={() => {}} updateSocialCopy={() => {}} updateThumbnail={() => {}} updateDestinations={setDests} updatePublishResults={setResults} />
      );
    }
    render(<WithData />);
    fireEvent.click(screen.getByRole('button', { name: /^Publish \(2\)/ }));
    await waitFor(() => expect(mocks.thumb).toHaveBeenCalledTimes(1));
    expect(mocks.upload).toHaveBeenCalledTimes(1);
    expect(mocks.thumb.mock.calls[0][1].thumbnail_url).toBe('https://cdn.muapi.ai/uploaded-thumb.png');
    const ig = mocks.pub.mock.calls.find((c) => c[0] === 'instagram')!;
    expect(JSON.stringify(ig[2])).toContain('https://cdn.muapi.ai/uploaded-thumb.png');
  });

  it('shows all platforms that accept the media type in the header', () => {
    render(<Harness />);
    expect(screen.getByText(/YouTube · Instagram · TikTok · Facebook · LinkedIn · Pinterest · Threads · X/)).toBeTruthy();
  });
});

describe('Write step: AI writing needs the customer\'s OpenAI key only when used', () => {
  it('does not mention the key up front; shows the add-key message with a modal link when an AI action fails for lack of a key', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'UNAUTHENTICATED' }), { status: 401 })));
    const onKey = vi.fn();
    const Wrapper = () => {
      const [c, setC] = React.useState<any>({ ...emptyCopy, master: 'Some text' });
      return <WriteStep asset={{ type: 'video', url: 'https://cdn.muapi.ai/v.mp4', title: 'Topic' }} copy={c} onUpdateCopy={setC} onRequestApiKey={onKey} />;
    };
    render(<Wrapper />);
    expect(screen.queryByTestId('social-needs-openai-key')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Write Post/ }));
    const box = await screen.findByTestId('social-needs-openai-key');
    expect(box.textContent).toMatch(/Add your OpenAI key to use AI writing/);
    fireEvent.click(screen.getByRole('button', { name: 'Open API keys' }));
    expect(onKey).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
