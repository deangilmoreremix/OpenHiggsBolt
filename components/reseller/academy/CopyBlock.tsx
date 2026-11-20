'use client';

import React, { useState } from 'react';
import { colors, semantic } from '@/shared/styles/designTokens';

/**
 * Patterns that look like real credentials. A CopyBlock refuses to display or
 * copy a value that matches, so a mistake in content can never ship a secret.
 * Bare prefixes like `sk_test_` (no key body) are allowed because lessons
 * explain how to recognise key types.
 */
const SECRET_PATTERNS: RegExp[] = [
  /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{10,}/,
  /\bwhsec_[A-Za-z0-9]{10,}/,
  /\beyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}/, // JWT
  /\bpostgres(?:ql)?:\/\/[^\s:@/]+:[^\s@/<>[\]]{4,}@/, // connection string with an inline password
  /\bGOCSPX-[A-Za-z0-9_-]{10,}/,
  /\bghp_[A-Za-z0-9]{20,}/,
];

export function looksSecret(value: string): boolean {
  return SECRET_PATTERNS.some((re) => re.test(value));
}

export function CopyBlock({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  if (looksSecret(value)) {
    return (
      <p role="alert" className="mt-2 rounded-lg px-3 py-2 text-xs" style={{ background: semantic.errorBg, color: semantic.error }}>
        This snippet was hidden because it looks like a secret. Never paste real keys into the course.
      </p>
    );
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="mt-2 overflow-hidden rounded-lg border" style={{ borderColor: 'var(--glass-border)', background: '#0a0a0a' }}>
      <div className="flex items-center justify-between gap-2 border-b px-3 py-1.5" style={{ borderColor: 'var(--glass-border)' }}>
        <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: semantic.textLabel }}>{label}</span>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${label}`}
          className="rounded px-2 py-0.5 text-[11px] font-semibold"
          style={{ color: colors.primary, background: 'rgba(34,211,238,0.1)' }}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap break-words px-3 py-2 font-mono text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>{value}</pre>
    </div>
  );
}
