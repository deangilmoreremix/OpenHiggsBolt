// Turns MuAPI's raw auth failure into a message that says which key failed and
// what to do. MuAPI answers a rejected (or missing) x-api-key with
//   403 {"detail":"Not authorized: missing or invalid credentials","error":{"code":"FORBIDDEN",...}}
// which reads like our app lost the key, when really MuAPI refused the key it got.

export const MUAPI_KEY_REJECTED_MESSAGE =
  'MuAPI rejected your saved MuAPI key. It may have been regenerated or revoked, or the account may be out of credit. ' +
  'Check it at muapi.ai, then paste a working key under "New MuAPI Key" and save it.';

export const MUAPI_KEY_MISSING_MESSAGE = 'Your MuAPI key is missing. Add it under "New MuAPI Key" to start generating.';

function extractText(raw) {
  if (!raw) return '';
  if (typeof raw === 'object') {
    return [raw.detail, raw.message, raw.error?.message, raw.error?.code, typeof raw.error === 'string' ? raw.error : '']
      .filter(Boolean)
      .join(' ');
  }
  const text = String(raw);
  try {
    return extractText(JSON.parse(text));
  } catch {
    return text;
  }
}

/**
 * @param {unknown} raw  the response body (string or parsed object) from a 401/403
 * @returns {string} a plain-language message for the Settings banner
 */
export function muapiAuthMessage(raw) {
  const text = extractText(raw);
  if (/missing api key/i.test(text)) return MUAPI_KEY_MISSING_MESSAGE;
  if (!text || /not authori[sz]ed|invalid credentials|forbidden|unauthori[sz]ed|invalid api key/i.test(text)) {
    return MUAPI_KEY_REJECTED_MESSAGE;
  }
  return text;
}

/** True when the message is one of ours about the MuAPI key (so a later success can clear it). */
export function isMuapiKeyAuthMessage(message) {
  return message === MUAPI_KEY_REJECTED_MESSAGE || message === MUAPI_KEY_MISSING_MESSAGE;
}
