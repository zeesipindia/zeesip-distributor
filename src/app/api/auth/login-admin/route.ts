import { NextRequest, NextResponse } from 'next/server';
import { constantTimeCompare, signSessionToken, SESSION_COOKIE_OPTIONS } from '@/lib/auth';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : (request.headers.get('x-real-ip') || '127.0.0.1');

    // 1. Check IP rate limit (5 failed attempts -> 15 min lockout)
    const limitStatus = checkRateLimit(ip);
    if (!limitStatus.allowed) {
      const minutes = Math.ceil((limitStatus.lockoutRemainingSeconds || 900) / 60);
      return NextResponse.json(
        {
          error: `Too many failed attempts. Access locked for ${minutes} minute${minutes > 1 ? 's' : ''}.`,
          lockoutRemainingSeconds: limitStatus.lockoutRemainingSeconds,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    const expectedAdminPassword = process.env.ADMIN_PASSWORD;
    if (!expectedAdminPassword) {
      console.error('CRITICAL: ADMIN_PASSWORD environment variable is not configured');
      return NextResponse.json(
        { error: 'Server configuration error: ADMIN_PASSWORD is not set' },
        { status: 500 }
      );
    }

    // 2. Perform constant-time comparison
    const isValid = constantTimeCompare(password, expectedAdminPassword);

    if (!isValid) {
      const record = recordFailedAttempt(ip);
      if (record.isLocked) {
        return NextResponse.json(
          {
            error: 'Maximum attempts exceeded. This IP has been locked out for 15 minutes.',
            isLocked: true,
          },
          { status: 429 }
        );
      }
      return NextResponse.json(
        {
          error: `Invalid admin password. ${record.remainingAttempts} attempt${record.remainingAttempts === 1 ? '' : 's'} remaining before 15-min lockout.`,
          remainingAttempts: record.remainingAttempts,
        },
        { status: 401 }
      );
    }

    // 3. Password is valid: reset failed attempt counter for this IP
    resetRateLimit(ip);

    // 4. Generate signed session token (7-day expiry)
    const token = await signSessionToken({
      userId: 'admin-master',
      role: 'admin',
      name: 'System Admin',
      username: 'admin',
    });

    const response = NextResponse.json({
      success: true,
      role: 'admin',
      redirect: '/admin/users',
    });

    // 5. Set HTTP-only secure cookie
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
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'An unexpected authentication error occurred' }, { status: 500 });
  }
}
