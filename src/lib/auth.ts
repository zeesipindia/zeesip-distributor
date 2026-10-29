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
