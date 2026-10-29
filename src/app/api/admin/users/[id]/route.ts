import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { updateUser, deleteUser, findUserById, findUserByPasswordLookup } from '@/lib/db';
import { verifySessionToken, computePasswordLookup, constantTimeCompare, SESSION_COOKIE_NAME } from '@/lib/auth';

async function verifyAdminAuth(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return false;
  const session = await verifySessionToken(token);
  return session?.role === 'admin' || session?.role === 'zeesip_admin';
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdminAuth(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
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

    if (body.name !== undefined) {
      if (!body.name.trim()) {
        return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
      }
      updates.name = body.name.trim();
    }

    if (body.role !== undefined) {
      if (!['distributor', 'zeesip_staff', 'zeesip_admin'].includes(body.role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }
      updates.role = body.role;
    }

    if (body.is_active !== undefined) {
      updates.is_active = Boolean(body.is_active);
    }

    if (body.password !== undefined && body.password.trim() !== '') {
      const trimmed = body.password.trim();
      if (trimmed.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
      }

      // Check against ADMIN_PASSWORD
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
  if (!(await verifyAdminAuth(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
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
