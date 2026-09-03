// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { StudioTargetPicker } from '../StudioTargetPicker';

function mount(props) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(<StudioTargetPicker {...props} />);
  });
  return { container, root };
}

function clickText(container, text) {
  const els = [...container.querySelectorAll('*')].filter((n) =>
    n.textContent?.includes(text),
  );
  if (els.length === 0) throw new Error(`clickText: not found: ${text}`);
  const el = els.find((e) => e.tagName === 'BUTTON') || els[0];
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  return act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

describe('StudioTargetPicker', () => {
  const defaultProps = {
    mediaType: 'video' as const,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders video targets for video media type', () => {
    const { container } = mount(defaultProps);
    const buttons = [...container.querySelectorAll('button')].map((b) => b.textContent.trim());
    expect(buttons).toContain('Video Studio');
    expect(buttons).toContain('Cinema Studio');
    expect(buttons).toContain('VFX Studio');
  });

  it('renders image targets for image media type', () => {
    const { container } = mount({ ...defaultProps, mediaType: 'image' });
    const buttons = [...container.querySelectorAll('button')].map((b) => b.textContent.trim());
    expect(buttons).toContain('Image Studio');
    expect(buttons).toContain('Thumbnail Studio');
    expect(buttons).toContain('AI Influencer Studio');
    expect(buttons).toContain('Marketing Studio');
  });

  it('calls onClose when Cancel is clicked', async () => {
    const onClose = vi.fn();
    const { container } = mount({ ...defaultProps, onClose });
    await clickText(container, 'Cancel');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose after selecting a target', async () => {
    const onClose = vi.fn();
    const { container } = mount({ ...defaultProps, onClose });
    await clickText(container, 'Video Studio');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders correct number of target buttons for video', () => {
    const { container } = mount(defaultProps);
    const targetButtons = [...container.querySelectorAll('button')].filter((b) =>
      ['Video Studio', 'Cinema Studio', 'VFX Studio', 'Clipping Studio', 'Vibe Motion', 'Lip Sync', 'Recast'].includes(b.textContent.trim())
    );
    expect(targetButtons.length).toBe(7);
  });

  it('renders correct number of target buttons for image', () => {
    const { container } = mount({ ...defaultProps, mediaType: 'image' });
    const targetButtons = [...container.querySelectorAll('button')].filter((b) =>
      ['Image Studio', 'Thumbnail Studio', 'AI Influencer Studio', 'Marketing Studio'].includes(b.textContent.trim())
    );
    expect(targetButtons.length).toBe(4);
  });
});
