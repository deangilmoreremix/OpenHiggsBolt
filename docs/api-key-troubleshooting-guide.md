# API Key Rejection — Troubleshooting Guide

**Purpose:** Systematic diagnosis of why an API key is being rejected and what error message the user sees.

---

## Error Message → Cause Mapping

### 1. "API Key missing. Please set it in Settings."

| Field | Value |
|-------|-------|
| **Trigger** | `src/lib/muapi.js:64` — `getKey()` finds no key |
| **Condition** | `window.__MUAPI_KEY__` is undefined AND `localStorage.getItem('muapi_key')` returns null/empty |
| **User action that causes this** | Opening a studio without having saved a key, or after clearing browser data |

**Diagnostic checklist:**
- [ ] Open DevTools → Application → Local Storage → check for `muapi_key` entry
- [ ] Check if `window.__MUAPI_KEY__` is set in console
- [ ] Verify the key was saved in Settings (not just typed and dismissed)

---

### 2. "Please enter a valid MuAPI key (at least 8 characters, no surrounding quotes)."

| Field | Value |
|-------|-------|
| **Trigger** | `isValidKeyFormat()` in `src/lib/keys.js:62-70` rejects the input |
| **Conditions** | Key is empty, < 8 chars, or wrapped in quotes (`"sk-xxx"` or `'sk-xxx'`) |

**Diagnostic checklist:**
- [ ] Check key length: `localStorage.getItem('muapi_key').length` in console
- [ ] Check for surrounding quotes: `console.log(JSON.stringify(localStorage.getItem('muapi_key')))`
- [ ] Check for leading/trailing whitespace: `key.length !== key.trim().length`

---

### 3. "That MuAPI key is invalid or unauthorized. Double-check it on your MuAPI dashboard and try again."

| Field | Value |
|-------|-------|
| **Trigger** | `StandaloneShell.js:343` — `fetchBalance()` returns 401/403/"Not authorized" |
| **Conditions** | Key format is valid but MuAPI rejects it |

**Diagnostic checklist:**
- [ ] Verify the key is active on https://muapi.ai dashboard
- [ ] Check if the key has expired or been revoked
- [ ] Check if the account has credits/balance remaining
- [ ] Verify the key was copied completely (no truncated characters)
- [ ] Test the key directly: `curl -H "x-api-key: YOUR_KEY" https://api.muapi.ai/api/v1/user/balance`

---

### 4. "Could not verify the MuAPI key. Check your connection and try again."

| Field | Value |
|-------|-------|
| **Trigger** | `StandaloneShell.js:345` — `fetchBalance()` throws a non-auth error |
| **Conditions** | Network error, timeout, or MuAPI server error (5xx) |

**Diagnostic checklist:**
- [ ] Check internet connectivity
- [ ] Check if MuAPI is down: `curl -I https://api.muapi.ai/api/v1/models`
- [ ] Check browser console for CORS errors
- [ ] Check if a VPN or firewall is blocking `api.muapi.ai`

---

### 5. "Invalid API key (401). Check your MuAPI key in Settings."

| Field | Value |
|-------|-------|
| **Trigger** | `SocialPublishing.tsx:577` — API returns 401 |
| **Conditions** | Social publishing request fails with 401 |

**Diagnostic checklist:**
- [ ] Same as #3 — verify key is valid and active
- [ ] Check if the key has social publishing permissions

---

### 6. "Invalid MuAPI key. Please check your key in Settings."

| Field | Value |
|-------|-------|
| **Trigger** | `muapiImage.ts:255,313,446` — image upload/generation returns 401/403 |
| **Conditions** | MuAPI image generation request fails auth |

**Diagnostic checklist:**
- [ ] Same as #3
- [ ] Check if the specific model/endpoint requires a higher tier key

---

### 7. "API key looks invalid (contains spaces or control characters). Re-copy it from your MuAPI dashboard."

| Field | Value |
|-------|-------|
| **Trigger** | `StandaloneShell.js:323` — `isValidApiKey()` custom check |
| **Conditions** | Key contains spaces or control characters (different from `isValidKeyFormat`) |

**Diagnostic checklist:**
- [ ] Re-copy the key from MuAPI dashboard (don't type manually)
- [ ] Check for invisible characters: `[...key].map(c => c.charCodeAt(0))` in console
- [ ] Ensure no newlines or tabs are included

---

### 8. "Your API key is missing or invalid. Please enter a valid key."

| Field | Value |
|-------|-------|
| **Trigger** | `StandaloneShell.js:453` — `muapi:auth-required` event fired |
| **Conditions** | Background balance poll or verify request fails auth |

**Diagnostic checklist:**
- [ ] Key may have expired since it was saved
- [ ] Key may have been revoked on the dashboard
- [ ] System clock is correct (can cause TLS issues)

---

## Systematic Diagnosis Flowchart

```
START: User reports "API key doesn't work"
│
├─ Q1: Is the key saved in localStorage?
│  ├─ NO → User never saved it. Direct to Settings → enter key → Save.
│  └─ YES → Continue
│
├─ Q2: Does the key pass isValidKeyFormat()? (≥8 chars, no quotes)
│  ├─ NO → Show "Please enter a valid API key" message
│  └─ YES → Continue
│
├─ Q3: Does the key contain invisible Unicode characters?
│  ├─ YES → Strip them with cleanKey(), re-save
│  └─ NO → Continue
│
├─ Q4: Can the app reach api.muapi.ai?
│  ├─ NO → "Check your connection" message
│  └─ YES → Continue
│
├─ Q5: Does MuAPI accept the key? (balance endpoint returns 200)
│  ├─ NO → "Invalid or unauthorized" message
│  └─ YES → Key is valid! Check endpoint-specific permissions
│
└─ Q6: Is the key valid for THIS specific endpoint/model?
   ├─ NO → "Invalid MuAPI key" on specific feature
   └─ YES → Check for bugs in request construction
```

---

## Common Root Causes

### A. Key Entry Issues (client-side)

| # | Cause | Detection | Fix |
|---|-------|-----------|-----|
| A1 | Key wrapped in quotes | `key.startsWith('"')` | Strip quotes before save |
| A2 | Leading/trailing whitespace | `key.length !== key.trim().length` | `.trim()` before save |
| A3 | Invisible Unicode chars | `key.charCodeAt(i) > 127` for non-UTF8 | `cleanKey()` strips these |
| A4 | Truncated key (copy error) | Key shorter than expected | Re-copy from dashboard |
| A5 | Wrong key (OpenAI vs MuAPI) | Key prefix doesn't match expected | Verify which key goes where |
| A6 | Key typed manually (typos) | Visual inspection fails | Always copy-paste |

### B. Key Storage Issues (client-side)

| # | Cause | Detection | Fix |
|---|-------|-----------|-----|
| B1 | Key not persisted to localStorage | `localStorage.getItem('muapi_key')` returns null | Add `localStorage.setItem` call |
| B2 | Key stored under wrong key name | Check storage keys | Use consistent `muapi_key` |
| B3 | localStorage cleared | Key disappears after refresh | Check browser privacy settings |
| B4 | Private/incognito mode | localStorage may be restricted | Use persistent storage |
| B5 | Cookie not set (server proxy) | `document.cookie` lacks `muapi_key` | Set cookie on save |

### C. Key Validation Issues (server-side)

| # | Cause | Detection | Fix |
|---|-------|-----------|-----|
| C1 | Key expired/revoked | MuAPI returns 401 | Generate new key |
| C2 | Key has no balance | Balance endpoint shows 0 | Add credits to account |
| C3 | Key lacks endpoint permission | Specific endpoint returns 403 | Upgrade key permissions |
| C4 | Key format changed | MuAPI rejects new format | Check MuAPI docs for format |

### D. Network/Infrastructure Issues

| # | Cause | Detection | Fix |
|---|-------|-----------|-----|
| D1 | MuAPI down | `api.muapi.ai` unreachable | Wait for MuAPI to recover |
| D2 | CORS blocked | Browser console CORS error | Use proxy route |
| D3 | Firewall/VPN blocking | Connection times out | Disable VPN/firewall |
| D4 | SSL/TLS error | Certificate issue | Check system clock |
| D5 | Rate limited (429) | Too many requests | Wait and retry |

---

## Diagnostic Commands

Run these in the browser console on the affected studio page:

```javascript
// 1. Check if key exists in storage
console.log('localStorage key:', localStorage.getItem('muapi_key'));
console.log('cookie:', document.cookie.includes('muapi_key'));

// 2. Check key format
const key = localStorage.getItem('muapi_key') || '';
console.log('Key length:', key.length);
console.log('Has quotes:', key.startsWith('"') || key.startsWith("'"));
console.log('Has whitespace:', key.length !== key.trim().length);
console.log('Char codes:', [...key.slice(0, 20)].map(c => c.charCodeAt(0)));

// 3. Test key against MuAPI directly
fetch('https://api.muapi.ai/api/v1/user/balance', {
  headers: { 'x-api-key': key }
}).then(r => {
  console.log('Status:', r.status);
  return r.json();
}).then(d => console.log('Balance:', d))
  .catch(e => console.error('Error:', e));

// 4. Check if cleanKey changes the key
const cleanKey = (k) => String(k)
  .replace(/[​-‍﻿﻿­]/g, '')
  .replace(/^[\s -]+|[\s -]+$/g, '')
  .trim();
console.log('Key changed by cleanKey:', key !== cleanKey(key));
```

---

## Studio-Specific Key Paths

| Studio | Key Source | Validation | Error on Rejection |
|--------|------------|------------|-------------------|
| Settings (global) | `localStorage` | `isValidKeyFormat` | Alert dialog |
| Auth Modal (legacy) | Direct input | `isValidKeyFormat` | Red border + alert |
| VFX Studio | `localStorage` / `ApiKeyModal` | `isValidKeyFormat` | Alert dialog |
| Design Agent | `localStorage` / inline modal | Length ≥ 8 | Alert dialog |
| Video Studio | `localStorage` | None (uses directly) | `AuthModal` popup |
| Image Studio | `localStorage` | None (uses directly) | `AuthModal` popup |
| Cinema Studio | `localStorage` | None (uses directly) | `AuthModal` popup |
| Lip Sync Studio | `localStorage` | None (uses directly) | `AuthModal` popup |
| Storyboard | `window.__MUAPI_KEY__` | None | Generation fails |
| Social Publishing | `localStorage` | None | "Enter your MuAPI key in Settings" |
| Thumbnail Studio | `localStorage` | None | Generation fails |
| StandaloneShell | Cookie + `localStorage` | `isValidApiKey` (custom) | `authError` state |

---

## Quick Fixes for Users

1. **"My key used to work but now doesn't"**
   - Key may have expired → regenerate on muapi.ai
   - Account may have run out of credits → check balance
   - Clear localStorage and re-enter the key

2. **"I pasted my key but it says invalid"**
   - Re-copy from MuAPI dashboard (don't type manually)
   - Ensure no extra spaces or quotes are included
   - Try copying just the key value, not the key name

3. **"It works in one studio but not another"**
   - Some studios read from `localStorage`, others from cookies
   - Re-save the key in Settings to sync all storage locations
   - Check if the specific model requires different permissions

4. **"I saved my key but it's gone after refresh"**
   - Browser may be in private/incognito mode
   - localStorage may be disabled by browser policy
   - Try a different browser

---

*Last updated: 2026-08-27*
