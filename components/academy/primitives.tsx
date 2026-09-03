'use client';

import React from 'react';
import { panels, buttons, semantic, colors } from '@/shared/styles/designTokens';

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
        'rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.5)]',
        className,
      )}
      style={panels.card}
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
  const tones: Record<string, React.CSSProperties> = {
    default: { background: 'var(--glass-bg)', color: semantic.textSecondary, borderColor: 'var(--glass-border)' },
    primary: { background: 'rgba(34,211,238,0.1)', color: colors.primary, borderColor: 'rgba(34,211,238,0.3)' },
    accent: { background: 'rgba(168,85,247,0.1)', color: '#c4b5fd', borderColor: 'rgba(168,85,247,0.3)' },
    warn: { background: 'rgba(245,158,11,0.1)', color: '#fbbf24', borderColor: 'rgba(245,158,11,0.3)' },
  };
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
      )}
      style={tones[tone]}
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
      <h3 className="text-sm font-bold uppercase tracking-wide" style={{ color: semantic.textPrimary }}>{children}</h3>
      {hint && <span className="text-[11px]" style={{ color: semantic.textMuted }}>{hint}</span>}
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
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: 'rgba(34,211,238,0.15)', color: colors.primary, borderColor: 'rgba(34,211,238,0.3)' },
    accent: { background: 'rgba(168,85,247,0.15)', color: '#c4b5fd', borderColor: 'rgba(168,85,247,0.3)' },
    ghost: { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', borderColor: 'var(--border-color)' },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50',
        className,
      )}
      style={variants[variant]}
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
      <span className="mb-1 block text-xs font-semibold" style={{ color: semantic.textPrimary }}>{field.label}</span>
      {input === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={3}
          className="w-full resize-y rounded-lg px-3 py-2 text-sm focus:outline-none"
          style={panels.card}
        />
      ) : (
        <input
          type={input === 'number' ? 'number' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
          style={panels.card}
        />
      )}
      {field.hint && <span className="mt-1 block text-[11px] leading-snug" style={{ color: semantic.textMuted }}>{field.hint}</span>}
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
      className="rounded-md px-2 py-1 text-[11px] font-semibold transition-colors"
      style={buttons.ghost}
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}
