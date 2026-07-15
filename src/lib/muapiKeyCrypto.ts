import crypto from 'crypto';

// Encryption at rest for the user's MuAPI key.
//
// The AES key is derived (scrypt) from a server-only secret so the plaintext
// key is NEVER written to the database. Prefer a dedicated MUAPI_KEY_SECRET;
// fall back to SUPABASE_SERVICE_ROLE_KEY (always present server-side) so no
// extra env setup is required.
//
// A UNIQUE 16-byte salt is generated per encryption (not a shared constant),
// so identical plaintext keys produce different ciphertext and scrypt keeps
// its full precomputation resistance. The salt is stored alongside the
// ciphertext rather than hard-coded.
//
// Ciphertext format (current): `v1:<salt>:<iv>:<authTag>:<ciphertext>`
// (all base64). Legacy format `v1:<iv>:<authTag>:<ciphertext>` (4 parts,
// derived with the old static salt) is still decryptable for backward
// compatibility with rows written before this change. Plaintext values
// (anything without the `v1:` prefix) are returned as-is.

const PREFIX = 'v1';
const LEGACY_SALT = 'muapi-key-v1'; // only for decrypting pre-migration rows

function deriveKey(salt: string): Buffer {
  const secret =
    process.env.MUAPI_KEY_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error('Missing encryption secret');
  return crypto.scryptSync(secret, salt, 32);
}

export function encryptMuapiKey(plain: string): string {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', deriveKey(salt.toString('base64')), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    PREFIX,
    salt.toString('base64'),
    iv.toString('base64'),
    tag.toString('base64'),
    enc.toString('base64'),
  ].join(':');
}

// Returns the decrypted key, or null when the value is empty / not our format /
// fails authentication (tampered). Defensive: never throws to the caller.
export function decryptMuapiKey(stored: string | null | undefined): string | null {
  try {
    if (!stored) return null;
    // Legacy / plaintext values (no version prefix) are returned as-is so
    // existing rows keep working while new writes are encrypted.
    if (!stored.startsWith(`${PREFIX}:`)) return stored;
    const parts = stored.split(':');
    // Current format: v1:<salt>:<iv>:<tag>:<data> (5 parts)
    if (parts.length === 5) {
      const [, saltB64, ivB64, tagB64, dataB64] = parts;
      if (!saltB64 || !ivB64 || !tagB64 || !dataB64) return null;
      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        deriveKey(saltB64),
        Buffer.from(ivB64, 'base64')
      );
      decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
      const dec = Buffer.concat([
        decipher.update(Buffer.from(dataB64, 'base64')),
        decipher.final(),
      ]);
      return dec.toString('utf8');
    }
    // Legacy format: v1:<iv>:<tag>:<data> (4 parts, old static salt)
    if (parts.length === 4) {
      const [, ivB64, tagB64, dataB64] = parts;
      if (!ivB64 || !tagB64 || !dataB64) return null;
      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        deriveKey(LEGACY_SALT),
        Buffer.from(ivB64, 'base64')
      );
      decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
      const dec = Buffer.concat([
        decipher.update(Buffer.from(dataB64, 'base64')),
        decipher.final(),
      ]);
      return dec.toString('utf8');
    }
    return null;
  } catch {
    return null;
  }
}
