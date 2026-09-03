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

function imageFiles(files) {
  return Array.from(files || []).filter((file) => file.type?.startsWith('image/'));
}

export default function GlobalModalDropBridge() {
  useEffect(() => {
    const handleDragOver = (event) => {
      const input = findOpenDrawModalInput();
      if (!input || !event.dataTransfer?.types?.includes('Files')) return;
      event.preventDefault();
      event.stopPropagation();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    };

    const handleDrop = (event) => {
      const input = findOpenDrawModalInput();
      if (!input) return;
      const files = imageFiles(event.dataTransfer?.files);
      if (!files.length) return;

      event.preventDefault();
      event.stopPropagation();

      const transfer = new DataTransfer();
      transfer.items.add(files[0]);
      input.files = transfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    };

    window.addEventListener('dragover', handleDragOver, true);
    window.addEventListener('drop', handleDrop, true);
    return () => {
      window.removeEventListener('dragover', handleDragOver, true);
      window.removeEventListener('drop', handleDrop, true);
    };
  }, []);

  return null;
}
