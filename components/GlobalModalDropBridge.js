'use client';

import { useEffect } from 'react';

function findOpenDrawModalInput() {
  if (typeof document === 'undefined') return null;
  const overlays = Array.from(document.querySelectorAll('div.fixed.inset-0'));
  const drawOverlay = overlays.find((node) => {
    const text = node.textContent || '';
    return text.includes('DRAW TO EDIT') || text.includes('Draw to Edit');
  });
  if (!drawOverlay) return null;
  return drawOverlay.querySelector('input[type="file"][accept*="image"]');
}

function matchesAccept(file, accept = '') {
  const tokens = String(accept)
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
  if (!tokens.length) return true;

  const type = String(file?.type || '').toLowerCase();
  const name = String(file?.name || '').toLowerCase();
  return tokens.some((token) => {
    if (token.endsWith('/*')) return type.startsWith(token.slice(0, -1));
    if (token.startsWith('.')) return name.endsWith(token);
    return type === token;
  });
}

function acceptedFiles(input, files) {
  const matches = Array.from(files || []).filter((file) => matchesAccept(file, input?.accept));
  return input?.multiple ? matches : matches.slice(0, 1);
}

function findTargetedFileInput(target) {
  if (!(target instanceof Element)) return null;
  if (target.matches('input[type="file"]')) return target;

  // Walk only a short distance up the rendered picker. This deliberately
  // requires a real hidden file input near the drop target so normal studio
  // cards, editors and the shell-wide drop zone are never hijacked.
  let node = target;
  for (let depth = 0; node && depth < 6; depth += 1, node = node.parentElement) {
    const input = node.querySelector?.('input[type="file"]:not([disabled])');
    if (input) return input;

    if (node.tagName === 'LABEL' && node.htmlFor) {
      const labelledInput = document.getElementById(node.htmlFor);
      if (labelledInput?.matches?.('input[type="file"]:not([disabled])')) return labelledInput;
    }
  }
  return null;
}

function dispatchFiles(input, files) {
  const selected = acceptedFiles(input, files);
  if (!selected.length) return false;

  const transfer = new DataTransfer();
  selected.forEach((file) => transfer.items.add(file));
  input.files = transfer.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}

export default function GlobalModalDropBridge() {
  useEffect(() => {
    let activeControl = null;

    const clearActiveControl = () => {
      if (!activeControl) return;
      activeControl.style.removeProperty('outline');
      activeControl.style.removeProperty('outline-offset');
      activeControl = null;
    };

    const highlightInputControl = (input) => {
      const control = input.closest('button, label, [role="button"], [data-upload-target]') || input.parentElement;
      if (!control || control === activeControl) return;
      clearActiveControl();
      activeControl = control;
      activeControl.style.outline = '2px dashed rgba(34, 211, 238, 0.75)';
      activeControl.style.outlineOffset = '3px';
    };

    const handleDragOver = (event) => {
      if (!event.dataTransfer?.types?.includes('Files')) return;

      // DrawModal keeps its own full-modal drop surface because users may drop
      // anywhere on the setup canvas, not only on the upload button.
      const drawInput = findOpenDrawModalInput();
      if (drawInput) {
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = 'copy';
        return;
      }

      const input = findTargetedFileInput(event.target);
      if (!input) {
        clearActiveControl();
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.dataTransfer.dropEffect = 'copy';
      highlightInputControl(input);
    };

    const handleDrop = (event) => {
      const drawInput = findOpenDrawModalInput();
      if (drawInput && dispatchFiles(drawInput, event.dataTransfer?.files)) {
        event.preventDefault();
        event.stopPropagation();
        clearActiveControl();
        return;
      }

      const input = findTargetedFileInput(event.target);
      if (!input) {
        clearActiveControl();
        return;
      }

      if (!dispatchFiles(input, event.dataTransfer?.files)) {
        clearActiveControl();
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      clearActiveControl();
    };

    const handleDragLeave = (event) => {
      if (!activeControl) return;
      const related = event.relatedTarget;
      if (related instanceof Node && activeControl.contains(related)) return;
      clearActiveControl();
    };

    window.addEventListener('dragover', handleDragOver, true);
    window.addEventListener('drop', handleDrop, true);
    window.addEventListener('dragleave', handleDragLeave, true);
    return () => {
      clearActiveControl();
      window.removeEventListener('dragover', handleDragOver, true);
      window.removeEventListener('drop', handleDrop, true);
      window.removeEventListener('dragleave', handleDragLeave, true);
    };
  }, []);

  return null;
}
