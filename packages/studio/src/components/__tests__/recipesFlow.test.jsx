// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('../PromptLibrary', () => ({ default: () => null }));
vi.mock('../../muapi.js', () => ({ uploadFile: vi.fn() }));

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

  it('workflow recipes open the runner instead of a studio', () => {
    render(<SkillsBrowser apiKey="k" />);
    fireEvent.click(screen.getAllByText('Run workflow')[0]);
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('Run workflow', { selector: 'button:not(.w-full)' })).toBeTruthy();
    expect(push).not.toHaveBeenCalled();
  });
});
