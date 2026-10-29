import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { constantTimeCompare, signSessionToken, computePasswordLookup, SESSION_COOKIE_OPTIONS } from '@/lib/auth';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '@/lib/rate-limit';
import { findUserByPasswordLookup } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : (request.headers.get('x-real-ip') || '127.0.0.1');

    // 1. Check IP rate limit (5 failed attempts -> 15 min lockout)
    const limitStatus = checkRateLimit(ip);
    if (!limitStatus.allowed) {
      return NextResponse.json(
        { error: 'Too many attempts. Try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 400 });
    }

    const trimmedPassword = password.trim();
    const expectedAdminPassword = (process.env.ADMIN_PASSWORD || '').trim();

    // 2. Check against master ADMIN_PASSWORD
    if (expectedAdminPassword && constantTimeCompare(trimmedPassword, expectedAdminPassword)) {
      resetRateLimit(ip);

      const token = await signSessionToken({
        userId: 'admin-master',
        role: 'admin',
        name: 'Master Admin',
      });

      const response = NextResponse.json({
        success: true,
        redirect: '/admin/dashboard',
      });

      response.cookies.set({
        name: SESSION_COOKIE_OPTIONS.name,
        value: token,
        httpOnly: SESSION_COOKIE_OPTIONS.httpOnly,
        secure: SESSION_COOKIE_OPTIONS.secure,
        sameSite: SESSION_COOKIE_OPTIONS.sameSite,
        path: SESSION_COOKIE_OPTIONS.path,
        maxAge: SESSION_COOKIE_OPTIONS.maxAge,
      });

      return response;
    }

    // 3. Look up password in portal_users via HMAC-SHA256 hex
    const passwordLookup = computePasswordLookup(trimmedPassword);
    const user = await findUserByPasswordLookup(passwordLookup);

    if (user) {
      const isPasswordValid = await bcrypt.compare(trimmedPassword, user.password_hash);
      if (isPasswordValid && user.is_active) {
        resetRateLimit(ip);

        const token = await signSessionToken({
          userId: user.id,
          role: user.role,
          name: user.name,
        });

        const redirectUrl = user.role === 'zeesip_admin' ? '/admin/dashboard' : '/dashboard';

        const response = NextResponse.json({
          success: true,
          redirect: redirectUrl,
        });

        response.cookies.set({
          name: SESSION_COOKIE_OPTIONS.name,
          value: token,
          httpOnly: SESSION_COOKIE_OPTIONS.httpOnly,
          secure: SESSION_COOKIE_OPTIONS.secure,
          sameSite: SESSION_COOKIE_OPTIONS.sameSite,
          path: SESSION_COOKIE_OPTIONS.path,
          maxAge: SESSION_COOKIE_OPTIONS.maxAge,
        });

        return response;
      }
    }

    // 4. Failed password attempt: record rate limit
    const record = recordFailedAttempt(ip);
    if (record.isLocked) {
      return NextResponse.json(
        { error: 'Too many attempts. Try again later.' },
        { status: 429 }
      );
    }

    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Incorrect password' }, { status: 500 });
  }
}
