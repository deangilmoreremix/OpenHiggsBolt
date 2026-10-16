// @vitest-environment jsdom
//
// Phase 3 regression — branded App Router error boundaries must render
// without throwing and must NOT leak server data, secrets, or stack traces.

import { describe, it, expect, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';

import AppError from '../../app/error';
import GlobalError from '../../app/global-error';

afterEach(() => {
  cleanup();
});

describe('App Router error boundaries (Phase 3)', () => {
  it('app/error.tsx renders a branded customer-facing page with Try again', () => {
    const err = Object.assign(new Error('boom-internal-only-do-not-show'), {
      digest: 'abc123',
    });
    const reset = () => {};
    expect(() => render(<AppError error={err} reset={reset} />)).not.toThrow();

    expect(
      screen.getByRole('heading', { name: /something went wrong/i }),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: /try again/i })).toBeTruthy();
  });

  it('app/error.tsx does NOT render the error message in the DOM', () => {
    const err = Object.assign(new Error('SECRET_TOKEN_DO_NOT_LEAK_42'), {
      digest: 'deadbeef',
    });
    const reset = () => {};
    const { container } = render(<AppError error={err} reset={reset} />);
    expect(container.textContent).not.toContain('SECRET_TOKEN_DO_NOT_LEAK_42');
  });

  it('app/global-error.tsx renders a branded customer-facing page with Try again', () => {
    const err = Object.assign(new Error('boom-internal-only-do-not-show'), {
      digest: 'xyz789',
    });
    const reset = () => {};
    expect(() =>
      render(<GlobalError error={err} reset={reset} />),
    ).not.toThrow();

    expect(
      screen.getByRole('heading', { name: /something went wrong/i }),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: /try again/i })).toBeTruthy();
  });

  it('app/global-error.tsx does NOT render the error message in the DOM', () => {
    const err = Object.assign(new Error('SECRET_TOKEN_DO_NOT_LEAK_99'), {
      digest: 'cafe0000',
    });
    const reset = () => {};
    const { container } = render(<GlobalError error={err} reset={reset} />);
    expect(container.textContent).not.toContain('SECRET_TOKEN_DO_NOT_LEAK_99');
  });
});