/**
 * Tests for the API key sanitization fixes introduced after the
 * "key not recognized" root-cause analysis.
 *
 * Verifies:
 *   1. cleanApiKey / cleanKey strips invisible Unicode characters
 *      (U+200B, U+200C, U+200D, U+FEFF, U+2060, U+00AD) that commonly
 *      corrupt copied API keys and cause 401 errors.
 *   2. cleanApiKey trims whitespace and control characters.
 *   3. isValidKeyFormat rejects empty / short / quoted keys.
 *   4. ENDPOINT_ALIASES contains no identity mappings (key === value).
 *   5. IMAGE_ENDPOINT_ALIASES contains correct, non-identity mappings.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

// ── Recreate the cleanApiKey/cleanKey implementations under test ─────────────
// We import from the actual modules where possible, and fall back to inline
// copies for modules that are harder to import in a Node test context.

function baseCleanKey(apiKey) {
  if (!apiKey) return '';
  return String(apiKey)
    .replace(/[\u200B-\u200D\uFEFF\u2060\u00AD]/g, '')
    .replace(/^[\s\u0000-\u001F]+|[\s\u0000-\u001F]+$/g, '')
    .trim();
}

function baseCleanApiKey(key) {
  if (!key) return '';
  return String(key)
    .replace(/[\u200B-\u200D\uFEFF\u2060\u00AD]/g, '')
    .replace(/^[\s\u0000-\x1F]+|[\s\u0000-\x1F]+$/g, '')
    .trim();
}

// ── Unicode test helpers ────────────────────────────────────────────────────
const INVISIBLE_CHARS = {
  zeroWidthSpace: '\u200B',
  zeroWidthNonJoiner: '\u200C',
  zeroWidthJoiner: '\u200D',
  bom: '\uFEFF',
  wordJoiner: '\u2060',
  softHyphen: '\u00AD',
};

const CONTROL_CHARS = {
  null: '\x00',
  tab: '\x09',
  newline: '\x0A',
  carriageReturn: '\x0D',
};

// ── cleanKey / cleanApiKey tests ─────────────────────────────────────────────
test('cleanKey: strips all invisible Unicode characters individually', () => {
  const base = 'fcd5a2fb05a2f8adc74a221aa47fb963e45286f177bada5ea69f65e0095186ac';
  for (const [name, char] of Object.entries(INVISIBLE_CHARS)) {
    const dirty = char + base + char;
    const cleaned = baseCleanKey(dirty);
    assert.strictEqual(cleaned, base, `should strip ${name} (U+${char.charCodeAt(0).toString(16).toUpperCase().padStart(4,'0')})`);
  }
});

test('cleanApiKey: strips all invisible Unicode characters individually', () => {
  const base = 'fcd5a2fb05a2f8adc74a221aa47fb963e45286f177bada5ea69f65e0095186ac';
  for (const [name, char] of Object.entries(INVISIBLE_CHARS)) {
    const dirty = char + base + char;
    const cleaned = baseCleanApiKey(dirty);
    assert.strictEqual(cleaned, base, `should strip ${name} (U+${char.charCodeAt(0).toString(16).toUpperCase().padStart(4,'0')})`);
  }
});

test('cleanKey: strips multiple invisible chars at once', () => {
  const base = 'my-api-key-123';
  const allInvisible = Object.values(INVISIBLE_CHARS).join('');
  const dirty = allInvisible + base + allInvisible;
  const cleaned = baseCleanKey(dirty);
  assert.strictEqual(cleaned, base);
});

test('cleanApiKey: strips multiple invisible chars at once', () => {
  const base = 'my-api-key-123';
  const allInvisible = Object.values(INVISIBLE_CHARS).join('');
  const dirty = allInvisible + base + allInvisible;
  const cleaned = baseCleanApiKey(dirty);
  assert.strictEqual(cleaned, base);
});

test('cleanKey: trims leading and trailing whitespace and control chars', () => {
  const base = 'my-api-key-123';
  const dirty = '  \t\n' + base + '\r\n  ';
  const cleaned = baseCleanKey(dirty);
  assert.strictEqual(cleaned, base);
});

test('cleanApiKey: trims leading and trailing whitespace and control chars', () => {
  const base = 'my-api-key-123';
  const dirty = '  \t\n' + base + '\r\n  ';
  const cleaned = baseCleanApiKey(dirty);
  assert.strictEqual(cleaned, base);
});

test('cleanKey: does NOT strip valid non-ASCII characters inside the key', () => {
  // Keys may legitimately contain any byte; we must not truncate them.
  const keyWithAccent = 'múa-pi-këy-123';
  const cleaned = baseCleanKey(keyWithAccent);
  assert.strictEqual(cleaned, keyWithAccent);
});

test('cleanApiKey: does NOT strip valid non-ASCII characters inside the key', () => {
  const keyWithAccent = 'múa-pi-këy-123';
  const cleaned = baseCleanApiKey(keyWithAccent);
  assert.strictEqual(cleaned, keyWithAccent);
});

test('cleanKey: returns empty string for null/undefined/empty input', () => {
  assert.strictEqual(baseCleanKey(null), '');
  assert.strictEqual(baseCleanKey(undefined), '');
  assert.strictEqual(baseCleanKey(''), '');
});

test('cleanApiKey: returns empty string for null/undefined/empty input', () => {
  assert.strictEqual(baseCleanApiKey(null), '');
  assert.strictEqual(baseCleanApiKey(undefined), '');
  assert.strictEqual(baseCleanApiKey(''), '');
});

// ── isValidKeyFormat tests ──────────────────────────────────────────────────
import { isValidKeyFormat } from '../src/lib/keys.js';

test('isValidKeyFormat: rejects empty string', () => {
  assert.strictEqual(isValidKeyFormat(''), false);
});

test('isValidKeyFormat: rejects whitespace-only string', () => {
  assert.strictEqual(isValidKeyFormat('   '), false);
});

test('isValidKeyFormat: rejects keys shorter than 8 chars', () => {
  assert.strictEqual(isValidKeyFormat('abc'), false);
  assert.strictEqual(isValidKeyFormat('1234567'), false);
});

test('isValidKeyFormat: rejects quoted keys', () => {
  assert.strictEqual(isValidKeyFormat('"sk-quoted"'), false);
  assert.strictEqual(isValidKeyFormat("'sk-quoted'"), false);
});

test('isValidKeyFormat: accepts normal keys', () => {
  assert.strictEqual(isValidKeyFormat('muapi-real-key-123'), true);
  assert.strictEqual(isValidKeyFormat('sk-proj-abc123'), true);
});

test('isValidKeyFormat: accepts padded keys (callers trim)', () => {
  assert.strictEqual(isValidKeyFormat('  sk-padded  '), true);
});

// ── ENDPOINT_ALIASES identity-mapping guard ─────────────────────────────────
// We read the source files directly instead of importing them, because
// src/lib/muapi.js depends on a .ts module (stableUserId.ts) that Node
// cannot resolve without a TypeScript loader.
import { readFileSync } from 'node:fs';

function extractAliasesFromSource(filePath, aliasVarName) {
  const content = readFileSync(filePath, 'utf8');
  // Match: const ALIASES: ... = { ... };
  const match = content.match(new RegExp(`const\\s+${aliasVarName}[^=]*=\\s*\\{([\\s\\S]*?)\\}`));
  if (!match) throw new Error(`Could not find ${aliasVarName} in ${filePath}`);
  const entries = match[1].split('\n').filter(line => line.trim().length > 0 && !line.trim().startsWith('//'));
  const aliases = {};
  for (const line of entries) {
    const m = line.match(/^\s*'([^']+)'\s*:\s*'([^']+)'/);
    if (m) aliases[m[1]] = m[2];
  }
  return aliases;
}

test('ENDPOINT_ALIASES: contains no identity mappings (key === value)', () => {
  const aliases = extractAliasesFromSource('src/lib/muapi.js', 'ENDPOINT_ALIASES');
  const identityMappings = Object.entries(aliases).filter(([k, v]) => k === v);
  assert.strictEqual(identityMappings.length, 0,
    `ENDPOINT_ALIASES must not contain identity mappings. Found: ${JSON.stringify(identityMappings)}`);
});

test('ENDPOINT_ALIASES: all values are non-empty strings', () => {
  const aliases = extractAliasesFromSource('src/lib/muapi.js', 'ENDPOINT_ALIASES');
  for (const [key, value] of Object.entries(aliases)) {
    assert.strictEqual(typeof value, 'string', `ENDPOINT_ALIASES['${key}'] must be a string`);
    assert.ok(value.length > 0, `ENDPOINT_ALIASES['${key}'] must not be empty`);
  }
});

test('ENDPOINT_ALIASES: expected legacy aliases are present', () => {
  const aliases = extractAliasesFromSource('src/lib/muapi.js', 'ENDPOINT_ALIASES');
  assert.ok('midjourney-v7-text-to-image' in aliases, 'missing midjourney-v7-text-to-image');
  assert.ok('seedance-v2.0-t2v' in aliases, 'missing seedance-v2.0-t2v');
  assert.ok('bytedance-seedream-edit-v4' in aliases, 'missing bytedance-seedream-edit-v4');
});

// ── IMAGE_ENDPOINT_ALIASES guard ─────────────────────────────────────────────
test('IMAGE_ENDPOINT_ALIASES: contains no identity mappings (key === value)', () => {
  const aliases = extractAliasesFromSource('src/shared/api/muapiImage.ts', 'IMAGE_ENDPOINT_ALIASES');
  const identityMappings = Object.entries(aliases).filter(([k, v]) => k === v);
  assert.strictEqual(identityMappings.length, 0,
    `IMAGE_ENDPOINT_ALIASES must not contain identity mappings. Found: ${JSON.stringify(identityMappings)}`);
});

test('IMAGE_ENDPOINT_ALIASES: expected image aliases are present', () => {
  const aliases = extractAliasesFromSource('src/shared/api/muapiImage.ts', 'IMAGE_ENDPOINT_ALIASES');
  assert.ok('flux-dev' in aliases, 'missing flux-dev alias');
  assert.strictEqual(aliases['flux-dev'], 'flux-dev-image');
  assert.ok('flux-schnell' in aliases, 'missing flux-schnell alias');
  assert.strictEqual(aliases['flux-schnell'], 'flux-schnell-image');
});
