import React from 'react';

export default function TemplateBanner({ isApplied, onClear, label = 'Template loaded' }) {
  if (!isApplied) return null;
  return (
    <div className="flex items-center justify-between rounded-xl bg-[#22d3ee]/10 border border-[#22d3ee]/20 px-3 py-2 text-xs text-[#22d3ee]">
      <span className="font-semibold">{label}</span>
      <button
        type="button"
        onClick={onClear}
        className="rounded-md bg-white/5 px-2 py-1 text-[11px] font-bold text-white/80 hover:text-white hover:bg-white/10 transition-colors"
      >
        Clear
      </button>
    </div>
  );
}
