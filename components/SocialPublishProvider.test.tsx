// @vitest-environment jsdom
import { describe, it, expect, beforeAll } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { SocialPublishProvider, PublishStep } from './SocialPublishProvider';

beforeAll(() => {
  // Enable React's act() batching/flushing in the test env.
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
});

const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });

function mountPublishStep(props: {
  mediaUrl?: string | null;
  mediaType?: 'image' | 'video';
  title?: string;
  caption?: string;
}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <SocialPublishProvider apiKey="fake-key">
        <PublishStep
          mediaUrl={props.mediaUrl ?? undefined}
          mediaType={props.mediaType ?? 'video'}
          title={props.title}
          caption={props.caption}
        />
      </SocialPublishProvider>,
    );
  });
  return { container, root };
}

// The platform icons live inside the span with the `opacity-70` class.
function platformIconCount(container: HTMLElement): number {
  const span = container.querySelector('[class*="opacity-70"]');
  if (!span) return 0;
  return span.querySelectorAll('svg').length;
}

describe('PublishStep platform filtering (media type -> chips)', () => {
  it('image media shows only the Instagram chip', () => {
    const { container } = mountPublishStep({
      mediaUrl: 'https://example.com/photo.png',
      mediaType: 'image',
    });
    // Publish button is rendered.
    expect(container.textContent).toContain('Post to social');
    // Exactly one platform chip (Instagram).
    expect(platformIconCount(container)).toBe(1);
  });

  it('video media shows YouTube + Instagram + TikTok chips', () => {
    const { container } = mountPublishStep({
      mediaUrl: 'https://example.com/clip.mp4',
      mediaType: 'video',
    });
    expect(container.textContent).toContain('Post to social');
    // Three platform chips: YouTube, Instagram, TikTok.
    expect(platformIconCount(container)).toBe(3);
  });

  it('defaults to video behaviour (YouTube + Instagram + TikTok) when no mediaType given', () => {
    const { container } = mountPublishStep({
      mediaUrl: 'https://example.com/clip.mp4',
    });
    expect(platformIconCount(container)).toBe(3);
  });
});

describe('PublishStep null-url guard', () => {
  it('renders nothing (returns null) when mediaUrl is null', () => {
    const { container } = mountPublishStep({ mediaUrl: null, mediaType: 'video' });
    expect(container.querySelectorAll('button').length).toBe(0);
    // The modal is NOT opened by openPublish.
    expect(container.textContent).not.toContain('Publish to social');
  });

  it('renders nothing (returns null) when mediaUrl is undefined', () => {
    const { container } = mountPublishStep({ mediaType: 'video' });
    expect(container.querySelectorAll('button').length).toBe(0);
    expect(container.textContent).not.toContain('Publish to social');
  });

  it('renders nothing (returns null) when mediaUrl is an empty string', () => {
    const { container } = mountPublishStep({ mediaUrl: '', mediaType: 'image' });
    expect(container.querySelectorAll('button').length).toBe(0);
    expect(container.textContent).not.toContain('Publish to social');
  });

  it('calls openPublish (opens the modal) for a valid mediaUrl', () => {
    const { container } = mountPublishStep({
      mediaUrl: 'https://example.com/clip.mp4',
      mediaType: 'video',
      title: 'Hello',
    });
    const button = [...container.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Post to social'),
    );
    expect(button).toBeTruthy();
    act(() => {
      button!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    // openPublish flips the provider state -> the SocialPublishModal opens.
    expect(container.textContent).toContain('Publish to social');
  });
});
