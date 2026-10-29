import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { listUsers, createUser, findUserByPasswordLookup } from '@/lib/db';
import {
  verifySessionToken,
  computePasswordLookup,
  constantTimeCompare,
  encryptPassword,
  decryptPassword,
  SESSION_COOKIE_NAME,
} from '@/lib/auth';

async function checkAdminAuth(request: NextRequest): Promise<{ ok: true } | { error: string; status: number }> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return { error: 'Unauthorized: Authentication required', status: 401 };
  }
  const session = await verifySessionToken(token);
  if (!session) {
    return { error: 'Unauthorized: Invalid session', status: 401 };
  }
  if (session.role !== 'admin' && session.role !== 'zeesip_admin') {
    return { error: 'Forbidden: Admin privileges required', status: 403 };
  }
  return { ok: true };
}

export async function GET(request: NextRequest) {
  const authCheck = await checkAdminAuth(request);
  if ('error' in authCheck) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') ? searchParams.get('search')?.slice(0, 100) : undefined;
    const role = searchParams.get('role') || undefined;

    const validRoles = ['distributor', 'zeesip_staff', 'zeesip_admin'];
    const filteredRole = role && validRoles.includes(role) ? role : undefined;

    const rawUsers = await listUsers({ search, role: filteredRole });

    // Decrypt passwords strictly on the server for admin response only
    const users = rawUsers.map((u) => {
      const decrypted = u.password_enc ? decryptPassword(u.password_enc) : null;
      // Do not expose raw password_enc to client
      const { password_enc, ...cleanUser } = u;
      return {
        ...cleanUser,
        password: decrypted,
      };
    });

    return NextResponse.json({ users });
  } catch (error) {
    const errMsg = (error as Error).message || 'Failed to retrieve users';
    console.error('[ADMIN_LIST_USERS_ERROR]', { message: errMsg });
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authCheck = await checkAdminAuth(request);
  if ('error' in authCheck) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const body = await request.json();
    const { name, role, password } = body;

    const cleanName = String(name || '').trim();
    if (!cleanName || cleanName.length > 100) {
      return NextResponse.json({ error: 'Full name is required (max 100 characters)' }, { status: 400 });
    }

    if (!role || !['distributor', 'zeesip_staff', 'zeesip_admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid user type' }, { status: 400 });
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    const trimmedPassword = password.trim();
    if (trimmedPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
    }
    if (trimmedPassword.length > 128) {
      return NextResponse.json({ error: 'Password must not exceed 128 characters' }, { status: 400 });
    }

    // Check against master ADMIN_PASSWORD
    const adminPassword = (process.env.ADMIN_PASSWORD || '').trim();
    if (adminPassword && constantTimeCompare(trimmedPassword, adminPassword)) {
      return NextResponse.json(
        { error: 'This password is already in use. Choose another.' },
        { status: 400 }
      );
    }

    // Check unique password across all users via HMAC lookup
    const password_lookup = computePasswordLookup(trimmedPassword);
    const existing = await findUserByPasswordLookup(password_lookup);
    if (existing) {
      return NextResponse.json(
        { error: 'This password is already in use. Choose another.' },
        { status: 400 }
      );
    }

    // 1. Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(trimmedPassword, salt);

    // 2. Encrypt password with AES-256-GCM
    const password_enc = encryptPassword(trimmedPassword);

    const newUser = await createUser({
      name: cleanName,
      role,
      password_hash,
      password_lookup,
      password_enc,
    });

    return NextResponse.json({
      success: true,
      user: {
        ...newUser,
        password: trimmedPassword,
      },
    }, { status: 201 });
  } catch (error) {
    const errMsg = (error as Error).message || 'Failed to create user';
    console.error('[ADMIN_CREATE_USER_ERROR]', { message: errMsg });
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
