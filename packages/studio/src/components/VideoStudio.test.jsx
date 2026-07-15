// @vitest-environment jsdom
import { describe, it, expect, beforeAll } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import VideoStudio from './VideoStudio.jsx';

// The component expects a global i18n `t` from the app shell.
beforeAll(() => {
  if (!globalThis.t) globalThis.t = (k) => k;
  // Enable React's act() batching/flushing in the test env.
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
});

const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });

// Click the innermost element whose text includes `text`. Dispatch the native
// click OUTSIDE `act` so React does not flush synchronously — otherwise
// the component's window-level outside-click-close handler fires (it checks
// dropdownRef.current) and immediately closes the dropdown we just opened.
// We flush afterward.
function clickText(container, text) {
  const els = [...container.querySelectorAll('*')].filter((n) =>
    n.textContent?.includes(text),
  );
  if (els.length === 0) throw new Error(`clickText: not found: ${text}`);
  // Prefer a real <button> control over decorative text that also
  // contains the name (e.g. the empty-state hero card), which
  // has no onClick.
  const el =
    els.find((e) => e.tagName === 'BUTTON') ||
    els.sort((a, b) => a.textContent.length - b.textContent.length)[0];
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  return flush();
}

function typeSearch(container, value) {
  const input = container.querySelector('input[type="text"]');
  if (!input) {
    const all = [...container.querySelectorAll('input')].map(
      (i) => `${i.type}:${i.placeholder || ''}`,
    );
    throw new Error(`search input not found. inputs=${JSON.stringify(all)}`);
  }
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value',
  ).set;
  setter.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  return flush();
}

function buttons(container) {
  return [...container.querySelectorAll('button')].map((b) => b.textContent.trim());
}

function mount() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(<VideoStudio apiKey="fake-key" />);
  });
  return { container, root };
}

describe('VideoStudio Quality & Mode controls', () => {
  it('renders and shows Quality for Seedance 2.0, Mode for Grok Imagine', async () => {
    const { container } = mount();

    // Default model (Seedance Lite) has neither quality nor mode.
    expect(buttons(container)).not.toContain('basic');
    expect(buttons(container)).not.toContain('normal');

    // Open the model picker and pick a quality-capable model.
    await clickText(container, 'Seedance Lite');
    await typeSearch(container, 'Seedance 2.0');
    await clickText(container, 'Seedance 2.0');

    // Quality control now shows the model default ("basic").
    expect(buttons(container)).toContain('basic');

    // Switch to a mode-capable model.
    await clickText(container, 'Seedance 2.0');
    await typeSearch(container, 'Grok Imagine');
    await clickText(container, 'Grok Imagine');

    // Mode control now shows the model default ("normal").
    expect(buttons(container)).toContain('normal');
    expect(buttons(container)).not.toContain('basic');
  });
});
