// Bridges the SPA to the server's Clerk-derived identity.
// The SPA never talks to Supabase directly (Option 2): all Supabase access is
// enforced server-side via getSupabaseAsUser(). Here we only read the identity
// the server exposes through /api/auth/whoami and use it to scope localStorage.

let _identity = null;       // { userId, workspace } | null
let _init = null;           // promise

export function getIdentity() {
  return _identity;
}

export function getWorkspaceId() {
  const ws = _identity?.workspace;
  if (ws && typeof ws === 'object') return ws.slug || ws.id || null;
  return ws || null;
}

export function getUserId() {
  return _identity?.userId || null;
}

export function isAuthed() {
  return !!_identity?.userId;
}

// Namespace a localStorage key by the current workspace so each Clerk workspace
// keeps its own muapi key / history / pending jobs. Falls back to 'local' when
// identity hasn't loaded yet or the user isn't signed in.
export function nsKey(base) {
  const ws = getWorkspaceId();
  return ws ? `${base}:${ws}` : `${base}:local`;
}

export function initIdentity() {
  if (_init) return _init;
  _init = (async () => {
    try {
      const res = await fetch('/api/auth/whoami', { credentials: 'same-origin' });
      if (res.ok) {
        const data = await res.json();
        _identity = { userId: data.userId || null, workspace: data.workspace || null };
      }
    } catch {
      _identity = null;
    }
    return _identity;
  })();
  return _init;
}
