import { openExternal } from '../lib/electron.js';

export function BrandStudio() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col items-center justify-center bg-app-bg gap-4';
  container.innerHTML = `
    <div class="text-center">
      <p class="text-xl font-bold text-white mb-2">Brand Studio</p>
      <p class="text-sm text-white/50 mb-6">Open the web app to use Brand Studio.</p>
      <button id="open-brand-studio" class="px-4 py-2 rounded-lg bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition-colors">
        Open Brand Studio
      </button>
    </div>
  `;

  container.querySelector('#open-brand-studio')?.addEventListener('click', () => {
    const url = `${window.location.origin}/brand-studio`;
    if (typeof openExternal === 'function') {
      openExternal(url);
    } else {
      window.open(url, '_blank');
    }
  });

  return container;
}
