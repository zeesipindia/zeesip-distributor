import { SignJWT, jwtVerify } from 'jose';
import { SessionPayload } from './types';

export type { SessionPayload } from './types';

export const SESSION_COOKIE_NAME = 'zeesip_session';
export const SESSION_EXPIRY = '7d';

export const SESSION_COOKIE_OPTIONS = {
  name: SESSION_COOKIE_NAME,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
};

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET || 'zeesip_portal_default_secret_key_needs_32_characters_minimum';
  return new TextEncoder().encode(secret);
}

/**
 * Signs a JWT session token with jose HS256 for 7 days
 */
export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(SESSION_EXPIRY)
    .sign(getSecretKey());
}

/**
 * Verifies a JWT session token using jose HS256
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (!payload.role || !payload.userId) {
      return null;
    }
    return {
      userId: String(payload.userId),
      role: payload.role as SessionPayload['role'],
      name: String(payload.name || ''),
    };
  } catch {
    return null;
  }
}
