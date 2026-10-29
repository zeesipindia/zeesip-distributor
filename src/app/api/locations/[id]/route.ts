import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { deleteLocation, findUserById } from '@/lib/db';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }

  const session = await verifySessionToken(token);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Invalid session' }, { status: 401 });
  }

  if (session.role !== 'distributor') {
    return NextResponse.json({ error: 'Forbidden: Distributor access only' }, { status: 403 });
  }

  // Re-check is_active in DB
  const user = await findUserById(session.userId);
  if (!user || !user.is_active) {
    return NextResponse.json({ error: 'Forbidden: Account is inactive' }, { status: 403 });
  }

  try {
    const { id } = await params;
    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Invalid location ID' }, { status: 400 });
    }

    // Delete ONLY if it matches the session user id
    const deleted = await deleteLocation(id, session.userId);
    if (!deleted) {
      return NextResponse.json({ error: 'Location not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Location deleted' });
  } catch (error) {
    const errMsg = (error as Error).message || 'Failed to delete location';
    console.error('[LOCATIONS_DELETE_ERROR]', { message: errMsg });
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
