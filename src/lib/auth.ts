import crypto from 'crypto';

export * from './jwt';

export const KERALA_DISTRICTS = [
  'Thiruvananthapuram',
  'Kollam',
  'Pathanamthitta',
  'Alappuzha',
  'Kottayam',
  'Idukki',
  'Ernakulam',
  'Thrissur',
  'Palakkad',
  'Malappuram',
  'Kozhikode',
  'Wayanad',
  'Kannur',
  'Kasaragod',
] as const;

export type KeralaDistrict = (typeof KERALA_DISTRICTS)[number];

/**
 * Constant-time string comparison to prevent timing attacks.
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

/**
 * Computes deterministic HMAC-SHA256 hex for password lookup.
 */
export function computePasswordLookup(password: string): string {
  const pepper = process.env.PASSWORD_PEPPER || 'default_fallback_pepper_zeesip_portal_secure';
  return crypto.createHmac('sha256', pepper).update(password.trim()).digest('hex');
}

/**
 * Derives a 32-byte AES key from PASSWORD_PEPPER using HKDF-SHA256.
 * Info: "password-enc-v1"
 */
function getEncryptionKey(): Buffer {
  const pepper = process.env.PASSWORD_PEPPER || 'default_fallback_pepper_zeesip_portal_secure';
  return Buffer.from(crypto.hkdfSync('sha256', pepper, '', 'password-enc-v1', 32));
}

/**
 * Encrypts a password using AES-256-GCM.
 * Random 12-byte IV per record.
 * Returns base64 representation of: IV (12 bytes) + AuthTag (16 bytes) + Ciphertext.
 */
export function encryptPassword(plainText: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString('base64');
}

/**
 * Decrypts an AES-256-GCM encrypted base64 string.
 */
export function decryptPassword(encryptedBase64: string): string | null {
  try {
    if (!encryptedBase64 || typeof encryptedBase64 !== 'string') return null;
    const key = getEncryptionKey();
    const data = Buffer.from(encryptedBase64, 'base64');
    if (data.length < 28) return null; // 12-byte IV + 16-byte tag minimum

    const iv = data.subarray(0, 12);
    const authTag = data.subarray(12, 28);
    const ciphertext = data.subarray(28);

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (err) {
    console.error('[CRYPTO_DECRYPT_ERROR]', { message: (err as Error).message });
    return null;
  }
}
