'use client';

// App Router error boundary for the root layout segment.
//
// Customer-facing only. We deliberately do NOT print or leak:
//   * server data, environment variables, secrets or API keys
//   * stack traces
//   * query parameters or route names that could expose PII
//
// The `error` and `reset` props are provided by Next.js App Router; we never
// render `error.message` or `error.stack` to the page so internal details
// stay out of the UI.

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Best-effort, safe logging — we intentionally do NOT include error.message
    // here because it can contain user-controlled data or internal identifiers.
    if (typeof console !== 'undefined' && error?.digest) {
      console.error('App error boundary tripped (digest only):', error.digest);
    }
  }, [error]);

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        role="alert"
        aria-live="assertive"
        style={{
          maxWidth: 520,
          textAlign: 'center',
          backgroundColor: '#0a0a0a',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16,
          padding: '32px 24px',
        }}
      >
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            margin: '0 0 12px',
            color: '#22d3ee',
          }}
        >
          Something went wrong
        </h1>
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.5,
            color: 'rgba(255,255,255,0.7)',
            margin: '0 0 24px',
          }}
        >
          We hit an unexpected problem rendering this page. Your work and
          account are safe — please try again. If the problem keeps happening,
          head back to the home page.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              backgroundColor: '#22d3ee',
              color: '#000000',
              border: 'none',
              borderRadius: 8,
              padding: '10px 18px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
          <a
            href="/"
            style={{
              backgroundColor: 'rgba(255,255,255,0.06)',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              padding: '10px 18px',
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}