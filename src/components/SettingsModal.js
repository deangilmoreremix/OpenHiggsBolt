import { LocalModelManager } from './LocalModelManager.js';
import { isLocalAIAvailable } from '../lib/localInferenceClient.js';
import {
  MUAPI_KEY_STORAGE,
  OPENAI_KEY_STORAGE,
  isValidKeyFormat,
  MUAPI_KEY_API_ENDPOINT,
  MUAPI_KEY_COOKIE,
  OPENAI_KEY_COOKIE,
  cleanApiKey,
} from '../lib/keys.js';
import { buildCookie } from '../lib/authConfig.ts';
import { t } from '../lib/i18n.js';

// Canonical OpenAI key API endpoint for the Vite SPA.
const OPENAI_KEY_API = '/api/auth/openai-key';

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
          <p style="font-size:0.7rem;color:rgba(255,255,255,0.3);margin:0;">
              ${t('settings.keyNote')}
          </p>
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

  // Load existing values from the server-side key store.
  fetch(MUAPI_KEY_API_ENDPOINT, { credentials: 'same-origin' })
    .then((r) => r.json())
    .then((data) => {
      apiPanel.querySelector('#settings-api-key').value = data.key || '';
      apiPanel.querySelector('#settings-openai-key').value = data.openaiKey || '';
    })
    .catch(() => {
      apiPanel.querySelector('#settings-api-key').value = '';
      apiPanel.querySelector('#settings-openai-key').value = '';
    });

  // ── API key save/cancel handlers ──────────────────────────────────────────
  const close = () => {
      if (document.body.contains(overlay)) document.body.removeChild(overlay);
      if (onClose) onClose();
  };

  const showStatus = (text, isError = true) => {
      const el = apiPanel.querySelector('#settings-status');
      if (!el) return;
      el.style.display = 'block';
      el.style.background = isError ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)';
      el.style.color = isError ? '#fca5a5' : '#86efac';
      el.textContent = text;
  };

  const hideStatus = () => {
      const el = apiPanel.querySelector('#settings-status');
      if (el) el.style.display = 'none';
  };

  apiPanel.querySelector('#settings-cancel-btn').onclick = close;
  apiPanel.querySelector('#settings-save-btn').onclick = async () => {
      const muapiInput = apiPanel.querySelector('#settings-api-key').value.trim();
      const openaiInput = apiPanel.querySelector('#settings-openai-key').value.trim();
      const statusEl = apiPanel.querySelector('#settings-status');

      hideStatus();

      // ── Validate formats ─────────────────────────────────────────────────────
      if (muapiInput && !isValidKeyFormat(muapiInput)) {
          showStatus('Please enter a valid MuAPI key (at least 8 characters, no surrounding quotes).');
          return;
      }
      if (openaiInput && !isValidKeyFormat(openaiInput)) {
          showStatus('Please enter a valid OpenAI key (at least 8 characters, no surrounding quotes).');
          return;
      }

      const cleanMuapi = cleanApiKey(muapiInput);
      const cleanOpenai = cleanApiKey(openaiInput);
      let openaiWarning = null;

      try {
          // ── Persist MuAPI server-side (only when provided) ─────────────────────
          if (cleanMuapi) {
              const muRes = await fetch(MUAPI_KEY_API_ENDPOINT, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ key: cleanMuapi }),
                  credentials: 'same-origin',
              });
              const muData = await muRes.json();
              if (!muRes.ok || !muData.ok) {
                  throw new Error(muData.error || 'Failed to save MuAPI key');
              }
          }

          // ── Persist OpenAI server-side (only when provided) ────────────────────
          if (cleanOpenai) {
              const oaRes = await fetch(OPENAI_KEY_API, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ openaiKey: cleanOpenai }),
                  credentials: 'same-origin',
              });
              const oaData = await oaRes.json();
              if (!oaRes.ok || !oaData.ok) {
                  throw new Error(oaData.error || 'Failed to save OpenAI key');
              }
              if (oaData.warning) {
                  openaiWarning = oaData.warning;
              }
          }

          // ── Server accepted: now update localStorage + cookies ─────────────────
          // Only write non-empty values; never remove a key just because its
          // field is blank. Explicit removal is handled by the dedicated
          // Remove button in the Next.js shell, not by blanking a field here.
          try {
              if (typeof window !== 'undefined' && window.localStorage) {
                  if (cleanMuapi) {
                      window.localStorage.setItem(MUAPI_KEY_STORAGE, cleanMuapi);
                  }
                  if (cleanOpenai) {
                      window.localStorage.setItem(OPENAI_KEY_STORAGE, cleanOpenai);
                  }
              }
          } catch {
              // ignore localStorage write errors (private mode, etc.)
          }

          if (cleanMuapi) {
              document.cookie = buildCookie(MUAPI_KEY_COOKIE, cleanMuapi);
          }
          if (cleanOpenai) {
              document.cookie = buildCookie(OPENAI_KEY_COOKIE, cleanOpenai);
          }

          // Success feedback. Preserve any OpenAI provider warning instead of
          // overwriting it with a generic success message.
          if (openaiWarning) {
              showStatus(openaiWarning, false);
          } else {
              showStatus('✓ Keys saved', false);
          }
          setTimeout(() => {
              close();
          }, 600);
      } catch (err) {
          showStatus(err?.message || 'Failed to save keys. Please try again.');
      }
  };

  header.querySelector('#settings-close-btn').onclick = close;
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  overlay.appendChild(modal);
  return overlay;
}
