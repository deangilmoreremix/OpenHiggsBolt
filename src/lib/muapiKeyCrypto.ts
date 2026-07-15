import crypto from 'crypto';

// Encryption at rest for the user's MuAPI key.
//
// The AES key is derived (scrypt) from a server-only secret so the plaintext
// key is NEVER written to the database. Prefer a dedicated MUAPI_KEY_SECRET;
// fall back to SUPABASE_SERVICE_ROLE_KEY (always present server-side) so no
// extra env setup is required. A stable salt ("muapi-key-v1") is used so the
// same secret always derives the same key — required for decrypt to work.
//
// Ciphertext format: `v1:<iv>:<authTag>:<ciphertext>` (all base64). The `v1:`
// prefix lets us later migrate formats and keeps legacy/plaintext values
// (anything without the prefix) readable as-is.

const PREFIX = 'v1';
const SALT = 'muapi-key-v1';

function deriveKey(): Buffer {
  const secret =
    process.env.MUAPI_KEY_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error('Missing encryption secret');
  return crypto.scryptSync(secret, SALT, 32);
}

export function encryptMuapiKey(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', deriveKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}:${iv.toString('base64')}:${tag.toString('base64')}:${enc.toString('base64')}`;
}

// Returns the decrypted key, or null when the value is empty / not our format /
// fails authentication (tampered). Defensive: never throws to the caller.
export function decryptMuapiKey(stored: string | null | undefined): string | null {
  try {
    if (!stored) return null;
    // Legacy / plaintext values (no version prefix) are returned as-is so
    // existing rows keep working while new writes are encrypted.
    if (!stored.startsWith(`${PREFIX}:`)) return stored;
    const [, ivB64, tagB64, dataB64] = stored.split(':');
    if (!ivB64 || !tagB64 || !dataB64) return null;
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      deriveKey(),
      Buffer.from(ivB64, 'base64')
    );
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    const dec = Buffer.concat([
      decipher.update(Buffer.from(dataB64, 'base64')),
      decipher.final(),
    ]);
    return dec.toString('utf8');
  } catch {
    return null;
  }
}
