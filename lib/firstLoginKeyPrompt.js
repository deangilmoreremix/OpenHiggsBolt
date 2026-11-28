// When to show the "Welcome to SmartVideo GO" key pop-up on its own (first login).
//
// People enter their MuAPI key once, at sign-up, and it is saved to their account. The pop-up
// asked again whenever the account lookup did not return a key: when it ran before sign-in had
// loaded (the server answers 401), when the server was unreachable, for signed-out visitors (who
// cannot save a key anyway), and when only the optional OpenAI key was missing.
//
// It now opens only when the account was read successfully and has no MuAPI key, and this
// browser has none either. Studios can still open it on demand (a "needs a key" action).

/**
 * @param {object} p
 * @param {boolean} p.signedIn   sign-in has loaded and the visitor is signed in
 * @param {number|null} p.status HTTP status of GET /api/auth/muapi-key (null when the request failed)
 * @param {string} [p.accountKey] MuAPI key saved to the account ('' when none)
 * @param {string} [p.localKey]   MuAPI key already in this browser ('' when none)
 * @returns {boolean}
 */
export function shouldPromptForKeys({ signedIn, status, accountKey = '', localKey = '' }) {
  if (!signedIn) return false;
  if (status !== 200) return false;
  return !String(accountKey).trim() && !String(localKey).trim();
}
