/**
 * Centralized authentication configuration.
 *
 * This module is the single source of truth for MuAPI and OpenAI keys.
 * All studios, modals, and API clients should read/write keys through
 * this module instead of accessing localStorage directly.
 *
 * SECURITY (CWE-522): keys are persisted ONLY to localStorage. They are
 * NEVER written to a cookie — a non-HttpOnly cookie is readable by any
 * script running on the page, which turns a transient XSS into durable
 * exfiltration of a live billing key. Server-side persistence uses the
 * encrypted store behind /api/auth/muapi-key instead.
 */

import React from 'react';
import { resolveMuapiKey as resolveMuapiKeyFromStorage, resolveOpenAIKey as resolveOpenAIKeyFromStorage, isValidKeyFormat, MUAPI_KEY_STORAGE, OPENAI_KEY_STORAGE, cleanApiKey } from './keys';

// ── Key sanitization ───────────────────────────────────────────────────────
// cleanApiKey is imported from ./keys as the single source of truth.

// ── Listener model for React consumers ─────────────────────────────────────
type AuthListener = () => void;
const listeners = new Set<AuthListener>();

function notifyListeners(): void {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // ignore listener errors
    }
  });
}

// ── In-memory store (initialized from localStorage on module load) ──────────
let muapiKey = '';
let openaiKey = '';

if (typeof window !== 'undefined') {
  muapiKey = cleanApiKey(resolveMuapiKeyFromStorage());
  openaiKey = cleanApiKey(resolveOpenAIKeyFromStorage());
}

// Test-only reset: clears in-memory state and re-reads from localStorage.
export function __resetAuthConfigForTests(): void {
  muapiKey = '';
  openaiKey = '';
  if (typeof window !== 'undefined') {
    muapiKey = cleanApiKey(resolveMuapiKeyFromStorage());
    openaiKey = cleanApiKey(resolveOpenAIKeyFromStorage());
  }
}

// ── Synchronous getters ────────────────────────────────────────────────────
export function getApiKey(): string {
  return muapiKey;
}

export function getOpenAiKey(): string {
  return openaiKey;
}

// ── Setters (sync to localStorage + notify React) ─────────────────────────
export function setApiKey(key: string | null | undefined): void {
  const cleaned = cleanApiKey(key);
  muapiKey = cleaned;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (cleaned) {
        window.localStorage.setItem(MUAPI_KEY_STORAGE, cleaned);
      } else {
        window.localStorage.removeItem(MUAPI_KEY_STORAGE);
      }
    }
  } catch {
    // ignore
  }
  notifyListeners();
}

export function setOpenAiKey(key: string | null | undefined): void {
  const cleaned = cleanApiKey(key);
  openaiKey = cleaned;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (cleaned) {
        window.localStorage.setItem(OPENAI_KEY_STORAGE, cleaned);
      } else {
        window.localStorage.removeItem(OPENAI_KEY_STORAGE);
      }
    }
  } catch {
    // ignore
  }
  notifyListeners();
}

export function clearApiKey(): void {
  setApiKey(null);
}

export function clearOpenAiKey(): void {
  setOpenAiKey(null);
}

export function clearAllKeys(): void {
  setApiKey(null);
  setOpenAiKey(null);
}

// ── React hook ─────────────────────────────────────────────────────────────
export function useAuthConfig() {
  const [, forceUpdate] = React.useState(0);

  React.useEffect(() => {
    const listener = () => forceUpdate((n) => n + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    apiKey: muapiKey,
    openaiKey: openaiKey,
    setApiKey,
    setOpenAiKey,
    clearApiKey,
    clearOpenAiKey,
    clearAllKeys,
    hasApiKey: Boolean(muapiKey),
    hasOpenAiKey: Boolean(openaiKey),
    isAuthenticated: Boolean(muapiKey),
  };
}
