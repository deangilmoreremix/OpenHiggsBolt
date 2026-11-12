// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import { mergeCopy } from '@/components/social-publishing/mergeCopy';
import { buildPublishPayload } from '@/src/shared/api/socialPayloads';

const mocks = vi.hoisted(() => ({ gen: vi.fn() }));
vi.mock('@/shared/api/socialCopyService', async (orig) => ({ ...(await orig<any>()), generateCopy: (...a: unknown[]) => mocks.gen(...a) }));

import { WriteStep } from '@/components/social-publishing/steps/WriteStep';

afterEach(cleanup);
const empty = { master: '', platforms: {}, variants: [] } as any;

describe('a cleared platform caption stays cleared', () => {
  it('does not bring back the studio caption (falls back to the learner\'s own master text)', () => {
    const studio = { ...empty, caption: 'STUDIO CAPTION', platforms: { instagram: { caption: 'STUDIO IG' } } };
    const write = { ...empty, master: 'My own text', platforms: { instagram: { caption: '' } }, edited: { platforms: { instagram: { caption: true } } } };
    const merged = mergeCopy(write, studio);
    const built = buildPublishPayload({ platform: 'instagram', accountId: '1', mediaUrl: 'https://cdn.muapi.ai/v.mp4', mediaType: 'video', copy: merged });
    expect(built.payload?.caption).toBe('My own text');
    expect(JSON.stringify(built.payload)).not.toMatch(/STUDIO/);
  });

  it('still uses the studio caption when the learner touched nothing', () => {
    const studio = { ...empty, caption: 'STUDIO CAPTION' };
    const merged = mergeCopy({ ...empty, master: '' }, studio);
    expect(merged.caption).toBe('STUDIO CAPTION');
  });
});

describe('AI writing from an earlier publishing session', () => {
  it('is dropped when the session changed before the answer arrived', async () => {
    let resolve!: (v: any) => void;
    mocks.gen.mockImplementation(() => new Promise((r) => { resolve = r; }));
    const onUpdate = vi.fn();
    const asset = { type: 'video', url: 'https://cdn.muapi.ai/v.mp4', title: 'Topic' } as any;
    const { rerender } = render(<WriteStep asset={asset} copy={empty} onUpdateCopy={onUpdate} sessionId={1} />);
    fireEvent.click(screen.getByRole('button', { name: /Write Post/ }));
    rerender(<WriteStep asset={asset} copy={empty} onUpdateCopy={onUpdate} sessionId={2} />);
    resolve({ masterPost: 'Old asset text', variants: [] });
    await new Promise((r) => setTimeout(r, 20));
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('is applied when the session is unchanged', async () => {
    mocks.gen.mockResolvedValue({ masterPost: 'Fresh text', variants: [] });
    const onUpdate = vi.fn();
    const asset = { type: 'video', url: 'https://cdn.muapi.ai/v.mp4', title: 'Topic' } as any;
    render(<WriteStep asset={asset} copy={empty} onUpdateCopy={onUpdate} sessionId={1} />);
    fireEvent.click(screen.getByRole('button', { name: /Write Post/ }));
    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalled());
    expect(onUpdate.mock.calls.at(-1)![0].master).toBe('Fresh text');
  });
});

describe('Thumbnail step after Back/Next', () => {
  it('opens the editor on the retained thumbnail without generating again', async () => {
    const { default: ThumbnailStep } = await import('@/components/social-publishing/steps/ThumbnailStep');
    render(
      <ThumbnailStep
        asset={{ type: 'video', url: 'https://cdn.muapi.ai/v.mp4' } as any}
        thumbnail={{ imageUrl: 'data:image/png;base64,QUJD' }}
        onUpdateThumbnail={() => {}}
        copy={empty}
      />,
    );
    expect(screen.getByTestId('thumbnail-editor')).toBeTruthy();
    expect(screen.queryByText(/Generate or pick a thumbnail/)).toBeNull();
  });

  it('keeps the concept panel mounted (hidden) while collapsed so a running generation is not dropped', async () => {
    const { default: ThumbnailStep } = await import('@/components/social-publishing/steps/ThumbnailStep');
    render(<ThumbnailStep asset={{ type: 'video', url: 'https://cdn.muapi.ai/v.mp4' } as any} thumbnail={{}} onUpdateThumbnail={() => {}} copy={empty} />);
    const panel = document.querySelector('[aria-label="Thumbnail concept generator"]') as HTMLElement | null;
    expect(panel).toBeTruthy(); // mounted although "Generate concepts" is collapsed
    expect(panel!.closest('[hidden]')).toBeTruthy(); // but not visible
    fireEvent.click(screen.getByRole('button', { name: /Generate concepts/ }));
    expect(panel!.closest('[hidden]')).toBeNull();
  });
});
