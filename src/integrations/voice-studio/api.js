/**
 * VoiceStudio API base override.
 *
 * The upstream app resolves its API base at import time from:
 *   vendor/VoiceStudio/frontend/src/utils/apiBase.ts
 *   vendor/VoiceStudio/frontend/src/api/client.ts
 *
 * SmartVideo hosts VoiceStudio at /studio/voice and proxies backend calls
 * through /api/voice/* via app/api/voice/[...path]/route.js.
 *
 * We set window.__OMNIVOICE_API_BASE__ before App.jsx loads so client.ts
 * resolves to the proxy instead of window.location.origin.
 */

export function setVoiceStudioApiBase(base) {
  if (typeof window !== 'undefined') {
    window.__OMNIVOICE_API_BASE__ = base;
  }
}

export function resolveVoiceStudioApiBase() {
  if (typeof window !== 'undefined') {
    return window.__OMNIVOICE_API_BASE__;
  }
  return undefined;
}
