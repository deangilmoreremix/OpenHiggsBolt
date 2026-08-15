// @vitest-environment jsdom
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import DestinationsStep from './social-publishing/steps/DestinationsStep';

// Mock the MuAPI social-publish module so we can capture the exact request
// bodies that DestinationsStep assembles per platform. Field names below are
// taken from src/lib/muapi.js (publishToYouTube / publishToInstagram /
// publishToTikTok) and from DestinationsStep.publishOne.
vi.mock('@/lib/muapi', () => ({
  listExternalSocialAccounts: vi.fn().mockResolvedValue([]),
  connectSocialAccount: vi.fn(),
  disconnectExternalSocialAccount: vi.fn(),
  publishToYouTube: vi.fn().mockResolvedValue({ request_id: 'yt-1' }),
  publishToInstagram: vi.fn().mockResolvedValue({ request_id: 'ig-1' }),
  publishToTikTok: vi.fn().mockResolvedValue({ request_id: 'tt-1' }),
  publishToFacebook: vi.fn(),
  publishToLinkedIn: vi.fn(),
  publishToPinterest: vi.fn(),
  publishToThreads: vi.fn(),
  publishToX: vi.fn(),
  pollSocialResult: vi.fn(),
}));

import {
  publishToYouTube,
  publishToInstagram,
  publishToTikTok,
} from '@/lib/muapi';

beforeAll(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
});

// Each test re-mounts and re-publishes all three destinations, so reset the
// captured mock calls between tests to keep per-test assertions isolated.
beforeEach(() => {
  vi.clearAllMocks();
});

const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 10));
  });

const ASSET = { type: 'video' as const, url: 'https://example.com/clip.mp4' };

const COPY = {
  master: '',
  platforms: {},
  variants: [],
  selectedVariantId: undefined,
  title: 'My Title',
  description: 'My Description',
  tags: 'a, b, c',
  caption: 'My Caption',
  tiktokTitle: 'TT Title',
};

const DESTINATIONS = [
  { id: 'yt', platform: 'youtube' as const, accountId: 'acc-yt', accountName: 'YT', enabled: true, settings: {} },
  { id: 'ig', platform: 'instagram' as const, accountId: 'acc-ig', accountName: 'IG', enabled: true, settings: {} },
  { id: 'tt', platform: 'tiktok' as const, accountId: 'acc-tt', accountName: 'TT', enabled: true, settings: {} },
];

function mount() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <DestinationsStep
        asset={ASSET}
        copy={COPY as any}
        destinations={DESTINATIONS as any}
        onChange={vi.fn()}
        publishResults={[]}
        onPublish={vi.fn()}
        onUpdatePublishResults={vi.fn()}
        publishing={false}
        apiKey="fake-key"
        mediaType="video"
      />,
    );
  });
  return { container, root };
}

function clickPublishNow(container: HTMLElement) {
  const button = [...container.querySelectorAll('button')].find((b) =>
    b.textContent?.includes('Publish Now'),
  );
  if (!button) throw new Error('Publish Now button not found');
  act(() => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

describe('Social publishing payload shaping per platform', () => {
  it('assembles the correct YouTube publish payload', async () => {
    const { container } = mount();
    await flush();
    clickPublishNow(container);
    await flush();
    await flush();

    expect(publishToYouTube).toHaveBeenCalledTimes(1);
    const payload = publishToYouTube.mock.calls[0][1];
    expect(payload).toMatchObject({
      account_id: 'acc-yt',
      media_url: 'https://example.com/clip.mp4',
      title: 'My Title',
      description: 'My Description',
      tags: ['a', 'b', 'c'],
      privacy: 'public',
      category_id: '',
      made_for_kids: false,
    });
  });

  it('assembles the correct Instagram publish payload', async () => {
    const { container } = mount();
    await flush();
    clickPublishNow(container);
    await flush();
    await flush();

    expect(publishToInstagram).toHaveBeenCalledTimes(1);
    const payload = publishToInstagram.mock.calls[0][1];
    expect(payload).toMatchObject({
      account_id: 'acc-ig',
      media_url: 'https://example.com/clip.mp4',
      caption: 'My Caption',
      media_type: 'VIDEO',
      placement: 'reels',
      share_to_feed: true,
    });
  });

  it('assembles the correct TikTok publish payload', async () => {
    const { container } = mount();
    await flush();
    clickPublishNow(container);
    await flush();
    await flush();

    expect(publishToTikTok).toHaveBeenCalledTimes(1);
    const payload = publishToTikTok.mock.calls[0][1];
    expect(payload).toMatchObject({
      account_id: 'acc-tt',
      media_url: 'https://example.com/clip.mp4',
      title: 'TT Title',
      privacy_level: 'PUBLIC_TO_EVERYONE',
      disable_comment: false,
      disable_duet: false,
      disable_stitch: false,
    });
  });
});
