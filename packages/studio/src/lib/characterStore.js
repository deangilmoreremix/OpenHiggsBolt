/**
 * Per-studio persistence for Seedance 2.5 character sheets.
 *
 * `generateCharacterVideo` (muapi.js) runs `create_character` first and returns
 * the resulting sheet URL. Storing it here keeps the character identity stable
 * across reloads and lets other studios (AI-Influencer) reuse the exact same
 * sheet instead of regenerating a new — and visually different — character.
 *
 * Backed by localStorage under `character_sheet_${studio}`. Every access is
 * guarded so SSR (no window) and privacy-mode/quota failures are non-fatal.
 */

const KEY_PREFIX = 'character_sheet_';

export function characterSheetKey(studio) {
  return `${KEY_PREFIX}${studio}`;
}

function store() {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage || null;
  } catch {
    return null;
  }
}

/** Returns the stored sheet URL for a studio, or null when none is saved. */
export function getCharacterSheet(studio) {
  if (!studio) return null;
  const ls = store();
  if (!ls) return null;
  try {
    const raw = ls.getItem(characterSheetKey(studio));
    if (!raw) return null;
    // Sheets are stored as a plain URL string; tolerate a legacy {url} object.
    if (raw.startsWith('{')) {
      try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed.url === 'string' ? parsed.url : null;
      } catch {
        return null;
      }
    }
    return raw;
  } catch {
    return null;
  }
}

/**
 * Saves a sheet URL for a studio. Passing a falsy `sheetUrl` clears the entry so
 * callers can reset a character without a separate import.
 */
export function setCharacterSheet(studio, sheetUrl) {
  if (!studio) return null;
  const ls = store();
  if (!ls) return null;
  try {
    if (!sheetUrl) {
      ls.removeItem(characterSheetKey(studio));
      return null;
    }
    ls.setItem(characterSheetKey(studio), String(sheetUrl));
    return String(sheetUrl);
  } catch {
    return null;
  }
}

/** Removes the stored sheet for a studio. */
export function clearCharacterSheet(studio) {
  return setCharacterSheet(studio, null);
}
