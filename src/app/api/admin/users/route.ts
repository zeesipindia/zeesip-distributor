import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { listUsers, createUser, findUserByPasswordLookup } from '@/lib/db';
import { verifySessionToken, computePasswordLookup, constantTimeCompare, SESSION_COOKIE_NAME } from '@/lib/auth';

async function verifyAdminAuth(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return false;
  const session = await verifySessionToken(token);
  return session?.role === 'admin' || session?.role === 'zeesip_admin';
}

export async function GET(request: NextRequest) {
  if (!(await verifyAdminAuth(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const role = searchParams.get('role') || undefined;

    const users = await listUsers({ search, role });
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error listing users:', error);
    return NextResponse.json({ error: 'Failed to retrieve users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdminAuth(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, role, password } = body;

    // Validate inputs
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    }
    if (!role || !['distributor', 'zeesip_staff', 'zeesip_admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid user type' }, { status: 400 });
    }
    if (!password || typeof password !== 'string' || password.trim().length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
    }

    const trimmedPassword = password.trim();

    // Check against ADMIN_PASSWORD
    const adminPassword = (process.env.ADMIN_PASSWORD || '').trim();
    if (adminPassword && constantTimeCompare(trimmedPassword, adminPassword)) {
      return NextResponse.json(
        { error: 'This password is already in use. Choose another.' },
        { status: 400 }
      );
    }

    // Check unique password across all users via password_lookup
    const password_lookup = computePasswordLookup(trimmedPassword);
    const existing = await findUserByPasswordLookup(password_lookup);
    if (existing) {
      return NextResponse.json(
        { error: 'This password is already in use. Choose another.' },
        { status: 400 }
      );
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(trimmedPassword, salt);

    const newUser = await createUser({
      name: name.trim(),
      role,
      password_hash,
      password_lookup,
    });

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
