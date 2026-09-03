import { isValidKeyFormat } from '../lib/keys.js';
import { t } from '../lib/i18n.js';

// Build the muapi_key cookie string. `Secure` is added only over HTTPS
// so the key still persists on http://localhost dev servers.
function muapiCookie(value) {
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
  if (value) {
    return `muapi_key=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax${secure}`;
  }
  return `muapi_key=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secure}`;
}

export function AuthModal(onSuccess) {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-6';

    const modal = document.createElement('div');
    modal.className = 'w-full max-w-md bg-panel-bg border border-white/10 rounded-3xl p-8 shadow-3xl animate-fade-in-up';

    modal.innerHTML = `
        <div class="flex flex-col items-center text-center mb-8">
            <div class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-glow mb-6">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="2">
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3m-3-3l-2.25-2.25"/>
                </svg>
            </div>
            <h2 class="text-2xl font-black text-white uppercase tracking-wider mb-2">${t('auth.title')}</h2>
            <p class="text-secondary text-sm">${t('auth.subtitle')}</p>
        </div>

        <div class="space-y-6">
            <div class="space-y-2">
                <label class="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">${t('auth.keyLabel')}</label>
                <input
                    type="password"
                    id="muapi-key-input"
                    placeholder="${t('auth.keyPlaceholder')}"
                    class="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
                >
                <p class="text-[11px] text-muted ml-1">${t('auth.keyNote')}</p>
            </div>

            <div class="flex flex-col gap-3">
                <button id="save-key-btn" class="w-full bg-primary text-black font-black py-4 rounded-2xl hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all">
                    ${t('auth.initBtn')}
                </button>
                <a href="https://muapi.ai/access-keys" target="_blank" rel="noreferrer" class="text-center text-[11px] font-bold text-muted hover:text-white transition-colors py-2 uppercase tracking-tighter">
                    ${t('auth.createKey')}
                </a>
            </div>
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const input = modal.querySelector('#muapi-key-input');
    const btn = modal.querySelector('#save-key-btn');

    btn.onclick = () => {
        const key = input.value.trim();
        if (key && isValidKeyFormat(key)) {
            // Clean key before saving to remove invisible Unicode characters
            const cleanedKey = key
                .replace(/[\u200B-\u200D\uFEFF\u2060\u00AD]/g, '')
                .replace(/^[\s\u0000-\x1F]+|[\s\u0000-\x1F]+$/g, '')
                .trim();

            // Persist key server-side via the encrypted key store.
            fetch('/api/auth/muapi-key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: cleanedKey }),
                credentials: 'same-origin',
            })
            .then((r) => r.json())
            .then((data) => {
                if (!data.ok) {
                    throw new Error(data.error || 'Failed to save key');
                }
                // Sync cookie so server-side routes and agents pages can read the key.
                document.cookie = muapiCookie(cleanedKey);
                document.body.removeChild(overlay);
                if (onSuccess) onSuccess();
            })
            .catch((err) => {
                alert(err.message || 'Failed to save API key');
            });
        } else {
            input.classList.add('border-red-500/50');
            // Show specific error message for format issues
            if (key && !isValidKeyFormat(key)) {
                alert('Please enter a valid API key (at least 8 characters, no surrounding quotes).');
            }
            setTimeout(() => input.classList.remove('border-red-500/50'), 2000);
        }
    };

    return overlay;
}
