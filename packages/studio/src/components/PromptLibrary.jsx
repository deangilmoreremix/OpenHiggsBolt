import { useState } from 'react';
import registry from '../skills/registry.json';

const PROMPT_CATEGORIES = ['visual', 'motion', 'social', 'edit', 'workflow'];

const CATEGORY_LABELS = {
  all: 'All',
  visual: 'Visual',
  motion: 'Motion',
  social: 'Social',
  edit: 'Edit',
  workflow: 'Workflow',
};

function copyToClipboard(text) {
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  }
  return fallbackCopy(text);
}

function fallbackCopy(text) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  } catch (err) {
    /* no-op: copy best effort */
  }
}

export default function PromptLibrary({ apiKey }) {
  const [activeCat, setActiveCat] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  const promptsByCat = registry.prompts || {};
  const presentCats = PROMPT_CATEGORIES.filter((c) => Array.isArray(promptsByCat[c]));

  const allPrompts = presentCats.flatMap((cat) =>
    promptsByCat[cat].map((p) => ({ ...p, category: cat }))
  );

  const filtered =
    activeCat === 'all'
      ? allPrompts
      : allPrompts.filter((p) => p.category === activeCat);

  const tabs = ['all', ...presentCats];

  const handleEnhance = (item) => {
    const key = item.title + '|' + item.category;
    copyToClipboard(item.prompt);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1600);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {tabs.map((cat) => {
          const active = activeCat === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={`rounded-full border px-4 py-1.5 text-sm transition ${
                active
                  ? 'border-[#22d3ee] bg-[#22d3ee]/15 text-[#22d3ee]'
                  : 'border-white/10 bg-black/40 text-white/60 hover:border-white/20 hover:text-white'
              }`}
            >
              {CATEGORY_LABELS[cat] || cat}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item, idx) => {
          const key = item.title + '|' + item.category + '|' + idx;
          const isOpen = expanded === key;
          const isCopied = copiedKey === item.title + '|' + item.category;
          return (
            <div
              key={key}
              className="flex flex-col rounded-lg border border-white/10 bg-black/60 p-4 backdrop-blur transition hover:border-[#22d3ee]/40"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${
                    item.category === 'workflow'
                      ? 'border-purple-400/40 bg-purple-500/15 text-purple-300'
                      : 'border-cyan-400/40 bg-cyan-500/15 text-cyan-300'
                  }`}
                >
                  {item.category}
                </span>
              </div>

              <div className="mt-2">
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/50">
                  {item.model || 'unknown'}
                </span>
              </div>

              <p
                onClick={() => setExpanded(isOpen ? null : key)}
                className={`mt-3 cursor-pointer text-sm text-white/60 ${
                  isOpen ? '' : 'line-clamp-3'
                }`}
              >
                {item.prompt}
              </p>

              {item.params && Object.keys(item.params).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {Object.entries(item.params).map(([k, v]) => (
                    <span
                      key={k}
                      className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-white/40"
                    >
                      {k}: {String(v)}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-auto flex gap-2 pt-4">
                <button
                  onClick={() => setExpanded(isOpen ? null : key)}
                  className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/80 transition hover:border-white/20 hover:text-white"
                >
                  {isOpen ? 'Collapse' : 'Show Full'}
                </button>
                <button
                  onClick={() => handleEnhance(item)}
                  className="flex-1 rounded-md border border-[#22d3ee]/40 bg-[#22d3ee]/10 px-3 py-2 text-sm font-semibold text-[#22d3ee] transition hover:bg-[#22d3ee]/20"
                >
                  {isCopied ? 'Copied!' : 'Enhance'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-white/40">No prompts in this category yet.</p>
      )}
    </div>
  );
}
