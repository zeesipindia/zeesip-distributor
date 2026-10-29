import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { updateUser, deleteUser, findUserById, findUserByPasswordLookup } from '@/lib/db';
import { verifySessionToken, computePasswordLookup, constantTimeCompare, SESSION_COOKIE_NAME } from '@/lib/auth';
import { SessionPayload } from '@/lib/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getAdminSession(request: NextRequest): Promise<SessionPayload | null> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await verifySessionToken(token);
  if (!session || (session.role !== 'admin' && session.role !== 'zeesip_admin')) {
    return null;
  }
  return session;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminSession = await getAdminSession(request);
  if (!adminSession) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  try {
    const { id } = await params;
    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }

    const existing = await findUserById(id);
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const updates: {
      name?: string;
      role?: 'distributor' | 'zeesip_staff' | 'zeesip_admin';
      is_active?: boolean;
      password_hash?: string;
      password_lookup?: string;
    } = {};

    // Prevent an admin from deactivating their own account
    if (body.is_active === false && adminSession.userId === id) {
      return NextResponse.json(
        { error: 'You cannot deactivate your own account.' },
        { status: 400 }
      );
    }

    if (body.name !== undefined) {
      const cleanName = String(body.name).trim();
      if (!cleanName || cleanName.length > 100) {
        return NextResponse.json({ error: 'Name must be between 1 and 100 characters' }, { status: 400 });
      }
      updates.name = cleanName;
    }

    if (body.role !== undefined) {
      if (!['distributor', 'zeesip_staff', 'zeesip_admin'].includes(body.role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }
      // Prevent an admin from demoting their own role
      if (adminSession.userId === id && body.role !== 'admin' && body.role !== 'zeesip_admin') {
        return NextResponse.json({ error: 'You cannot remove your own admin status.' }, { status: 400 });
      }
      updates.role = body.role;
    }

    if (body.is_active !== undefined) {
      updates.is_active = Boolean(body.is_active);
    }

    if (body.password !== undefined && body.password.trim() !== '') {
      const trimmed = String(body.password).trim();
      if (trimmed.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
      }
      if (trimmed.length > 128) {
        return NextResponse.json({ error: 'Password must not exceed 128 characters' }, { status: 400 });
      }

      // Check against master ADMIN_PASSWORD
      const adminPassword = (process.env.ADMIN_PASSWORD || '').trim();
      if (adminPassword && constantTimeCompare(trimmed, adminPassword)) {
        return NextResponse.json({ error: 'This password is already in use. Choose another.' }, { status: 400 });
      }

      // Check unique password across other users
      const lookup = computePasswordLookup(trimmed);
      const userWithSamePassword = await findUserByPasswordLookup(lookup);
      if (userWithSamePassword && userWithSamePassword.id !== id) {
        return NextResponse.json({ error: 'This password is already in use. Choose another.' }, { status: 400 });
      }

      const salt = await bcrypt.genSalt(10);
      updates.password_hash = await bcrypt.hash(trimmed, salt);
      updates.password_lookup = lookup;
    }

    const updated = await updateUser(id, updates);
    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminSession = await getAdminSession(request);
  if (!adminSession) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  try {
    const { id } = await params;
    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }

    // Prevent an admin from deleting their own account
    if (adminSession.userId === id) {
      return NextResponse.json(
        { error: 'You cannot delete your own account.' },
        { status: 400 }
      );
    }

    const existing = await findUserById(id);
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await deleteUser(id);
    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
