'use client';

import React from 'react';

/* Shared Academy UI primitives — dark, on-brand with SmartVideo GO
   (primary cyan #22d3ee, near-black surfaces). No external deps. */

export const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(' ');

export function AcademyCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cx(
        'rounded-2xl border border-white/10 bg-[#0a0a0a] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.5)]',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Pill({
  children,
  tone = 'default',
}: {
  children: React.ReactNode;
  tone?: 'default' | 'primary' | 'accent' | 'warn';
}) {
  const tones: Record<string, string> = {
    default: 'bg-white/5 text-white/60 border-white/10',
    primary: 'bg-[#22d3ee]/10 text-[#22d3ee] border-[#22d3ee]/30',
    accent: 'bg-[#a855f7]/10 text-[#c4b5fd] border-[#a855f7]/30',
    warn: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  };
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function SectionTitle({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h3 className="text-sm font-bold uppercase tracking-wide text-white/70">{children}</h3>
      {hint && <span className="text-[11px] text-white/40">{hint}</span>}
    </div>
  );
}

export function ActionButton({
  children,
  onClick,
  variant = 'primary',
  className,
  type = 'button',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'ghost' | 'accent';
  className?: string;
  type?: 'button' | 'submit';
}) {
  const variants: Record<string, string> = {
    primary:
      'bg-[#22d3ee]/15 text-[#22d3ee] border border-[#22d3ee]/30 hover:bg-[#22d3ee]/25',
    accent:
      'bg-[#a855f7]/15 text-[#c4b5fd] border border-[#a855f7]/30 hover:bg-[#a855f7]/25',
    ghost:
      'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50',
        variants[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function SparkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
    </svg>
  );
}

export function TextField({
  field,
  value,
  onChange,
}: {
  field: { key: string; label: string; placeholder?: string; hint?: string; input?: string };
  value: string;
  onChange: (v: string) => void;
}) {
  const input = field.input ?? 'text';
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-white/70">{field.label}</span>
      {input === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={3}
          className="w-full resize-y rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#22d3ee]/50 focus:outline-none"
        />
      ) : (
        <input
          type={input === 'number' ? 'number' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#22d3ee]/50 focus:outline-none"
        />
      )}
      {field.hint && <span className="mt-1 block text-[11px] leading-snug text-white/40">{field.hint}</span>}
    </label>
  );
}

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-semibold text-white/60 hover:bg-white/10 hover:text-white"
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}
