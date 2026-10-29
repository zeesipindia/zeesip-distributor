import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from '@/lib/auth';
import { findUserById } from '@/lib/db';

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get(SESSION_COOKIE_NAME);
  if (!cookie?.value) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const session = await verifySessionToken(cookie.value);
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  // If regular or staff user, verify account is still active in database
  if (session.role !== 'admin') {
    const user = await findUserById(session.userId);
    if (!user || !user.is_active) {
      // Clear cookie immediately
      const res = NextResponse.json(
        { authenticated: false, error: 'Account is deactivated' },
        { status: 401 }
      );
      res.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: '',
        httpOnly: SESSION_COOKIE_OPTIONS.httpOnly,
        secure: SESSION_COOKIE_OPTIONS.secure,
        sameSite: SESSION_COOKIE_OPTIONS.sameSite,
        path: '/',
        maxAge: 0,
      });
      return res;
    }
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      userId: session.userId,
      role: session.role,
      name: session.name,
    },
  });
}
