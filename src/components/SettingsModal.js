import { LocalModelManager } from './LocalModelManager.js';
import { isLocalAIAvailable } from '../lib/localInferenceClient.js';
import { isValidKeyFormat } from '../lib/keys.js';
import { t } from '../lib/i18n.js';
import { MUAPI_KEY_STORAGE, OPENAI_KEY_STORAGE, isValidKeyFormat } from '../lib/keys.js';

// Build a cookie string for the MuAPI key. `Secure` is added only over HTTPS
// so the key still persists on http://localhost dev servers.
function muapiCookie(value) {
  const isHttps = typeof window !== 'undefined' && window.location && window.location.protocol === 'https:';
  const secure = isHttps ? '; Secure' : '';
  if (value) {
    return `muapi_key=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax${secure}`;
  }
  return `muapi_key=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secure}`;
}

// Same shape as muapiCookie but for the user's OpenAI key.
function openaiCookie(value) {
  const isHttps = typeof window !== 'undefined' && window.location && window.location.protocol === 'https:';
  const secure = isHttps ? '; Secure' : '';
  if (value) {
    return `openai_key=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax${secure}`;
  }
  return `openai_key=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secure}`;
}

export function SettingsModal(onClose) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:100;';

    const modal = document.createElement('div');
    modal.style.cssText = 'background:var(--bg-card,#111);border-radius:1rem;border:1px solid rgba(255,255,255,0.08);width:min(90vw,36rem);max-height:85vh;display:flex;flex-direction:column;overflow:hidden;';

    // ── Header ────────────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid rgba(255,255,255,0.06);flex-shrink:0;';
    header.innerHTML = `
        <h2 style="font-size:1rem;font-weight:800;color:#fff;margin:0;">${t('settings.title')}</h2>
        <button id="settings-close-btn" style="color:rgba(255,255,255,0.4);background:none;border:none;cursor:pointer;padding:4px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
    `;
    modal.appendChild(header);

    // ── Tabs ──────────────────────────────────────────────────────────────────
    const TABS = [
        { id: 'api', label: t('settings.apiKey') },
        ...(isLocalAIAvailable() ? [{ id: 'local', label: t('settings.localModels') }] : []),
    ];

    let activeTab = 'api';

    const tabBar = document.createElement('div');
    tabBar.style.cssText = 'display:flex;gap:0.25rem;padding:0.75rem 1.5rem 0;border-bottom:1px solid rgba(255,255,255,0.06);flex-shrink:0;';

    const tabBtns = {};
    TABS.forEach(({ id, label }) => {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.style.cssText = 'padding:0.4rem 0.75rem;border-radius:0.5rem 0.5rem 0 0;font-size:0.75rem;font-weight:700;border:none;cursor:pointer;transition:all 0.15s;';
        btn.onclick = () => switchTab(id);
        tabBtns[id] = btn;
        tabBar.appendChild(btn);
    });
    modal.appendChild(tabBar);

    // ── Body ──────────────────────────────────────────────────────────────────
    const body = document.createElement('div');
    body.style.cssText = 'flex:1;overflow-y:auto;padding:1.5rem;';
    modal.appendChild(body);

    // ── Tab: API Key ──────────────────────────────────────────────────────────
    const apiPanel = document.createElement('div');
    apiPanel.innerHTML = `
        <div id="settings-status" style="display:none;padding:0.5rem 0.75rem;border-radius:0.5rem;font-size:0.75rem;font-weight:600;"></div>
        <div style="display:flex;flex-direction:column;gap:0.75rem;">
            <div>
                <label style="display:block;font-size:0.75rem;color:rgba(255,255,255,0.5);margin-bottom:0.4rem;font-weight:600;">${t('settings.muapiKeyLabel')}</label>
                <input id="settings-api-key" type="password" autocomplete="off"
                    style="width:100%;box-sizing:border-box;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:0.75rem;padding:0.6rem 0.9rem;color:#fff;font-size:0.875rem;outline:none;"
                    placeholder="${t('settings.keyPlaceholder')}">
            </div>
            <div>
                <label style="display:block;font-size:0.75rem;color:rgba(255,255,255,0.5);margin-bottom:0.4rem;font-weight:600;">${t('settings.openaiKeyLabel')}</label>
                <input id="settings-openai-key" type="password" autocomplete="off"
                    style="width:100%;box-sizing:border-box;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:0.75rem;padding:0.6rem 0.9rem;color:#fff;font-size:0.875rem;outline:none;"
                    placeholder="${t('settings.openaiKeyPlaceholder')}">
            </div>
            <div>
                <label style="display:block;font-size:0.75rem;color:rgba(255,255,255,0.5);margin-bottom:0.4rem;font-weight:600;">${t('settings.openaiKeyLabel')}</label>
                <input id="settings-openai-key" type="password"
                    style="width:100%;box-sizing:border-box;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:0.75rem;padding:0.6rem 0.9rem;color:#fff;font-size:0.875rem;outline:none;"
                    placeholder="${t('settings.openaiKeyPlaceholder')}"
                    value="${localStorage.getItem('openai_key') || ''}">
            </div>
            <p style="font-size:0.7rem;color:rgba(255,255,255,0.3);margin:0;">
                ${t('settings.keyNote')}
            </p>
            <p id="settings-status" style="font-size:0.7rem;color:#f87171;margin:0;min-height:0.9rem;"></p>
            <div style="display:flex;justify-content:flex-end;gap:0.5rem;margin-top:0.5rem;">
                <button id="settings-cancel-btn" style="padding:0.5rem 1rem;border-radius:0.5rem;background:none;border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.6);font-size:0.75rem;font-weight:700;cursor:pointer;">${t('common.cancel')}</button>
                <button id="settings-save-btn" style="padding:0.5rem 1rem;border-radius:0.5rem;background:var(--color-primary,#22d3ee);color:#000;font-size:0.75rem;font-weight:700;cursor:pointer;border:none;">${t('common.save')}</button>
            </div>
        </div>
    `;

    // ── Tab: Local Models ─────────────────────────────────────────────────────
    const localPanel = LocalModelManager();

    // ── Tab switching ─────────────────────────────────────────────────────────
    const switchTab = (id) => {
        activeTab = id;
        body.innerHTML = '';

        TABS.forEach(({ id: tid }) => {
            const btn = tabBtns[tid];
            if (tid === id) {
                btn.style.background = 'rgba(255,255,255,0.08)';
                btn.style.color = '#fff';
            } else {
                btn.style.background = 'transparent';
                btn.style.color = 'rgba(255,255,255,0.4)';
            }
        });

        if (id === 'api') body.appendChild(apiPanel);
        if (id === 'local') body.appendChild(localPanel);
    };

    switchTab('api');

    // Seed existing values via .value (not the HTML string) to avoid breaking
    // the attribute if a stored key contains quotes.
    apiPanel.querySelector('#settings-api-key').value = localStorage.getItem('muapi_key') || '';
    apiPanel.querySelector('#settings-openai-key').value = localStorage.getItem('openai_key') || '';

    // ── API key save/cancel handlers ──────────────────────────────────────────
    const close = () => {
        if (document.body.contains(overlay)) document.body.removeChild(overlay);
        if (onClose) onClose();
    };

    const setMuapiCookie = (key) => {
        // Mirror StandaloneShell: persist the MuAPI key as a cookie so the
        // server-side /api/* proxy routes (which resolve the key from the
        // x-api-key header OR the muapi_key cookie) can authenticate requests.
        document.cookie = `muapi_key=${encodeURIComponent(key)}; path=/; max-age=31536000; SameSite=Lax`;
    };

    apiPanel.querySelector('#settings-cancel-btn').onclick = close;
    apiPanel.querySelector('#settings-save-btn').onclick = () => {
        const muapiKey = apiPanel.querySelector('#settings-api-key').value.trim();
        const openaiKey = apiPanel.querySelector('#settings-openai-key').value.trim();
        const statusEl = apiPanel.querySelector('#settings-status');
        if (!muapiKey || !isValidKeyFormat(muapiKey)) {
            if (statusEl) {
                statusEl.style.display = 'block';
                statusEl.style.background = 'rgba(239,68,68,0.1)';
                statusEl.style.color = '#fca5a5';
                statusEl.textContent = 'Please enter a valid MuAPI key (at least 8 characters, no surrounding quotes).';
            }
            return;
        }
        if (openaiKey && !isValidKeyFormat(openaiKey)) {
            if (statusEl) {
                statusEl.style.display = 'block';
                statusEl.style.background = 'rgba(239,68,68,0.1)';
                statusEl.style.color = '#fca5a5';
                statusEl.textContent = 'Please enter a valid OpenAI key (at least 8 characters, no surrounding quotes).';
            }
            return;
        }
        if (statusEl) {
            statusEl.style.display = 'none';
        }
        // Clean keys before saving to remove invisible Unicode characters
        const cleanMuapi = muapiKey
            .replace(/[\u200B-\u200D\uFEFF\u2060\u00AD]/g, '')
            .replace(/^[\s\u0000-\x1F]+|[\s\u0000-\x1F]+$/g, '')
            .trim();
        const cleanOpenai = openaiKey
            .replace(/[\u200B-\u200D\uFEFF\u2060\u00AD]/g, '')
            .replace(/^[\s\u0000-\x1F]+|[\s\u0000-\x1F]+$/g, '')
            .trim();
        localStorage.setItem('muapi_key', cleanMuapi);
        if (cleanOpenai) {
            localStorage.setItem('openai_key', cleanOpenai);
        } else {
            localStorage.removeItem('openai_key');
        }
        // Sync cookies so server-side routes and agents pages can read the key.
        document.cookie = muapiCookie(cleanMuapi);
        if (cleanOpenai) {
            document.cookie = openaiCookie(cleanOpenai);
        } else {
            document.cookie = openaiCookie('');
        }
        // Success feedback: flash the button text
        const saveBtn = apiPanel.querySelector('#settings-save-btn');
        const originalText = saveBtn.textContent;
        saveBtn.textContent = '✓ Saved';
        saveBtn.style.background = '#22c55e';
        setTimeout(() => {
            saveBtn.textContent = originalText;
            saveBtn.style.background = 'var(--color-primary,#22d3ee)';
            close();
        }, 600);
    };

    header.querySelector('#settings-close-btn').onclick = close;
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    overlay.appendChild(modal);
    return overlay;
}
