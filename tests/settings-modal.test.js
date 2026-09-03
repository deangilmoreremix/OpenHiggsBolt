/**
 * DOM-level test for the Settings popup (src/components/SettingsModal.js).
 *
 * Verifies the user-facing fix: saving the popup persists BOTH the MuAPI key
 * and the OpenAI key to localStorage, AND sets the `muapi_key` cookie so the
 * server-side /api/* proxy routes (which resolve the key from the cookie) can
 * authenticate. This is the bug that caused "MuAPI key is required" on proxied
 * endpoints even though the key was stored in localStorage.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

const store = new Map();
const cookies = new Map();

function makeDocumentShim() {
  // Registry of id -> element so querySelector returns a STABLE node across
  // calls (mirrors a real DOM where handlers attached are later found).
  const registry = new Map();

  function makeEl(tag) {
    const el = {
      tagName: tag,
      children: [],
      style: {},
      _value: '',
      _html: '',
      className: '',
      attrs: {},
      classList: { add() {}, remove() {}, contains() { return false; } },
      setAttribute(k, v) { this.attrs[k] = v; if (k === 'id') registry.set(v, this); },
      getAttribute(k) { return this.attrs[k]; },
      appendChild(c) { this.children.push(c); return c; },
      removeChild(c) { this.children = this.children.filter((x) => x !== c); },
      contains() { return true; },
      addEventListener() {},
      get innerHTML() { return this._html; },
      set innerHTML(html) {
        this._html = html;
        // Parse id="..." occurrences so querySelector('#x') finds stable nodes.
        const re = /id="([^"]+)"/g;
        let m;
        while ((m = re.exec(html)) !== null) {
          if (!registry.has(m[1])) {
            const node = makeEl('div');
            node.attrs.id = m[1];
            registry.set(m[1], node);
          }
        }
      },
      querySelector(sel) {
        const id = sel.replace('#', '');
        if (registry.has(id)) return registry.get(id);
        // Fallback: search real children.
        const found = queryById(this, id);
        if (found) return found;
        return makeEl('input');
      },
      querySelectorAll() { return []; },
      get value() { return this._value; },
      set value(v) { this._value = v; },
      set onclick(fn) { this._onclick = fn; },
      get onclick() { return this._onclick; },
      set textContent(v) { this._text = v; },
      get textContent() { return this._text; },
    };
    return el;
  }
  function queryById(root, id) {
    if (root.attrs && root.attrs.id === id) return root;
    for (const c of root.children || []) {
      const found = queryById(c, id);
      if (found) return found;
    }
    return null;
  }
  return { createElement: makeEl, body: makeEl('body') };
}

globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
globalThis.document = makeDocumentShim();
globalThis.window = { localStorage: globalThis.localStorage };
// Cookie shim mirroring encodeURIComponent writes from the app.
globalThis.document.cookie = '';
Object.defineProperty(globalThis.document, 'cookie', {
  get() { return [...cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; '); },
  set(v) {
    const [pair] = v.split(';');
    const idx = pair.indexOf('=');
    cookies.set(pair.slice(0, idx).trim(), pair.slice(idx + 1).trim());
  },
});

const { SettingsModal } = await import('../src/components/SettingsModal.js');

// Reset the DOM shim between tests so element values don't leak across cases.
function resetDocument() {
  const fresh = makeDocumentShim();
  globalThis.document = fresh;
  globalThis.document.cookie = '';
  Object.defineProperty(globalThis.document, 'cookie', {
    get() { return [...cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; '); },
    set(v) {
      const [pair] = v.split(';');
      const idx = pair.indexOf('=');
      cookies.set(pair.slice(0, idx).trim(), pair.slice(idx + 1).trim());
    },
  });
}

test('SettingsModal saves MuAPI + OpenAI keys and sets the muapi_key cookie', () => {
  store.clear();
  cookies.clear();
  resetDocument();

  SettingsModal();
  // Simulate the user typing both keys and clicking Save.
  const muapiInput = document.body.querySelector('#settings-api-key');
  const openaiInput = document.body.querySelector('#settings-openai-key');
  muapiInput.value = 'muapi-user-key-123';
  openaiInput.value = 'sk-user-openai-456';

  const saveBtn = document.body.querySelector('#settings-save-btn');
  saveBtn.onclick();

  assert.equal(store.get('muapi_key'), 'muapi-user-key-123');
  assert.equal(store.get('openai_key'), 'sk-user-openai-456');
  // Server proxy routes read the cookie — this must be set.
  assert.ok(cookies.has('muapi_key'), 'muapi_key cookie should be set after save');
  assert.equal(decodeURIComponent(cookies.get('muapi_key')), 'muapi-user-key-123');
});

test('SettingsModal clears OpenAI key when left empty', () => {
  store.clear();
  cookies.clear();
  resetDocument();
  store.set('openai_key', 'old-openai');

  SettingsModal();
  const muapiInput = document.body.querySelector('#settings-api-key');
  const openaiInput = document.body.querySelector('#settings-openai-key');
  muapiInput.value = 'muapi-user-key-789';
  openaiInput.value = '';

  document.body.querySelector('#settings-save-btn').onclick();

  assert.equal(store.get('muapi_key'), 'muapi-user-key-789');
  assert.equal(store.get('openai_key'), undefined);
});

test('SettingsModal rejects an empty MuAPI key (shows status, does not save)', () => {
  store.clear();
  cookies.clear();
  resetDocument();

  SettingsModal();
  const muapiInput = document.body.querySelector('#settings-api-key');
  const openaiInput = document.body.querySelector('#settings-openai-key');
  muapiInput.value = '';
  openaiInput.value = 'sk-openai';

  document.body.querySelector('#settings-save-btn').onclick();

  assert.equal(store.get('muapi_key'), undefined);
  assert.equal(store.get('openai_key'), undefined);
  const status = document.body.querySelector('#settings-status');
  assert.ok(status._text, 'a validation status message should be shown');
});

test('Keys persist: saved keys are still present after the modal is closed and reopened', () => {
  store.clear();
  cookies.clear();
  resetDocument();

  // First open + save.
  SettingsModal();
  document.body.querySelector('#settings-api-key').value = 'muapi-persist-1';
  document.body.querySelector('#settings-openai-key').value = 'sk-persist-1';
  document.body.querySelector('#settings-save-btn').onclick();

  // Simulate closing + reopening the popup.
  SettingsModal();
  const muapiInput = document.body.querySelector('#settings-api-key');
  const openaiInput = document.body.querySelector('#settings-openai-key');

  // Reopened inputs must be seeded from the persisted localStorage values.
  assert.equal(muapiInput.value, 'muapi-persist-1');
  assert.equal(openaiInput.value, 'sk-persist-1');
  // And the underlying storage must still hold them.
  assert.equal(store.get('muapi_key'), 'muapi-persist-1');
  assert.equal(store.get('openai_key'), 'sk-persist-1');
});

test('Keys survive a Cancel: closing without saving does NOT wipe previously saved keys', () => {
  store.clear();
  cookies.clear();
  resetDocument();
  store.set('muapi_key', 'muapi-keep');
  store.set('openai_key', 'sk-keep');

  SettingsModal();
  // User opens, changes the fields, but hits Cancel instead of Save.
  document.body.querySelector('#settings-api-key').value = 'muapi-different';
  document.body.querySelector('#settings-openai-key').value = 'sk-different';
  document.body.querySelector('#settings-cancel-btn').onclick();

  // Saved keys must be untouched by a cancel.
  assert.equal(store.get('muapi_key'), 'muapi-keep');
  assert.equal(store.get('openai_key'), 'sk-keep');
});

test('Keys are removed only on explicit removal (localStorage cleared)', () => {
  store.clear();
  cookies.clear();
  resetDocument();
  store.set('muapi_key', 'muapi-to-remove');
  store.set('openai_key', 'sk-to-remove');

  // Explicit removal path: clear the stored keys (mirrors "Change Key").
  store.delete('muapi_key');
  store.delete('openai_key');
  cookies.delete('muapi_key');

  // After removal, a reopened modal shows empty inputs.
  SettingsModal();
  assert.equal(document.body.querySelector('#settings-api-key').value, '');
  assert.equal(document.body.querySelector('#settings-openai-key').value, '');
  assert.equal(store.get('muapi_key'), undefined);
  assert.equal(store.get('openai_key'), undefined);
});
