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
  // jsdom does not implement scrollIntoView; the upstream model picker calls it
  // when the popover opens (VideoStudio.jsx:493). Stub the DOM API only — no
  // assertion is relaxed.
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
});

const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });

// Helpers below dispatch the native click OUTSIDE `act` so React does not flush
// synchronously — otherwise the component's window-level outside-click-close
// handler fires (it checks dropdownRef.current) and immediately closes the
// dropdown we just opened. We flush afterward.

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

// The prompt-bar control (model picker trigger, mode picker trigger, settings
// trigger) is the only button whose whole text is exactly `label`.
function clickControl(container, label) {
  const btn = [...container.querySelectorAll('button')].find(
    (b) => b.textContent.trim() === label,
  );
  if (!btn) {
    throw new Error(
      `clickControl: not found: ${label}. buttons=${JSON.stringify(buttons(container))}`,
    );
  }
  btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  return flush();
}

// A model-picker entry is a button whose name label is `label`; the entry also
// carries a provider badge, so the prompt-bar trigger (same label, no badge)
// is told apart by taking the last matching span.
function clickModelEntry(container, label) {
  const spans = [...container.querySelectorAll('span')].filter(
    (s) => s.textContent.trim() === label,
  );
  const btn = spans[spans.length - 1]?.closest('button');
  if (!btn) {
    throw new Error(`clickModelEntry: not found: ${label}`);
  }
  btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  return flush();
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

    // Default model (Seedance 1.0 Lite) exposes no quality/settings control.
    expect(buttons(container)).not.toContain('Settings');
    expect(container.querySelector('select')).toBeNull();

    // Open the model picker and pick a grouped model.
    await clickControl(container, 'Seedance 1.0 Lite');
    await typeSearch(container, 'Seedance 2.0');
    await clickModelEntry(container, 'Seedance 2.0');

    // Upstream surfaces the per-model quality/profile settings through the
    // grouped "Settings" popover instead of a standalone quality dropdown.
    expect(buttons(container)).toContain('Settings');
    expect(buttons(container)).toContain('Standard speed');

    // Switch to a mode-capable model.
    await clickControl(container, 'Seedance 2.0');
    await typeSearch(container, 'Grok Imagine');
    await clickModelEntry(container, 'Grok Imagine');
    expect(buttons(container)).toContain('Grok Imagine');

    // Its quality/style control lives in the Settings popover and keeps the
    // upstream default value ("normal", shown as "Standard").
    await clickControl(container, 'Settings');
    const quality = container.querySelector('select');
    expect(quality).toBeTruthy();
    expect(quality.value).toBe('normal');
    expect([...quality.options].map((o) => o.textContent.trim())).toEqual([
      'Standard',
      'Creative',
      'Spicy',
    ]);
    await clickControl(container, 'Settings');

    // The mode control opens upstream's "Video mode" picker.
    await clickControl(container, 'From prompt');
    expect(container.textContent).toContain('Video mode');
    expect(container.textContent).toContain('Use references');
  }, 30000);
});
