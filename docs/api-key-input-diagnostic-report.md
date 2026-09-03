# API Key Input Issues — Diagnostic Report

**Date:** 2026-08-27
**Scope:** Client-side API key input, validation, persistence, and consumption across all studios.

---

## 1. Executive Summary

Analysis of the codebase reveals **seven distinct technical issues** in the API key input flow. The most critical are:

- **Silent key corruption** via an overly aggressive `cleanKey()` regex that strips non-Latin1 bytes (including invisible Unicode characters users may accidentally copy).
- **Key not persisted** when entered through the VFX Studio's `ApiKeyModal` — it is only held in React state and lost on refresh.
- **No user feedback** on successful key save in the Settings modal.
- **Race condition** between state update and generation call in the VFX Studio bottom input bar.
- **Inconsistent validation** — a central `isValidKeyFormat()` helper exists but is unused by most input components.

These issues explain common user complaints: *"my key doesn't work,"* *"I have to re-enter my key every time,"* and *"the app says unauthorized but my key is correct."*

---

## 2. Issue Catalog

### 2.1 🔴 CRITICAL — `cleanKey()` Silently Corrupts Keys

| Field | Value |
|-------|-------|
| **Location** | `src/lib/muapi.js:639`, `src/shared/api/muapiImage.ts:180`, `src/shared/api/vfx.ts:50` |
| **Function** | `cleanKey(apiKey)` |
| **Current code** | `String(apiKey \|\| '').replace(/[^\u0000-\u00FF]/g, '').trim()` |

**Problem**

The regex `/[^\u0000-\u00FF]/g` removes **every character outside the Latin1 block**. This includes:

- Zero-width spaces (`U+200B`, `U+FEFF`/`BOM`) — commonly injected by web dashboards when users copy
- Non-ASCII printable characters that could legitimately appear in future key formats
- Already-truncated output when the source key contained such characters (information loss with no warning)

**User-facing symptom**

> User copies key from MuAPI dashboard → invisible Unicode character is included → `cleanKey()` strips part of the key → API returns `401 Unauthorized` → user sees generic "Invalid API key" error → user re-copies the *same* visible key, which still fails because the corruption is silent.

**Why the visible key looks correct:** The stripped characters are invisible in most text editors and the browser's password input, so `.value.trim()` in the UI shows what the user *expects* — but the header sent to the API is different.

**Fix:** Replace the aggressive regex with a targeted strip of only *known-problematic* invisible characters.

---

### 2.2 🔴 CRITICAL — VFX `ApiKeyModal` Key Not Persisted to `localStorage`

| Field | Value |
|-------|-------|
| **Location** | `src/apps/vfx-studio/components/BottomInputBar.tsx:187-207` |
| **Function** | `handleApiKeyContinue()` |

**Problem**

```typescript
function handleApiKeyContinue() {
    const key = apiKeyInput.trim();
    if (key) {
      setUserApiKey(key);   // ← React state only
      setImageUrl('');
    }
    setShowApiKeyModal(false);
    setPendingGenerate(false);
    setApiKeyInput('');
    setShowInputBar(false);
    // …
    handleGenerate(key || undefined);  // works *this* time
}
```

The key is passed to `handleGenerate()` directly, so the current request succeeds. But `setUserApiKey()` only updates React state — **nothing writes to `localStorage`**. On the next page load (or if the component remounts), `userApiKey` is empty and the user is prompted again.

**User-facing symptom**

> "I have to paste my key every single time I open the VFX Studio."

**Fix:** Add `localStorage.setItem('muapi_key', key)` in `handleApiKeyContinue()`.

---

### 2.3 🟠 HIGH — No Success Feedback on Settings Save

| Field | Value |
|-------|-------|
| **Location** | `src/components/SettingsModal.js:110-124` |

**Problem**

```javascript
apiPanel.querySelector('#settings-save-btn').onclick = () => {
    const muapiKey = apiPanel.querySelector('#settings-api-key').value.trim();
    // …
    if (muapiKey) {
        localStorage.setItem('muapi_key', muapiKey);
        // …
        close();  // ← modal just disappears
    } else {
        alert(t('settings.invalidKey'));
    }
};
```

There is no toast, no brief "saved" flash, no visual confirmation. The modal closes abruptly, leaving the user uncertain whether the operation succeeded.

**User-facing symptom**

> "I clicked save but I'm not sure if it actually saved."

**Fix:** Add a brief inline success indicator before closing the modal.

---

### 2.4 🟠 HIGH — Race Condition in VFX `handleApiKeyContinue`

| Field | Value |
|-------|-------|
| **Location** | `src/apps/vfx-studio/components/BottomInputBar.tsx:187-207` |
| **Function** | `handleApiKeyContinue()` |

**Problem**

```typescript
setUserApiKey(key);                    // ← schedules async state update
// …
handleGenerate(key || undefined);      // ← fires immediately
```

`handleGenerate` calls `useVideoGeneration.generateVideo()`, which uses `userApiKey` from its closure for **subsequent poll requests** (see `useVideoGeneration.ts:200-203`):

```typescript
const headers: Record<string, string> = {}
if (userApiKey) {
  headers['x-api-key'] = userApiKey   // ← stale closure value
}
```

The initial generation request passes the key explicitly, but the polling loop captures the *old* `userApiKey` (empty string) via closure. For long-running generations, the **status poll fails with 401** even though the initial submit succeeded.

**User-facing symptom**

> "It starts generating but then fails with an auth error after a few seconds."

**Fix:** Pass the key explicitly through the generation flow instead of relying on the stale closure.

---

### 2.5 🟡 MEDIUM — Inconsistent Key Validation Across Input Locations

| Field | Value |
|-------|-------|
| **Location** | Multiple files |

**Problem**

`src/lib/keys.js` exports `isValidKeyFormat()`:

```javascript
export function isValidKeyFormat(key) {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  if (trimmed.length < 8) return false;
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || …) return false;
  return true;
}
```

**But it is never called** by any of the following input components:

| Component | Validation performed |
|-----------|---------------------|
| `SettingsModal.js` | `.value.trim()` non-empty check only |
| `AuthModal.js` | `.value.trim()` non-empty check only |
| `ApiKeyModal.tsx` (VFX) | `.trim()` non-empty check only |
| `DesignAgent.tsx` | `.trim()` non-empty check only |
| `BottomInputBar.tsx` | `.trim()` non-empty check only |

Only `StandaloneShell.js` performs format validation (via a custom `isValidApiKey()`), but this is a different, non-shared implementation.

**User-facing symptom**

> User pastes `"sk-xxx"` (with literal quotes from a JSON export) → accepted silently → API call fails with 401.

**Fix:** Wire `isValidKeyFormat()` into every key input handler and surface actionable error messages.

---

### 2.6 🟡 MEDIUM — No Post-Save Key Verification

| Field | Value |
|-------|-------|
| **Location** | `src/components/SettingsModal.js` |

**Problem**

Keys are saved without any verification against the MuAPI API. Compare to `StandaloneShell.js` which calls `fetchBalance(trimmed)` before committing the key. A user with a typo in their key has no way to discover it until they attempt a generation.

**User-facing symptom**

> "I saved my key, tried to generate, and only *then* found out it was wrong."

---

### 2.7 🟢 LOW — Plaintext Key Storage

| Field | Value |
|-------|-------|
| **Location** | `src/components/SettingsModal.js`, `src/components/AuthModal.js` |

API keys are stored in plaintext in `localStorage`. The `src/lib/muapiKeyCrypto.ts` module provides encryption helpers but is used server-side only. For a client-side-only app this is a known tradeoff, but worth noting.

---

## 3. Root Cause Summary

```
┌──────────────────────────────────────────────────────────────────┐
│                        User copies key                           │
│                              │                                   │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │  Input layer (SettingsModal / AuthModal / ApiKeyModal /   │   │
│  │  DesignAgent / BottomInputBar)                             │   │
│  │                                                            │   │
│  │  ❌ No format validation (2.5)                             │   │
│  │  ❌ No success feedback (2.3)                              │   │
│  │  ❌ Key not persisted in VFX flow (2.2)                    │   │
│  └───────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │  cleanKey() / withKey() / createAuthHeaders()              │   │
│  │                                                            │   │
│  │  ❌ Aggressive regex strips non-Latin1 chars (2.1)         │   │
│  │  ❌ Silent corruption — no warning                         │   │
│  └───────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │  API request layer                                         │   │
│  │                                                            │   │
│  │  ❌ Stale closure in polling loop (2.4)                    │   │
│  │  ❌ Generic 401 errors with no actionable message          │   │
│  └───────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. Recommended Fix Priority

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| **P0** | 2.1 Fix `cleanKey()` | 1 file change | Eliminates silent corruption |
| **P0** | 2.2 Persist VFX key to `localStorage` | 1 line | Stops re-prompt loop |
| **P1** | 2.4 Fix race condition | Small refactor | Stops mid-generation auth failures |
| **P1** | 2.3 Add save success feedback | Small UX add | Removes user uncertainty |
| **P2** | 2.5 Wire `isValidKeyFormat()` everywhere | Multiple files | Catches user errors early |
| **P2** | 2.6 Post-save verification | Medium | Early typo detection |
| **P3** | 2.7 Client-side encryption | Large | Security hardening |

---

## 5. Code Fixes

### 5.1 Fix `cleanKey()` — Targeted Unicode Sanitization

**File:** `src/lib/muapi.js` (and equivalents in `muapiImage.ts`, `vfx.ts`)

Replace:
```javascript
function cleanKey(apiKey) {
  return String(apiKey || '').replace(/[^\u0000-\u00FF]/g, '').trim();
}
```

With:
```javascript
// Strip only *invisible/problematic* characters that commonly corrupt
// copied keys, while preserving all printable ASCII and valid key content.
// - U+200B-U+200D: zero-width space / non-joiner / joiner
// - U+FEFF: BOM / zero-width no-break space
// - U+2060: word joiner
// - U+00AD: soft hyphen
// - Leading/trailing whitespace and control chars (except tab/newline which
//   we also strip since keys never contain them).
function cleanKey(apiKey) {
  if (!apiKey) return '';
  return String(apiKey)
    .replace(/[\u200B-\u200D\uFEFF\u2060\u00AD]/g, '')  // invisible chars
    .replace(/^[\s\u0000-\u001F]+|[\s\u0000-\u001F]+$/g, '')  // leading/trailing ctrl+space
    .trim();
}
```

### 5.2 Persist VFX Key to `localStorage`

**File:** `src/apps/vfx-studio/components/BottomInputBar.tsx`

In `handleApiKeyContinue()`, add the `localStorage.setItem` call:

```typescript
function handleApiKeyContinue() {
    const key = apiKeyInput.trim();
    if (key) {
      localStorage.setItem('muapi_key', key);  // ← ADD THIS LINE
      setUserApiKey(key);
      setImageUrl('');
    }
    setShowApiKeyModal(false);
    setPendingGenerate(false);
    setApiKeyInput('');
    setShowInputBar(false);
    setTimeout(() => {
      const videoSection = document.getElementById('video-generation-status');
      if (videoSection) {
        videoSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 400);
    handleGenerate(key || undefined);
}
```

### 5.3 Add Success Feedback to Settings Save

**File:** `src/components/SettingsModal.js`

Replace the save handler:

```javascript
apiPanel.querySelector('#settings-save-btn').onclick = () => {
    const muapiKey = apiPanel.querySelector('#settings-api-key').value.trim();
    const openaiKey = apiPanel.querySelector('#settings-openai-key').value.trim();
    if (!muapiKey) {
        alert(t('settings.invalidKey'));
        return;
    }
    localStorage.setItem('muapi_key', muapiKey);
    if (openaiKey) {
        localStorage.setItem('openai_key', openaiKey);
    } else {
        localStorage.removeItem('openai_key');
    }
    // Success feedback: flash the button text
    const saveBtn = apiPanel.querySelector('#settings-save-btn');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = '✓ Saved';
    saveBtn.style.background = '#22c55e';
    setTimeout(() => {
        saveBtn.textContent = originalText;
        saveBtn.style.background = 'var(--color-primary,#22d3ee)';
        close();
    }, 600);
};
```

### 5.4 Fix Race Condition in Generation Flow

**File:** `src/apps/vfx-studio/components/BottomInputBar.tsx`

Pass the key explicitly through the generation flow instead of relying on React state closure:

```typescript
function handleApiKeyContinue() {
    const key = apiKeyInput.trim();
    if (key) {
      localStorage.setItem('muapi_key', key);
      setUserApiKey(key);
      setImageUrl('');
    }
    setShowApiKeyModal(false);
    setApiKeyInput('');
    setShowInputBar(false);
    setTimeout(() => {
      const videoSection = document.getElementById('video-generation-status');
      if (videoSection) {
        videoSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 400);
    // Generate with the explicit key — don't wait for React state to settle
    setPendingGenerate(false);
    if (key) {
      handleGenerate(key);
    }
}
```

**File:** `src/hooks/useVideoGeneration.ts`

Update the `poll` function to accept the key as a parameter instead of reading from closure:

```typescript
const poll = useCallback(
    async (id: string, pollKey?: string) => {
      // …
      const tick = async () => {
        // …
        const headers: Record<string, string> = {}
        const effectiveKey = pollKey || userApiKey
        if (effectiveKey) {
          headers['x-api-key'] = effectiveKey
        }
        // …
      }
      tick()
    },
    [persist, userApiKey]  // remove userApiKey from deps if using pollKey
)
```

### 5.5 Wire `isValidKeyFormat()` Into All Input Handlers

**File:** `src/components/SettingsModal.js`

```javascript
import { isValidKeyFormat } from '../lib/keys.js';

// …
apiPanel.querySelector('#settings-save-btn').onclick = () => {
    const muapiKey = apiPanel.querySelector('#settings-api-key').value.trim();
    const openaiKey = apiPanel.querySelector('#settings-openai-key').value.trim();
    if (!muapiKey || !isValidKeyFormat(muapiKey)) {
        alert('Please enter a valid MuAPI key (at least 8 characters, no surrounding quotes).');
        return;
    }
    if (openaiKey && !isValidKeyFormat(openaiKey)) {
        alert('Please enter a valid OpenAI key (at least 8 characters, no surrounding quotes).');
        return;
    }
    // … save logic
};
```

**File:** `src/apps/vfx-studio/components/BottomInputBar.tsx`

```typescript
import { isValidKeyFormat } from '@/lib/keys';

function handleApiKeyContinue() {
    const key = apiKeyInput.trim();
    if (!key || !isValidKeyFormat(key)) {
      alert('Please enter a valid API key (at least 8 characters, no surrounding quotes).');
      return;
    }
    // … continue with save
}
```

---

## 6. Verification Steps

After applying fixes, verify:

1. **Key with invisible characters:** Copy a MuAPI key, prepend a zero-width space (`U+200B`), paste into Settings → Save → verify the key authenticates.
2. **VFX persistence:** Enter key in VFX Studio → generate → refresh page → verify key is still present.
3. **Validation rejection:** Paste `"sk-test"` (with quotes) into any key input → verify it is rejected with a clear message.
4. **Long-generation polling:** Start a 10-second VFX generation → verify polling does not fail with 401 midway.
5. **Settings feedback:** Save a key in Settings → verify "✓ Saved" confirmation appears before modal closes.

---

*Report generated from static analysis of commit-state codebase. Line numbers refer to files as of 2026-08-27.*
