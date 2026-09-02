'use client';

import { useEffect } from 'react';

// Keep intentionally disabled studio surfaces out of the SmartVideo shell
// without reintroducing their upstream implementation. The shell is heavily
// customized, so this small visibility guard lets product scope stay explicit
// while preserving the rest of the navigation unchanged.
const HIDDEN_STUDIO_LABELS = new Set(['MCP / CLI']);

function hideDisabledTabs(root = document) {
  root.querySelectorAll?.('button').forEach((button) => {
    const label = button.textContent?.trim();
    if (!HIDDEN_STUDIO_LABELS.has(label)) return;
    button.hidden = true;
    button.setAttribute('aria-hidden', 'true');
    button.setAttribute('tabindex', '-1');
  });
}

export default function StudioFeatureVisibility() {
  useEffect(() => {
    hideDisabledTabs();
    const observer = new MutationObserver(() => hideDisabledTabs());
    observer.observe(document.body, { subtree: true, childList: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
