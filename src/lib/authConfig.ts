/**
 * Centralized authentication configuration.
 *
 * This module is the single source of truth for MuAPI and OpenAI keys.
 * All studios, modals, and API clients should read/write keys through
 * this module instead of accessing localStorage or cookies directly.
 */

import React from 'react';

// ── Storage / cookie names ──────────────────────────────────────────────────
export const MUAPI_KEY_STORAGE = 'muapi_key';
export const OPENAI_KEY_STORAGE = 'openai_key';
export const MUAPI_KEY_COOKIE = 'muapi_key';
export const OPENAI_KEY_COOKIE = 'openai_key';

// ── Key sanitization ───────────────────────────────────────────────────────
function cleanKey(key: string | null | undefined): string {
  if (!key) return '';
  return String(key)
    .replace(/[\u200B-\u200D\uFEFF\u2060\u00AD]/g, '')
    .replace(/^[\s\u0000-\x1F]+|[\s\u0000-\x1F]+$/g, '')
    .trim();
}

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

// ── Storage helpers ────────────────────────────────────────────────────────
function readStorage(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {
    // localStorage may throw in private mode / sandboxed iframes
  }
  return null;
}

function writeStorage(key: string, value: string | null): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (value === null) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, value);
      }
    }
  } catch {
    // ignore
  }
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
  const storedMuapi = readStorage(MUAPI_KEY_STORAGE);
  const storedOpenai = readStorage(OPENAI_KEY_STORAGE);
  if (storedMuapi) muapiKey = cleanKey(storedMuapi);
  if (storedOpenai) openaiKey = cleanKey(storedOpenai);
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
  writeStorage(MUAPI_KEY_STORAGE, cleaned || null);
  setCookie(MUAPI_KEY_COOKIE, cleaned);
  notifyListeners();
}

export function setOpenAiKey(key: string | null | undefined): void {
  const cleaned = cleanKey(key);
  openaiKey = cleaned;
  writeStorage(OPENAI_KEY_STORAGE, cleaned || null);
  setCookie(OPENAI_KEY_COOKIE, cleaned);
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
    setCookie(MUAPI_KEY_COOKIE, muapiKey);
  }
  if (openaiKey) {
    setCookie(OPENAI_KEY_COOKIE, openaiKey);
  }
}
