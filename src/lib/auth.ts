import crypto from 'crypto';

export * from './jwt';

/**
 * Constant-time string comparison to prevent timing attacks.
 * Hashing both inputs with SHA-256 standardizes length to 32 bytes
 * before invoking crypto.timingSafeEqual.
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
 * Uses process.env.PASSWORD_PEPPER to ensure lookup hashes cannot be reversed
 * without server secret.
 */
export function computePasswordLookup(password: string): string {
  const pepper = process.env.PASSWORD_PEPPER || 'default_fallback_pepper_zeesip_portal_secure';
  return crypto.createHmac('sha256', pepper).update(password.trim()).digest('hex');
}
