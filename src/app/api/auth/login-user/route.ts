import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { findUserByUsername } from '@/lib/db';
import { signSessionToken, SESSION_COOKIE_OPTIONS } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    // 1. Fetch user from Supabase portal_users table
    const user = await findUserByUsername(username);

    if (!user) {
      // Return generic invalid credentials message to prevent user enumeration
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // 2. Reject if inactive
    if (!user.is_active) {
      return NextResponse.json(
        { error: 'Your account is currently deactivated. Please contact your Zee Sip administrator.' },
        { status: 403 }
      );
    }

    // 3. Verify password hash using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // 4. Generate signed session token with role & user id
    const token = await signSessionToken({
      userId: user.id,
      role: user.role,
      name: user.name,
      username: user.username,
    });

    const response = NextResponse.json({
      success: true,
      role: user.role,
      name: user.name,
      redirect: '/dashboard',
    });

    // 5. Set session cookie
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
    console.error('User login error:', error);
    return NextResponse.json({ error: 'Authentication failed. Please verify database connection.' }, { status: 500 });
  }
}
