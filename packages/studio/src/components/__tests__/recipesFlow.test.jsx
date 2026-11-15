// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('../PromptLibrary', () => ({ default: () => null }));
vi.mock('../../muapi.js', () => ({ uploadFile: vi.fn() }));
// Keep the real helpers (buildParams etc.) but let tests observe/control runSkill.
vi.mock('../../lib/promptRecipes.js', async (importOriginal) => ({
  ...(await importOriginal()),
  runSkill: vi.fn(() => new Promise(() => {})),
}));
// Live price per model, as returned by the estimate-cost endpoint.
vi.mock('../../lib/costEstimate.js', () => ({
  estimateModelCost: vi.fn(async (_key, model) => (String(model).includes('image-to-video') ? 0.75 : 0.0165)),
}));

import SkillsBrowser from '../SkillsBrowser.jsx';
import registry from '../../skills/registry.json';
import { runSkill } from '../../lib/promptRecipes.js';
import { uploadFile } from '../../muapi.js';

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

  it('closes the runner on Escape and on a backdrop click, but not on a click inside the panel', () => {
    render(<SkillsBrowser apiKey="" />);
    const dialog = openWorkflow('3D Logo Animation');
    fireEvent.mouseDown(screen.getByTestId('cost-note')); // inside the panel
    expect(screen.queryByRole('dialog')).not.toBeNull();
    fireEvent.mouseDown(dialog); // backdrop
    expect(screen.queryByRole('dialog')).toBeNull();

    openWorkflow('3D Logo Animation');
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  const runLogoWorkflow = () => {
    const view = render(<SkillsBrowser apiKey="k" />);
    const dialog = openWorkflow('3D Logo Animation');
    fireEvent.change(screen.getByPlaceholderText('…or paste a URL'), { target: { value: 'https://x/logo.png' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Run workflow' }));
    return view;
  };

  it('sends the displayed defaults (not empty strings) to runSkill', () => {
    runSkill.mockClear();
    runLogoWorkflow();
    const values = runSkill.mock.calls[0][2];
    expect(values.material_style).toBe('glossy glass and chrome');
    expect(values.logo_image).toBe('https://x/logo.png');
  });

  it('aborts the run and releases a pending approval when the runner unmounts mid-run', () => {
    runSkill.mockClear();
    let approvalResult;
    runSkill.mockImplementationOnce((_k, _s, _v, _onStep, options) => {
      options.onApproval(1, {}).then((ok) => {
        approvalResult = ok;
      });
      return new Promise(() => {});
    });
    const { unmount } = runLogoWorkflow();
    const { signal } = runSkill.mock.calls[0][4];
    expect(signal.aborted).toBe(false);
    unmount();
    expect(signal.aborted).toBe(true);
    return Promise.resolve().then(() => expect(approvalResult).toBe(false));
  });

  it('disables a source field while its upload is running', async () => {
    let finish;
    uploadFile.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    render(<SkillsBrowser apiKey="k" />);
    openWorkflow('3D Logo Animation');
    const fileInput = document.querySelector('input[type="file"]');
    const urlInput = screen.getByPlaceholderText('…or paste a URL');
    fireEvent.change(fileInput, { target: { files: [new File(['x'], 'logo.png', { type: 'image/png' })] } });
    expect(fileInput.disabled).toBe(true);
    expect(urlInput.disabled).toBe(true);
    finish('https://x/uploaded.png');
    await screen.findByDisplayValue('https://x/uploaded.png');
    expect(fileInput.disabled).toBe(false);
  });

  it('moves focus into the dialog, keeps Tab inside it, and restores focus on close', () => {
    render(<SkillsBrowser apiKey="" />);
    const card = screen.getByRole('heading', { level: 3, name: '3D Logo Animation' }).closest('div.flex-col');
    const opener = card.querySelector('button');
    opener.focus();
    fireEvent.click(opener);
    const dialog = screen.getByRole('dialog');
    expect(dialog.contains(document.activeElement)).toBe(true);
    const focusable = dialog.querySelectorAll('button:not([disabled]), input:not([disabled])');
    focusable[focusable.length - 1].focus();
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(document.activeElement).toBe(focusable[0]);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(document.activeElement).toBe(opener);
  });

  it('workflow recipes open the runner instead of a studio', () => {
    render(<SkillsBrowser apiKey="k" />);
    fireEvent.click(screen.getAllByText('Run workflow')[0]);
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('Run workflow', { selector: 'button:not(.w-full)' })).toBeTruthy();
    expect(push).not.toHaveBeenCalled();
  });
});
