// @vitest-environment jsdom
import { describe, it, expect, beforeAll } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import ImageStudio from './ImageStudio.jsx';
import { t2iModels } from '../models.js';

beforeAll(() => {
  if (!globalThis.t) globalThis.t = (k) => k;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
});

const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });

// Replicates the component's exact provider-grouping logic
// (ImageStudio.jsx: providers computed from m.provider / m.provider_name).
function computeProviders(models) {
  const seen = new Set();
  const out = [];
  for (const m of models) {
    const pId = m.provider || 'muapi';
    const pName = m.provider_name || 'Muapi';
    if (!seen.has(pId)) {
      seen.add(pId);
      out.push({ id: pId, name: pName });
    }
  }
  return out;
}

describe('ImageStudio provider selector (production readiness)', () => {
  it('backfilled models.js exposes real provider fields for the selector', () => {
    const tagged = t2iModels.filter((m) => m.provider && m.provider_name);
    // Before the fix every model fell back to "Muapi". After the backfill the
    // majority of the catalog must carry real provider metadata.
    expect(tagged.length).toBeGreaterThan(0);
    expect(tagged.length).toBeGreaterThan(t2iModels.length / 2);
    // no model carries provider without provider_name (or vice-versa)
    for (const m of t2iModels) {
      const hasP = !!m.provider;
      const hasN = !!m.provider_name;
      expect(hasP).toBe(hasN);
    }
  });

  it('renders multiple provider tabs, not a single collapsed Muapi tab', () => {
    const providers = computeProviders(t2iModels);
    // "all" is added by the UI; distinct real providers must be > 1.
    const realProviders = providers.filter((p) => p.id !== 'muapi');
    expect(realProviders.length).toBeGreaterThan(1);
    expect(providers.some((p) => p.id === 'muapi')).toBe(true); // fallback still present
  });

  it('opens the model picker and renders real provider tabs (not a single Muapi tab)', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(<ImageStudio />);
    });
    await flush();

    // The provider tabs live inside the ModelDropdown, which opens when the
    // model-name button in the top toolbar is clicked.
    const modelBtn = [...container.querySelectorAll('button')].find((b) =>
      (b.textContent || '').includes(t2iModels[0].name),
    );
    expect(modelBtn).toBeTruthy();

    // Dispatch the click OUTSIDE act (matches VideoStudio.test.jsx pattern) so
    // the window-level outside-click-close handler doesn't immediately close it.
    modelBtn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    await flush();

    // Provider tabs are narrow circular buttons; their provider name lives in
    // the `title` attribute (and logo <img> alt). The first is "All Providers".
    const tabButtons = [...container.querySelectorAll('button[title]')];
    const titles = tabButtons.map((b) => b.getAttribute('title'));
    const realProviderTitles = titles.filter((t) => t && t !== 'All Providers');

    // Before the fix every model fell back to "Muapi" => exactly one real tab.
    expect(realProviderTitles.length).toBeGreaterThan(1);

    // The expected real provider names from the data must be present as tabs.
    const expectedNames = computeProviders(t2iModels)
      .map((p) => p.name)
      .filter((n) => n !== 'Muapi');
    const found = expectedNames.filter((n) => titles.includes(n));
    expect(found.length).toBeGreaterThan(0);

    root.unmount();
    container.remove();
  });
});
