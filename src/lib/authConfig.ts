/**
 * Centralized authentication configuration.
 *
 * This module is the single source of truth for MuAPI and OpenAI keys.
 * All studios, modals, and API clients should read/write keys through
 * this module instead of accessing localStorage or cookies directly.
 */

import React from 'react';
import { resolveMuapiKey as resolveMuapiKeyFromStorage, resolveOpenAIKey as resolveOpenAIKeyFromStorage, isValidKeyFormat, MUAPI_KEY_STORAGE, OPENAI_KEY_STORAGE } from './keys';

export const MUAPI_KEY_COOKIE = 'muapi_key';
export const OPENAI_KEY_COOKIE = 'openai_key';

// ── Cookie helpers ─────────────────────────────────────────────────────────
function buildCookie(name: string, value: string): string {
  const isHttps =
    typeof window !== 'undefined' &&
    window.location &&
    window.location.protocol === 'https:';
  const secure = isHttps ? '; Secure' : '';
  if (value) {
    return `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax${secure}`;
  }
  return `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secure}`;
}

function setCookie(name: string, value: string | null | undefined): void {
  if (typeof window === 'undefined') return;
  document.cookie = buildCookie(name, value || '');
}

// ── Key sanitization ───────────────────────────────────────────────────────
function cleanKey(key: string | null | undefined): string {
  if (!key) return '';
  return String(key)
    .replace(/[\u200B-\u200D\uFEFF\u2060\u00AD]/g, '')
    .replace(/^[\s\u0000-\x1F]+|[\s\u0000-\x1F]+$/g, '')
    .trim();
}

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
  muapiKey = cleanKey(resolveMuapiKeyFromStorage());
  openaiKey = cleanKey(resolveOpenAIKeyFromStorage());
  // Sync pre-existing keys to cookies so server-side routes can read them.
  if (muapiKey) setCookie(MUAPI_KEY_COOKIE, muapiKey);
  if (openaiKey) setCookie(OPENAI_KEY_COOKIE, openaiKey);
}

// Test-only reset: clears in-memory state and re-reads from localStorage.
export function __resetAuthConfigForTests(): void {
  muapiKey = '';
  openaiKey = '';
  if (typeof window !== 'undefined') {
    muapiKey = cleanKey(resolveMuapiKeyFromStorage());
    openaiKey = cleanKey(resolveOpenAIKeyFromStorage());
    // Sync pre-existing keys to cookies so tests can verify cookie initialization.
    if (muapiKey) setCookie(MUAPI_KEY_COOKIE, muapiKey);
    if (openaiKey) setCookie(OPENAI_KEY_COOKIE, openaiKey);
  }
}

// ── Synchronous getters ────────────────────────────────────────────────────
export function getApiKey(): string {
  return muapiKey;
}

export function getOpenAiKey(): string {
  return openaiKey;
}

// ── Setters (sync to localStorage + cookies + notify React) ────────────────
export function setApiKey(key: string | null | undefined): void {
  const cleaned = cleanKey(key);
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
  setCookie(MUAPI_KEY_COOKIE || 'muapi_key', cleaned);
  notifyListeners();
}

export function setOpenAiKey(key: string | null | undefined): void {
  const cleaned = cleanKey(key);
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
  setCookie(OPENAI_KEY_COOKIE || 'openai_key', cleaned);
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

// ── Initialize cookies on module load if keys are already present ───────────
if (typeof window !== 'undefined') {
  if (muapiKey) {
    setCookie('muapi_key', muapiKey);
  }
  if (openaiKey) {
    setCookie('openai_key', openaiKey);
  }
}
