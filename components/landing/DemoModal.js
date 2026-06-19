'use client';
import { useEffect } from 'react';
import DemoStage from './DemoStage';

export default function DemoModal({ feature, onClose }) {
  useEffect(() => {
    const onKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-modal-title"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-[2rem] border border-white/10 bg-[#070707] shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-white/10 bg-[#070707]/90 px-6 py-4 backdrop-blur-xl">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">{feature.eyebrow}</p>
            <h2 id="demo-modal-title" className="text-xl font-black text-white">{feature.label}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-white/70 transition hover:bg-white/[0.08] hover:text-white"
            aria-label="Close demo"
          >
            Close
          </button>
        </div>
        <div className="p-6">
          <DemoStage feature={feature} />
        </div>
      </div>
    </div>
  );
}
