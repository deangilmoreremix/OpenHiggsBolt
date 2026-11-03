// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import EditStudio from '@/packages/studio/src/components/edit/EditStudio';
import { EDIT_TOOLS } from '@/packages/studio/src/editTools';

describe('EditStudio', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/studio/edit');
  });
  afterEach(() => cleanup());

  it('shows a thumbnail card for every tool', () => {
    render(<EditStudio apiKey="" />);
    for (const tool of EDIT_TOOLS) {
      expect(screen.getByRole('button', { name: `Open ${tool.name}` })).toBeDefined();
    }
  });

  it('opens a tool playground at its own URL and goes back to the gallery', () => {
    render(<EditStudio apiKey="" />);
    fireEvent.click(screen.getByRole('button', { name: 'Open Background Remover' }));
    expect(window.location.pathname).toBe('/studio/edit/background-remover');
    expect(screen.getByRole('heading', { name: 'Background Remover' })).toBeDefined();
    expect(screen.getByText('Upload image')).toBeDefined();
    expect(screen.queryByLabelText(/Prompt/)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '← All tools' }));
    expect(window.location.pathname).toBe('/studio/edit');
    expect(screen.getByRole('button', { name: 'Open Face Swap' })).toBeDefined();
  });

  it('opens the tool named in the URL directly', () => {
    window.history.replaceState(null, '', '/studio/edit/ai-image-editor');
    render(<EditStudio apiKey="" />);
    expect(screen.getByRole('heading', { name: 'AI Image Editor' })).toBeDefined();
    expect(screen.getByLabelText('Model')).toBeDefined();
    expect(screen.getByLabelText(/Prompt/)).toBeDefined();
  });

  it('filters the gallery by media type', () => {
    render(<EditStudio apiKey="" />);
    fireEvent.click(screen.getByRole('tab', { name: 'Audio' }));
    expect(screen.getByRole('button', { name: 'Open AI Audio & Music' })).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Open Face Swap' })).toBeNull();
  });
});
