// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('../PromptLibrary', () => ({ default: () => null }));
vi.mock('../../muapi.js', () => ({ uploadFile: vi.fn() }));
// Live price per model, as returned by the estimate-cost endpoint.
vi.mock('../../lib/costEstimate.js', () => ({
  estimateModelCost: vi.fn(async (_key, model) => (String(model).includes('image-to-video') ? 0.75 : 0.0165)),
}));

import SkillsBrowser from '../SkillsBrowser.jsx';
import registry from '../../skills/registry.json';

beforeEach(() => {
  cleanup();
  push.mockClear();
  localStorage.clear();
});

describe('Skills browser (page behind the Recipes button)', () => {
  it('shows rebranded titles and hides unusable recipes', () => {
    render(<SkillsBrowser apiKey="k" />);
    expect(screen.getByText('3D Logo Animation')).toBeTruthy();
    expect(screen.queryByText(/muapi-/i)).toBeNull();
    // Card titles are the h3 headings (a hidden recipe may share a word with a category chip).
    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    for (const h of registry.skills.filter((s) => s.hidden)) {
      expect(headings).not.toContain(h.title);
    }
    expect(headings).toHaveLength(registry.skills.filter((s) => !s.hidden).length);
  });

  it('Open in Studio stores the pending recipe and navigates to its studio', () => {
    render(<SkillsBrowser apiKey="k" />);
    fireEvent.click(screen.getAllByText('Open in Studio')[0]);
    const first = registry.skills.find((s) => !s.hidden && s.kind !== 'workflow');
    expect(push).toHaveBeenCalledWith('/studio/' + first.studio);
    expect(JSON.parse(localStorage.getItem('pending_recipe')).slug).toBe(first.slug);
  });

  const openWorkflow = (title) => {
    const card = screen.getByRole('heading', { level: 3, name: title }).closest('div.flex-col');
    fireEvent.click(card.querySelector('button'));
    return screen.getByRole('dialog');
  };

  it('video workflows show an amber cost note with the live estimate', async () => {
    render(<SkillsBrowser apiKey="k" />);
    openWorkflow('3D Logo Animation');
    const note = screen.getByTestId('cost-note');
    expect(note.textContent).toContain('1 image and 1 video');
    expect(note.textContent).toContain('Each run spends credits');
    expect(note.className).toContain('amber');
    await screen.findByText('$0.77'); // 0.0165 + 0.75
  });

  it('falls back to the static note without an API key, and image-only workflows are not flagged', () => {
    render(<SkillsBrowser apiKey="" />);
    openWorkflow('3D Logo Animation');
    expect(screen.getByTestId('cost-note').textContent).toContain('about $0.75 per 5 s video');
    cleanup();
    render(<SkillsBrowser apiKey="" />);
    openWorkflow('Social Pack');
    const note = screen.getByTestId('cost-note');
    expect(note.textContent).toContain('2 images');
    expect(note.textContent).not.toContain('Each run spends credits');
    expect(note.className).not.toContain('amber');
  });

  it('workflow recipes open the runner instead of a studio', () => {
    render(<SkillsBrowser apiKey="k" />);
    fireEvent.click(screen.getAllByText('Run workflow')[0]);
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('Run workflow', { selector: 'button:not(.w-full)' })).toBeTruthy();
    expect(push).not.toHaveBeenCalled();
  });
});
