import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { findUserById, listLocationsByDistributor, getDistributorDeliveryStats } from '@/lib/db';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ distributorId: string }> }
) {
  const auth = await checkAdminAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { distributorId } = await params;
    if (!distributorId || !UUID_REGEX.test(distributorId)) {
      return NextResponse.json({ error: 'Invalid distributor ID format' }, { status: 400 });
    }

    // Verify user exists and is a distributor
    const user = await findUserById(distributorId);
    if (!user || user.role !== 'distributor') {
      return NextResponse.json({ error: 'Distributor not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const district = searchParams.get('district') || undefined;

    const [locations, stats] = await Promise.all([
      listLocationsByDistributor(distributorId, district),
      getDistributorDeliveryStats(distributorId),
    ]);

    return NextResponse.json({
      distributor: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
      stats,
      locations,
    });
  } catch (error) {
    const errMsg = (error as Error).message || 'Failed to retrieve delivery records';
    console.error('[ADMIN_DISTRIBUTOR_LOCATIONS_ERROR]', { message: errMsg });
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
