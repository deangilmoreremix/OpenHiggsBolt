/** The customer's MailerLite key, stored encrypted server-side (one row per user). Never returned to the browser. */
export async function getSavedKey(db, userId, decrypt) {
  const { data } = await db.from('landing_sync_settings').select('api_key_enc').eq('clerk_user_id', userId).maybeSingle();
  return data?.api_key_enc ? decrypt(data.api_key_enc) : null;
}

export async function saveKey(db, userId, plain, encrypt) {
  const { error } = await db.from('landing_sync_settings').upsert({ clerk_user_id: userId, provider: 'mailerlite', api_key_enc: encrypt(plain), updated_at: new Date().toISOString() });
  if (error) throw new Error('Could not save the key');
}

export async function deleteKey(db, userId) {
  const { error } = await db.from('landing_sync_settings').delete().eq('clerk_user_id', userId);
  if (error) throw new Error('Could not remove the key');
}

export const maskKey = (k) => (k ? `${'•'.repeat(8)}${String(k).slice(-4)}` : '');
export const plausibleKey = (k) => typeof k === 'string' && k.trim().length >= 20 && k.trim().length <= 4096 && !/\s/.test(k.trim());
