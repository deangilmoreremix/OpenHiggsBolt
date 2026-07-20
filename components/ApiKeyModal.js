'use client';

import { useState } from 'react';

export default function ApiKeyModal({
  onSave,
  onClose,
  overlay = false,
  title,
  subtitle,
  error: externalError,
  loading = false,
}) {
  const [muapiKey, setMuapiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [error, setError] = useState('');

  // Prefer an externally-supplied error (e.g. server/validation rejection from
  // the parent's save handler) over the local "empty field" error.
  const displayError = externalError || error;

  const handleSubmit = (e) => {
    e.preventDefault();
    const m = muapiKey.trim();
    if (!m) { setError('Please enter your MuAPI key'); return; }
    if (!openaiKey.trim()) { setError('Please enter your OpenAI key'); return; }
    onSave(m, openaiKey);
  };

  // On short viewports the card can be taller than the screen. Use vertical
  // padding + overflow-y-auto so it stays fully visible (including the X button)
  // and becomes scrollable instead of being clipped at the top/bottom.
  const wrapperClass = overlay
    ? 'fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4 py-6 overflow-y-auto font-inter animate-fade-in-up'
    : 'min-h-screen bg-[#030303] flex items-center justify-center px-4 py-6 overflow-y-auto font-inter';

  const inputClass =
    'w-full bg-white/5 border border-white/[0.03] rounded-md px-5 py-3 text-sm text-white placeholder:text-white/10 focus:outline-none focus:ring-1 focus:ring-[#22d3ee]/30 focus:bg-white/[0.07] transition-all disabled:opacity-60';

  const labelClass = 'block text-xs font-bold text-white/30 ml-1';

  return (
    <div className={wrapperClass}>
      <div className="w-full max-w-sm flex-shrink-0 my-auto bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 rounded-xl p-8 sm:p-10 shadow-2xl relative">
        {overlay && onClose && (
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
            className="absolute top-3 right-3 w-8 h-8 rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center z-10 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 bg-[#22d3ee]/5 rounded-2xl flex items-center justify-center border border-[#22d3ee]/10 mb-5 group hover:border-[#22d3ee]/30 transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="1.5" className="group-hover:scale-110 transition-transform">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L12 17.25l-4.5-4.5L15.5 7.5z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight mb-2">
            {title || 'SmartVideo GO'}
          </h1>
          <p className="text-white/40 text-[13px] leading-relaxed px-4">
            {subtitle || (
              <>Enter your <a href="https://muapi.ai/access-keys" target="_blank" rel="noreferrer" className="text-[#22d3ee] hover:text-[#e5ff33] transition-colors">Muapi.ai</a> and <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-[#22d3ee] hover:text-[#e5ff33] transition-colors">OpenAI</a> API keys to start creating</>
            )}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className={labelClass}>MuAPI Access Key</label>
            <input
              type="password"
              value={muapiKey}
              onChange={(e) => { setMuapiKey(e.target.value); setError(''); }}
              placeholder="Paste your MuAPI key here..."
              disabled={loading}
              className={inputClass}
              suppressHydrationWarning
            />
          </div>

          <div className="space-y-2">
            <label className={labelClass}>OpenAI API Key</label>
            <input
              type="password"
              value={openaiKey}
              onChange={(e) => { setOpenaiKey(e.target.value); setError(''); }}
              placeholder="sk-... (OpenAI key)"
              disabled={loading}
              className={inputClass}
              suppressHydrationWarning
            />
          </div>

          {displayError && <p className="mt-2 text-red-500/80 text-[11px] font-medium ml-1">{displayError}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#22d3ee] text-black font-medium py-2.5 rounded-md hover:bg-[#e5ff33] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-[#22d3ee]/5 disabled:opacity-70 disabled:cursor-wait disabled:hover:bg-[#22d3ee] disabled:hover:scale-100 flex items-center justify-center gap-2"
            suppressHydrationWarning
          >
            {loading && (
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            )}
            {loading ? 'Verifying keys…' : 'Get Started'}
          </button>

          <p className="text-center text-[12px] text-white/20 pt-2">
            Need a key?{' '}
            <a href="https://muapi.ai/access-keys" target="_blank" rel="noreferrer" className="text-white/40 hover:text-[#22d3ee] transition-colors font-medium">
              MuAPI
            </a>
            {' · '}
            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-white/40 hover:text-[#22d3ee] transition-colors font-medium">
              OpenAI
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
