import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME, KERALA_DISTRICTS } from '@/lib/auth';
import { listLocationsByDistributor, createLocation, findUserById } from '@/lib/db';
import { SessionPayload } from '@/lib/types';

async function verifyDistributorAuth(request: NextRequest): Promise<
  { session: SessionPayload } | { error: string; status: number }
> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return { error: 'Unauthorized: Authentication required', status: 401 };
  }

  const session = await verifySessionToken(token);
  if (!session) {
    return { error: 'Unauthorized: Invalid session', status: 401 };
  }

  // Only distributor role allowed
  if (session.role !== 'distributor') {
    return { error: 'Forbidden: Distributor access only', status: 403 };
  }

  // Re-check is_active in DB
  const user = await findUserById(session.userId);
  if (!user || !user.is_active) {
    return { error: 'Forbidden: Account is inactive', status: 403 };
  }

  return { session };
}

export async function GET(request: NextRequest) {
  const auth = await verifyDistributorAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const district = searchParams.get('district') || undefined;

    // Filter strictly by session user id
    const locations = await listLocationsByDistributor(auth.session.userId, district);
    return NextResponse.json({ locations });
  } catch (error) {
    const errMsg = (error as Error).message || 'Failed to list locations';
    console.error('[LOCATIONS_GET_ERROR]', { message: errMsg });
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyDistributorAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { district, location, details } = body;

    // 1. Validate district against 14 Kerala districts
    if (!district || !KERALA_DISTRICTS.includes(district)) {
      return NextResponse.json({ error: 'Please select a valid Kerala district' }, { status: 400 });
    }

    // 2. Validate location
    const cleanLocation = String(location || '').trim();
    if (!cleanLocation || cleanLocation.length > 200) {
      return NextResponse.json(
        { error: 'Location is required and must not exceed 200 characters' },
        { status: 400 }
      );
    }

    // 3. Validate details (optional)
    const cleanDetails = details ? String(details).trim() : null;
    if (cleanDetails && cleanDetails.length > 500) {
      return NextResponse.json(
        { error: 'Details must not exceed 500 characters' },
        { status: 400 }
      );
    }

    // 4. Create location with server-enforced distributor_id
    const newLocation = await createLocation({
      distributor_id: auth.session.userId,
      district,
      location: cleanLocation,
      details: cleanDetails,
    });

    return NextResponse.json({ success: true, location: newLocation }, { status: 201 });
  } catch (error) {
    const errMsg = (error as Error).message || 'Failed to add location';
    console.error('[LOCATIONS_POST_ERROR]', { message: errMsg });
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
